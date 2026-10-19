// 页面只负责时钟、画布和浮层；UI 组件、布局及渐变帧都来自 Calcit。
import {
  initial_model,
  initial_series_model,
  start_interactive,
  update_interactive,
  start_timeline,
  update_timeline,
  series_active_$q_,
  series_position_at,
  set_series,
  set_view,
  timeline_position_at,
  view_active_$q_,
  view_position_at,
} from "../../target/js/tidal-bloom/quamolit.examples.tidal-bloom.mjs";
import { init_tags, to_js_data } from "../../target/js/tidal-bloom/calcit.core.mjs";
import { draw_plan_$x_ } from "../../target/js/tidal-bloom/quamolit.retained-component.mjs";

import { DemandFrameScheduler } from "../../demos/demand-frame-scheduler.mjs";

const planFields = init_tags(["declarations", "plan-builds"]);

export function mountDemo() {
  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("2d");
  const slider = document.querySelector("#time");
  const playButton = document.querySelector("#play");
  const panel = document.querySelector("#panel");
  const toggle = document.querySelector("#panel-toggle");
  const status = document.querySelector("#status");
  const params = new URLSearchParams(location.search);
  const initial = Number(params.get("t") ?? 0);
  const sharedProgress = Number(params.get("progress"));
  const sharedSeriesProgress = Number(params.get("seriesProgress"));
  let time = Number.isFinite(initial) && initial >= 0 && initial <= 8 ? initial : 0;
  let mode = params.has("t") ? "timeline" : "interactive";
  let model = initial_model(params.has("progress") && Number.isFinite(sharedProgress) && sharedProgress >= 0 && sharedProgress <= 1
    ? sharedProgress : 0);
  let seriesModel = initial_series_model(params.has("seriesProgress") && Number.isFinite(sharedSeriesProgress) && sharedSeriesProgress >= 0 && sharedSeriesProgress <= 1
    ? sharedSeriesProgress : 0);
  let playing = false;
  let anchor = 0;
  let started = 0;
  let paints = 0;
  let flowPlan = null;
  let modelVersion = 0;
  let viewportVersion = 0;
  let viewportKey = "";
  const scheduler = new DemandFrameScheduler({
    requestFrame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (handle) => cancelAnimationFrame(handle),
    paint: (now) => playing ? tick(now) : draw(),
  });

  function wake(reason) {
    scheduler.request(reason);
    scheduler.resume();
  }

  function updatePlan() {
    if (mode === "interactive") {
      flowPlan = flowPlan === null
        ? start_interactive(model, seriesModel, time, modelVersion, viewportVersion)
        : update_interactive(flowPlan, model, seriesModel, time, modelVersion, viewportVersion);
    } else {
      flowPlan = flowPlan === null
        ? start_timeline(time)
        : update_timeline(flowPlan, time, 0, viewportVersion);
    }
  }

  function draw() {
    const bounds = canvas.getBoundingClientRect();
    const dpr = devicePixelRatio || 1;
    const width = Math.max(1, Math.round(bounds.width * dpr));
    const height = Math.max(1, Math.round(bounds.height * dpr));
    const nextViewportKey = `${bounds.width}/${bounds.height}/${dpr}`;
    if (nextViewportKey !== viewportKey) {
      if (viewportKey !== "") viewportVersion++;
      viewportKey = nextViewportKey;
    }
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width / 1000, height / 700);
    // 桌面右置以避开控制浮层；窄屏居中整个工作台。
    const centerX = width / 2 - (bounds.width < 680 ? 110 * scale : 0);
    context.setTransform(scale, 0, 0, scale, centerX, height / 2);
    updatePlan();
    draw_plan_$x_(context, flowPlan);
    paints++;
    slider.disabled = mode === "interactive";
    if (mode === "timeline") slider.value = String(time);
    const position = mode === "interactive" ? view_position_at(model, time) : timeline_position_at(time);
    const seriesPosition = mode === "interactive" ? series_position_at(seriesModel, time) : 0;
    document.querySelector("#series-visitors").setAttribute("aria-pressed", String(seriesPosition < 0.5));
    document.querySelector("#series-revenue").setAttribute("aria-pressed", String(seriesPosition >= 0.5));
    status.textContent = mode === "interactive"
      ? `交互切换 · ${position < 0.01 ? "概览" : position > 0.99 ? "图表分析" : `过渡 ${(position * 100).toFixed(0)}%`} · ${seriesPosition < 0.01 ? "访客" : seriesPosition > 0.99 ? "营收" : `数据渐变 ${(seriesPosition * 100).toFixed(0)}%`} · 绘制 ${paints}`
      : `t = ${time.toFixed(2)} s · ${time < 3.55 ? "概览" : time < 4.16 ? "视图切换" : "图表分析"} · 绘制 ${paints}`;
    status.textContent += ` · 保留声明 ${flowPlan.get(planFields.declarations)} / 构建 ${flowPlan.get(planFields["plan-builds"])}`;
    status.dataset.result = "pass";
  }

  function sample(value) {
    if (!Number.isFinite(value) || value < 0 || (mode === "timeline" && value > 8)) {
      throw new RangeError("动画时间无效");
    }
    time = value;
    draw();
  }

  function stop() {
    playing = false;
    scheduler.pause();
    playButton.textContent = "播放";
  }

  function tick(now) {
    if (!playing) return;
    const next = anchor + Math.max(0, now - started) / 1000;
    sample(mode === "timeline" ? Math.min(8, next) : next);
    if (mode === "timeline" ? next >= 8 : !view_active_$q_(model, time) && !series_active_$q_(seriesModel, time)) stop();
    else scheduler.request("animation");
  }

  function play() {
    if (playing) return;
    if (mode === "interactive" && !view_active_$q_(model, time) && !series_active_$q_(seriesModel, time)) {
      chooseView(view_position_at(model, time) >= 0.5 ? 0 : 1);
      return;
    }
    if (mode === "timeline" && time >= 8) sample(0);
    anchor = time;
    started = performance.now();
    playing = true;
    playButton.textContent = "暂停";
    wake("animation");
  }

  function seek(value) {
    stop();
    mode = "timeline";
    sample(value);
    return snapshot();
  }

  function seekInteractive(value) {
    if (mode !== "interactive") throw new Error("当前不是交互视图");
    stop();
    sample(value);
    return snapshot();
  }

  function chooseView(target) {
    if (target !== 0 && target !== 1) throw new RangeError("未知视图");
    stop();
    if (mode !== "interactive") {
      model = initial_model(timeline_position_at(time));
      time = 0;
      mode = "interactive";
    }
    model = set_view(model, target, time);
    modelVersion++;
    draw();
    if (view_active_$q_(model, time)) play();
    return snapshot();
  }

  function chooseSeries(target) {
    if (target !== 0 && target !== 1) throw new RangeError("未知数据系列");
    stop();
    if (mode !== "interactive") {
      model = initial_model(timeline_position_at(time));
      seriesModel = initial_series_model(0);
      time = 0;
      mode = "interactive";
    }
    seriesModel = set_series(seriesModel, target, time);
    modelVersion++;
    draw();
    if (view_active_$q_(model, time) || series_active_$q_(seriesModel, time)) play();
    return snapshot();
  }

  function snapshot() {
    if (flowPlan === null) updatePlan();
    const retained = to_js_data(flowPlan);
    const scene = retained.scene;
    const node = (id) => scene.nodes.find((entry) => entry.id === id);
    return {
      time,
      mode,
      position: mode === "interactive" ? view_position_at(model, time) : timeline_position_at(time),
      seriesPosition: mode === "interactive" ? series_position_at(seriesModel, time) : 0,
      seriesEventCount: mode === "interactive" ? to_js_data(seriesModel).events.length : 0,
      eventCount: mode === "interactive" ? to_js_data(model).events.length : 0,
      playing,
      paints,
      pending: scheduler.pending,
      width: canvas.width,
      height: canvas.height,
      nodeCount: scene.nodes.length,
      retained: retained ? {
        declarations: retained.declarations,
        planBuilds: retained["plan-builds"],
        bindingSamples: retained["binding-samples"],
      } : null,
      heroWidth: node("hero-card")?.content[1].width ?? null,
      queueX: node("queue-card")?.content[1].x ?? null,
      progressWidth: node("hero-progress")?.content[1].width ?? null,
      completionAlpha: node("hero-done")?.content[1].fill.a ?? null,
      overviewVisible: Boolean(node("hero-card")),
      analyticsVisible: Boolean(node("kpi-a-card")),
      chartBarHeight: node("bar-value-11")?.content[1].height ?? null,
    };
  }

  playButton.onclick = () => playing ? stop() : play();
  document.querySelector("#reset").onclick = () => seek(0);
  document.querySelector("#view-overview").onclick = () => chooseView(0);
  document.querySelector("#view-analytics").onclick = () => chooseView(1);
  document.querySelector("#series-visitors").onclick = () => chooseSeries(0);
  document.querySelector("#series-revenue").onclick = () => chooseSeries(1);
  document.querySelector("#share").onclick = async () => {
    const url = new URL(location.href);
    if (mode === "interactive") {
      url.searchParams.delete("t");
      url.searchParams.set("progress", String(view_position_at(model, time)));
      url.searchParams.set("seriesProgress", String(series_position_at(seriesModel, time)));
    } else {
      url.searchParams.delete("progress");
      url.searchParams.delete("seriesProgress");
      url.searchParams.set("t", String(time));
    }
    history.replaceState(null, "", url);
    try { await navigator.clipboard.writeText(url.href); } catch { /* URL 已更新。 */ }
  };
  slider.oninput = () => seek(Number(slider.value));
  document.querySelectorAll("[data-time]").forEach(button => button.onclick = () => seek(Number(button.dataset.time)));
  toggle.onclick = () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
    toggle.textContent = panel.hidden ? "展开控制" : "收起控制";
  };

  const observer = new ResizeObserver(() => wake("resize"));
  observer.observe(canvas);
  let resolution;
  function watchDpr() {
    resolution?.removeEventListener("change", watchDpr);
    resolution = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`);
    resolution.addEventListener("change", watchDpr);
    wake("dpr");
  }
  watchDpr();
  const listeners = new AbortController();
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, { signal: listeners.signal });
  window.addEventListener("pagehide", stop, { signal: listeners.signal });
  const api = { seek, seekInteractive, snapshot, chooseView, chooseSeries, pause: stop, play };
  window.tidalBloomDemo = api;
  window.metricFlowDemo = api;
  if (!params.has("t") && !params.has("progress") && !matchMedia("(prefers-reduced-motion: reduce)").matches) chooseView(1);
  return () => {
    stop();
    scheduler.dispose();
    listeners.abort();
    observer.disconnect();
    resolution?.removeEventListener("change", watchDpr);
    flowPlan = null;
    if (window.tidalBloomDemo === api) delete window.tidalBloomDemo;
    if (window.metricFlowDemo === api) delete window.metricFlowDemo;
  };
}

if (location.pathname.endsWith("/examples/tidal-bloom/index.html")) mountDemo();
