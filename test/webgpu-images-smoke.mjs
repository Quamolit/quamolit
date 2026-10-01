import assert from "node:assert/strict";
import { test } from "node:test";
import * as core from "../target/js/motion/calcit.core.mjs";
import * as scene from "../target/js/motion/quamolit.scene-ir.mjs";
import * as images from "../target/js/motion/quamolit.webgpu-images.mjs";
import * as fan from "../target/js/motion/quamolit.examples.folding-fan.mjs";
import * as motion from "../target/js/motion/quamolit.motion.mjs";
import * as textures from "../target/js/motion/quamolit.webgpu-texture-runner.mjs";

const tags = core.init_tags([
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "r",
  "g",
  "nodes",
  "content",
  "source",
  "version",
  "rect",
  "x",
  "y",
  "width",
  "height",
  "fill",
  "id",
  "parent",
  "key",
  "group",
  "transform",
  "clip",
  "opacity",
  "none",
]);
const R = (type, fields) =>
  core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([key, value]) => [tags[key], value]));
const view = R(scene.Matrix2D, { a: 2, b: 0, c: 0, d: 3, e: 100, f: 200 });
const clear = R(motion.ColorRgba, { r: 0, g: 0, b: 0, a: 1 });

test("嵌套父组变换与裁剪求交，镜像矩阵保留正确边界；不支持的语义在 begin 前拒绝", () => {
  const original = fan.scene_at(fan.initial(), 0);
  const leaf = original.get(tags.nodes).get(0);
  const rectangle = R(scene.ClipRect, { x: 0, y: 0, width: 20, height: 20 });
  const makeGroup = (id, parent, matrix, opacity = 1) =>
    leaf
      .assoc(tags.id, id)
      .assoc(tags.parent, parent)
      .assoc(
        tags.content,
        core._PCT__$o__$o_(
          scene.SceneContent,
          tags.group,
          R(scene.GroupNode, {
            transform: matrix,
            clip: core._PCT__$o__$o_(scene.ClipSpec, tags.rect, rectangle),
            opacity,
          }),
        ),
      );
  const outerMatrix = R(scene.Matrix2D, { a: 2, b: 0, c: 0, d: 2, e: 10, f: 20 });
  const innerMatrix = R(scene.Matrix2D, { a: 1, b: 0, c: 0, d: 1, e: 5, f: 5 });
  const outer = makeGroup("outer", "", outerMatrix);
  const inner = makeGroup("inner", "outer", innerMatrix);
  const doc = original.assoc(tags.nodes, new core.CalcitSliceList([outer, inner, leaf.assoc(tags.parent, "inner")]));
  const identity = R(scene.Matrix2D, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
  assert.equal(images.supported_document_$q_(doc), true);
  assert.deepEqual(core.to_js_data(images.render_decision(doc, identity, true)), ["webgpu"]);
  assert.deepEqual(core.to_js_data(images.render_decision(doc, identity, false)), ["canvas", "webgpu-unavailable"]);
  const prepared = core.to_js_data(
    images.prepare_document(doc, () => ({ width: 650, height: 432 }), identity, 100, 100),
  );
  assert.equal(prepared.length, 1);
  assert.deepEqual(prepared[0].parameters.slice(4, 12), [2, 0, 20, 0, 0, 2, 30, 0]);
  assert.deepEqual(prepared[0].parameters.slice(20), [20, 30, 50, 60]);
  const reflected = R(scene.Matrix2D, { a: -2, b: 0, c: 0, d: -3, e: 100, f: 100 });
  assert.deepEqual(core.to_js_data(images.transform_clip(rectangle, reflected)), {
    x: 60,
    y: 40,
    width: 40,
    height: 60,
  });
  let begins = 0;
  const host = {
    capacity: 24,
    begin() {
      begins++;
    },
  };
  const rotation = R(scene.Matrix2D, { a: 0, b: 1, c: -1, d: 0, e: 0, f: 0 });
  assert.deepEqual(core.to_js_data(images.render_decision(doc, rotation, true)), ["canvas", "rotated-image-clip"]);
  assert.throws(
    () => images.draw_document_$x_(host, doc, () => ({ width: 650, height: 432 }), rotation, 100, 100, clear),
    /unsupported-rotated-image-clip/,
  );
  const translucent = doc.assoc(
    tags.nodes,
    new core.CalcitSliceList([makeGroup("outer", "", outerMatrix, 0.5), inner, leaf.assoc(tags.parent, "inner")]),
  );
  assert.equal(images.supported_document_$q_(translucent), false);
  assert.deepEqual(core.to_js_data(images.render_decision(translucent, identity, true)), [
    "canvas",
    "unsupported-image-layer",
  ]);
  assert.throws(
    () => images.draw_document_$x_(host, translucent, () => ({ width: 650, height: 432 }), identity, 100, 100, clear),
    /unsupported-webgpu-image-scene/,
  );
  assert.equal(begins, 0);
  const extreme = R(scene.Matrix2D, { a: 1e308, b: 0, c: 0, d: 1, e: 0, f: 0 });
  assert.throws(
    () => images.draw_document_$x_(host, original, () => ({ width: 650, height: 432 }), extreme, 100, 100, clear),
    /invalid-image-parameters/,
  );
  assert.equal(begins, 0);
});

test("混合文字/折线 Scene 保留全部 24 图片和层序，Calcit 判定完整图层回退而不是 GPU 子集", () => {
  const document = fan.display_scene(fan.initial(), 0.18, view, true, true);
  const nodes = core.to_js_data(document).nodes;
  assert.equal(scene.validate_scene(document), true);
  assert.equal(nodes.length, 28);
  assert.equal(nodes.filter((node) => node.content[0] === "image").length, 24);
  assert.deepEqual(
    nodes.slice(-3).map((node) => node.content[0]),
    ["group", "polyline", "text"],
  );
  assert.deepEqual(core.to_js_data(images.render_decision(document, view, true)), [
    "canvas",
    "unsupported-image-layer",
  ]);
  let begins = 0;
  assert.throws(
    () =>
      images.draw_document_$x_(
        {
          begin() {
            begins++;
          },
        },
        document,
        () => ({ width: 650, height: 432 }),
        view,
        900,
        650,
        clear,
      ),
    /unsupported-webgpu-image-scene/,
  );
  assert.equal(begins, 0);
  const invalid = document.assoc(tags.nodes, new core.CalcitSliceList([document.get(tags.nodes).get(1)]));
  assert.throws(() => images.render_decision(invalid, view, false), /missing-or-non-group-parent/);
});

test("公共初始化在图层创建失败时释放已上传 texture，解码失败不创建句柄", async () => {
  const previousImage = globalThis.Image;
  let created = 0,
    released = 0;
  globalThis.Image = class {
    naturalWidth = 2;
    naturalHeight = 2;
    async decode() {
      if (this.src.includes("missing")) throw new Error("mock image missing");
    }
  };
  const device = {
    createTexture() {
      created++;
      return {
        width: 2,
        height: 2,
        destroy() {
          released++;
        },
      };
    },
    queue: { copyExternalImageToTexture() {} },
  };
  try {
    await assert.rejects(
      images.open_runtime_$x_(
        {},
        device,
        "rgba8unorm",
        textures.texture_descriptor("atlas", 1, "atlas.png", 2, 2, "rgba8unorm"),
        1,
        0,
      ),
      /invalid image capacity/,
    );
    assert.equal(created, 1);
    assert.equal(released, 1);
    await assert.rejects(
      images.open_runtime_$x_(
        {},
        device,
        "rgba8unorm",
        textures.texture_descriptor("atlas", 1, "missing.png", 2, 2, "rgba8unorm"),
        1,
        24,
      ),
      /mock image missing/,
    );
    assert.equal(created, 1);
    assert.equal(released, 1);
  } finally {
    if (previousImage === undefined) delete globalThis.Image;
    else globalThis.Image = previousImage;
  }
});

test("视口与图片局部矩阵独立合成，保留旋转、缩放与平移", () => {
  const local = R(scene.Matrix2D, { a: 0, b: 1, c: -1, d: 0, e: 10, f: 20 });
  assert.deepEqual(core.to_js_data(images.compose_matrix(view, local)), { a: 0, b: 3, c: -2, d: 0, e: 120, f: 260 });
});

test("Folding Fan 的 24 张声明按顺序绑定，裁剪归一化且逻辑 Scene 不含句柄", () => {
  const doc = fan.scene_at(fan.initial(), 0);
  const texture = { width: 650, height: 432 };
  const looked = [];
  const prepared = core.to_js_data(
    images.prepare_document(
      doc,
      (id, version) => {
        looked.push([id, version]);
        return texture;
      },
      view,
      900,
      650,
    ),
  );
  assert.equal(prepared.length, 24);
  assert.deepEqual(
    looked,
    Array.from({ length: 24 }, () => ["lotus", 1]),
  );
  prepared.forEach((command, index) => {
    const p = command.parameters;
    assert.equal(p.length, 24);
    assert.deepEqual(p.slice(20), [0, 0, 900, 650]);
    assert.deepEqual(p.slice(0, 12), [900, 650, 0, 0, 2, 0, 100, 0, 0, 3, 200, 0]);
    assert.ok(Math.abs(p[16] - index / 24) < 1e-12);
    assert.ok(Math.abs(p[18] - 1 / 24) < 1e-12);
  });
  const wire = core.to_js_data(doc);
  // JSON normalizes -0 from sin(-0); resource identity remains plain data.
  const serialized = JSON.parse(JSON.stringify(wire));
  serialized.nodes.forEach((node) =>
    assert.deepEqual(node.content[1].source, { id: "lotus", version: 1, width: 650, height: 432 }),
  );
});

test("晚到的资源缺失、尺寸不符与容量不足在 begin 前拒绝，不产生半帧", () => {
  const doc = fan.scene_at(fan.initial(), 0);
  let begins = 0,
    lookups = 0;
  const host = {
    capacity: 24,
    begin() {
      begins++;
    },
  };
  assert.throws(
    () =>
      images.draw_document_$x_(
        host,
        doc,
        () => {
          if (++lookups === 24) throw new Error("last-texture-missing");
          return { width: 650, height: 432 };
        },
        view,
        900,
        650,
        clear,
      ),
    /last-texture-missing/,
  );
  assert.equal(begins, 0);
  assert.throws(
    () => images.draw_document_$x_(host, doc, () => ({ width: 1, height: 1 }), view, 900, 650, clear),
    /texture-size-mismatch/,
  );
  host.capacity = 23;
  assert.throws(
    () => images.draw_document_$x_(host, doc, () => ({ width: 650, height: 432 }), view, 900, 650, clear),
    /image-layer-capacity-exceeded/,
  );
  assert.equal(begins, 0);
  const first = doc.get(tags.nodes).get(0);
  const rect = R(scene.RectNode, { x: 0, y: 0, width: 10, height: 10, fill: clear });
  const changed = first.assoc(tags.content, core._PCT__$o__$o_(scene.SceneContent, tags.rect, rect));
  const mixed = doc.assoc(tags.nodes, new core.CalcitSliceList([changed]));
  assert.equal(scene.validate_scene(mixed), true);
  assert.equal(images.supported_document_$q_(mixed), false);
  assert.throws(
    () => images.draw_document_$x_(host, mixed, () => ({ width: 650, height: 432 }), view, 900, 650, clear),
    /unsupported-webgpu-image-scene/,
  );
  assert.equal(begins, 0);
});
