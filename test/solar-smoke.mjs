import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/solar/calcit.core.mjs";
import { circle_points as circlePoints, scene_at as sceneAt } from "../target/js/solar/quamolit.examples.solar.mjs";

test("五层递归轨道保留稳定身份、圆环数和闭合顶点", () => {
  const scene = toJsData(sceneAt(0));
  assert.equal(scene.nodes.length, 10);
  assert.deepEqual(scene.nodes.map(node => node.id), Array.from({ length: 5 }, (_, level) => [`solar-large-${level}`, `solar-small-${level}`]).flat());
  for (const node of scene.nodes) {
    assert.equal(node.content[0], "polyline");
    const points = node.content[1].points;
    assert.equal(points.length, 49);
    assert.deepEqual(points[0], points.at(-1));
  }
  assert.deepEqual(toJsData(circlePoints(0, 0, 60))[0], { x: 60, y: 0 });
  assert.deepEqual(scene.nodes[1].content[1].points[0], { x: 130, y: -40 });
  assert.deepEqual(scene.nodes[2].content[1].points[0], { x: 192, y: 24 }, "递归偏移受 0.6 倍缩放约束");
});

test("绝对时间可乱序重复采样，不依赖上一帧", () => {
  const initial = toJsData(sceneAt(0));
  const later = toJsData(sceneAt(3));
  assert.notDeepEqual(later.nodes[1].content[1].points, initial.nodes[1].content[1].points);
  assert.deepEqual(toJsData(sceneAt(0)), initial);
  assert.deepEqual(toJsData(sceneAt(3)), later);
});
