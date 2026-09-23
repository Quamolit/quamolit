import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { scene_document_at as sceneDocumentAt } from "../js-out/quamolit.test.motion-fixture.mjs";
import { float32At } from "../.calcit/modules/js-ffi/typed-arrays.mjs";
import { InstanceSourceRegistry } from "../instance-sources.mjs";

const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { willReadFrequently: true });
const status = document.querySelector("#status");
const registry = new InstanceSourceRegistry();
const documentAt = (time) => toJsData(sceneDocumentAt(time));
const source = documentAt(0.5).nodes.find((node) => node.content[0] === "instances").content[1].source;
const versions = [source, { ...source, version: source.version + 1 }];

for (const [index, x] of [40, 60].entries()) {
  const positions = new Float32Array(source.count * 2);
  positions.fill(-1000);
  positions[0] = x;
  positions[1] = 50;
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
  const token = registry.resolve(descriptor);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const { r, g, b, a } = instance.fill;
  context.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
  for (let index = 0; index < descriptor.count; index++) {
    context.fillRect(float32At(token, index * 2), float32At(token, index * 2 + 1), instance.width, instance.height);
  }
  const x = version === 1 ? 40 : 60;
  const active = pixelAt(x, 50);
  const inactive = pixelAt(version === 1 ? 60 : 40, 50);
  if (active !== "234,88,12,255" || inactive !== "255,255,255,255") {
    throw new Error(`版本 ${version} 像素错误: ${active} / ${inactive}`);
  }
  status.dataset.result = "pass";
  status.dataset.version = `${version}`;
  status.textContent = `PASS · t=${time}s · version=${version} · nodes=${wire.nodes.length} · instances=${descriptor.count} · pixel=${active}`;
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
