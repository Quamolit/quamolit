import assert from "node:assert/strict";
import { test } from "node:test";
import * as core from "../target/js/motion/calcit.core.mjs";
import * as layers from "../target/js/motion/quamolit.layers.mjs";
import * as scene from "../target/js/motion/quamolit.scene-ir.mjs";
import * as gpu from "../target/js/motion/quamolit.webgpu-batches.mjs";
import { scene_document_at } from "../target/js/motion/quamolit.test.motion-fixture.mjs";

const tags = core.init_tags([
  "id",
  "policy",
  "scene",
  "time",
  "viewport",
  "layers",
  "nodes",
  "parent",
  "width",
  "canvas",
  "gpu-instances",
]);
const plain = core.to_js_data;
const make = (type, values) =>
  core._$n__PCT__$M_(type, ...Object.entries(values).flatMap(([key, value]) => [tags[key], value]));
const list = (...values) => new core.CalcitSliceList(values);
const policy = (name) => core._PCT__$o__$o_(layers.LayerPolicy, tags[name]);
const document = scene_document_at(0.5);
const instances = make(scene.SceneDocument, { nodes: list(document.get(tags.nodes).get(2).assoc(tags.parent, "")) });
const layer = (id, name, content = instances) => make(layers.RenderLayer, { id, policy: policy(name), scene: content });
const frame = (
  view = layers.viewport(800, 600, 1),
  entries = list(layer("instances", "gpu-instances"), layer("ui", "canvas", document)),
  time = 0.5,
) => make(layers.LayerFrame, { time, viewport: view, layers: entries });

test("统一视口保留 CSS 尺寸，物理像素只按 DPR 舍入一次", () => {
  assert.deepEqual(plain(layers.viewport(800.25, 600.25, 2)), {
    "css-width": 800.25,
    "css-height": 600.25,
    dpr: 2,
    width: 1601,
    height: 1201,
  });
  assert.equal(plain(layers.viewport(0.1, 0.1, 1)).width, 1);
  for (const value of [0, -1, NaN, Infinity]) {
    assert.throws(() => layers.viewport(value, 600, 1));
    assert.throws(() => layers.viewport(800, value, 1));
    assert.throws(() => layers.viewport(800, 600, value));
  }
  assert.throws(() => layers.viewport(Number.MAX_VALUE, 600, 2));
});

test("同一帧的层序、时间和声明不被校验或后端选择改写", () => {
  const model = frame();
  const before = plain(model);
  layers.validate_frame_$x_(model);
  assert.deepEqual(plain(layers.plan_for(model, true)), [["webgpu"], ["canvas", "declared-canvas"]]);
  const entries = model.get(tags.layers);
  assert.deepEqual(plain(layers.backend_for(entries.get(0), true)), ["webgpu"]);
  assert.deepEqual(plain(layers.backend_for(entries.get(0), false)), ["canvas", "webgpu-unavailable"]);
  assert.deepEqual(plain(layers.backend_for(entries.get(1), true)), ["canvas", "declared-canvas"]);
  assert.deepEqual(plain(model), before);
  assert.deepEqual(
    before.layers.map((entry) => entry.id),
    ["instances", "ui"],
  );
  for (const dpr of [2, 1, 2]) layers.validate_frame_$x_(model.assoc(tags.viewport, layers.viewport(700, 500, dpr)));
  assert.equal(model.get(tags.time), 0.5, "暂停 resize 不改变逻辑时间");
});

test("整层能力判定拒绝混合 Scene，不将支持节点单独送入 GPU", () => {
  assert.equal(layers.gpu_instances_$q_(instances), true);
  assert.equal(layers.gpu_instances_$q_(document), false);
  assert.deepEqual(plain(layers.backend_for(layer("mixed", "gpu-instances", document), true)), [
    "canvas",
    "unsupported-instance-layer",
  ]);
  assert.equal(layers.gpu_instances_$q_(make(scene.SceneDocument, { nodes: list() })), false);
});

test("跨层命中保持逆绘制层序，逻辑节点 ID 可在不同层复用", () => {
  const plans = layers.compile_hit_layers(
    frame(undefined, list(layer("bottom", "canvas", document), layer("top", "canvas", document))),
  );
  assert.deepEqual(
    plain(plans).map((entry) => entry.id),
    ["top", "bottom"],
  );
  const result = plain(layers.hit_test_layers(plans, 108, 50));
  assert.deepEqual(result, [
    "some",
    { "layer-id": "top", hit: { target: "badge-click", "node-id": "badge", visited: 1 } },
  ]);
  assert.deepEqual(plain(layers.hit_test_layers(plans, 20, 20)), ["none"]);
  assert.deepEqual(plain(layers.hit_at(plans, layers.viewport(800, 600, 2), 54, 25)), result);
  assert.throws(() => layers.hit_test_layers(plans, NaN, 50), /invalid-layer-pointer/);
});

test("重复层 ID、空 ID、非法 Scene、时间和伪造物理视口在提交前失败", () => {
  assert.throws(
    () => layers.validate_frame_$x_(frame(undefined, list(layer("same", "canvas"), layer("same", "canvas")))),
    /duplicate-layer-id/,
  );
  assert.throws(() => layers.validate_frame_$x_(frame(undefined, list(layer("", "canvas")))), /empty-layer-id/);
  assert.throws(() => layers.validate_frame_$x_(frame(undefined, undefined, NaN)), /invalid-layer-time/);
  assert.throws(
    () => layers.validate_frame_$x_(frame(layers.viewport(800, 600, 2).assoc(tags.width, 800))),
    /inconsistent-layer-viewport/,
  );
  const invalid = make(scene.SceneDocument, { nodes: list(document.get(tags.nodes).get(2)) });
  assert.throws(
    () => layers.backend_for(layer("invalid", "gpu-instances", invalid), true),
    /missing-or-non-group-parent/,
  );
});

test("透明实例层通过公共 Calcit 接口清屏，旧 draw! 仍使用白色背景", () => {
  const calls = [];
  const batch = {
    draw(options) {
      calls.push(options);
      return {
        drawCalls: 1,
        instances: options.count,
        positionBytesUploaded: 0,
        uniformBytesUploaded: 64,
        pipelinesCreated: 1,
        buffersCreated: 2,
      };
    },
  };
  const fill = gpu.color(0.2, 0.4, 0.6, 0.5);
  const count = core._PCT_some(10000);
  const result = gpu.draw_cleared_$x_(batch, 2, 2, fill, 1, gpu.no_translation(), count, gpu.color(0, 0, 0, 0));
  assert.deepEqual(calls[0].clear, { r: 0, g: 0, b: 0, a: 0 });
  assert.deepEqual(calls[0].fill, { r: 0.2, g: 0.4, b: 0.6, a: 0.5 });
  assert.equal(plain(result).instances, 10000);
  gpu.draw_$x_(batch, 2, 2, fill, 1, gpu.no_translation(), count);
  assert.deepEqual(calls[1].clear, { r: 1, g: 1, b: 1, a: 1 });
  assert.equal(calls[1].count, 10000);
});
