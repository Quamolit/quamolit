import { draw_$x_, scene_at } from "../../target/js/layered-dashboard/quamolit.examples.layered-dashboard.mjs";
import { to_js_data } from "../../target/js/layered-dashboard/calcit.core.mjs";

const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const slider = document.querySelector("#time");
const output = document.querySelector("#time-output");
const status = document.querySelector("#status");
const params = new URLSearchParams(location.search);
let time = Math.max(0, Math.min(1, Number(params.get("t") ?? 0)));
let playing = false;
let frame = 0;
let started = 0;
let anchor = 0;

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
  draw_$x_(context, time, width, height);
  slider.value = String(time);
  output.value = time.toFixed(2);
  status.textContent = `t=${time.toFixed(2)} · ${width}×${height} · Scene composited`;
  status.dataset.result = "pass";
}

function stop() {
  playing = false;
  cancelAnimationFrame(frame);
  document.querySelector("#play").textContent = "播放";
}
function seek(value) {
  stop();
  time = Math.max(0, Math.min(1, value));
  draw();
  return snapshot();
}
function tick(now) {
  if (!playing) return;
  time = Math.min(1, anchor + (now - started) / 900);
  draw();
  if (time < 1) frame = requestAnimationFrame(tick);
  else stop();
}
function play() {
  if (playing) return;
  if (time >= 1) time = 0;
  anchor = time;
  started = performance.now();
  playing = true;
  document.querySelector("#play").textContent = "暂停";
  frame = requestAnimationFrame(tick);
}
function snapshot() {
  const scene = to_js_data(scene_at(time, canvas.width, canvas.height));
  return { time, width: canvas.width, height: canvas.height, nodeCount: scene.nodes.length, playing };
}

slider.oninput = () => seek(Number(slider.value));
document.querySelector("#play").onclick = () => (playing ? stop() : play());
document.querySelector("#reset").onclick = () => seek(0);
document.querySelector("#panel-toggle").onclick = (event) => {
  const panel = document.querySelector("#panel");
  panel.hidden = !panel.hidden;
  event.currentTarget.ariaExpanded = String(!panel.hidden);
  event.currentTarget.textContent = panel.hidden ? "展开控制" : "收起控制";
};
new ResizeObserver(draw).observe(canvas);
window.layeredDashboardDemo = { seek, play, pause: stop, snapshot };
draw();
if (!params.has("t") && !matchMedia("(prefers-reduced-motion: reduce)").matches) play();
