// 页面管理原生指针捕获、DPR 和 DOM；Model、命中和 Scene 更新均交给 Calcit。
import * as drag from "../../target/js/drag-demo/quamolit.examples.drag-demo.mjs";
import { to_js_data } from "../../target/js/drag-demo/calcit.core.mjs";
const canvas = document.querySelector("#scene"), context = canvas.getContext("2d");
const panel = document.querySelector("#panel"), toggle = document.querySelector("#panel-toggle");
const status = document.querySelector("#status"), message = document.querySelector("#message");
let model = drag.initial(), captured = null, paints = 0;
let view = { scale: 1, x: 0, y: 0 };
function draw() {
  const bounds = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const width = Math.max(1, Math.round(bounds.width * dpr)), height = Math.max(1, Math.round(bounds.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  view = { scale: Math.min(width / (panel.hidden ? 620 : 850), height / 540), x: panel.hidden ? width / 2 : width * 0.42, y: height / 2 };
  context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, width, height);
  context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
  drag.draw_$x_(context, model);
  paints++;
  const state = to_js_data(model);
  status.textContent = `矩形 (${state.x.toFixed(1)}, ${state.y.toFixed(1)}) · 滑块 ${state.value.toFixed(2)}\n活动指针 ${captured ?? "无"} · 绘制 ${paints} · ${width} × ${height} 像素`;
  status.dataset.result = "pass";
}
function logical(event) {
  const bounds = canvas.getBoundingClientRect();
  return { x: ((event.clientX - bounds.left) * canvas.width / bounds.width - view.x) / view.scale,
    y: ((event.clientY - bounds.top) * canvas.height / bounds.height - view.y) / view.scale };
}
function snapshot() { return { model: to_js_data(model), scene: to_js_data(drag.scene_at(model)), captured, paints, width: canvas.width, height: canvas.height, view: { ...view } }; }
function finish(pointer) {
  if (captured !== pointer) return snapshot();
  captured = null; model = drag.end_pointer(model, pointer);
  if (canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
  draw(); return snapshot();
}
function safely(action) { try { message.textContent = ""; return action(); } catch (error) { message.textContent = error.message; } }
canvas.addEventListener("pointerdown", event => safely(() => {
  if (captured !== null) return;
  const point = logical(event), next = drag.begin_pointer(model, event.pointerId, point.x, point.y);
  if (to_js_data(next).pointer !== event.pointerId) return;
  model = next; captured = event.pointerId; canvas.setPointerCapture(captured); draw(); event.preventDefault();
}));
canvas.addEventListener("pointermove", event => safely(() => {
  if (captured !== event.pointerId) return;
  const point = logical(event); model = drag.move_pointer(model, event.pointerId, point.x, point.y); draw(); event.preventDefault();
}));
for (const kind of ["pointerup", "pointercancel", "lostpointercapture"]) canvas.addEventListener(kind, event => safely(() => finish(event.pointerId)));
window.addEventListener("blur", () => { if (captured !== null) finish(captured); });
window.addEventListener("pagehide", () => { if (captured !== null) finish(captured); });
function reset() { if (captured !== null) finish(captured); model = drag.initial(); draw(); return snapshot(); }
function preset() {
  reset(); model = drag.begin_pointer(model, 1, 8, -4); model = drag.move_pointer(model, 1, 230, 115); model = drag.end_pointer(model, 1);
  model = drag.begin_pointer(model, 2, 100, 40); model = drag.move_pointer(model, 2, 180, 40); model = drag.end_pointer(model, 2);
  draw(); return snapshot();
}
document.querySelector("#reset").onclick = () => safely(reset);
document.querySelector("#preset").onclick = () => safely(preset);
toggle.onclick = () => { panel.hidden = !panel.hidden; toggle.setAttribute("aria-expanded", String(!panel.hidden)); toggle.textContent = panel.hidden ? "展开面板" : "收起面板"; draw(); };
if (innerWidth < 600) { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "展开面板"; }
new ResizeObserver(draw).observe(canvas);
let resolution;
function watchDpr() { resolution?.removeEventListener("change", watchDpr); resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`); resolution.addEventListener("change", watchDpr); draw(); }
watchDpr();
window.dragDemo = { snapshot, reset, preset, draw };
