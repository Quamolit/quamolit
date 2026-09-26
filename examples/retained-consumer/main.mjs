// 页面胶水只导入本应用的编译产物，不导入框架内部 JS 或测试夹具。
import { start, update_plan, draw_$x_, browser_available_$q_ } from "./target/js/app/app.main.mjs";
import { init_tags, to_js_data } from "./target/js/app/calcit.core.mjs";

const tags = init_tags(["declarations", "plan-builds", "binding-samples", "scene"]);
const context = document.querySelector("canvas").getContext("2d");
let time = 0, model = 40, ready = false, viewport = 100;
let plan = start(time, model, ready, viewport);
function snapshot() {
  return { time, model, ready, viewport, browser: browser_available_$q_(),
    declarations: plan.get(tags.declarations), builds: plan.get(tags["plan-builds"]),
    samples: plan.get(tags["binding-samples"]), scene: to_js_data(plan.get(tags.scene)) };
}
function show() {
  draw_$x_(context, plan);
  const { scene, ...counts } = snapshot();
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
show();
