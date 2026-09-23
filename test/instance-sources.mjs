import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { scene_document_at as sceneDocumentAt } from "../js-out/quamolit.test.motion-fixture.mjs";
import { InstanceSourceRegistry } from "../instance-sources.mjs";
import { CanvasInstanceBatches } from "../canvas-instance-batches.mjs";
import { instanceGrid } from "./instance-grid.mjs";

const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const registry = new InstanceSourceRegistry();
const batches = new CanvasInstanceBatches(registry);
const documentAt = (time) => toJsData(sceneDocumentAt(time));
const source = documentAt(0.5).nodes.find((node) => node.content[0] === "instances").content[1].source;
const versions = [source, { ...source, version: source.version + 1 }];

for (const [index, x] of [40, 60].entries()) {
  const positions = instanceGrid(source.count, x);
  registry.register(versions[index], positions);
  positions[0] = 200; // Mutation without a new version must not affect retained data.
}

function pixelAt(x, y) {
  return Array.from(context.getImageData(x, y, 1, 1).data).join(",");
}

function render(version, time = 0.5) {
  const wire = documentAt(time);
  const instanceNodes = wire.nodes.filter((node) => node.content[0] === "instances");
  if (wire.nodes.length !== 3 || instanceNodes.length !== 1) throw new Error("场景逻辑节点数量错误");
  const instance = instanceNodes[0].content[1];
  const descriptor = { ...instance.source, version };
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const metrics = batches.draw(context, { ...instance, source: descriptor });
  const x = version === 1 ? 40 : 60;
  const active = pixelAt(x, 50);
  const inactive = pixelAt(version === 1 ? 60 : 40, 50);
  const grid = pixelAt(0, 0);
  const gap = pixelAt(2, 0);
  if (active !== "234,88,12,255" || inactive !== "255,255,255,255" || grid !== active || gap !== "255,255,255,255") {
    throw new Error(`版本 ${version} 像素错误: ${active} / ${inactive}`);
  }
  status.dataset.result = "pass";
  status.dataset.version = `${version}`;
  status.textContent = `PASS · t=${time}s · version=${version} · nodes=${wire.nodes.length} · instances=${descriptor.count} · ffi=${metrics.frameBoundaryCalls} · copied=${metrics.positionBytesCopied} · canvas=${metrics.canvasCalls} · pixel=${active}`;
}

document.querySelector("#v1").addEventListener("click", () => render(1));
document.querySelector("#v2").addEventListener("click", () => render(2));
try {
  render(2);
  render(1);
} catch (error) {
  status.dataset.result = "fail";
  status.textContent = `FAIL · ${error.message}`;
  throw error;
}
