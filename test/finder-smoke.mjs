import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as data } from "../target/js/finder/calcit.core.mjs";
import * as finder from "../target/js/finder/quamolit.examples.finder.mjs";

const scene = (model, time) => data(finder.scene_at(model, time)).nodes;

test("五个旧文件夹及中文植物卡片，展开/聚焦/返回具有稳定身份", () => {
  const start = finder.initial();
  assert.deepEqual(scene(start, 0).map(node => node.id), [
    "folder-0", "folder-0/label", "folder-1", "folder-1/label", "folder-2", "folder-2/label",
    "folder-3", "folder-3/label", "folder-4", "folder-4/label",
  ]);
  const open = finder.select_folder(start, 0, 0);
  assert.equal(finder.folder_value(open, 0.42), 1);
  assert.equal(scene(open, 0.42).length, 18);
  assert.deepEqual(scene(open, 0.42).filter(node => node.id.startsWith("card-") && !node.id.endsWith("/label")).map(node => node.content[0]), ["rect", "rect", "rect", "rect"]);
  assert.equal(data(finder.hit_at(start, 0, -340, -20)).kind, "folder");
  assert.deepEqual(data(finder.hit_at(open, 0.42, -245, -120)), { kind: "card", folder: 0, card: 0 });
  const focused = finder.select_card(open, 0, 0.42);
  assert.equal(finder.card_value(focused, 0.78), 1);
  const card = scene(focused, 0.78).find(node => node.id === "card-0/0");
  assert.equal(card.content[1].width, 690);
  assert.equal(card.content[1].height, 446);
  assert.equal(data(finder.hit_at(focused, 0.78, 400, 200)).kind, "back");
});

test("返回和快速重入从当前采样值接续；非法切换不偷换身份", () => {
  const open = finder.select_folder(finder.initial(), 0, 0);
  const partial = finder.folder_value(open, 0.16);
  const closing = finder.back(open, 0.16);
  assert.equal(finder.folder_value(closing, 0.16), partial);
  const folderFocus = finder.folder_value(closing, 0.24);
  assert.equal(data(finder.hit_at(closing, 0.24, -340 * (1 - folderFocus), -20 * (1 - folderFocus))).kind, "folder");
  const reopened = finder.select_folder(closing, 0, 0.24);
  assert.equal(finder.folder_value(reopened, 0.24), finder.folder_value(closing, 0.24));
  assert.equal(finder.folder_value(reopened, 0.66), 1);
  assert.throws(() => finder.select_folder(reopened, 1, 0.3), /switch-before-folder-closed/);
  const focused = finder.select_card(reopened, 1, 0.66);
  const cardPartial = finder.card_value(focused, 0.76);
  const cardClosing = finder.back(focused, 0.76);
  assert.equal(finder.card_value(cardClosing, 0.76), cardPartial);
  const cardFocus = finder.card_value(cardClosing, 0.84);
  assert.equal(data(finder.hit_at(cardClosing, 0.84, finder.card_x(1) * (1 - cardFocus), finder.card_y(1) * (1 - cardFocus))).kind, "card");
  const cardReopened = finder.select_card(cardClosing, 1, 0.84);
  assert.equal(finder.card_value(cardReopened, 0.84), finder.card_value(cardClosing, 0.84));
  assert.equal(finder.card_value(cardReopened, 1.2), 1);
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
