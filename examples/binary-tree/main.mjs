// 页面入口只管理时钟/视口/DOM；递归、三角函数与绘制在 Calcit。
import { scene_at, start_component, update_component } from "../../target/js/binary-tree/quamolit.examples.binary-tree.mjs";
import { sample_plan_at, draw_plan_$x_ } from "../../target/js/binary-tree/quamolit.retained-component.mjs";
import { draw_reference_$x_ } from "../../target/js/binary-tree/quamolit.canvas-reference.mjs";
import { to_js_data, init_tags } from "../../target/js/binary-tree/calcit.core.mjs";
import { DemandFrameScheduler } from "../../demos/demand-frame-scheduler.mjs";
export function mountDemo() {
const tags = init_tags(["scene", "transforms", "transform-samples"]);
const canvas = document.querySelector("canvas"), context = canvas.getContext("2d");
const status = document.querySelector("#status"), slider = document.querySelector("#time");
const play = document.querySelector("#play"), panel = document.querySelector("#panel"), toggle = document.querySelector("#panel-toggle");
const params = new URLSearchParams(location.search);
const parsed = Number(params.get("t") || 0);
let time = Number.isFinite(parsed) && parsed >= 0 && parsed <= 60 ? parsed : 0;
let depth = 5, plan = start_component(time, depth), builds = 1, referenceMode = false;
let playing = false, anchor = 0, started = 0;
let paints = 0, samples = 1;
const scheduler = new DemandFrameScheduler({
  requestFrame: callback => requestAnimationFrame(callback),
  cancelFrame: handle => cancelAnimationFrame(handle),
  paint: (now, reasons) => playing ? tick(now) : draw(),
});
function wake(reason) { scheduler.request(reason); scheduler.resume(); }
function draw() {
  const rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, w, h);
  // 原构图的固定逻辑视窗，不随浮层宽度挤压。输出为真实 DPR 像素。
  const scale = Math.min(w / 1000, h / 800);
  context.setTransform(scale, 0, 0, scale, w / 2, h / 2 + 70 * scale);
  if (referenceMode) draw_reference_$x_(context, scene_at(time, depth));
  else draw_plan_$x_(context, plan);
  paints++;
  slider.value = String(time);
  status.textContent = `t = ${time.toFixed(2)} s\n${2 ** (depth + 1) - 1} paths · ${referenceMode ? "全量参考" : "统一组件计划"}\n结构构建 ${builds} / 变换采样 ${plan.get(tags["transform-samples"])}\n采样 ${samples} / 绘制 ${paints}`;
  status.dataset.result = "pass";
}
function sample(t) {
  if (!Number.isFinite(t) || t < 0 || t > 60) throw new RangeError("演示时间必须在 0–60 秒内");
  const next = sample_plan_at(plan, t);
  time = t; plan = next; samples++; draw();
}
function stop() {
  playing = false;
  scheduler.pause(); play.textContent = "播放";
}
function tick(now) {
  if (!playing) return;
  // 首次 rAF 的帧时间戳可能早于注册回调时的 performance.now()。
  const next = anchor + Math.max(0, now - started) / 1000;
  sample(Math.min(60, next));
  if (next >= 60) stop(); else scheduler.request("animation");
}
function start() {
  if (playing) return;
  if (time === 60) sample(0);
  anchor = time; started = performance.now(); playing = true; play.textContent = "暂停";
  wake("animation");
}
function seek(t) { stop(); sample(t); return snapshot(); }
function snapshot() { return { pending: scheduler.pending, time, playing, samples, paints, builds, depth, referenceMode, planSamples: plan.get(tags["transform-samples"]), scene: to_js_data(plan.get(tags.scene)), transforms: to_js_data(plan.get(tags.transforms)), width: canvas.width, height: canvas.height }; }
document.querySelector("#depth").onchange = event => {
  const nextDepth = Number(event.target.value), next = update_component(plan, time, nextDepth);
  depth = nextDepth; plan = next; builds++; draw();
};
document.querySelector("#reference").onclick = event => {
  referenceMode = !referenceMode;
  event.target.textContent = referenceMode ? "切换保留几何" : "切换全量参考";
  draw();
};
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
const observer = new ResizeObserver(() => wake("resize")); observer.observe(canvas);
let resolution;
function watchDpr() {
  resolution?.removeEventListener("change", watchDpr);
  resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`);
  resolution.addEventListener("change", watchDpr); wake("dpr");
}
watchDpr();
const listeners = new AbortController();
document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, { signal: listeners.signal });
window.addEventListener("pagehide", stop, { signal: listeners.signal });
const api = { seek, snapshot, pause: stop, play: start };
window.treeDemo = api;
// 显式链接时间和 reduced-motion 均默认暂停，便于分享/截图。
if (!params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) start();
return () => { stop(); scheduler.dispose(); listeners.abort(); observer.disconnect(); resolution?.removeEventListener("change", watchDpr); if (window.treeDemo === api) delete window.treeDemo; };
}
if (location.pathname.endsWith("/examples/binary-tree/index.html")) mountDemo();
