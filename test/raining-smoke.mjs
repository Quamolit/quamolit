import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as data } from "../target/js/raining/calcit.core.mjs";
import { scene_at as sceneAt } from "../target/js/raining/quamolit.examples.raining.mjs";

const nodes = (seed, tick) => data(sceneAt(seed, tick)).nodes;

test("固定 seed/tick 可乱序、重置和重放，雨滴数有界", () => {
  const initial = nodes(17, 0);
  const middle = nodes(17, 75);
  const later = nodes(17, 120);
  assert.ok(initial.length > 200 && initial.length <= 384, "保留旧版持续生成雨滴后的高密度画面");
  assert.notDeepEqual(middle, initial);
  assert.notDeepEqual(later, initial);
  assert.deepEqual(nodes(17, 0), initial);
  assert.deepEqual(nodes(17, 120), later);
  assert.notDeepEqual(nodes(18, 0), initial);
  for (let tick = 0; tick <= 900; tick++) {
    const frame = nodes(17, tick);
    assert.ok(frame.length <= 384, `tick ${tick}: ${frame.length}`);
    assert.equal(new Set(frame.map(node => node.id)).size, frame.length);
  }
});

test("同一雨滴从下落到落地水花再消失，下一轮生成新身份", () => {
  const rain = nodes(17, 74).find(node => node.id === "rain-0/0");
  const splash = nodes(17, 100).find(node => node.id === "rain-0/0");
  assert.equal(rain.content[1].height, 30);
  assert.ok(splash.content[1].height >= 0 && splash.content[1].height < 6);
  assert.ok(splash.content[1].width > 0 && splash.content[1].width < 200);
  assert.ok(splash.content[1].fill.a >= 0 && splash.content[1].fill.a < 0.5);
  assert.ok(splash.content[1].y >= 160 && splash.content[1].y <= 200);
  assert.notEqual(nodes(17, 101).find(node => node.id === "rain-0/0").content[1].width, splash.content[1].width, "水花宽度逐 tick 变化");
  assert.ok(!nodes(17, 120).some(node => node.id === "rain-0/0"));
  assert.ok(nodes(17, 180).some(node => node.id === "rain-0/1"));
});
