// 宿主只负责时钟、URL、DOM 与坐标逆变换；场景、命中、过渡和日志重放均在 Calcit。
import * as finder from "../../target/js/finder/quamolit.examples.finder.mjs";
import { to_js_data } from "../../target/js/finder/calcit.core.mjs";
import { draw_reference_$x_ } from "../../target/js/finder/quamolit.canvas-reference.mjs";
import { DemandFrameScheduler } from "../../demos/demand-frame-scheduler.mjs";
export function mountDemo() {
const canvas = document.querySelector("#scene"), context = canvas.getContext("2d");
const status = document.querySelector("#status"), message = document.querySelector("#message"), slider = document.querySelector("#time");
const play = document.querySelector("#play"), panel = document.querySelector("#panel"), toggle = document.querySelector("#panel-toggle");
const scrollViewport = document.querySelector("#finder-viewport"), scrollControl = document.querySelector("#finder-scroll");
const params = new URLSearchParams(location.search);
let log = finder.empty_events(), time = 0, model = finder.initial(), paints = 0;
let scene, presentation, interactionPlan, paintedModel, paintedTime, compact = false;
let scroll = 0, scrollLimit = 0;
let playing = false, anchor = 0, started = 0, until = 10;
let view = { scale: 1, x: 0, y: 0 };
const scheduler = new DemandFrameScheduler({
  requestFrame: callback => requestAnimationFrame(callback),
  cancelFrame: handle => cancelAnimationFrame(handle),
  paint: (now, reasons) => playing ? frame(now) : draw(),
});
function wake(reason) { scheduler.request(reason); scheduler.resume(); }
function draw() {
  const bounds = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const document = finder.scene_at(model,time);
  compact = bounds.width < 720;
  scrollLimit = compact ? finder.compact_scroll_limit(bounds.height) : 0;
  scroll = Math.max(0,Math.min(scroll,scrollLimit));
  scrollViewport.hidden = scrollLimit === 0; scrollControl.max = String(scrollLimit); scrollControl.value = String(scroll);
  const displayed = compact ? finder.compact_document(document,Math.max(300,bounds.width),bounds.height) : document;
  const nextHitPlan = finder.hit_plan(model,time,displayed);
  const width = Math.max(1, Math.round(bounds.width * dpr)), height = Math.max(1, Math.round(bounds.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  view = compact ? {scale:dpr,x:width/2,y:finder.compact_view_y(bounds.height,scroll)*dpr} : { scale: Math.min(width / 1100, height / 800), x: panel.hidden ? width / 2 : width * 0.38, y: height / 2 };
  context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, width, height);
  context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
  draw_reference_$x_(context, displayed);
  scene=document; presentation=displayed; interactionPlan=nextHitPlan; paintedModel=model; paintedTime=time;
  paints++;
  slider.value = String(time);
  status.textContent = `t = ${time.toFixed(2)} s · 文件夹 ${to_js_data(model).folder} · 卡片 ${to_js_data(model).card}\n文件夹展开 ${finder.folder_value(model, time).toFixed(2)} · 卡片聚焦 ${finder.card_value(model, time).toFixed(2)}\n事件 ${to_js_data(log).length} 条 · 绘制 ${paints}`;
  status.dataset.result = "pass";
}
function sample(next) {
  if (!Number.isFinite(next) || next < 0 || next > 10) throw new RangeError("演示时间必须在 0–10 秒内");
  model = finder.replay(log, next); time = next; draw();
}
function stop() { playing = false; scheduler.pause(); play.textContent = "播放时间"; }
function frame(now) {
  if (!playing) return;
  const next = Math.min(until, anchor + Math.max(0, now - started) / 1000);
  sample(next);
  if (next >= until) stop(); else scheduler.request("animation");
}
function start(limit = 10) {
  if (playing) return;
  if (time >= 10) sample(0);
  anchor = time; started = performance.now(); until = Math.min(10, limit);
  playing = true; play.textContent = "暂停时间"; wake("animation");
}
function snapshot() {
  return { pending: scheduler.pending,
    time,
    model: to_js_data(model),
    events: to_js_data(log),
    scene: to_js_data(scene),
    presentation: to_js_data(presentation), compact, scroll, scrollLimit,
    hitCandidates: to_js_data(interactionPlan).candidates.length,
    folderValues: to_js_data(finder.folder_values(model, time)),
    cardValues: to_js_data(finder.card_values(model, time)),
    playing,
    paints,
    width: canvas.width,
    height: canvas.height,
    view: { ...view },
  };
}
function seek(next) { stop(); sample(next); return snapshot(); }
function setScroll(value) {
  const next=Number(value);
  if(!Number.isFinite(next))throw new RangeError("档案视窗位置必须是有限数值");
  scroll=Math.max(0,Math.min(next,scrollLimit)); draw(); return snapshot();
}
scrollControl.oninput=()=>safely(()=>setScroll(scrollControl.value));
canvas.onwheel=event=>{if(compact&&scrollLimit>0){event.preventDefault();safely(()=>setScroll(scroll+event.deltaY));}};
function send(kind, folder = -1, card = -1, at = time, autoplay = true) {
  if (!Number.isFinite(at) || at < 0 || at > 10) throw new RangeError("事件时间无效");
  stop(); sample(at);
  const candidate = finder.append_event(finder.events_through(log, at), at, kind, folder, card);
  const next = finder.replay(candidate, at);
  log = candidate; model = next; time = at; draw();
  if (autoplay) start(time + 0.48);
  return snapshot();
}
function safely(action) { try { message.textContent = ""; return action(); } catch (error) { stop(); message.textContent = error.message; } }
canvas.onclick = event => safely(() => {
  const bounds = canvas.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) * canvas.width / bounds.width - view.x) / view.scale;
  const y = ((event.clientY - bounds.top) * canvas.height / bounds.height - view.y) / view.scale;
  // 点击当前已提交画面，不按新 wall-clock 再采样另一份几何。
  const hit = to_js_data(finder.hit_with_plan(paintedModel,paintedTime,interactionPlan,x,y));
  if (hit.kind !== "none") send(hit.kind, hit.folder, hit.card, paintedTime);
});
document.querySelector("#tour").onclick = () => safely(() => { stop(); log = finder.demo_log(); sample(0); start(4.2); });
document.querySelector("#back").onclick = () => safely(() => send("back"));
document.querySelector("#reset").onclick = () => safely(() => { stop(); log = finder.empty_events(); sample(0); });
play.onclick = () => playing ? stop() : start();
slider.oninput = () => safely(() => seek(Number(slider.value)));
document.querySelectorAll("[data-time]").forEach(button => button.onclick = () => safely(() => seek(Number(button.dataset.time))));
document.querySelector("#share").onclick = async () => {
  const url = new URL(location.href); url.searchParams.set("t", String(time)); url.searchParams.set("log", JSON.stringify(to_js_data(log)));
  history.replaceState(null, "", url);
  try { await navigator.clipboard.writeText(url.href); } catch { /* URL 已更新。 */ }
};
toggle.onclick = () => { panel.hidden = !panel.hidden; toggle.setAttribute("aria-expanded", String(!panel.hidden)); toggle.textContent = panel.hidden ? "展开面板" : "收起面板"; draw(); };
if (innerWidth < 600) { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "展开面板"; }
const observer = new ResizeObserver(() => wake("resize")); observer.observe(canvas);
let resolution;
function watchDpr() { resolution?.removeEventListener("change", watchDpr); resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`); resolution.addEventListener("change", watchDpr); wake("dpr"); }
watchDpr();
const listeners = new AbortController();
document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, { signal: listeners.signal });
window.addEventListener("pagehide", stop, { signal: listeners.signal });
const api = { seek, send, snapshot, setScroll, pause: stop, play: start, tour: () => { stop(); log = finder.demo_log(); sample(0); return snapshot(); } };
window.finderDemo = api;
if (params.has("log")) safely(() => {
  const events = JSON.parse(params.get("log"));
  if (!Array.isArray(events) || events.length > 2000) throw new RangeError("日志格式或容量无效");
  let candidate = finder.empty_events();
  for (const event of events) {
    if (!event || typeof event.at !== "number" || typeof event.kind !== "string" || !Number.isInteger(event.folder) || !Number.isInteger(event.card)) throw new TypeError("日志字段类型无效");
    candidate = finder.append_event(candidate, event.at, event.kind, event.folder, event.card);
  }
  finder.replay(candidate, Math.max(0, ...events.map(event => event.at)));
  log = candidate;
});
const requested = Number(params.get("t") || 0);
safely(() => sample(Number.isFinite(requested) && requested >= 0 && requested <= 10 ? requested : 0));
return () => { stop(); scheduler.dispose(); canvas.onclick = null; canvas.onwheel = null; scrollControl.oninput = null; listeners.abort(); observer.disconnect(); resolution?.removeEventListener("change", watchDpr); if (window.finderDemo === api) delete window.finderDemo; };
}
if (location.pathname.endsWith("/examples/finder/index.html")) mountDemo();
