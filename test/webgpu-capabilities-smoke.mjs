import assert from "node:assert/strict";
import { test } from "node:test";
import { probeWebGpuDevice } from "./host/webgpu-capabilities.mjs";

test("Calcit probe preserves unavailable and failed diagnostics", async () => {
  assert.deepEqual(await probeWebGpuDevice(null), { kind: "unavailable", stage: "gpu" });
  const denied = await probeWebGpuDevice({ gpu: {
    requestAdapter() { throw new Error("adapter denied"); },
    getPreferredCanvasFormat() { return "bgra8unorm"; },
  } });
  assert.deepEqual(denied, { kind: "failed", stage: "adapter", message: "adapter denied" });
});

test("Calcit ready branch preserves device ownership and loss", async () => {
  let destroyed = 0;
  let lose;
  const device = { lost: new Promise(resolve => { lose = resolve; }), destroy() { destroyed++; } };
  const adapter = { requestDevice: async () => device };
  const ready = await probeWebGpuDevice({ gpu: {
    requestAdapter: async () => adapter,
    getPreferredCanvasFormat: () => "bgra8unorm",
  } });
  assert.equal(ready.kind, "ready");
  assert.equal(ready.adapter, adapter);
  assert.equal(ready.device, device);
  assert.equal(ready.state, "ready");
  lose({ reason: "unknown", message: "test-loss" });
  assert.equal((await ready.lost).message, "test-loss");
  assert.equal(ready.state, "lost");
  assert.equal(ready.release(), true);
  assert.equal(ready.state, "released");
  assert.equal(ready.release(), false);
  assert.equal(destroyed, 1);
});
