import {
  start_clock as startClock,
  sample_clock as sampleClock,
  pause_clock as pauseClock,
  resume_clock as resumeClock,
  set_clock_speed as setClockSpeed,
  seek_clock as seekClock,
} from "../target/js/motion/quamolit.host-clock.mjs";
import { sample_clock_x as sampleClockX } from "../target/js/motion/quamolit.test.motion-fixture.mjs";

const canvas = document.querySelector("#host-clock");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const state = { clock: startClock(10, 0, 1), hostTime: 10.25 };

function render() {
  const animationTime = sampleClock(state.clock, state.hostTime);
  const value = sampleClockX(state.clock, state.hostTime);
  const x = Math.round(20 + value * 4);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ea580c";
  context.fillRect(x - 8, 42, 16, 16);
  const pixel = Array.from(context.getImageData(x, 50, 1, 1).data).join(",");
  if (pixel !== "234,88,12,255") throw new Error(`位置像素错误：${pixel}`);
  status.dataset.result = "pass";
  status.textContent = `PASS · host=${state.hostTime} · animation=${Number(animationTime.toFixed(3))} · x=${x} · pixel=${pixel}`;
}

const actions = [
  ["暂停 @10.5", () => { state.clock = pauseClock(state.clock, 10.5); state.hostTime = 20; }],
  ["恢复 @20", () => { state.clock = resumeClock(state.clock, 20); state.hostTime = 20.25; }],
  ["加速 2× @20.25", () => { state.clock = setClockSpeed(state.clock, 20.25, 2); state.hostTime = 20.35; }],
  ["倒放 -1× @20.35", () => { state.clock = setClockSpeed(state.clock, 20.35, -1); state.hostTime = 20.6; }],
  ["seek→0.2 @20.6", () => { state.clock = seekClock(state.clock, 20.6, 0.2); state.hostTime = 20.6; }],
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
