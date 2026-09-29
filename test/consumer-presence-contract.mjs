import assert from "node:assert/strict";

const near = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) <= 1e-12, `${message}: ${actual} != ${expected}`);

export function verifyPresenceConsumer(app, core) {
  const tags = core.init_tags(["model", "released"]);
  const unpack = (update) => ({
    model: update.get(tags.model),
    released: core.to_js_data(update.get(tags.released)),
  });
  const sample = (model, time) => core.to_js_data(app.presence_sample(model, time));

  let model = app.presence_initial();
  assert.deepEqual(
    sample(model, 0).map((item) => item.entry.node.key),
    ["a", "b"],
  );
  assert.equal(app.presence_needs_frame_$q_(model, 0), false);

  ({ model } = unpack(app.presence_reconcile(model, "reordered", 0)));
  assert.deepEqual(
    sample(model, 0).map((item) => item.entry.node.key),
    ["b", "a"],
  );
  assert.ok(sample(model, 0).every((item) => item.alpha === 1 && item.interactive));

  ({ model } = unpack(app.presence_reconcile(model, "without-a", 0)));
  assert.equal(app.presence_needs_frame_$q_(model, 0), true);
  for (const [time, alpha] of [
    [0.25, 0.84375],
    [0.5, 0.5],
    [0.75, 0.15625],
  ]) {
    const items = sample(model, time);
    assert.deepEqual(
      items.map((item) => item.entry.node.key),
      ["b", "a"],
    );
    near(items[1].alpha, alpha, `退出 alpha @ ${time}`);
    assert.equal(items[1].interactive, false, "退出实例立即停止交互");
  }

  let interrupted = unpack(app.presence_reconcile(model, "full", 0.5));
  assert.deepEqual(interrupted.released, []);
  const reentered = (time) => sample(interrupted.model, time).find((item) => item.entry.node.key === "a");
  near(reentered(0.5).alpha, 0.5, "重入从当前值继续");
  assert.ok(reentered(0.75).alpha > 0.5, "重入后 alpha 单调回升");
  assert.equal(reentered(0.5).interactive, true);
  let settled = unpack(app.presence_settle(interrupted.model, 1.5));
  assert.deepEqual(settled.released, []);
  assert.equal(app.presence_needs_frame_$q_(settled.model, 1.5), false);

  ({ model } = unpack(app.presence_reconcile(settled.model, "without-a", 2)));
  settled = unpack(app.presence_settle(model, 3));
  assert.deepEqual(
    settled.released.map((entry) => entry.node.key),
    ["a"],
  );
  assert.deepEqual(unpack(app.presence_settle(settled.model, 4)).released, [], "释放通知只出现一次");

  const positions = new Float32Array(20_000);
  const table = app.create_instances_table_$x_();
  let releases = 0;
  const applyRelease = (plan) => {
    for (const source of core.to_js_data(plan).release) {
      assert.equal(source.id, "consumer-particles");
      assert.equal(app.release_instances_$x_(table, source.version), true);
      releases += 1;
    }
  };
  for (let cycle = 0; cycle < 100; cycle++) {
    const version = cycle + 1;
    assert.equal(app.instances_live_count(table), 0);
    app.register_instances_version_$x_(table, version, positions);
    let resourceModel = app.resource_presence_initial(version);
    let resourcePlan = app.presence_resource_plan(resourceModel, app.empty_presence_resource_plan());
    assert.deepEqual(
      {
        liveReferences: core.to_js_data(resourcePlan)["live-references"],
        liveSources: core.to_js_data(resourcePlan)["live-sources"],
      },
      { liveReferences: 2, liveSources: 1 },
    );

    ({ model: resourceModel } = unpack(app.resource_presence_reconcile(resourceModel, "without-a", 0, version)));
    resourcePlan = app.presence_resource_plan(resourceModel, resourcePlan);
    assert.equal(core.to_js_data(resourcePlan)["live-references"], 2, "退出期间继续持有宿主资源");
    ({ model: resourceModel } = unpack(app.presence_settle(resourceModel, 1)));
    resourcePlan = app.presence_resource_plan(resourceModel, resourcePlan);
    assert.equal(core.to_js_data(resourcePlan)["live-references"], 1, "共享引用未归零时不释放");
    assert.deepEqual(core.to_js_data(resourcePlan).release, []);

    ({ model: resourceModel } = unpack(app.resource_presence_reconcile(resourceModel, "empty", 1, version)));
    resourcePlan = app.presence_resource_plan(resourceModel, resourcePlan);
    assert.equal(core.to_js_data(resourcePlan)["live-references"], 1);
    ({ model: resourceModel } = unpack(app.presence_settle(resourceModel, 2)));
    resourcePlan = app.presence_resource_plan(resourceModel, resourcePlan);
    assert.equal(core.to_js_data(resourcePlan)["live-references"], 0);
    assert.equal(core.to_js_data(resourcePlan).release.length, 1, "最后引用结束时释放一次");
    applyRelease(resourcePlan);
    assert.equal(app.instances_live_count(table), 0, "真实实例表回到基线");
  }

  const plan = app.presence_plan(app.presence_initial(), 0, 1);
  const updatedPlan = app.presence_update_plan(plan, app.presence_initial(), 0.5, 1);
  assert.notEqual(plan, updatedPlan);
  return { lifecycleScenarios: 5, mountCycles: 100, releases, live: app.instances_live_count(table) };
}
