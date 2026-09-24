import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/playback/calcit.core.mjs";
import { start_clock as startClock, pause_clock as pauseClock, seek_clock as seekClock } from "../target/js/playback/quamolit.host-clock.mjs";
import { sample_scalar as sampleScalar } from "../target/js/playback/quamolit.motion.mjs";
import { sample_at_host as sampleAtHost, resample_at_host as resampleAtHost } from "../target/js/playback/quamolit.playback.mjs";
import { make_playback_request as makePlaybackRequest, playback_frame_at as playbackFrameAt } from "../target/js/playback/quamolit.test.playback-fixture.mjs";

const running = startClock(10, 0, 1);
const paused = pauseClock(running, 10.5);
const seeked = seekClock(paused, 20, 0.25);
const frame = (timeline, hostTime, ready) => toJsData(playbackFrameAt(timeline, hostTime, ready));
const evaluate = (motion, model, input, resources, viewport, time) =>
  sampleScalar(motion, time) + model + input + (resources ? 20 : 0) + viewport / 10;

test("one timeline drives direct frames and separately replayed fixed ticks", () => {
  assert.deepEqual(frame(running, 10, false), { "animation-time": 0, ready: false, state: 0, tick: 0, value: 25 });
  assert.deepEqual(frame(running, 10.5, false), { "animation-time": 0.5, ready: false, state: 1.5, tick: 2, value: 30 });
  assert.deepEqual(frame(paused, 20, true), { "animation-time": 0.5, ready: true, state: 1.5, tick: 2, value: 50 });
  assert.deepEqual(frame(seeked, 20, false), { "animation-time": 0.25, ready: false, state: 0.5, tick: 1, value: 27.5 });
  assert.deepEqual(frame(running, 11, false), { "animation-time": 1, ready: false, state: 1, tick: 4, value: 35 });
});

test("render sampling does not advance simulation and reuse honors resource revisions", () => {
  const request = makePlaybackRequest(false);
  const sampled = sampleAtHost(running, 10.5, request, evaluate);
  assert.equal(toJsData(sampled).scene, 30);
  const reused = resampleAtHost(sampled, paused, 20, request, () => { throw new Error("unexpected evaluation"); });
  assert.deepEqual(toJsData(reused), toJsData(sampled));
  const updated = resampleAtHost(sampled, paused, 20, makePlaybackRequest(true), evaluate);
  assert.equal(toJsData(updated).scene, 50);
  assert.equal(toJsData(updated).versions.resources, 1);
});
