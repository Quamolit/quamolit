import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData, init_tags as initTags, CalcitSliceList } from "../target/js/retained-component/calcit.core.mjs";
import { start, update_plan as updatePlan, reference_at as referenceAt, make_request as makeRequest, declare_demo as declareDemo } from "../target/js/retained-component/quamolit.test.retained-component-fixture.mjs";
import { build_component_plan as buildPlan, update_component_plan as updateComponentPlan, sample_plan_at as sampleAt } from "../target/js/retained-component/quamolit.retained-component.mjs";

const tags = initTags(["scene", "nodes", "slots", "versions", "id", "component", "motion", "model", "input", "resources", "viewport", "motions", "declarations", "plan-builds", "binding-samples", "node-writes", "skipped-updates"]);
const field = (x, key) => x.get(tags[key]);
const nodesOf = (plan) => field(field(plan, "scene"), "nodes");
const sceneOf = (plan) => toJsData(field(plan, "scene"));

test("1000 个时间帧只声明一次，编译槽位和 64 个静态节点保留身份", () => {
  let calls = 0;
  const declare = (...args) => { calls++; return declareDemo(...args); };
  let plan = buildPlan(makeRequest(0, 40, false, 100), declare);
  const original = plan;
  const slots = field(plan, "slots");
  const staticNodes = Array.from({ length: 64 }, (_, i) => nodesOf(plan).get(i));
  for (let i = 1; i <= 1000; i++) {
    const time = i / 1000;
    plan = updateComponentPlan(plan, makeRequest(time, 40, false, 100), declare);
    assert.deepEqual(sceneOf(plan), toJsData(referenceAt(time, 40, false, 100)));
    assert.equal(field(plan, "slots"), slots);
    for (let j = 0; j < 64; j++) assert.equal(nodesOf(plan).get(j), staticNodes[j]);
  }
  assert.equal(calls, 1);
  assert.equal(field(plan, "declarations"), 1);
  assert.equal(field(plan, "plan-builds"), 1);
  assert.equal(field(plan, "binding-samples"), 1001);
  assert.equal(field(plan, "node-writes"), 1001);
  assert.equal(sceneOf(original).nodes.at(-1).content[1].x, 80, "先前持有的帧保持不可变");
});

test("乱序、重复时间与六类版本失效使用同一组件声明合同", () => {
  let plan = start(0.5, 40, false, 100);
  for (const [time, x] of [[1, 120], [0, 80], [0.5, 100], [0.25, 90], [1, 120]]) {
    plan = updatePlan(plan, time, 40, false, 100);
    assert.equal(sceneOf(plan).nodes.at(-1).content[1].x, x);
  }
  const repeat = sampleAt(plan, 1);
  assert.equal(field(repeat, "scene"), field(plan, "scene"));
  assert.equal(field(repeat, "binding-samples"), field(plan, "binding-samples"));
  assert.equal(field(repeat, "skipped-updates"), 1);
  for (const key of ["component", "motion", "model", "input", "resources", "viewport"]) {
    const request = makeRequest(1, 40, false, 100);
    const versions = field(request, "versions");
    const changed = request.assoc(tags.versions, versions.assoc(tags[key], field(versions, key) + 1));
    const next = updateComponentPlan(plan, changed, declareDemo);
    assert.equal(field(next, "declarations"), 2, key);
    assert.notEqual(field(next, "slots"), field(plan, "slots"), key);
  }
  const changedId = makeRequest(1, 40, false, 100).assoc(tags.id, "another");
  assert.equal(field(updateComponentPlan(plan, changedId, declareDemo), "declarations"), 2);
  const updated = updatePlan(plan, 1, 41, true, 110);
  assert.deepEqual(sceneOf(updated), toJsData(referenceAt(1, 41, true, 110)));
  const rect = sceneOf(updated).nodes.at(-1).content[1];
  assert.equal(rect.y, 63);
  assert.equal(rect.width, 11);
  assert.equal(rect.fill.g, 0.7);
});

test("非法请求或缺失描述符不污染旧计划，无绑定场景不重建画面", () => {
  const plan = start(0.5, 40, false, 100);
  const before = sceneOf(plan);
  for (const time of [NaN, Infinity, -Infinity]) assert.throws(() => sampleAt(plan, time), /invalid-component-time/);
  assert.throws(() => updatePlan(plan, 0.5, -1, false, 100), /invalid-component-request/);
  const missing = (...args) => declareDemo(...args).assoc(tags.motions, new CalcitSliceList([]));
  assert.throws(() => updateComponentPlan(plan, makeRequest(0.5, 41, false, 100), missing), /missing-motion-descriptor/);
  assert.deepEqual(sceneOf(plan), before);
  const staticOnly = (...args) => {
    const declaration = declareDemo(...args);
    const scene = field(declaration, "scene");
    const nodes = field(scene, "nodes");
    return declaration.assoc(tags.scene, scene.assoc(tags.nodes, new CalcitSliceList([nodes.get(0)])));
  };
  const initial = buildPlan(makeRequest(0, 40, false, 100), staticOnly);
  const next = sampleAt(initial, -10);
  assert.equal(field(next, "scene"), field(initial, "scene"));
  assert.equal(field(next, "node-writes"), 0);
});
