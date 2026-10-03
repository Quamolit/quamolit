import assert from "node:assert/strict";
import { test } from "node:test";
import {
  to_js_data as toJsData,
  init_tags as initTags,
  _PCT__$o__$o_ as enumValue,
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
} from "../target/js/scene-pointer-browser/quamolit.scene-pointer-browser.mjs";
import {
  PointerPhase,
  route_pointer as routePointer,
  initial_pointer_state as initialState,
  capture_dispatch as captureDispatch,
} from "../target/js/scene-pointer-browser/quamolit.scene-pointer.mjs";
import { pointer_input as pointerInput } from "../target/js/scene-pointer-browser/quamolit.test.scene-hit-fixture.mjs";

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
