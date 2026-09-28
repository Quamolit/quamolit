import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import {
  crossfade_in as crossfadeIn,
  crossfade_out as crossfadeOut,
  morph_integer as morphInteger,
  morph_number as morphNumber,
  presence_frame as presenceFrame,
  smooth_stagger as smoothStagger,
  stagger_at as staggerAt,
} from "../target/js/motion/quamolit.ui-motion.mjs";

const closeTo = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
};

test("stagger uses stable indexes and absolute time", () => {
  const spec = smoothStagger(0.1, 0.2, 0.4);
  assert.equal(staggerAt(spec, 1, 0.3), 0);
  closeTo(staggerAt(spec, 1, 0.5), 0.5);
  assert.equal(staggerAt(spec, 1, 0.7), 1);
  assert.equal(staggerAt(spec, 1, 0.5), staggerAt(spec, 1, 0.5));
  assert.throws(() => staggerAt(spec, -1, 0.5), /invalid-stagger-index/);
});

test("number morph and crossfade have hand-calculated values", () => {
  assert.equal(morphNumber(10, 20, 0.25), 12.5);
  assert.equal(morphInteger(10, 21, 0.25), 12);
  closeTo(crossfadeIn(0.37) + crossfadeOut(0.37), 1);
  assert.throws(() => morphNumber(0, 1, 1.1), /invalid-morph-position/);
});

test("presence combines enter and exit into render and unmount signals", () => {
  assert.deepEqual(toJsData(presenceFrame(0.5, 0.25, -16, 20)), {
    alpha: 0.375,
    mounted: true,
    offset: -3,
  });
  assert.equal(toJsData(presenceFrame(0, 0, -16, 20)).mounted, false);
  assert.equal(toJsData(presenceFrame(1, 1, -16, 20)).mounted, false);
});
