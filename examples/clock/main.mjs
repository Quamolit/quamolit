// 页面只管理时钟/视口/DOM；数字进位、七段几何与渐变都在 Calcit。
import { draw_$x_, digits_at, scene_at } from "../../target/js/clock/quamolit.examples.clock.mjs";
import { to_js_data } from "../../target/js/clock/calcit.core.mjs";
const canvas = document.querySelector("canvas"), context = canvas.getContext("2d");
const status = document.querySelector("#status"), slider = document.querySelector("#time");
const play = document.querySelector("#play"), panel = document.querySelector("#panel"), toggle = document.querySelector("#panel-toggle");
const params = new URLSearchParams(location.search);
const parsed = Number(params.get("t") || 0);
let time = Number.isFinite(parsed) && parsed >= 0 && parsed <= 120 ? parsed : 0;
let playing = false, raf = null, anchor = 0, started = 0, paints = 0;
function draw() {
  const rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, w, h);
  // 原构图的固定逻辑视窗；输出为真实 DPR 像素。
  const scale = Math.min(w / 900, h / 520);
  context.setTransform(scale, 0, 0, scale, w / 2, h / 2);
  draw_$x_(context, time);
  paints++;
  slider.value = String(time);
  const digits = to_js_data(digits_at(time));
  status.textContent = `t = ${time.toFixed(2)} s\n${digits.join("").slice(0, 2)}:${digits.join("").slice(2, 4)}:${digits.join("").slice(4)}\n七段笔画 ${to_js_data(scene_at(time)).nodes.length} · 绘制 ${paints}`;
  status.dataset.result = "pass";
}
function sample(t) {
  if (!Number.isFinite(t) || t < 0 || t > 120) throw new RangeError("演示时间必须在 0–120 秒内");
  time = t; draw();
}
function stop() {
  playing = false;
  if (raf !== null) cancelAnimationFrame(raf);
  raf = null; play.textContent = "播放";
}
function tick(now) {
  if (!playing) return;
  const next = anchor + Math.max(0, now - started) / 1000;
  sample(Math.min(120, next));
  if (next >= 120) stop(); else raf = requestAnimationFrame(tick);
}
function start() {
  if (playing) return;
  if (time >= 120) sample(0);
  anchor = time; started = performance.now(); playing = true; play.textContent = "暂停";
  raf = requestAnimationFrame(tick);
}
function seek(t) { stop(); sample(t); return snapshot(); }
function snapshot() {
  const scene = to_js_data(scene_at(time));
  return { time, digits: to_js_data(digits_at(time)), nodeCount: scene.nodes.length, scene, playing, paints, width: canvas.width, height: canvas.height };
}
play.onclick = () => playing ? stop() : start();
document.querySelector("#reset").onclick = () => seek(0);
document.querySelector("#share").onclick = async () => {
  const url = new URL(location.href); url.searchParams.set("t", String(time));
  history.replaceState(null, "", url);
  try { await navigator.clipboard.writeText(url.href); } catch { /* URL 已更新。 */ }
};
slider.oninput = () => seek(Number(slider.value));
document.querySelectorAll("[data-time]").forEach(button => button.onclick = () => seek(Number(button.dataset.time)));
toggle.onclick = () => {
  panel.hidden = !panel.hidden;
  toggle.setAttribute("aria-expanded", String(!panel.hidden));
  toggle.textContent = panel.hidden ? "展开面板" : "收起面板";
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
window.clockDemo = { seek, snapshot, pause: stop, play: start };
if (!params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) start();
