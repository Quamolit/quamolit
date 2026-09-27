// 宿主负责视口、编辑器和 URL；九格数据、命中与场景来自 Calcit。
import * as table from "../../target/js/table/quamolit.examples.table.mjs";
import { to_js_data } from "../../target/js/table/calcit.core.mjs";
const canvas = document.querySelector("#scene"), context = canvas.getContext("2d");
const editor = document.querySelector("#editor"), panel = document.querySelector("#panel");
const toggle = document.querySelector("#panel-toggle"), status = document.querySelector("#status");
const message = document.querySelector("#message"), params = new URLSearchParams(location.search);
let cells = table.initial(), selected = -1, paints = 0;
let view = { scale: 1, x: 0, y: 0 };
function locateEditor() {
  if (editor.hidden || selected < 0) return;
  const bounds = canvas.getBoundingClientRect(), unit = view.scale * bounds.width / canvas.width;
  editor.style.left = `${bounds.left + (view.x + (table.cell_x(selected) - 86) * view.scale) * bounds.width / canvas.width}px`;
  editor.style.top = `${bounds.top + (view.y + (table.cell_y(selected) - 27) * view.scale) * bounds.height / canvas.height}px`;
  editor.style.width = `${Math.max(40, 172 * unit)}px`;
  editor.style.height = `${Math.max(32, 54 * unit)}px`;
  editor.style.fontSize = `${Math.max(16, Math.min(25, 22 * unit))}px`;
}
function draw() {
  const bounds = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const width = Math.max(1, Math.round(bounds.width * dpr)), height = Math.max(1, Math.round(bounds.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  view = { scale: Math.min(width / (panel.hidden ? 640 : 760), height / (panel.hidden ? 500 : 570)), x: panel.hidden ? width / 2 : width * 0.43, y: height / 2 };
  context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, width, height);
  context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
  table.draw_$x_(context, cells, selected);
  paints++; locateEditor();
  status.textContent = `3 × 3 · ${to_js_data(cells).filter(Boolean).length} 格有文字 · 绘制 ${paints}\n点击格子编辑；画布 ${width} × ${height} 实际像素`;
  status.dataset.result = "pass";
}
function snapshot() { return { cells: to_js_data(cells), selected, scene: to_js_data(table.scene_at(cells, selected)), paints, width: canvas.width, height: canvas.height, view: { ...view } }; }
function commit() {
  if (editor.hidden || selected < 0) return snapshot();
  cells = table.set_cell(cells, selected, editor.value);
  editor.hidden = true; selected = -1; draw(); return snapshot();
}
function cancel() { editor.hidden = true; selected = -1; draw(); return snapshot(); }
function open(index) {
  if (!Number.isInteger(index) || index < 0 || index > 8) throw new RangeError("格子编号必须在 0–8 之间");
  commit(); selected = index; editor.value = table.cell_text(cells, index); editor.hidden = false;
  draw(); editor.focus(); editor.select(); return snapshot();
}
function set(index, value) { if (typeof value !== "string") throw new TypeError("格子文字必须是字符串"); commit(); cells = table.set_cell(cells, index, value); draw(); return snapshot(); }
function safely(action) { try { message.textContent = ""; return action(); } catch (error) { message.textContent = error.message; } }
canvas.addEventListener("click", event => safely(() => {
  const bounds = canvas.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) * canvas.width / bounds.width - view.x) / view.scale;
  const y = ((event.clientY - bounds.top) * canvas.height / bounds.height - view.y) / view.scale;
  const index = table.hit_at(x, y);
  if (index >= 0) open(index); else commit();
}));
editor.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); cancel(); }
  else if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); commit(); }
});
editor.addEventListener("blur", () => safely(commit));
document.querySelector("#fill").onclick = () => safely(() => { commit(); ["风", "林", "火", "山", "海", "月", "花", "雨", "星"].forEach((text, index) => { cells = table.set_cell(cells, index, text); }); draw(); });
document.querySelector("#reset").onclick = () => safely(() => { cancel(); cells = table.initial(); draw(); });
document.querySelector("#share").onclick = async () => { commit(); const url = new URL(location.href); url.searchParams.set("cells", JSON.stringify(to_js_data(cells))); history.replaceState(null, "", url); try { await navigator.clipboard.writeText(url.href); } catch { /* URL 已更新。 */ } };
toggle.onclick = () => { panel.hidden = !panel.hidden; toggle.setAttribute("aria-expanded", String(!panel.hidden)); toggle.textContent = panel.hidden ? "展开面板" : "收起面板"; draw(); };
if (innerWidth < 600) { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "展开面板"; }
new ResizeObserver(draw).observe(canvas);
let resolution;
function watchDpr() { resolution?.removeEventListener("change", watchDpr); resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`); resolution.addEventListener("change", watchDpr); draw(); }
watchDpr();
window.tableDemo = { snapshot, open, set, commit, cancel, draw };
if (params.has("cells")) safely(() => { const saved = JSON.parse(params.get("cells")); if (!Array.isArray(saved) || saved.length !== 9 || saved.some(value => typeof value !== "string" || value.length > 80)) throw new TypeError("分享链接中的九格文字无效"); saved.forEach((value, index) => { cells = table.set_cell(cells, index, value); }); draw(); });
