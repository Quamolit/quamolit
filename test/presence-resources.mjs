import { init_tags as initTags, to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { instance_presence_document as instanceDocument, instance_presence_reconcile as reconcile } from "../js-out/quamolit.test.motion-fixture.mjs";
import { presence_needs_frame_$q_ as needsFrame, sample_presence as sample, settle_presence as settle, start_presence as start } from "../js-out/quamolit.presence.mjs";
import { InstanceSourceRegistry } from "../instance-sources.mjs";
import { PresenceInstanceResources } from "../presence-resources.mjs";
import { CanvasInstanceBatches } from "../canvas-instance-batches.mjs";
import { WebGpuInstanceBatches } from "../webgpu-instance-batches.mjs";
import { WebGpuLayerLease } from "../webgpu-layer-lease.mjs";
import { instanceGrid } from "./instance-grid.mjs";
import { probeWebGpuDevice } from "../webgpu-capabilities.mjs";

const { model: modelTag } = initTags(["model"]);
const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { willReadFrequently: true });
const gpuCanvas = document.querySelector("#gpu-scene");
const status = document.querySelector("#status");
const backendStatus = document.querySelector("#backend");
const times = [1, 0, 0.875, 0.5, 0.25, 0.75];
const parameters = new URLSearchParams(location.search);
const mode = parameters.get("gpu") ?? "native";
if (!["native", "off", "denied", "ready", "lost"].includes(mode)) throw new RangeError("未知 GPU 探测模式");

// A replay owns only its live resources. The bounded archive is a separate,
// reconstructible input cache, so seeking back after t=1 does not revive a live owner.
const archivedSource = toJsData(instanceDocument(1, true)).nodes[1].content[1].source;
const archiveRegistry = new InstanceSourceRegistry();
archiveRegistry.register(archivedSource, instanceGrid(archivedSource.count, 40));
const initialTime = Number(parameters.get("time") ?? 0.875);
let currentTime = initialTime;
let renderTail = Promise.resolve();
let destroyed = 0;
const testDevice = (lost) => ({ lost, destroy() { destroyed += 1; } });
const testHost = { gpu: {
  getPreferredCanvasFormat: () => "bgra8unorm",
  requestAdapter: async () => ({
    requestDevice: async () => testDevice(mode === "lost" ? Promise.resolve({ reason: "unknown", message: "test-loss" }) : new Promise(() => {})),
  }),
} };
const deniedHost = { gpu: {
  getPreferredCanvasFormat: () => "bgra8unorm",
  requestAdapter: async () => { throw new Error("test-adapter-denied"); },
} };
const gpuLease = new WebGpuLayerLease({
  probe: probeWebGpuDevice,
  create: (candidate) => WebGpuInstanceBatches.create(gpuCanvas, candidate, archiveRegistry, archivedSource.count),
  onLost(info) {
    gpuCanvas.hidden = true;
    backendStatus.dataset.kind = "fallback";
    backendStatus.dataset.liveLayers = `${gpuLease.metrics.live}`;
    backendStatus.textContent = `Canvas 参考：device lost ${info.reason}: ${info.message}`;
    void scheduleRender(currentTime).catch(reportError);
  },
});

function closeGpu(reason) {
  const cleanup = gpuLease.close();
  gpuCanvas.hidden = true;
  backendStatus.dataset.kind = "fallback";
  backendStatus.dataset.liveLayers = `${cleanup.live}`;
  backendStatus.textContent = `Canvas 参考：${reason}${cleanup.errors.length ? `；释放错误：${cleanup.errors.join("; ")}` : ""}`;
}

async function openGpu() {
  if (mode === "off") {
    backendStatus.dataset.kind = "fallback";
    backendStatus.textContent = "Canvas 参考：GPU 已强制禁用";
    return;
  }
  if (mode !== "native") {
    const candidate = await probeWebGpuDevice(mode === "denied" ? deniedHost : testHost);
    backendStatus.dataset.kind = candidate.kind;
    backendStatus.dataset.stage = candidate.stage ?? "";
    if (candidate.kind === "ready") {
      const loss = mode === "lost" ? await candidate.lost : null;
      const beforeRelease = candidate.state;
      candidate.release();
      backendStatus.textContent = `WebGPU test ready → Canvas 参考；state=${beforeRelease}→${candidate.state}；destroyed=${destroyed}${loss ? `；loss=${loss.reason}/${loss.message}` : ""}`;
    } else {
      backendStatus.textContent = `WebGPU ${candidate.kind}/${candidate.stage} → Canvas 参考${candidate.message ? `；${candidate.message}` : ""}`;
    }
    return;
  }
  const result = await gpuLease.open(navigator);
  if (result.kind === "cancelled") return;
  backendStatus.dataset.liveLayers = `${gpuLease.metrics.live}`;
  backendStatus.dataset.kind = result.kind;
  backendStatus.dataset.stage = result.stage ?? "";
  if (result.kind === "fallback") {
    backendStatus.dataset.adapterFallback = "true";
    backendStatus.dataset.adapterVendor = result.adapterInfo.vendor ?? "unknown";
    backendStatus.textContent = `Canvas 参考：WebGPU 软件 adapter (${backendStatus.dataset.adapterVendor})`;
    return;
  }
  if (result.kind !== "ready") {
    backendStatus.textContent = `WebGPU ${result.kind}/${result.stage} → Canvas 参考${result.message ? `；${result.message}` : ""}`;
    return;
  }
  const adapterInfo = result.adapterInfo;
  backendStatus.dataset.adapterFallback = `${adapterInfo.isFallbackAdapter ?? "unknown"}`;
  backendStatus.dataset.adapterVendor = adapterInfo.vendor ?? "unknown";
  gpuCanvas.hidden = false;
}

function replayAt(time) {
  if (!Number.isFinite(time) || time < 0) throw new RangeError("时间必须是非负有限数");
  const registry = new InstanceSourceRegistry();
  const resources = new PresenceInstanceResources(registry);
  const batches = new CanvasInstanceBatches(registry);
  let model = start(instanceDocument(1, false));
  resources.sync(toJsData(model));
  if (time >= 0.25) {
    const positions = instanceGrid(archivedSource.count, 40);
    registry.register(archivedSource, positions);
    model = reconcile(model, 1, 0.25, true).nthAt(0, modelTag);
    resources.sync(toJsData(model));
  }
  if (time >= 0.75) {
    model = reconcile(model, 1, 0.75, false).nthAt(0, modelTag);
    resources.sync(toJsData(model));
  }
  const completed = settle(model, time);
  model = completed.nthAt(0, modelTag);
  resources.sync(toJsData(model));
  return { samples: toJsData(sample(model, time)), registry, batches, released: toJsData(completed).released.length, active: needsFrame(model, time) };
}

const pixelAt = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data);
const samePixel = (actual, expected, tolerance) => actual.every((value, i) => Math.abs(value - expected[i]) <= (i === 3 ? 0 : tolerance));
const pixelText = (pixel) => pixel.join(",");

async function renderAt(time) {
  currentTime = time;
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
  const pixel = pixelAt(40, 50);
  const gridPixel = pixelAt(0, 0);
  const gapPixel = pixelAt(2, 0);
  const white = [255, 255, 255, 255];
  if (!samePixel(gapPixel, white, 0)) throw new Error("可见实例网格间隔像素错误");
  if (instance?.alpha === 1 && !samePixel(gridPixel, pixel, 0)) throw new Error("不透明网格像素错误");
  if (instance?.alpha === 0.5 && (samePixel(gridPixel, pixel, 0) || samePixel(gridPixel, white, 0))) {
    throw new Error("重叠实例的半透明像素错误");
  }
  if (!instance && !samePixel(gridPixel, white, 0)) throw new Error("卸载后仍留下网格像素");
  if (time === 0.5 && pixelText(pixel) !== "234,88,12,255") throw new Error(`进入终点像素错误: ${pixelText(pixel)}`);
  if (time === 1 && (pixelText(pixel) !== "255,255,255,255" || frame.registry.liveCount !== 0 || frame.released !== 1 || frame.active)) {
    throw new Error("退出终点未停帧或未释放资源");
  }
  if (time === 0.875 && (instance?.alpha !== 0.5 || frame.registry.liveCount !== 1)) {
    throw new Error("退出中间帧未保留实例资源");
  }
  if (gpuLease.layer && gpuLease.capability?.state === "ready") {
    try {
      const gpuLayer = gpuLease.layer;
      const metrics = instance ? gpuLayer.draw(instance.entry.node.content[1], instance.alpha) : gpuLayer.clear();
      // Acquire all readbacks before awaiting; they must address the same canvas texture.
      const actual = await Promise.all([
        gpuLayer.readPixel(40, 50), gpuLayer.readPixel(0, 0), gpuLayer.readPixel(2, 0),
      ]);
      const expected = [pixel, gridPixel, gapPixel];
      const tolerance = instance?.alpha === 0.5 ? [1, 2, 0] : [0, 0, 0];
      for (let i = 0; i < actual.length; i++) {
        if (!samePixel(actual[i], expected[i], tolerance[i])) {
          throw new Error(`GPU/Canvas 像素不一致 (${i}): ${pixelText(actual[i])} / ${pixelText(expected[i])}`);
        }
      }
      backendStatus.dataset.kind = "ready";
      backendStatus.dataset.liveLayers = `${gpuLease.metrics.live}`;
      backendStatus.dataset.result = "pass";
      backendStatus.dataset.time = `${time}`;
      backendStatus.textContent = `WebGPU PASS · t=${time}s · alpha=${instance?.alpha ?? "none"} · draw=${metrics.drawCalls} · upload=${metrics.positionBytesUploaded} · copied=${metrics.positionBytesCopied ?? 0} · pipeline=${metrics.pipelinesCreated} · buffers=${metrics.buffersCreated} · pixel=${pixelText(actual[0])} · adapter=${backendStatus.dataset.adapterVendor}/${backendStatus.dataset.adapterFallback}`;
    } catch (error) {
      const lost = gpuLease.capability?.state === "lost";
      closeGpu(`${lost ? "device lost" : "WebGPU 绘制失败"}：${error.message}`);
      if (!lost) backendStatus.dataset.kind = "failed";
    }
  }
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${time}s · alpha=${instance?.alpha ?? "none"} · live=${frame.registry.liveCount} · released=${frame.released} · active=${frame.active} · ffi=${frameBoundaryCalls} · canvas=${canvasCalls} · pixel=${pixelText(pixel)}`;
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
for (const time of times) {
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
window.addEventListener("pagehide", () => closeGpu("页面关闭"), { once: true });
try {
  await openGpu();
  for (const time of times) await scheduleRender(time);
  await scheduleRender(initialTime);
} catch (error) { reportError(error); }
