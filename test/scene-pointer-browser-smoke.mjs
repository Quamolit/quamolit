import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/scene-pointer-browser/calcit.core.mjs";
import {
  exercise_browser_capture_$x_ as exerciseBrowserCapture,
  exercise_browser_dispose_$x_ as exerciseBrowserDispose,
} from "../target/js/scene-pointer-browser/quamolit.test.scene-pointer-browser-fixture.mjs";
import {
  pointer_event_host as pointerEventHost,
  pointer_surface_host as pointerSurfaceHost,
} from "../target/js/scene-pointer-browser/quamolit.scene-pointer-browser.mjs";

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

test("surface disposal releases native capture before the element is removed", () => {
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

  const trace = toJsData(exerciseBrowserDispose(surface, { pointerId: 17, clientX: 120, clientY: 70 }));

  assert.deepEqual(trace, { "capture-cleared": true, "capture-released": true });
  assert.deepEqual(calls, [
    ["set", 17],
    ["release", 17],
  ]);
  assert.equal(capturedPointer, null);
});
