import assert from "node:assert/strict";
import { test } from "node:test";
import { sample_simulation_direct, sample_simulation_staged } from "../js-out/quamolit.test.motion-fixture.mjs";

test("fixed-step result is independent of display-frame cadence", () => {
  for (const [tick, value] of [[4, 1], [0, 0], [2, 1.5], [1, 0.5], [3, 1], [4, 1]]) {
    assert.equal(sample_simulation_direct(tick), value);
    assert.equal(sample_simulation_staged(tick), value);
  }
});

test("fixed-step replay rejects invalid or unlogged ticks", () => {
  for (const tick of [-1, 1.5, 5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => sample_simulation_direct(tick));
  }
});
