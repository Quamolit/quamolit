import assert from "node:assert/strict";
import { test } from "node:test";
import * as table from "../target/js/table/quamolit.examples.table.mjs";
import { to_js_data } from "../target/js/table/calcit.core.mjs";

test("九格 Calcit 文本更新与场景身份", () => {
  const initial = table.initial();
  assert.deepEqual(to_js_data(initial), ["第一格", "", "", "", "", "", "", "", ""]);
  const edited = table.set_cell(initial, 4, "你好，世界");
  assert.equal(table.cell_text(edited, 4), "你好，世界");
  assert.equal(table.cell_text(initial, 4), "");
  const scene = to_js_data(table.scene_at(edited, 4));
  assert.equal(scene.nodes.length, 18);
  assert.deepEqual(
    scene.nodes.map((node) => node.id),
    Array.from({ length: 9 }, (_, i) => [`cell-${i}`, `cell-${i}/label`]).flat(),
  );
  assert.equal(scene.nodes[9].content[1].text, "你好，世界");
});

test("九格命中与非法输入", () => {
  for (let index = 0; index < 9; index++) assert.equal(table.hit_at(table.cell_x(index), table.cell_y(index)), index);
  assert.equal(table.hit_at(500, 500), -1);
  assert.throws(() => table.hit_at(Infinity, 0));
  assert.throws(() => table.set_cell(table.initial(), -1, "bad"));
  assert.throws(() => table.set_cell(table.initial(), 9, "bad"));
});
