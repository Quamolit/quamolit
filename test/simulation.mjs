import { sample_simulation_direct as directAt, sample_simulation_staged as stagedAt } from "../js-out/quamolit.test.motion-fixture.mjs";

const canvas = document.querySelector("#simulation");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function renderAt(seconds) {
  const tick = seconds * 4;
  assert(Number.isFinite(seconds) && tick >= 0 && tick <= 4 && Number.isInteger(tick), "时间必须是 0–1 秒内的四分之一秒刻度");
  const value = directAt(tick);
  assert(value === stagedAt(tick), `不同显示节奏的检查点结果不一致：tick=${tick}`);
  const x = Math.round(40 + value * 80);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#0ea5e9";
  context.fillRect(x - 8, 42, 16, 16);
  const pixel = Array.from(context.getImageData(x, 50, 1, 1).data).join(",");
  assert(pixel === "14,165,233,255", `固定步长画面像素错误：${pixel}`);
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${seconds}s · tick=${tick} · value=${value} · x=${x} · pixel=${pixel} · direct=staged`;
  return { tick, value, x, pixel };
}

for (const seconds of [0, 0.25, 0.5, 0.75, 1]) {
  const button = document.createElement("button");
  button.textContent = `${seconds}s`;
  button.addEventListener("click", () => renderAt(seconds));
  document.querySelector("#controls").append(button);
}

try {
  for (const [seconds, expected] of [[1, 1], [0, 0], [0.5, 1.5], [0.25, 0.5], [0.75, 1]]) {
    assert(renderAt(seconds).value === expected, `乱序重放错误：${seconds}s`);
  }
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.5));
  window.quamolitSimulationFixture = { renderAt, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
