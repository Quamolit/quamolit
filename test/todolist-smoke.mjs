import assert from "node:assert/strict";
import { test } from "node:test";
import * as todo from "../target/js/todolist/quamolit.examples.todolist.mjs";
import { sample_plan_at as sample } from "../target/js/todolist/quamolit.retained-component.mjs";
import { sample_transition as transitionAt } from "../target/js/todolist/quamolit.transition.mjs";
import {
  init_tags,
  to_js_data as js,
  _$n_enum_$o_nth as enumNth,
  _PCT__$o__$o_ as enumNew,
  option_$o_unwrap as unwrapOption,
  count,
  CalcitSliceList,
} from "../target/js/todolist/calcit.core.mjs";
import * as lifecycle from "../target/js/todolist/quamolit.resource-lifecycle.mjs";
import * as queueApi from "../target/js/todolist/quamolit.resource-load-queue.mjs";
import {
  draw_text_$x_ as drawText,
  font_family_css as fontFamilyCss,
} from "../target/js/todolist/quamolit.canvas-reference.mjs";
import { default_font as defaultFont, SceneContent, FontFallback } from "../target/js/todolist/quamolit.scene-ir.mjs";
import * as fonts from "../target/js/todolist/quamolit.font-resource.mjs";
import * as presence from "../target/js/todolist/quamolit.presence.mjs";
import { Easing } from "../target/js/todolist/quamolit.motion.mjs";
import {
  geometry_signature as geometry,
  property_signature as properties,
  resource_signature as resources,
} from "../target/js/todolist/quamolit.scene-diff.mjs";
const tags = init_tags([
  "model",
  "rows",
  "y",
  "id",
  "scene",
  "nodes",
  "plan-builds",
  "slots",
  "revision",
  "content",
  "size",
  "fill",
  "text",
  "font",
  "family",
  "version",
  "face",
  "queue",
  "task",
  "state",
  "transition",
  "loaded",
  "actions",
  "outcome",
  "font",
  "interactive",
  "resource-generation",
  "registry",
  "host",
  "handles",
  "accepted",
  "released",
  "entries",
  "generation",
  "references",
  "transforms",
  "a",
  "d",
  "e",
  "f",
  "parent",
  "key",
  "bindings",
  "text",
  "linear",
  "fallback",
  "sans-serif",
  "buffer",
]);
const field = (x, k) => x.get(tags[k]);
const rows = (m) => js(m).rows;
const live = () => todo.replay(todo.events_through(todo.demo_log(), 0), 1);
const scene = (p) => js(field(p, "scene"));

test("窄屏 Calcit Scene 保留文字、44px 操作和同次采样命中；视口变化不修改动画意图", () => {
  const model = live(),
    plan = todo.start_plan(model, 1),
    before = js(plan);
  for (const width of [320, 390, 600]) {
    const declaration = todo.compact_document(plan, width, 0);
    const value = js(declaration),
      hits = todo.compact_hit_plan(declaration);
    const labels = value.nodes.filter((node) => node.id.endsWith("/edit") || node.id.endsWith("/line-2"));
    assert.equal(labels.length, 6);
    assert.ok(labels.every((node) => node.content[1].size === 18));
    const buttons = value.nodes.filter((node) => node.id.includes("/tap-") && !node.id.endsWith("tap-edit"));
    assert.equal(buttons.length, 9);
    assert.ok(buttons.every((node) => node.content[1].width === 44 && node.content[1].height === 44));
    const left = -(width - 24) / 2;
    assert.equal(js(todo.hit_compact_with_plan(model, hits, left + 26, 155)).action, "toggle");
    assert.equal(js(todo.hit_compact_with_plan(model, hits, 0, 90)).action, "edit");
    assert.equal(js(todo.hit_compact_with_plan(model, hits, (width - 24) / 2 - 94, 155)).action, "front");
    assert.equal(js(todo.hit_compact_with_plan(model, hits, (width - 24) / 2 - 38, 155)).action, "remove");
    assert.equal(js(todo.hit_compact_with_plan(model, hits, left - 10, 155)).action, "");
    assert.deepEqual(js(plan), before);
  }
  const shifted = todo.compact_hit_plan(todo.compact_document(plan, 390, 80));
  assert.equal(js(todo.hit_compact_with_plan(model, shifted, -150, 75)).action, "toggle");
  const exiting = todo.dispatch(model, 1, "remove", "3", "");
  const exitScene = todo.compact_document(todo.start_plan(exiting, 1), 390, 0);
  assert.equal(js(todo.hit_compact_with_plan(exiting, todo.compact_hit_plan(exitScene), -150, 155)).action, "");
  assert.throws(() => todo.compact_document(plan, NaN, 0), /invalid-todo-compact-width/);
  assert.throws(() => todo.compact_document(plan, 390, -1), /invalid-todo-compact-scroll/);
  assert.throws(() => todo.compact_scroll_limit(plan, Infinity), /invalid-todo-compact-height/);
});

test("实际采样 Scene 命中对照历史按钮范围，乱序、重排和退出均一致", () => {
  const oracle = (model, time, x, y) => {
    const source = field(model, "rows");
    for (let i = source.len() - 1; i >= 0; i--) {
      const row = source.get(i),
        value = js(row);
      const alpha = todo.row_alpha(model, row, time);
      const localX = x + 40 * (1 - alpha),
        localY = y - transitionAt(field(row, "y"), time);
      if (!value.present || alpha <= 0 || localY < -25 || localY > 25 || localX < -282 || localX > 292) continue;
      return {
        id: value.id,
        text: value.text,
        action: localX < -248 ? "toggle" : localX < 200 ? "edit" : localX < 250 ? "front" : "remove",
      };
    }
    return { id: "", text: "", action: "" };
  };
  for (const time of [2.6, 0, 0.25, 1.65, 1.7, 4, 0.25]) {
    const model = todo.replay(todo.demo_log(), time),
      plan = todo.start_plan(model, time);
    const hits = todo.hit_plan(plan),
      before = js(plan);
    for (const y of [-285, -280, -255, -224, -200, -185, -160, -135, -100, 0])
      for (const x of [-323, -300, -282, -270, -248, 0, 199.9, 200, 249.9, 250, 292, 300])
        assert.deepEqual(
          js(todo.hit_with_plan(model, hits, x, y)),
          oracle(model, time, x, y),
          `t=${time}, point=${x},${y}`,
        );
    assert.deepEqual(js(plan), before, "命中不改变采样计划");
  }
});

test("命中消费计划里的实际矩阵，不重新按 Model 推算位置；按钮边界和禁用不扩张", () => {
  const model = live(),
    plan = todo.start_plan(model, 1),
    transforms = field(plan, "transforms");
  const moved = new CalcitSliceList(
    Array.from({ length: count(transforms) }, (_, i) =>
      transforms.get(i).assoc(tags.a, 2).assoc(tags.d, 0.5).assoc(tags.e, 120).assoc(tags.f, 20),
    ),
  );
  const altered = plan.assoc(tags.transforms, moved),
    hits = todo.hit_plan(altered);
  assert.equal(js(todo.hit_with_plan(model, hits, -420, 20)).action, "toggle");
  assert.equal(js(todo.hit_with_plan(model, hits, 120, 20)).action, "edit");
  assert.equal(js(todo.hit_with_plan(model, hits, 550, 20)).action, "front");
  assert.equal(js(todo.hit_with_plan(model, hits, 660, 20)).action, "remove");
  assert.equal(js(todo.hit_with_plan(model, hits, 120, 33)).id, "");
  assert.equal(js(todo.hit_with_plan(model, hits, 705, 20)).id, "");
  assert.equal(js(todo.hit_with_plan(model, todo.hit_plan(plan), 550, 20)).id, "", "旧 Model 推算位置不能冒充实际计划");
  assert.throws(
    () => todo.hit_plan(plan.assoc(tags.transforms, new CalcitSliceList([]))),
    /invalid-todo-hit-transforms/,
  );
  assert.throws(() => todo.hit_with_plan(model, hits, NaN, 0), /invalid-todo-hit/);
});

test("Presence 字体按 family/version 共享，退出持有到终点；重入、百次装卸与非法输入", () => {
  const empty = new CalcitSliceList([]);
  const base = field(todo.start_plan(live(), 1), "scene");
  const template = field(base, "nodes").get(0);
  const spec = defaultFont().assoc(tags.family, "ChartFont").assoc(tags.version, 1);
  const document = (specs) =>
    base.assoc(
      tags.nodes,
      new CalcitSliceList(
        specs.map((font, index) => {
          const payload = enumNth(todo.text(0, "图表收入", 18, todo.color(1, 0, 0, 1)), 1).assoc(tags.font, font);
          return template
            .assoc(tags.id, `label-${index}`)
            .assoc(tags.key, `label-${index}`)
            .assoc(tags.parent, "")
            .assoc(tags.bindings, empty)
            .assoc(tags.content, enumNew(SceneContent, tags.text, payload));
        }),
      ),
    );
  const same = spec.assoc(tags.fallback, enumNew(FontFallback, tags["sans-serif"]));
  const full = document([spec, same, defaultFont()]);
  const blank = base.assoc(tags.nodes, empty);
  const start = presence.start_presence(full);
  const refs = fonts.presence_font_references(start);
  assert.deepEqual(js(refs), [{ kind: ["font"], id: "ChartFont", version: 1 }]);
  const before = js(start);
  const easing = enumNew(Easing, tags.linear);
  const exit = field(presence.reconcile_presence(start, blank, 0, 1, easing), "model");
  for (const time of [0, 0.25, 0.5, 0.75])
    assert.deepEqual(
      js(fonts.presence_font_references(field(presence.settle_presence(exit, time), "model"))),
      js(refs),
    );
  const end = field(presence.settle_presence(exit, 1), "model");
  assert.equal(count(fonts.presence_font_references(end)), 0);
  assert.deepEqual(js(start), before, "选择器与结算不修改旧 Model");
  const registryOf = (transition) => field(transition, "registry");
  let registry = registryOf(fonts.sync_font_leases(lifecycle.initial_registry(1), empty, refs, 1));
  registry = registryOf(fonts.sync_font_leases(registry, empty, refs, 1));
  assert.equal(js(registry).entries[0].references, 2, "不同所有者各持一个 lease");
  assert.equal(registryOf(fonts.sync_font_leases(registry, refs, refs, 1)), registry, "重复提交不增加引用");
  registry = registryOf(fonts.sync_font_leases(registry, refs, empty, 1));
  assert.equal(js(registry).entries[0].references, 1);
  registry = registryOf(fonts.sync_font_leases(registry, refs, empty, 1));
  for (let cycle = 0; cycle < 100; cycle++) {
    const entering = field(presence.reconcile_presence(end, full, cycle * 3, 1, easing), "model");
    const currentRefs = fonts.presence_font_references(entering);
    registry = registryOf(fonts.sync_font_leases(registry, empty, currentRefs, 1));
    const leaving = field(presence.reconcile_presence(entering, blank, cycle * 3 + 1, 1, easing), "model");
    const middle = field(presence.settle_presence(leaving, cycle * 3 + 1.5), "model");
    assert.equal(
      registryOf(fonts.sync_font_leases(registry, currentRefs, fonts.presence_font_references(middle), 1)),
      registry,
    );
    const revived = field(presence.reconcile_presence(middle, full, cycle * 3 + 1.5, 1, easing), "model");
    assert.deepEqual(js(fonts.presence_font_references(revived)), js(currentRefs));
    const ended = field(presence.settle_presence(leaving, cycle * 3 + 2), "model");
    registry = registryOf(fonts.sync_font_leases(registry, currentRefs, fonts.presence_font_references(ended), 1));
    assert.equal(js(lifecycle.registry_metrics(registry)).idle, 1);
    assert.equal(js(registry).loads, 1);
  }
  const newer = fonts.presence_font_references(presence.start_presence(document([spec.assoc(tags.version, 2)])));
  const switched = fonts.sync_font_leases(registry, empty, newer, 1);
  assert.equal(js(field(switched, "actions"))[0][1].version, 1, "先驱逐 idle 旧版本，再加载新版本");
  assert.equal(js(registryOf(switched)).entries[0].state.identity.version, 2);
  assert.deepEqual(js(fonts.presence_font_references(presence.start_presence(document([defaultFont()])))), []);
  for (const budget of [0, -1, NaN, Infinity])
    assert.throws(() => fonts.sync_font_leases(registry, empty, empty, budget), /invalid-font-budget/);
  assert.throws(() => fonts.font_identity(defaultFont()), /invalid-external-font/);
  assert.throws(
    () => fonts.sync_font_leases(registry, refs, new CalcitSliceList([refs.get(0), refs.get(0)]), 1),
    /duplicate-font-reference/,
  );
  assert.throws(
    () =>
      fonts.sync_font_leases(
        registry,
        empty,
        new CalcitSliceList([lifecycle.resource(enumNew(lifecycle.ResourceKind, tags.buffer), "x", 1)]),
        1,
      ),
    /invalid-font-reference/,
  );
});

test("固定日志直接跳转与顺序游标得到相同逻辑 Model、画面与释放计数", () => {
  const log = todo.demo_log();
  let session = todo.initial_session();
  const expected = new Map();
  const normalize = (model) => {
    const value = js(model);
    delete value.revision;
    return value;
  };
  for (const t of [0, 0.1, 0.25, 0.5, 0.9, 1, 1.2, 1.5, 1.65, 1.7, 2, 2.3, 2.45, 2.6, 3, 3.5, 4]) {
    session = todo.advance(session, log, t);
    const direct = todo.replay(log, t);
    // revision 是实际缓存失效次数，逐帧结算次数可不同；可观察 Model 和画面必须相同。
    expected.set(t, normalize(field(session, "model")));
    assert.deepEqual(normalize(field(session, "model")), normalize(direct), `model t=${t}`);
    assert.deepEqual(
      scene(todo.start_plan(field(session, "model"), t)),
      scene(todo.start_plan(direct, t)),
      `scene t=${t}`,
    );
  }
  for (const t of [4, 0, 2.6, 1.65, 0.25, 4]) assert.deepEqual(normalize(todo.replay(log, t)), expected.get(t));
  const end = todo.replay(log, 4);
  assert.deepEqual(
    rows(end).map((r) => [r.id, r.text, r.done]),
    [
      ["2", "Create", true],
      ["3", "Explore", false],
    ],
  );
  assert.equal(js(end).released, 6);
  assert.equal(todo.needs_frame_$q_(end, 4), false);
});

test("完成宽度手算中间帧，稳定内容跨 1000 时间帧共享", () => {
  const model = todo.dispatch(live(), 1, "toggle", "2", "");
  let plan = todo.start_plan(model, 1),
    nodes = field(field(plan, "scene"), "nodes");
  const stable = nodes.get(0),
    slots = field(plan, "slots");
  for (let i = 0; i < 1000; i++) {
    const t = 1 + (i % 401) / 1000;
    plan = sample(plan, t);
    assert.equal(field(field(plan, "scene"), "nodes").get(0), stable);
    assert.equal(field(plan, "slots"), slots);
  }
  const middle = scene(sample(plan, 1.2)).nodes.find((n) => n.id === "presence/rect/2/checked");
  assert.ok(Math.abs(middle.content[1].width - 14) < 1e-12);
  assert.equal(field(plan, "plan-builds"), 1);
});

test("重排在 25/50/75% 打断时位置连续，原 Model 不被修改", () => {
  for (const progress of [0.25, 0.5, 0.75]) {
    const initial = live();
    const moving = todo.dispatch(initial, 1, "reverse", "", "");
    const before = js(moving),
      at = 1 + 0.4 * progress;
    const next = todo.dispatch(moving, at, "front", "3", "");
    for (const id of ["1", "2", "3"]) {
      const old = todo.find_row(moving, id),
        fresh = todo.find_row(next, id);
      assert.ok(Math.abs(transitionAt(field(old, "y"), at) - transitionAt(field(fresh, "y"), at)) < 1e-12);
    }
    assert.deepEqual(js(moving), before);
  }
});

test("退出中禁命中、恢复保持 alpha；终点后恢复重新进入", () => {
  const initial = live(),
    exiting = todo.dispatch(initial, 1, "remove", "3", "");
  assert.equal(js(todo.hit_at(exiting, 1.2, -270, -160)).id, "");
  const at = 1.3,
    revived = todo.dispatch(exiting, at, "restore", "", "");
  const old = rows(exiting).find((r) => r.id === "3"),
    next = rows(revived).find((r) => r.id === "3");
  assert.equal(old.present, false);
  assert.equal(next.present, true);
  const a = scene(todo.start_plan(exiting, at)).nodes.find((n) => n.id === "presence/rect/3/card").content[1].fill.a;
  const b = scene(todo.start_plan(revived, at)).nodes.find((n) => n.id === "presence/rect/3/card").content[1].fill.a;
  assert.equal(a, b);
  const settled = todo.settle(exiting, 2),
    readded = todo.dispatch(settled, 2, "restore", "", "");
  assert.equal(js(settled).released, 6);
  assert.equal(
    scene(todo.start_plan(readded, 2)).nodes.find((n) => n.id === "presence/rect/3/card").content[1].fill.a,
    0,
  );
});

test("错峰进入与退出，100 次装卸返回空 Model，结算不重复释放", () => {
  const model = todo.replay(todo.events_through(todo.demo_log(), 0), 0);
  const start = scene(todo.start_plan(model, 0.08)).nodes.filter((n) => n.id.endsWith("/card"));
  assert.ok(start[0].content[1].fill.a > start[1].content[1].fill.a);
  assert.ok(start[1].content[1].fill.a > start[2].content[1].fill.a);
  const clearing = todo.dispatch(live(), 1, "clear", "", "");
  const exit = scene(todo.start_plan(clearing, 1.08)).nodes.filter((n) => n.id.endsWith("/card"));
  assert.ok(exit[0].content[1].fill.a > exit[1].content[1].fill.a);
  assert.ok(exit[1].content[1].fill.a > exit[2].content[1].fill.a);
  let state = todo.initial();
  for (let i = 0; i < 100; i++) {
    const t = i * 3;
    state = todo.dispatch(state, t, "add", "", "Cycle");
    state = todo.settle(state, t + 1);
    state = todo.dispatch(state, t + 1, "clear", "", "");
    state = todo.settle(state, t + 2);
    assert.equal(rows(state).length, 0);
    assert.equal(js(state).presence.items.length, 0);
    assert.equal(js(state).released, (i + 1) * 6);
    assert.equal(todo.needs_frame_$q_(state, t + 2), false);
    assert.deepEqual(js(todo.settle(state, t + 2)), js(state));
  }
});

test("事件失败保留旧状态；未知事件、时序和容量有界", () => {
  const model = live(),
    before = js(model);
  for (const args of [
    [-1, "add", "", "Bad"],
    [1, "bad", "", ""],
    [1, "edit", "2", ""],
    [1, "remove", "missing", ""],
  ])
    assert.throws(() => todo.dispatch(model, ...args));
  assert.throws(() => todo.append_event(todo.demo_log(), 1, "clear", "", ""), /nonmonotonic/);
  assert.throws(
    () => todo.advance(todo.advance(todo.initial_session(), todo.demo_log(), 2), todo.demo_log(), 1),
    /invalid-todo-advance/,
  );
  assert.deepEqual(js(model), before);
  let full = todo.initial();
  for (let i = 0; i < 24; i++) full = todo.dispatch(full, 0, "add", "", "Row");
  assert.throws(() => todo.dispatch(full, 0, "add", "", "Overflow"), /todo-capacity/);
  const removed = todo.settle(todo.dispatch(full, 2, "remove", "1", ""), 5);
  const refilled = todo.dispatch(removed, 5, "add", "", "Replacement");
  assert.throws(() => todo.dispatch(refilled, 5, "restore", "", ""), /todo-capacity/);
});

test("文字 diff 分类与宿主状态恢复；非法字号在绘制前拒绝", () => {
  const red = todo.color(1, 0, 0, 1),
    blue = todo.color(0, 0, 1, 1);
  const before = todo.text(0, "Calcit", 18, red),
    recolor = todo.text(0, "Calcit", 18, blue),
    edited = todo.text(0, "Canvas", 18, red);
  assert.deepEqual(js(geometry(before)), js(geometry(recolor)));
  assert.notDeepEqual(js(properties(before)), js(properties(recolor)));
  assert.notDeepEqual(js(geometry(before)), js(geometry(edited)));
  assert.deepEqual(js(resources(before)), ["font", { family: "", fallback: ["monospace"], version: 0 }]);
  const calls = [];
  const context = {
    save() {
      calls.push("save");
    },
    restore() {
      calls.push("restore");
    },
    fillText() {
      calls.push("fillText");
      throw Error("host-failure");
    },
  };
  const text = enumNth(before, 1);
  assert.throws(() => drawText(context, text), /host-failure/);
  assert.deepEqual(calls, ["save", "fillText", "restore"]);
  for (const size of [0, -1, NaN, Infinity])
    assert.throws(() => drawText(context, text.assoc(tags.size, size)), /invalid-scene-text/);
  assert.deepEqual(calls, ["save", "fillText", "restore"]);
});

test("字体版本独立失效，命名字体安全引用且绘制不启动加载", () => {
  const font = defaultFont();
  const named = font.assoc(tags.family, '图表"UI\\字体').assoc(tags.version, 1);
  assert.equal(fontFamilyCss(font), "monospace");
  assert.equal(fontFamilyCss(named), '"QuamolitFont:1:图表\\"UI\\\\字体", "图表\\"UI\\\\字体", monospace');
  const content = todo.text(0, "中文图表", 18, todo.color(1, 0, 0, 1));
  const text = enumNth(content, 1);
  const changedFont = text.assoc(tags.font, font.assoc(tags.version, 1));
  assert.deepEqual(js(geometry(content)), js(geometry(content.assoc(1, changedFont))));
  assert.notDeepEqual(js(resources(content)), js(resources(content.assoc(1, changedFont))));
  const calls = [];
  const context = {
    save() {
      calls.push("save");
    },
    restore() {
      calls.push("restore");
    },
    fillText(value, x, y) {
      calls.push([value, x, y, this.font]);
    },
  };
  drawText(context, text.assoc(tags.font, named));
  assert.deepEqual(calls, ["save", ["中文图表", 0, 0, `18px ${fontFamilyCss(named)}`], "restore"]);
  for (const family of [" bad ", "bad\nfont", "bad\tfont", "bad\0font"]) {
    assert.throws(
      () => drawText(context, text.assoc(tags.font, font.assoc(tags.family, family))),
      /invalid-scene-text/,
    );
  }
  assert.equal(calls.length, 3, "非法字体在save/fillText之前拒绝");
});

test("字体加载/队列/registry：失败、迟到隔离、共享与精确释放", async () => {
  const previousFace = globalThis.FontFace;
  const previousDocument = globalThis.document;
  let creates = 0,
    reads = 0;
  const installed = new Set();
  const spec = defaultFont().assoc(tags.family, "ChartFont").assoc(tags.version, 1);
  globalThis.FontFace = class {
    constructor(family, source) {
      creates++;
      if (source === "throw") throw Error("constructor-failed");
      this.family = family;
      this.source = source;
      this.status = "unloaded";
    }
    async load() {
      if (this.source === "reject") throw Error("load-failed");
      if (this.source === "invalid") return null;
      this.status = "loaded";
      return this;
    }
  };
  globalThis.document = {
    get fonts() {
      reads++;
      return installed;
    },
  };
  try {
    assert.deepEqual(js(await fonts.load_font_$x_(defaultFont(), "ok")), ["failed", "invalid-font-load-request"]);
    assert.equal(creates, 0, "无效请求不调用宿主");
    for (const source of ["throw", "reject", "invalid"]) {
      const failed = js(await fonts.load_font_$x_(spec, source));
      assert.equal(failed[0], "failed");
      assert.ok(failed[1].length > 0);
    }
    const result = await fonts.load_font_$x_(spec, "ok");
    const loaded = enumNth(result, 1);
    assert.equal(loaded.getRequired(tags.face).family, "QuamolitFont:1:ChartFont");
    assert.equal(installed.size, 0, "加载不自动安装或修改可见字体集合");
    assert.equal(fonts.install_font_$x_(loaded, spec.assoc(tags.version, 2)), false);
    assert.equal(reads, 0, "过期结果不访问document.fonts");
    assert.equal(fonts.install_font_$x_(loaded, spec), true);
    assert.equal(installed.size, 1);
    assert.equal(installed.has(loaded.getRequired(tags.face)), true);
    assert.equal(fonts.release_font_$x_(loaded), true);
    assert.equal(fonts.release_font_$x_(loaded), false);
    assert.equal(installed.size, 0);
    const identity = lifecycle.resource(enumNew(lifecycle.ResourceKind, tags.font), "ui-font", 1);
    const begin = () => {
      const state = lifecycle.request_resource(lifecycle.initial_state(identity), identity).get(tags.state);
      const enqueued = queueApi.enqueue_load(
        queueApi.initial_load_queue(1, 4),
        1,
        identity,
        1,
        enumNew(queueApi.ResourceLoadPriority, tags.interactive),
      );
      const taken = queueApi.take_load(enqueued.get(tags.queue));
      return { state, queue: taken.get(tags.queue), task: unwrapOption(taken.get(tags.task)) };
    };
    for (const mode of ["cancel", "runtime", "closed", "replaced", "unknown"]) {
      let { state, queue, task } = begin();
      const pending = fonts.run_font_load_task_$x_(spec, "ok", task);
      if (mode === "cancel") queue = queueApi.cancel_resource_loads(queue, identity);
      if (mode === "runtime") queue = queueApi.cancel_stale_device_loads(queue, 2);
      if (mode === "closed") state = lifecycle.close_resource(state).get(tags.state);
      if (mode === "replaced") {
        const next = lifecycle.resource(enumNew(lifecycle.ResourceKind, tags.font), "ui-font", 2);
        state = lifecycle.request_resource(state, next).get(tags.state);
      }
      if (mode === "unknown") queue = queueApi.initial_load_queue(1, 4);
      const result = await pending;
      const completion = fonts.complete_font_load(state, queue, result);
      assert.equal(js(completion.get(tags.loaded))[0], "none", mode);
      assert.equal(completion.get(tags.transition).get(tags.state), state, mode);
      assert.deepEqual(js(completion.get(tags.transition).get(tags.actions)), [], mode);
      assert.equal(installed.size, 0, "迟到结果不自动安装");
      assert.equal(js(queueApi.load_queue_metrics(completion.get(tags.queue))).running, 0);
    }
    const failedRequest = begin();
    const failedResult = await fonts.run_font_load_task_$x_(spec, "reject", failedRequest.task);
    const failedCompletion = fonts.complete_font_load(failedRequest.state, failedRequest.queue, failedResult);
    assert.equal(js(failedCompletion.get(tags.transition).get(tags.state)).phase[0], "error");
    assert.equal(js(failedCompletion.get(tags.loaded))[0], "none");
    for (let cycle = 0; cycle < 100; cycle++) {
      const { state, queue, task } = begin();
      const result = await fonts.run_font_load_task_$x_(spec, "ok", task);
      const forged = result.assoc(tags.task, task.assoc(tags["resource-generation"], 99));
      if (cycle === 0)
        assert.throws(() => fonts.complete_font_load(state, queue, forged), /font-completion-task-mismatch/);
      const completed = fonts.complete_font_load(state, queue, result);
      assert.equal(js(completed.get(tags.transition).get(tags.state)).phase[0], "ready");
      assert.deepEqual(
        js(completed.get(tags.transition).get(tags.actions)).map((action) => action[0]),
        ["install", "wake-frame"],
      );
      const owned = unwrapOption(completed.get(tags.loaded));
      assert.equal(fonts.install_font_$x_(owned, spec), true);
      assert.equal(installed.size, 1);
      assert.equal(fonts.release_font_$x_(owned), true);
      assert.equal(installed.size, 0);
      const repeated = fonts.complete_font_load(state, completed.get(tags.queue), result);
      assert.equal(js(repeated.get(tags.loaded))[0], "none", "重复完成不能再次交付句柄");
    }
    const reg = (transition) => transition.get(tags.registry);
    const hostActions = (host, transition) => fonts.apply_font_registry_actions_$x_(host, transition.get(tags.actions));
    const taskFor = (registry, id, queue = queueApi.initial_load_queue(1, 4)) => {
      const state = lifecycle.find_entry(registry.get(tags.entries), id).get(tags.state);
      const queued = queueApi.enqueue_load(
        queue,
        1,
        id,
        state.get(tags.generation),
        enumNew(queueApi.ResourceLoadPriority, tags.interactive),
      );
      const taken = queueApi.take_load(queued.get(tags.queue));
      return { queue: taken.get(tags.queue), task: unwrapOption(taken.get(tags.task)) };
    };
    const settle = async (host, registry, id, fontSpec, source = "ok") => {
      const { queue, task } = taskFor(registry, id);
      const result = await fonts.run_font_load_task_$x_(fontSpec, source, task);
      return fonts.complete_font_registry_load_$x_(host, registry, queue, result);
    };
    let host = fonts.initial_font_resource_host();
    let registry = reg(lifecycle.acquire_registry(lifecycle.initial_registry(2), identity, 1));
    registry = reg(lifecycle.acquire_registry(registry, identity, 1));
    const beforeCreates = creates;
    const shared = await settle(host, registry, identity, spec);
    host = shared.get(tags.host);
    registry = reg(shared.get(tags.transition));
    assert.equal(creates - beforeCreates, 1, "两个lease共享一次实际FontFace加载");
    assert.equal(lifecycle.find_entry(registry.get(tags.entries), identity).get(tags.references), 2);
    assert.equal(js(lifecycle.registry_metrics(registry)).loads, 1);
    assert.equal(installed.size, 1);
    const sharedFace = unwrapOption(fonts.installed_font(host, identity, 1)).getRequired(tags.face);
    for (let i = 0; i < 2; i++) {
      const release = lifecycle.release_registry(registry, identity);
      registry = reg(release);
      host = hostActions(host, release);
      assert.equal(installed.has(sharedFace), true, "最后lease释放后进入idle，不销毁缓存");
    }
    assert.equal(js(lifecycle.registry_metrics(registry)).idle, 1);
    registry = reg(lifecycle.acquire_registry(registry, identity, 1));
    assert.equal(js(lifecycle.registry_metrics(registry)).loads, 1, "idle重入不重复加载");
    const companion = lifecycle.resource(enumNew(lifecycle.ResourceKind, tags.font), "companion", 2);
    registry = reg(lifecycle.acquire_registry(registry, companion, 1));
    const second = await settle(host, registry, companion, spec.assoc(tags.version, 2));
    host = second.get(tags.host);
    registry = reg(second.get(tags.transition));
    const companionFace = unwrapOption(fonts.installed_font(host, companion, 1)).getRequired(tags.face);
    assert.equal(installed.size, 2, "两个不同完整身份的generation都是1，允许共存");
    registry = reg(lifecycle.release_registry(registry, identity));
    const third = lifecycle.resource(enumNew(lifecycle.ResourceKind, tags.font), "third", 3);
    const evicted = lifecycle.acquire_registry(registry, third, 1);
    registry = reg(evicted);
    host = hostActions(host, evicted);
    assert.equal(installed.has(sharedFace), false);
    assert.equal(installed.has(companionFace), true, "驱逐旧身份不能按generation误删其他字体");
    const closed = lifecycle.close_registry(registry);
    host = hostActions(host, closed);
    assert.equal(count(host.get(tags.handles)), 0);
    assert.equal(host.get(tags.accepted), 2);
    assert.equal(host.get(tags.released), 2);
    assert.equal(installed.size, 0);
    assert.equal(hostActions(host, closed), host, "重复release动作不再持有句柄");

    // 同一身份/generation在关闭后重入：取消任务不去重；旧结果不能占有新请求。
    registry = reg(lifecycle.acquire_registry(lifecycle.initial_registry(1), identity, 1));
    const old = taskFor(registry, identity);
    const pending = fonts.run_font_load_task_$x_(spec, "ok", old.task);
    registry = reg(lifecycle.close_registry(registry));
    let queue = queueApi.cancel_resource_loads(old.queue, identity);
    registry = reg(lifecycle.acquire_registry(registry, identity, 1));
    queue = queueApi
      .enqueue_load(queue, 1, identity, 1, enumNew(queueApi.ResourceLoadPriority, tags.interactive))
      .get(tags.queue);
    const late = fonts.complete_font_registry_load_$x_(host, registry, queue, await pending);
    assert.equal(late.get(tags.transition).get(tags.registry), registry);
    assert.deepEqual(js(late.get(tags.transition).get(tags.actions)), []);
    assert.equal(late.get(tags.host), host);
    assert.equal(installed.size, 0);
    const fresh = queueApi.take_load(late.get(tags.queue));
    const freshResult = await fonts.run_font_load_task_$x_(spec, "ok", unwrapOption(fresh.get(tags.task)));
    const accepted = fonts.complete_font_registry_load_$x_(host, registry, fresh.get(tags.queue), freshResult);
    host = accepted.get(tags.host);
    registry = reg(accepted.get(tags.transition));
    assert.equal(installed.size, 1);
    const repeated = fonts.complete_font_registry_load_$x_(host, registry, accepted.get(tags.queue), freshResult);
    assert.equal(repeated.get(tags.host), host, "重放已接纳结果不能删除当前字体或重复计数");
    assert.equal(installed.size, 1);
    const closeReentry = lifecycle.close_registry(registry);
    host = hostActions(host, closeReentry);
    assert.equal(installed.size, 0);

    registry = reg(lifecycle.acquire_registry(lifecycle.initial_registry(1), identity, 1));
    const failure = await settle(fonts.initial_font_resource_host(), registry, identity, spec, "reject");
    assert.equal(js(failure.get(tags.transition).get(tags.registry)).entries[0].state.phase[0], "error");
    assert.equal(count(failure.get(tags.host).get(tags.handles)), 0);
    assert.equal(installed.size, 0);

    host = fonts.initial_font_resource_host();
    registry = lifecycle.initial_registry(1);
    for (let cycle = 0; cycle < 100; cycle++) {
      const id = lifecycle.resource(enumNew(lifecycle.ResourceKind, tags.font), `cycle-${cycle}`, 1);
      const acquired = lifecycle.acquire_registry(registry, id, 1);
      registry = reg(acquired);
      host = hostActions(host, acquired);
      const completion = await settle(host, registry, id, spec);
      host = completion.get(tags.host);
      registry = reg(completion.get(tags.transition));
      registry = reg(lifecycle.release_registry(registry, id));
      assert.equal(installed.size, 1);
      assert.equal(count(host.get(tags.handles)), 1, "容量1保留一个idle字体，不能逐轮膨胀");
    }
    host = hostActions(host, lifecycle.close_registry(registry));
    assert.equal(host.get(tags.accepted), 100);
    assert.equal(host.get(tags.released), 100);
    assert.equal(count(host.get(tags.handles)), 0);
    assert.equal(installed.size, 0);
  } finally {
    if (previousFace === undefined) delete globalThis.FontFace;
    else globalThis.FontFace = previousFace;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
