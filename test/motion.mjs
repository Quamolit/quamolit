import {
  sample_at as sampleAt,
  sample_vec2_x_at as sampleVec2XAt,
  sample_vec2_y_at as sampleVec2YAt,
} from "../js-out/quamolit.test.motion-fixture.mjs";

const canvas = document.querySelector("#frame");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const slider = document.querySelector("#time");
const samples = [0, 0.25, 0.5, 0.75, 1];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function renderAt(seconds) {
  assert(Number.isFinite(seconds) && seconds >= 0 && seconds <= 1, "时间必须在 0–1 秒之间");
  const value = sampleAt(seconds);
  const centerX = Math.round(sampleVec2XAt(seconds));
  const centerY = Math.round(sampleVec2YAt(seconds));
  assert(centerX === Math.round(48 + 16 * (value - 10)), "标量和向量 X 轨迹不一致");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ec4899";
  context.fillRect(centerX - 20, centerY - 20, 40, 40);
  const actual = Array.from(context.getImageData(centerX, centerY, 1, 1).data).join(",");
  assert(actual === "236,72,153,255", `中间帧像素错误：${actual}`);
  slider.value = String(seconds);
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${seconds}s · value=${value} · center=(${centerX},${centerY})`;
  return { value, centerX, centerY };
}

for (const seconds of samples) {
  const button = document.createElement("button");
  button.textContent = `${seconds}s`;
  button.addEventListener("click", () => renderAt(seconds));
  document.querySelector("#controls").append(button);
}
slider.addEventListener("input", () => renderAt(Number(slider.value)));

try {
  for (const [seconds, expected] of [[1, 20], [0, 10], [0.5, 15], [0.25, 12.5], [1, 20]]) {
    assert(sampleAt(seconds) === expected, `乱序采样错误：${seconds}s`);
  }
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.5));
  window.quamolitMotionFixture = { renderAt, sampleAt, sampleVec2XAt, sampleVec2YAt, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
