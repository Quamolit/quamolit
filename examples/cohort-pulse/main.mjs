// 时钟、Canvas 与 DOM 浮层属于页面；筛选、重排和面板中间帧由 Calcit 生成。
import {
  active_$q_,
  branch_at,
  draw_$x_,
  initial_switch,
  position_at,
  scene_at,
  set_switch,
} from "../../target/js/cohort-pulse/quamolit.examples.cohort-pulse.mjs";
import { to_js_data } from "../../target/js/cohort-pulse/calcit.core.mjs";

import { DemandFrameScheduler } from "../../demos/demand-frame-scheduler.mjs";

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
  const initialFilter = Number(params.get("filter") ?? 0);
  const initialPanel = Number(params.get("panel") ?? 0);
  let time = Number.isFinite(initialTime) && initialTime >= 0 ? initialTime : 0;
  let filterModel = initial_switch("cohort/filter", initialFilter >= 0 && initialFilter <= 1 ? initialFilter : 0);
  let panelModel = initial_switch("cohort/panel", initialPanel >= 0 && initialPanel <= 1 ? initialPanel : 0);
  let playing = false;
  let anchor = 0;
  let started = 0;
  let paints = 0;
  const scheduler = new DemandFrameScheduler({
    requestFrame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (handle) => cancelAnimationFrame(handle),
    paint: (now) => playing ? tick(now) : draw(),
  });

  function wake(reason) {
    scheduler.request(reason);
    scheduler.resume();
  }

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
    const desktop = bounds.width >= 920;
    const scale = desktop ? Math.min((width - 430 * dpr) / 960, height / 760) : Math.min(width / 1120, height / 760);
    const centerX = desktop ? width - 10 * dpr - 480 * scale : width / 2;
    context.setTransform(scale, 0, 0, scale, centerX, height / 2);
    draw_$x_(context, filterModel, panelModel, time);
    paints++;
    slider.value = String(Math.min(7, time));
    const filter = position_at(filterModel, time);
    const detail = position_at(panelModel, time);
    document.querySelector("#filter-all").setAttribute("aria-pressed", String(filter < 0.5));
    document.querySelector("#filter-risk").setAttribute("aria-pressed", String(filter >= 0.5));
    document.querySelector("#panel-summary").setAttribute("aria-pressed", String(detail < 0.5));
    document.querySelector("#panel-detail").setAttribute("aria-pressed", String(detail >= 0.5));
    const filterLabel = filter < 0.01 ? "全部" : filter > 0.99 ? "仅风险" : `筛选 ${(filter * 100).toFixed(0)}%`;
    const panelLabel = detail < 0.01 ? "摘要" : detail > 0.99 ? "详情" : `面板 ${(detail * 100).toFixed(0)}%`;
    status.textContent = `t = ${time.toFixed(2)} s · ${filterLabel} · ${panelLabel} · 绘制 ${paints}`;
    status.dataset.result = "pass";
  }

  function stop() {
    playing = false;
    scheduler.pause();
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
    if (time >= 0.9 && !active_$q_(filterModel, time) && !active_$q_(panelModel, time)) stop();
    else scheduler.request("animation");
  }

  function play() {
    if (playing) return;
    anchor = time;
    started = performance.now();
    playing = true;
    playButton.textContent = "暂停";
    wake("animation");
  }

  function seek(value) {
    stop();
    filterModel = branch_at(filterModel, value);
    panelModel = branch_at(panelModel, value);
    sample(value);
    return snapshot();
  }

  function chooseFilter(target) {
    stop();
    filterModel = set_switch(filterModel, target, time, 1);
    draw();
    if (active_$q_(filterModel, time)) play();
    return snapshot();
  }

  function choosePanel(target) {
    stop();
    panelModel = set_switch(panelModel, target, time, 0.75);
    draw();
    if (active_$q_(panelModel, time)) play();
    return snapshot();
  }

  function snapshot() {
    const scene = to_js_data(scene_at(filterModel, panelModel, time));
    const node = (id) => scene.nodes.find((entry) => entry.id === id);
    const shape = (id) => node(id)?.content[1];
    return {
      time,
      filter: position_at(filterModel, time),
      panel: position_at(panelModel, time),
      filterEvents: to_js_data(filterModel).events.length,
      panelEvents: to_js_data(panelModel).events.length,
      playing,
      paints,
      pending: scheduler.pending,
      width: canvas.width,
      height: canvas.height,
      nodeCount: scene.nodes.length,
      rowCount: scene.nodes.filter((entry) => entry.id.endsWith("/card") && entry.id.startsWith("row-")).length,
      cellCount: scene.nodes.filter((entry) => entry.id.startsWith("cell-")).length,
      visibleCellCount: scene.nodes.filter((entry) => entry.id.startsWith("cell-") && entry.content[1].fill.a > 0.001)
        .length,
      northstarY: shape("row-1/card")?.y,
      emberY: shape("row-3/card")?.y,
      safeVisible: Boolean(node("row-0/card")),
      summaryVisible: Boolean(node("summary/title")),
      detailVisible: Boolean(node("detail/title")),
    };
  }

  playButton.onclick = () => (playing ? stop() : play());
  document.querySelector("#reset").onclick = () => {
    stop();
    filterModel = initial_switch("cohort/filter", 0);
    panelModel = initial_switch("cohort/panel", 0);
    sample(0);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) play();
  };
  document.querySelector("#filter-all").onclick = () => chooseFilter(0);
  document.querySelector("#filter-risk").onclick = () => chooseFilter(1);
  document.querySelector("#panel-summary").onclick = () => choosePanel(0);
  document.querySelector("#panel-detail").onclick = () => choosePanel(1);
  document.querySelector("#share").onclick = async () => {
    const url = new URL(location.href);
    url.searchParams.set("t", String(time));
    url.searchParams.set("filter", String(position_at(filterModel, time)));
    url.searchParams.set("panel", String(position_at(panelModel, time)));
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
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) stop();
    },
    { signal: listeners.signal },
  );
  window.addEventListener("pagehide", stop, { signal: listeners.signal });
  const api = { seek, chooseFilter, choosePanel, snapshot, pause: stop, play };
  window.cohortPulseDemo = api;
  if (!params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) play();
  return () => {
    stop();
    scheduler.dispose();
    listeners.abort();
    observer.disconnect();
    resolution?.removeEventListener("change", watchDpr);
    if (window.cohortPulseDemo === api) delete window.cohortPulseDemo;
  };
}

if (location.pathname.endsWith("/examples/cohort-pulse/index.html")) mountDemo();
