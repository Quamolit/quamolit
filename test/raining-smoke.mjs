import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as data } from "../target/js/raining/calcit.core.mjs";
import { scene_at as sceneAt } from "../target/js/raining/quamolit.examples.raining.mjs";

const nodes = (seed, tick) => data(sceneAt(seed, tick)).nodes;

test("固定 seed/tick 可乱序、重置和重放，雨滴数有界", () => {
  const initial = nodes(17, 0);
  const middle = nodes(17, 75);
  const later = nodes(17, 120);
  assert.ok(initial.length > 0 && initial.length <= 48);
  assert.notDeepEqual(middle, initial);
  assert.notDeepEqual(later, initial);
  assert.deepEqual(nodes(17, 0), initial);
  assert.deepEqual(nodes(17, 120), later);
  assert.notDeepEqual(nodes(18, 0), initial);
  for (let tick = 0; tick <= 900; tick++) {
    const frame = nodes(17, tick);
    assert.ok(frame.length <= 48, `tick ${tick}: ${frame.length}`);
    assert.equal(new Set(frame.map(node => node.id)).size, frame.length);
  }
});

test("同一雨滴从下落到落地水花再消失，下一轮生成新身份", () => {
  const rain = nodes(17, 74).find(node => node.id === "rain-0/0");
  const splash = nodes(17, 75).find(node => node.id === "rain-0/0");
  assert.equal(rain.content[1].height, 30);
  assert.equal(splash.content[1].height, 5);
  assert.equal(splash.content[1].y, 200);
  assert.ok(!nodes(17, 86).some(node => node.id === "rain-0/0"));
  assert.ok(nodes(17, 120).some(node => node.id === "rain-0/1"));
});
