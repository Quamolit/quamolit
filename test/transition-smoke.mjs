import assert from "node:assert/strict";
import { test } from "node:test";
import {
  transition_active_at_$q_ as transitionActiveAt,
  transition_x_at as transitionXAt,
} from "../target/js/motion/quamolit.test.motion-fixture.mjs";

test("interrupted transition replays at arbitrary times and stops after completion", () => {
  for (const [time, x] of [[1.25, 120], [0, 80], [0.75, 70], [0.25, 90], [1, 95], [0.5, 100], [0.625, 85], [1.25, 120]]) {
    assert.equal(transitionXAt(time), x);
  }
  assert.equal(transitionActiveAt(1), true);
  assert.equal(transitionActiveAt(1.25), false);
});
