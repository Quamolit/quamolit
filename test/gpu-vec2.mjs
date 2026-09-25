import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { gpu_translation_plan as gpuTranslationPlan, sample_vec2_at as sampleVec2At, scene_document_at as sceneDocumentAt } from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import { frame_at as gpuTranslationFrameAt, require_ready as requireGpuTranslation } from "../target/js/motion/quamolit.gpu-vec2-translation.mjs";
import { InstanceSourceRegistry } from "../src/host/instance-sources.mjs";
import { CanvasInstanceBatches } from "../src/host/canvas-instance-batches.mjs";
import { WebGpuInstanceBatches } from "../src/host/webgpu-instance-batches.mjs";
import { WebGpuLayerLease } from "../src/host/webgpu-layer-lease.mjs";
import { instanceGrid } from "./instance-grid.mjs";
import { probeWebGpuDevice } from "../src/host/webgpu-capabilities.mjs";

const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { willReadFrequently: true });
const gpuCanvas = document.querySelector("#gpu-scene");
const status = document.querySelector("#status");
const backend = document.querySelector("#backend");
const parameters = new URLSearchParams(location.search);
const mode = parameters.get("gpu") ?? "native";
if (!["native", "off"].includes(mode)) throw new RangeError("未知 GPU 模式");
const prepared = gpuTranslationPlan();
const [motionStatus, motionValue] = toJsData(prepared);
if (motionStatus !== "ready") throw new Error(`Vec2 GPU 计划不可用：${motionValue}`);
const motionPlan = requireGpuTranslation(prepared);
const motion = toJsData(motionPlan);
const source = toJsData(sceneDocumentAt(0)).nodes.find((node) => node.content[0] === "instances").content[1];
const registry = new InstanceSourceRegistry();
registry.register(source.source, instanceGrid(source.source.count, 40));
const canvasBatches = new CanvasInstanceBatches(registry);
const initialTime = Number(parameters.get("time") ?? 0.5);
let currentTime = initialTime;
let renderTail = Promise.resolve();
const gpuLease = new WebGpuLayerLease({
  probe: probeWebGpuDevice,
  create: (candidate) => WebGpuInstanceBatches.create(gpuCanvas, candidate, registry, source.source.count),
  onLost(info) {
    gpuCanvas.hidden = true;
    backend.dataset.kind = "fallback";
    backend.dataset.liveLayers = `${gpuLease.metrics.live}`;
    backend.textContent = `Canvas 参考：device lost ${info.reason}: ${info.message}`;
    void scheduleRender(currentTime).catch(reportError);
  },
});

function closeGpu(reason) {
  const cleanup = gpuLease.close();
  gpuCanvas.hidden = true;
  backend.dataset.kind = "fallback";
  backend.dataset.liveLayers = `${cleanup.live}`;
  backend.textContent = `Canvas 参考：${reason}${cleanup.errors.length ? `；释放错误：${cleanup.errors.join("; ")}` : ""}`;
}

async function openGpu() {
  if (mode === "off") {
    backend.dataset.kind = "fallback";
    backend.textContent = "Canvas 参考：GPU 已强制禁用";
    return;
  }
  const result = await gpuLease.open(navigator);
  if (result.kind === "cancelled") return;
  backend.dataset.liveLayers = `${gpuLease.metrics.live}`;
  if (result.kind === "fallback") {
    backend.dataset.adapter = `${result.adapterInfo.vendor ?? "unknown"}/true`;
    backend.dataset.kind = "fallback";
    backend.textContent = `Canvas 参考：软件 adapter ${backend.dataset.adapter}`;
    return;
  }
  if (result.kind !== "ready") {
    backend.dataset.kind = result.kind;
    backend.textContent = `Canvas 参考：WebGPU ${result.kind}/${result.stage}${result.message ? `；${result.message}` : ""}`;
    return;
  }
  const info = result.adapterInfo;
  backend.dataset.adapter = `${info.vendor ?? "unknown"}/${info.isFallbackAdapter ?? "unknown"}`;
  gpuCanvas.hidden = false;
}

const pixelAt = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data).join(",");
const closeF32 = (actual, expected) => Math.abs(actual - expected) <= 1e-5 + 1e-5 * Math.abs(expected);

async function renderAt(time) {
  if (!Number.isFinite(time)) throw new RangeError("时间必须有限");
  currentTime = time;
  const sampled = toJsData(sampleVec2At(time));
  const translation = toJsData(gpuTranslationFrameAt(motionPlan, time));
  const progress = translation.duration === 0 ? Number(time >= translation.start)
    : Math.min(Math.max((time - translation.start) / translation.duration, 0), 1);
  const expectedX = translation.from.x + (translation.to.x - translation.from.x) * progress;
  const expectedY = translation.from.y + (translation.to.y - translation.from.y) * progress;
  if (Math.abs(sampled.x - expectedX) > 1e-12 || Math.abs(sampled.y - expectedY) > 1e-12) {
    throw new Error("Calcit CPU 与计划参数不一致");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(sampled.x, sampled.y);
  const canvasMetrics = canvasBatches.draw(context, source);
  context.restore();
  const anchorX = 40 + Math.round(sampled.x);
  const anchorY = 50 + Math.round(sampled.y);
  const exactPixel = Number.isInteger(sampled.x) && Number.isInteger(sampled.y);
  const pixel = pixelAt(anchorX, anchorY);
  const gap = pixelAt(40, 50);
  if ((exactPixel && pixel !== "234,88,12,255") || gap !== "255,255,255,255") {
    throw new Error(`Canvas Vec2 帧像素错误：${pixel}/${gap}`);
  }
  if (gpuLease.layer && gpuLease.capability?.state === "ready") {
    try {
      const gpuLayer = gpuLease.layer;
      const gpuMetrics = gpuLayer.draw(source, 1, translation);
      const [gpuSample, gpuPixel, gpuGap] = await Promise.all([
        gpuLayer.readTranslation(),
        ...(exactPixel ? [gpuLayer.readPixel(anchorX, anchorY), gpuLayer.readPixel(40, 50)] : []),
      ]);
      if (!closeF32(gpuSample.x, sampled.x) || !closeF32(gpuSample.y, sampled.y)) {
        throw new Error(`GPU/Calcit f32 位移不一致：${gpuSample.x},${gpuSample.y} vs ${sampled.x},${sampled.y}`);
      }
      if (exactPixel && (gpuPixel.join(",") !== pixel || gpuGap.join(",") !== gap)) {
        throw new Error(`GPU/Canvas 像素不一致：${gpuPixel}/${gpuGap} vs ${pixel}/${gap}`);
      }
      backend.dataset.kind = "ready";
      backend.dataset.liveLayers = `${gpuLease.metrics.live}`;
      backend.dataset.time = `${time}`;
      backend.dataset.sampleX = `${gpuSample.x}`;
      backend.dataset.sampleY = `${gpuSample.y}`;
      backend.textContent = `WebGPU PASS · t=${time}s · motion=${motion.id}@${motion.version} · draw=${gpuMetrics.drawCalls} · upload=${gpuMetrics.positionBytesUploaded} · copied=${gpuMetrics.positionBytesCopied} · uniform=${gpuMetrics.uniformBytesUploaded} · pipeline=${gpuMetrics.pipelinesCreated} · buffers=${gpuMetrics.buffersCreated} · pixel=${exactPixel ? gpuPixel.join(",") : "numeric-only"} · sample=${gpuSample.x},${gpuSample.y} · adapter=${backend.dataset.adapter}`;
    } catch (error) {
      const lost = gpuLease.capability?.state === "lost";
      closeGpu(`${lost ? "device lost" : "WebGPU 绘制失败"}：${error.message}`);
      if (!lost) backend.dataset.kind = "failed";
    }
  }
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${time}s · x=${sampled.x} · y=${sampled.y} · instances=${source.source.count} · canvas=${canvasMetrics.canvasCalls} · copied=${canvasMetrics.positionBytesCopied} · pixel=${exactPixel ? pixel : "numeric-only"}`;
}

function scheduleRender(time) {
  renderTail = renderTail.catch(() => {}).then(() => renderAt(time));
  return renderTail;
}
function reportError(error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
for (const time of [0, 0.25, 0.37, 0.5, 0.75, 0.81, 1]) {
  const button = document.createElement("button");
  button.textContent = `${time}s`;
  button.addEventListener("click", () => void scheduleRender(time).catch(reportError));
  document.querySelector("#times").append(button);
}
document.querySelector("#disable-gpu").addEventListener("click", () => {
  closeGpu("手动禁用");
  void scheduleRender(currentTime).catch(reportError);
});
document.querySelector("#retry-gpu").addEventListener("click", () => {
  void (async () => { await openGpu(); await scheduleRender(currentTime); })().catch(reportError);
});
window.addEventListener("pagehide", () => { closeGpu("页面关闭"); registry.release(source.source); }, { once: true });
try {
  await openGpu();
  for (const time of [1, 0, 0.75, 0.25, 0.5]) await scheduleRender(time);
  await scheduleRender(initialTime);
} catch (error) { reportError(error); }
