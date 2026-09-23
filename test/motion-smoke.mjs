import assert from "node:assert/strict";
import { test } from "node:test";
import {
  main_$x_, sample_at, sample_vec2_at, sample_vec2_x_at, sample_vec2_y_at,
  sample_keyframes_clamp_at, sample_keyframes_repeat_at, sample_keyframes_mirror_at,
  sample_color_r_at, sample_color_b_at, sample_color_a_at,
} from "../js-out/quamolit.test.motion-fixture.mjs";

test("motion fixture samples arbitrary times without mutable clock", () => {
  assert.equal(main_$x_().toString(), "([] 20 10 15 12.5 20)");
  for (const [time, value] of [[0, 10], [0.25, 12.5], [0.5, 15], [0.75, 17.5], [1, 20]]) {
    assert.equal(sample_at(time), value);
  }
  assert.equal(sample_at(0.5), 15);
});

test("keyframe duplicates and loop endpoints agree with hand-calculated values", () => {
  for (const [time, clamp, repeat, mirror] of [
    [0.5, 144, 144, 144],
    [0.25, 88, 88, 88],
    [1, 208, 48, 208],
    [1.25, 208, 88, 176],
    [-0.25, 48, 176, 88],
    [2, 208, 48, 48],
  ]) {
    assert.equal(sample_keyframes_clamp_at(time), clamp);
    assert.equal(sample_keyframes_repeat_at(time), repeat);
    assert.equal(sample_keyframes_mirror_at(time), mirror);
  }
});

test("typed Vec2 motion samples the same positions in generated JavaScript", () => {
  for (const [time, x, y] of [[1, 208, 120], [0, 48, 80], [0.5, 128, 100], [0.25, 88, 90], [1, 208, 120]]) {
    assert.equal(sample_vec2_x_at(time), x);
    assert.equal(sample_vec2_y_at(time), y);
    assert.equal(sample_vec2_at(time).toString(), `(%{} 'Vec2 (:x ${x}) (:y ${y}))`);
  }
});

test("typed color samples straight alpha and linear-sRGB RGB in generated JavaScript", () => {
  for (const [time, red, blue, alpha] of [
    [1, 0, 1, 1],
    [0, 1, 0, 0],
    [0.5, 0.7353569830524495, 0.7353569830524495, 0.5],
    [0.25, 0.8808250210902997, 0.5370987304831942, 0.25],
    [1, 0, 1, 1],
  ]) {
    assert.ok(Math.abs(sample_color_r_at(time) - red) < 1e-12);
    assert.ok(Math.abs(sample_color_b_at(time) - blue) < 1e-12);
    assert.equal(sample_color_a_at(time), alpha);
  }
});
