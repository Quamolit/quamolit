import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/curve/calcit.core.mjs";
import {
  curve_points as curvePoints,
  sampled_curve_points as sampledCurvePoints,
  scene_at as sceneAt,
} from "../target/js/curve/quamolit.examples.curve.mjs";

test("32 段闭合曲线顶点数固定且只由绝对时间决定", () => {
  assert.equal(toJsData(curvePoints(0)).length, 98, "首尾闭合的 1 + 32 * 3 + 1 个控制点");
  assert.equal(toJsData(curvePoints(5)).length, 98);
  assert.deepEqual(toJsData(curvePoints(3)), toJsData(curvePoints(3)), "重复采样一致");
  assert.notDeepEqual(toJsData(curvePoints(0)), toJsData(curvePoints(50)), "旋转随时间改变顶点");
});

test("Scene 保留 32 段三次贝塞尔轮廓，不把控制点直接连成尖角", () => {
  const scene = toJsData(sceneAt(30));
  const controls = toJsData(curvePoints(30));
  const sampled = toJsData(sampledCurvePoints(30));
  assert.equal(scene.nodes.length, 1);
  assert.equal(scene.nodes[0].content[0], "polyline");
  assert.equal(sampled.length, 1 + 32 * 16);
  assert.deepEqual(scene.nodes[0].content[1].points, sampled);
  assert.notDeepEqual(sampled, controls);
  for (let segment = 0; segment < 32; segment += 1) {
    const [p0, p1, p2, p3] = controls.slice(segment * 3, segment * 3 + 4);
    const actualEnd = sampled[(segment + 1) * 16];
    assert.ok(Math.hypot(actualEnd.x - p3.x, actualEnd.y - p3.y) < 1e-9);
    const u = 0.5,
      v = 1 - u;
    const expected = {
      x: v ** 3 * p0.x + 3 * v ** 2 * u * p1.x + 3 * v * u ** 2 * p2.x + u ** 3 * p3.x,
      y: v ** 3 * p0.y + 3 * v ** 2 * u * p1.y + 3 * v * u ** 2 * p2.y + u ** 3 * p3.y,
    };
    const midpoint = sampled[segment * 16 + 8];
    assert.ok(Math.hypot(midpoint.x - expected.x, midpoint.y - expected.y) < 1e-9);
  }
});
