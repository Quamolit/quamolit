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
]);
const R = (type, fields) =>
  core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([key, value]) => [tags[key], value]));
const view = R(scene.Matrix2D, { a: 2, b: 0, c: 0, d: 3, e: 100, f: 200 });
const clear = R(motion.ColorRgba, { r: 0, g: 0, b: 0, a: 1 });

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
    assert.equal(p.length, 20);
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
