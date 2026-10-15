import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/component/calcit.core.mjs";
import { scene_at as sceneAt, declare_badge } from "../target/js/component/quamolit.test.component-fixture.mjs";
import * as core from "../target/js/component/calcit.core.mjs";
import * as motion from "../target/js/component/quamolit.motion.mjs";
import * as scene from "../target/js/component/quamolit.scene-ir.mjs";
import * as component from "../target/js/component/quamolit.component-sample.mjs";

function rectAt(time, model = 40, ready = false, viewport = 100) {
  const scene = toJsData(sceneAt(time, model, ready, viewport));
  assert.equal(scene.nodes.length, 1);
  assert.equal(scene.nodes[0].content[0], "rect");
  return scene.nodes[0].content[1];
}

test("声明式组件可乱序采样，且完整输入在同一时间失效", () => {
  assert.deepEqual(
    [1, 0, 0.5, 0.25, 1].map((time) => rectAt(time).x),
    [120, 80, 100, 90, 120],
  );
  assert.equal(rectAt(0.5).y, 62);
  assert.equal(rectAt(0.5, 41).y, 63);
  assert.equal(rectAt(0.5, 40, true).fill.g, 0.7);
  assert.equal(rectAt(0.5, 40, false, 110).width, 11);
  assert.deepEqual(
    JSON.parse(JSON.stringify(toJsData(sceneAt(0.5, 40, false, 100)))),
    toJsData(sceneAt(0.5, 40, false, 100)),
  );
});

test("标准颜色声明由 Calcit 展开为线性光 RGB 与独立 alpha，保留原位置绑定", () => {
  const tag = (name) => core.init_tags([name])[name];
  const make = (type, fields) =>
    core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([key, value]) => [tag(key), value]));
  const en = (type, name, ...values) => core._PCT__$o__$o_(type, tag(name), ...values);
  const from = make(motion.ColorRgba, { r: 0.15, g: 0.9, b: 0, a: 0.2 });
  const to = make(motion.ColorRgba, { r: 0.8, g: 0.1, b: 1, a: 0.85 });
  const original = declare_badge(10, 40, 2, false, 100);
  const before = toJsData(original);
  const decode = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  const encode = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  let seed = 17;
  const times = [1, 0, 0.5, 0.25, 1, -0.1, 1.1];
  for (let i = 0; i < 20; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    times.push(seed / 2 ** 32);
  }
  for (const easing of ["linear", "smoothstep"]) {
    for (const duration of [1, 0]) {
      const descriptor = make(motion.ColorDescriptor, {
        id: "badge-color",
        version: 2,
        motion: en(
          motion.ColorMotion,
          "tween",
          make(motion.ColorTween, {
            from,
            to,
            start: 0,
            duration,
            easing: en(motion.Easing, easing),
          }),
        ),
      });
      const declaration = component.with_rect_color_motion(original, "badge", descriptor);
      const plain = toJsData(declaration);
      assert.equal(plain.motions.length, 5);
      assert.deepEqual(
        plain.scene.nodes[0].bindings.map((x) => x.target[0]),
        ["x", "linear-red", "linear-green", "linear-blue", "alpha"],
      );
      assert.ok(plain.motions.slice(1).every((x) => x.version === 2));
      for (const time of times) {
        const actual = toJsData(component.resolve_declaration(declaration, time)).nodes[0].content[1];
        const reference = toJsData(motion.sample_color(descriptor, time));
        let t = duration === 0 ? (time < 0 ? 0 : 1) : Math.max(0, Math.min(1, time));
        if (easing === "smoothstep") t = t * t * (3 - 2 * t);
        for (const channel of ["r", "g", "b", "a"]) {
          const f = toJsData(from)[channel],
            end = toJsData(to)[channel];
          const expected = channel === "a" ? f + (end - f) * t : encode(decode(f) + (decode(end) - decode(f)) * t);
          assert.ok(Math.abs(actual.fill[channel] - expected) < 1e-12, `${easing}/${duration}/${time}/${channel}`);
          assert.ok(Math.abs(actual.fill[channel] - reference[channel]) < 1e-12);
        }
        assert.equal(actual.x, 80 + 40 * Math.max(0, Math.min(1, time)));
      }
      assert.throws(() => component.with_rect_color_motion(declaration, "badge", descriptor));
      const generated = declaration.get(tag("motions")).get(1);
      const collision = original.assoc(tag("motions"), original.get(tag("motions")).append(generated));
      assert.throws(() => component.with_rect_color_motion(collision, "badge", descriptor));
    }
  }
  const constant = make(motion.ColorDescriptor, {
    id: "solid",
    version: 0,
    motion: en(motion.ColorMotion, "constant", from),
  });
  const solid = component.with_rect_color_motion(original, "badge", constant);
  for (const time of times) {
    const actual = toJsData(component.resolve_declaration(solid, time)).nodes[0].content[1].fill;
    for (const channel of ["r", "g", "b", "a"]) assert.ok(Math.abs(actual[channel] - toJsData(from)[channel]) < 1e-12);
  }
  assert.throws(() => component.with_rect_color_motion(original, "absent", constant), /rect-color-node-required/);
  const node = original.get(tag("scene")).get(tag("nodes")).get(0);
  const group = node
    .assoc(
      tag("content"),
      en(
        scene.SceneContent,
        "group",
        make(scene.GroupNode, {
          transform: make(scene.Matrix2D, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
          opacity: 1,
          clip: en(scene.ClipSpec, "none"),
        }),
      ),
    )
    .assoc(tag("bindings"), new core.CalcitSliceList([]));
  const nonRect = original.assoc(
    tag("scene"),
    original.get(tag("scene")).assoc(tag("nodes"), new core.CalcitSliceList([group])),
  );
  assert.equal(scene.validate_scene(nonRect.get(tag("scene"))), true);
  assert.throws(() => component.with_rect_color_motion(nonRect, "badge", constant), /rect-color-requires-rect/);
  const alphaBinding = make(scene.ScalarBinding, {
    target: en(scene.ScalarTarget, "alpha"),
    "motion-id": "presence-alpha",
    version: 1,
  });
  const alphaDescriptor = make(motion.ScalarDescriptor, {
    id: "presence-alpha",
    version: 1,
    motion: en(motion.ScalarMotion, "constant", 0.5),
  });
  const occupied = original
    .assoc(
      tag("scene"),
      original
        .get(tag("scene"))
        .assoc(
          tag("nodes"),
          new core.CalcitSliceList([node.assoc(tag("bindings"), node.get(tag("bindings")).append(alphaBinding))]),
        ),
    )
    .assoc(tag("motions"), original.get(tag("motions")).append(alphaDescriptor));
  assert.equal(toJsData(component.resolve_declaration(occupied, 0)).nodes[0].content[1].fill.a, 0.5);
  assert.throws(() => component.with_rect_color_motion(occupied, "badge", constant));
  for (const invalid of [
    constant.assoc(tag("id"), ""),
    constant.assoc(tag("version"), -1),
    constant.assoc(tag("motion"), en(motion.ColorMotion, "constant", from.assoc(tag("r"), 1.1))),
  ]) {
    assert.throws(() => component.with_rect_color_motion(original, "badge", invalid));
  }
  assert.deepEqual(toJsData(original), before);
});
