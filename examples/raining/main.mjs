// 页面仅管理宿主时钟、视口、URL 和控件；雨滴状态与几何由 Calcit 生成。
import { draw_$x_, scene_at } from "../../target/js/raining/quamolit.examples.raining.mjs";
import { to_js_data } from "../../target/js/raining/calcit.core.mjs";
const canvas = document.querySelector("canvas"), context = canvas.getContext("2d");
const status = document.querySelector("#status"), slider = document.querySelector("#tick"), seedInput = document.querySelector("#seed");
const play = document.querySelector("#play"), panel = document.querySelector("#panel"), toggle = document.querySelector("#panel-toggle");
const params = new URLSearchParams(location.search);
function boundedInteger(raw, fallback, min, max) {
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}
let seed = boundedInteger(params.get("seed"), 17, 1, 1_000_000);
let tick = boundedInteger(params.get("tick"), 0, 0, 900);
let playing = false, raf = null, anchor = 0, started = 0, paints = 0;
function draw() {
  const rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, w, h);
  const scale = Math.min(w / 1100, h / 800);
  context.setTransform(scale, 0, 0, scale, w / 2, h / 2);
  draw_$x_(context, seed, tick);
  paints++;
  slider.value = String(tick); seedInput.value = String(seed);
  const count = to_js_data(scene_at(seed, tick)).nodes.length;
  status.textContent = `seed ${seed} · tick ${tick} · ${(tick / 30).toFixed(2)} s\n雨滴/水花 ${count} / 48 · 绘制 ${paints}`;
  status.dataset.result = "pass";
}
function stop() { playing = false; if (raf !== null) cancelAnimationFrame(raf); raf = null; play.textContent = "播放"; }
function seek(next) {
  if (!Number.isInteger(next) || next < 0 || next > 900) throw new RangeError("tick 必须是 0–900 的整数");
  stop(); tick = next; draw(); return snapshot();
}
function setSeed(next) {
  if (!Number.isInteger(next) || next < 1 || next > 1_000_000) throw new RangeError("seed 必须是 1–1000000 的整数");
  stop(); seed = next; tick = 0; draw(); return snapshot();
}
function frame(now) {
  if (!playing) return;
  const next = Math.min(900, anchor + Math.floor(Math.max(0, now - started) * 30 / 1000));
  if (next !== tick) { tick = next; draw(); }
  if (next >= 900) stop(); else raf = requestAnimationFrame(frame);
}
function start() {
  if (playing) return;
  if (tick >= 900) seek(0);
  anchor = tick; started = performance.now(); playing = true; play.textContent = "暂停";
  raf = requestAnimationFrame(frame);
}
function snapshot() { return { seed, tick, scene: to_js_data(scene_at(seed, tick)), playing, paints, width: canvas.width, height: canvas.height }; }
play.onclick = () => playing ? stop() : start();
document.querySelector("#reset").onclick = () => seek(0);
document.querySelector("#share").onclick = async () => {
  const url = new URL(location.href); url.searchParams.set("seed", String(seed)); url.searchParams.set("tick", String(tick));
  history.replaceState(null, "", url);
  try { await navigator.clipboard.writeText(url.href); } catch { /* URL 已更新。 */ }
};
slider.oninput = () => seek(Number(slider.value));
seedInput.onchange = () => { const next = Number(seedInput.value); if (Number.isInteger(next) && next >= 1 && next <= 1_000_000) setSeed(next); else seedInput.value = String(seed); };
document.querySelectorAll("[data-tick]").forEach(button => button.onclick = () => seek(Number(button.dataset.tick)));
toggle.onclick = () => { panel.hidden = !panel.hidden; toggle.setAttribute("aria-expanded", String(!panel.hidden)); toggle.textContent = panel.hidden ? "展开面板" : "收起面板"; };
new ResizeObserver(draw).observe(canvas);
let resolution;
function watchDpr() { resolution?.removeEventListener("change", watchDpr); resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`); resolution.addEventListener("change", watchDpr); draw(); }
watchDpr();
document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
window.addEventListener("pagehide", stop);
window.rainingDemo = { seek, setSeed, snapshot, pause: stop, play: start };
if (!params.has("tick") && !matchMedia("(prefers-reduced-motion: reduce)").matches) start();
