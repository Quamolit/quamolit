import assert from "node:assert/strict";
import { test } from "node:test";
import { init_tags as initTags, to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { instance_presence_document as instanceDocument, instance_presence_reconcile as reconcile } from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import { presence_needs_frame_$q_ as needsFrame, settle_presence as settle, start_presence as start } from "../target/js/motion/quamolit.presence.mjs";
import { InstanceSourceRegistry } from "./host/instance-sources.mjs";
import { PresenceInstanceResources } from "./host/presence-resources.mjs";

const { model: modelTag } = initTags(["model"]);
const sourceAt = (version) => toJsData(instanceDocument(version, true)).nodes[1].content[1].source;
const nextModel = (update) => update.nthAt(0, modelTag);

test("100 mount/exit cycles return typed model and host resources to baseline", () => {
  const registry = new InstanceSourceRegistry();
  const resources = new PresenceInstanceResources(registry);
  let model = start(instanceDocument(0, false));
  assert.deepEqual(resources.sync(model), { liveReferences: 0, liveSources: 0, released: 0 });
  const positions = new Float32Array(20000);
  positions[0] = 40;
  positions[1] = 50;
  let releaseCount = 0;
  for (let version = 1; version <= 100; version++) {
    const time = version * 2;
    const source = sourceAt(version);
    registry.register(source, positions);
    model = nextModel(reconcile(model, version, time, true));
    assert.deepEqual(resources.sync(model), { liveReferences: 1, liveSources: 1, released: 0 });
    assert.equal(registry.liveCount, 1);
    model = nextModel(reconcile(model, version, time + 0.5, false));
    assert.deepEqual(resources.sync(model), { liveReferences: 1, liveSources: 1, released: 0 });
    assert.equal(registry.liveCount, 1, "exit retains its source until completion");
    const completed = settle(model, time + 0.75);
    assert.equal(toJsData(completed).released.length, 1);
    model = nextModel(completed);
    const update = resources.sync(model);
    releaseCount += update.released;
    assert.deepEqual(update, { liveReferences: 0, liveSources: 0, released: 1 });
    assert.equal(registry.liveCount, 0);
    assert.equal(toJsData(model).items.length, 1, "only the root remains");
    assert.equal(needsFrame(model, time + 0.75), false);
    assert.equal(toJsData(settle(model, time + 1)).released.length, 0);
    assert.equal(resources.sync(model).released, 0);
  }
  assert.equal(releaseCount, 100);
});

test("reentry before exit completion reuses the old resource without release", () => {
  const registry = new InstanceSourceRegistry();
  const resources = new PresenceInstanceResources(registry);
  const source = sourceAt(1);
  registry.register(source, new Float32Array(source.count * 2));
  let model = start(instanceDocument(1, true));
  resources.sync(model);
  model = nextModel(reconcile(model, 1, 0.5, false));
  assert.equal(resources.sync(model).released, 0);
  const revived = reconcile(model, 1, 0.625, true);
  assert.equal(toJsData(revived).released.length, 0);
  model = nextModel(revived);
  assert.deepEqual(resources.sync(model), { liveReferences: 1, liveSources: 1, released: 0 });
  assert.equal(registry.liveCount, 1);
  assert.equal(resources.clear().released, 1);
  assert.equal(registry.liveCount, 0);
});

test("unregistered source rejects model sync without dropping retained source", () => {
  const registry = new InstanceSourceRegistry();
  const resources = new PresenceInstanceResources(registry);
  const source = sourceAt(1);
  registry.register(source, new Float32Array(source.count * 2));
  const oldModel = start(instanceDocument(1, true));
  resources.sync(oldModel);
  const newModel = start(instanceDocument(2, true));
  assert.throws(() => resources.sync(newModel), /unavailable/);
  assert.equal(registry.liveCount, 1);
  assert.equal(resources.sync(oldModel).liveSources, 1);
});

test("one registry cannot have two Presence owners", () => {
  const registry = new InstanceSourceRegistry();
  new PresenceInstanceResources(registry);
  assert.throws(() => new PresenceInstanceResources(registry), /already has a Presence owner/);
});
