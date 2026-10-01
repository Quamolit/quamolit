// 测量驱动，不实现动画语义；所有计划、采样、批次与绘制均调用消费者 Calcit 入口。
export async function measureConsumerFrames(options) {
  const app = await import("/target/js/app/app.main.mjs");
  const core = await import("/target/js/app/calcit.core.mjs");
  const tags = core.init_tags(["declarations", "plan-builds", "binding-samples"]);
  const independent = options.workload === "independent-10k";
  const [width, height] = options.pixelSize || [320, 180];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: `${width}px`,
    height: `${height}px`,
    zIndex: "100",
  });
  document.body.append(canvas);
  let device,
    host,
    adapterInfo = null,
    context;
  const gpu = options.backend !== "canvas";
  const counters = {
    buffers: 0,
    pipelines: 0,
    liveBuffers: 0,
    writeCalls: 0,
    recordBytes: 0,
    parameterBytes: 0,
    uniformBytes: 0,
    submits: 0,
    drawCalls: 0,
    writeMs: 0,
    submitMs: 0,
  };
  const errors = [];
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const before = performance.now();
  let plan = independent ? null : app.start_dual(0, 40, false, 100),
    batch,
    program,
    table,
    positions,
    version = 0,
    previousGpuVersion = -1,
    positionTime = null;
  const motions = independent ? app.independent_instance_motions() : null;
  const sourceCount = independent ? core.to_js_data(app.instances_declaration()).source.count : 2;
  if (independent && options.backend !== "gpu-scalar") table = app.create_instances_table_$x_();
  const declarationMs = performance.now() - before;
  const initStart = performance.now();
  try {
    if (gpu) {
      const adapter = await navigator.gpu?.requestAdapter();
      if (!adapter) return { result: "SKIP", backend: options.backend, reason: "adapter-unavailable" };
      const info = adapter.info;
      adapterInfo = {
        vendor: info.vendor,
        architecture: info.architecture,
        device: info.device,
        description: info.description,
      };
      if (
        info.isFallbackAdapter ||
        adapter.isFallbackAdapter ||
        /software|swiftshader|llvmpipe/i.test(Object.values(adapterInfo).join(" "))
      ) {
        return { result: "SKIP", backend: options.backend, reason: "software-adapter", adapter: adapterInfo };
      }
      device = await adapter.requestDevice();
      device.addEventListener("uncapturederror", (e) => errors.push(e.error.message));
      device.pushErrorScope("validation");
      const createBuffer = device.createBuffer.bind(device);
      device.createBuffer = (spec) => {
        const buffer = createBuffer(spec),
          destroy = buffer.destroy.bind(buffer);
        counters.buffers++;
        counters.liveBuffers++;
        let dead = false;
        buffer.destroy = () => {
          if (!dead) {
            counters.liveBuffers--;
            dead = true;
          }
          return destroy();
        };
        return buffer;
      };
      const createPipeline = device.createRenderPipeline.bind(device);
      device.createRenderPipeline = (spec) => {
        counters.pipelines++;
        return createPipeline(spec);
      };
      const createPipelineAsync = device.createRenderPipelineAsync.bind(device);
      device.createRenderPipelineAsync = async (spec) => {
        const pipeline = await createPipelineAsync(spec);
        counters.pipelines++;
        return pipeline;
      };
      const write = device.queue.writeBuffer.bind(device.queue),
        submit = device.queue.submit.bind(device.queue);
      device.queue.writeBuffer = (buffer, offset, data, dataOffset, size) => {
        const started = performance.now();
        const result = write(buffer, offset, data, dataOffset, size);
        counters.writeMs += performance.now() - started;
        counters.writeCalls++;
        const unit = data.BYTES_PER_ELEMENT || 1;
        const bytes = size === undefined ? data.byteLength - (dataOffset || 0) * unit : size * unit;
        const key = ["Quamolit component records", "Quamolit rectangle positions"].includes(buffer.label)
          ? "recordBytes"
          : buffer.label === "Quamolit scalar parameters"
            ? "parameterBytes"
            : "uniformBytes";
        counters[key] += bytes;
        return result;
      };
      device.queue.submit = (commands) => {
        const started = performance.now(),
          result = submit(commands);
        counters.submitMs += performance.now() - started;
        counters.submits++;
        return result;
      };
      const createEncoder = device.createCommandEncoder.bind(device);
      device.createCommandEncoder = (...args) => {
        const encoder = createEncoder(...args),
          begin = encoder.beginRenderPass.bind(encoder);
        encoder.beginRenderPass = (...passArgs) => {
          const pass = begin(...passArgs),
            draw = pass.draw.bind(pass);
          pass.draw = (...drawArgs) => {
            counters.drawCalls++;
            return draw(...drawArgs);
          };
          return pass;
        };
        return encoder;
      };
      const format = navigator.gpu.getPreferredCanvasFormat();
      if (options.backend === "gpu-scalar") {
        const prepared = independent ? app.prepare_independent_gpu(motions, 0) : app.prepare_gpu(plan);
        if (prepared.tag.value !== "ready") throw Error(`scalar fallback: ${prepared.extra[0]}`);
        program = prepared.extra[0];
        host = app.create_gpu_$x_(canvas, device, format, sourceCount);
      } else if (independent) {
        host = await app.create_instances_gpu_$x_(canvas, device, format);
      } else {
        batch = app.build_batch(plan);
        host = app.create_batch_gpu_$x_(canvas, device, format, 2);
      }
    } else context = canvas.getContext("2d", { alpha: true });
    const rendererSetupMs = performance.now() - initStart;
    const coldStart = performance.now();
    if (independent) {
      if (options.backend === "gpu-scalar") app.install_independent_gpu_$x_(host, program, 0);
      else {
        samplePositions(0);
        registerPositions();
        drawInstances();
      }
    } else if (options.backend === "gpu-scalar") app.install_gpu_$x_(host, program);
    else if (gpu) app.submit_batch_$x_(host, batch);
    else drawCanvas();
    const firstDrawMs = performance.now() - coldStart,
      coldCounters = { ...counters };

    function drawCanvas() {
      app.draw_$x_(context, plan);
      context.save();
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = "white";
      context.fillRect(0, 0, width, height);
      context.restore();
    }
    function samplePositions(time) {
      if (time === positionTime) return;
      positions = new Float32Array(core.to_js_data(app.independent_instance_positions(motions, time)));
      positionTime = time;
    }
    function drawInstances() {
      if (gpu) {
        app.draw_instances_gpu_$x_(previousGpuVersion, host, table, version);
        previousGpuVersion = version;
      } else {
        context.fillStyle = "white";
        context.fillRect(0, 0, width, height);
        const metrics = core.to_js_data(app.draw_resolved_instances_$x_(context, table, version));
        counters.drawCalls += metrics["canvas-calls"];
      }
    }
    function registerPositions() {
      const previous = version;
      app.register_instances_version_$x_(table, ++version, positions);
      if (previous) app.release_instances_$x_(table, previous);
    }
    function draw(time) {
      const previous = { ...counters },
        started = performance.now();
      let sampled = started,
        batched = started,
        positionSnapshotBytes = 0;
      if (independent && options.backend !== "gpu-scalar") {
        const changed = positionTime !== time;
        samplePositions(time);
        positionSnapshotBytes = changed ? positions.byteLength : 0;
        sampled = performance.now();
        if (changed) registerPositions();
        batched = performance.now();
      } else if (options.backend !== "gpu-scalar") {
        plan = app.update_dual(plan, time, 40, false, 100);
        sampled = performance.now();
        if (gpu) batch = app.update_batch(batch, plan);
        batched = performance.now();
      }
      if (independent) {
        if (options.backend === "gpu-scalar") app.draw_independent_gpu_$x_(host, program, time);
        else drawInstances();
      } else if (options.backend === "gpu-scalar") app.draw_gpu_$x_(host, program, time);
      else if (gpu) app.submit_batch_$x_(host, batch);
      else drawCanvas();
      const ended = performance.now();
      const delta = Object.fromEntries(Object.entries(counters).map(([k, v]) => [k, v - previous[k]]));
      return {
        time,
        cpuFrameMs: ended - started,
        samplePlanMs: sampled - started,
        batchMs: batched - sampled,
        drawBoundaryMs: ended - batched,
        // drawBoundary 包含 Calcit 验证/打包/原生命令编码；不能冒充纯 GPU 执行时间。
        queueWriteMs: gpu ? delta.writeMs : null,
        queueSubmitMs: gpu ? delta.submitMs : null,
        recordBytes: gpu ? delta.recordBytes : null,
        parameterBytes: gpu ? delta.parameterBytes : null,
        uniformBytes: gpu ? delta.uniformBytes : null,
        submits: gpu ? delta.submits : null,
        drawCalls: delta.drawCalls,
        positionSnapshotBytes,
        newBuffers: delta.buffers,
        newPipelines: delta.pipelines,
        liveBuffers: counters.liveBuffers,
      };
    }
    const calibration = [];
    for (let i = 0; i < 31; i++) calibration.push(await frame());
    const intervals = calibration
      .slice(1)
      .map((t, i) => t - calibration[i])
      .sort((a, b) => a - b);
    const idleRafMedianMs = (intervals[14] + intervals[15]) / 2;
    async function phase(seconds, collect) {
      const started = performance.now(),
        samples = [];
      let count = 0,
        previous = null;
      while (performance.now() - started < seconds * 1000) {
        const timestamp = await frame();
        if (document.visibilityState !== "visible") throw Error("benchmark page became hidden");
        // 同样的确定性三角时间序列；不按每条路径的运行速度改变动画输入。
        const time = Math.abs((count % 120) / 60 - 1);
        const result = draw(time);
        if (collect)
          samples.push({ index: count, rafIntervalMs: previous === null ? null : timestamp - previous, ...result });
        previous = timestamp;
        count++;
      }
      return { frames: count, elapsedMs: performance.now() - started, samples };
    }
    const warmup = await phase(options.warmupSeconds, false);
    const measure = await phase(options.durationSeconds, true);
    if (measure.samples.length < 2) throw Error("benchmark requires two measured frames");
    if (independent) draw(0);
    const byteProbes = independent ? [draw(1), draw(1), draw(0)] : null;
    const checksumTime = independent ? 1 : 0.5;
    draw(checksumTime);
    // 仅在测量结束后读回固定帧，排除截图/诊断成本。
    const bitmap = await createImageBitmap(canvas),
      reference = document.createElement("canvas");
    reference.width = width;
    reference.height = height;
    const pixels = reference.getContext("2d");
    pixels.drawImage(bitmap, 0, 0);
    bitmap.close();
    let checksum = 0x811c9dc5;
    const image = pixels.getImageData(0, 0, width, height);
    let coveredPixels = 0;
    for (let i = 0; i < image.data.length; i += 4)
      coveredPixels += image.data[i] !== 255 || image.data[i + 1] !== 255 || image.data[i + 2] !== 255;
    for (const byte of image.data) checksum = Math.imul(checksum ^ byte, 0x01000193) >>> 0;
    if (device) await device.queue.onSubmittedWorkDone();
    counters.liveVersions = table ? app.instances_live_count(table) : 0;
    return {
      result: "PASS",
      backend: options.backend,
      workload: options.workload || "dual",
      sourceCount,
      coveredPixels,
      byteProbes,
      adapter: adapterInfo,
      declarationMs,
      rendererSetupMs,
      firstDrawMs,
      idleRafMedianMs,
      coldCounters,
      warmup,
      measure,
      checksum,
      checksumTime,
      pixelSize: [canvas.width, canvas.height],
      devicePixelRatio,
      errors,
      planCounts: independent
        ? null
        : Object.fromEntries(
            ["declarations", "plan-builds", "binding-samples"].map((key) => [key, plan.get(tags[key])]),
          ),
      beforeDispose: { ...counters },
      afterDispose: counters,
    };
  } finally {
    if (host) {
      if (independent && options.backend === "gpu-cpu") app.dispose_instances_gpu_$x_(host);
      else app.dispose_gpu_$x_(host);
    }
    if (table && version) app.release_instances_$x_(table, version);
    counters.liveVersions = table ? app.instances_live_count(table) : 0;
    if (device) {
      const error = await device.popErrorScope();
      if (error) errors.push(error.message);
      device.destroy();
    }
    canvas.remove();
  }
}

// 单独的静态密集实例负载；绝不和上面的两图元 Canvas/GPU 同源比较混算。
export async function measureConsumerInstancesFrames(options) {
  const app = await import("/target/js/app/app.main.mjs");
  const core = await import("/target/js/app/calcit.core.mjs");
  const { createInstancePositions } = await import("/instances-input.mjs");
  const declaration = core.to_js_data(app.instances_declaration());
  const positions = createInstancePositions(declaration.source.count);
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  document.body.append(canvas);
  const context = canvas.getContext("2d", { alpha: true });
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  function draw() {
    context.clearRect(0, 0, 320, 180);
    return core.to_js_data(app.draw_instances_$x_(context, positions));
  }
  try {
    const firstDrawStart = performance.now();
    const firstMetrics = draw();
    const firstDrawMs = performance.now() - firstDrawStart;
    const calibration = [];
    for (let i = 0; i < 31; i++) calibration.push(await frame());
    const intervals = calibration
      .slice(1)
      .map((t, i) => t - calibration[i])
      .sort((a, b) => a - b);
    const idleRafMedianMs = (intervals[14] + intervals[15]) / 2;
    async function phase(seconds, collect) {
      const started = performance.now(),
        samples = [];
      let frames = 0,
        previous = null;
      while (performance.now() - started < seconds * 1000) {
        const timestamp = await frame();
        if (document.visibilityState !== "visible") throw Error("benchmark page became hidden");
        const drawStart = performance.now(),
          metrics = draw(),
          cpuFrameMs = performance.now() - drawStart;
        if (collect)
          samples.push({
            index: frames,
            cpuFrameMs,
            rafIntervalMs: previous === null ? null : timestamp - previous,
            metrics,
          });
        previous = timestamp;
        frames++;
      }
      return { frames, elapsedMs: performance.now() - started, samples };
    }
    const warmup = await phase(options.warmupSeconds, false);
    const measure = await phase(options.durationSeconds, true);
    if (measure.samples.length < 2) throw Error("instances benchmark requires two measured frames");
    const pixels = context.getImageData(0, 0, 320, 180).data;
    let checksum = 0x811c9dc5;
    for (const byte of pixels) checksum = Math.imul(checksum ^ byte, 0x01000193) >>> 0;
    return {
      result: "PASS",
      backend: "canvas-instances",
      sourceCount: declaration.source.count,
      inputBytes: positions.byteLength,
      firstDrawMs,
      firstMetrics,
      idleRafMedianMs,
      warmup,
      measure,
      checksum,
      pixelSize: [320, 180],
      devicePixelRatio,
    };
  } finally {
    canvas.remove();
  }
}

// 同一个 Calcit 帧函数和版本化源，分别进入 Canvas 全量参考与 GPU 8 B 补丁路径。
export async function measureConsumerDynamicInstancesFrames(options) {
  const app = await import("/target/js/app/app.main.mjs");
  const core = await import("/target/js/app/calcit.core.mjs");
  const { createInstancePositions } = await import("/instances-input.mjs");
  const gpu = options.backend === "gpu-instances-dynamic";
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  document.body.append(canvas);
  const positions = createInstancePositions(10000);
  const table = app.create_instances_table_$x_();
  app.register_instances_$x_(table, positions);
  let device,
    batch,
    adapterInfo = null,
    context,
    version = 1,
    previousTime = 0,
    previousGpuVersion = -1,
    stepIndex = 0;
  const errors = [];
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  try {
    if (gpu) {
      const adapter = await navigator.gpu?.requestAdapter();
      if (!adapter) return { result: "SKIP", backend: options.backend, reason: "adapter-unavailable" };
      const info = adapter.info ?? {};
      adapterInfo = {
        vendor: info.vendor,
        architecture: info.architecture,
        device: info.device,
        description: info.description,
        isFallbackAdapter: Boolean(info.isFallbackAdapter || adapter.isFallbackAdapter),
      };
      if (
        adapterInfo.isFallbackAdapter ||
        /software|swiftshader|llvmpipe/i.test(Object.values(adapterInfo).join(" "))
      ) {
        return { result: "SKIP", backend: options.backend, reason: "software-adapter", adapter: adapterInfo };
      }
      device = await adapter.requestDevice();
      device.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
      device.pushErrorScope("validation");
      batch = await app.create_instances_gpu_$x_(canvas, device, navigator.gpu.getPreferredCanvasFormat());
    } else context = canvas.getContext("2d", { alpha: true });
    function draw(time) {
      const started = performance.now();
      const sampled = app.instance_frame_at(time);
      const values = core.to_js_data(sampled);
      const sampleMs = performance.now() - started;
      let copiedBytes = 0;
      if (time !== previousTime) {
        copiedBytes = app.patch_instances_$x_(
          table,
          version,
          version + 1,
          sampled,
          new Float32Array([values.x, values.y]),
        );
        app.release_instances_$x_(table, version);
        version++;
        previousTime = time;
      }
      const patchMs = performance.now() - started - sampleMs;
      let metrics;
      if (gpu) {
        metrics = core.to_js_data(app.draw_instances_gpu_$x_(previousGpuVersion, batch, table, version));
        previousGpuVersion = version;
      } else {
        context.fillStyle = "white";
        context.fillRect(0, 0, 320, 180);
        metrics = core.to_js_data(app.draw_resolved_instances_$x_(context, table, version));
      }
      const ended = performance.now();
      return {
        time,
        cpuFrameMs: ended - started,
        sampleMs,
        patchMs,
        drawBoundaryMs: ended - started - sampleMs - patchMs,
        copiedBytes,
        uploadBytes: gpu ? metrics["upload-bytes"] : null,
        drawCalls: gpu ? metrics["draw-calls"] : metrics["canvas-calls"],
        live: app.instances_live_count(table),
        version,
      };
    }
    const coldStart = performance.now(),
      cold = draw(0),
      firstDrawMs = performance.now() - coldStart;
    const calibration = [];
    for (let i = 0; i < 31; i++) calibration.push(await frame());
    const intervals = calibration
      .slice(1)
      .map((time, index) => time - calibration[index])
      .sort((a, b) => a - b);
    const idleRafMedianMs = (intervals[14] + intervals[15]) / 2;
    async function phase(seconds, collect) {
      const started = performance.now(),
        samples = [];
      let frames = 0,
        previous = null;
      while (performance.now() - started < seconds * 1000) {
        const timestamp = await frame();
        if (document.visibilityState !== "visible") throw Error("dynamic instances benchmark page became hidden");
        const time = Math.abs((stepIndex++ % 120) / 60 - 1);
        const result = draw(time);
        if (collect)
          samples.push({ index: frames, rafIntervalMs: previous === null ? null : timestamp - previous, ...result });
        previous = timestamp;
        frames++;
      }
      return { frames, elapsedMs: performance.now() - started, samples };
    }
    const warmup = await phase(options.warmupSeconds, false);
    const measure = await phase(options.durationSeconds, true);
    if (measure.samples.length < 2) throw Error("dynamic instances benchmark requires two measured frames");
    draw(1);
    const reference = document.createElement("canvas");
    reference.width = 320;
    reference.height = 180;
    const pixels = reference.getContext("2d", { alpha: true });
    const bitmap = await createImageBitmap(canvas);
    pixels.drawImage(bitmap, 0, 0);
    bitmap.close();
    if (device) await device.queue.onSubmittedWorkDone();
    let checksum = 0x811c9dc5;
    for (const byte of pixels.getImageData(0, 0, 320, 180).data)
      checksum = Math.imul(checksum ^ byte, 0x01000193) >>> 0;
    const pixelSamples = [
      [1, 1],
      [9, 11],
      [108, 90],
      [319, 179],
    ].map(([x, y]) => Array.from(pixels.getImageData(x, y, 1, 1).data));
    return {
      result: "PASS",
      backend: options.backend,
      adapter: adapterInfo,
      sourceCount: 10000,
      inputBytes: positions.byteLength,
      firstDrawMs,
      cold,
      idleRafMedianMs,
      warmup,
      measure,
      checksum,
      checksumTime: 1,
      pixelSamples,
      pixelSize: [320, 180],
      devicePixelRatio,
      errors,
      liveBeforeDispose: app.instances_live_count(table),
    };
  } finally {
    if (batch) app.dispose_instances_gpu_$x_(batch);
    if (device) {
      const error = await device.popErrorScope();
      if (error) errors.push(error.message);
      device.destroy();
    }
    app.release_instances_$x_(table, version);
    canvas.remove();
  }
}
