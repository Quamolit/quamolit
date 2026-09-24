import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { gpu_fade_plan as gpuFadePlan, gpu_vec2_plan as gpuVec2Plan, sample_vec2_at as sampleVec2At } from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import { prepareGpuVec2Translation } from "../src/host/gpu-vec2-translation.mjs";

test("Calcit Vec2 tween 映射为固定参数的 GPU 时间平移，不在 CPU 逐实例采样", () => {
  const motion = prepareGpuVec2Translation(toJsData(gpuVec2Plan()));
  assert.equal(motion.kind, "ready");
  assert.equal(motion.id, "moving-rect");
  assert.equal(motion.version, 1);
  const times = [1, 0, 0.5, 0.25, 0.75, 0.37, 0.81, 0];
  for (const time of times) {
    const uniform = motion.at(time);
    assert.equal(uniform.time, time);
    assert.equal(uniform.duration, 1);
    assert.equal(uniform.easing, "linear");
    const expected = toJsData(sampleVec2At(time));
    const progress = Math.min(Math.max((time - uniform.start) / uniform.duration, 0), 1);
    assert.ok(Math.abs(expected.x - (uniform.from.x + (uniform.to.x - uniform.from.x) * progress)) < 1e-12);
    assert.ok(Math.abs(expected.y - (uniform.from.y + (uniform.to.y - uniform.from.y) * progress)) < 1e-12);
  }
  assert.throws(() => motion.at(Number.NaN), /finite f32/);
  assert.throws(() => motion.at(1e100), /finite f32/);
});

test("非 Vec2 和不支持的 GPU 计划显式诊断", () => {
  assert.deepEqual(prepareGpuVec2Translation(toJsData(gpuFadePlan())), {
    kind: "unsupported", reason: "valid-vec2-tween-required",
  });
  assert.deepEqual(prepareGpuVec2Translation(["unsupported", "cpu-custom"]), {
    kind: "unsupported", reason: "cpu-custom",
  });
  assert.deepEqual(prepareGpuVec2Translation(["supported", { id: "track", version: 1, kernel: ["keyframes", {}] }]), {
    kind: "unsupported", reason: "vec2-tween-required",
  });
  assert.throws(() => prepareGpuVec2Translation(["supported", { id: "", version: 1, kernel: [] }]), /ID\/version/);
});
