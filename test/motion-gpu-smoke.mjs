import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import * as core from "../target/js/motion/calcit.core.mjs";
import * as motion from "../target/js/motion/quamolit.motion.mjs";
import { lower_scalar as lowerScalar } from "../target/js/motion/quamolit.motion-gpu.mjs";
import {
  gpu_fade_plan as gpuFadePlan,
  gpu_keyframes_repeat_plan as gpuKeyframesRepeatPlan,
  gpu_vec2_plan as gpuVec2Plan,
  sample_at as sampleAt,
} from "../target/js/motion/quamolit.test.motion-fixture.mjs";

test("GPU-lowerable fade remains a serializable typed plan with CPU reference values", () => {
  const plan = toJsData(gpuFadePlan());
  assert.deepEqual(plan, [
    "supported",
    {
      id: "old-fade",
      kernel: [
        "tween",
        {
          duration: 1,
          easing: ["linear"],
          from: 10,
          start: 0,
          to: 20,
        },
      ],
      version: 1,
    },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(plan)), plan);
  for (const [time, expected] of [
    [0, 10],
    [0.25, 12.5],
    [0.5, 15],
    [1, 20],
  ]) {
    assert.equal(sampleAt(time), expected);
  }
});

test("bounded repeated keyframes and Vec2 tween serialize without host handles", () => {
  const track = toJsData(gpuKeyframesRepeatPlan());
  assert.equal(track[0], "supported");
  assert.equal(track[1].id, "keyframe-track");
  assert.equal(track[1].kernel[0], "keyframes");
  assert.equal(track[1].kernel[1].frames.length, 4);
  assert.deepEqual(track[1].kernel[1].loop, ["repeat"]);
  const vector = toJsData(gpuVec2Plan());
  assert.equal(vector[0], "supported");
  assert.equal(vector[1].id, "moving-rect");
  assert.equal(vector[1].kernel[0], "tween");
  assert.deepEqual(vector[1].kernel[1].from, { x: 48, y: 80 });
  assert.deepEqual(vector[1].kernel[1].to, { x: 208, y: 120 });
  for (const plan of [track, vector]) assert.deepEqual(JSON.parse(JSON.stringify(plan)), plan);
});

test("组合和时间重映射明确回退 CPU，不误报为 GPU shader 能力", () => {
  const tag = (name) => core.init_tags([name])[name];
  const make = (type, fields) => core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([k, v]) => [tag(k), v]));
  const en = (type, name, ...values) => core._PCT__$o__$o_(type, tag(name), ...values);
  const scalar = (kind, ...values) =>
    make(motion.ScalarDescriptor, { id: "scalar", version: 1, motion: en(motion.ScalarMotion, kind, ...values) });
  const leaf = scalar("constant", 1);
  const composition = make(motion.ScalarComposition, {
    id: "product",
    version: 1,
    left: leaf,
    right: leaf,
    operation: en(motion.ScalarComposeOp, "multiply"),
  });
  for (const [descriptor, reason] of [
    [scalar("compose", composition), "scalar-composition-kernel-not-supported"],
    [scalar("at", leaf, leaf), "scalar-time-remap-kernel-not-supported"],
  ])
    assert.deepEqual(toJsData(lowerScalar(descriptor)), ["unsupported", reason]);
});
