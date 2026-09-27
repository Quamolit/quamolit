import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as data } from "../target/js/icons/calcit.core.mjs";
import { initial, increase, toggle_play as togglePlay, count_value as countValue, play_value as playValue, scene_at as sceneAt } from "../target/js/icons/quamolit.examples.icons.mjs";

test("两组图标有稳定身份和可采样的几何/文字", () => {
  const start = initial();
  const initialScene = data(sceneAt(start, 0));
  assert.deepEqual(initialScene.nodes.map(node => node.id), ["increase-bg", "play-bg", "plus-h", "plus-v", "count-old", "count-new", "play-left", "play-right"]);
  assert.deepEqual(initialScene.nodes.map(node => node.content[0]), ["rect", "rect", "polyline", "polyline", "text", "text", "polygon", "polygon"]);
  assert.deepEqual(initialScene.nodes.slice(-2).map(node => node.content[1].fill), [
    { r: 0.4, g: 0.8, b: 0.4, a: 1 }, { r: 0.4, g: 0.8, b: 0.4, a: 1 },
  ]);
  const next = increase(start, 0);
  assert.equal(countValue(next, 0), 0);
  assert.equal(countValue(next, 0.28), 1);
  assert.notDeepEqual(data(sceneAt(next, 0)).nodes[2].content, data(sceneAt(next, 0.14)).nodes[2].content);
  assert.deepEqual(data(sceneAt(next, 0.14)), data(sceneAt(next, 0.14)));
});

test("连续加一与播放反转从当前采样值打断，不依赖上一帧", () => {
  const first = increase(initial(), 0);
  const before = countValue(first, 0.1);
  const second = increase(first, 0.1);
  assert.equal(data(second).count, 2);
  assert.equal(countValue(second, 0.1), before);
  assert.equal(countValue(second, 0.38), 2);
  const playing = togglePlay(second, 0.1);
  const shapeBefore = playValue(playing, 0.2);
  const paused = togglePlay(playing, 0.2);
  assert.equal(playValue(paused, 0.2), shapeBefore);
  assert.equal(playValue(paused, 0.38), 0);
  assert.deepEqual(data(sceneAt(paused, 0.38)), data(sceneAt(paused, 0.38)));
});
