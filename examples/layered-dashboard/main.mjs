import * as dashboard from "../../target/js/layered-dashboard/quamolit.examples.layered-dashboard.mjs";
import { to_js_data } from "../../target/js/layered-dashboard/calcit.core.mjs";
import { DemandFrameScheduler } from "../../demos/demand-frame-scheduler.mjs";

export function mountDemo() {
  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("2d");
  const slider = document.querySelector("#time");
  const output = document.querySelector("#time-output");
  const status = document.querySelector("#status");
  const params = new URLSearchParams(location.search);
  let time = Math.max(0, Math.min(1, Number(params.get("t") ?? 0)));
  let playing = false;
  let disposed = false, paints = 0;
  let started = 0;
  let anchor = 0;
  let events = dashboard.empty_events();
  let model = dashboard.replay_events(events, time);
  let horizon = 1;
  let scene;
  const scheduler = new DemandFrameScheduler({
    requestFrame: callback => requestAnimationFrame(callback),
    cancelFrame: handle => cancelAnimationFrame(handle),
    paint: now => playing ? tick(now) : draw(),
  });
  function wake(reason) {
    if (disposed) return;
    scheduler.request(reason); scheduler.resume();
  }

  function draw() {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect();
    const dpr = devicePixelRatio || 1;
    const width = Math.max(1, Math.round(bounds.width * dpr));
    const height = Math.max(1, Math.round(bounds.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    scene = dashboard.frame_at(model, time, width, height);
    dashboard.commit_scene_$x_(canvas, scene, bounds.width / width, bounds.height / height);
    dashboard.draw_frame_$x_(context, scene, width, height);
    paints++;
    slider.value = String(time);
    slider.max = String(horizon);
    output.value = time.toFixed(2);
    const state = snapshot();
    const button = document.querySelector("#presence-toggle");
    button.textContent = state.visible ? "隐藏看板" : "恢复看板";
    button.ariaPressed = String(!state.visible);
    const chartButton = document.querySelector("#chart-toggle");
    chartButton.textContent = state.chartVisible ? "隐藏图表" : "恢复图表";
    chartButton.ariaPressed = String(!state.chartVisible);
    const variantButton = document.querySelector("#chart-variant");
    variantButton.textContent = state.lineChart ? "切换柱状图" : "切换折线图";
    variantButton.ariaPressed = String(state.lineChart);
    status.textContent = `t=${time.toFixed(2)} · ${width}×${height} · ${state.nodeCount} 节点 · 捕获 ${state.captured ?? "无"}`;
    status.dataset.result = "pass";
  }

  function stop() {
    playing = false;
    scheduler.pause();
    document.querySelector("#play").textContent = "播放";
  }
  function seek(value) {
    stop();
    time = Math.max(0, Math.min(horizon, value));
    model = dashboard.replay_events(events, time);
    draw();
    return snapshot();
  }
  function tick(now) {
    if (!playing) return;
    const previous = time;
    time = Math.min(horizon, Math.max(previous, anchor + Math.max(0, now - started) / 900));
    model = dashboard.advance(model, events, previous, time);
    draw();
    if (time < horizon) wake("animation");
    else stop();
  }
  function play() {
    if (playing || disposed) return;
    if (time >= horizon) {
      time = 0;
      model = dashboard.replay_events(events, time);
    }
    anchor = time;
    started = performance.now();
    playing = true;
    document.querySelector("#play").textContent = "暂停";
    wake("play");
  }
  function snapshot() {
    const data = to_js_data(scene);
    const log = to_js_data(events);
    const prior = log.filter(event => event.time <= time).at(-1);
    const pointer = to_js_data(dashboard.current_pointer());
    const capture = pointer.capture;
    return { time, width: canvas.width, height: canvas.height, nodeCount: data.nodes.length, playing, paints, pending: scheduler.pending,
      visible: prior?.visible ?? true, chartVisible: prior?.["chart-visible"] ?? true, lineChart: prior?.["line-chart"] ?? false, events: log, scene: data, pointer,
      captured: capture[0] === "captured" ? capture[1] : null };
  }

  function commitEvents(next) {
    stop();
    events = next;
    model = dashboard.replay_events(events, time);
    horizon = Math.max(1, time, dashboard.animation_end(model));
    draw(); // 新 Scene 立即协调捕获，不能等待下一次 PointerEvent 或动画终点。
    if (time < horizon && !matchMedia("(prefers-reduced-motion: reduce)").matches) play();
    return snapshot();
  }
  function setVisible(visible) {
    return commitEvents(dashboard.record_visibility(events, time, visible));
  }
  function setChartVisible(visible) {
    return commitEvents(dashboard.record_chart_visibility(events, time, visible));
  }
  function setChartVariant(lineChart) {
    return commitEvents(dashboard.record_chart_variant(events, time, lineChart));
  }
  function reset() {
    stop(); events = dashboard.empty_events(); horizon = 1; time = 0;
    model = dashboard.initial(); draw(); return snapshot();
  }
  const disposePointer = dashboard.install_pointer_$x_(canvas, draw);

  slider.oninput = () => seek(Number(slider.value));
  document.querySelector("#play").onclick = () => (playing ? stop() : play());
  document.querySelector("#reset").onclick = reset;
  document.querySelector("#presence-toggle").onclick = () => setVisible(!snapshot().visible);
  document.querySelector("#chart-toggle").onclick = () => setChartVisible(!snapshot().chartVisible);
  document.querySelector("#chart-variant").onclick = () => setChartVariant(!snapshot().lineChart);
  document.querySelector("#panel-toggle").onclick = (event) => {
    const panel = document.querySelector("#panel");
    panel.hidden = !panel.hidden;
    event.currentTarget.ariaExpanded = String(!panel.hidden);
    event.currentTarget.textContent = panel.hidden ? "展开控制" : "收起控制";
  };
  const observer = new ResizeObserver(() => wake("viewport"));
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
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, {signal:listeners.signal});
  window.addEventListener("pagehide", stop, {signal:listeners.signal});
  function dispose() {
    if (disposed) return;
    disposePointer();
    disposed = true;
    stop();
    scheduler.dispose();
    listeners.abort();
    observer.disconnect();
    resolution?.removeEventListener("change", watchDpr);
    if (window.layeredDashboardDemo === api) delete window.layeredDashboardDemo;
  }
  const api = { seek, play, pause: stop, snapshot, setVisible, setChartVisible, setChartVariant, reset, dispose };
  window.layeredDashboardDemo = api;
  draw();
  if (!params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) play();
  return dispose;
}

if (location.pathname.endsWith("/examples/layered-dashboard/index.html")) mountDemo();
