import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { scene_document_at as sceneDocumentAt } from "../js-out/quamolit.test.motion-fixture.mjs";
import { probeWebGpuDevice } from "../webgpu-capabilities.mjs";
import { InstanceSourceRegistry } from "../instance-sources.mjs";
import { CanvasInstanceBatches } from "../canvas-instance-batches.mjs";
import { WebGpuInstanceBatches } from "../webgpu-instance-batches.mjs";
import { WebGpuLayerLease } from "../webgpu-layer-lease.mjs";
import { instanceGrid } from "./instance-grid.mjs";

const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { willReadFrequently: true });
const gpuCanvas = document.querySelector("#gpu-scene");
const status = document.querySelector("#status");
const gpuStatus = document.querySelector("#gpu-status");
const registry = new InstanceSourceRegistry();
const batches = new CanvasInstanceBatches(registry);
const documentAt = (time) => toJsData(sceneDocumentAt(time));
const source = documentAt(0.5).nodes.find((node) => node.content[0] === "instances").content[1].source;
const versions = [source, { ...source, version: source.version + 1 }];
const gpuMode = new URLSearchParams(location.search).get("gpu") ?? "native";
if (!["native", "off"].includes(gpuMode)) throw new RangeError("未知 GPU 模式");
let currentVersion = 1;
const gpuLease = new WebGpuLayerLease({
  probe: probeWebGpuDevice,
  create: (candidate) => WebGpuInstanceBatches.create(gpuCanvas, candidate, registry, source.count),
  onLost(info) {
    gpuCanvas.hidden = true;
    gpuStatus.dataset.result = "fallback";
    gpuStatus.dataset.liveLayers = `${gpuLease.metrics.live}`;
    gpuStatus.textContent = `Canvas 回退：device lost ${info.reason}: ${info.message}`;
    void render(currentVersion).catch(reportError);
  },
});

for (const [index, x] of [40, 60].entries()) {
  const positions = instanceGrid(source.count, x);
  registry.register(versions[index], positions);
  positions[0] = 200; // Mutation without a new version must not affect retained data.
}

function pixelAt(x, y) {
  return Array.from(context.getImageData(x, y, 1, 1).data).join(",");
}

function closeGpu(reason) {
  const cleanup = gpuLease.close();
  gpuCanvas.hidden = true;
  gpuStatus.dataset.result = "fallback";
  gpuStatus.dataset.liveLayers = `${cleanup.live}`;
  gpuStatus.textContent = `Canvas 回退：${reason}${cleanup.errors.length ? `；释放错误：${cleanup.errors.join("; ")}` : ""}`;
}

async function openGpu() {
  if (gpuMode === "off") {
    gpuStatus.dataset.result = "fallback";
    gpuStatus.textContent = "Canvas 回退：GPU 已强制禁用";
    return;
  }
  const result = await gpuLease.open(navigator);
  if (result.kind === "cancelled") return;
  gpuStatus.dataset.liveLayers = `${gpuLease.metrics.live}`;
  if (result.kind === "fallback") {
    gpuStatus.dataset.adapterVendor = result.adapterInfo.vendor ?? "unknown";
    gpuStatus.dataset.adapterFallback = "true";
    gpuStatus.dataset.result = "fallback";
    gpuStatus.textContent = `Canvas 回退：WebGPU 软件 adapter (${gpuStatus.dataset.adapterVendor})`;
    return;
  }
  if (result.kind !== "ready") {
    gpuStatus.dataset.result = result.kind === "failed" ? "failed" : "fallback";
    gpuStatus.textContent = `Canvas 回退：WebGPU ${result.kind}/${result.stage}${result.message ? ` · ${result.message}` : ""}`;
    return;
  }
  const adapterInfo = result.adapterInfo;
  gpuStatus.dataset.adapterFallback = `${adapterInfo.isFallbackAdapter ?? "unknown"}`;
  gpuStatus.dataset.adapterVendor = adapterInfo.vendor ?? "unknown";
  gpuStatus.dataset.adapterDescription = adapterInfo.description ?? "unknown";
  gpuCanvas.hidden = false;
}

function reportError(error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}

async function render(version, time = 0.5) {
  const wire = documentAt(time);
  const instanceNodes = wire.nodes.filter((node) => node.content[0] === "instances");
  if (wire.nodes.length !== 3 || instanceNodes.length !== 1) throw new Error("场景逻辑节点数量错误");
  const instance = instanceNodes[0].content[1];
  const descriptor = { ...instance.source, version };
  const shape = { ...instance, source: descriptor };
  currentVersion = version;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const metrics = batches.draw(context, shape);
  const x = version === 1 ? 40 : 60;
  const active = pixelAt(x, 50);
  const inactive = pixelAt(version === 1 ? 60 : 40, 50);
  const grid = pixelAt(0, 0);
  const gap = pixelAt(2, 0);
  if (active !== "234,88,12,255" || inactive !== "255,255,255,255" || grid !== active || gap !== "255,255,255,255") {
    throw new Error(`版本 ${version} Canvas 像素错误: ${active} / ${inactive}`);
  }
  if (gpuLease.layer && gpuLease.capability?.state === "ready") {
    try {
      const gpuLayer = gpuLease.layer;
      const gpuMetrics = gpuLayer.draw(shape);
      const pixels = await Promise.all([
        gpuLayer.readPixel(x, 50), gpuLayer.readPixel(version === 1 ? 60 : 40, 50),
        gpuLayer.readPixel(0, 0), gpuLayer.readPixel(2, 0),
      ]);
      const actual = pixels.map((pixel) => pixel.join(","));
      if (actual[0] !== active || actual[1] !== inactive || actual[2] !== grid || actual[3] !== gap) {
        throw new Error(`GPU/Canvas 像素不一致：${actual.join(" / ")}`);
      }
      gpuStatus.dataset.result = "ready";
      gpuStatus.dataset.version = `${version}`;
      gpuStatus.dataset.liveLayers = `${gpuLease.metrics.live}`;
      gpuStatus.textContent = `WebGPU PASS · version=${version} · draw=${gpuMetrics.drawCalls} · instances=${gpuMetrics.instances} · upload=${gpuMetrics.positionBytesUploaded} · copied=${gpuMetrics.positionBytesCopied} · pipeline=${gpuMetrics.pipelinesCreated} · buffers=${gpuMetrics.buffersCreated} · pixel=${actual[0]} · adapter=${gpuStatus.dataset.adapterVendor}/${gpuStatus.dataset.adapterFallback}`;
    } catch (error) {
      if (gpuLease.layer) {
        const lost = gpuLease.capability?.state === "lost";
        closeGpu(`${lost ? "device lost" : "WebGPU 绘制失败"}：${error.message}`);
        if (!lost) gpuStatus.dataset.result = "failed";
      }
    }
  }
  status.dataset.result = "pass";
  status.dataset.version = `${version}`;
  status.textContent = `PASS · t=${time}s · version=${version} · nodes=${wire.nodes.length} · instances=${descriptor.count} · ffi=${metrics.frameBoundaryCalls} · copied=${metrics.positionBytesCopied} · canvas=${metrics.canvasCalls} · pixel=${active}`;
}

document.querySelector("#v1").addEventListener("click", () => void render(1).catch(reportError));
document.querySelector("#v2").addEventListener("click", () => void render(2).catch(reportError));
document.querySelector("#disable-gpu").addEventListener("click", () => {
  closeGpu("手动禁用");
  void render(currentVersion).catch(reportError);
});
document.querySelector("#retry-gpu").addEventListener("click", () => {
  void (async () => { await openGpu(); await render(currentVersion); })().catch(reportError);
});
window.addEventListener("pagehide", () => closeGpu("页面关闭"), { once: true });
try {
  await openGpu();
  await render(2);
  await render(1);
} catch (error) { reportError(error); }
