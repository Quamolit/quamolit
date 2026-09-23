import { sample_composition_at as sampleAt } from "../js-out/quamolit.test.motion-fixture.mjs";

const canvas = document.querySelector("#composition");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const slider = document.querySelector("#time");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function renderAt(seconds) {
  assert(Number.isFinite(seconds) && seconds >= 0 && seconds <= 1, "时间必须在 0–1 秒之间");
  const value = sampleAt(seconds);
  const x = Math.round(20 + value * 10);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#7c3aed";
  context.fillRect(x - 8, 42, 16, 16);
  const pixel = Array.from(context.getImageData(x, 50, 1, 1).data).join(",");
  assert(pixel === "124,58,237,255", `组合位置像素错误：${pixel}`);
  slider.value = String(seconds);
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${seconds}s · value=${value} · x=${x} · pixel=${pixel}`;
  return { value, x, pixel };
}

for (const seconds of [0, 0.25, 0.5, 0.75, 1]) {
  const button = document.createElement("button");
  button.textContent = `${seconds}s`;
  button.addEventListener("click", () => renderAt(seconds));
  document.querySelector("#controls").append(button);
}
slider.addEventListener("input", () => renderAt(Number(slider.value)));

try {
  for (const [seconds, expected] of [[1, 23], [0, 11], [0.25, 14], [0.5, 17]]) {
    assert(renderAt(seconds).value === expected, `乱序组合采样错误：${seconds}s`);
  }
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.5));
  window.quamolitCompositionFixture = { renderAt, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
