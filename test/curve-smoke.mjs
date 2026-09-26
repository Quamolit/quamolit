import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/curve/calcit.core.mjs";
import { curve_points as curvePoints, scene_at as sceneAt } from "../target/js/curve/quamolit.examples.curve.mjs";

test("32 段闭合曲线顶点数固定且只由绝对时间决定", () => {
  assert.equal(toJsData(curvePoints(0)).length, 98, "首尾闭合的 1 + 32 * 3 + 1 个控制点");
  assert.equal(toJsData(curvePoints(5)).length, 98);
  assert.deepEqual(toJsData(curvePoints(3)), toJsData(curvePoints(3)), "重复采样一致");
  assert.notDeepEqual(toJsData(curvePoints(0)), toJsData(curvePoints(50)), "旋转随时间改变顶点");
});

test("Scene 为单条折线，顶点与曲线采样一致", () => {
  const scene = toJsData(sceneAt(30));
  assert.equal(scene.nodes.length, 1);
  assert.equal(scene.nodes[0].content[0], "polyline");
  assert.deepEqual(scene.nodes[0].content[1].points, toJsData(curvePoints(30)));
});
