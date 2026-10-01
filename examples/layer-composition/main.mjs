// DOM、计时器和原生设备生命周期；声明、实例布局、层计划及绘制由 Calcit 提供。
import * as demo from "../../target/js/layer-composition/quamolit.examples.layer-composition.mjs";
import * as layers from "../../target/js/layer-composition/quamolit.layers.mjs";
import * as resource from "../../target/js/layer-composition/quamolit.instance-resource.mjs";
import * as gpu from "../../target/js/layer-composition/quamolit.webgpu-batches.mjs";
import { to_js_data as plain } from "../../target/js/layer-composition/calcit.core.mjs";

export function mountDemo() {
  const canvas = document.querySelector("canvas");
  canvas.dataset.layer = "ui";
  const context = canvas.getContext("2d");
  const slider = document.querySelector("#time");
  const select = document.querySelector("#backend");
  const status = document.querySelector("#status");
  const params = new URLSearchParams(location.search);
  const table = resource.create_table_$x_();
  let bottom = null, bottomContext = null, runtime = null, view = null, version = 0;
  let time = Math.max(0, Math.min(1, Number(params.get("t") ?? 0)));
  let playing = false, raf = 0, started = 0, anchor = 0, epoch = 0, disposed = false;
  let preferred = params.get("backend") === "webgpu" ? "webgpu" : "canvas";
  let reason = "declared-canvas", metrics = null, plan = null;
  let hitPlans = null, lastHit = null, costs = null;
  let gpuCreated = 0, gpuReleased = 0;

  function installCanvas() {
    bottom?.remove();
    bottom = document.createElement("canvas");
    bottom.dataset.layer = "instances";
    bottom.setAttribute("aria-hidden", "true");
    canvas.before(bottom);
    bottomContext = bottom.getContext("2d");
  }
  function releaseRuntime() {
    const old = runtime;
    runtime = null;
    if (old) {
      gpu.dispose_$x_(old.batch);
      old.device.destroy();
      gpuReleased++;
    }
  }
  function draw() {
    if (disposed) return;
    const frameStarted = performance.now();
    const bounds = canvas.getBoundingClientRect();
    const next = layers.viewport(bounds.width, bounds.height, devicePixelRatio || 1);
    const dimensions = plain(next);
    if (!view || JSON.stringify(plain(view)) !== JSON.stringify(dimensions)) {
      const previous = version;
      version++;
      resource.register_$x_(table, demo.source_at(version), new Float32Array(plain(demo.positions_at(next))));
      if (previous) resource.release_$x_(table, demo.source_at(previous));
      view = next;
    }
    const viewportMs = performance.now() - frameStarted;
    const planningStarted = performance.now();
    const declaration = demo.frame_at(time, view, version);
    plan = plain(layers.plan_for(declaration, !!runtime));
    if (runtime && plan[0][0] !== "webgpu") {
      reason = plan[0][1];
      releaseRuntime();
      installCanvas();
      return draw();
    }
    hitPlans = layers.compile_hit_layers(declaration);
    const planningMs = performance.now() - planningStarted;
    const surfacesStarted = performance.now();
    for (const surface of [canvas, bottom]) {
      if (surface.width !== dimensions.width) surface.width = dimensions.width;
      if (surface.height !== dimensions.height) surface.height = dimensions.height;
    }
    const surfacesMs = performance.now() - surfacesStarted;
    const instancesStarted = performance.now();
    if (runtime) {
      try {
        metrics = plain(demo.draw_gpu_$x_(runtime.batch, table, runtime.previousVersion, view, version));
        runtime.previousVersion = version;
      } catch (error) {
        reason = `gpu-draw-failed: ${error.message}`;
        releaseRuntime();
        installCanvas();
        return draw();
      }
    } else {
      bottomContext.setTransform(1, 0, 0, 1, 0, 0);
      bottomContext.clearRect(0, 0, bottom.width, bottom.height);
      metrics = plain(demo.draw_canvas_$x_(bottomContext, table, view, version));
    }
    const instancesMs = performance.now() - instancesStarted;
    const uiStarted = performance.now();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    demo.draw_ui_$x_(context, time, view);
    const uiMs = performance.now() - uiStarted;
    const controlsStarted = performance.now();
    slider.value = String(time);
    select.value = preferred;
    document.querySelector("#time-output").value = time.toFixed(2);
    status.textContent = `${runtime ? "WebGPU + Canvas" : "Canvas + Canvas"} · ${dimensions.width}×${dimensions.height} · ${reason}`;
    status.dataset.result = "pass";
    costs = { viewportMs, planningMs, surfacesMs, instancesMs, uiMs, controlsMs: performance.now() - controlsStarted, cpuFrameMs: performance.now() - frameStarted, compositorMs: null, gpuMs: null };
  }
  async function setBackend(value) {
    preferred = value;
    const request = ++epoch;
    releaseRuntime();
    installCanvas();
    reason = value === "webgpu" ? "webgpu-loading" : "declared-canvas";
    draw();
    if (value !== "webgpu") return;
    let device = null, batch = null, candidate = null;
    try {
      if (!navigator.gpu) throw new Error("webgpu-unavailable");
      const adapter = await navigator.gpu.requestAdapter();
      if (disposed || request !== epoch) return;
      if (!adapter) throw new Error("adapter-unavailable");
      device = await adapter.requestDevice();
      if (disposed || request !== epoch) { device.destroy(); return; }
      candidate = document.createElement("canvas");
      candidate.dataset.layer = "instances";
      candidate.setAttribute("aria-hidden", "true");
      batch = await gpu.create_$x_(candidate, device, navigator.gpu.getPreferredCanvasFormat(), 10000);
      if (disposed || request !== epoch) {
        gpu.dispose_$x_(batch);
        device.destroy();
        return;
      }
      bottom.replaceWith(candidate);
      bottom = candidate;
      bottomContext = null;
      runtime = { batch, device, previousVersion: -1, adapter: { vendor: adapter.info?.vendor, architecture: adapter.info?.architecture, device: adapter.info?.device, description: adapter.info?.description } };
      gpuCreated++;
      reason = "ready";
      device.lost.then(() => {
        if (disposed || request !== epoch || runtime?.device !== device) return;
        reason = "device-lost";
        releaseRuntime();
        installCanvas();
        draw();
      });
      draw();
    } catch (error) {
      if (batch) gpu.dispose_$x_(batch);
      device?.destroy();
      if (disposed || request !== epoch) return;
      reason = error.message;
      draw();
    }
  }
  function stop() { playing = false; cancelAnimationFrame(raf); document.querySelector("#play").textContent = "播放"; }
  function seek(value) { stop(); time = Math.max(0, Math.min(1, value)); draw(); return snapshot(); }
  function tick(now) {
    if (!playing || disposed) return;
    time = Math.min(1, anchor + (now - started) / 1500);
    draw();
    if (time < 1) raf = requestAnimationFrame(tick); else stop();
  }
  function play() {
    if (playing) return;
    if (time >= 1) time = 0;
    anchor = time; started = performance.now(); playing = true;
    document.querySelector("#play").textContent = "暂停";
    raf = requestAnimationFrame(tick);
  }
  function snapshot() { return { time, playing, version, viewport: plain(view), plan, metrics, preferred, backend: runtime ? "webgpu" : "canvas", adapter: runtime?.adapter ?? null, reason, costs, lastHit, sourceLive: resource.live_count(table), gpuCreated, gpuReleased }; }
  function onPointerUp(event) {
    const bounds = canvas.getBoundingClientRect();
    const outcome = plain(layers.hit_at(hitPlans, view, event.clientX - bounds.left, event.clientY - bounds.top));
    lastHit = outcome[0] === "some" ? outcome[1] : null;
    if (lastHit?.hit.target === "toggle-play") {
      if (playing) stop(); else play();
    }
  }
  canvas.addEventListener("pointerup", onPointerUp);
  slider.oninput = () => seek(Number(slider.value));
  select.onchange = () => setBackend(select.value);
  document.querySelector("#play").onclick = () => playing ? stop() : play();
  document.querySelector("#reset").onclick = () => seek(0);
  document.querySelector("#panel-toggle").onclick = (event) => {
    const panel = document.querySelector("#panel");
    panel.hidden = !panel.hidden;
    event.currentTarget.ariaExpanded = String(!panel.hidden);
  };
  const observer = new ResizeObserver(draw);
  observer.observe(canvas);
  let dprQuery = null;
  function watchDpr() {
    dprQuery?.removeEventListener("change", dprChanged);
    dprQuery = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`);
    dprQuery.addEventListener("change", dprChanged);
  }
  function dprChanged() { watchDpr(); draw(); }
  watchDpr();
  window.addEventListener("resize", draw);
  // 部分浏览器/嵌入环境更新 DPR 而不发送 resolution 或 resize 事件；只在版本变化时重绘。
  const dprMonitor = setInterval(() => {
    if (!disposed && view && (devicePixelRatio || 1) !== plain(view).dpr) dprChanged();
  }, 250);
  const api = { seek, play, pause: stop, snapshot, setBackend, whenSubmitted: async () => runtime?.device.queue.onSubmittedWorkDone(), loseDevice: () => runtime?.device.destroy() };
  window.layerCompositionDemo = api;
  setBackend(preferred);
  if (!params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) play();
  return () => {
    disposed = true; epoch++; stop(); observer.disconnect(); clearInterval(dprMonitor); dprQuery?.removeEventListener("change", dprChanged); window.removeEventListener("resize", draw); canvas.removeEventListener("pointerup", onPointerUp); releaseRuntime(); bottom?.remove();
    if (version) resource.release_$x_(table, demo.source_at(version));
    delete canvas.dataset.layer;
    if (window.layerCompositionDemo === api) delete window.layerCompositionDemo;
  };
}

if (location.pathname.endsWith("/examples/layer-composition/index.html")) mountDemo();
