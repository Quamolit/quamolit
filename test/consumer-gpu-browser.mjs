import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readScalarSample } from "./host/gpu-scalar-readback.mjs";

// 测试驱动仅导入搬移后的 app.main；不把测试文件放进消费者 runtime。
export async function verifyGpuConsumerBrowser(page, artifacts, dual = false) {
  // 诊断驱动注入自包含 probe，不安装到消费者，不增加生产模块/文件请求。
  // probe 复用 host 内实际 shader 与参数；没有另写一份测试版 WGSL 公式。
  if (dual) await page.addScriptTag({ content: `globalThis.__quamolitScalarProbe = ${readScalarSample.toString()}` });
  const report = await page.evaluate(async dual => {
    if (!navigator.gpu) return { result: "SKIP", reason: "webgpu-unavailable" };
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { result: "SKIP", reason: "adapter-unavailable" };
    const info = adapter.info;
    const identity = { vendor: info.vendor, architecture: info.architecture, device: info.device, description: info.description };
    if (info.isFallbackAdapter || adapter.isFallbackAdapter || /swiftshader|software|llvmpipe/i.test(Object.values(identity).join(" "))) {
      return { result: "SKIP", reason: "software-adapter", adapter: identity };
    }
    const app = await import("/target/js/app/app.main.mjs");
    const start = dual ? app.start_dual : app.start_rects;
    const update = dual ? app.update_dual : app.update_rects;
    const device = await adapter.requestDevice();
    const errors = [], frames = [], numericSamples = [];
    device.addEventListener("uncapturederror", event => errors.push(event.error.message));
    device.pushErrorScope("validation");
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 180;
    const reference = document.createElement("canvas");
    reference.width = 320; reference.height = 180;
    const referenceContext = reference.getContext("2d");
    const captured = document.createElement("canvas");
    captured.width = 320; captured.height = 180;
    const capturedContext = captured.getContext("2d");
    let host;
    try {
      host = app.create_gpu_$x_(canvas, device, navigator.gpu.getPreferredCanvasFormat(), 2);
      let plan = start(0, 40, false, 100);
      let prepared = app.prepare_gpu(plan);
      if (prepared.tag.value !== "ready") throw Error(`unexpected fallback: ${prepared.extra[0]}`);
      let program = prepared.extra[0];
      app.install_gpu_$x_(host, program);
      let model = 40, ready = false, viewport = 100;
      // 乱序、重复，然后同时间三个实际依赖改变；两后端消费同一声明。
      for (const request of [{ time: 1 }, { time: 0 }, { time: 0.5 }, { time: 0.25 }, { time: 1 },
        { time: 1, model: 41 }, { time: 1, ready: true }, { time: 1, viewport: 200 }]) {
        model = request.model ?? model; ready = request.ready ?? ready; viewport = request.viewport ?? viewport;
        plan = update(plan, request.time, model, ready, viewport);
        const reused = app.gpu_reusable_$q_(program, plan);
        const recordsBefore = host.uploadedBytes, parametersBefore = host.parameterBytes;
        if (!reused) {
          prepared = app.prepare_gpu(plan);
          if (prepared.tag.value !== "ready") throw Error(`unexpected fallback: ${prepared.extra[0]}`);
          program = prepared.extra[0];
          app.install_gpu_$x_(host, program);
        } else app.draw_gpu_$x_(host, program, request.time);
        // 立即捕获本次提交的画布，避免呈现后 texture 自动轮换。
        const bitmap = await createImageBitmap(canvas);
        capturedContext.clearRect(0, 0, 320, 180);
        capturedContext.drawImage(bitmap, 0, 0); bitmap.close();
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
        frames.push({ time: request.time, model, ready, viewport, reused, differences,
          uploadedBytes: host.uploadedBytes - recordsBefore, parameterBytes: host.parameterBytes - parametersBefore,
          actualPng: captured.toDataURL(), expectedPng: reference.toDataURL() });
      }
      if (dual) {
        for (const time of [0.37, 0.81, 0.4999999, -0.1, 1.1, 0, 1]) {
          // 相同时间先走公共入口及其精度预算；probe 不自行绕过能力判定。
          app.draw_gpu_$x_(host, program, time);
          const actual = await globalThis.__quamolitScalarProbe(host, 1, time);
          const t = Math.max(0, Math.min(1, time)), eased = t * t * (3 - 2 * t);
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
    return { result: "PASS", mode: dual ? "smoothstep-xy" : "linear-x", adapter: identity,
      frames, numericSamples, diagnosticReadbackBytes: numericSamples.length * 8, errors, channelsPerFrame: 230400 };
  }, dual);
  if (report.result === "SKIP") return report;
  for (const [index, frame] of report.frames.entries()) {
    for (const [key, suffix] of [["actualPng", "gpu"], ["expectedPng", "canvas"]]) {
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
      assert.ok(Math.abs(sample.actual[axis] - sample.expected[axis]) <= 1e-5 + 1e-5 * Math.abs(sample.expected[axis]), JSON.stringify(sample));
    }
  }
  return report;
}
