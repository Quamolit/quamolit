import assert from "node:assert/strict";
import { test } from "node:test";
import * as drag from "../target/js/drag-demo/quamolit.examples.drag-demo.mjs";
import { to_js_data, init_tags } from "../target/js/drag-demo/calcit.core.mjs";

test("Calcit 拖动状态保持锚点，非拥有者不能移动或释放", () => {
  const start = drag.initial();
  assert.equal(drag.hit_at(start, 0, 0), "rect");
  assert.equal(drag.hit_at(start, 100, 40), "slider");
  assert.equal(drag.hit_at(start, -300, 0), "none");
  const down = drag.begin_pointer(start, 7, 12, 8);
  assert.equal(to_js_data(down).kind, "rect");
  assert.deepEqual(to_js_data(drag.move_pointer(down, 8, 200, 100)), to_js_data(down));
  const moved = drag.move_pointer(down, 7, 200, 100);
  assert.deepEqual([to_js_data(moved).x, to_js_data(moved).y], [188, 92]);
  assert.equal(to_js_data(drag.end_pointer(moved, 8)).pointer, 7);
  const end = drag.end_pointer(moved, 7);
  assert.equal(to_js_data(end).pointer, -1);
  assert.equal(to_js_data(end).kind, "none");
  assert.deepEqual(to_js_data(drag.end_pointer(end, 7)), to_js_data(end));
  assert.deepEqual(to_js_data(start), to_js_data(drag.initial()));
});

test("滑块沿原 0.2 单位映射，并在 -4 至 40 夹取；Scene 身份稳定", () => {
  const start = drag.initial(),
    down = drag.begin_pointer(start, 2, 100, 40);
  assert.equal(to_js_data(drag.move_pointer(down, 2, 150, 40)).value, 20);
  assert.equal(to_js_data(drag.move_pointer(down, 2, 500, 40)).value, 40);
  assert.equal(to_js_data(drag.move_pointer(down, 2, -500, 40)).value, -4);
  const nodes = to_js_data(drag.scene_at(start)).nodes;
  assert.deepEqual(
    nodes.map((node) => node.id),
    ["drag-rect", "slider-track", "slider-knob", "slider-label"],
  );
  assert.deepEqual(
    to_js_data(drag.scene_at(drag.move_pointer(down, 2, 150, 40))).nodes.map((node) => node.id),
    nodes.map((node) => node.id),
  );
  assert.throws(() => drag.hit_at(start, NaN, 0));
  assert.throws(() => drag.begin_pointer(start, -1, 0, 0));
});

test("禁用交互只屏蔽目标，不删除或简化原有图形", () => {
  const tags = init_tags(["enabled?"]),
    enabled = drag.initial(),
    disabled = enabled.assoc(tags["enabled?"], false);
  assert.equal(drag.hit_at(disabled, 0, 0), "none");
  assert.equal(drag.hit_at(disabled, 100, 40), "none");
  assert.equal(drag.begin_pointer(disabled, 7, 0, 0), disabled);
  const before = to_js_data(drag.scene_at(enabled)).nodes;
  const after = to_js_data(drag.scene_at(disabled)).nodes;
  assert.deepEqual(
    after.map((node) => node.interaction),
    before.map(() => ["disabled"]),
  );
  assert.deepEqual(
    after.map(({ interaction, ...node }) => node),
    before.map(({ interaction, ...node }) => node),
  );
});
