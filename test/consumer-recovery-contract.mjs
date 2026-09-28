import assert from "node:assert/strict";

export function verifyRecoveryConsumer(app, core) {
  const tags = core.init_tags(["state", "actions"]);
  const unpack = (transition) => ({
    state: transition.get(tags.state),
    actions: core.to_js_data(transition.get(tags.actions)),
  });
  const snapshot = (state) => core.to_js_data(state);

  let state = app.gpu_recovery_initial(1);
  let result = unpack(app.gpu_recovery_open(state, 1));
  state = result.state;
  assert.deepEqual(result.actions, [["probe", 1, 1]]);

  ({ state } = unpack(app.gpu_recovery_probe_ready(state, 1)));
  result = unpack(app.gpu_recovery_create_ready(state, 1));
  state = result.state;
  assert.deepEqual(result.actions, [["install", 1, 1]]);

  const live = new Set([1]);
  let releases = 0;
  for (let cycle = 0; cycle < 100; cycle++) {
    const generation = snapshot(state).generation;
    result = unpack(app.gpu_recovery_lost(state, generation, `loss-${cycle}`));
    state = result.state;
    assert.deepEqual(result.actions, [
      ["release", generation],
      ["show-fallback", generation, `loss-${cycle}`],
      ["probe", generation + 1, snapshot(state)["resource-version"]],
    ]);
    live.delete(generation);
    releases += 1;
    live.add(generation + 1);

    // 旧 device 的异步结果不能覆盖新一代，也不能重复安装。
    assert.deepEqual(unpack(app.gpu_recovery_create_ready(state, generation)).actions, [["release", generation]]);
    ({ state } = unpack(app.gpu_recovery_probe_ready(state, generation + 1)));
    result = unpack(app.gpu_recovery_create_ready(state, generation + 1));
    state = result.state;
    assert.deepEqual(result.actions, [["install", generation + 1, 1]]);
    assert.deepEqual([...live], [generation + 1]);
  }

  state = app.gpu_recovery_update_version(state, 2);
  assert.equal(snapshot(state)["resource-version"], 2, "逻辑资源更新不应误建第二个 device");
  assert.deepEqual(unpack(app.gpu_recovery_open(state, 2)).actions, [], "当前 ready generation 可复用更新后的资源");

  result = unpack(app.gpu_recovery_close(state));
  state = result.state;
  assert.deepEqual(result.actions, [["release", 101]]);
  live.delete(101);
  releases += 1;
  assert.equal(live.size, 0);
  assert.deepEqual(snapshot(state).phase, ["closed"]);
  assert.deepEqual(unpack(app.gpu_recovery_probe_ready(state, 101)).actions, [["release", 101]]);

  return { lossCycles: 100, generations: 101, releases, live: live.size };
}
