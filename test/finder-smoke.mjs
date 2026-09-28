import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as data } from "../target/js/finder/calcit.core.mjs";
import * as finder from "../target/js/finder/quamolit.examples.finder.mjs";

const scene = (model, time) => data(finder.scene_at(model, time)).nodes;

test("五个旧文件夹及中文植物卡片，展开/聚焦/返回具有稳定身份", () => {
  const start = finder.initial();
  assert.deepEqual(
    scene(start, 0).map((node) => node.id),
    [
      "folder-0",
      "folder-0/label",
      "folder-1",
      "folder-1/label",
      "folder-2",
      "folder-2/label",
      "folder-3",
      "folder-3/label",
      "folder-4",
      "folder-4/label",
    ],
  );
  const open = finder.select_folder(start, 0, 0);
  assert.equal(finder.folder_value(open, 0.42), 1);
  assert.equal(scene(open, 0.42).length, 18);
  assert.deepEqual(
    scene(open, 0.42)
      .filter((node) => node.id.startsWith("card-") && !node.id.endsWith("/label"))
      .map((node) => node.content[0]),
    ["rect", "rect", "rect", "rect"],
  );
  assert.equal(data(finder.hit_at(start, 0, -340, -20)).kind, "folder");
  assert.deepEqual(data(finder.hit_at(open, 0.42, -245, -120)), { kind: "card", folder: 0, card: 0 });
  const focused = finder.select_card(open, 0, 0.42);
  assert.equal(finder.card_value(focused, 0.78), 1);
  const card = scene(focused, 0.78).find((node) => node.id === "card-0/0");
  assert.equal(card.content[1].width, 690);
  assert.equal(card.content[1].height, 446);
  assert.equal(data(finder.hit_at(focused, 0.78, 400, 200)).kind, "back");
});

test("卡片文字随矩形共用局部缩放，所有中间帧均位于父卡片内", () => {
  for (let folder = 0; folder < 5; folder++) {
    const open = finder.select_folder(finder.initial(), folder, 0);
    const focused = finder.select_card(open, 0, 0.42);
    for (const time of [0.42, 0.51, 0.6, 0.78]) {
      const nodes = scene(focused, time);
      for (const node of nodes.filter((item) => /^card-\d+\/\d+$/.test(item.id))) {
        const rect = node.content[1];
        const label = nodes.find((item) => item.id === `${node.id}/label`).content[1];
        assert.ok(Math.abs(label.size / rect.width - 18 / 150) < 1e-9, `${node.id} t=${time}: 字号须跟随卡片缩放`);
        assert.ok(label.x >= rect.x, `${node.id} t=${time}: 文字左端越界`);
        assert.ok(
          label.x + label.text.length * label.size <= rect.x + rect.width,
          `${node.id} t=${time}: 文字右端越界`,
        );
        assert.ok(
          label.y - label.size >= rect.y && label.y <= rect.y + rect.height,
          `${node.id} t=${time}: 文字纵向越界`,
        );
      }
    }
  }
});

test("五组文件夹展开与收起时，内部卡片始终位于文件夹矩形内", () => {
  for (let folder = 0; folder < 5; folder++) {
    const opening = finder.select_folder(finder.initial(), folder, 0);
    const closing = finder.back(opening, 0.21);
    for (const [model, times] of [
      [opening, [0, 0.04, 0.11, 0.21, 0.32, 0.42]],
      [closing, [0.21, 0.26, 0.38, 0.52, 0.63]],
    ]) {
      for (const time of times) {
        const nodes = scene(model, time);
        const parent = nodes.find((node) => node.id === `folder-${folder}`).content[1];
        for (const node of nodes.filter(
          (item) => item.id.startsWith(`card-${folder}/`) && !item.id.endsWith("/label"),
        )) {
          const card = node.content[1];
          const epsilon = 1e-7;
          assert.ok(card.x >= parent.x - epsilon, `${node.id} t=${time}: 左边越界`);
          assert.ok(card.x + card.width <= parent.x + parent.width + epsilon, `${node.id} t=${time}: 右边越界`);
          assert.ok(card.y >= parent.y - epsilon, `${node.id} t=${time}: 上边越界`);
          assert.ok(card.y + card.height <= parent.y + parent.height + epsilon, `${node.id} t=${time}: 下边越界`);
        }
      }
    }
  }
});

test("返回、快速重入和跨项切换都从各自当前采样值接续", () => {
  const open = finder.select_folder(finder.initial(), 0, 0);
  const partial = finder.folder_value(open, 0.16);
  const closing = finder.back(open, 0.16);
  assert.equal(finder.folder_value(closing, 0.16), partial);
  const folderFocus = finder.folder_value(closing, 0.24);
  assert.equal(data(finder.hit_at(closing, 0.24, -340 * (1 - folderFocus), -20 * (1 - folderFocus))).kind, "folder");
  const reopened = finder.select_folder(closing, 0, 0.24);
  assert.equal(finder.folder_value(reopened, 0.24), finder.folder_value(closing, 0.24));
  assert.equal(finder.folder_value(reopened, 0.66), 1);
  const beforeFolderSwitch = scene(reopened, 0.3);
  const switchedFolder = finder.select_folder(reopened, 1, 0.3);
  assert.deepEqual(scene(switchedFolder, 0.3), beforeFolderSwitch, "切换文件夹的事件帧不跳变");
  assert.ok(finder.folder_item_value(switchedFolder, 0, 0.42) > 0, "旧文件夹继续退出");
  assert.ok(finder.folder_item_value(switchedFolder, 1, 0.42) > 0, "新文件夹同时进入");
  const switchedAgain = finder.select_folder(switchedFolder, 2, 0.42);
  assert.deepEqual(scene(switchedAgain, 0.42), scene(switchedFolder, 0.42), "连续切换仍保持完整 Scene 连续");
  const focused = finder.select_card(reopened, 1, 0.66);
  const cardPartial = finder.card_value(focused, 0.76);
  const cardClosing = finder.back(focused, 0.76);
  assert.equal(finder.card_value(cardClosing, 0.76), cardPartial);
  const cardFocus = finder.card_value(cardClosing, 0.84);
  assert.equal(
    data(finder.hit_at(cardClosing, 0.84, finder.card_x(1) * (1 - cardFocus), finder.card_y(1) * (1 - cardFocus))).kind,
    "card",
  );
  const beforeCardSwitch = scene(cardClosing, 0.84);
  const cardSwitched = finder.select_card(cardClosing, 2, 0.84);
  assert.deepEqual(scene(cardSwitched, 0.84), beforeCardSwitch, "切换卡片的事件帧不跳变");
  assert.ok(finder.card_item_value(cardSwitched, 0, 1, 0.96) > 0, "旧卡片继续退出");
  assert.ok(finder.card_item_value(cardSwitched, 0, 2, 0.96) > 0, "新卡片同时进入");
  assert.equal(finder.card_value(cardSwitched, 1.2), 1);
});

test("点击日志任意时间重放，历史分支可裁剪", () => {
  const log = finder.demo_log();
  const start = data(finder.replay(log, 0));
  const later = data(finder.replay(log, 2.85));
  assert.equal(later.folder, 3);
  assert.equal(later.card, 2);
  assert.deepEqual(data(finder.replay(log, 0)), start);
  assert.deepEqual(data(finder.replay(log, 2.85)), later);
  assert.equal(data(finder.events_through(log, 1.3)).length, 3);
  const branch = finder.append_event(finder.events_through(log, 1.3), 1.3, "back", 0, -1);
  assert.equal(data(branch).length, 4);
  assert.throws(() => finder.append_event(log, -1, "back", 0, -1), /invalid-finder-time/);
});

test("跨文件夹和卡片的快速切换可以由同一输入日志乱序重放", () => {
  let log = finder.empty_events();
  for (const event of [
    [0, "folder", 0, -1],
    [0.42, "back", 0, -1],
    [0.56, "folder", 1, -1],
    [0.98, "card", 1, 0],
    [1.34, "back", 1, -1],
    [1.46, "card", 1, 1],
  ]) {
    log = finder.append_event(log, ...event);
  }
  const folderMiddle = finder.replay(log, 0.72);
  const folderValues = data(finder.folder_values(folderMiddle, 0.72));
  assert.ok(folderValues[0] > 0 && folderValues[1] > 0, "日志重放保留文件夹交叉出入");
  const cardMiddle = finder.replay(log, 1.59);
  const cardValues = data(finder.card_values(cardMiddle, 1.59));
  assert.ok(cardValues[4] > 0 && cardValues[5] > 0, "日志重放保留卡片交叉出入");
  assert.deepEqual(data(finder.scene_at(finder.replay(log, 0.72), 0.72)), data(finder.scene_at(folderMiddle, 0.72)));
  assert.deepEqual(data(finder.scene_at(finder.replay(log, 1.59), 1.59)), data(finder.scene_at(cardMiddle, 1.59)));
});
