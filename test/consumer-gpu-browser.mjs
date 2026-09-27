import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readScalarSample } from "./host/gpu-scalar-readback.mjs";

// 测试驱动仅导入搬移后的 app.main；不把测试文件放进消费者 runtime。
export async function verifyGpuConsumerBrowser(page, artifacts, dual = false) {
  // 诊断驱动注入自包含 probe，不安装到消费者，不增加生产模块/文件请求。
  // probe 复用 host 内实际 shader 与参数；没有另写一份测试版 WGSL 公式。
  if (dual) await page.addScriptTag({ content: `globalThis.__quamolitScalarProbe = ${readScalarSample.toString()}` });
  const report = await page.evaluate(async (dual) => {
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
    const start = dual ? app.start_dual : app.start_rects;
    const update = dual ? app.update_dual : app.update_rects;
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
        let differences = 0;
        for (let i = 0; i < actual.length; i++) if (actual[i] !== expected[i]) differences++;
        frames.push({
          time: request.time,
          model,
          ready,
          viewport,
          reused,
          differences,
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
          const actual = await globalThis.__quamolitScalarProbe(host, 1, time);
          const t = Math.max(0, Math.min(1, time)),
            eased = t * t * (3 - 2 * t);
          const expected = [80 + 64 * eased, 22 + model + 32 * eased];
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
      mode: dual ? "smoothstep-xy" : "linear-x",
      adapter: identity,
      frames,
      numericSamples,
      diagnosticReadbackBytes: numericSamples.length * 8,
      errors,
      channelsPerFrame: 230400,
    };
  }, dual);
  if (report.result === "SKIP") return report;
  for (const [index, frame] of report.frames.entries()) {
    for (const [key, suffix] of [
      ["actualPng", "gpu"],
      ["expectedPng", "canvas"],
    ]) {
      const filename = `gpu-${dual ? "dual-" : ""}frame-${index}-${suffix}.png`;
      await writeFile(join(artifacts, filename), Buffer.from(frame[key].split(",")[1], "base64"));
      frame[key] = filename;
    }
  }
  assert.deepEqual(report.errors, []);
  assert.equal(report.frames.length, 8);
  for (const [index, frame] of report.frames.entries()) {
    assert.equal(frame.differences, 0, JSON.stringify(frame));
    assert.equal(frame.reused, index < 5);
    assert.equal(frame.uploadedBytes, index < 5 ? 0 : 128);
    assert.equal(frame.parameterBytes, index < 5 ? 0 : dual ? 192 : 160);
  }
  assert.equal(report.numericSamples.length, dual ? 7 : 0);
  for (const sample of report.numericSamples) {
    for (let axis = 0; axis < 2; axis++) {
      assert.ok(
        Math.abs(sample.actual[axis] - sample.expected[axis]) <= 1e-5 + 1e-5 * Math.abs(sample.expected[axis]),
        JSON.stringify(sample),
      );
    }
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
