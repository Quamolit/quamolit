import { to_js_data as toJsData } from "../target/js/component/calcit.core.mjs";
import { scene_at as sceneAt } from "../target/js/component/quamolit.test.component-fixture.mjs";

const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const state = { time: 0.5, model: 40, ready: false, viewport: 100 };

function render() {
  const wire = toJsData(sceneAt(state.time, state.model, state.ready, state.viewport));
  if (wire.nodes.length !== 1 || wire.nodes[0].content[0] !== "rect") throw new Error("组件声明未产生矩形 Scene");
  const rect = wire.nodes[0].content[1];
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const { r, g, b, a } = rect.fill;
  context.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  const pixel = Array.from(context.getImageData(rect.x + rect.width / 2, rect.y + rect.height / 2, 1, 1).data).join(",");
  const expected = state.ready ? "0,179,102,255" : "235,71,153,255";
  if (pixel !== expected) throw new Error(`组件中间帧像素错误：${pixel} ≠ ${expected}`);
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${state.time}s · x=${rect.x} · y=${rect.y} · width=${rect.width} · ready=${state.ready} · pixel=${pixel}`;
  return { wire, rect, pixel };
}

for (const time of [1, 0, 0.5, 0.25]) {
  const button = document.createElement("button");
  button.textContent = `${time}s`;
  button.addEventListener("click", () => { state.time = time; render(); });
  document.querySelector("#times").append(button);
}
document.querySelector("#model").addEventListener("click", () => { state.model += 1; render(); });
document.querySelector("#resource").addEventListener("click", () => { state.ready = !state.ready; render(); });
document.querySelector("#viewport").addEventListener("click", () => { state.viewport = state.viewport === 100 ? 110 : 100; render(); });

try {
  for (const [time, x] of [[1, 120], [0, 80], [0.5, 100], [0.25, 90], [1, 120]]) {
    state.time = time;
    if (render().rect.x !== x) throw new Error(`乱序组件采样错误：${time}s`);
  }
  state.time = Number(new URLSearchParams(location.search).get("time") ?? 0.5);
  render();
  window.quamolitComponentFixture = { state, render, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
