import assert from "node:assert/strict";
import { test } from "node:test";
import { init_tags as initTags, to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import {
  instance_presence_document as instanceDocument,
  instance_presence_reconcile as reconcile,
} from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import {
  close_presence_resources as closeResources,
  initial_presence_resources as initialResources,
  ready_presence_resource as readyResource,
  sync_presence_resources as syncResources,
} from "../target/js/motion/quamolit.presence-resource-registry.mjs";
import { registry_metrics as registryMetrics } from "../target/js/motion/quamolit.resource-lifecycle.mjs";
import { settle_presence as settle, start_presence as start } from "../target/js/motion/quamolit.presence.mjs";

const tags = initTags(["actions", "model", "registry", "state"]);
const nextModel = (update) => update.nthAt(0, tags.model);
const unpack = (transition) => ({
  state: transition.get(tags.state),
  actions: toJsData(transition.get(tags.actions)),
});
const metrics = (state) => toJsData(registryMetrics(state.get(tags.registry)));

test("Presence 退出转为空闲资源，完成前重入与缓存重入都不重复加载", () => {
  let resources = initialResources(80000);
  let model = start(instanceDocument(1, true));
  const mounted = syncResources(resources, model);
  const rawActions = mounted.get(tags.actions);
  const descriptor = rawActions.value[rawActions.start].extra[0];
  let result = unpack(mounted);
  resources = result.state;
  const identity = result.actions[0][1];
  assert.deepEqual(result.actions, [["resource", identity, ["load", 1, identity]]]);

  result = unpack(readyResource(resources, descriptor, 1));
  resources = result.state;
  assert.deepEqual(result.actions, [
    ["resource", identity, ["install", 1, identity]],
    ["resource", identity, ["wake-frame", 1]],
  ]);

  model = nextModel(reconcile(model, 1, 0.5, false));
  result = unpack(syncResources(resources, model));
  resources = result.state;
  assert.deepEqual(result.actions, []);
  assert.equal(metrics(resources).leased, 1, "退出动画仍持有资源");

  model = nextModel(reconcile(model, 1, 0.625, true));
  result = unpack(syncResources(resources, model));
  resources = result.state;
  assert.deepEqual(result.actions, []);
  assert.equal(metrics(resources).loads, 1, "退出完成前重入不会重复加载");

  model = nextModel(reconcile(model, 1, 1, false));
  resources = unpack(syncResources(resources, model)).state;
  model = nextModel(settle(model, 1.25));
  result = unpack(syncResources(resources, model));
  resources = result.state;
  assert.deepEqual(result.actions, []);
  assert.deepEqual(metrics(resources), {
    resident: 1,
    leased: 0,
    idle: 1,
    "resident-bytes": 80000,
    loads: 1,
    evictions: 0,
  });

  model = nextModel(reconcile(model, 1, 1.5, true));
  result = unpack(syncResources(resources, model));
  resources = result.state;
  assert.deepEqual(result.actions, []);
  assert.equal(metrics(resources).loads, 1, "空闲缓存重入复用同一资源");
});

test("容量替换先释放旧 lease，再按身份驱逐旧 buffer 并加载新版本", () => {
  let resources = initialResources(80000);
  let model = start(instanceDocument(1, true));
  let result = unpack(syncResources(resources, model));
  resources = result.state;
  const oldIdentity = result.actions[0][1];

  model = nextModel(reconcile(model, 2, 0.5, true));
  result = unpack(syncResources(resources, model));
  resources = result.state;
  const nextIdentity = result.actions[1][1];
  assert.equal(oldIdentity.version, 1);
  assert.equal(nextIdentity.version, 2);
  assert.deepEqual(result.actions, [
    ["resource", oldIdentity, ["release", 1]],
    ["resource", nextIdentity, ["load", 1, nextIdentity]],
  ]);
  assert.deepEqual(metrics(resources), {
    resident: 1,
    leased: 1,
    idle: 0,
    "resident-bytes": 80000,
    loads: 2,
    evictions: 1,
  });
});

test("100 次真实 Presence 出入保持一个 buffer 容量，显式关闭回到零", () => {
  let resources = initialResources(80000);
  let model = start(instanceDocument(0, false));
  let loads = 0;
  let releases = 0;

  for (let version = 1; version <= 100; version += 1) {
    const time = version * 2;
    model = nextModel(reconcile(model, version, time, true));
    let result = unpack(syncResources(resources, model));
    resources = result.state;
    loads += result.actions.filter((action) => action[2][0] === "load").length;
    releases += result.actions.filter((action) => action[2][0] === "release").length;

    model = nextModel(reconcile(model, version, time + 0.5, false));
    resources = unpack(syncResources(resources, model)).state;
    model = nextModel(settle(model, time + 0.75));
    result = unpack(syncResources(resources, model));
    resources = result.state;

    const current = metrics(resources);
    assert.equal(current.resident, 1);
    assert.equal(current.leased, 0);
    assert.equal(current["resident-bytes"], 80000);
  }

  assert.equal(loads, 100);
  assert.equal(releases, 99);
  let result = unpack(closeResources(resources));
  resources = result.state;
  releases += result.actions.filter((action) => action[2][0] === "release").length;
  assert.equal(releases, 100);
  assert.deepEqual(metrics(resources), {
    resident: 0,
    leased: 0,
    idle: 0,
    "resident-bytes": 0,
    loads: 100,
    evictions: 99,
  });
});
