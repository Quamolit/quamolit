import assert from "node:assert/strict";
import { test } from "node:test";
import { init_tags, to_js_data } from "../target/js/folding-fan/calcit.core.mjs";
import {
  close_resource as closeResource,
  image_resource as imageResource,
  initial_state as initialState,
  request_resource as requestResource,
  resource_failed as resourceFailed,
  resource_ready as resourceReady,
} from "../target/js/folding-fan/quamolit.resource-lifecycle.mjs";

const tags = init_tags(["state", "actions"]);
const unpack = (transition) => ({
  state: transition.get(tags.state),
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
