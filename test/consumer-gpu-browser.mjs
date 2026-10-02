import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readScalarSample } from "./host/gpu-scalar-readback.mjs";

export async function verifyIndependentGpuConsumerBrowser(page, artifacts) {
  await page.addScriptTag({ content: `globalThis.__quamolitScalarProbe = ${readScalarSample.toString()}` });
  const report = await page.evaluate(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return { result: "SKIP", reason: "adapter-unavailable" };
    const identity = {
      vendor: adapter.info?.vendor,
      architecture: adapter.info?.architecture,
      description: adapter.info?.description,
    };
    if (
      adapter.info?.isFallbackAdapter ||
      adapter.isFallbackAdapter ||
      /swiftshader|software|llvmpipe/i.test(Object.values(identity).join(" "))
    )
      return { result: "SKIP", reason: "software-adapter", adapter: identity };
    const app = await import("/target/js/app/app.main.mjs"),
      core = await import("/target/js/app/calcit.core.mjs"),
      device = await adapter.requestDevice(),
      canvas = document.createElement("canvas"),
      cpuCanvas = document.createElement("canvas"),
      reference = document.createElement("canvas"),
      captured = document.createElement("canvas"),
      capturedCpu = document.createElement("canvas"),
      diff = document.createElement("canvas");
    for (const target of [canvas, cpuCanvas, reference, captured, capturedCpu, diff]) {
      target.width = 320;
      target.height = 180;
    }
    const capture = async (source, target) => {
      const bitmap = await createImageBitmap(source);
      target.getContext("2d").drawImage(bitmap, 0, 0);
      bitmap.close();
      return target.getContext("2d").getImageData(0, 0, 320, 180);
    };
    const compare = (actual, expected) => {
      let differingPixels = 0,
        maximumChannelDifference = 0,
        total = 0,
        actualCoverage = 0,
        expectedCoverage = 0;
      const image = diff.getContext("2d").createImageData(320, 180);
      for (let index = 0; index < actual.data.length; index += 4) {
        let changed = false;
        for (let channel = 0; channel < 4; channel++) {
          const delta = Math.abs(actual.data[index + channel] - expected.data[index + channel]);
          maximumChannelDifference = Math.max(maximumChannelDifference, delta);
          total += delta;
          changed ||= delta !== 0;
        }
        actualCoverage +=
          actual.data[index] !== 255 || actual.data[index + 1] !== 255 || actual.data[index + 2] !== 255;
        expectedCoverage +=
          expected.data[index] !== 255 || expected.data[index + 1] !== 255 || expected.data[index + 2] !== 255;
        if (changed) {
          differingPixels++;
          image.data.set([255, 0, 0, 255], index);
        }
      }
      diff.getContext("2d").putImageData(image, 0, 0);
      return {
        differingPixels,
        maximumChannelDifference,
        meanChannelDifference: total / actual.data.length,
        actualCoverage,
        expectedCoverage,
        coveragePixelDifference: actualCoverage - expectedCoverage,
      };
    };
    const errors = [],
      samples = [],
      frames = [];
    device.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
    device.pushErrorScope("validation");
    const table = app.create_instances_table_$x_();
    let host,
      cpuHost,
      version = 0,
      previousCpuVersion = -1;
    try {
      const motions = app.independent_instance_motions(),
        prepared = app.prepare_independent_gpu(motions, 0);
      if (prepared.tag.value !== "ready") throw Error(`unexpected fallback: ${prepared.extra[0]}`);
      const program = prepared.extra[0];
      host = app.create_gpu_$x_(canvas, device, navigator.gpu.getPreferredCanvasFormat(), 10000);
      app.install_independent_gpu_$x_(host, program, 0);
      cpuHost = await app.create_instances_gpu_$x_(cpuCanvas, device, navigator.gpu.getPreferredCanvasFormat());
      const coldRecordBytes = host.uploadedBytes,
        coldParameterBytes = host.parameterBytes;
      for (const time of [1, 0, 0.5, 0.25, 1]) {
        app.draw_independent_gpu_$x_(host, program, time);
        const positions = new Float32Array(core.to_js_data(app.independent_instance_positions(motions, time)));
        app.register_instances_version_$x_(table, ++version, positions);
        if (version > 1) app.release_instances_$x_(table, version - 1);
        const cpuMetrics = core.to_js_data(app.draw_instances_gpu_$x_(previousCpuVersion, cpuHost, table, version));
        previousCpuVersion = version;
        // 固定参考为 CPU backing；反复读回时不让 Chromium 自动切换 Canvas backing。
        const context = reference.getContext("2d", { willReadFrequently: true });
        context.fillStyle = "white";
        context.fillRect(0, 0, 320, 180);
        app.draw_instances_$x_(context, positions);
        const actual = await capture(canvas, captured),
          cpuActual = await capture(cpuCanvas, capturedCpu),
          expected = context.getImageData(0, 0, 320, 180);
        const gpuVsCpuGpu = compare(actual, cpuActual),
          gpuVsCanvas = compare(actual, expected);
        frames.push({
          time,
          cpuMetrics,
          gpuVsCpuGpu,
          gpuVsCanvas,
          scalarPng: captured.toDataURL(),
          cpuGpuPng: capturedCpu.toDataURL(),
          canvasPng: reference.toDataURL(),
          diffPng: diff.toDataURL(),
        });
        for (const index of [0, 5050, 9999]) {
          const actual = await globalThis.__quamolitScalarProbe(host, index, time);
          let t = Math.min(1, Math.max(0, (time - 0.012 * (index % 13)) / (0.45 + 0.02 * (index % 17))));
          if (index % 2) t = t * t * (3 - 2 * t);
          const expected = [
            8 + 2 * (index % 125) + (1 + (index % 7)) * t,
            10 + 2 * Math.floor(index / 125) + ((index % 5) - 2) * t,
          ];
          samples.push({ index, time, actual, expected });
        }
      }
      await device.queue.onSubmittedWorkDone();
      return {
        result: "PASS",
        adapter: identity,
        samples,
        frames,
        intermediateCanvas: "PENDING_RASTERIZATION_CONTRACT_144",
        coldRecordBytes,
        coldParameterBytes,
        hotRecordBytes: host.uploadedBytes - coldRecordBytes,
        hotParameterBytes: host.parameterBytes - coldParameterBytes,
        diagnosticReadbackBytes: samples.length * 8,
        errors,
      };
    } finally {
      if (host) app.dispose_gpu_$x_(host);
      if (cpuHost) app.dispose_instances_gpu_$x_(cpuHost);
      if (version > 0) app.release_instances_$x_(table, version);
      const validation = await device.popErrorScope();
      if (validation) errors.push(validation.message);
      device.destroy();
    }
  });
  if (report.result === "SKIP") return report;
  assert.deepEqual(report.errors, []);
  assert.equal(report.samples.length, 15);
  assert.equal(report.coldRecordBytes, 640000);
  assert.equal(report.coldParameterBytes, 2240000);
  assert.equal(report.hotRecordBytes, 0);
  assert.equal(report.hotParameterBytes, 0);
  assert.equal(report.frames.length, 5);
  for (const [index, frame] of report.frames.entries()) {
    for (const key of ["scalarPng", "cpuGpuPng", "canvasPng", "diffPng"]) {
      const filename = `independent-frame-${index}-${key}.png`;
      await writeFile(join(artifacts, filename), Buffer.from(frame[key].split(",")[1], "base64"));
      frame[key] = filename;
    }
    assert.equal(frame.cpuMetrics["upload-bytes"], 80000);
    assert.equal(
      frame.gpuVsCpuGpu.differingPixels,
      0,
      `同源两条 GPU 路径的完整帧应一致: ${JSON.stringify({ time: frame.time, comparison: frame.gpuVsCpuGpu })}`,
    );
    if (frame.time === 0 || frame.time === 1)
      assert.equal(
        frame.gpuVsCanvas.differingPixels,
        0,
        `整数端点保持完整 Canvas 零差异断言: ${JSON.stringify({ time: frame.time, comparison: frame.gpuVsCanvas })}`,
      );
  }
  for (const sample of report.samples)
    for (let axis = 0; axis < 2; axis++)
      assert.ok(
        Math.abs(sample.actual[axis] - sample.expected[axis]) <= 1e-5 + 1e-5 * Math.abs(sample.expected[axis]),
        JSON.stringify(sample),
      );
  return report;
}

// 测试驱动仅导入搬移后的 app.main；不把测试文件放进消费者 runtime。
export async function verifyGpuConsumerBrowser(page, artifacts, dual = false) {
  const alpha = dual === "alpha";
  // 诊断驱动注入自包含 probe，不安装到消费者，不增加生产模块/文件请求。
  // probe 复用 host 内实际 shader 与参数；没有另写一份测试版 WGSL 公式。
  if (dual) await page.addScriptTag({ content: `globalThis.__quamolitScalarProbe = ${readScalarSample.toString()}` });
  const report = await page.evaluate(async (dual) => {
    const alpha = dual === "alpha";
    if (!navigator.gpu) return { result: "SKIP", reason: "webgpu-unavailable" };
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { result: "SKIP", reason: "adapter-unavailable" };
    const info = adapter.info;
    const identity = {
      vendor: info.vendor,
      architecture: info.architecture,
      device: info.device,
      description: info.description,
    };
    if (
      info.isFallbackAdapter ||
      adapter.isFallbackAdapter ||
      /swiftshader|software|llvmpipe/i.test(Object.values(identity).join(" "))
    ) {
      return { result: "SKIP", reason: "software-adapter", adapter: identity };
    }
    const app = await import("/target/js/app/app.main.mjs");
    const start = alpha ? app.start_alpha : dual ? app.start_dual : app.start_rects;
    const update = alpha ? app.update_alpha : dual ? app.update_dual : app.update_rects;
    const device = await adapter.requestDevice();
    const errors = [],
      frames = [],
      numericSamples = [];
    device.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
    device.pushErrorScope("validation");
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const reference = document.createElement("canvas");
    reference.width = 320;
    reference.height = 180;
    const referenceContext = reference.getContext("2d");
    const captured = document.createElement("canvas");
    captured.width = 320;
    captured.height = 180;
    const capturedContext = captured.getContext("2d");
    let host;
    try {
      host = app.create_gpu_$x_(canvas, device, navigator.gpu.getPreferredCanvasFormat(), 2);
      let plan = start(0, 40, false, 100);
      let prepared = app.prepare_gpu(plan);
      if (prepared.tag.value !== "ready") throw Error(`unexpected fallback: ${prepared.extra[0]}`);
      let program = prepared.extra[0];
      app.install_gpu_$x_(host, program);
      let model = 40,
        ready = false,
        viewport = 100;
      // 乱序、重复，然后同时间三个实际依赖改变；两后端消费同一声明。
      for (const request of [
        { time: 1 },
        { time: 0 },
        { time: 0.5 },
        { time: 0.25 },
        { time: 1 },
        { time: 1, model: 41 },
        { time: 1, ready: true },
        { time: 1, viewport: 200 },
        // 新夹具只移动已有 badge 到静态条带上，不增加节点或动画实现。
        ...(alpha ? [0, 0.5, 1].map((time) => ({ time, model: 80, ready: true, overlap: true })) : []),
      ]) {
        model = request.model ?? model;
        ready = request.ready ?? ready;
        viewport = request.viewport ?? viewport;
        plan = update(plan, request.time, model, ready, viewport);
        const reused = app.gpu_reusable_$q_(program, plan);
        const recordsBefore = host.uploadedBytes,
          parametersBefore = host.parameterBytes;
        if (!reused) {
          prepared = app.prepare_gpu(plan);
          if (prepared.tag.value !== "ready") throw Error(`unexpected fallback: ${prepared.extra[0]}`);
          program = prepared.extra[0];
          app.install_gpu_$x_(host, program);
        } else app.draw_gpu_$x_(host, program, request.time);
        // 立即捕获本次提交的画布，避免呈现后 texture 自动轮换。
        const bitmap = await createImageBitmap(canvas);
        capturedContext.clearRect(0, 0, 320, 180);
        capturedContext.drawImage(bitmap, 0, 0);
        bitmap.close();
        app.draw_$x_(referenceContext, plan);
        // GPU 当前合同是白色不透明清屏；Canvas 消费者保留透明背景。
        // 只把参考背景合成为相同白色，不改变几何、颜色或像素容差。
        referenceContext.save();
        referenceContext.globalCompositeOperation = "destination-over";
        referenceContext.fillStyle = "white";
        referenceContext.fillRect(0, 0, 320, 180);
        referenceContext.restore();
        const actual = capturedContext.getImageData(0, 0, 320, 180).data;
        const expected = referenceContext.getImageData(0, 0, 320, 180).data;
        let differences = 0,
          maximumChannelDifference = 0,
          maximumAlphaDifference = 0,
          outsideBadgeDifferences = 0;
        const diff = request.overlap ? referenceContext.createImageData(320, 180) : null;
        for (let i = 0; i < actual.length; i++) {
          if (actual[i] !== expected[i]) {
            differences++;
            if (request.overlap) {
              const pixel = Math.floor(i / 4),
                x = pixel % 320,
                y = Math.floor(pixel / 320);
              if (x < 80 || x >= 100 || y < 102 || y >= 122) outsideBadgeDifferences++;
              diff.data.set([255, 0, 0, 255], pixel * 4);
            }
          }
          maximumChannelDifference = Math.max(maximumChannelDifference, Math.abs(actual[i] - expected[i]));
          if (i % 4 === 3) maximumAlphaDifference = Math.max(maximumAlphaDifference, Math.abs(actual[i] - expected[i]));
        }
        frames.push({
          time: request.time,
          model,
          ready,
          viewport,
          reused,
          differences,
          maximumChannelDifference,
          ...(request.overlap
            ? {
                overlap: true,
                maximumAlphaDifference,
                outsideBadgeDifferences,
                diffPng: (() => {
                  const image = document.createElement("canvas");
                  image.width = 320;
                  image.height = 180;
                  image.getContext("2d").putImageData(diff, 0, 0);
                  return image.toDataURL();
                })(),
                // (82,104) 位于两整数矩形内区；独立 source-over 公式锁定层序。
                overlapPixel: Array.from(capturedContext.getImageData(82, 104, 1, 1).data),
                expectedOverlapPixel: (() => {
                  const t = Math.max(0, Math.min(1, request.time)),
                    a = t * t * (3 - 2 * t);
                  return [0, 0.7, 0.4].map((c) => Math.round(255 * (c * a + 0.4 * (1 - a)))).concat(255);
                })(),
              }
            : {}),
          uploadedBytes: host.uploadedBytes - recordsBefore,
          parameterBytes: host.parameterBytes - parametersBefore,
          actualPng: captured.toDataURL(),
          expectedPng: reference.toDataURL(),
        });
      }
      if (dual) {
        for (const time of [0.37, 0.81, 0.4999999, -0.1, 1.1, 0, 1]) {
          // 相同时间先走公共入口及其精度预算；probe 不自行绕过能力判定。
          app.draw_gpu_$x_(host, program, time);
          const actual = await globalThis.__quamolitScalarProbe(host, 1, time, alpha ? 2 : 0);
          const t = Math.max(0, Math.min(1, time)),
            eased = t * t * (3 - 2 * t);
          const expected = alpha ? [eased, eased] : [80 + 64 * eased, 22 + model + 32 * eased];
          if (!alpha) {
            actual.push(...(await globalThis.__quamolitScalarProbe(host, 1, time, 3)));
            expected.push(viewport / 10 + 64 * eased, 20 + 32 * eased);
          }
          numericSamples.push({ time, actual, expected });
        }
      }
      await device.queue.onSubmittedWorkDone();
    } finally {
      if (host) app.dispose_gpu_$x_(host);
      const validation = await device.popErrorScope();
      if (validation) errors.push(validation.message);
      device.destroy();
    }
    return {
      result: "PASS",
      mode: alpha ? "smoothstep-alpha" : dual ? "smoothstep-xy-size" : "linear-x",
      adapter: identity,
      frames,
      numericSamples,
      diagnosticReadbackBytes: numericSamples.reduce((bytes, sample) => bytes + sample.actual.length * 4, 0),
      errors,
      channelsPerFrame: 230400,
    };
  }, dual);
  if (report.result === "SKIP") return report;
  for (const [index, frame] of report.frames.entries()) {
    for (const [key, suffix] of [
      ["actualPng", "gpu"],
      ["expectedPng", "canvas"],
      ...(frame.overlap ? [["diffPng", "diff"]] : []),
    ]) {
      const filename = `gpu-${alpha ? "alpha-" : dual ? "dual-" : ""}frame-${index}-${suffix}.png`;
      await writeFile(join(artifacts, filename), Buffer.from(frame[key].split(",")[1], "base64"));
      frame[key] = filename;
    }
  }
  assert.deepEqual(report.errors, []);
  assert.equal(report.frames.length, alpha ? 11 : 8);
  for (const [index, frame] of report.frames.entries()) {
    if (frame.overlap) {
      // 新的透明叠加夹具沿用分层合同的 RGB≤2；8个原画面的零差异门禁不变。
      // 两边先预乘/量化再混合的8位路径可能相差1级，不适用于小数几何/边缘。
      assert.ok(frame.maximumChannelDifference <= 2, JSON.stringify(frame));
      assert.equal(frame.maximumAlphaDifference, 0, JSON.stringify(frame));
      assert.equal(frame.outsideBadgeDifferences, 0, JSON.stringify(frame));
      assert.deepEqual(frame.overlapPixel, frame.expectedOverlapPixel, JSON.stringify(frame));
      if (frame.time === 0.5)
        assert.ok(Math.abs(frame.overlapPixel[1] - 102) > 2, "错误层序的灰色上层必须被独立公式拒绝");
    } else assert.equal(frame.differences, 0, JSON.stringify(frame));
    const reused = index < 5 || index > 8;
    assert.equal(frame.reused, reused);
    assert.equal(frame.uploadedBytes, reused ? 0 : 128);
    assert.equal(frame.parameterBytes, reused ? 0 : dual && !alpha ? 448 : 352);
  }
  assert.equal(report.numericSamples.length, dual ? 7 : 0);
  for (const sample of report.numericSamples) {
    for (let axis = 0; axis < sample.expected.length; axis++) {
      assert.ok(
        Math.abs(sample.actual[axis] - sample.expected[axis]) <= 1e-5 + 1e-5 * Math.abs(sample.expected[axis]),
        JSON.stringify(sample),
      );
    }
  }
  if (dual === true) {
    report.alpha = await verifyGpuConsumerBrowser(page, artifacts, "alpha");
    assert.equal(report.alpha.result, "PASS", "已取得真实GPU的双轴专项必须实际执行alpha，不将子项SKIP藏在PASS内");
  }
  return report;
}

export async function verifyGpuInstancesConsumerBrowser(page, artifacts) {
  const report = await page.evaluate(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return { result: "SKIP", reason: "adapter-unavailable" };
    const info = adapter.info ?? {};
    const identity = {
      vendor: info.vendor,
      architecture: info.architecture,
      device: info.device,
      description: info.description,
      isFallbackAdapter: Boolean(info.isFallbackAdapter || adapter.isFallbackAdapter),
    };
    if (identity.isFallbackAdapter || /swiftshader|software|llvmpipe/i.test(Object.values(identity).join(" "))) {
      return { result: "SKIP", reason: "software-adapter", adapter: identity };
    }
    const app = await import("/target/js/app/app.main.mjs");
    const core = await import("/target/js/app/calcit.core.mjs");
    const { createInstancePositions } = await import("/instances-input.mjs");
    const device = await adapter.requestDevice();
    const errors = [],
      frames = [];
    device.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
    device.pushErrorScope("validation");
    const canvas = document.createElement("canvas"),
      reference = document.createElement("canvas"),
      captured = document.createElement("canvas");
    for (const target of [canvas, reference, captured]) {
      target.width = 320;
      target.height = 180;
    }
    const referenceContext = reference.getContext("2d"),
      capturedContext = captured.getContext("2d");
    const table = app.create_instances_table_$x_();
    app.register_instances_$x_(table, createInstancePositions(10000));
    let batch,
      version = 1,
      previousGpuVersion = -1,
      previousTime = 0;
    try {
      batch = await app.create_instances_gpu_$x_(canvas, device, navigator.gpu.getPreferredCanvasFormat());
      for (const time of [0, 1, 0.5, 1]) {
        let copied = 0;
        if (time !== previousTime) {
          const frame = app.instance_frame_at(time),
            values = core.to_js_data(frame);
          copied = app.patch_instances_$x_(table, version, version + 1, frame, new Float32Array([values.x, values.y]));
          app.release_instances_$x_(table, version);
          version++;
          previousTime = time;
        }
        const metrics = core.to_js_data(app.draw_instances_gpu_$x_(previousGpuVersion, batch, table, version));
        previousGpuVersion = version;
        const bitmap = await createImageBitmap(canvas);
        capturedContext.drawImage(bitmap, 0, 0);
        bitmap.close();
        referenceContext.fillStyle = "white";
        referenceContext.fillRect(0, 0, 320, 180);
        app.draw_resolved_instances_$x_(referenceContext, table, version);
        const locations = [
          [1, 1],
          [9, 11],
          [108, 90],
          [319, 179],
        ];
        const actual = locations.map(([x, y]) => Array.from(capturedContext.getImageData(x, y, 1, 1).data));
        const expected = locations.map(([x, y]) => Array.from(referenceContext.getImageData(x, y, 1, 1).data));
        frames.push({ time, version, copied, metrics, actual, expected, live: app.instances_live_count(table) });
      }
      const warm = core.to_js_data(app.draw_instances_gpu_$x_(version, batch, table, version));
      const skipped = core.to_js_data(app.draw_instances_gpu_$x_(-1, batch, table, version));
      await device.queue.onSubmittedWorkDone();
      const actualImage = capturedContext.getImageData(0, 0, 320, 180);
      const expectedImage = referenceContext.getImageData(0, 0, 320, 180);
      const diffCanvas = document.createElement("canvas");
      diffCanvas.width = 320;
      diffCanvas.height = 180;
      const diffContext = diffCanvas.getContext("2d");
      const diffImage = diffContext.createImageData(320, 180);
      let differingPixels = 0,
        maximumChannelDifference = 0;
      for (let index = 0; index < actualImage.data.length; index += 4) {
        let changed = false;
        for (let channel = 0; channel < 4; channel++) {
          const difference = Math.abs(actualImage.data[index + channel] - expectedImage.data[index + channel]);
          maximumChannelDifference = Math.max(maximumChannelDifference, difference);
          changed ||= difference > 0;
        }
        if (changed) {
          differingPixels++;
          diffImage.data.set([255, 0, 0, 255], index);
        }
      }
      diffContext.putImageData(diffImage, 0, 0);
      return {
        result: "PASS",
        adapter: identity,
        frames,
        warm,
        skipped,
        errors,
        actualPng: captured.toDataURL(),
        expectedPng: reference.toDataURL(),
        diffPng: diffCanvas.toDataURL(),
        differingPixels,
        maximumChannelDifference,
        liveBeforeDispose: app.instances_live_count(table),
      };
    } finally {
      if (batch) app.dispose_instances_gpu_$x_(batch);
      app.release_instances_$x_(table, version);
      const validation = await device.popErrorScope();
      if (validation) errors.push(validation.message);
      device.destroy();
    }
  });
  if (report.result === "SKIP") return report;
  for (const key of ["actualPng", "expectedPng", "diffPng"]) {
    const filename = `dynamic-instances-${{ actualPng: "gpu", expectedPng: "canvas", diffPng: "diff" }[key]}.png`;
    await writeFile(join(artifacts, filename), Buffer.from(report[key].split(",")[1], "base64"));
    report[key] = filename;
  }
  assert.deepEqual(report.errors, []);
  assert.equal(report.frames.length, 4);
  assert.deepEqual(
    report.frames.map((frame) => frame.copied),
    [0, 8, 8, 8],
  );
  assert.deepEqual(
    report.frames.map((frame) => frame.metrics["upload-bytes"]),
    [80000, 8, 8, 8],
  );
  assert.deepEqual(
    report.frames.map((frame) => frame.metrics.instances),
    [10000, 10000, 10000, 10000],
  );
  assert.deepEqual(
    report.frames.map((frame) => frame.live),
    [1, 1, 1, 1],
  );
  for (const frame of report.frames)
    assert.deepEqual(frame.actual, frame.expected, `同源采样像素不一致: ${JSON.stringify(frame)}`);
  assert.equal(report.differingPixels, 0, "像素对齐负载的整幅画面须与 Canvas 参考完全一致");
  assert.equal(report.maximumChannelDifference, 0);
  assert.deepEqual(
    report.frames.map((frame) => frame.actual[0]),
    [
      [255, 255, 255, 255],
      [234, 88, 12, 255],
      [255, 255, 255, 255],
      [234, 88, 12, 255],
    ],
  );
  assert.equal(report.warm["upload-bytes"], 0);
  assert.equal(report.skipped["upload-bytes"], 80000);
  assert.equal(report.liveBeforeDispose, 1);
  return report;
}
