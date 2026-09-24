import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { bound_scene_document_at as boundSceneDocumentAt, draw_reference_scene_at_$x_ as drawReferenceSceneAt, scene_document_at as sceneDocumentAt, scene_delta_at as sceneDeltaAt } from "../target/js/motion/quamolit.test.motion-fixture.mjs";

const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");

function renderAt(time) {
  if (!Number.isFinite(time)) throw new Error("时间必须有限");
  const wire = toJsData(boundSceneDocumentAt(time));
  const reference = toJsData(sceneDocumentAt(time));
  if (JSON.stringify(wire.nodes.map((node) => node.content)) !== JSON.stringify(reference.nodes.map((node) => node.content))) {
    throw new Error("绑定采样与独立时间参考不一致");
  }
  const delta = toJsData(sceneDeltaAt(0, time));
  if (delta.timeChanged !== undefined) throw new Error("Scene diff 序列化字段错误");
  if (delta["time-changed"] !== (time !== 0)) throw new Error("Scene diff 时间标记错误");
  if (delta.changes.length !== (time === 0 ? 0 : 1)) throw new Error("Scene diff 更新数错误");
  if (time !== 0 && (delta.changes[0][0] !== "updated" || !delta.changes[0][2].geometry)) throw new Error("Scene diff 几何变更错误");
  if (wire.nodes.length !== 3) throw new Error("Scene IR 节点数错误");
  const instances = wire.nodes.find((node) => node.content[0] === "instances");
  if (instances.content[1].source.count !== 10000) throw new Error("实例图层计数错误");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawReferenceSceneAt(context, time);
  if (context.fillStyle !== "#ffffff") throw new Error("参考绘制污染 Canvas 样式");
  const rect = wire.nodes.find((node) => node.content[0] === "rect")?.content[1];
  if (!rect) throw new Error("缺失矩形节点");
  const centerX = rect.x + rect.width / 2;
  const pixel = Array.from(context.getImageData(centerX, 50, 1, 1).data).join(",");
  if (pixel !== "234,88,12,255") throw new Error(`Scene IR 中间帧像素错误：${pixel}`);
  const background = Array.from(context.getImageData(0, 0, 1, 1).data).join(",");
  if (background !== "255,255,255,255") throw new Error(`Scene IR 背景像素错误：${background}`);
  status.dataset.result = "pass";
  status.textContent = `PASS · t=${time}s · rect-center=${centerX} · nodes=${wire.nodes.length} · instances=${instances.content[1].source.count} · pixel=${pixel} · bound=pass`;
  return { centerX, wire };
}

for (const time of [-0.25, 0, 0.25, 0.5, 1]) {
  const button = document.createElement("button");
  button.textContent = `${time}s`;
  button.addEventListener("click", () => renderAt(time));
  document.querySelector("#times").append(button);
}

try {
  for (const [time, x] of [[1, 128], [0, 88], [0.5, 108], [0.25, 98], [1, 128]]) {
    if (renderAt(time).centerX !== x) throw new Error(`乱序场景采样错误：${time}s`);
  }
  renderAt(Number(new URLSearchParams(location.search).get("time") ?? 0.5));
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
