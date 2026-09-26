// 页面只持有 Calcit Model、转发事件与宿主时间；图标路径和中间帧都由 Calcit 生成。
import { initial, increase, toggle_play, count_value, play_value, scene_at, draw_$x_ } from "../../target/js/icons/quamolit.examples.icons.mjs";
import { to_js_data } from "../../target/js/icons/calcit.core.mjs";
const canvas = document.querySelector("canvas"), context = canvas.getContext("2d");
const status = document.querySelector("#status"), slider = document.querySelector("#time");
const play = document.querySelector("#play-time"), panel = document.querySelector("#panel"), toggle = document.querySelector("#panel-toggle");
const params = new URLSearchParams(location.search);
const parsed = Number(params.get("t") || 0);
let time = Number.isFinite(parsed) && parsed >= 0 && parsed <= 120 ? parsed : 0;
let model = initial(), playing = false, raf = null, anchor = 0, started = 0, until = 120, paints = 0;
function draw() {
  const rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, w, h);
  const scale = Math.min(w / 900, h / 540);
  context.setTransform(scale, 0, 0, scale, w * 0.42, h / 2);
  draw_$x_(context, model, time);
  paints++;
  slider.value = String(time);
  status.textContent = `t = ${time.toFixed(2)} s\n计数 ${to_js_data(model).count}（当前 ${count_value(model, time).toFixed(2)}）\n播放形变 ${play_value(model, time).toFixed(2)} · 绘制 ${paints}`;
  status.dataset.result = "pass";
}
function sample(t) {
  if (!Number.isFinite(t) || t < 0 || t > 120) throw new RangeError("演示时间必须在 0–120 秒内");
  time = t; draw();
}
function stop() {
  playing = false;
  if (raf !== null) cancelAnimationFrame(raf);
  raf = null; play.textContent = "播放时间";
}
function tick(now) {
  if (!playing) return;
  const next = anchor + Math.max(0, now - started) / 1000;
  sample(Math.min(until, next));
  if (next >= until) stop(); else raf = requestAnimationFrame(tick);
}
function start(limit = 120) {
  if (playing) return;
  if (time >= 120) { model = initial(); sample(0); }
  anchor = time; started = performance.now(); until = Math.min(120, limit);
  playing = true; play.textContent = "暂停时间";
  raf = requestAnimationFrame(tick);
}
function snapshot() {
  return { time, model: to_js_data(model), countValue: count_value(model, time), playValue: play_value(model, time), scene: to_js_data(scene_at(model, time)), playing, paints, width: canvas.width, height: canvas.height };
}
function seek(t) { stop(); sample(t); return snapshot(); }
function reset() { stop(); model = initial(); sample(0); return snapshot(); }
function clickIncrease(at = time) { stop(); time = at; model = increase(model, at); draw(); return snapshot(); }
function clickPlay(at = time) { stop(); time = at; model = toggle_play(model, at); draw(); return snapshot(); }
function invoke(action) { const result = action(); start(time + 0.34); return result; }
document.querySelector("#increase").onclick = () => invoke(clickIncrease);
document.querySelector("#toggle-icon").onclick = () => invoke(clickPlay);
play.onclick = () => playing ? stop() : start();
document.querySelector("#reset").onclick = reset;
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
window.iconsDemo = { seek, reset, clickIncrease, clickPlay, snapshot, pause: stop, play: start };
if (!params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) start();
