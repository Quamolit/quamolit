import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { bound_scene_document_at as boundSceneDocumentAt, sample_direct_x as sampleDirectX } from "../js-out/quamolit.test.motion-fixture.mjs";
import { RetainedScenePlan } from "../retained-scene-plan.mjs";
import { DemandFrameScheduler } from "../demand-frame-scheduler.mjs";
import { InstanceSourceRegistry } from "../instance-sources.mjs";
import { CanvasInstanceBatches } from "../canvas-instance-batches.mjs";
import { instanceGrid } from "./instance-grid.mjs";

const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const state = {
  time: Number(new URLSearchParams(location.search).get("time") ?? 0.5),
  model: 0, input: 0, ready: false, viewport: 100, dpr: 1,
  versions: { model: 0, input: 0, resources: 0, viewport: 0, quality: 0, motion: 0 },
};
const samplers = new Map([["badge-x@1", { sample: (time, values) => 4 * sampleDirectX(time,
  values.model, values.input, values.ready, values.viewport,
  values.versions.model, values.versions.input, values.versions.resources, values.versions.viewport),
  dependencies: ["model", "input", "resources", "viewport", "motion"] }]]);
const baseScene = toJsData(boundSceneDocumentAt(0));
const plan = new RetainedScenePlan(baseScene, samplers);
const registry = new InstanceSourceRegistry();
const batches = new CanvasInstanceBatches(registry);
const instance = baseScene.nodes.find((node) => node.content[0] === "instances").content[1];
registry.register(instance.source, instanceGrid(instance.source.count, 40));
let paintCount = 0;

function paint(_timestamp, reasons, inputs) {
  try {
    for (const amount of inputs) {
      state.input += amount;
      state.versions.input++;
    }
    const update = plan.update(state.time, state.versions, state);
    if (!update.changed) return;
    if (canvas.width !== 320 * state.dpr || canvas.height !== 100 * state.dpr) {
      canvas.width = 320 * state.dpr;
      canvas.height = 100 * state.dpr;
    }
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 320, 100);
    let copied = 0;
    let x;
    plan.forEachNode((node) => {
      const [kind, value] = node.content;
      if (kind === "instances") copied += batches.draw(context, value).positionBytesCopied;
      if (kind === "rect") {
        const { r, g, b, a } = value.fill;
        context.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
        context.fillRect(value.x, value.y, value.width, value.height);
        x = value.x;
      }
    });
    if (x === undefined) throw new Error("缺少绑定矩形");
    const pixel = Array.from(context.getImageData(Math.round((x + 8) * state.dpr), 50 * state.dpr, 1, 1).data).join(",");
    if (pixel !== "234,88,12,255") throw new Error(`绑定中心像素错误：${pixel}`);
    if (state.model === 0 && state.input === 0 && !state.ready && state.viewport === 100) {
      const reference = 80 + 40 * Math.min(Math.max(state.time, 0), 1);
      if (Math.abs(x - reference) > 1e-12) throw new Error("保留帧与独立数学参考不一致");
    }
    paintCount++;
    status.dataset.result = "pass";
    status.textContent = `PASS · t=${state.time}s · x=${x} · dpr=${state.dpr} · paints=${paintCount} · plan=${update.planBuilds} · static=${update.staticSceneCopies} · samples=${update.bindingSamples} · copied=${copied} · inputs=${state.input} · reasons=${reasons.join(",")} · pixel=${pixel}`;
  } catch (error) {
    status.dataset.result = "fail";
    status.textContent = `FAIL · ${error.message}`;
    throw error;
  }
}

const scheduler = new DemandFrameScheduler({
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
  paint,
});
for (const time of [1, 0, 0.5, 0.25]) {
  const button = document.createElement("button");
  button.textContent = `${time}s`;
  button.addEventListener("click", () => { state.time = time; scheduler.request("time"); });
  document.querySelector("#times").append(button);
}
document.querySelector("#model").addEventListener("click", () => { state.model += 5; state.versions.model++; scheduler.request("model"); });
document.querySelector("#resource").addEventListener("click", () => { state.ready = true; state.versions.resources++; scheduler.request("resources"); });
document.querySelector("#viewport").addEventListener("click", () => { state.viewport = 150; state.versions.viewport++; scheduler.request("viewport"); });
document.querySelector("#dpr").addEventListener("click", () => { state.dpr = 2; state.versions.quality++; scheduler.request("quality"); });
document.querySelector("#pause").addEventListener("click", () => scheduler.pause());
document.querySelector("#resume").addEventListener("click", () => scheduler.resume());
document.querySelector("#inputs").addEventListener("click", () => { for (const amount of [1, 2, 3]) scheduler.request("input", amount); });
window.addEventListener("pagehide", () => { scheduler.dispose(); registry.release(instance.source); }, { once: true });
scheduler.request("initial");
