import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/fade/calcit.core.mjs";
import {
  enter_opacity_at as enterOpacityAt,
  exit_opacity_at as exitOpacityAt,
  interrupt_opacity_at as interruptOpacityAt,
  enter_scene_at as enterSceneAt,
  exit_scene_at as exitSceneAt,
  gpu_enter_plan as gpuEnterPlan,
} from "../target/js/fade/quamolit.test.fade-migration-fixture.mjs";

test("旧 fade 的 v=4 对应显式 0.25 秒进入、退出和打断连续性", () => {
  for (const [time, value] of [[0, 0], [0.0625, 0.25], [0.125, 0.5], [0.25, 1], [1, 1]]) {
    assert.equal(enterOpacityAt(time), value);
  }
  for (const [time, value] of [[0.5, 1], [0.5625, 0.75], [0.625, 0.5], [0.75, 0]]) {
    assert.equal(exitOpacityAt(time), value);
  }
  assert.equal(interruptOpacityAt(0.125), enterOpacityAt(0.125));
  assert.equal(interruptOpacityAt(0.25), 0.25);
  assert.equal(interruptOpacityAt(0.375), 0);
  assert.throws(() => enterOpacityAt(Number.NaN));
});

test("fade 迁移 Scene 与受限 GPU 候选计划可序列化", () => {
  const entering = toJsData(enterSceneAt(0.125));
  const exiting = toJsData(exitSceneAt(0.625));
  assert.equal(entering.nodes.length, 2);
  assert.equal(entering.nodes[0].content[1].opacity, 0.5);
  assert.equal(exiting.nodes[0].content[1].opacity, 0.5);
  assert.equal(entering.nodes[0].bindings[0].version, 1);
  assert.equal(exiting.nodes[0].bindings[0].version, 2);
  const plan = toJsData(gpuEnterPlan());
  assert.equal(plan[0], "supported");
  assert.equal(plan[1].id, "fade-alpha");
  assert.equal(plan[1].kernel[0], "tween");
  assert.equal(plan[1].kernel[1].duration, 0.25);
  for (const wire of [entering, exiting, plan]) assert.deepEqual(JSON.parse(JSON.stringify(wire)), wire);
});
