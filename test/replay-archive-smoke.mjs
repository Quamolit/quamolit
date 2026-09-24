import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkpoint_count as checkpointCount,
  input_count as inputCount,
  main_$x_ as main,
  make_archive as makeArchive,
  sample_at as sampleAt,
  update_state as updateState,
} from "../target/js/replay/quamolit.test.replay-archive-fixture.mjs";
import { start_clock as startClock, pause_clock as pauseClock, seek_clock as seekClock } from "../target/js/replay/quamolit.host-clock.mjs";
import { sample_archive_at_host as sampleArchiveAtHost } from "../target/js/replay/quamolit.playback.mjs";

test("有界检查点与完整输入日志支持旧 tick 重放", () => {
  assert.equal(checkpointCount(), 2);
  assert.equal(inputCount(), 6);
  assert.equal(main().toString(), "([] 2 0 1.5 1 2.5)");
  for (const [tick, budget, value] of [[6, 0, 2], [0, 0, 0], [2, 2, 1.5], [4, 0, 1], [5, 1, 2.5], [2, 2, 1.5]]) {
    assert.equal(sampleAt(tick, budget), value);
  }
  assert.throws(() => sampleAt(2, 1));
  assert.throws(() => sampleAt(7, 7));
  assert.throws(() => sampleAt(Number.NaN, 7));
});

test("宿主暂停与 seek 使用同一档案重放，不倒退积分", () => {
  const saved = makeArchive();
  const timeline = startClock(10, 0, 1);
  const paused = pauseClock(timeline, 10.5);
  const seeked = seekClock(timeline, 20, 0.5);
  assert.equal(sampleArchiveAtHost(timeline, 11.5, saved, 0, updateState).get("state"), 2);
  assert.equal(sampleArchiveAtHost(paused, 20, saved, 2, updateState).get("state"), 1.5);
  assert.equal(sampleArchiveAtHost(seeked, 20, saved, 2, updateState).get("state"), 1.5);
  assert.throws(() => sampleArchiveAtHost(seeked, 20, saved, 1, updateState));
});
