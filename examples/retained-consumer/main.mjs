// 页面胶水只导入本应用的编译产物，不导入框架内部 JS 或测试夹具。
import { start, update_plan, start_dual, update_dual, draw_$x_, instances_declaration, browser_available_$q_,
  create_instances_table_$x_, register_instances_$x_, patch_instances_$x_, release_instances_$x_,
  draw_resolved_instances_$x_, instance_frame_at, instances_live_count,
  create_instances_gpu_$x_, draw_instances_gpu_$x_, dispose_instances_gpu_$x_ } from "./target/js/app/app.main.mjs";
import { init_tags, to_js_data } from "./target/js/app/calcit.core.mjs";
import { createInstancePositions } from "./instances-input.mjs";

const tags = init_tags(["declarations", "plan-builds", "binding-samples", "transform-samples", "transforms", "scene"]);
let canvas = document.querySelector("canvas");
let context = canvas.getContext("2d");
let canvasKind = "canvas", gpuState = null, resizeObserver, modeGeneration = 0;
// 仅为页面展示/诊断模式；动画和 Scene 仍由 Calcit 产生。
const fullscreen = new URLSearchParams(location.search).get("fixture") !== "1";
document.body.classList.toggle("stage", fullscreen);
const panel = document.querySelector("#panel");
const toggle = document.querySelector("#panel-toggle");
toggle.onclick = () => {
  panel.hidden = !panel.hidden;
  toggle.setAttribute("aria-expanded", String(!panel.hidden));
  toggle.textContent = panel.hidden ? "展开控制面板" : "收起控制面板";
};
// 单独复制/搬移时没有导航站点；仓库多页面部署时才使用相对返回链接。
if (/\/examples\/retained-consumer\/(?:index.html)?$/.test(location.pathname)) {
  const nav = document.querySelector("#demo-nav");
  nav.href = "../../demos/index.html";
  nav.textContent = "← 所有演示";
}
let time = 0, model = 40, ready = false, viewport = 100;
const requestedMode = new URLSearchParams(location.search).get("motion");
let mode = ["mixed", "dual", "instances", "instances-gpu"].includes(requestedMode) ? requestedMode : "mixed";
if (mode === "instances-gpu") mode = "instances";
let plan = (mode === "dual" ? start_dual : start)(time, model, ready, viewport);
// Float32Array 是宿主提供的数据源；实例声明与实际 Canvas 绘制都走消费者的 Calcit 公共入口。
const instanceCount = to_js_data(instances_declaration()).source.count;
const positions = createInstancePositions(instanceCount);
const instanceTable = create_instances_table_$x_();
register_instances_$x_(instanceTable, positions);
let instanceVersion = 1, instanceTime = 0, instanceCopiedBytes = positions.byteLength;
let instanceMetrics = null;
function updateInstanceTime(nextTime) {
  if (nextTime === instanceTime) return;
  const frame = instance_frame_at(nextTime);
  const values = to_js_data(frame);
  const previous = instanceVersion;
  const next = previous + 1;
  instanceCopiedBytes = patch_instances_$x_(instanceTable, previous, next, frame, new Float32Array([values.x, values.y]));
  release_instances_$x_(instanceTable, previous);
  instanceVersion = next;
  instanceTime = nextTime;
}
function snapshot() {
  if (mode === "instances" || mode === "instances-gpu") return { time, model, ready, viewport, mode, browser: browser_available_$q_(),
    source: { count: instanceCount, positionBytes: positions.byteLength, version: instanceVersion,
      copiedBytes: instanceCopiedBytes, live: instances_live_count(instanceTable) }, metrics: instanceMetrics,
    adapter: gpuState?.adapter ?? null };
  return { time, model, ready, viewport, mode, browser: browser_available_$q_(),
    declarations: plan.get(tags.declarations), builds: plan.get(tags["plan-builds"]),
    samples: plan.get(tags["binding-samples"]), transformSamples: plan.get(tags["transform-samples"]),
    transforms: to_js_data(plan.get(tags.transforms)), scene: to_js_data(plan.get(tags.scene)) };
}
function show() {
  document.querySelectorAll("[data-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
  document.querySelectorAll("#model, #ready, #viewport").forEach(button => { button.disabled = mode.startsWith("instances"); });
  if (fullscreen && canvasKind === "canvas") {
    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(width * dpr)), h = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, w, h);
    // contain 是此最小消费者的展示策略，不是框架的响应式布局 API。
    const scale = Math.min(w / 320, h / 180);
    context.setTransform(scale, 0, 0, scale, (w - 320 * scale) / 2, (h - 180 * scale) / 2);
  }
  if (mode === "instances-gpu") {
    if (gpuState) {
      instanceMetrics = to_js_data(draw_instances_gpu_$x_(gpuState.previousVersion, gpuState.batch, instanceTable, instanceVersion));
      gpuState.previousVersion = instanceVersion;
    }
  } else if (mode === "instances") {
    context.clearRect(0, 0, 320, 180);
    instanceMetrics = to_js_data(draw_resolved_instances_$x_(context, instanceTable, instanceVersion));
  } else draw_$x_(context, plan);
  const { scene, transforms, ...counts } = snapshot();
  document.querySelector("#status").textContent = JSON.stringify(counts, null, 2);
  return snapshot();
}
function set(next = {}) {
  if (mode.startsWith("instances")) {
    if (next.time !== undefined) {
      updateInstanceTime(next.time);
      time = next.time;
    }
    return show();
  }
  const request = { time, model, ready, viewport, ...next };
  const updated = (mode === "dual" ? update_dual : update_plan)(plan, request.time, request.model, request.ready, request.viewport);
  ({ time, model, ready, viewport } = request);
  plan = updated;
  return show();
}
function replaceCanvas(kind) {
  if (kind === canvasKind) return;
  const replacement = document.createElement("canvas");
  replacement.id = canvas.id;
  replacement.width = 320; replacement.height = 180;
  replacement.setAttribute("aria-label", canvas.getAttribute("aria-label"));
  resizeObserver?.unobserve(canvas);
  canvas.replaceWith(replacement);
  canvas = replacement;
  resizeObserver?.observe(canvas);
  canvasKind = kind;
  context = kind === "canvas" ? canvas.getContext("2d") : null;
}
function disposeGpu() {
  if (!gpuState) return;
  dispose_instances_gpu_$x_(gpuState.batch);
  gpuState.device.destroy();
  gpuState = null;
}
async function setMode(next) {
  if (!["mixed", "dual", "instances", "instances-gpu"].includes(next)) throw Error("unknown-consumer-mode");
  const generation = ++modeGeneration;
  // 更换声明时建立新计划，不能让相同版本错误复用另一个声明的结构。
  const nextPlan = next.startsWith("instances") ? plan : (next === "dual" ? start_dual : start)(time, model, ready, viewport);
  if (next !== "instances-gpu") disposeGpu();
  mode = next; plan = nextPlan;
  if (mode.startsWith("instances")) updateInstanceTime(time);
  if (next === "instances-gpu") {
    try {
      if (!navigator.gpu) throw Error("此浏览器没有 WebGPU；已回退 Canvas 参考。");
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) throw Error("未取得 WebGPU adapter；已回退 Canvas 参考。");
      const device = await adapter.requestDevice();
      if (generation !== modeGeneration) { device.destroy(); return snapshot(); }
      replaceCanvas("gpu");
      let batch;
      try { batch = await create_instances_gpu_$x_(canvas, device, navigator.gpu.getPreferredCanvasFormat()); }
      catch (error) { device.destroy(); throw error; }
      if (generation !== modeGeneration) { dispose_instances_gpu_$x_(batch); device.destroy(); return snapshot(); }
      gpuState = { device, batch, previousVersion: -1, adapter: adapter.info?.architecture ?? "unknown" };
    } catch (error) {
      mode = "instances";
      replaceCanvas("canvas");
      document.querySelector("#gpu-note").textContent = error.message;
    }
  } else replaceCanvas("canvas");
  return show();
}
document.querySelectorAll("[data-mode]").forEach(button => button.onclick = () => { void setMode(button.dataset.mode); });
document.querySelectorAll("[data-time]").forEach(button => button.onclick = () => set({ time: Number(button.dataset.time) }));
document.querySelector("#model").onclick = () => set({ model: model + 1 });
document.querySelector("#ready").onclick = () => set({ ready: !ready });
document.querySelector("#viewport").onclick = () => set({ viewport: viewport + 100 });
window.consumer = { set, snapshot, setMode };
if (fullscreen) {
  resizeObserver = new ResizeObserver(show);
  resizeObserver.observe(canvas);
  // 跨显示器/缩放可能仅改变 DPR；不以动画推进触发重绘。
  let resolution;
  function watchResolution() {
    resolution?.removeEventListener("change", watchResolution);
    resolution = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    resolution.addEventListener("change", watchResolution);
    show();
  }
  watchResolution();
}
show();
if (requestedMode === "instances-gpu") void setMode("instances-gpu");
