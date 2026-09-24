import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { gpu_vec2_plan as gpuVec2Plan, sample_vec2_at as sampleVec2At, scene_document_at as sceneDocumentAt } from "../js-out/quamolit.test.motion-fixture.mjs";
import { prepareGpuVec2Translation } from "../gpu-vec2-translation.mjs";
import { InstanceSourceRegistry } from "../instance-sources.mjs";
import { CanvasInstanceBatches } from "../canvas-instance-batches.mjs";
import { WebGpuInstanceBatches } from "../webgpu-instance-batches.mjs";
import { instanceGrid } from "./instance-grid.mjs";
import { probeWebGpuDevice } from "../webgpu-capabilities.mjs";

const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { willReadFrequently: true });
const gpuCanvas = document.querySelector("#gpu-scene");
const status = document.querySelector("#status");
const backend = document.querySelector("#backend");
const parameters = new URLSearchParams(location.search);
const mode = parameters.get("gpu") ?? "native";
if (!["native", "off"].includes(mode)) throw new RangeError("未知 GPU 模式");
const motion = prepareGpuVec2Translation(toJsData(gpuVec2Plan()));
if (motion.kind !== "ready") throw new Error(`Vec2 GPU 计划不可用：${motion.reason}`);
const source = toJsData(sceneDocumentAt(0)).nodes.find((node) => node.content[0] === "instances").content[1];
const registry = new InstanceSourceRegistry();
registry.register(source.source, instanceGrid(source.source.count, 40));
const canvasBatches = new CanvasInstanceBatches(registry);
const initialTime = Number(parameters.get("time") ?? 0.5);
let currentTime = initialTime;
let gpuLayer;
let gpuCapability;
let gpuGeneration = 0;
let renderTail = Promise.resolve();

function closeGpu(reason) {
  gpuGeneration++;
  const layer = gpuLayer;
  const capability = gpuCapability;
  gpuLayer = undefined;
  gpuCapability = undefined;
  gpuCanvas.hidden = true;
  let cleanupError;
  try { layer?.dispose(); }
  catch (error) { cleanupError = error.message; }
  try { capability?.release(); }
  catch (error) { cleanupError = cleanupError ? `${cleanupError}; ${error.message}` : error.message; }
  backend.dataset.kind = "fallback";
  backend.textContent = `Canvas 参考：${reason}${cleanupError ? `；释放错误：${cleanupError}` : ""}`;
}

async function openGpu() {
  if (gpuLayer) return;
  if (mode === "off") {
    backend.dataset.kind = "fallback";
    backend.textContent = "Canvas 参考：GPU 已强制禁用";
    return;
  }
  const generation = ++gpuGeneration;
  const candidate = await probeWebGpuDevice(navigator);
  if (generation !== gpuGeneration) {
    if (candidate.kind === "ready") candidate.release();
    return;
  }
  if (candidate.kind !== "ready") {
    backend.dataset.kind = candidate.kind;
    backend.textContent = `Canvas 参考：WebGPU ${candidate.kind}/${candidate.stage}${candidate.message ? `；${candidate.message}` : ""}`;
    return;
  }
  const info = candidate.adapter.info ?? {};
  backend.dataset.adapter = `${info.vendor ?? "unknown"}/${info.isFallbackAdapter ?? "unknown"}`;
  if (info.isFallbackAdapter === true) {
    candidate.release();
    backend.dataset.kind = "fallback";
    backend.textContent = `Canvas 参考：软件 adapter ${backend.dataset.adapter}`;
    return;
  }
  try {
    const layer = await WebGpuInstanceBatches.create(gpuCanvas, candidate, registry, source.source.count);
    if (generation !== gpuGeneration) {
      layer.dispose();
      candidate.release();
      return;
    }
    gpuLayer = layer;
    gpuCapability = candidate;
    gpuCanvas.hidden = false;
    candidate.lost.then((info) => {
      if (generation !== gpuGeneration || gpuLayer !== layer) return;
      closeGpu(`device lost ${info.reason}: ${info.message}`);
      void scheduleRender(currentTime).catch(reportError);
    });
  } catch (error) {
    candidate.release();
    backend.dataset.kind = "failed";
    backend.textContent = `WebGPU 初始化失败：${error.message} → Canvas 参考`;
  }
}

const pixelAt = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data).join(",");
const closeF32 = (actual, expected) => Math.abs(actual - expected) <= 1e-5 + 1e-5 * Math.abs(expected);

async function renderAt(time) {
  if (!Number.isFinite(time)) throw new RangeError("时间必须有限");
  currentTime = time;
  const sampled = toJsData(sampleVec2At(time));
  const translation = motion.at(time);
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
  if (gpuLayer && gpuCapability?.state === "ready") {
    try {
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
      backend.dataset.time = `${time}`;
      backend.dataset.sampleX = `${gpuSample.x}`;
      backend.dataset.sampleY = `${gpuSample.y}`;
      backend.textContent = `WebGPU PASS · t=${time}s · motion=${motion.id}@${motion.version} · draw=${gpuMetrics.drawCalls} · upload=${gpuMetrics.positionBytesUploaded} · copied=${gpuMetrics.positionBytesCopied} · uniform=${gpuMetrics.uniformBytesUploaded} · pipeline=${gpuMetrics.pipelinesCreated} · buffers=${gpuMetrics.buffersCreated} · pixel=${exactPixel ? gpuPixel.join(",") : "numeric-only"} · sample=${gpuSample.x},${gpuSample.y} · adapter=${backend.dataset.adapter}`;
    } catch (error) {
      const lost = gpuCapability?.state === "lost";
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
