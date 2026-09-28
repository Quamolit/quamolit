import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/cohort-pulse/calcit.core.mjs";
import {
  active_$q_ as active,
  branch_at as branchAt,
  initial_switch as initialSwitch,
  position_at as positionAt,
  scene_at as sceneAt,
  set_switch as setSwitch,
} from "../target/js/cohort-pulse/quamolit.examples.cohort-pulse.mjs";
import { validate_scene as validateScene } from "../target/js/cohort-pulse/quamolit.scene-ir.mjs";

const frame = (filter, panel, time) => toJsData(sceneAt(filter, panel, time));
const node = (scene, id) => scene.nodes.find((entry) => entry.id === id);
const shape = (scene, id) => node(scene, id)?.content[1];
const rowCount = (scene) =>
  scene.nodes.filter((entry) => entry.id.startsWith("row-") && entry.id.endsWith("/card")).length;
const cellCount = (scene) => scene.nodes.filter((entry) => entry.id.startsWith("cell-")).length;

test("热力矩阵错峰进入，固定时间可乱序重放", () => {
  const filter = initialSwitch("cohort/filter", 0);
  const panel = initialSwitch("cohort/panel", 0);
  const start = frame(filter, panel, 0);
  const middle = frame(filter, panel, 0.45);
  const end = frame(filter, panel, 0.9);
  assert.equal(rowCount(start), 0);
  assert.equal(rowCount(middle), 6);
  assert.equal(cellCount(middle), 42);
  assert.ok(shape(middle, "cell-0-0").fill.a > 0);
  assert.equal(shape(middle, "cell-5-6").fill.a, 0);
  assert.equal(rowCount(end), 6);
  assert.equal(cellCount(end), 42);
  assert.ok(node(end, "summary/title"));
  assert.equal(new Set(end.nodes.map((entry) => entry.id)).size, end.nodes.length);
  assert.deepEqual(frame(filter, panel, 0.45), middle);
  for (const time of [0, 0.45, 0.9]) assert.ok(toJsData(validateScene(sceneAt(filter, panel, time))));
});

test("风险筛选退出安全行并重排保留行，中途反向位置连续", () => {
  const panel = initialSwitch("cohort/panel", 0);
  const initial = initialSwitch("cohort/filter", 0);
  const filtering = setSwitch(initial, 1, 1, 1);
  const halfway = positionAt(filtering, 1.5);
  const middle = frame(filtering, panel, 1.5);
  assert.equal(halfway, 0.5);
  assert.ok(node(middle, "row-0/card"));
  assert.equal(shape(middle, "row-1/card").y, -10);
  const reversing = setSwitch(filtering, 0, 1.5, 1);
  assert.equal(positionAt(reversing, 1.5), halfway);
  assert.equal(shape(frame(reversing, panel, 1.5), "row-1/card").y, shape(middle, "row-1/card").y);
  assert.ok(positionAt(reversing, 1.8) < halfway);
  assert.equal(positionAt(reversing, 2.5), 0);
  const settled = frame(filtering, panel, 2);
  assert.equal(rowCount(settled), 3);
  assert.equal(cellCount(settled), 21);
  assert.equal(node(settled, "row-0/card"), undefined);
  assert.equal(shape(settled, "row-1/card").y, -28);
  assert.equal(shape(settled, "row-3/card").y, 54);
  assert.equal(active(filtering, 2.0001), false);
  const branched = branchAt(reversing, 1.2);
  assert.equal(toJsData(branched).events.length, 0);
  assert.equal(positionAt(branched, 1.2), positionAt(reversing, 1.2));
});

test("摘要与详情独立交叉渐变，反复切换不累积场景节点", () => {
  const filter = initialSwitch("cohort/filter", 0);
  const summary = initialSwitch("cohort/panel", 0);
  const detail = setSwitch(summary, 1, 1, 0.75);
  const middle = frame(filter, detail, 1.375);
  assert.equal(positionAt(detail, 1.375), 0.5);
  assert.ok(node(middle, "summary/title"));
  assert.ok(node(middle, "detail/title"));
  const settled = frame(filter, detail, 1.75);
  assert.equal(node(settled, "summary/title"), undefined);
  assert.ok(node(settled, "detail/title"));
  let model = summary;
  for (let index = 0; index < 100; index++) {
    const at = 1 + index;
    model = setSwitch(model, index % 2 === 0 ? 1 : 0, at, 0.75);
    const scene = frame(filter, model, at + 0.7501);
    assert.equal(active(model, at + 0.7501), false);
    assert.equal(rowCount(scene), 6);
    assert.equal(cellCount(scene), 42);
  }
  assert.equal(toJsData(model).events.length, 100);
  assert.throws(() => setSwitch(model, 0.5, 102, 1));
  assert.throws(() => setSwitch(model, 1, 99, 1));
});
