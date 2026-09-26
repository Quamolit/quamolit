// 页面入口只管理时钟/视口/DOM；递归、三角函数与绘制在 Calcit。
import { scene_at } from "../../target/js/binary-tree/quamolit.examples.binary-tree.mjs";
import { draw_reference_$x_ } from "../../target/js/binary-tree/quamolit.canvas-reference.mjs";
import { to_js_data } from "../../target/js/binary-tree/calcit.core.mjs";
const canvas = document.querySelector("canvas"), context = canvas.getContext("2d");
const status = document.querySelector("#status"), slider = document.querySelector("#time");
const play = document.querySelector("#play"), panel = document.querySelector("#panel"), toggle = document.querySelector("#panel-toggle");
const params = new URLSearchParams(location.search);
const parsed = Number(params.get("t") || 0);
let time = Number.isFinite(parsed) && parsed >= 0 && parsed <= 60 ? parsed : 0;
let scene = scene_at(time, 5), playing = false, raf = null, anchor = 0, started = 0;
let paints = 0, samples = 1;
function draw() {
  const rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, w, h);
  // 原构图的固定逻辑视窗，不随浮层宽度挤压。输出为真实 DPR 像素。
  const scale = Math.min(w / 1000, h / 800);
  context.setTransform(scale, 0, 0, scale, w / 2, h / 2 + 70 * scale);
  draw_reference_$x_(context, scene);
  paints++;
  slider.value = String(time);
  status.textContent = `t = ${time.toFixed(2)} s\n63 Scene polylines · Calcit → Canvas2D\n采样 ${samples} / 绘制 ${paints}`;
  status.dataset.result = "pass";
}
function sample(t) {
  if (!Number.isFinite(t) || t < 0 || t > 60) throw new RangeError("演示时间必须在 0–60 秒内");
  time = t; scene = scene_at(time, 5); samples++; draw();
}
function stop() {
  playing = false;
  if (raf !== null) cancelAnimationFrame(raf);
  raf = null; play.textContent = "播放";
}
function tick(now) {
  if (!playing) return;
  // 首次 rAF 的帧时间戳可能早于注册回调时的 performance.now()。
  const next = anchor + Math.max(0, now - started) / 1000;
  sample(Math.min(60, next));
  if (next >= 60) stop(); else raf = requestAnimationFrame(tick);
}
function start() {
  if (playing) return;
  if (time === 60) sample(0);
  anchor = time; started = performance.now(); playing = true; play.textContent = "暂停";
  raf = requestAnimationFrame(tick);
}
function seek(t) { stop(); sample(t); return snapshot(); }
function snapshot() { return { time, playing, samples, paints, scene: to_js_data(scene), width: canvas.width, height: canvas.height }; }
play.onclick = () => playing ? stop() : start();
document.querySelector("#reset").onclick = () => seek(0);
slider.oninput = () => seek(Number(slider.value));
document.querySelectorAll("[data-time]").forEach(button => button.onclick = () => seek(Number(button.dataset.time)));
toggle.onclick = () => {
  panel.hidden = !panel.hidden;
  toggle.setAttribute("aria-expanded", String(!panel.hidden));
  toggle.textContent = panel.hidden ? "展开面板" : "收起面板";
};
document.querySelector("#share").onclick = async () => {
  const url = new URL(location.href); url.searchParams.set("t", String(time));
  history.replaceState(null, "", url);
  try { await navigator.clipboard.writeText(url.href); } catch { /* URL 已更新，仍可手动复制。 */ }
};
new ResizeObserver(draw).observe(canvas);
let resolution;
function watchDpr() {
  resolution?.removeEventListener("change", watchDpr);
  resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`);
  resolution.addEventListener("change", watchDpr); draw();
}
watchDpr();
document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
window.addEventListener("pagehide", stop);
window.treeDemo = { seek, snapshot, pause: stop, play: start };
// 显式链接时间和 reduced-motion 均默认暂停，便于分享/截图。
if (!params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) start();
