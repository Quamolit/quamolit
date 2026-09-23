import { frame_at as frameAt, resample_at as resampleAt, unsupported_reason as unsupportedReason } from "../js-out-cpu/quamolit.test.cpu-motion-fixture.mjs";

const canvas = document.querySelector("#frame");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
let previous = null;

function renderAt(time, model = 0, ready = false, viewport = 100) {
  const frame = previous === null ? frameAt(time, model, ready, viewport) : resampleAt(previous, time, model, ready, viewport);
  previous = frame;
  const value = frame.get("value");
  const x = Math.round(value.get("x"));
  const y = Math.round(value.get("y"));
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#2563eb";
  context.fillRect(x - 10, y - 10, 20, 20);
  const pixel = Array.from(context.getImageData(x, y, 1, 1).data).join(",");
  if (pixel !== "37,99,235,255") throw new Error(`Vec2 中间帧像素错误: ${pixel}`);
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${time}s · center=(${x},${y}) · ready=${ready} · model=${model} · viewport=${viewport} · GPU: ${unsupportedReason()}`;
  return { x, y, pixel };
}

for (const [label, args] of [
  ["1s", [1]], ["0s", [0]], ["0.5s", [0.5]], ["0.25s", [0.25]],
  ["ready", [0.5, 0, true, 100]], ["viewport", [0.5, 0, false, 110]], ["model", [0.5, 1, false, 100]],
]) {
  const button = document.createElement("button");
  button.textContent = label;
  button.addEventListener("click", () => renderAt(...args));
  document.querySelector("#controls").append(button);
}

try {
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.5));
  window.quamolitCpuMotionFixture = { renderAt, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
