import assert from "node:assert/strict";
import { percentile } from "./m0/bench-metrics.mjs";

export const cpuStages = ["viewportMs", "planningMs", "surfacesMs", "instancesMs", "uiMs", "controlsMs", "cpuFrameMs"];

export function summarizeLayerRun(run) {
  assert.ok(["canvas", "webgpu"].includes(run.backend));
  assert.ok(run.samples.length >= 2);
  assert.deepEqual(run.errors, []);
  for (const sample of run.samples) {
    assert.equal(sample.backend, run.backend, "回退不能算 GPU 性能");
    assert.equal(sample.version, run.cold.version, "热测量不允许视口/源版本改变");
    assert.equal(sample.sourceLive, 1);
    assert.equal(sample.metrics.instances, 10000);
    assert.equal(sample.costs.compositorMs, null);
    assert.equal(sample.costs.gpuMs, null);
    assert.ok(Number.isFinite(sample.rafIntervalMs) && sample.rafIntervalMs > 0);
    for (const key of cpuStages) assert.ok(Number.isFinite(sample.costs[key]) && sample.costs[key] >= 0, key);
    const accounted = cpuStages.filter((key) => key !== "cpuFrameMs").reduce((sum, key) => sum + sample.costs[key], 0);
    assert.ok(sample.costs.cpuFrameMs + 0.001 >= accounted, "总边界不能遗漏阶段");
    if (run.backend === "webgpu") {
      assert.equal(sample.metrics["position-bytes-uploaded"], 0);
      assert.equal(sample.gpuCreated, run.cold.gpuCreated);
      assert.equal(sample.gpuReleased, run.cold.gpuReleased);
    }
  }
  return {
    backend: run.backend,
    frames: run.samples.length,
    elapsedMs: run.elapsedMs,
    adapter: run.cold.adapter,
    metrics: Object.fromEntries(
      [...cpuStages, "rafIntervalMs"].map((key) => {
        const values = run.samples.map((sample) => (key === "rafIntervalMs" ? sample[key] : sample.costs[key]));
        return [key, Object.fromEntries([0.5, 0.95, 0.99].map((q) => [`p${q * 100}`, percentile(values, q)]))];
      }),
    ),
    compositorMs: null,
    gpuMs: null,
    allocationBytes: null,
    uiNativeCalls: null,
  };
}
