// 页面只管理 Canvas 尺寸、绘制与 DOM；指针路由、捕获和 Model 生命周期均交给 Calcit。
import * as drag from "../../target/js/drag-demo/quamolit.examples.drag-demo.mjs";
import { to_js_data } from "../../target/js/drag-demo/calcit.core.mjs";
export function mountDemo() {
  const canvas = document.querySelector("#scene"),
    context = canvas.getContext("2d");
  const panel = document.querySelector("#panel"),
    toggle = document.querySelector("#panel-toggle");
  const status = document.querySelector("#status"),
    message = document.querySelector("#message");
  let paints = 0;
  let view = { scale: 1, x: 0, y: 0 };
  function draw() {
    const bounds = canvas.getBoundingClientRect(),
      dpr = devicePixelRatio || 1;
    const width = Math.max(1, Math.round(bounds.width * dpr)),
      height = Math.max(1, Math.round(bounds.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    view = {
      scale: Math.min(width / (panel.hidden ? 620 : 850), height / 540),
      x: panel.hidden ? width / 2 : width * 0.42,
      y: height / 2,
    };
    drag.set_drag_view_$x_(
      (view.scale * bounds.width) / width,
      (view.scale * bounds.height) / height,
      (view.x * bounds.width) / width,
      (view.y * bounds.height) / height,
    );
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    const model = drag.current_model();
    drag.draw_$x_(context, model);
    paints++;
    const state = to_js_data(model);
    const pointer = drag.current_pointer();
    status.textContent = `矩形 (${state.x.toFixed(1)}, ${state.y.toFixed(1)}) · 滑块 ${state.value.toFixed(2)}\n活动指针 ${pointer < 0 ? "无" : pointer} · 绘制 ${paints} · ${width} × ${height} 像素`;
    status.dataset.result = "pass";
  }
  function snapshot() {
    const model = drag.current_model(),
      pointer = drag.current_pointer();
    return {
      model: to_js_data(model),
      scene: to_js_data(drag.scene_at(model)),
      captured: pointer < 0 ? null : pointer,
      paints,
      width: canvas.width,
      height: canvas.height,
      view: { ...view },
    };
  }
  function safely(action) {
    try {
      message.textContent = "";
      return action();
    } catch (error) {
      message.textContent = error.message;
    }
  }
  const disposePointer = drag.install_drag_pointer_$x_(canvas, draw);
  function reset() {
    drag.reset_demo_$x_();
    draw();
    return snapshot();
  }
  function preset() {
    drag.preset_demo_$x_();
    draw();
    return snapshot();
  }
  document.querySelector("#reset").onclick = () => safely(reset);
  document.querySelector("#preset").onclick = () => safely(preset);
  toggle.onclick = () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
    toggle.textContent = panel.hidden ? "展开面板" : "收起面板";
    draw();
  };
  if (innerWidth < 600) {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "展开面板";
  }
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
  function dispose() {
    disposePointer();
    observer.disconnect();
    resolution?.removeEventListener("change", watchDpr);
    if (window.dragDemo === api) delete window.dragDemo;
  }
  const api = { snapshot, reset, preset, draw, dispose };
  window.dragDemo = api;
  return dispose;
}
if (location.pathname.endsWith("/examples/drag-demo/index.html")) mountDemo();
