import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { start_clock as startClock, pause_clock as pauseClock, seek_clock as seekClock } from "../js-out/quamolit.host-clock.mjs";
import { playback_frame_at as playbackFrameAt } from "../js-out/quamolit.test.playback-fixture.mjs";

const canvas = document.querySelector("#playback");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const running = startClock(10, 0, 1);
const state = { clock: running, hostTime: 10, ready: false };

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function render() {
  const frame = toJsData(playbackFrameAt(state.clock, state.hostTime, state.ready));
  const repeated = toJsData(playbackFrameAt(state.clock, state.hostTime, state.ready));
  assert(JSON.stringify(frame) === JSON.stringify(repeated), "同一显式输入重复采样不一致");
  const directX = Math.round(20 + frame.value * 4);
  const simulationX = Math.round(20 + frame.state * 60);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ec4899";
  context.fillRect(directX - 8, 25, 16, 16);
  context.fillStyle = "#22c55e";
  context.fillRect(simulationX - 8, 75, 16, 16);
  const directPixel = Array.from(context.getImageData(directX, 33, 1, 1).data).join(",");
  const simulationPixel = Array.from(context.getImageData(simulationX, 83, 1, 1).data).join(",");
  assert(directPixel === "236,72,153,255", `直接采样像素错误：${directPixel}`);
  assert(simulationPixel === "34,197,94,255", `模拟像素错误：${simulationPixel}`);
  status.dataset.result = "pass";
  status.textContent = `PASS · animation=${frame["animation-time"]} · direct=${frame.value} · tick=${frame.tick} · state=${frame.state} · ready=${frame.ready}`;
  return frame;
}

const actions = [
  ["运行 0.5s", () => { state.clock = running; state.hostTime = 10.5; state.ready = false; }],
  ["运行 1s", () => { state.clock = running; state.hostTime = 11; state.ready = false; }],
  ["暂停 @0.5s", () => { state.clock = pauseClock(running, 10.5); state.hostTime = 20; state.ready = false; }],
  ["资源 ready", () => { state.ready = true; }],
  ["seek→0.25s", () => { state.clock = seekClock(pauseClock(running, 10.5), 20, 0.25); state.hostTime = 20; state.ready = false; }],
  ["重置 0s", () => { state.clock = running; state.hostTime = 10; state.ready = false; }],
];

for (const [label, apply] of actions) {
  const button = document.createElement("button");
  button.textContent = label;
  button.addEventListener("click", () => {
    try { apply(); render(); }
    catch (error) { status.dataset.result = "fail"; status.textContent = `FAIL · ${error.message}`; throw error; }
  });
  document.querySelector("#actions").append(button);
}

try { render(); }
catch (error) { status.dataset.result = "fail"; status.textContent = `FAIL · ${error.message}`; throw error; }

window.quamolitPlaybackFixture = { render, state, canvas };
