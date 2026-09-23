import { sample_direct_x as sampleAt } from "../js-out/quamolit.test.motion-fixture.mjs";

const canvas = document.querySelector("#direct");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const state = {
  time: 0.5, model: 0, input: 0, ready: false, viewport: 100,
  versions: { model: 0, input: 0, resources: 0, viewport: 0 },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function renderAt(seconds) {
  assert(Number.isFinite(seconds), "时间必须有限");
  state.time = seconds;
  const { model, input, ready, viewport, versions } = state;
  const value = sampleAt(seconds, model, input, ready, viewport,
    versions.model, versions.input, versions.resources, versions.viewport);
  const x = Math.round(20 + value * 4);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ea580c";
  context.fillRect(x - 8, 42, 16, 16);
  const pixel = Array.from(context.getImageData(x, 50, 1, 1).data).join(",");
  assert(pixel === "234,88,12,255", `直接采样位置像素错误：${pixel}`);
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${seconds}s · value=${value} · x=${x} · pixel=${pixel} · versions=m${versions.model}/i${versions.input}/r${versions.resources}/v${versions.viewport}`;
  return { value, x, pixel };
}

for (const seconds of [-0.25, 0, 0.25, 0.5, 1, 1.25]) {
  const button = document.createElement("button");
  button.textContent = `${seconds}s`;
  button.addEventListener("click", () => renderAt(seconds));
  document.querySelector("#times").append(button);
}

for (const [label, apply] of [
  ["资源 ready", () => { state.ready = true; state.versions.resources += 1; }],
  ["模型 +5", () => { state.model += 5; state.versions.model += 1; }],
  ["输入 +2", () => { state.input += 2; state.versions.input += 1; }],
  ["视口 150", () => { state.viewport = 150; state.versions.viewport += 1; }],
]) {
  const button = document.createElement("button");
  button.textContent = label;
  button.addEventListener("click", () => { apply(); renderAt(state.time); });
  document.querySelector("#changes").append(button);
}

try {
  for (const [seconds, expected] of [[1, 30], [0, 20], [0.5, 25], [0.25, 22.5], [1, 30]]) {
    assert(renderAt(seconds).value === expected, `乱序直接采样错误：${seconds}s`);
  }
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.5));
  window.quamolitDirectFixture = { renderAt, canvas, state };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
