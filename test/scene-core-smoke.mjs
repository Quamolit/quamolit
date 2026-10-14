import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { scene_document_at as sceneDocumentAt } from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import { validate_scene as validateScene } from "../target/js/motion/quamolit.scene-ir.mjs";
import * as core from "../target/js/motion/calcit.core.mjs";
import * as scene from "../target/js/motion/quamolit.scene-ir.mjs";
import * as motion from "../target/js/motion/quamolit.motion.mjs";
import * as diff from "../target/js/motion/quamolit.scene-diff.mjs";
import * as binding from "../target/js/motion/quamolit.scene-binding.mjs";

test("共享呈现矩阵：contain、CSS像素锚点偏移、非法值与溢出", () => {
  const frame = (...args) => toJsData(scene.frame_matrix(...args));
  const contain = (...args) => toJsData(scene.contain_matrix(...args));
  assert.deepEqual(contain(1000, 500, 800, 1000, 0.38, 0.5), { a: 0.5, b: 0, c: 0, d: 0.5, e: 380, f: 250 });
  assert.deepEqual(frame(780, 1688, 2, 0.5, 0, 0, 100), { a: 2, b: 0, c: 0, d: 2, e: 390, f: 200 });
  for (const bad of [NaN, Infinity, -Infinity]) {
    for (let field = 0; field < 7; field++) {
      const values = [1000, 500, 2, 0.5, 0.5, 0, 0];
      values[field] = bad;
      assert.throws(() => frame(...values));
    }
    for (let field = 0; field < 6; field++) {
      const values = [1000, 500, 800, 1000, 0.5, 0.5];
      values[field] = bad;
      assert.throws(() => contain(...values));
    }
  }
  for (const bad of [0, -1]) {
    for (let field = 0; field < 4; field++) {
      const values = [1000, 500, 800, 1000, 0.5, 0.5];
      values[field] = bad;
      assert.throws(() => contain(...values));
    }
    assert.throws(() => frame(1000, 500, bad, 0.5, 0.5, 0, 0));
  }
  assert.throws(() => frame(1000, 500, Number.MAX_VALUE, 0.5, 0.5, 2, 0));
  assert.throws(() => contain(Number.MIN_VALUE, Number.MIN_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, 0.5, 0.5));
});

test("圆弧声明的数值、几何/颜色失效与明确的绑定边界 (#212)", () => {
  const tags = core.init_tags([
    "cx",
    "cy",
    "radius",
    "start-angle",
    "end-angle",
    "counterclockwise",
    "width",
    "stroke",
    "r",
    "g",
    "b",
    "a",
    "arc",
    "alpha",
    "x",
  ]);
  const record = (type, fields) =>
    core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([key, value]) => [tags[key], value]));
  const black = record(motion.ColorRgba, { r: 0, g: 0, b: 0, a: 1 });
  const arc = record(scene.ArcNode, {
    cx: 40,
    cy: 40,
    radius: 20,
    "start-angle": 5,
    "end-angle": 1,
    counterclockwise: false,
    width: 4,
    stroke: black,
  });
  const content = (value) => core._PCT__$o__$o_(scene.SceneContent, tags.arc, value);
  assert.equal(scene.valid_arc_$q_(arc), true);
  assert.equal(scene.content_kind(content(arc)), "arc");
  assert.deepEqual(JSON.parse(JSON.stringify(toJsData(content(arc)))), toJsData(content(arc)));
  for (const [field, invalid] of [
    ["radius", 0],
    ["radius", -1],
    ["width", -1],
    ["start-angle", NaN],
    ["end-angle", Infinity],
    ["cx", -Infinity],
  ])
    assert.equal(scene.valid_arc_$q_(arc.assoc(tags[field], invalid)), false);
  assert.equal(scene.valid_arc_$q_(arc.assoc(tags.width, 0)), true);
  assert.equal(scene.valid_arc_$q_(arc.assoc(tags["end-angle"], 5)), true);
  for (const field of ["cx", "cy", "radius", "start-angle", "end-angle", "width", "counterclockwise"]) {
    const changed = arc.assoc(tags[field], field === "counterclockwise" ? true : arc.get(tags[field]) + 0.5);
    assert.notDeepEqual(
      toJsData(diff.geometry_signature(content(changed))),
      toJsData(diff.geometry_signature(content(arc))),
    );
    assert.deepEqual(
      toJsData(diff.property_signature(content(changed))),
      toJsData(diff.property_signature(content(arc))),
    );
  }
  const red = content(arc.assoc(tags.stroke, black.assoc(tags.r, 1)));
  assert.deepEqual(toJsData(diff.geometry_signature(red)), toJsData(diff.geometry_signature(content(arc))));
  assert.notDeepEqual(toJsData(diff.property_signature(red)), toJsData(diff.property_signature(content(arc))));
  assert.deepEqual(toJsData(diff.resource_signature(red)), ["none"]);
  const faded = binding.apply_scalar(content(arc), core._PCT__$o__$o_(scene.ScalarTarget, tags.alpha), 0.5);
  assert.equal(toJsData(faded)[1].stroke.a, 0.5);
  assert.equal(toJsData(content(arc))[1].stroke.a, 1, "绑定不修改调用者旧圆弧");
  assert.deepEqual(toJsData(diff.geometry_signature(faded)), toJsData(diff.geometry_signature(content(arc))));
  assert.notDeepEqual(toJsData(diff.property_signature(faded)), toJsData(diff.property_signature(content(arc))));
  assert.throws(
    () => binding.apply_scalar(content(arc), core._PCT__$o__$o_(scene.ScalarTarget, tags.x), 0.5),
    /unsupported-arc-binding/,
  );
});

test("typed Scene IR is valid and JSON-serializable without host handles", () => {
  for (const [time, x] of [
    [1, 120],
    [0, 80],
    [0.5, 100],
    [0.25, 90],
    [1, 120],
  ]) {
    const document = sceneDocumentAt(time);
    assert.equal(validateScene(document), true);
    const plain = toJsData(document);
    const wire = JSON.parse(JSON.stringify(plain));
    assert.deepEqual(wire, plain);
    assert.equal(wire.nodes.length, 3);
    assert.deepEqual(
      wire.nodes.map((node) => node.id),
      ["root", "badge", "particles"],
    );
    assert.deepEqual(Object.keys(wire.nodes[1]), ["bindings", "content", "id", "interaction", "key", "parent"]);
    assert.equal(wire.nodes[1].content[0], "rect");
    assert.equal(wire.nodes[1].content[1].x, x);
    assert.equal(wire.nodes[1].interaction[1], "badge-click");
    assert.equal(wire.nodes[2].content[0], "instances");
    assert.deepEqual(wire.nodes[2].content[1].source, { count: 10000, id: "particles", version: 1 });
  }
});
