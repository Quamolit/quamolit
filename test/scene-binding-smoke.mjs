import assert from "node:assert/strict";
import { test } from "node:test";
import * as core from "../target/js/motion/calcit.core.mjs";
import * as scene from "../target/js/motion/quamolit.scene-ir.mjs";
import * as motion from "../target/js/motion/quamolit.motion.mjs";
import * as binding from "../target/js/motion/quamolit.scene-binding.mjs";
import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import {
  bound_scene_document_at as boundSceneDocumentAt,
  scene_document_at as sceneDocumentAt,
} from "../target/js/motion/quamolit.test.motion-fixture.mjs";

test("文字 x/y 绑定保留字体与内容，重复或不支持的目标仍拒绝", () => {
  const tag = (name) => core.init_tags([name])[name];
  const make = (type, fields) => core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([k, v]) => [tag(k), v]));
  const en = (type, name, ...values) => core._PCT__$o__$o_(type, tag(name), ...values);
  const list = (values) => new core.CalcitSliceList(values);
  const shape = make(scene.TextNode, {
    x: 12,
    y: 34,
    size: 14,
    text: "moving label",
    font: scene.default_font(),
    fill: make(motion.ColorRgba, { r: 0.2, g: 0.3, b: 0.4, a: 0.75 }),
  });
  const text = en(scene.SceneContent, "text", shape);
  const refs = ["x", "y"].map((axis) =>
    make(scene.ScalarBinding, { target: en(scene.ScalarTarget, axis), "motion-id": axis, version: 0 }),
  );
  const descriptors = ["x", "y"].map((id, index) =>
    make(motion.ScalarDescriptor, {
      id,
      version: 0,
      motion: en(motion.ScalarMotion, "time", index + 1, index * 10),
    }),
  );
  const node = make(scene.SceneNode, {
    id: "label",
    key: "label",
    parent: "",
    content: text,
    bindings: list(refs),
    interaction: en(scene.SceneInteraction, "none"),
  });
  const document = make(scene.SceneDocument, { nodes: list([node]) });
  assert.equal(scene.validate_scene(document), true);
  for (const time of [1, 0, 0.25, -2, 1]) {
    const result = toJsData(binding.resolve_scene(document, list(descriptors), time));
    assert.deepEqual(result.nodes[0].content[1], { ...toJsData(shape), x: time, y: 10 + 2 * time });
  }
  for (const target of ["width", "height", "opacity", "linear-red"]) {
    const unsupported = make(scene.ScalarBinding, {
      target: en(scene.ScalarTarget, target),
      "motion-id": "x",
      version: 0,
    });
    assert.equal(scene.valid_binding_$q_(unsupported, text), false);
    assert.throws(() => binding.apply_scalar(text, en(scene.ScalarTarget, target), 1), /unsupported-text-binding/);
  }
  assert.equal(scene.valid_bindings_$q_(list([refs[0], refs[0]]), text), false);
  assert.deepEqual(toJsData(shape), {
    x: 12,
    y: 34,
    size: 14,
    text: "moving label",
    font: toJsData(scene.default_font()),
    fill: { r: 0.2, g: 0.3, b: 0.4, a: 0.75 },
  });
});

test("矩形线性RGB通道用原标量声明乱序采样，不改alpha、几何或旧Scene", () => {
  const tag = (name) => core.init_tags([name])[name];
  const make = (type, fields) =>
    core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([key, value]) => [tag(key), value]));
  const list = (values) => new core.CalcitSliceList(values);
  const E = (type, name, ...values) => core._PCT__$o__$o_(type, tag(name), ...values);
  const original = sceneDocumentAt(0),
    nodes = original.get(tag("nodes"));
  const references = ["linear-red", "linear-green", "linear-blue"].map((channel) =>
    make(scene.ScalarBinding, {
      target: E(scene.ScalarTarget, channel),
      "motion-id": channel,
      version: 1,
    }),
  );
  const tweens = [
    [0, 1],
    [1, 0],
    [0.25, 0.75],
  ].map(([from, to], index) =>
    make(motion.ScalarDescriptor, {
      id: ["linear-red", "linear-green", "linear-blue"][index],
      version: 1,
      motion: E(
        motion.ScalarMotion,
        "tween",
        make(motion.ScalarTween, {
          from,
          to,
          start: 0,
          duration: 1,
          easing: E(motion.Easing, "linear"),
        }),
      ),
    }),
  );
  const rect = nodes.get(1).assoc(tag("parent"), "").assoc(tag("bindings"), list(references));
  const document = original.assoc(tag("nodes"), list([rect]));
  const before = toJsData(document),
    descriptors = list(tweens);
  const encode = (value) =>
    value === 0 || value === 1 ? value : value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  assert.equal(scene.validate_scene(document), true);
  for (const time of [1, 0, 0.5, -0.25, 0.25, 1]) {
    const result = toJsData(binding.resolve_scene(document, descriptors, time));
    const t = Math.max(0, Math.min(1, time));
    assert.deepEqual(result.nodes[0].content[1], {
      ...before.nodes[0].content[1],
      fill: { r: encode(t), g: encode(1 - t), b: encode(0.25 + t * 0.5), a: before.nodes[0].content[1].fill.a },
    });
  }
  for (const reference of references) {
    assert.equal(scene.valid_binding_$q_(reference, rect.get(tag("content"))), true);
    assert.equal(scene.valid_binding_$q_(reference, nodes.get(0).get(tag("content"))), false);
  }
  const duplicate = document.assoc(
    tag("nodes"),
    list([rect.assoc(tag("bindings"), list([references[0], references[0]]))]),
  );
  assert.throws(() => binding.resolve_scene(duplicate, descriptors, 0.5));
  const invalid = make(motion.ScalarDescriptor, {
    id: "linear-red",
    version: 1,
    motion: E(motion.ScalarMotion, "constant", 1.1),
  });
  assert.throws(() => binding.resolve_scene(document, list([invalid, ...tweens.slice(1)]), 0));
  assert.deepEqual(toJsData(document), before);
});

test("Scene binding samples absolute time and retains serializable references", () => {
  for (const [time, expectedX] of [
    [1, 120],
    [0, 80],
    [0.5, 100],
    [-0.25, 80],
    [0.25, 90],
    [1, 120],
  ]) {
    const bound = toJsData(boundSceneDocumentAt(time));
    const reference = toJsData(sceneDocumentAt(time));
    assert.deepEqual(
      bound.nodes.map((node) => node.content),
      reference.nodes.map((node) => node.content),
    );
    assert.equal(bound.nodes[1].content[1].x, expectedX);
    assert.deepEqual(bound.nodes[1].bindings, [{ "motion-id": "badge-x", target: ["x"], version: 1 }]);
    assert.deepEqual(JSON.parse(JSON.stringify(bound)), bound);
  }
});
