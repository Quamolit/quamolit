import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { gpu_translation_plan as gpuTranslationPlan, sample_vec2_at as sampleVec2At } from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import { frame_at as gpuTranslationFrameAt, require_ready as requireGpuTranslation } from "../target/js/motion/quamolit.gpu-vec2-translation.mjs";

test("Calcit Vec2 tween 映射为固定参数的 GPU 时间平移，不在 CPU 逐实例采样", () => {
  const prepared = gpuTranslationPlan();
  const [status, motion] = toJsData(prepared);
  assert.equal(status, "ready");
  const motionPlan = requireGpuTranslation(prepared);
  assert.equal(motion.id, "moving-rect");
  assert.equal(motion.version, 1);
  const times = [1, 0, 0.5, 0.25, 0.75, 0.37, 0.81, 0];
  for (const time of times) {
    const uniform = toJsData(gpuTranslationFrameAt(motionPlan, time));
    assert.equal(uniform.time, time);
    assert.equal(uniform.duration, 1);
    assert.equal(uniform.easing, "linear");
    const expected = toJsData(sampleVec2At(time));
    const progress = Math.min(Math.max((time - uniform.start) / uniform.duration, 0), 1);
    assert.ok(Math.abs(expected.x - (uniform.from.x + (uniform.to.x - uniform.from.x) * progress)) < 1e-12);
    assert.ok(Math.abs(expected.y - (uniform.from.y + (uniform.to.y - uniform.from.y) * progress)) < 1e-12);
  }
  assert.throws(() => gpuTranslationFrameAt(motionPlan, Number.NaN), /finite-f32/);
  assert.throws(() => gpuTranslationFrameAt(motionPlan, 1e100), /finite-f32/);
});

test("Calcit 位移计划可序列化且不含宿主句柄", () => {
  const plan = toJsData(gpuTranslationPlan());
  assert.deepEqual(JSON.parse(JSON.stringify(plan)), plan);
  const motionPlan = requireGpuTranslation(gpuTranslationPlan());
  assert.deepEqual(toJsData(gpuTranslationFrameAt(motionPlan, 0.5)), {
    from: { x: 48, y: 80 }, to: { x: 208, y: 120 },
    start: 0, duration: 1, easing: "linear", time: 0.5,
  });
});
