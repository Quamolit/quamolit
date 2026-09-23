import {
  sample_color_r_at as redAt,
  sample_color_b_at as blueAt,
  sample_color_a_at as alphaAt,
} from "../js-out/quamolit.test.motion-fixture.mjs";

const canvas = document.querySelector("#color");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const slider = document.querySelector("#time");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function renderAt(seconds) {
  assert(Number.isFinite(seconds) && seconds >= 0 && seconds <= 1, "时间必须在 0–1 秒之间");
  const red = redAt(seconds);
  const blue = blueAt(seconds);
  const alpha = alphaAt(seconds);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = `rgba(${red * 255}, 0, ${blue * 255}, ${alpha})`;
  context.fillRect(40, 20, 240, 60);
  const pixel = Array.from(context.getImageData(160, 50, 1, 1).data);
  slider.value = String(seconds);
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${seconds}s · RGB=(${red.toFixed(6)},0,${blue.toFixed(6)}) · alpha=${alpha.toFixed(2)} · pixel=${pixel.join(",")}`;
  return { red, blue, alpha, pixel };
}

for (const seconds of [0, 0.25, 0.5, 0.75, 1]) {
  const button = document.createElement("button");
  button.textContent = `${seconds}s`;
  button.addEventListener("click", () => renderAt(seconds));
  document.querySelector("#controls").append(button);
}
slider.addEventListener("input", () => renderAt(Number(slider.value)));

try {
  const middle = renderAt(0.5);
  assert(Math.abs(middle.red - 0.7353569830524495) < 1e-12, "线性红色中点错误");
  assert(Math.abs(middle.blue - 0.7353569830524495) < 1e-12, "线性蓝色中点错误");
  assert(middle.alpha === 0.5, "alpha 中点错误");
  assert(middle.pixel.slice(0, 3).every((value, index) => Math.abs(value - [221, 127, 221][index]) <= 2), `中点合成像素错误：${middle.pixel}`);
  const start = renderAt(0);
  assert(start.red === 1 && start.blue === 0 && start.alpha === 0, "透明起点丢失隐藏 RGB");
  assert(start.pixel.join(",") === "255,255,255,255", "透明起点画布合成错误");
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.5));
  window.quamolitColorFixture = { renderAt, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
