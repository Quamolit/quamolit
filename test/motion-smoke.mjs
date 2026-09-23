import assert from "node:assert/strict";
import { test } from "node:test";
import { main_$x_, sample_at } from "../js-out/quamolit.test.motion-fixture.mjs";

test("motion fixture samples arbitrary times without mutable clock", () => {
  assert.equal(main_$x_().toString(), "([] 20 10 15 12.5 20)");
  for (const [time, value] of [[0, 10], [0.25, 12.5], [0.5, 15], [0.75, 17.5], [1, 20]]) {
    assert.equal(sample_at(time), value);
  }
  assert.equal(sample_at(0.5), 15);
});
