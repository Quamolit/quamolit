import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as data } from "../target/js/finder/calcit.core.mjs";
import * as finder from "../target/js/finder/quamolit.examples.finder.mjs";
import { CalcitSliceList, newTag } from "@calcit/procs";

const tags = Object.fromEntries(
  ["nodes", "candidates", "content", "id", "interaction", "x", "y", "width", "height"].map((name) => [
    name,
    newTag(name),
  ]),
);

test("同次采样 Scene 命中保留原操作政策，乱序/打断与卡片禁用不修改声明", () => {
  const initial = finder.initial();
  const models = [initial];
  for (let folder = 0; folder < 5; folder++) {
    const open = finder.select_folder(initial, folder, 0);
    const focus = finder.select_card(open, 0, 0.42);
    models.push(open, focus, finder.back(focus, 0.6), finder.back(open, 0.21));
  }
  let queries = 0;
  for (const model of models)
    for (const time of [0.75, 0, 0.01, 0.21, 0.42, 0.6, 0.75, 1]) {
      const document = finder.scene_at(model, time),
        before = data(document);
      const plan = finder.hit_plan(model, time, document);
      for (const node of before.nodes.filter((node) => node.content[0] === "rect")) {
        const rect = node.content[1];
        for (const x of [
          rect.x - 1,
          rect.x + 1,
          rect.x + rect.width / 2,
          rect.x + rect.width - 1,
          rect.x + rect.width + 1,
        ])
          for (const y of [rect.y - 1, rect.y + rect.height / 2, rect.y + rect.height + 1]) {
            assert.deepEqual(
              data(finder.hit_with_plan(model, time, plan, x, y)),
              data(finder.hit_at(model, time, x, y)),
            );
            queries++;
          }
      }
      assert.deepEqual(data(document), before);
    }
  assert.ok(queries > 10000);
  for (const bad of [NaN, Infinity, -Infinity]) {
    assert.throws(() => finder.hit_plan(initial, bad, finder.scene_at(initial, 0)), /invalid-finder-hit-time/);
    assert.throws(
      () => finder.hit_with_plan(initial, 0, finder.hit_plan(initial, 0, finder.scene_at(initial, 0)), bad, 0),
      /invalid-finder-hit/,
    );
  }
});

test("命中读取移动/缩小后的实际 Scene，不按 Model 初始几何猜测", () => {
  const model = finder.initial(),
    document = finder.scene_at(model, 0);
  const nodes = document.get(tags.nodes);
  const moved = finder.rect_node("folder-0", 550, 350, 50, 44, 0.2, 0.3, 0.4, 1);
  const changed = document.assoc(
    tags.nodes,
    new CalcitSliceList(Array.from({ length: nodes.len() }, (_, i) => (i === 0 ? moved : nodes.get(i)))),
  );
  const plan = finder.hit_plan(model, 0, changed);
  assert.equal(plan.get(tags.candidates).len(), 5);
  assert.deepEqual(data(finder.hit_with_plan(model, 0, plan, 550, 350)), { kind: "folder", folder: 0, card: -1 });
  assert.equal(data(finder.hit_with_plan(model, 0, plan, -340, -20)).kind, "none");
  assert.equal(data(finder.hit_with_plan(model, 0, plan, 576, 350)).kind, "none");
  assert.equal(data(finder.hit_at(model, 0, 550, 350)).kind, "none");
});

const scene = (model, time) => data(finder.scene_at(model, time)).nodes;

test("窄屏五组和18张卡片保留可读字号、44px目标及父级缩放边界", () => {
  for (const [width, height] of [
    [320, 640],
    [390, 844],
    [600, 800],
  ])
    for (let folder = 0; folder < 5; folder++) {
      const initial = finder.initial(),
        opened = finder.select_folder(initial, folder, 0);
      const source = finder.scene_at(opened, 0.42),
        original = data(source);
      const projected = finder.compact_document(source, width, height),
        nodes = data(projected).nodes;
      const plan = finder.hit_plan(opened, 0.42, projected);
      for (let index = 0; index < data(finder.cards_for(folder)).length; index++) {
        const rect = nodes.find((node) => node.id === `card-${folder}/${index}`).content[1];
        const label = nodes.find((node) => node.id === `card-${folder}/${index}/label`).content[1];
        assert.ok(rect.width >= 44 && rect.height >= 44);
        assert.ok(label.size >= 18);
        assert.equal(
          data(finder.hit_with_plan(opened, 0.42, plan, rect.x + rect.width / 2, rect.y + rect.height / 2)).card,
          index,
        );
        const focused = finder.select_card(opened, index, 0.42),
          closing = finder.back(focused, 0.6);
        for (const [model, time] of [
          [opened, 0.1],
          [opened, 0.21],
          [focused, 0.51],
          [focused, 0.78],
          [closing, 0.6],
          [closing, 0.72],
          [closing, 0.96],
        ]) {
          const view = data(finder.compact_document(finder.scene_at(model, time), width, height)).nodes;
          const parent = view.find((node) => node.id === `folder-${folder}`).content[1];
          for (const card of view.filter(
            (node) => node.id.startsWith(`card-${folder}/`) && !node.id.endsWith("/label"),
          )) {
            const r = card.content[1],
              text = view.find((node) => node.id === `${card.id}/label`).content[1],
              epsilon = 1e-8;
            assert.ok(r.x >= parent.x - epsilon && r.x + r.width <= parent.x + parent.width + epsilon);
            assert.ok(r.y >= parent.y - epsilon && r.y + r.height <= parent.y + parent.height + epsilon);
            assert.ok(text.x >= r.x && text.x + text.text.length * text.size <= r.x + r.width + epsilon);
            assert.ok(text.y - text.size / 2 >= r.y && text.y + text.size / 2 <= r.y + r.height);
          }
        }
      }
      assert.deepEqual(data(source), original);
      const home = finder.compact_document(finder.scene_at(initial, 0), width, height),
        homePlan = finder.hit_plan(initial, 0, home);
      for (let index = 0; index < 5; index++) {
        const r = data(home).nodes.find((node) => node.id === `folder-${index}`).content[1];
        assert.ok(r.width >= 44 && r.height >= 44);
        assert.equal(
          data(finder.hit_with_plan(initial, 0, homePlan, r.x + r.width / 2, r.y + r.height / 2)).folder,
          index,
        );
      }
    }
  const source = finder.scene_at(finder.initial(), 0);
  for (const [width, height] of [
    [NaN, 844],
    [390, Infinity],
    [299, 844],
    [390, 599],
  ])
    assert.throws(() => finder.compact_document(source, width, height), /invalid-finder-compact-viewport/);
});

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
