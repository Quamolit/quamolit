// 时钟、Canvas 和 DOM 浮层属于页面；曲线、卡片和中间帧由 Calcit 生成。
import {
  active_$q_,
  branch_at,
  draw_$x_,
  initial_model,
  position_at,
  scene_at,
  set_mode,
} from "../../target/js/signal-weave/quamolit.examples.signal-weave.mjs";
import { to_js_data } from "../../target/js/signal-weave/calcit.core.mjs";

export function mountDemo() {
  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("2d");
  const slider = document.querySelector("#time");
  const playButton = document.querySelector("#play");
  const panel = document.querySelector("#panel");
  const toggle = document.querySelector("#panel-toggle");
  const status = document.querySelector("#status");
  const params = new URLSearchParams(location.search);
  const initialTime = Number(params.get("t") ?? 0);
  const initialPosition = Number(params.get("position") ?? 0);
  let time = Number.isFinite(initialTime) && initialTime >= 0 ? initialTime : 0;
  let model = initial_model(Number.isFinite(initialPosition) && initialPosition >= 0 && initialPosition <= 1
    ? initialPosition : 0);
  let playing = false;
  let frame = null;
  let anchor = 0;
  let started = 0;
  let paints = 0;

  function draw() {
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
    const desktop = bounds.width >= 900;
    const scale = desktop
      ? Math.min((width - 410 * dpr) / 960, height / 760)
      : Math.min(width / 1120, height / 760);
    // 桌面让出控制浮层的空间，窄屏保持舞台居中。
    const centerX = desktop ? width - 10 * dpr - 480 * scale : width / 2;
    context.setTransform(scale, 0, 0, scale, centerX, height / 2);
    draw_$x_(context, model, time);
    paints++;
    slider.value = String(Math.min(6, time));
    const position = position_at(model, time);
    document.querySelector("#mode-standard").setAttribute("aria-pressed", String(position < 0.5));
    document.querySelector("#mode-campaign").setAttribute("aria-pressed", String(position >= 0.5));
    status.textContent = `t = ${time.toFixed(2)} s · ${position < 0.01 ? "常态" : position > 0.99 ? "活动" : `情境渐变 ${(position * 100).toFixed(0)}%`} · 绘制 ${paints}`;
    status.dataset.result = "pass";
  }

  function stop() {
    playing = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    playButton.textContent = "播放";
  }

  function sample(value) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError("动画时间无效");
    time = value;
    draw();
  }

  function tick(now) {
    if (!playing) return;
    sample(anchor + Math.max(0, now - started) / 1000);
    if (time >= 1.2 && !active_$q_(model, time)) stop();
    else frame = requestAnimationFrame(tick);
  }

  function play() {
    if (playing) return;
    if (time >= 1.2 && !active_$q_(model, time)) {
      chooseMode(position_at(model, time) >= 0.5 ? 0 : 1);
      return;
    }
    anchor = time;
    started = performance.now();
    playing = true;
    playButton.textContent = "暂停";
    frame = requestAnimationFrame(tick);
  }

  function seek(value) {
    stop();
    model = branch_at(model, value);
    sample(value);
    return snapshot();
  }

  function chooseMode(target) {
    if (target !== 0 && target !== 1) throw new RangeError("未知数据情境");
    stop();
    model = set_mode(model, target, time);
    draw();
    if (active_$q_(model, time)) play();
    return snapshot();
  }

  function snapshot() {
    const scene = to_js_data(scene_at(model, time));
    const node = (id) => scene.nodes.find((entry) => entry.id === id);
    const points = node("signal-line").content[1].points;
    return {
      time,
      position: position_at(model, time),
      eventCount: to_js_data(model).events.length,
      playing,
      paints,
      width: canvas.width,
      height: canvas.height,
      nodeCount: scene.nodes.length,
      pathPoints: points.length,
      lastPoint: points.at(-1),
      marker: node("signal-marker").content[1],
      statusVisible: Boolean(node("forecast/card")),
    };
  }

  playButton.onclick = () => playing ? stop() : play();
  document.querySelector("#reset").onclick = () => {
    stop();
    model = initial_model(0);
    sample(0);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) play();
  };
  document.querySelector("#mode-standard").onclick = () => chooseMode(0);
  document.querySelector("#mode-campaign").onclick = () => chooseMode(1);
  document.querySelector("#share").onclick = async () => {
    const url = new URL(location.href);
    url.searchParams.set("t", String(time));
    url.searchParams.set("position", String(position_at(model, time)));
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
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, { signal: listeners.signal });
  window.addEventListener("pagehide", stop, { signal: listeners.signal });
  const api = { seek, chooseMode, snapshot, pause: stop, play };
  window.signalWeaveDemo = api;
  if (!params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) play();
  return () => {
    stop();
    listeners.abort();
    observer.disconnect();
    resolution?.removeEventListener("change", watchDpr);
    if (window.signalWeaveDemo === api) delete window.signalWeaveDemo;
  };
}

if (location.pathname.endsWith("/examples/signal-weave/index.html")) mountDemo();
