import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/tidal-bloom/calcit.core.mjs";
import {
  point_at as pointAt,
  ring_color as ringColor,
  scene_at as sceneAt,
} from "../target/js/tidal-bloom/quamolit.examples.tidal-bloom.mjs";

test("潮汐花纹的每层组件由绝对时间确定，可乱序重放", () => {
  const first = toJsData(sceneAt(0));
  const middle = toJsData(sceneAt(18));
  const later = toJsData(sceneAt(42));
  assert.equal(first.nodes.length, 29);
  assert.deepEqual(
    first.nodes.map((node) => node.id),
    Array.from({ length: 29 }, (_, index) => `bloom-${index}`),
  );
  for (const node of first.nodes) {
    assert.equal(node.content[0], "polyline");
    assert.equal(node.content[1].points.length, 97);
    assert.deepEqual(node.content[1].points[0], node.content[1].points.at(-1), "花环必须闭合");
    for (const point of node.content[1].points) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    }
  }
  assert.notDeepEqual(first.nodes[0].content[1].points, middle.nodes[0].content[1].points);
  assert.notDeepEqual(middle.nodes[18].content[1].points, later.nodes[18].content[1].points);
  assert.deepEqual(toJsData(sceneAt(18)), middle);
  assert.deepEqual(toJsData(sceneAt(0)), first);
});

test("曲线点与色彩维持有限值和合法通道", () => {
  assert.deepEqual(toJsData(pointAt(0, 0, 0)), { x: 60, y: 0 });
  for (const time of [0, 0.25, 18, 42, 72, 120]) {
    for (const ring of [0, 7, 14, 21, 28]) {
      const color = toJsData(ringColor(ring, time));
      for (const channel of [color.r, color.g, color.b, color.a]) {
        assert.ok(Number.isFinite(channel) && channel >= 0 && channel <= 1);
      }
    }
  }
});
