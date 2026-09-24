import { to_js_data as toJsData } from "../target/js/fade/calcit.core.mjs";
import {
  enter_scene_at as enterSceneAt,
  exit_scene_at as exitSceneAt,
  interrupt_scene_at as interruptSceneAt,
  gpu_enter_plan as gpuEnterPlan,
} from "../target/js/fade/quamolit.test.fade-migration-fixture.mjs";

const canvas = document.querySelector("#frame");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const sceneByMode = { enter: enterSceneAt, exit: exitSceneAt, interrupt: interruptSceneAt };
const params = new URLSearchParams(location.search);
const state = { mode: params.get("mode") ?? "enter", time: Number(params.get("time") ?? 0.125) };
const plan = toJsData(gpuEnterPlan());
if (plan[0] !== "supported" || plan[1].kernel[0] !== "tween") throw new Error("fade GPU 候选分类错误");

function render() {
  if (!Object.hasOwn(sceneByMode, state.mode)) throw new Error("未知 fade 路径");
  if (!Number.isFinite(state.time)) throw new Error("时间必须有限");
  const scene = toJsData(sceneByMode[state.mode](state.time));
  if (scene.nodes.length !== 2 || scene.nodes[0].content[0] !== "group" || scene.nodes[1].content[0] !== "rect") {
    throw new Error("迁移组件未产生预期 Scene");
  }
  const alpha = scene.nodes[0].content[1].opacity;
  const rect = scene.nodes[1].content[1];
  context.globalAlpha = 1;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = alpha;
  context.fillStyle = "#000000";
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.globalAlpha = 1;
  const pixel = Array.from(context.getImageData(rect.x + rect.width / 2, rect.y + rect.height / 2, 1, 1).data);
  const expected = Math.round(255 * (1 - alpha));
  if (pixel[3] !== 255 || pixel.slice(0, 3).some((channel) => Math.abs(channel - expected) > 1)) {
    throw new Error(`fade 像素错误：${pixel.join(",")}，期望灰度 ${expected}±1`);
  }
  status.dataset.result = "pass";
  status.textContent = `PASS · mode=${state.mode} · t=${state.time}s · alpha=${alpha} · pixel=${pixel.join(",")} · GPU 候选=tween`;
  return { alpha, pixel, scene };
}

for (const button of document.querySelectorAll("#modes button")) {
  button.addEventListener("click", () => { state.mode = button.dataset.mode; render(); });
}
for (const time of [0, 0.0625, 0.125, 0.25, 0.375, 0.5, 0.5625, 0.625, 0.75]) {
  const button = document.createElement("button");
  button.textContent = `${time}s`;
  button.addEventListener("click", () => { state.time = time; render(); });
  document.querySelector("#times").append(button);
}

try {
  for (const [mode, time, alpha] of [
    ["enter", 0.25, 1], ["enter", 0, 0], ["enter", 0.125, 0.5],
    ["exit", 0.625, 0.5], ["interrupt", 0.125, 0.5], ["interrupt", 0.25, 0.25],
  ]) {
    state.mode = mode;
    state.time = time;
    if (render().alpha !== alpha) throw new Error(`fade 中间帧错误：${mode}@${time}`);
  }
  state.mode = params.get("mode") ?? "enter";
  state.time = Number(params.get("time") ?? 0.125);
  render();
  window.quamolitFadeMigration = { state, render, canvas };
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
