import assert from "node:assert/strict";
import { test } from "node:test";
import { init_tags, to_js_data } from "../target/js/folding-fan/calcit.core.mjs";
import {
  acquire_registry as acquireRegistry,
  close_registry as closeRegistry,
  close_resource as closeResource,
  failed_registry as failedRegistry,
  image_resource as imageResource,
  initial_registry as initialRegistry,
  initial_state as initialState,
  ready_registry as readyRegistry,
  rebuild_registry as rebuildRegistry,
  registry_metrics as registryMetrics,
  release_registry as releaseRegistry,
  request_resource as requestResource,
  resource_failed as resourceFailed,
  resource_ready as resourceReady,
} from "../target/js/folding-fan/quamolit.resource-lifecycle.mjs";

const tags = init_tags(["state", "registry", "actions"]);
const unpack = (transition) => ({
  state: transition.get(tags.state),
  actions: to_js_data(transition.get(tags.actions)),
});
const unpackRegistry = (transition) => ({
  registry: transition.get(tags.registry),
  actions: to_js_data(transition.get(tags.actions)),
});

test("图片资源按 logical id/version 经历 loading、ready 和幂等复用", () => {
  const identity = imageResource("lotus", 1);
  let state = initialState(identity);
  let result = unpack(requestResource(state, identity));
  state = result.state;
  assert.deepEqual(result.actions, [["load", 1, { kind: ["image"], id: "lotus", version: 1 }]]);
  assert.deepEqual(to_js_data(state).phase, ["loading"]);

  result = unpack(requestResource(state, identity));
  assert.equal(result.state, state);
  assert.deepEqual(result.actions, []);

  result = unpack(resourceReady(state, 1));
  state = result.state;
  assert.deepEqual(result.actions, [
    ["install", 1, { kind: ["image"], id: "lotus", version: 1 }],
    ["wake-frame", 1],
  ]);
  assert.deepEqual(to_js_data(state).phase, ["ready"]);
  assert.deepEqual(unpack(requestResource(state, identity)).actions, []);
});

test("版本替换隔离迟到成功，失败可重试并唤醒错误帧", () => {
  let state = initialState(imageResource("lotus", 1));
  ({ state } = unpack(requestResource(state, imageResource("lotus", 1))));

  let result = unpack(requestResource(state, imageResource("lotus", 2)));
  state = result.state;
  assert.deepEqual(result.actions, [
    ["release", 1],
    ["load", 2, { kind: ["image"], id: "lotus", version: 2 }],
  ]);
  assert.deepEqual(unpack(resourceReady(state, 1)).actions, [["release", 1]]);

  result = unpack(resourceFailed(state, 2, "decode failed"));
  state = result.state;
  assert.deepEqual(result.actions, [
    ["release", 2],
    ["show-error", 2, "decode failed"],
    ["wake-frame", 2],
  ]);
  assert.deepEqual(to_js_data(state).phase, ["error", "decode failed"]);

  result = unpack(requestResource(state, imageResource("lotus", 2)));
  state = result.state;
  assert.deepEqual(result.actions[0][0], "load");
  assert.equal(result.actions[0][1], 3);
  result = unpack(closeResource(state));
  assert.deepEqual(result.actions, [["release", 3]]);
  assert.deepEqual(to_js_data(result.state).phase, ["closed"]);
  assert.deepEqual(unpack(resourceReady(result.state, 3)).actions, [["release", 3]]);
});

test("100 次版本替换后宿主最多保留一个 generation，关闭回到零", () => {
  let state = initialState(imageResource("texture", 0));
  const live = new Set();
  const apply = (actions) => {
    for (const [kind, generation] of actions) {
      if (kind === "load") live.add(generation);
      if (kind === "release") live.delete(generation);
    }
  };
  let result = unpack(requestResource(state, imageResource("texture", 0)));
  state = result.state;
  apply(result.actions);
  for (let version = 1; version <= 100; version += 1) {
    result = unpack(requestResource(state, imageResource("texture", version)));
    state = result.state;
    apply(result.actions);
    assert.deepEqual([...live], [version + 1]);
    const stale = unpack(resourceReady(state, version));
    apply(stale.actions);
    assert.deepEqual([...live], [version + 1]);
  }
  result = unpack(resourceReady(state, 101));
  state = result.state;
  apply(result.actions);
  assert.deepEqual([...live], [101]);
  result = unpack(closeResource(state));
  apply(result.actions);
  assert.equal(live.size, 0);
  assert.equal(to_js_data(result.state).attempts, 101);
});

test("逻辑身份拒绝空 id 与非法版本", () => {
  assert.throws(() => imageResource("", 1));
  for (const version of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => imageResource("lotus", version));
  }
});

test("多消费者共享同一资源，只加载一次并按引用计数转为空闲缓存", () => {
  const lotus = imageResource("lotus", 1);
  let registry = initialRegistry(256);
  let result = unpackRegistry(acquireRegistry(registry, lotus, 64));
  registry = result.registry;
  assert.deepEqual(result.actions, [
    [
      "resource",
      { kind: ["image"], id: "lotus", version: 1 },
      ["load", 1, { kind: ["image"], id: "lotus", version: 1 }],
    ],
  ]);

  result = unpackRegistry(acquireRegistry(registry, lotus, 64));
  registry = result.registry;
  assert.deepEqual(result.actions, []);
  assert.deepEqual(to_js_data(registryMetrics(registry)), {
    resident: 1,
    leased: 1,
    idle: 0,
    "resident-bytes": 64,
    loads: 1,
    evictions: 0,
  });

  registry = unpackRegistry(releaseRegistry(registry, lotus)).registry;
  result = unpackRegistry(releaseRegistry(registry, lotus));
  registry = result.registry;
  assert.deepEqual(result.actions, []);
  assert.deepEqual(to_js_data(registryMetrics(registry)), {
    resident: 1,
    leased: 0,
    idle: 1,
    "resident-bytes": 64,
    loads: 1,
    evictions: 0,
  });
  assert.throws(() => releaseRegistry(registry, lotus));
});

test("容量压力按最久未使用顺序淘汰零引用资源", () => {
  const a = imageResource("a", 1);
  const b = imageResource("b", 1);
  const c = imageResource("c", 1);
  let registry = initialRegistry(100);

  registry = unpackRegistry(acquireRegistry(registry, a, 40)).registry;
  registry = unpackRegistry(releaseRegistry(registry, a)).registry;
  registry = unpackRegistry(acquireRegistry(registry, b, 40)).registry;
  registry = unpackRegistry(releaseRegistry(registry, b)).registry;
  registry = unpackRegistry(acquireRegistry(registry, a, 40)).registry;
  registry = unpackRegistry(releaseRegistry(registry, a)).registry;

  const result = unpackRegistry(acquireRegistry(registry, c, 50));
  registry = result.registry;
  assert.deepEqual(result.actions, [
    ["resource", { kind: ["image"], id: "b", version: 1 }, ["release", 1]],
    ["resource", { kind: ["image"], id: "c", version: 1 }, ["load", 1, { kind: ["image"], id: "c", version: 1 }]],
  ]);
  assert.deepEqual(to_js_data(registryMetrics(registry)), {
    resident: 2,
    leased: 1,
    idle: 1,
    "resident-bytes": 90,
    loads: 3,
    evictions: 1,
  });
});

test("容量不足时不会淘汰仍被引用的资源", () => {
  const a = imageResource("active", 1);
  const b = imageResource("blocked", 1);
  const registry = unpackRegistry(acquireRegistry(initialRegistry(100), a, 60)).registry;
  assert.throws(() => acquireRegistry(registry, b, 50), /resource-registry-capacity-exhausted/);
  assert.deepEqual(to_js_data(registryMetrics(registry)), {
    resident: 1,
    leased: 1,
    idle: 0,
    "resident-bytes": 60,
    loads: 1,
    evictions: 0,
  });
});

test("淘汰和关闭后的迟到完成只产生带身份的幂等释放", () => {
  const stale = imageResource("stale", 1);
  const next = imageResource("next", 1);
  let registry = unpackRegistry(acquireRegistry(initialRegistry(64), stale, 64)).registry;
  registry = unpackRegistry(releaseRegistry(registry, stale)).registry;
  registry = unpackRegistry(acquireRegistry(registry, next, 64)).registry;

  let result = unpackRegistry(readyRegistry(registry, stale, 1));
  assert.equal(result.registry, registry);
  assert.deepEqual(result.actions, [["resource", { kind: ["image"], id: "stale", version: 1 }, ["release", 1]]]);

  result = unpackRegistry(failedRegistry(registry, stale, 1, "late failure"));
  assert.deepEqual(result.actions, [["resource", { kind: ["image"], id: "stale", version: 1 }, ["release", 1]]]);

  const closed = unpackRegistry(closeRegistry(registry));
  assert.deepEqual(to_js_data(registryMetrics(closed.registry)), {
    resident: 0,
    leased: 0,
    idle: 0,
    "resident-bytes": 0,
    loads: 2,
    evictions: 1,
  });
  result = unpackRegistry(readyRegistry(closed.registry, next, 1));
  assert.deepEqual(result.actions, [["resource", { kind: ["image"], id: "next", version: 1 }, ["release", 1]]]);
});

test("设备重建只恢复仍有 lease 的资源，并用单调 generation 隔离旧设备结果", () => {
  const active = imageResource("active-device", 1);
  const idle = imageResource("idle-device", 1);
  let registry = initialRegistry(128);
  registry = unpackRegistry(acquireRegistry(registry, active, 64)).registry;
  registry = unpackRegistry(readyRegistry(registry, active, 1)).registry;
  registry = unpackRegistry(acquireRegistry(registry, idle, 64)).registry;
  registry = unpackRegistry(readyRegistry(registry, idle, 1)).registry;
  registry = unpackRegistry(releaseRegistry(registry, idle)).registry;

  let result = unpackRegistry(rebuildRegistry(registry));
  registry = result.registry;
  assert.deepEqual(result.actions, [
    ["resource", { kind: ["image"], id: "active-device", version: 1 }, ["release", 1]],
    [
      "resource",
      { kind: ["image"], id: "active-device", version: 1 },
      ["load", 3, { kind: ["image"], id: "active-device", version: 1 }],
    ],
    ["resource", { kind: ["image"], id: "idle-device", version: 1 }, ["release", 1]],
  ]);
  assert.deepEqual(to_js_data(registryMetrics(registry)), {
    resident: 1,
    leased: 1,
    idle: 0,
    "resident-bytes": 64,
    loads: 3,
    evictions: 0,
  });

  result = unpackRegistry(readyRegistry(registry, active, 1));
  assert.deepEqual(result.actions, [
    ["resource", { kind: ["image"], id: "active-device", version: 1 }, ["release", 1]],
  ]);
  result = unpackRegistry(readyRegistry(registry, active, 3));
  assert.deepEqual(result.actions, [
    [
      "resource",
      { kind: ["image"], id: "active-device", version: 1 },
      ["install", 3, { kind: ["image"], id: "active-device", version: 1 }],
    ],
    ["resource", { kind: ["image"], id: "active-device", version: 1 }, ["wake-frame", 3]],
  ]);
});

test("100 次多资源装卸保持容量上界，最终关闭回到零", () => {
  let registry = initialRegistry(32);
  for (let version = 0; version < 100; version += 1) {
    const descriptor = imageResource(`cycle-${version}`, version);
    registry = unpackRegistry(acquireRegistry(registry, descriptor, 16)).registry;
    registry = unpackRegistry(readyRegistry(registry, descriptor, 1)).registry;
    registry = unpackRegistry(releaseRegistry(registry, descriptor)).registry;
    const metrics = to_js_data(registryMetrics(registry));
    assert.ok(metrics.resident <= 2);
    assert.ok(metrics["resident-bytes"] <= 32);
    assert.equal(metrics.leased, 0);
  }

  const closed = unpackRegistry(closeRegistry(registry));
  const metrics = to_js_data(registryMetrics(closed.registry));
  assert.equal(metrics.resident, 0);
  assert.equal(metrics.leased, 0);
  assert.equal(metrics["resident-bytes"], 0);
  assert.equal(metrics.loads, 100);
  assert.equal(metrics.evictions, 98);
});
