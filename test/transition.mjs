import {
  transition_active_at_$q_ as transitionActiveAt,
  transition_x_at as transitionXAt,
} from "../js-out/quamolit.test.motion-fixture.mjs";

const canvas = document.querySelector("#frame");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const cases = [[0, 80], [0.25, 90], [0.5, 100], [0.625, 85], [0.75, 70], [1, 95], [1.25, 120]];

function renderAt(time) {
  if (!Number.isFinite(time)) throw new Error("时间必须有限");
  const x = transitionXAt(time);
  const expected = cases.find(([at]) => at === time)?.[1];
  if (expected !== undefined && x !== expected) throw new Error(`事件重放位置错误：${time}s`);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f97316";
  context.fillRect(x, 50, 16, 16);
  const pixel = Array.from(context.getImageData(x + 8, 58, 1, 1).data).join(",");
  if (pixel !== "249,115,22,255") throw new Error(`中间帧像素错误：${pixel}`);
  const active = transitionActiveAt(time);
  if (time >= 1.25 && active) throw new Error("完成后仍要求连续帧");
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${time}s · x=${x} · active=${active} · pixel=${pixel}`;
}

for (const [time] of cases) {
  const button = document.createElement("button");
  button.textContent = `${time}s`;
  button.addEventListener("click", () => renderAt(time));
  document.querySelector("#times").append(button);
}

try {
  for (const time of [1.25, 0, 0.75, 0.25, 1, 0.5, 0.625]) renderAt(time);
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.75));
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
