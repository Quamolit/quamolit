// 页面只负责时钟、画布和浮层；花纹的每个点、颜色和 Scene 节点都来自 Calcit。
import { draw_$x_, scene_at } from "../../target/js/tidal-bloom/quamolit.examples.tidal-bloom.mjs";
import { to_js_data } from "../../target/js/tidal-bloom/calcit.core.mjs";

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
  let time = Number.isFinite(initial) && initial >= 0 && initial <= 120 ? initial : 0;
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
    const scale = Math.min(width / 790, height / 790);
    context.setTransform(scale, 0, 0, scale, width / 2, height / 2);
    draw_$x_(context, time);
    paints++;
    slider.value = String(time);
    status.textContent = `t = ${time.toFixed(2)} s · 29 层 Calcit 曲线 · 绘制 ${paints}`;
    status.dataset.result = "pass";
  }

  function sample(value) {
    if (!Number.isFinite(value) || value < 0 || value > 120) {
      throw new RangeError("动画时间必须在 0–120 秒内");
    }
    time = value;
    draw();
  }

  function stop() {
    playing = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    playButton.textContent = "播放";
  }

  function tick(now) {
    if (!playing) return;
    const next = anchor + Math.max(0, now - started) / 1000;
    sample(Math.min(120, next));
    if (next >= 120) stop();
    else frame = requestAnimationFrame(tick);
  }

  function play() {
    if (playing) return;
    if (time >= 120) sample(0);
    anchor = time;
    started = performance.now();
    playing = true;
    playButton.textContent = "暂停";
    frame = requestAnimationFrame(tick);
  }

  function seek(value) {
    stop();
    sample(value);
    return snapshot();
  }

  function snapshot() {
    const scene = to_js_data(scene_at(time));
    return { time, playing, paints, width: canvas.width, height: canvas.height,
      ringCount: scene.nodes.length, firstPoint: scene.nodes[0].content[1].points[0],
      lastPoint: scene.nodes.at(-1).content[1].points.at(-1) };
  }

  playButton.onclick = () => playing ? stop() : play();
  document.querySelector("#reset").onclick = () => seek(0);
  document.querySelector("#share").onclick = async () => {
    const url = new URL(location.href);
    url.searchParams.set("t", String(time));
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
  const api = { seek, snapshot, pause: stop, play };
  window.tidalBloomDemo = api;
  if (!params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) play();
  return () => {
    stop();
    listeners.abort();
    observer.disconnect();
    resolution?.removeEventListener("change", watchDpr);
    if (window.tidalBloomDemo === api) delete window.tidalBloomDemo;
  };
}

if (location.pathname.endsWith("/examples/tidal-bloom/index.html")) mountDemo();
