// 页面只保留 URL、视口和宿主时间；图片队列、句柄所有权、状态、几何与绘制调用均来自 Calcit。
import {
  initial,
  empty_events,
  append_event,
  branch_toggle,
  replay,
  fold_value,
  slices_at,
  draw_$x_,
  resource_initial,
  scene_at,
} from "../../target/js/folding-fan/quamolit.examples.folding-fan.mjs";
import * as gpuImages from "../../target/js/folding-fan/quamolit.webgpu-images.mjs";
import * as textures from "../../target/js/folding-fan/quamolit.webgpu-texture-runner.mjs";
import { Matrix2D } from "../../target/js/folding-fan/quamolit.scene-ir.mjs";
import { ColorRgba } from "../../target/js/folding-fan/quamolit.motion.mjs";
import { _$n__PCT__$M_ as struct } from "../../target/js/folding-fan/calcit.core.mjs";
import {
  image_resource,
  request_resource,
  close_resource,
} from "../../target/js/folding-fan/quamolit.resource-lifecycle.mjs";
import {
  apply_image_actions,
  complete_image_load,
  enqueue_image_actions,
  image_descriptor,
  image_resource_metrics,
  initial_image_resource_host,
  installed_image,
  run_image_load_task_$x_,
} from "../../target/js/folding-fan/quamolit.image-resource-runner.mjs";
import {
  cancel_stale_device_loads,
  initial_load_queue,
  load_queue_metrics,
  take_load,
} from "../../target/js/folding-fan/quamolit.resource-load-queue.mjs";
import { init_tags, option_$o_unwrap, to_js_data } from "../../target/js/folding-fan/calcit.core.mjs";
export function mountDemo() {
  const canvas = document.querySelector("canvas"),
    context = canvas.getContext("2d");
  const status = document.querySelector("#status"),
    message = document.querySelector("#message"),
    slider = document.querySelector("#time");
  const play = document.querySelector("#play"),
    panel = document.querySelector("#panel"),
    panelToggle = document.querySelector("#panel-toggle");
  const params = new URLSearchParams(location.search);
  const backendControl = document.querySelector("#backend");
  const gpuTags = init_tags(["a", "b", "c", "d", "e", "f", "r", "g"]);
  const record = (type, fields) =>
    struct(type, ...Object.entries(fields).flatMap(([key, value]) => [gpuTags[key], value]));
  const background = record(ColorRgba, { r: 23 / 255, g: 16 / 255, b: 34 / 255, a: 1 });
  let gpu = null,
    gpuEpoch = 0,
    backend = "canvas",
    gpuError = "",
    gpuMetrics = null;
  const parsed = Number(params.get("t") || 0);
  let time = Number.isFinite(parsed) && parsed >= 0 && parsed <= 120 ? parsed : 0;
  let model = initial(),
    events = empty_events(),
    error = "",
    resourceError = "",
    playing = false,
    raf = null,
    anchor = 0,
    started = 0,
    until = 120,
    paints = 0;
  let resourceState = resource_initial(),
    imageHost = initial_image_resource_host(),
    loadQueue = initial_load_queue(1, 4),
    runtimeGeneration = 1,
    pumpPromise = null,
    autoPlayed = false;
  const resourceTags = init_tags(["actions", "backpressured", "host", "queue", "state", "task", "transition"]);
  const eventTimes = (params.get("events") || "").split(",").filter(Boolean).map(Number);
  try {
    for (const at of eventTimes) events = append_event(events, at);
  } catch (cause) {
    events = empty_events();
    error = `输入日志无效：${cause.message || cause}`;
  }
  model = replay(events, time);
  function draw() {
    const resource = to_js_data(resourceState).phase[0];
    const rect = canvas.getBoundingClientRect(),
      dpr = devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr)),
      height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#171022";
    context.fillRect(0, 0, width, height);
    if (resource === "ready") {
      const image = option_$o_unwrap(installed_image(imageHost));
      const scale = Math.min(width / 900, height / 650);
      context.setTransform(scale, 0, 0, scale, width / 2, height * 0.77);
      draw_$x_(context, image, model, time);
    }
    if (gpu) {
      if (gpu.canvas.width !== width) gpu.canvas.width = width;
      if (gpu.canvas.height !== height) gpu.canvas.height = height;
      const scale = Math.min(width / 900, height / 650);
      const view = record(Matrix2D, { a: scale, b: 0, c: 0, d: scale, e: width / 2, f: height * 0.77 });
      gpuMetrics = to_js_data(
        gpuImages.draw_runtime_$x_(gpu.runtime, scene_at(model, time), view, width, height, background),
      );
    }
    paints++;
    const hostMetrics = to_js_data(image_resource_metrics(imageHost));
    const queueMetrics = to_js_data(load_queue_metrics(loadQueue));
    slider.value = String(time);
    status.textContent = `t = ${time.toFixed(2)} s · 切片 24\n开合 ${fold_value(model, time).toFixed(3)} · 图片 ${resource} · host ${hostMetrics.live}/${hostMetrics.created}/${hostMetrics.released} · queue ${queueMetrics.pending}/${queueMetrics.running} · 绘制 ${paints}`;
    status.dataset.result = resource === "ready" ? "pass" : resource;
    status.textContent += `\n后端 ${backend}${gpuMetrics ? ` · GPU draws ${gpuMetrics["draw-calls"]} · uniform ${gpuMetrics["uniform-bytes-uploaded"]} B` : ""}`;
    message.textContent = [error, resourceError, gpuError].filter(Boolean).join("；");
  }
  function sample(value) {
    if (!Number.isFinite(value) || value < 0 || value > 120) throw new RangeError("演示时间必须在 0–120 秒内");
    time = value;
    model = replay(events, time);
    draw();
  }
  function stop() {
    playing = false;
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    play.textContent = "播放时间";
  }
  function tick(now) {
    if (!playing) return;
    const next = anchor + Math.max(0, now - started) / 1000;
    sample(Math.min(until, next));
    if (next >= until) stop();
    else raf = requestAnimationFrame(tick);
  }
  function start(limit = 120) {
    if (playing) return;
    if (time >= 120) {
      events = empty_events();
      sample(0);
    }
    anchor = time;
    started = performance.now();
    until = Math.min(120, limit);
    playing = true;
    play.textContent = "暂停时间";
    raf = requestAnimationFrame(tick);
  }
  function snapshot() {
    const resource = to_js_data(resourceState).phase[0];
    return {
      time,
      model: to_js_data(model),
      events: to_js_data(events),
      foldValue: fold_value(model, time),
      slices: to_js_data(slices_at(model, time)),
      resource,
      resourceState: to_js_data(resourceState),
      imageMetrics: to_js_data(image_resource_metrics(imageHost)),
      loadQueue: to_js_data(load_queue_metrics(loadQueue)),
      error: [error, resourceError, gpuError].filter(Boolean).join("；"),
      playing,
      paints,
      backend,
      gpuMetrics,
      width: canvas.width,
      height: canvas.height,
    };
  }
  function seek(value) {
    stop();
    sample(value);
    return snapshot();
  }
  function reset() {
    stop();
    events = empty_events();
    sample(0);
    return snapshot();
  }
  function clickToggle(at = time) {
    stop();
    events = branch_toggle(events, at);
    sample(at);
    return snapshot();
  }
  document.querySelector("#toggle-fold").onclick = () => {
    try {
      clickToggle();
      start(time + 0.36);
    } catch (cause) {
      message.textContent = String(cause).includes("fan-log-capacity")
        ? "输入日志已满 100 条；请重置或回到历史时间创建分支。"
        : String(cause);
    }
  };
  play.onclick = () => (playing ? stop() : start());
  document.querySelector("#reset").onclick = reset;
  document.querySelector("#share").onclick = async () => {
    const url = new URL(location.href);
    url.searchParams.set("t", String(time));
    const recorded = to_js_data(events).map((event) => event.at);
    if (recorded.length) url.searchParams.set("events", recorded.join(","));
    else url.searchParams.delete("events");
    history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url.href);
    } catch {
      /* URL 已更新。 */
    }
  };
  slider.oninput = () => seek(Number(slider.value));
  document
    .querySelectorAll("[data-time]")
    .forEach((button) => (button.onclick = () => seek(Number(button.dataset.time))));
  panelToggle.onclick = () => {
    panel.hidden = !panel.hidden;
    panelToggle.setAttribute("aria-expanded", String(!panel.hidden));
    panelToggle.textContent = panel.hidden ? "展开面板" : "收起面板";
  };
  const observer = new ResizeObserver(draw);
  observer.observe(canvas);
  let resolution;
  function watchDpr() {
    resolution?.removeEventListener("change", watchDpr);
    resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`);
    resolution.addEventListener("change", watchDpr);
    draw();
  }
  watchDpr();
  const listeners = new AbortController();
  async function closeGpu(state) {
    if (!state) return;
    state.canvas?.remove();
    await state.device?.queue.onSubmittedWorkDone().catch(() => {});
    if (state.runtime) gpuImages.close_runtime_$x_(state.runtime);
    state.device?.destroy();
  }
  async function selectBackend(value) {
    const epoch = ++gpuEpoch;
    const previous = gpu;
    gpu = null;
    backend = "canvas";
    gpuMetrics = null;
    canvas.style.opacity = "1";
    void closeGpu(previous);
    gpuError = "";
    if (value !== "webgpu") {
      draw();
      return snapshot();
    }
    const state = {};
    try {
      const adapter = await navigator.gpu?.requestAdapter();
      if (!adapter) throw new Error("WebGPU adapter 不可用");
      if (
        adapter.info?.isFallbackAdapter ||
        adapter.isFallbackAdapter ||
        /swiftshader|software|llvmpipe/i.test(
          `${adapter.info?.vendor} ${adapter.info?.architecture} ${adapter.info?.description}`,
        )
      ) {
        throw new Error("软件 GPU 不启用图片实验路径，请使用 Canvas 参考");
      }
      state.device = await adapter.requestDevice();
      const descriptor = textures.texture_descriptor(
        "lotus",
        1,
        new URL("../../assets/lotus.jpg", import.meta.url).href,
        650,
        432,
        "rgba8unorm",
      );
      state.canvas = canvas.cloneNode(false);
      state.canvas.id = "scene-gpu";
      state.canvas.style.pointerEvents = "none";
      state.runtime = await gpuImages.open_runtime_$x_(
        state.canvas,
        state.device,
        navigator.gpu.getPreferredCanvasFormat(),
        descriptor,
        epoch,
        24,
      );
      if (epoch !== gpuEpoch) {
        await closeGpu(state);
        return snapshot();
      }
      canvas.after(state.canvas);
      gpu = state;
      backend = "webgpu";
      canvas.style.opacity = "0";
      state.device.lost.then(() => {
        if (gpu === state) {
          void selectBackend("canvas");
          gpuError = "GPU 设备丢失，已回退 Canvas；可再次选择 WebGPU 重建。";
          backendControl.value = "canvas";
          draw();
        }
      });
      draw();
    } catch (cause) {
      await closeGpu(state);
      if (epoch === gpuEpoch) {
        gpu = null;
        canvas.style.opacity = "1";
        backendControl.value = "canvas";
        gpuError = `WebGPU 初始化失败，已回退 Canvas：${cause.message || cause}`;
        draw();
      }
    }
    return snapshot();
  }
  backendControl.onchange = () => void selectBackend(backendControl.value);
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) stop();
    },
    { signal: listeners.signal },
  );
  window.addEventListener("pagehide", stop, { signal: listeners.signal });
  async function executeResourceActions(actions) {
    let shouldPump = false;
    for (const [kind, generation, detail] of actions) {
      if (kind === "release") continue;
      if (kind === "show-error") {
        resourceError = `图片加载失败：${detail}`;
        continue;
      }
      if (kind === "install") {
        resourceError = "";
        continue;
      }
      if (kind === "wake-frame") {
        draw();
        if (
          !autoPlayed &&
          to_js_data(resourceState).phase[0] === "ready" &&
          !params.has("t") &&
          eventTimes.length === 0 &&
          !matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          autoPlayed = true;
          clickToggle(0);
          start(0.36);
        }
        continue;
      }
      if (kind === "load") {
        resourceError = "";
        shouldPump = true;
      }
    }
    if (shouldPump) await pumpImageQueue();
  }
  async function commitResource(transition) {
    resourceState = transition.get(resourceTags.state);
    const actions = transition.get(resourceTags.actions);
    const queued = enqueue_image_actions(loadQueue, runtimeGeneration, actions);
    loadQueue = queued.get(resourceTags.queue);
    imageHost = apply_image_actions(imageHost, actions);
    if (queued.get(resourceTags.backpressured) > 0) resourceError = "图片加载队列已满，请稍后重试";
    return executeResourceActions(to_js_data(actions));
  }
  function pumpImageQueue() {
    if (pumpPromise) return pumpPromise;
    pumpPromise = (async () => {
      while (true) {
        const taken = take_load(loadQueue);
        loadQueue = taken.get(resourceTags.queue);
        const taskOption = taken.get(resourceTags.task);
        if (to_js_data(taskOption)[0] === "none") return;
        const task = option_$o_unwrap(taskOption);
        const identity = to_js_data(task).identity;
        const source =
          params.get("image") === "missing"
            ? new URL("./missing-lotus.jpg", import.meta.url)
            : new URL("../../assets/lotus.jpg", import.meta.url);
        const descriptor = image_descriptor(identity.id, identity.version, source.href, 650, 432);
        const result = await run_image_load_task_$x_(descriptor, task);
        const completion = complete_image_load(imageHost, resourceState, loadQueue, result);
        loadQueue = completion.get(resourceTags.queue);
        imageHost = completion.get(resourceTags.host);
        await commitResource(completion.get(resourceTags.transition));
      }
    })().finally(() => {
      pumpPromise = null;
    });
    return pumpPromise;
  }
  function loadResource(version = 1) {
    return commitResource(request_resource(resourceState, image_resource("lotus", version)));
  }
  const api = { seek, reset, clickToggle, snapshot, pause: stop, play: start, loadResource, selectBackend };
  window.foldingFanDemo = api;
  void loadResource();
  if (params.get("backend") === "webgpu") {
    backendControl.value = "webgpu";
    void selectBackend("webgpu");
  }
  return () => {
    gpuEpoch += 1;
    const previous = gpu;
    gpu = null;
    void closeGpu(previous);
    runtimeGeneration += 1;
    loadQueue = cancel_stale_device_loads(loadQueue, runtimeGeneration);
    void commitResource(close_resource(resourceState));
    stop();
    listeners.abort();
    observer.disconnect();
    resolution?.removeEventListener("change", watchDpr);
    if (window.foldingFanDemo === api) delete window.foldingFanDemo;
  };
}
if (location.pathname.endsWith("/examples/folding-fan/index.html")) mountDemo();
