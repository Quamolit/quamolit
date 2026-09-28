import assert from "node:assert/strict";
import { test } from "node:test";
import {
  close_recovery,
  create_failed,
  create_ready,
  create_resolved,
  device_lost,
  initial_state,
  probe_failed,
  probe_fallback,
  probe_ready,
  probe_resolved,
  request_open,
} from "../target/js/motion/quamolit.device-recovery.mjs";
import { init_tags, to_js_data } from "../target/js/motion/calcit.core.mjs";

const tags = init_tags(["state", "actions"]);
const unpack = (transition) => ({
  state: transition.get(tags.state),
  actions: to_js_data(transition.get(tags.actions)),
});

test("loss 使用相同资源版本自动进入新 generation，并拒绝迟到结果", () => {
  let state = initial_state(7);
  let result = unpack(request_open(state, 7));
  state = result.state;
  assert.deepEqual(result.actions, [["probe", 1, 7]]);

  result = unpack(request_open(state, 7));
  assert.equal(result.state, state, "相同版本的并发 open 复用进行中的 generation");
  assert.deepEqual(result.actions, []);

  result = unpack(probe_resolved(state, 1, probe_ready()));
  state = result.state;
  assert.deepEqual(result.actions, [["create", 1, 7]]);
  result = unpack(create_resolved(state, 1, create_ready()));
  state = result.state;
  assert.deepEqual(result.actions, [["install", 1, 7]]);
  assert.deepEqual(to_js_data(state), {
    attempts: 1,
    generation: 1,
    losses: 0,
    phase: ["ready"],
    "resource-version": 7,
  });

  result = unpack(device_lost(state, 1, "device removed"));
  state = result.state;
  assert.deepEqual(result.actions, [
    ["release", 1],
    ["show-fallback", 1, "device removed"],
    ["probe", 2, 7],
  ]);
  assert.equal(to_js_data(state).losses, 1);
  assert.equal(to_js_data(state).attempts, 2);

  assert.deepEqual(unpack(device_lost(state, 1, "late loss")).actions, []);
  assert.deepEqual(unpack(create_resolved(state, 1, create_ready())).actions, [["release", 1]]);

  result = unpack(probe_resolved(state, 2, probe_ready()));
  state = result.state;
  result = unpack(create_resolved(state, 2, create_ready()));
  state = result.state;
  assert.deepEqual(result.actions, [["install", 2, 7]]);
  assert.deepEqual(to_js_data(state).phase, ["ready"]);
});

test("资源版本变化释放旧代，失败/软件回退可重试且 close 幂等失效", () => {
  let state = initial_state(3);
  ({ state } = unpack(request_open(state, 3)));
  ({ state } = unpack(probe_resolved(state, 1, probe_ready())));
  ({ state } = unpack(create_resolved(state, 1, create_ready())));

  let result = unpack(request_open(state, 4));
  state = result.state;
  assert.deepEqual(result.actions, [
    ["release", 1],
    ["probe", 2, 4],
  ]);

  result = unpack(probe_resolved(state, 2, probe_fallback("software adapter")));
  state = result.state;
  assert.deepEqual(result.actions, [
    ["release", 2],
    ["show-fallback", 2, "software adapter"],
  ]);

  result = unpack(request_open(state, 4));
  state = result.state;
  assert.deepEqual(result.actions, [["probe", 3, 4]]);
  result = unpack(probe_resolved(state, 3, probe_failed("permission denied")));
  state = result.state;
  assert.deepEqual(result.actions, [["show-failure", 3, "permission denied"]]);

  result = unpack(close_recovery(state));
  state = result.state;
  assert.deepEqual(result.actions, []);
  assert.deepEqual(to_js_data(state).phase, ["closed"]);
  assert.deepEqual(unpack(probe_resolved(state, 3, probe_ready())).actions, [["release", 3]]);
});

test("宿主动作执行器可在 100 次丢失/重建后保持单一 live generation", () => {
  let state = initial_state(11);
  const live = new Set();
  let installed = 0;
  const apply = (actions) => {
    for (const [kind, generation] of actions) {
      if (kind === "probe") live.add(generation);
      if (kind === "release") live.delete(generation);
      if (kind === "install") installed += 1;
    }
  };
  let result = unpack(request_open(state, 11));
  state = result.state;
  apply(result.actions);
  ({ state } = unpack(probe_resolved(state, 1, probe_ready())));
  result = unpack(create_resolved(state, 1, create_ready()));
  state = result.state;
  apply(result.actions);

  for (let i = 0; i < 100; i++) {
    const generation = to_js_data(state).generation;
    result = unpack(device_lost(state, generation, `loss-${i}`));
    state = result.state;
    apply(result.actions);
    const next = to_js_data(state).generation;
    ({ state } = unpack(probe_resolved(state, next, probe_ready())));
    result = unpack(create_resolved(state, next, create_ready()));
    state = result.state;
    apply(result.actions);
    assert.deepEqual([...live], [next]);
  }
  result = unpack(close_recovery(state));
  apply(result.actions);
  assert.equal(live.size, 0);
  assert.equal(installed, 101);
  assert.equal(to_js_data(result.state).losses, 100);
});

test("资源版本必须是非负整数", () => {
  for (const value of [-1, 1.5, NaN, Infinity]) assert.throws(() => initial_state(value));
  assert.deepEqual(to_js_data(create_failed("pipeline failed")), ["failed", "pipeline failed"]);
});
