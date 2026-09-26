import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData, init_tags as initTags, CalcitSliceList } from "../target/js/retained-component/calcit.core.mjs";
import { start, update_plan as updatePlan, reference_at as referenceAt, make_request as makeRequest, declare_demo as declareDemo } from "../target/js/retained-component/quamolit.test.retained-component-fixture.mjs";
import { build_component_plan as buildPlan, update_component_plan as updateComponentPlan, sample_plan_at as sampleAt } from "../target/js/retained-component/quamolit.retained-component.mjs";
import { declare_mixed as declareMixed, start_mixed as startMixed } from "../target/js/retained-component/quamolit.test.retained-component-fixture.mjs";
import { build_execution_plan as buildExecution, update_execution_plan as updateExecution } from "../target/js/retained-component/quamolit.retained-component.mjs";
import { presence_document as presenceDocument, presence_initial as presenceInitial, presence_exit as presenceExit, presence_plan as presencePlan } from "../target/js/retained-component/quamolit.test.retained-component-fixture.mjs";
import { declare_flat as declarePresence } from "../target/js/retained-component/quamolit.presence-component.mjs";
import { reconcile_presence as reconcile, settle_presence as settle, presence_needs_frame_$q_ as needsFrame } from "../target/js/retained-component/quamolit.presence.mjs";
import { _$n_enum_$o_nth as enumNth } from "../target/js/retained-component/calcit.core.mjs";
import { apply_scalar as applyScalar } from "../target/js/retained-component/quamolit.scene-binding.mjs";
import { validate_scene as validateScene } from "../target/js/retained-component/quamolit.scene-ir.mjs";

const tags = initTags(["scene", "nodes", "slots", "versions", "id", "component", "motion", "model", "input", "resources", "viewport", "motions", "declarations", "plan-builds", "binding-samples", "node-writes", "skipped-updates", "transforms", "transform-samples"]);
const field = (x, key) => x.get(tags[key]);
const nodesOf = (plan) => field(field(plan, "scene"), "nodes");
const sceneOf = (plan) => toJsData(field(plan, "scene"));
const presenceTags = initTags(["items", "alpha", "easing", "model", "released", "content", "points", "bindings", "entry", "node", "parent", "key", "target"]);
const get = (x, key) => x.get(presenceTags[key]);
const empty = new CalcitSliceList([]);
const easing = () => get(get(get(presenceInitial(), "items").get(0), "alpha"), "easing");

test("Presence 统一执行：1000 帧共享折线几何，乱序采样不结算 Model", () => {
  const model = presenceExit(), before = toJsData(model);
  let plan = presencePlan(model, 0);
  const points = get(enumNth(get(nodesOf(plan).get(1), "content"), 1), "points");
  for (let i = 0; i < 1000; i++) {
    const t = (i % 101) / 100;
    plan = sampleAt(plan, t);
    const nodes = sceneOf(plan).nodes;
    assert.equal(nodes[0].content[1].fill.a, 1 - t);
    assert.equal(nodes[1].content[1].stroke.a, 0.5 * (1 - t));
    assert.deepEqual(nodes[0].interaction, ["none"]);
    assert.equal(get(enumNth(get(nodesOf(plan).get(1), "content"), 1), "points"), points);
  }
  assert.deepEqual(toJsData(model), before);
  assert.equal(field(plan, "plan-builds"), 1);
  assert.equal(field(plan, "declarations"), 1);
});

test("Presence 重入在 25/50/75% 连续，终点释放一次，100 次装卸回到空模型", () => {
  for (const t of [0.25, 0.5, 0.75]) {
    const exiting = presenceExit();
    const revived = get(reconcile(exiting, presenceDocument(), t, 1, easing()), "model");
    const before = sceneOf(presencePlan(exiting, t)).nodes;
    const after = sceneOf(presencePlan(revived, t)).nodes;
    assert.deepEqual(after.map(n => n.content), before.map(n => n.content));
    assert.deepEqual(after[0].interaction, ["target", "badge"]);
    assert.equal(toJsData(get(settle(revived, t + 1), "released")).length, 0);
  }
  for (let i = 0; i < 100; i++) {
    const exiting = presenceExit();
    assert.equal(needsFrame(exiting, 1), true, "终点仍需要一次显式结算");
    const finished = settle(exiting, 1), model = get(finished, "model");
    assert.equal(toJsData(get(finished, "released")).length, 2);
    assert.equal(toJsData(get(settle(model, 1), "released")).length, 0);
    assert.equal(toJsData(nodesOf(presencePlan(model, 1))).length, 0);
    assert.equal(needsFrame(model, 1), false);
  }
});

test("Presence 声明拒绝 alpha 冲突、非平面子节点和 Motion ID 冲突", () => {
  const model = presenceInitial();
  const declaration = declarePresence(model, empty);
  const items = get(model, "items"), item = items.get(0), entry = get(item, "entry");
  const node = get(entry, "node");
  const changeNode = next => model.assoc(presenceTags.items, new CalcitSliceList([
    item.assoc(presenceTags.entry, entry.assoc(presenceTags.node, next)), items.get(1),
  ]));
  const bound = field(field(declaration, "scene"), "nodes").get(0);
  assert.throws(() => declarePresence(changeNode(node.assoc(presenceTags.bindings, get(bound, "bindings"))), empty), /presence-alpha-binding-conflict/);
  assert.throws(() => declarePresence(changeNode(node.assoc(presenceTags.parent, "parent")), empty), /presence-requires-flat-leaf/);
  assert.throws(() => declarePresence(model, field(declaration, "motions")), /duplicate-motion-descriptor/);
  assert.deepEqual(toJsData(model), toJsData(presenceInitial()), "失败不修改输入 Model");
});

test("Presence 进入、重排和同 key 换类型沿用逻辑身份，不重复渲染 ID", () => {
  const initial = presenceInitial(), document = presenceDocument();
  const nodes = field(document, "nodes");
  const emptyModel = get(settle(presenceExit(), 1), "model");
  const entered = get(reconcile(emptyModel, document, 2, 1, easing()), "model");
  assert.equal(sceneOf(presencePlan(entered, 2.5)).nodes[0].content[1].fill.a, 0.5);
  const reorderedDocument = document.assoc(tags.nodes, new CalcitSliceList([nodes.get(1), nodes.get(0)]));
  const reordered = get(reconcile(initial, reorderedDocument, 0, 1, easing()), "model");
  assert.deepEqual(sceneOf(presencePlan(reordered, 0)).nodes.map(n => n.content[0]), ["polyline", "rect"]);
  const changed = nodes.get(1).assoc(presenceTags.key, get(nodes.get(0), "key"));
  const changedDocument = document.assoc(tags.nodes, new CalcitSliceList([changed]));
  const remounted = get(reconcile(initial, changedDocument, 0, 1, easing()), "model");
  const frame = sceneOf(presencePlan(remounted, 0.5));
  assert.equal(frame.nodes.length, 3);
  assert.equal(new Set(frame.nodes.map(n => n.id)).size, 3);
  assert.equal(frame.nodes[0].content[1].stroke.a, 0.25);
  assert.equal(toJsData(get(settle(remounted, 1), "released")).length, 2);
});

test("叶节点 alpha 越界不裁剪，Scene 验证明确拒绝", () => {
  const declaration = declarePresence(presenceInitial(), empty);
  const document = field(declaration, "scene"), nodes = field(document, "nodes");
  for (const node of [nodes.get(0), nodes.get(1)]) {
    const target = get(get(node, "bindings").get(0), "target");
    for (const value of [-0.1, 1.1, NaN, Infinity]) {
      const invalid = node.assoc(presenceTags.content, applyScalar(get(node, "content"), target, value));
      assert.throws(() => validateScene(document.assoc(tags.nodes, new CalcitSliceList([invalid]))));
    }
  }
});

test("统一执行计划：混合标量/折线变换共享结构，六类版本同时失效", () => {
  let calls=0;
  const declare=(...args)=>{calls++;return declareMixed(...args);};
  let plan=buildExecution(makeRequest(0,40,false,100),declare);
  const path=nodesOf(plan).get(65),slots=field(plan,"slots");
  for(let i=1;i<=1000;i++){
    const time=i%2 ? i/1000 : -i/1000;
    plan=updateExecution(plan,makeRequest(time,40,false,100),declare);
    assert.equal(nodesOf(plan).get(65),path);
    assert.equal(field(plan,"slots"),slots);
    assert.deepEqual(sceneOf(plan).nodes.slice(0,65),toJsData(referenceAt(time,40,false,100)).nodes);
    assert.equal(toJsData(field(plan,"transforms")).at(-1).e,40+10*time);
  }
  assert.equal(calls,1);assert.equal(field(plan,"transform-samples"),1001);
  const same=updateExecution(plan,makeRequest(-1,40,false,100),declare);
  assert.equal(field(same,"transforms"),field(plan,"transforms"));
  assert.equal(field(same,"transform-samples"),1001);
  for(const version of ["component","motion","model","input","resources","viewport"]){
    const request=makeRequest(-1,40,false,100);
    const changed=request.assoc(tags.versions,field(request,"versions").assoc(tags[version],999));
    const next=updateExecution(plan,changed,declare);
    assert.equal(field(next,"plan-builds"),2);
    assert.notEqual(nodesOf(next).get(65),path);
  }
  const changed=updateExecution(plan,makeRequest(-1,41,false,100),declare);
  assert.equal(toJsData(field(changed,"transforms")).at(-1).e,31);
  assert.equal(sceneOf(changed).nodes[64].content[1].y,63);
  const broken=(...args)=>{const d=declareMixed(...args);return d.assoc(tags.transforms,null);};
  assert.throws(()=>buildExecution(makeRequest(0,40,false,100),broken));
  assert.equal(nodesOf(plan).get(65),path);
  assert.equal(sceneOf(startMixed(0,40,false,100)).nodes.length,66);
});

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
