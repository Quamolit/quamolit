import assert from "node:assert/strict";
import { test } from "node:test";
import * as table from "../target/js/table/quamolit.examples.table.mjs";
import {
  to_js_data,
  init_tags,
  CalcitSliceList,
  _$n_enum_$o_nth as enumNth,
  _PCT__$o__$o_ as enumNew,
} from "../target/js/table/calcit.core.mjs";
import { SceneContent, SceneInteraction } from "../target/js/table/quamolit.scene-ir.mjs";

const tags = init_tags([
  "nodes",
  "candidates",
  "content",
  "x",
  "y",
  "width",
  "height",
  "interaction",
  "rect",
  "target",
  "disabled",
]);

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

test("同次 Scene 的公共 HitPlan 符合历史九格范围，标签不遮挡且重复查询不改声明", () => {
  const document = table.scene_at(table.initial(), 4);
  const before = to_js_data(document);
  const plan = table.hit_plan(document);
  assert.equal(plan.get(tags.nodes), document.get(tags.nodes));
  assert.equal(plan.get(tags.candidates).len(), 9, "文字标签没有独立交互候选");
  const oracle = (x, y) => {
    for (let index = 0; index < 9; index++) {
      const cx = ((index % 3) - 1) * 200,
        cy = (Math.floor(index / 3) - 1) * 124;
      if (Math.abs(x - cx) <= 90 && Math.abs(y - cy) <= 52) return index;
    }
    return -1;
  };
  for (let index = 0; index < 9; index++) {
    const cx = table.cell_x(index),
      cy = table.cell_y(index);
    for (const dx of [-91, -90, -89.999, -76, 0, 89.999, 90, 91]) {
      for (const dy of [-53, -52, -51.999, 8, 51.999, 52, 53]) {
        assert.equal(table.hit_with_plan(plan, cx + dx, cy + dy), oracle(cx + dx, cy + dy));
      }
    }
  }
  assert.deepEqual(to_js_data(document), before);
  for (const [x, y] of [
    [NaN, 0],
    [0, Infinity],
    [-Infinity, 0],
  ])
    assert.throws(() => table.hit_with_plan(plan, x, y), /invalid-table-point/);
});

test("命中跟随实际 Scene 几何与层序，禁用不遮挡兄弟；旧九格坐标不能冒充当前计划", () => {
  const document = table.scene_at(table.initial(), -1);
  const nodes = document.get(tags.nodes);
  const moved = (node) =>
    node.assoc(
      tags.content,
      enumNew(
        SceneContent,
        tags.rect,
        enumNth(node.get(tags.content), 1)
          .assoc(tags.x, 500)
          .assoc(tags.y, 100)
          .assoc(tags.width, 80)
          .assoc(tags.height, 40),
      ),
    );
  const lower = moved(nodes.get(0)),
    upper = moved(nodes.get(8));
  const doc = (list) => document.assoc(tags.nodes, new CalcitSliceList(list));
  const forward = table.hit_plan(doc([lower, upper]));
  const reverse = table.hit_plan(doc([upper, lower]));
  assert.equal(table.hit_with_plan(forward, 540, 120), 4);
  assert.equal(table.hit_with_plan(reverse, 540, 120), 0);
  assert.equal(table.hit_at(540, 120), -1, "便利历史布局不能代替实际场景");
  assert.equal(table.hit_with_plan(forward, 0, 0), -1, "不能沿用旧几何位置");
  assert.equal(
    table.hit_with_plan(
      table.hit_plan(doc([lower, upper.assoc(tags.interaction, enumNew(SceneInteraction, tags.disabled))])),
      540,
      120,
    ),
    0,
  );
  assert.equal(
    table.hit_with_plan(
      table.hit_plan(doc([upper.assoc(tags.interaction, enumNew(SceneInteraction, tags.target, "external"))])),
      540,
      120,
    ),
    -1,
  );
  assert.equal(table.hit_with_plan(forward, 540, 120), 4, "新场景不改变已有计划");
});
