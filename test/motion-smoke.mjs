import assert from "node:assert/strict";
import { test } from "node:test";
import {
  main_$x_, sample_at, sample_vec2_at, sample_vec2_x_at, sample_vec2_y_at,
} from "../js-out/quamolit.test.motion-fixture.mjs";

test("motion fixture samples arbitrary times without mutable clock", () => {
  assert.equal(main_$x_().toString(), "([] 20 10 15 12.5 20)");
  for (const [time, value] of [[0, 10], [0.25, 12.5], [0.5, 15], [0.75, 17.5], [1, 20]]) {
    assert.equal(sample_at(time), value);
  }
  assert.equal(sample_at(0.5), 15);
});

test("typed Vec2 motion samples the same positions in generated JavaScript", () => {
  for (const [time, x, y] of [[1, 208, 120], [0, 48, 80], [0.5, 128, 100], [0.25, 88, 90], [1, 208, 120]]) {
    assert.equal(sample_vec2_x_at(time), x);
    assert.equal(sample_vec2_y_at(time), y);
    assert.equal(sample_vec2_at(time).toString(), `(%{} 'Vec2 (:x ${x}) (:y ${y}))`);
  }
});
