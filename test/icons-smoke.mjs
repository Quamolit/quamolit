import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as data } from "../target/js/icons/calcit.core.mjs";
import {
  initial,
  increase,
  toggle_play as togglePlay,
  count_value as countValue,
  play_value as playValue,
  scene_at as sceneAt,
  hit_target as hitTarget,
} from "../target/js/icons/quamolit.examples.icons.mjs";

test("两组图标有稳定身份和可采样的几何/文字", () => {
  const start = initial();
  const initialScene = data(sceneAt(start, 0));
  assert.deepEqual(
    initialScene.nodes.map((node) => node.id),
    ["increase-bg", "play-bg", "plus-h", "plus-v", "count-old", "count-new", "play-left", "play-right"],
  );
  assert.deepEqual(
    initialScene.nodes.map((node) => node.content[0]),
    ["rect", "rect", "polyline", "polyline", "text", "text", "polygon", "polygon"],
  );
  assert.deepEqual(
    initialScene.nodes.slice(-2).map((node) => node.content[1].fill),
    [
      { r: 0.4, g: 0.8, b: 0.4, a: 1 },
      { r: 0.4, g: 0.8, b: 0.4, a: 1 },
    ],
  );
  const initialText = initialScene.nodes.slice(4, 6).map((node) => node.content[1]);
  assert.deepEqual(
    initialText.map(({ text, y, fill }) => ({ text, y, alpha: fill.a })),
    [
      { text: "1", y: 10, alpha: 1 },
      { text: "2", y: -8, alpha: 0 },
    ],
    "历史版本初始显示 1，并把下一数字放在上方",
  );
  const next = increase(start, 0);
  assert.equal(countValue(next, 0), 0);
  assert.equal(countValue(next, 0.25), 1);
  const overlap = data(sceneAt(next, 0.125))
    .nodes.slice(4, 6)
    .map((node) => node.content[1]);
  assert.deepEqual(
    overlap.map(({ text, y, fill }) => ({ text, y, alpha: fill.a })),
    [
      { text: "1", y: 19, alpha: 0.5 },
      { text: "2", y: 1, alpha: 0.5 },
    ],
    "中间帧保留上下相向运动和等权重叠",
  );
  assert.notDeepEqual(data(sceneAt(next, 0)).nodes[2].content, data(sceneAt(next, 0.14)).nodes[2].content);
  assert.deepEqual(data(sceneAt(next, 0.14)), data(sceneAt(next, 0.14)));

  const playMiddle = data(sceneAt(togglePlay(start, 0), 1 / 12)).nodes.slice(-2);
  assert.deepEqual(
    playMiddle.map((node) => node.content[1].points),
    [
      [
        { x: 180, y: -20 },
        { x: 180, y: 20 },
        { x: 197.5, y: 15 },
        { x: 197.5, y: -15 },
      ],
      [
        { x: 202.5, y: -15 },
        { x: 220, y: -10 },
        { x: 220, y: 10 },
        { x: 202.5, y: 15 },
      ],
    ],
    "播放图标在历史 1/12 秒中间帧保留两条四点路径",
  );
});

test("连续加一与播放反转从当前采样值打断，不依赖上一帧", () => {
  const first = increase(initial(), 0);
  const before = countValue(first, 0.1);
  const sceneBefore = data(sceneAt(first, 0.1));
  const second = increase(first, 0.1);
  assert.equal(data(second).count, 2);
  assert.equal(countValue(second, 0.1), before);
  assert.deepEqual(data(sceneAt(second, 0.1)), sceneBefore, "快速加一不会替换正在重叠的数字");
  assert.equal(countValue(second, 0.38), 2);
  const playing = togglePlay(second, 0.1);
  const shapeBefore = playValue(playing, 0.2);
  const paused = togglePlay(playing, 0.2);
  assert.equal(playValue(paused, 0.2), shapeBefore);
  assert.equal(playValue(paused, 0.38), 0);
  assert.deepEqual(data(sceneAt(paused, 0.38)), data(sceneAt(paused, 0.38)));
});

test("画布卡片命中区域由 Calcit 定义", () => {
  assert.equal(hitTarget(-200, 0), "increase");
  assert.equal(hitTarget(200, 0), "play");
  assert.equal(hitTarget(0, 0), "none");
  assert.equal(hitTarget(-200, 31), "none");
  assert.throws(() => hitTarget(Number.NaN, 0), /invalid-icon-hit-x/);
});
