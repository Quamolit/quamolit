import { init_tags as initTags, to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { instance_presence_document as instanceDocument, instance_presence_reconcile as reconcile } from "../js-out/quamolit.test.motion-fixture.mjs";
import { presence_needs_frame_$q_ as needsFrame, sample_presence as sample, settle_presence as settle, start_presence as start } from "../js-out/quamolit.presence.mjs";
import { InstanceSourceRegistry } from "../instance-sources.mjs";
import { PresenceInstanceResources } from "../presence-resources.mjs";
import { CanvasInstanceBatches } from "../canvas-instance-batches.mjs";
import { instanceGrid } from "./instance-grid.mjs";

const { model: modelTag } = initTags(["model"]);
const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const times = [1, 0, 0.875, 0.5, 0.25, 0.75];

function replayAt(time) {
  if (!Number.isFinite(time) || time < 0) throw new RangeError("时间必须是非负有限数");
  const registry = new InstanceSourceRegistry();
  const resources = new PresenceInstanceResources(registry);
  const batches = new CanvasInstanceBatches(registry);
  let model = start(instanceDocument(1, false));
  resources.sync(toJsData(model));
  if (time >= 0.25) {
    const source = toJsData(instanceDocument(1, true)).nodes[1].content[1].source;
    const positions = instanceGrid(source.count, 40);
    registry.register(source, positions);
    model = reconcile(model, 1, 0.25, true).nthAt(0, modelTag);
    resources.sync(toJsData(model));
  }
  if (time >= 0.75) {
    model = reconcile(model, 1, 0.75, false).nthAt(0, modelTag);
    resources.sync(toJsData(model));
  }
  const completed = settle(model, time);
  model = completed.nthAt(0, modelTag);
  const ownership = resources.sync(toJsData(model));
  return { samples: toJsData(sample(model, time)), registry, batches, ownership, released: toJsData(completed).released.length, active: needsFrame(model, time) };
}

function renderAt(time) {
  const frame = replayAt(time);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  let frameBoundaryCalls = 0;
  let canvasCalls = 0;
  for (const entry of frame.samples) {
    const [kind, shape] = entry.entry.node.content;
    if (kind !== "instances") continue;
    const metrics = frame.batches.draw(context, shape, entry.alpha);
    frameBoundaryCalls += metrics.frameBoundaryCalls;
    canvasCalls += metrics.canvasCalls;
  }
  const instance = frame.samples.find((entry) => entry.entry.node.content[0] === "instances");
  const pixel = Array.from(context.getImageData(40, 50, 1, 1).data).join(",");
  const gridPixel = Array.from(context.getImageData(0, 0, 1, 1).data).join(",");
  const gapPixel = Array.from(context.getImageData(2, 0, 1, 1).data).join(",");
  if (gapPixel !== "255,255,255,255") throw new Error("可见实例网格间隔像素错误");
  if (instance?.alpha === 1 && gridPixel !== pixel) throw new Error("不透明网格像素错误");
  if (instance?.alpha === 0.5 && (gridPixel === pixel || gridPixel === "255,255,255,255")) {
    throw new Error("重叠实例的半透明像素错误");
  }
  if (!instance && gridPixel !== "255,255,255,255") throw new Error("卸载后仍留下网格像素");
  if (time === 0.5 && pixel !== "234,88,12,255") throw new Error(`进入终点像素错误: ${pixel}`);
  if (time === 1 && (pixel !== "255,255,255,255" || frame.registry.liveCount !== 0 || frame.released !== 1 || frame.active)) {
    throw new Error("退出终点未停帧或未释放资源");
  }
  if (time === 0.875 && (instance?.alpha !== 0.5 || frame.registry.liveCount !== 1)) {
    throw new Error("退出中间帧未保留实例资源");
  }
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${time}s · alpha=${instance?.alpha ?? "none"} · live=${frame.registry.liveCount} · released=${frame.released} · active=${frame.active} · ffi=${frameBoundaryCalls} · canvas=${canvasCalls} · pixel=${pixel}`;
}

for (const time of times) {
  const button = document.createElement("button");
  button.textContent = `${time}s`;
  button.addEventListener("click", () => renderAt(time));
  document.querySelector("#times").append(button);
}
try {
  for (const time of times) renderAt(time);
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.875));
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
