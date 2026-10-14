import assert from "node:assert/strict";
import { test } from "node:test";
import {
  to_js_data as toJsData,
  init_tags as initTags,
  _PCT__$o__$o_ as enumValue,
  _PCT_some as some,
  _PCT_none as none,
  arrayToList,
  _$n__PCT__$M_ as record,
} from "../target/js/scene-pointer-browser/calcit.core.mjs";
import {
  exercise_browser_capture_$x_ as exerciseBrowserCapture,
  exercise_browser_dispose_$x_ as exerciseBrowserDispose,
  exercise_browser_subtree_exit_$x_ as exerciseBrowserSubtreeExit,
  instance_pointer_plan as instancePlan,
} from "../target/js/scene-pointer-browser/quamolit.test.scene-pointer-browser-fixture.mjs";
import {
  pointer_event_host as pointerEventHost,
  pointer_surface_host as pointerSurfaceHost,
  reconcile_pointer_surface_$x_ as reconcileSurface,
  reconcile_pointer_surface_at_$x_ as reconcileSurfaceAt,
} from "../target/js/scene-pointer-browser/quamolit.scene-pointer-browser.mjs";
import {
  PointerPhase,
  route_pointer as routePointer,
  initial_pointer_state as initialState,
  capture_dispatch as captureDispatch,
  reconcile_pointer_state_at as reconcileAt,
} from "../target/js/scene-pointer-browser/quamolit.scene-pointer.mjs";
import {
  pointer_input as pointerInput,
  routing_scene as routingScene,
  routing_scene_without_a as withoutA,
} from "../target/js/scene-pointer-browser/quamolit.test.scene-hit-fixture.mjs";
import { Vec2 } from "../target/js/scene-pointer-browser/quamolit.motion.mjs";
import { SceneContent } from "../target/js/scene-pointer-browser/quamolit.scene-ir.mjs";
import { compile_hit_plan as compilePlan, matrix } from "../target/js/scene-pointer-browser/quamolit.scene-hit.mjs";

test("无输入的几何协调更新hover而不因移开释放有效capture", () => {
  const tags = initTags([
    "state",
    "dispatch",
    "down",
    "move",
    "capture",
    "capture-released",
    "hover-node",
    "nodes",
    "content",
    "group",
    "transform",
    "x",
    "y",
  ]);
  const at = (x, y) => some(record(Vec2, tags.x, x, tags.y, y));
  const document = routingScene(),
    plan = compilePlan(document);
  const down = routePointer(plan, initialState(), pointerInput(7, enumValue(PointerPhase, tags.down), 20, 20));
  const hovered = down.getRequired(tags.state),
    captured = captureDispatch(hovered, down.getRequired(tags.dispatch));
  const nodes = document.getRequired(tags.nodes).toArray();
  const movedRoot = nodes[0].assoc(
    tags.content,
    enumValue(
      SceneContent,
      tags.group,
      nodes[0].getRequired(tags.content).extra[0].assoc(tags.transform, matrix(1, 0, 0, 1, 100, 0)),
    ),
  );
  const moved = compilePlan(document.assoc(tags.nodes, arrayToList([movedRoot, ...nodes.slice(1)])));
  const state = (result) => toJsData(result.getRequired(tags.state));
  assert.equal(state(reconcileAt(moved, hovered, at(20, 20)))["hover-node"], "");
  assert.equal(state(reconcileAt(moved, initialState(), at(120, 20)))["hover-node"], "a");
  assert.equal(state(reconcileAt(plan, hovered, none()))["hover-node"], "", "未知位置不能猜0,0重新命中");
  const kept = reconcileAt(moved, captured, at(20, 20));
  assert.deepEqual(state(kept).capture, ["captured", 7, "a-action", "a"]);
  assert.equal(state(kept)["hover-node"], "");
  assert.equal(kept.getRequired(tags["capture-released"]), false);
  const ended = reconcileAt(compilePlan(withoutA()), captured, at(20, 20));
  assert.equal(ended.getRequired(tags["capture-released"]), true);
  assert.deepEqual(state(ended).capture, ["none"]);
  assert.equal(
    reconcileAt(compilePlan(withoutA()), ended.getRequired(tags.state), at(20, 20)).getRequired(
      tags["capture-released"],
    ),
    false,
  );
  assert.equal(toJsData(hovered)["hover-node"], "a", "旧状态保持不可变");
  for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => reconcileAt(plan, hovered, at(value, 20)));
});

test("静止client位置按元素最新边界重投影，未知位置不读取宿主", () => {
  const tags = initTags(["state", "dispatch", "down", "capture-released", "x", "y"]);
  const position = some(record(Vec2, tags.x, 120, tags.y, 70));
  const plan = compilePlan(routingScene());
  let left = 100,
    reads = 0,
    owner = 7,
    releases = 0;
  const surface = {
    getBoundingClientRect() {
      reads++;
      return { left, top: 50 };
    },
    hasPointerCapture(id) {
      return owner === id;
    },
    releasePointerCapture(id) {
      assert.equal(id, owner);
      owner = null;
      releases++;
    },
  };
  const first = reconcileSurfaceAt(surface, plan, initialState(), position);
  assert.equal(toJsData(first.getRequired(tags.state))["hover-node"], "a");
  left = 200;
  const moved = reconcileSurfaceAt(surface, plan, first.getRequired(tags.state), position);
  assert.equal(toJsData(moved.getRequired(tags.state))["hover-node"], "");
  assert.equal(reads, 2);
  left = 100;
  assert.equal(
    toJsData(reconcileSurfaceAt(surface, plan, moved.getRequired(tags.state), position).getRequired(tags.state))[
      "hover-node"
    ],
    "a",
  );
  const beforeNone = reads;
  assert.equal(
    toJsData(reconcileSurfaceAt(surface, plan, first.getRequired(tags.state), none()).getRequired(tags.state))[
      "hover-node"
    ],
    "",
  );
  assert.equal(reads, beforeNone);
  const down = routePointer(plan, initialState(), pointerInput(7, enumValue(PointerPhase, tags.down), 20, 20));
  const captured = captureDispatch(down.getRequired(tags.state), down.getRequired(tags.dispatch));
  left = 200;
  const kept = reconcileSurfaceAt(surface, plan, captured, position);
  assert.equal(kept.getRequired(tags["capture-released"]), false);
  assert.equal(releases, 0);
  const removed = compilePlan(withoutA());
  const ended = reconcileSurfaceAt(surface, removed, kept.getRequired(tags.state), position);
  assert.equal(ended.getRequired(tags["capture-released"]), true);
  reconcileSurfaceAt(surface, removed, ended.getRequired(tags.state), position);
  assert.equal(releases, 1);
});

test("提交实例计划立即协调原生捕获；保留、释放与重复提交有独立断言", () => {
  const tags = initTags(["state", "dispatch", "down", "capture-released", "capture"]);
  const plan = instancePlan(1, true, true);
  const down = routePointer(plan, initialState(), pointerInput(7, enumValue(PointerPhase, tags.down), 80, 130));
  const captured = captureDispatch(down.getRequired(tags.state), down.getRequired(tags.dispatch));
  let nativeOwner = 7,
    releases = 0;
  const surface = {
    hasPointerCapture: (id) => nativeOwner === id,
    releasePointerCapture(id) {
      assert.equal(nativeOwner, id);
      nativeOwner = null;
      releases++;
    },
  };
  const kept = reconcileSurface(surface, instancePlan(2, true, true), captured);
  assert.equal(kept.getRequired(tags["capture-released"]), false);
  assert.equal(nativeOwner, 7);
  assert.equal(releases, 0);
  for (const mounted of [true, false]) {
    nativeOwner = 7;
    const removed = instancePlan(2, false, mounted);
    const ended = reconcileSurface(surface, removed, captured);
    assert.equal(ended.getRequired(tags["capture-released"]), true);
    assert.deepEqual(toJsData(ended.getRequired(tags.state).getRequired(tags.capture)), ["none"]);
    assert.equal(nativeOwner, null);
    const before = releases;
    assert.equal(
      reconcileSurface(surface, removed, ended.getRequired(tags.state)).getRequired(tags["capture-released"]),
      false,
    );
    assert.equal(releases, before);
  }
  assert.equal(releases, 2);
});

test("trusted pointer host boundaries retain object guards without claiming shape validation", () => {
  for (const adapt of [pointerEventHost, pointerSurfaceHost]) {
    for (const value of [null, undefined, 0, false, "element"]) {
      assert.throws(() => adapt(value), /Pointer(Event|Surface)\.host/);
    }
    const trustedHost = {};
    assert.equal(adapt(trustedHost), trustedHost, "adapter preserves the trusted browser object identity");
  }
});

test("Calcit controls pointer capture while the host only exposes browser primitives", () => {
  let capturedPointer = null;
  const calls = [];
  const surface = {
    getBoundingClientRect() {
      return { left: 100, top: 50 };
    },
    hasPointerCapture(pointerId) {
      return capturedPointer === pointerId;
    },
    setPointerCapture(pointerId) {
      assert.equal(capturedPointer, null);
      capturedPointer = pointerId;
      calls.push(["set", pointerId]);
    },
    releasePointerCapture(pointerId) {
      assert.equal(capturedPointer, pointerId);
      capturedPointer = null;
      calls.push(["release", pointerId]);
    },
  };
  const eventAt = (clientX, clientY) => ({ pointerId: 7, clientX, clientY });

  const trace = toJsData(exerciseBrowserCapture(surface, eventAt(120, 70), eventAt(400, 400), eventAt(420, 420)));

  assert.deepEqual(trace, {
    "capture-cleared": true,
    "down-target": "a-action",
    "move-captured": true,
    "move-target": "a-action",
    "up-released": true,
  });
  assert.deepEqual(calls, [
    ["set", 7],
    ["release", 7],
  ]);
  assert.equal(capturedPointer, null);
});

for (const [name, exercise] of [
  ["surface disposal releases native capture before the element is removed", exerciseBrowserDispose],
  ["退出嵌套子树即刻释放原生捕获，重复协调不再次释放", exerciseBrowserSubtreeExit],
])
  test(name, () => {
    let capturedPointer = null;
    const calls = [];
    const surface = {
      getBoundingClientRect: () => ({ left: 100, top: 50 }),
      hasPointerCapture: (pointerId) => capturedPointer === pointerId,
      setPointerCapture(pointerId) {
        capturedPointer = pointerId;
        calls.push(["set", pointerId]);
      },
      releasePointerCapture(pointerId) {
        assert.equal(capturedPointer, pointerId);
        capturedPointer = null;
        calls.push(["release", pointerId]);
      },
    };

    const trace = toJsData(exercise(surface, { pointerId: 17, clientX: 120, clientY: 70 }));

    assert.deepEqual(trace, { "capture-cleared": true, "capture-released": true });
    assert.deepEqual(calls, [
      ["set", 17],
      ["release", 17],
    ]);
    assert.equal(capturedPointer, null);
  });
