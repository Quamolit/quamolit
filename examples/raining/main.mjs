// 页面仅管理宿主时钟、视口、URL 和控件；雨滴状态与几何由 Calcit 生成。
import { draw_$x_, scene_at } from "../../target/js/raining/quamolit.examples.raining.mjs";
import { to_js_data } from "../../target/js/raining/calcit.core.mjs";
import { DemandFrameScheduler } from "../../demos/demand-frame-scheduler.mjs";
export function mountDemo() {
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
let playing = false, anchor = 0, started = 0, paints = 0;
const scheduler = new DemandFrameScheduler({
  requestFrame: callback => requestAnimationFrame(callback),
  cancelFrame: handle => cancelAnimationFrame(handle),
  paint: (now, reasons) => playing ? frame(now, reasons.some(reason => reason !== "animation")) : draw(),
});
function wake(reason) { scheduler.request(reason); scheduler.resume(); }
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
  status.textContent = `seed ${seed} · tick ${tick} · ${(tick / 30).toFixed(2)} s\n雨滴/水花 ${count} / 384 · 绘制 ${paints}`;
  status.dataset.result = "pass";
}
function stop() { playing = false; scheduler.pause(); play.textContent = "播放"; }
function seek(next) {
  if (!Number.isInteger(next) || next < 0 || next > 900) throw new RangeError("tick 必须是 0–900 的整数");
  stop(); tick = next; draw(); return snapshot();
}
function setSeed(next) {
  if (!Number.isInteger(next) || next < 1 || next > 1_000_000) throw new RangeError("seed 必须是 1–1000000 的整数");
  stop(); seed = next; tick = 0; draw(); return snapshot();
}
function frame(now, invalidated = false) {
  if (!playing) return;
  const next = Math.min(900, anchor + Math.floor(Math.max(0, now - started) * 30 / 1000));
  if (next !== tick || invalidated) { tick = next; draw(); }
  if (next >= 900) stop(); else scheduler.request("animation");
}
function start() {
  if (playing) return;
  if (tick >= 900) seek(0);
  anchor = tick; started = performance.now(); playing = true; play.textContent = "暂停";
  wake("animation");
}
function snapshot() { return { pending: scheduler.pending, seed, tick, scene: to_js_data(scene_at(seed, tick)), playing, paints, width: canvas.width, height: canvas.height }; }
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
const observer = new ResizeObserver(() => wake("resize")); observer.observe(canvas);
let resolution;
function watchDpr() { resolution?.removeEventListener("change", watchDpr); resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`); resolution.addEventListener("change", watchDpr); wake("dpr"); }
watchDpr();
const listeners = new AbortController();
document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, { signal: listeners.signal });
window.addEventListener("pagehide", stop, { signal: listeners.signal });
const api = { seek, setSeed, snapshot, pause: stop, play: start };
window.rainingDemo = api;
if (!params.has("tick") && !matchMedia("(prefers-reduced-motion: reduce)").matches) start();
return () => { stop(); scheduler.dispose(); listeners.abort(); observer.disconnect(); resolution?.removeEventListener("change", watchDpr); if (window.rainingDemo === api) delete window.rainingDemo; };
}
if (location.pathname.endsWith("/examples/raining/index.html")) mountDemo();
