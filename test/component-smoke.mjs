import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../js-out-component/calcit.core.mjs";
import { scene_at as sceneAt } from "../js-out-component/quamolit.test.component-fixture.mjs";

function rectAt(time, model = 40, ready = false, viewport = 100) {
  const scene = toJsData(sceneAt(time, model, ready, viewport));
  assert.equal(scene.nodes.length, 1);
  assert.equal(scene.nodes[0].content[0], "rect");
  return scene.nodes[0].content[1];
}

test("声明式组件可乱序采样，且完整输入在同一时间失效", () => {
  assert.deepEqual([1, 0, 0.5, 0.25, 1].map((time) => rectAt(time).x), [120, 80, 100, 90, 120]);
  assert.equal(rectAt(0.5).y, 62);
  assert.equal(rectAt(0.5, 41).y, 63);
  assert.equal(rectAt(0.5, 40, true).fill.g, 0.7);
  assert.equal(rectAt(0.5, 40, false, 110).width, 11);
  assert.deepEqual(JSON.parse(JSON.stringify(toJsData(sceneAt(0.5, 40, false, 100)))), toJsData(sceneAt(0.5, 40, false, 100)));
});
