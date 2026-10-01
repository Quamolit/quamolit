import { test } from "node:test";
import assert from "node:assert/strict";
import { cpuStages, summarizeLayerRun } from "./layer-cost-metrics.mjs";

function fixture() {
  const costs = Object.fromEntries(cpuStages.map((key) => [key, key === "cpuFrameMs" ? 6 : 1]));
  Object.assign(costs, { gpuMs: null, compositorMs: null });
  const sample = {
    backend: "webgpu",
    version: 1,
    sourceLive: 1,
    gpuCreated: 1,
    gpuReleased: 0,
    metrics: { instances: 10000, "position-bytes-uploaded": 0 },
    costs,
    rafIntervalMs: 16.7,
  };
  return {
    backend: "webgpu",
    cold: { version: 1, gpuCreated: 1, gpuReleased: 0, adapter: {} },
    elapsedMs: 100,
    errors: [],
    samples: [structuredClone(sample), structuredClone(sample)],
  };
}
test("分层报告保留未知合成/GPU时间，不推导 FPS", () => {
  const result = summarizeLayerRun(fixture());
  assert.equal(result.metrics.cpuFrameMs.p95, 6);
  assert.equal(result.compositorMs, null);
  assert.equal(result.gpuMs, null);
  assert.equal(result.fps, undefined);
});
test("遗漏计时、热帧上传、设备重建、回退和资源增长必须失败", () => {
  for (const mutate of [
    (s) => {
      s.costs.cpuFrameMs = 2;
    },
    (s) => {
      s.costs.uiMs = NaN;
    },
    (s) => {
      s.metrics["position-bytes-uploaded"] = 80000;
    },
    (s) => {
      s.gpuCreated = 2;
    },
    (s) => {
      s.backend = "canvas";
    },
    (s) => {
      s.sourceLive = 2;
    },
    (s) => {
      s.version = 2;
    },
    (s) => {
      s.costs.compositorMs = 0;
    },
  ]) {
    const run = fixture();
    mutate(run.samples[0]);
    assert.throws(() => summarizeLayerRun(run));
  }
});
