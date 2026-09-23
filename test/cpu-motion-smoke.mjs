import assert from "node:assert/strict";
import { test } from "node:test";
import {
  frame_at as frameAt,
  resample_at as resampleAt,
  sample_x_at as sampleXAt,
  sample_y_at as sampleYAt,
  unsupported_reason as unsupportedReason,
} from "../js-out-cpu/quamolit.test.cpu-motion-fixture.mjs";

test("泛型 CPU 回调可乱序返回 Vec2，完整版本键使同时间变化失效", () => {
  for (const [time, x] of [[1, 120], [0, 80], [0.5, 100], [0.25, 90], [1, 120]]) {
    assert.equal(sampleXAt(time, 0, false, 100), x);
    assert.equal(sampleYAt(time, 0, false, 100), 70);
  }
  const initial = frameAt(0.5, 0, false, 100);
  assert.equal(resampleAt(initial, 0.5, 0, false, 100), initial);
  assert.equal(resampleAt(initial, 0.5, 0, true, 100).get("value").get("x"), 120);
  assert.equal(resampleAt(initial, 0.5, 0, false, 110).get("value").get("y"), 71);
  assert.equal(resampleAt(initial, 0.5, 1, false, 100).get("value").get("x"), 101);
  assert.equal(unsupportedReason(), "runtime-callback-vec2");
});
