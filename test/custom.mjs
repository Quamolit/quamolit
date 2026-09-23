import { sample_cpu_at as sampleAt, cpu_gpu_reason as gpuReason } from "../js-out/quamolit.test.motion-fixture.mjs";

const canvas = document.querySelector("#custom");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function renderAt(seconds) {
  assert(Number.isFinite(seconds), "时间必须有限");
  const value = sampleAt(seconds);
  const x = Math.round(20 + value * 10);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#0d9488";
  context.fillRect(x - 8, 42, 16, 16);
  const pixel = Array.from(context.getImageData(x, 50, 1, 1).data).join(",");
  assert(pixel === "13,148,136,255", `自定义采样位置像素错误：${pixel}`);
  assert(gpuReason() === "runtime-callback", "GPU 降低诊断缺失");
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${seconds}s · value=${value} · x=${x} · pixel=${pixel} · GPU=unsupported:runtime-callback`;
  return { value, x, pixel };
}

for (const seconds of [0, 0.25, 0.5, 1]) {
  const button = document.createElement("button");
  button.textContent = `${seconds}s`;
  button.addEventListener("click", () => renderAt(seconds));
  document.querySelector("#controls").append(button);
}

try {
  for (const [seconds, expected] of [[1, 12], [0, 10], [0.25, 10.5], [0.5, 11]]) {
    assert(renderAt(seconds).value === expected, `乱序采样错误：${seconds}s`);
  }
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.5));
  window.quamolitCustomFixture = { renderAt, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
