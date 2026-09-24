import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { presence_frame_at as presenceFrameAt } from "../target/js/motion/quamolit.test.motion-fixture.mjs";

const canvas = document.querySelector("#frame");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const checkbox = document.querySelector("#reenter");
const times = [0, 0.25, 0.5, 0.75, 0.875, 1.25, 1.375];
const requestedTime = Number(new URLSearchParams(location.search).get("time") ?? 0.5);
let currentTime = requestedTime;
checkbox.checked = new URLSearchParams(location.search).get("reenter") === "1";

function renderAt(time) {
  if (!Number.isFinite(time)) throw new Error("时间必须有限");
  currentTime = time;
  const frame = toJsData(presenceFrameAt(time, checkbox.checked));
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const sample of frame.samples) {
    const [kind, rect] = sample.entry.node.content;
    if (kind !== "rect") continue;
    const { r, g, b, a } = rect.fill;
    context.globalAlpha = sample.alpha;
    context.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
  context.globalAlpha = 1;
  const order = frame.samples.map(({ entry }) => entry.node.id).join(",");
  const a = frame.samples.find(({ entry }) => entry.node.id === "a");
  const pixel = Array.from(context.getImageData(110, 60, 1, 1).data).join(",");
  if (!pixel.endsWith(",255")) throw new Error(`重叠区域像素错误：${pixel}`);
  if (time === 0.5 && pixel !== "30,144,255,255") throw new Error(`重排层序错误：${pixel}`);
  if (time >= 1.25 && !checkbox.checked && (a || frame.released.length !== 1 || frame["needs-frame"])) {
    throw new Error("退出完成后未卸载或未停帧");
  }
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${time}s · order=${order} · a-alpha=${a?.alpha ?? "none"} · a-interactive=${a?.interactive ?? false} · released=${frame.released.length} · active=${frame["needs-frame"]} · pixel=${pixel}`;
}

for (const time of times) {
  const button = document.createElement("button");
  button.textContent = `${time}s`;
  button.addEventListener("click", () => renderAt(time));
  document.querySelector("#times").append(button);
}
checkbox.addEventListener("change", () => renderAt(currentTime));

try {
  for (const time of [1.25, 0, 0.5, 0.25, 0.75, 0.875, 1.375]) renderAt(time);
  renderAt(requestedTime);
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
