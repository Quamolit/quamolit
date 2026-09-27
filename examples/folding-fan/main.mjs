// 资源、视口和宿主时间在页面；折扇的状态、几何与绘制调用均来自 Calcit。
import { initial, toggle, fold_value, slices_at, draw_$x_ } from "../../target/js/folding-fan/quamolit.examples.folding-fan.mjs";
import { image_create, image_src_$x_, image_decode_$x_, image_natural_width, image_natural_height } from "../../target/js/folding-fan/js-ffi.browser.mjs";
import { to_js_data } from "../../target/js/folding-fan/calcit.core.mjs";
const canvas = document.querySelector("canvas"), context = canvas.getContext("2d");
const status = document.querySelector("#status"), message = document.querySelector("#message"), slider = document.querySelector("#time");
const play = document.querySelector("#play"), panel = document.querySelector("#panel"), panelToggle = document.querySelector("#panel-toggle");
const params = new URLSearchParams(location.search);
const parsed = Number(params.get("t") || 0);
let time = Number.isFinite(parsed) && parsed >= 0 && parsed <= 120 ? parsed : 0;
let model = initial(), events = [], image = null, resource = "loading", error = "", playing = false, raf = null, anchor = 0, started = 0, until = 120, paints = 0;
const eventTimes = (params.get("events") || "").split(",").filter(Boolean).map(Number);
if (eventTimes.length <= 100 && eventTimes.every((at, index) => Number.isFinite(at) && at >= 0 && at <= 120 && (index === 0 || at >= eventTimes[index - 1]))) {
  for (const at of eventTimes) { model = toggle(model, at); events.push(at); }
}
function draw() {
  const rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = "#171022";
  context.fillRect(0, 0, width, height);
  if (resource === "ready") {
    const scale = Math.min(width / 900, height / 650);
    context.setTransform(scale, 0, 0, scale, width / 2, height * 0.77);
    draw_$x_(context, image, model, time);
  }
  paints++;
  slider.value = String(time);
  status.textContent = `t = ${time.toFixed(2)} s · 切片 24\n开合 ${fold_value(model, time).toFixed(3)} · 图片 ${resource} · 绘制 ${paints}`;
  status.dataset.result = resource === "ready" ? "pass" : resource;
  message.textContent = error;
}
function sample(value) {
  if (!Number.isFinite(value) || value < 0 || value > 120) throw new RangeError("演示时间必须在 0–120 秒内");
  time = value; draw();
}
function stop() { playing = false; if (raf !== null) cancelAnimationFrame(raf); raf = null; play.textContent = "播放时间"; }
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
  playing = true; play.textContent = "暂停时间"; raf = requestAnimationFrame(tick);
}
function snapshot() {
  return { time, model: to_js_data(model), events: [...events], foldValue: fold_value(model, time), slices: to_js_data(slices_at(model, time)), resource, error, playing, paints, width: canvas.width, height: canvas.height };
}
function seek(value) { stop(); sample(value); return snapshot(); }
function reset() { stop(); model = initial(); events = []; sample(0); return snapshot(); }
function clickToggle(at = time) { stop(); time = at; model = toggle(model, at); events.push(at); draw(); return snapshot(); }
document.querySelector("#toggle-fold").onclick = () => { clickToggle(); start(time + 0.36); };
play.onclick = () => playing ? stop() : start();
document.querySelector("#reset").onclick = reset;
document.querySelector("#share").onclick = async () => {
  const url = new URL(location.href); url.searchParams.set("t", String(time));
  if (events.length) url.searchParams.set("events", events.join(",")); else url.searchParams.delete("events");
  history.replaceState(null, "", url);
  try { await navigator.clipboard.writeText(url.href); } catch { /* URL 已更新。 */ }
};
slider.oninput = () => seek(Number(slider.value));
document.querySelectorAll("[data-time]").forEach(button => button.onclick = () => seek(Number(button.dataset.time)));
panelToggle.onclick = () => {
  panel.hidden = !panel.hidden; panelToggle.setAttribute("aria-expanded", String(!panel.hidden));
  panelToggle.textContent = panel.hidden ? "展开面板" : "收起面板";
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
window.foldingFanDemo = { seek, reset, clickToggle, snapshot, pause: stop, play: start };
const source = params.get("image") === "missing" ? new URL("./missing-lotus.jpg", import.meta.url) : new URL("../../assets/lotus.jpg", import.meta.url);
image = image_create();
image_src_$x_(image, source.href);
try {
  await image_decode_$x_(image);
  if (image_natural_width(image) === 0 || image_natural_height(image) === 0) throw new Error("图片不存在或无法解码");
  if (image_natural_width(image) !== 650 || image_natural_height(image) !== 432) throw new Error("荷花图片尺寸与 650 × 432 切片依据不符");
  resource = "ready";
} catch (cause) { resource = "error"; error = `图片加载失败：${cause.message || cause}`; }
if (resource === "loading") { resource = "error"; error = "图片加载失败：解码未完成"; }
draw();
if (resource === "ready" && !params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  clickToggle(0); start(0.36);
}
