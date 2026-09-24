import {
  sample_keyframes_clamp_at as clampAt,
  sample_keyframes_repeat_at as repeatAt,
  sample_keyframes_mirror_at as mirrorAt,
  gpu_keyframes_repeat_plan as gpuKeyframesRepeatPlan,
} from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";

const canvas = document.querySelector("#tracks");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const slider = document.querySelector("#time");
const samples = [-0.25, 0, 0.25, 0.5, 0.75, 1, 1.25, 2];
const gpuPlan = toJsData(gpuKeyframesRepeatPlan());
assert(gpuPlan[0] === "supported" && gpuPlan[1].kernel[0] === "keyframes", "关键帧 GPU 候选计划缺失");
assert(gpuPlan[1].kernel[1].frames.length === 4, "关键帧计划与画面夹具不一致");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function renderAt(seconds) {
  assert(Number.isFinite(seconds) && seconds >= -0.25 && seconds <= 2, "时间必须在 -0.25–2 秒之间");
  const values = [clampAt(seconds), repeatAt(seconds), mirrorAt(seconds)];
  const colors = ["#f59e0b", "#0ea5e9", "#22c55e"];
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  values.forEach((value, index) => {
    const y = 30 + 50 * index;
    context.fillStyle = colors[index];
    context.fillRect(Math.round(value) - 8, y - 8, 16, 16);
    const actual = Array.from(context.getImageData(Math.round(value), y, 1, 1).data).join(",");
    const expected = index === 0 ? "245,158,11,255" : index === 1 ? "14,165,233,255" : "34,197,94,255";
    assert(actual === expected, `第 ${index + 1} 条轨迹像素错误：${actual}`);
  });
  slider.value = String(seconds);
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${seconds}s · clamp=${values[0]} · repeat=${values[1]} · mirror=${values[2]} · GPU 候选: ${gpuPlan[1].kernel[1].frames.length} 帧`;
  return values;
}

for (const seconds of samples) {
  const button = document.createElement("button");
  button.textContent = `${seconds}s`;
  button.addEventListener("click", () => renderAt(seconds));
  document.querySelector("#controls").append(button);
}
slider.addEventListener("input", () => renderAt(Number(slider.value)));

try {
  for (const [seconds, expected] of [[1, [208, 48, 208]], [0.5, [144, 144, 144]], [-0.25, [48, 176, 88]], [1.25, [208, 88, 176]]]) {
    assert([clampAt(seconds), repeatAt(seconds), mirrorAt(seconds)].every((value, index) => value === expected[index]), `乱序采样错误：${seconds}s`);
  }
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.5));
  window.quamolitKeyframesFixture = { renderAt, clampAt, repeatAt, mirrorAt, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
