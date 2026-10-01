// 页面胶水只导入本应用的编译产物，不导入框架内部 JS 或测试夹具。
import {
  start,
  update_plan,
  start_dual,
  update_dual,
  draw_$x_,
  instances_declaration,
  browser_available_$q_,
  create_instances_table_$x_,
  register_instances_$x_,
  register_instances_version_$x_,
  independent_instance_motions,
  independent_instance_positions,
  patch_instances_$x_,
  release_instances_$x_,
  draw_resolved_instances_$x_,
  instance_frame_at,
  instances_live_count,
  create_instances_gpu_$x_,
  draw_instances_gpu_$x_,
  dispose_instances_gpu_$x_,
  presence_initial,
  presence_reconcile,
  presence_settle,
  presence_sample,
  presence_needs_frame_$q_,
  presence_plan,
  presence_update_plan,
  gpu_recovery_initial,
  gpu_recovery_open,
  gpu_recovery_probe_ready,
  gpu_recovery_probe_fallback,
  gpu_recovery_probe_failed,
  gpu_recovery_create_ready,
  gpu_recovery_create_failed,
  gpu_recovery_update_version,
  gpu_recovery_lost,
  gpu_recovery_close,
} from "./target/js/app/app.main.mjs";
import { init_tags, to_js_data } from "./target/js/app/calcit.core.mjs";
import { createInstancePositions } from "./instances-input.mjs";

const tags = init_tags([
  "declarations",
  "plan-builds",
  "binding-samples",
  "transform-samples",
  "transforms",
  "scene",
  "model",
  "released",
  "state",
  "actions",
]);
let canvas = document.querySelector("canvas");
let context = canvas.getContext("2d");
let canvasKind = "canvas",
  gpuState = null,
  resizeObserver;
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
let time = 0,
  model = 40,
  ready = false,
  viewport = 100;
const requestedMode = new URLSearchParams(location.search).get("motion");
let mode = ["mixed", "dual", "presence", "instances", "instances-gpu"].includes(requestedMode)
  ? requestedMode
  : "mixed";
if (mode === "instances-gpu") mode = "instances";
let presenceModel = presence_initial(),
  presenceVersion = 1,
  presencePhase = "full",
  presenceReleased = [];
let plan =
  mode === "presence"
    ? presence_plan(presenceModel, time, presenceVersion)
    : (mode === "dual" ? start_dual : start)(time, model, ready, viewport);
// Float32Array 是宿主提供的数据源；实例声明与实际 Canvas 绘制都走消费者的 Calcit 公共入口。
const instanceCount = to_js_data(instances_declaration()).source.count;
const positions = createInstancePositions(instanceCount);
const instanceTable = create_instances_table_$x_();
register_instances_$x_(instanceTable, positions);
let instanceVersion = 1,
  instanceTime = 0,
  instanceCopiedBytes = positions.byteLength;
let instanceMetrics = null;
let gpuRecoveryState = gpu_recovery_initial(instanceVersion);
const gpuResources = new Map();
let gpuReleaseWarning = "";
let independent = new URLSearchParams(location.search).get("independent") === "1";
let independentMotions = null;
function updateInstanceTime(nextTime, force = false) {
  if (nextTime === instanceTime && !force) return;
  const frame = instance_frame_at(nextTime);
  const values = to_js_data(frame);
  const previous = instanceVersion;
  const next = previous + 1;
  if (independent || force) {
    let snapshot;
    if (independent) {
      independentMotions ??= independent_instance_motions();
      snapshot = new Float32Array(to_js_data(independent_instance_positions(independentMotions, nextTime)));
    } else {
      snapshot = createInstancePositions(instanceCount);
      snapshot[values.index * 2] = values.x;
      snapshot[values.index * 2 + 1] = values.y;
    }
    register_instances_version_$x_(instanceTable, next, snapshot);
    instanceCopiedBytes = snapshot.byteLength;
  } else instanceCopiedBytes = patch_instances_$x_(
    instanceTable,
    previous,
    next,
    frame,
    new Float32Array([values.x, values.y]),
  );
  release_instances_$x_(instanceTable, previous);
  instanceVersion = next;
  instanceTime = nextTime;
  gpuRecoveryState = gpu_recovery_update_version(gpuRecoveryState, instanceVersion);
}
function snapshot() {
  if (mode === "instances" || mode === "instances-gpu")
    return {
      time,
      model,
      ready,
      viewport,
      mode,
      pattern: independent ? "independent" : "single-dirty",
      browser: browser_available_$q_(),
      source: {
        count: instanceCount,
        positionBytes: positions.byteLength,
        version: instanceVersion,
        copiedBytes: instanceCopiedBytes,
        live: instances_live_count(instanceTable),
      },
      metrics: instanceMetrics,
      adapter: gpuState?.adapter ?? null,
      recovery: to_js_data(gpuRecoveryState),
      gpuResources: gpuResources.size,
    };
  if (mode === "presence")
    return {
      time,
      mode,
      phase: presencePhase,
      version: presenceVersion,
      released: presenceReleased,
      needsFrame: presence_needs_frame_$q_(presenceModel, time),
      samples: to_js_data(presence_sample(presenceModel, time)),
      browser: browser_available_$q_(),
    };
  return {
    time,
    model,
    ready,
    viewport,
    mode,
    browser: browser_available_$q_(),
    declarations: plan.get(tags.declarations),
    builds: plan.get(tags["plan-builds"]),
    samples: plan.get(tags["binding-samples"]),
    transformSamples: plan.get(tags["transform-samples"]),
    transforms: to_js_data(plan.get(tags.transforms)),
    scene: to_js_data(plan.get(tags.scene)),
  };
}
function show() {
  document.querySelector("#independent").disabled = !mode.startsWith("instances");
  document
    .querySelectorAll("[data-mode]")
    .forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
  document.querySelectorAll("#model, #ready, #viewport").forEach((button) => {
    button.disabled = mode.startsWith("instances") || mode === "presence";
  });
  document.querySelectorAll("[data-presence]").forEach((button) => {
    button.disabled = mode !== "presence";
  });
  if (fullscreen && canvasKind === "canvas") {
    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(width * dpr)),
      h = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, w, h);
    // contain 是此最小消费者的展示策略，不是框架的响应式布局 API。
    const scale = Math.min(w / 320, h / 180);
    context.setTransform(scale, 0, 0, scale, (w - 320 * scale) / 2, (h - 180 * scale) / 2);
  }
  if (mode === "instances-gpu" && gpuState) {
    instanceMetrics = to_js_data(
      draw_instances_gpu_$x_(gpuState.previousVersion, gpuState.batch, instanceTable, instanceVersion),
    );
    gpuState.previousVersion = instanceVersion;
  } else if (mode.startsWith("instances")) {
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
  if (mode === "presence") {
    if (next.time !== undefined) time = next.time;
    plan = presence_update_plan(plan, presenceModel, time, presenceVersion);
    return show();
  }
  const request = { time, model, ready, viewport, ...next };
  const updated = (mode === "dual" ? update_dual : update_plan)(
    plan,
    request.time,
    request.model,
    request.ready,
    request.viewport,
  );
  ({ time, model, ready, viewport } = request);
  plan = updated;
  return show();
}
function replaceCanvas(kind) {
  if (kind === canvasKind) return;
  const replacement = document.createElement("canvas");
  replacement.id = canvas.id;
  replacement.width = 320;
  replacement.height = 180;
  replacement.setAttribute("aria-label", canvas.getAttribute("aria-label"));
  resizeObserver?.unobserve(canvas);
  canvas.replaceWith(replacement);
  canvas = replacement;
  resizeObserver?.observe(canvas);
  canvasKind = kind;
  context = kind === "canvas" ? canvas.getContext("2d") : null;
}
function releaseGpuGeneration(generation) {
  const resource = gpuResources.get(generation);
  if (!resource) return [];
  const errors = [];
  try {
    if (resource.batch) dispose_instances_gpu_$x_(resource.batch);
  } catch (error) {
    errors.push(error);
  }
  try {
    resource.device?.destroy();
  } catch (error) {
    errors.push(error);
  }
  gpuResources.delete(generation);
  if (gpuState?.generation === generation) gpuState = null;
  document.querySelector("#gpu-loss").disabled = true;
  return errors;
}
async function executeGpuRecoveryActions(actions) {
  for (const [kind, generation, detail] of actions) {
    if (kind === "release") {
      const errors = releaseGpuGeneration(generation);
      if (errors.length > 0)
        gpuReleaseWarning = `；generation ${generation} 释放异常：${errors.map((error) => error.message).join("；")}`;
      continue;
    }
    if (kind === "show-fallback" || kind === "show-failure") {
      replaceCanvas("canvas");
      document.querySelector("#gpu-note").textContent =
        `${kind === "show-fallback" ? "GPU 回退" : "GPU 失败"}：${detail}${gpuReleaseWarning}`;
      if (mode.startsWith("instances")) show();
      continue;
    }
    if (kind === "probe") {
      try {
        if (!navigator.gpu) throw Error("此浏览器没有 WebGPU");
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw Error("未取得 WebGPU adapter");
        if (adapter.info?.isFallbackAdapter === true) {
          await commitGpuRecovery(gpu_recovery_probe_fallback(gpuRecoveryState, generation, "software adapter"));
          continue;
        }
        const device = await adapter.requestDevice();
        gpuResources.set(generation, { generation, version: detail, adapter, device, batch: null });
        await commitGpuRecovery(gpu_recovery_probe_ready(gpuRecoveryState, generation));
      } catch (error) {
        await commitGpuRecovery(gpu_recovery_probe_failed(gpuRecoveryState, generation, error.message));
      }
      continue;
    }
    if (kind === "create") {
      const resource = gpuResources.get(generation);
      try {
        if (!resource) throw Error("GPU candidate 已失效");
        replaceCanvas("gpu");
        resource.batch = await create_instances_gpu_$x_(
          canvas,
          resource.device,
          navigator.gpu.getPreferredCanvasFormat(),
        );
        await commitGpuRecovery(gpu_recovery_create_ready(gpuRecoveryState, generation));
      } catch (error) {
        await commitGpuRecovery(gpu_recovery_create_failed(gpuRecoveryState, generation, error.message));
      }
      continue;
    }
    if (kind === "install") {
      const resource = gpuResources.get(generation);
      if (!resource?.batch) throw Error("GPU install 缺少已创建图层");
      gpuState = {
        generation,
        device: resource.device,
        batch: resource.batch,
        previousVersion: -1,
        adapter: resource.adapter.info?.architecture ?? "unknown",
      };
      document.querySelector("#gpu-loss").disabled = false;
      document.querySelector("#gpu-note").textContent =
        `GPU generation ${generation} ready · source v${detail}${gpuReleaseWarning}`;
      Promise.resolve(resource.device.lost).then((info) => {
        void commitGpuRecovery(
          gpu_recovery_lost(
            gpuRecoveryState,
            generation,
            `${info.reason ?? "unknown"}: ${info.message ?? "device lost"}`,
          ),
        );
      });
      if (mode === "instances-gpu") show();
    }
  }
}
async function commitGpuRecovery(transition) {
  gpuRecoveryState = transition.get(tags.state);
  return executeGpuRecoveryActions(to_js_data(transition.get(tags.actions)));
}
function disposeGpu() {
  void commitGpuRecovery(gpu_recovery_close(gpuRecoveryState));
}
async function setMode(next) {
  if (!["mixed", "dual", "presence", "instances", "instances-gpu"].includes(next)) throw Error("unknown-consumer-mode");
  // 更换声明时建立新计划，不能让相同版本错误复用另一个声明的结构。
  const nextPlan = next.startsWith("instances")
    ? plan
    : next === "presence"
      ? presence_plan(presenceModel, time, presenceVersion)
      : (next === "dual" ? start_dual : start)(time, model, ready, viewport);
  if (next !== "instances-gpu") disposeGpu();
  mode = next;
  plan = nextPlan;
  if (mode.startsWith("instances")) updateInstanceTime(time);
  if (next === "instances-gpu") {
    await commitGpuRecovery(gpu_recovery_open(gpuRecoveryState, instanceVersion));
    // install / fallback 动作已绘制这一帧；不能再 show() 覆盖首次上传计数。
    return snapshot();
  } else replaceCanvas("canvas");
  return show();
}
function setPresence(nextPhase) {
  if (mode !== "presence") throw Error("presence-mode-required");
  const update =
    nextPhase === "settle" ? presence_settle(presenceModel, time) : presence_reconcile(presenceModel, nextPhase, time);
  presenceModel = update.get(tags.model);
  presenceReleased = to_js_data(update.get(tags.released));
  if (nextPhase !== "settle") presencePhase = nextPhase;
  presenceVersion += 1;
  plan = presence_plan(presenceModel, time, presenceVersion);
  return show();
}
document.querySelectorAll("[data-mode]").forEach(
  (button) =>
    (button.onclick = () => {
      void setMode(button.dataset.mode);
    }),
);
document
  .querySelectorAll("[data-time]")
  .forEach((button) => (button.onclick = () => set({ time: Number(button.dataset.time) })));
document
  .querySelectorAll("[data-presence]")
  .forEach((button) => (button.onclick = () => setPresence(button.dataset.presence)));
document.querySelector("#model").onclick = () => set({ model: model + 1 });
document.querySelector("#ready").onclick = () => set({ ready: !ready });
document.querySelector("#viewport").onclick = () => set({ viewport: viewport + 100 });
function simulateGpuLoss(message = "simulated device loss") {
  if (!gpuState) throw Error("gpu-generation-not-ready");
  return commitGpuRecovery(gpu_recovery_lost(gpuRecoveryState, gpuState.generation, message));
}
function setInstancePattern(value) {
  independent = Boolean(value);
  document.querySelector("#independent").checked = independent;
  if (mode.startsWith("instances")) updateInstanceTime(time, true);
  return show();
}
window.consumer = { set, snapshot, setMode, setPresence, simulateGpuLoss, setInstancePattern };
document.querySelector("#independent").checked = independent;
document.querySelector("#independent").onchange = (event) => setInstancePattern(event.target.checked);
document.querySelector("#gpu-loss").onclick = () => void simulateGpuLoss("用户模拟 device loss");
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
