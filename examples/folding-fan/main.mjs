// 资源、视口和宿主时间在页面；折扇的状态、几何与绘制调用均来自 Calcit。
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
} from "../../target/js/folding-fan/quamolit.examples.folding-fan.mjs";
import {
  image_resource,
  request_resource,
  resource_ready,
  resource_failed,
  close_resource,
} from "../../target/js/folding-fan/quamolit.resource-lifecycle.mjs";
import {
  image_create,
  image_src_$x_,
  image_decode_$x_,
  image_natural_width,
  image_natural_height,
} from "../../target/js/folding-fan/js-ffi.browser.mjs";
import { init_tags, to_js_data } from "../../target/js/folding-fan/calcit.core.mjs";
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
  const parsed = Number(params.get("t") || 0);
  let time = Number.isFinite(parsed) && parsed >= 0 && parsed <= 120 ? parsed : 0;
  let model = initial(),
    events = empty_events(),
    image = null,
    error = "",
    resourceError = "",
    playing = false,
    raf = null,
    anchor = 0,
    started = 0,
    until = 120,
    paints = 0;
  let resourceState = resource_initial(),
    installedGeneration = null,
    autoPlayed = false;
  const resourceHandles = new Map(),
    resourceTags = init_tags(["state", "actions"]);
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
      const scale = Math.min(width / 900, height / 650);
      context.setTransform(scale, 0, 0, scale, width / 2, height * 0.77);
      draw_$x_(context, image, model, time);
    }
    paints++;
    slider.value = String(time);
    status.textContent = `t = ${time.toFixed(2)} s · 切片 24\n开合 ${fold_value(model, time).toFixed(3)} · 图片 ${resource} · 绘制 ${paints}`;
    status.dataset.result = resource === "ready" ? "pass" : resource;
    message.textContent = [error, resourceError].filter(Boolean).join("；");
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
      error: [error, resourceError].filter(Boolean).join("；"),
      playing,
      paints,
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
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) stop();
    },
    { signal: listeners.signal },
  );
  window.addEventListener("pagehide", stop, { signal: listeners.signal });
  function releaseResource(generation) {
    resourceHandles.delete(generation);
    if (installedGeneration === generation) {
      installedGeneration = null;
      image = null;
    }
  }
  async function executeResourceActions(actions) {
    for (const [kind, generation, detail] of actions) {
      if (kind === "release") {
        releaseResource(generation);
        continue;
      }
      if (kind === "show-error") {
        resourceError = `图片加载失败：${detail}`;
        continue;
      }
      if (kind === "install") {
        const candidate = resourceHandles.get(generation);
        if (!candidate) throw new Error(`图片 generation ${generation} 已失效`);
        installedGeneration = generation;
        image = candidate;
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
        const candidate = image_create();
        resourceHandles.set(generation, candidate);
        const source =
          params.get("image") === "missing"
            ? new URL("./missing-lotus.jpg", import.meta.url)
            : new URL("../../assets/lotus.jpg", import.meta.url);
        image_src_$x_(candidate, source.href);
        try {
          await image_decode_$x_(candidate);
          if (image_natural_width(candidate) === 0 || image_natural_height(candidate) === 0)
            throw new Error("图片不存在或无法解码");
          if (image_natural_width(candidate) !== 650 || image_natural_height(candidate) !== 432)
            throw new Error("荷花图片尺寸与 650 × 432 切片依据不符");
          await commitResource(resource_ready(resourceState, generation));
        } catch (cause) {
          await commitResource(resource_failed(resourceState, generation, cause.message || String(cause)));
        }
      }
    }
  }
  async function commitResource(transition) {
    resourceState = transition.get(resourceTags.state);
    return executeResourceActions(to_js_data(transition.get(resourceTags.actions)));
  }
  function loadResource(version = 1) {
    return commitResource(request_resource(resourceState, image_resource("lotus", version)));
  }
  const api = { seek, reset, clickToggle, snapshot, pause: stop, play: start, loadResource };
  window.foldingFanDemo = api;
void loadResource();
return () => {
  void commitResource(close_resource(resourceState));
    stop();
    listeners.abort();
    observer.disconnect();
    resolution?.removeEventListener("change", watchDpr);
    if (window.foldingFanDemo === api) delete window.foldingFanDemo;
  };
}
if (location.pathname.endsWith("/examples/folding-fan/index.html")) mountDemo();
