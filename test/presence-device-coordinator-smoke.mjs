import assert from "node:assert/strict";
import { test } from "node:test";
import { init_tags as initTags, to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import {
  close,
  create_resolved as createResolved,
  device_lost as deviceLost,
  initial_state as initialState,
  probe_resolved as probeResolved,
  request_open as requestOpen,
  resource_failed as resourceFailed,
  resource_ready as resourceReady,
  sync_presence as syncPresence,
} from "../target/js/motion/quamolit.presence-device-coordinator.mjs";
import {
  create_ready as createReady,
  probe_ready as probeReady,
} from "../target/js/motion/quamolit.device-recovery.mjs";
import { instance_resource_identity as instanceResourceIdentity } from "../target/js/motion/quamolit.presence-resource-registry.mjs";
import { start_presence as start } from "../target/js/motion/quamolit.presence.mjs";
import { instance_presence_document as instanceDocument } from "../target/js/motion/quamolit.test.motion-fixture.mjs";

const tags = initTags(["actions", "plan", "recovery", "references", "resources", "source", "state"]);
const values = (list) => list.value.slice(list.start, list.end);
const stateOf = (transition) => transition.get(tags.state);
const actionsOf = (transition) => values(transition.get(tags.actions)).map((action) => toJsData(action));
const sourceOf = (state) => values(state.get(tags.resources).get(tags.plan).get(tags.references))[0].get(tags.source);

function reachFirstReady(model) {
  let state = initialState(80000, 1);
  let transition = syncPresence(state, model);
  state = stateOf(transition);
  assert.deepEqual(actionsOf(transition), [], "设备 ready 前只更新逻辑资源表，不提前执行 GPU load");

  transition = requestOpen(state, 1);
  state = stateOf(transition);
  assert.deepEqual(actionsOf(transition), [["device", ["probe", 1, 1]]]);

  transition = probeResolved(state, 1, probeReady());
  state = stateOf(transition);
  assert.deepEqual(actionsOf(transition), [["device", ["create", 1, 1]]]);

  const identity = toJsData(instanceResourceIdentity(sourceOf(state)));
  transition = createResolved(state, 1, createReady());
  state = stateOf(transition);
  assert.deepEqual(actionsOf(transition), [
    ["device", ["install", 1, 1]],
    ["resource", 1, ["resource", identity, ["release", 1]]],
    ["resource", 1, ["resource", identity, ["load", 3, identity]]],
  ]);
  return { state, identity };
}

test("首次 device 安装后才重建 Presence 资源，并自动接收 ready", () => {
  const model = start(instanceDocument(7, true));
  let { state, identity } = reachFirstReady(model);

  let transition = resourceReady(state, 1, sourceIdentity(state), 3);
  state = stateOf(transition);
  assert.deepEqual(actionsOf(transition), [
    ["resource", 1, ["resource", identity, ["install", 3, identity]]],
    ["resource", 1, ["resource", identity, ["wake-frame", 3]]],
  ]);

  transition = close(state);
  assert.deepEqual(actionsOf(transition), [
    ["resource", 1, ["resource", identity, ["release", 3]]],
    ["device", ["release", 1]],
  ]);
});

test("device loss 保留 Model，第二代安装后重建；旧设备完成不能污染新设备", () => {
  const model = start(instanceDocument(12, true));
  let { state, identity } = reachFirstReady(model);
  const descriptor = sourceIdentity(state);
  state = stateOf(resourceReady(state, 1, descriptor, 3));

  let transition = deviceLost(state, 1, "simulated-loss");
  state = stateOf(transition);
  assert.deepEqual(actionsOf(transition), [
    ["device", ["release", 1]],
    ["device", ["show-fallback", 1, "simulated-loss"]],
    ["device", ["probe", 2, 1]],
  ]);

  transition = syncPresence(state, model);
  state = stateOf(transition);
  assert.deepEqual(actionsOf(transition), [], "恢复期间继续保留声明式 Model，但不触碰失效 device");

  transition = resourceReady(state, 1, descriptor, 3);
  assert.equal(stateOf(transition), state, "旧设备完成不得改变逻辑 registry");
  assert.deepEqual(actionsOf(transition), [["resource", 1, ["resource", identity, ["release", 3]]]]);

  transition = probeResolved(state, 2, probeReady());
  state = stateOf(transition);
  assert.deepEqual(actionsOf(transition), [["device", ["create", 2, 1]]]);

  transition = createResolved(state, 2, createReady());
  state = stateOf(transition);
  assert.deepEqual(actionsOf(transition), [
    ["device", ["install", 2, 1]],
    ["resource", 2, ["resource", identity, ["release", 3]]],
    ["resource", 2, ["resource", identity, ["load", 5, identity]]],
  ]);

  transition = resourceFailed(state, 1, descriptor, 3, "old-device-failure");
  assert.equal(stateOf(transition), state);
  assert.deepEqual(actionsOf(transition), [], "旧设备失败不得覆盖第二代 loading 状态");

  transition = resourceReady(state, 2, descriptor, 5);
  assert.deepEqual(actionsOf(transition), [
    ["resource", 2, ["resource", identity, ["install", 5, identity]]],
    ["resource", 2, ["resource", identity, ["wake-frame", 5]]],
  ]);
});

function sourceIdentity(state) {
  return instanceResourceIdentity(sourceOf(state));
}
