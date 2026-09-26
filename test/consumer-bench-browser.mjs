// 测量驱动，不实现动画语义；所有计划、采样、批次与绘制均调用消费者 Calcit 入口。
export async function measureConsumerFrames(options) {
  const app = await import("/target/js/app/app.main.mjs");
  const core = await import("/target/js/app/calcit.core.mjs");
  const tags = core.init_tags(["declarations", "plan-builds", "binding-samples"]);
  const canvas = document.createElement("canvas");
  canvas.width = 320; canvas.height = 180;
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "320px", height: "180px", zIndex: "100" });
  document.body.append(canvas);
  let device, host, adapterInfo = null, context;
  const gpu = options.backend !== "canvas";
  const counters = { buffers: 0, pipelines: 0, liveBuffers: 0, writeCalls: 0, recordBytes: 0, parameterBytes: 0, uniformBytes: 0, submits: 0, writeMs: 0, submitMs: 0 };
  const errors = [];
  const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const before = performance.now();
  let plan = app.start_dual(0, 40, false, 100), batch, program;
  const declarationMs = performance.now() - before;
  const initStart = performance.now();
  try {
    if (gpu) {
      const adapter = await navigator.gpu?.requestAdapter();
      if (!adapter) return { result: "SKIP", backend: options.backend, reason: "adapter-unavailable" };
      const info = adapter.info;
      adapterInfo = { vendor: info.vendor, architecture: info.architecture, device: info.device, description: info.description };
      if (info.isFallbackAdapter || adapter.isFallbackAdapter || /software|swiftshader|llvmpipe/i.test(Object.values(adapterInfo).join(" "))) {
        return { result: "SKIP", backend: options.backend, reason: "software-adapter", adapter: adapterInfo };
      }
      device = await adapter.requestDevice();
      device.addEventListener("uncapturederror", e => errors.push(e.error.message));
      device.pushErrorScope("validation");
      const createBuffer = device.createBuffer.bind(device);
      device.createBuffer = spec => {
        const buffer = createBuffer(spec), destroy = buffer.destroy.bind(buffer);
        counters.buffers++; counters.liveBuffers++;
        let dead = false;
        buffer.destroy = () => { if (!dead) { counters.liveBuffers--; dead = true; } return destroy(); };
        return buffer;
      };
      const createPipeline = device.createRenderPipeline.bind(device);
      device.createRenderPipeline = spec => { counters.pipelines++; return createPipeline(spec); };
      const write = device.queue.writeBuffer.bind(device.queue), submit = device.queue.submit.bind(device.queue);
      device.queue.writeBuffer = (buffer, offset, data, dataOffset, size) => {
        const started = performance.now();
        const result = write(buffer, offset, data, dataOffset, size);
        counters.writeMs += performance.now() - started;
        counters.writeCalls++;
        const unit = data.BYTES_PER_ELEMENT || 1;
        const bytes = size === undefined ? data.byteLength - (dataOffset || 0) * unit : size * unit;
        const key = buffer.label === "Quamolit component records" ? "recordBytes"
          : buffer.label === "Quamolit scalar parameters" ? "parameterBytes" : "uniformBytes";
        counters[key] += bytes;
        return result;
      };
      device.queue.submit = commands => {
        const started = performance.now(), result = submit(commands);
        counters.submitMs += performance.now() - started; counters.submits++;
        return result;
      };
      const format = navigator.gpu.getPreferredCanvasFormat();
      if (options.backend === "gpu-scalar") {
        const prepared = app.prepare_gpu(plan);
        if (prepared.tag.value !== "ready") throw Error(`scalar fallback: ${prepared.extra[0]}`);
        program = prepared.extra[0];
        host = app.create_gpu_$x_(canvas, device, format, 2);
      } else {
        batch = app.build_batch(plan);
        host = app.create_batch_gpu_$x_(canvas, device, format, 2);
      }
    } else context = canvas.getContext("2d", { alpha: true });
    const rendererSetupMs = performance.now() - initStart;
    const coldStart = performance.now();
    if (options.backend === "gpu-scalar") app.install_gpu_$x_(host, program);
    else if (gpu) app.submit_batch_$x_(host, batch);
    else drawCanvas();
    const firstDrawMs = performance.now() - coldStart, coldCounters = { ...counters };

    function drawCanvas() {
      app.draw_$x_(context, plan);
      context.save(); context.globalCompositeOperation = "destination-over";
      context.fillStyle = "white"; context.fillRect(0, 0, 320, 180); context.restore();
    }
    function draw(time) {
      const previous = { ...counters }, started = performance.now();
      let sampled = started, batched = started;
      if (options.backend !== "gpu-scalar") {
        plan = app.update_dual(plan, time, 40, false, 100);
        sampled = performance.now();
        if (gpu) batch = app.update_batch(batch, plan);
        batched = performance.now();
      }
      if (options.backend === "gpu-scalar") app.draw_gpu_$x_(host, program, time);
      else if (gpu) app.submit_batch_$x_(host, batch);
      else drawCanvas();
      const ended = performance.now();
      const delta = Object.fromEntries(Object.entries(counters).map(([k, v]) => [k, v - previous[k]]));
      return { time, cpuFrameMs: ended - started, samplePlanMs: sampled - started,
        batchMs: batched - sampled, drawBoundaryMs: ended - batched,
        // drawBoundary 包含 Calcit 验证/打包/原生命令编码；不能冒充纯 GPU 执行时间。
        queueWriteMs: gpu ? delta.writeMs : null, queueSubmitMs: gpu ? delta.submitMs : null,
        recordBytes: gpu ? delta.recordBytes : null, parameterBytes: gpu ? delta.parameterBytes : null,
        uniformBytes: gpu ? delta.uniformBytes : null, submits: gpu ? delta.submits : null,
        newBuffers: delta.buffers, newPipelines: delta.pipelines, liveBuffers: counters.liveBuffers };
    }
    const calibration = [];
    for (let i = 0; i < 31; i++) calibration.push(await frame());
    const intervals = calibration.slice(1).map((t, i) => t - calibration[i]).sort((a, b) => a - b);
    const idleRafMedianMs = (intervals[14] + intervals[15]) / 2;
    async function phase(seconds, collect) {
      const started = performance.now(), samples = [];
      let count = 0, previous = null;
      while (performance.now() - started < seconds * 1000) {
        const timestamp = await frame();
        if (document.visibilityState !== "visible") throw Error("benchmark page became hidden");
        // 同样的确定性三角时间序列；不按每条路径的运行速度改变动画输入。
        const time = Math.abs((count % 120) / 60 - 1);
        const result = draw(time);
        if (collect) samples.push({ index: count, rafIntervalMs: previous === null ? null : timestamp - previous, ...result });
        previous = timestamp; count++;
      }
      return { frames: count, elapsedMs: performance.now() - started, samples };
    }
    const warmup = await phase(options.warmupSeconds, false);
    const measure = await phase(options.durationSeconds, true);
    if (measure.samples.length < 2) throw Error("benchmark requires two measured frames");
    draw(0.5);
    // 仅在测量结束后读回固定帧，排除截图/诊断成本。
    const bitmap = await createImageBitmap(canvas), reference = document.createElement("canvas");
    reference.width = 320; reference.height = 180;
    const pixels = reference.getContext("2d"); pixels.drawImage(bitmap, 0, 0); bitmap.close();
    let checksum = 0x811c9dc5;
    for (const byte of pixels.getImageData(0, 0, 320, 180).data) checksum = Math.imul(checksum ^ byte, 0x01000193) >>> 0;
    if (device) await device.queue.onSubmittedWorkDone();
    return { result: "PASS", backend: options.backend, adapter: adapterInfo, declarationMs, rendererSetupMs, firstDrawMs,
      idleRafMedianMs, coldCounters, warmup, measure, checksum, checksumTime: 0.5,
      pixelSize: [canvas.width, canvas.height], devicePixelRatio, errors,
      planCounts: Object.fromEntries(["declarations", "plan-builds", "binding-samples"].map(key => [key, plan.get(tags[key])])),
      beforeDispose: { ...counters }, afterDispose: counters };
  } finally {
    if (host) app.dispose_gpu_$x_(host);
    if (device) {
      const error = await device.popErrorScope();
      if (error) errors.push(error.message);
      device.destroy();
    }
    canvas.remove();
  }
}
