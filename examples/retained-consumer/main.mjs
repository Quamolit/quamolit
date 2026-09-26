// 页面胶水只导入本应用的编译产物，不导入框架内部 JS 或测试夹具。
import { start, update_plan, draw_$x_, browser_available_$q_ } from "./target/js/app/app.main.mjs";
import { init_tags, to_js_data } from "./target/js/app/calcit.core.mjs";

const tags = init_tags(["declarations", "plan-builds", "binding-samples", "transform-samples", "transforms", "scene"]);
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
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
let plan = start(time, model, ready, viewport);
function snapshot() {
  return { time, model, ready, viewport, browser: browser_available_$q_(),
    declarations: plan.get(tags.declarations), builds: plan.get(tags["plan-builds"]),
    samples: plan.get(tags["binding-samples"]), transformSamples: plan.get(tags["transform-samples"]),
    transforms: to_js_data(plan.get(tags.transforms)), scene: to_js_data(plan.get(tags.scene)) };
}
function show() {
  if (fullscreen) {
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
  draw_$x_(context, plan);
  const { scene, transforms, ...counts } = snapshot();
  document.querySelector("#status").textContent = JSON.stringify(counts, null, 2);
  return snapshot();
}
function set(next = {}) {
  const request = { time, model, ready, viewport, ...next };
  const updated = update_plan(plan, request.time, request.model, request.ready, request.viewport);
  ({ time, model, ready, viewport } = request);
  plan = updated;
  return show();
}
document.querySelectorAll("[data-time]").forEach(button => button.onclick = () => set({ time: Number(button.dataset.time) }));
document.querySelector("#model").onclick = () => set({ model: model + 1 });
document.querySelector("#ready").onclick = () => set({ ready: !ready });
document.querySelector("#viewport").onclick = () => set({ viewport: viewport + 100 });
window.consumer = { set, snapshot };
if (fullscreen) {
  new ResizeObserver(show).observe(canvas);
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
