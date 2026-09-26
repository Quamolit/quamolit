import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { bound_scene_document_at as boundSceneDocumentAt, sample_direct_x as sampleDirectX } from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import { RetainedScenePlan } from "../src/host/retained-scene-plan.mjs";
import { DemandFrameScheduler } from "../src/host/demand-frame-scheduler.mjs";

const revisions = () => ({ model: 0, input: 0, resources: 0, viewport: 0, quality: 0, motion: 0 });
const values = () => ({ model: 0, input: 0, ready: false, viewport: 100 });
const samplers = new Map([["badge-x@1", { sample: (time, state) => 4 * sampleDirectX(time,
  state.model, state.input, state.ready, state.viewport,
  state.versions.model, state.versions.input, state.versions.resources, state.versions.viewport),
  dependencies: ["model", "input", "resources", "viewport", "motion"] }]]);
const makePlan = () => new RetainedScenePlan(toJsData(boundSceneDocumentAt(0)), samplers);
const nodeAt = (plan, index) => {
  let found;
  plan.forEachNode((node, position) => { if (position === index) found = node; });
  return found;
};

test("保留 Scene 计划在 1000 个时间帧中只建立一次静态结构", () => {
  const plan = makePlan();
  const state = { ...values(), versions: revisions() };
  const root = nodeAt(plan, 0);
  const instances = nodeAt(plan, 2);
  for (let i = 0; i < 1000; i++) {
    const time = i / 999;
    const update = plan.update(time, state.versions, state);
    assert.equal(update.changed, true);
    assert.ok(Math.abs(nodeAt(plan, 1).content[1].x - toJsData(boundSceneDocumentAt(time)).nodes[1].content[1].x) <= 1e-12);
    assert.equal(nodeAt(plan, 0), root);
    assert.equal(nodeAt(plan, 2), instances);
  }
  assert.deepEqual(plan.metrics, { planBuilds: 1, staticSceneCopies: 1, bindingSamples: 1000, skippedUpdates: 0 });
  assert.equal(plan.update(1, state.versions, state).changed, false);
  assert.equal(plan.metrics.skippedUpdates, 1);
  assert.deepEqual(plan.snapshot().nodes.map((node) => node.content), toJsData(boundSceneDocumentAt(1)).nodes.map((node) => node.content));
});

test("同时间依赖版本变更刷新绑定，非法结果与替换失败不污染旧帧", () => {
  const plan = makePlan();
  const state = { ...values(), versions: revisions() };
  assert.equal(plan.update(0.5, state.versions, state).reasons[0], "initial");
  assert.equal(nodeAt(plan, 1).content[1].x, 100);
  const oldSnapshot = plan.snapshot();
  const oldRoot = nodeAt(plan, 0);
  for (const [key, apply] of [
    ["model", () => { state.model += 5; }],
    ["input", () => { state.input += 2; }],
    ["resources", () => { state.ready = true; }],
    ["viewport", () => { state.viewport = 150; }],
    ["quality", () => {}],
    ["motion", () => {}],
  ]) {
    apply();
    state.versions[key]++;
    assert.deepEqual(plan.update(0.5, state.versions, state).reasons, [key]);
    assert.equal(nodeAt(plan, 1).content[1].x, 4 * sampleDirectX(0.5,
      state.model, state.input, state.ready, state.viewport,
      state.versions.model, state.versions.input, state.versions.resources, state.versions.viewport));
    assert.equal(nodeAt(plan, 0), oldRoot);
  }
  assert.equal(oldSnapshot.nodes[1].content[1].x, 100, "retained snapshot must not mutate");
  assert.equal(plan.metrics.bindingSamples, 6, "quality-only redraw must not resample Motion");
  const stable = nodeAt(plan, 1).content[1].x;
  assert.throws(() => plan.update(NaN, state.versions, state), /time must be finite/);
  assert.throws(() => plan.update(0.5, { ...state.versions, resources: -1 }, state), /resources revision/);
  assert.equal(nodeAt(plan, 1).content[1].x, stable);
  assert.throws(() => plan.replace({ nodes: [] }, samplers, 1), /SceneDocument/);
  assert.equal(plan.sceneRevision, 0);
  assert.equal(nodeAt(plan, 1).content[1].x, stable);
  plan.replace(toJsData(boundSceneDocumentAt(0)), samplers, 1);
  assert.equal(plan.update(0.5, state.versions, state).changed, true);
  assert.equal(plan.metrics.planBuilds, 2);
  assert.equal(plan.metrics.staticSceneCopies, 2);
});

test("按需调度合并重复请求、保存输入、暂停并在恢复后唤醒", () => {
  const callbacks = new Map();
  let next = 0;
  const paints = [];
  const scheduler = new DemandFrameScheduler({
    requestFrame(callback) { const id = ++next; callbacks.set(id, callback); return id; },
    cancelFrame(id) { callbacks.delete(id); },
    paint(timestamp, reasons, inputs) {
      paints.push({ timestamp, reasons, inputs });
      if (inputs.includes("wake")) scheduler.request("during-paint", "next");
    },
  });
  const flush = (time) => {
    assert.equal(callbacks.size, 1);
    const [id, callback] = callbacks.entries().next().value;
    callbacks.delete(id);
    callback(time);
  };
  scheduler.request("time");
  scheduler.request("input", "a");
  scheduler.request("input", "b");
  assert.equal(callbacks.size, 1);
  flush(16);
  assert.deepEqual(paints[0], { timestamp: 16, reasons: ["time", "input"], inputs: ["a", "b"] });
  assert.equal(callbacks.size, 0, "idle must not schedule another frame");
  scheduler.pause();
  scheduler.request("input", "wake");
  assert.equal(callbacks.size, 0);
  scheduler.resume();
  flush(32);
  assert.deepEqual(paints[1].inputs, ["wake"]);
  flush(48);
  assert.deepEqual(paints[2].inputs, ["next"]);
  assert.equal(scheduler.submissions, 3);
  assert.equal(callbacks.size, 0);
  scheduler.dispose();
  assert.throws(() => scheduler.request("input"), /disposed/);
});

test("已取消或重复投递的帧回调不能清除新帧或重复绘制", () => {
  const callbacks = new Map();
  const paints = [];
  let next = 0;
  const scheduler = new DemandFrameScheduler({
    requestFrame(callback) { const id = ++next; callbacks.set(id, callback); return id; },
    cancelFrame() {}, // 模拟取消后仍迟到投递的宿主回调。
    paint(timestamp, reasons, inputs) { paints.push({ timestamp, reasons, inputs }); },
  });
  scheduler.request("input", "first");
  const stale = callbacks.get(1);
  scheduler.pause();
  scheduler.request("input", "second");
  scheduler.resume();
  assert.equal(scheduler.pending, true);
  stale(16);
  assert.equal(scheduler.pending, true, "stale callback must not clear the new frame handle");
  assert.equal(scheduler.queuedInputs, 2);
  assert.equal(scheduler.submissions, 0);
  const current = callbacks.get(2);
  current(32);
  assert.deepEqual(paints, [{ timestamp: 32, reasons: ["input"], inputs: ["first", "second"] }]);
  current(48);
  assert.equal(scheduler.submissions, 1, "duplicate callback must not paint again");
  scheduler.request("resize");
  const disposed = callbacks.get(3);
  scheduler.dispose();
  disposed(64);
  assert.equal(scheduler.pending, false);
  assert.equal(scheduler.submissions, 1);
  assert.equal(paints.length, 1);
});
