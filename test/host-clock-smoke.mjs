import assert from "node:assert/strict";
import { test } from "node:test";
import {
  start_clock as startClock,
  sample_clock as sampleClock,
  pause_clock as pauseClock,
  resume_clock as resumeClock,
  set_clock_speed as setClockSpeed,
  seek_clock as seekClock,
  simulation_tick_at as simulationTickAt,
} from "../target/js/motion/quamolit.host-clock.mjs";
import { sample_clock_x as sampleClockX } from "../target/js/motion/quamolit.test.motion-fixture.mjs";

test("host clock reanchors pause, resume, speed, reverse and seek", () => {
  const start = startClock(10, 0, 1);
  assert.equal(sampleClock(start, 10.25), 0.25);
  const paused = pauseClock(start, 10.5);
  assert.equal(sampleClock(paused, 20), 0.5);
  const resumed = resumeClock(paused, 20);
  assert.equal(sampleClock(resumed, 20.25), 0.75);
  assert.equal(sampleClockX(resumed, 20.25), 27.5);
  const faster = setClockSpeed(resumed, 20.25, 2);
  assert.ok(Math.abs(sampleClock(faster, 20.35) - 0.95) < 1e-12);
  const backward = setClockSpeed(faster, 20.35, -1);
  assert.ok(Math.abs(sampleClock(backward, 20.6) - 0.7) < 1e-12);
  const seeked = seekClock(backward, 20.6, 0.2);
  assert.equal(sampleClock(seeked, 20.6), 0.2);
  assert.equal(simulationTickAt(paused, 20, 0.25), 2);
  assert.equal(simulationTickAt(startClock(0, 0, 1), 0.3, 0.1), 3);
  assert.equal(simulationTickAt(startClock(0, 0, 1), 0.299, 0.1), 2);
  assert.throws(() => simulationTickAt(seekClock(start, 10.5, -0.25), 10.5, 0.25));
});

test("invalid host time, rate and dt fail visibly", () => {
  const start = startClock(10, 0, 1);
  assert.throws(() => startClock(Number.NaN, 0, 1));
  assert.throws(() => startClock(0, 0, Number.POSITIVE_INFINITY));
  assert.throws(() => sampleClock(start, 9.9));
  assert.throws(() => sampleClock(start, Number.NaN));
  assert.throws(() => seekClock(start, 11, Number.NaN));
  assert.throws(() => simulationTickAt(start, 10, 0));
});
