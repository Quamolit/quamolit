import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { gpu_fade_plan as gpuFadePlan, sample_at as sampleAt } from "../js-out/quamolit.test.motion-fixture.mjs";

test("GPU-lowerable fade remains a serializable typed plan with CPU reference values", () => {
  const plan = toJsData(gpuFadePlan());
  assert.deepEqual(plan, ["supported", {
    id: "old-fade",
    kernel: ["tween", {
      duration: 1,
      easing: ["linear"],
      from: 10,
      start: 0,
      to: 20,
    }],
    version: 1,
  }]);
  assert.deepEqual(JSON.parse(JSON.stringify(plan)), plan);
  for (const [time, expected] of [[0, 10], [0.25, 12.5], [0.5, 15], [1, 20]]) {
    assert.equal(sampleAt(time), expected);
  }
});
