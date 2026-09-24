import {
  checkpoint_count as checkpointCount,
  input_count as inputCount,
  make_archive as makeArchive,
  update_state as updateState,
} from "../target/js/replay/quamolit.test.replay-archive-fixture.mjs";
import { start_clock as startClock, pause_clock as pauseClock, seek_clock as seekClock } from "../target/js/replay/quamolit.host-clock.mjs";
import { sample_archive_at_host as sampleArchiveAtHost } from "../target/js/replay/quamolit.playback.mjs";

const canvas = document.querySelector("#frame");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const expected = new Map([[0, 0], [1, 0.5], [2, 1.5], [3, 1], [4, 1], [5, 2.5], [6, 2]]);
const saved = makeArchive();
const timeline = startClock(10, 0, 1);

function renderAt(tick, budget = 6) {
  return renderHost(timeline, 10 + tick * 0.25, tick, budget);
}

function renderHost(clock, hostTime, tick, budget = 6) {
  const value = sampleArchiveAtHost(clock, hostTime, saved, budget, updateState).get("state");
  if (value !== expected.get(tick)) throw new Error(`tick ${tick} 的重放值错误: ${value}`);
  const x = Math.round(80 + value * 40);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#0d9488";
  context.fillRect(x - 10, 60, 20, 20);
  const pixel = Array.from(context.getImageData(x, 70, 1, 1).data).join(",");
  if (pixel !== "13,148,136,255") throw new Error(`tick ${tick} 的像素错误: ${pixel}`);
  status.dataset.result = "pass";
  status.textContent = `PASS · tick=${tick} · value=${value} · center=(${x},70) · inputs=${inputCount()} · checkpoints=${checkpointCount()}`;
  return { value, x, pixel };
}

for (const tick of [6, 0, 2, 4, 5]) {
  const button = document.createElement("button");
  button.textContent = `tick ${tick}`;
  button.addEventListener("click", () => renderAt(tick));
  document.querySelector("#controls").append(button);
}
for (const [label, clock, hostTime] of [
  ["暂停到 20s", pauseClock(timeline, 10.5), 20],
  ["seek 到 20s", seekClock(timeline, 20, 0.5), 20],
]) {
  const button = document.createElement("button");
  button.textContent = label;
  button.addEventListener("click", () => renderHost(clock, hostTime, 2));
  document.querySelector("#controls").append(button);
}

try {
  renderAt(Number(new URLSearchParams(location.search).get("tick") ?? 6));
  window.quamolitReplayArchiveFixture = { renderAt, renderHost, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
