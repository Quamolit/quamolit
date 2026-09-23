import assert from "node:assert/strict";
import { test } from "node:test";
import { sample_direct_x as sampleAt } from "../js-out/quamolit.test.motion-fixture.mjs";

test("typed direct frame evaluates the same arbitrary times in any order", () => {
  for (const [time, value] of [[1, 30], [0, 20], [0.5, 25], [0.25, 22.5], [1, 30], [-0.25, 20], [1.25, 30]]) {
    assert.equal(sampleAt(time, 0, 0, false, 100, 0, 0, 0, 0), value);
  }
});

test("same time recomputes changed model, input, ready resource and viewport", () => {
  assert.equal(sampleAt(0.5, 5, 0, false, 100, 1, 0, 0, 0), 30);
  assert.equal(sampleAt(0.5, 0, 2, false, 100, 0, 1, 0, 0), 27);
  assert.equal(sampleAt(0.5, 0, 0, true, 100, 0, 0, 1, 0), 45);
  assert.equal(sampleAt(0.5, 0, 0, false, 150, 0, 0, 0, 1), 30);
  assert.throws(() => sampleAt(Number.NaN, 0, 0, false, 100, 0, 0, 0, 0));
  assert.throws(() => sampleAt(0.5, 0, 0, false, 100, -1, 0, 0, 0));
});
