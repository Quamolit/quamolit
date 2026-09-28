import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/signal-weave/calcit.core.mjs";
import {
  active_$q_ as active,
  branch_at as branchAt,
  initial_model as initialModel,
  position_at as positionAt,
  scene_at as sceneAt,
  set_mode as setMode,
} from "../target/js/signal-weave/quamolit.examples.signal-weave.mjs";
import { validate_scene as validateScene } from "../target/js/signal-weave/quamolit.scene-ir.mjs";

const frame = (model, time) => toJsData(sceneAt(model, time));
const node = (scene, id) => scene.nodes.find((entry) => entry.id === id);
const shape = (scene, id) => node(scene, id).content[1];

test("折线逐段增长时面积与标记共享端点，任意时间可乱序采样", () => {
  const model = initialModel(0);
  const start = frame(model, 0);
  const middle = frame(model, 0.45);
  const end = frame(model, 1.2);
  assert.equal(shape(start, "signal-line").points.length, 2);
  assert.equal(shape(middle, "signal-line").points.length, 5);
  assert.equal(shape(end, "signal-line").points.length, 12);
  for (const scene of [start, middle, end]) {
    const points = shape(scene, "signal-line").points;
    const area = shape(scene, "signal-area").points;
    const last = points.at(-1);
    const marker = shape(scene, "signal-marker");
    assert.equal(area.length, points.length + 2);
    assert.deepEqual(area.slice(1, -1), points);
    assert.equal(area[0].y, 190);
    assert.equal(area.at(-1).y, 190);
    assert.equal(marker.x + 5, last.x);
    assert.equal(marker.y + 5, last.y);
    assert.equal(new Set(scene.nodes.map((entry) => entry.id)).size, scene.nodes.length);
  }
  assert.equal(shape(end, "signal-line").points.at(-1).y, 72);
  assert.equal(node(start, "forecast/card"), undefined);
  assert.ok(node(end, "forecast/card"));
  assert.deepEqual(frame(model, 0.45), middle);
  for (const time of [0, 0.45, 1.2]) assert.ok(toJsData(validateScene(sceneAt(model, time))));
});

test("活动情境可中途反向，曲线与指标位置连续且事件前缀可重放", () => {
  const initial = initialModel(0);
  const entering = setMode(initial, 1, 1.2);
  const halfway = positionAt(entering, 1.75);
  assert.equal(halfway, 0.5);
  assert.equal(shape(frame(entering, 1.75), "signal-line").points.at(-1).y, 55);
  const reversing = setMode(entering, 0, 1.75);
  assert.equal(positionAt(reversing, 1.75), halfway);
  assert.deepEqual(frame(reversing, 1.4), frame(entering, 1.4));
  assert.ok(positionAt(reversing, 2.05) < halfway);
  assert.equal(positionAt(reversing, 2.85), 0);
  assert.equal(active(reversing, 2.85), false);
  const complete = frame(entering, 2.3);
  assert.equal(shape(complete, "signal-line").points.at(-1).y, 38);
  assert.equal(shape(complete, "baseline-line").stroke.a, 0.55);
  assert.equal(shape(complete, "kpi-a-value").text, "32280");
  const branched = branchAt(reversing, 1.4);
  assert.equal(positionAt(branched, 1.4), positionAt(reversing, 1.4));
  assert.equal(toJsData(branched).events.length, 0);
  assert.equal(positionAt(setMode(branched, 1, 1.4), 1.4), positionAt(branched, 1.4));
  assert.throws(() => setMode(reversing, 0.5, 3));
  assert.throws(() => setMode(reversing, 1, 1.5));
});

test("一百次情境往返不增加节点，终点停帧；分享位置无需事件日志", () => {
  let model = initialModel(0);
  for (let index = 0; index < 100; index++) {
    model = setMode(model, index % 2 === 0 ? 1 : 0, 1.2 + index * 1.1);
    const settledAt = 2.300001 + index * 1.1;
    const scene = frame(model, settledAt);
    assert.equal(scene.nodes.length, 41);
    assert.equal(active(model, settledAt), false);
    assert.equal(positionAt(model, settledAt), index % 2 === 0 ? 1 : 0);
  }
  assert.equal(toJsData(model).events.length, 100);
  assert.deepEqual(frame(initialModel(0.42), 2), frame(initialModel(0.42), 4));
});
