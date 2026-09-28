import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/solar/calcit.core.mjs";
import {
  circle_points as circlePoints,
  scene_at as sceneAt,
  draw_$x_ as draw,
} from "../target/js/solar/quamolit.examples.solar.mjs";
import { validate_scene as validateScene } from "../target/js/solar/quamolit.scene-ir.mjs";
import { diff_scene as diffScene } from "../target/js/solar/quamolit.scene-diff.mjs";

test("五层递归轨道保留稳定身份与原生圆体", () => {
  const scene = toJsData(sceneAt(0));
  assert.equal(validateScene(sceneAt(0)), true);
  assert.equal(scene.nodes.length, 10);
  assert.deepEqual(
    scene.nodes.map((node) => node.id),
    Array.from({ length: 5 }, (_, level) => [`solar-large-${level}`, `solar-small-${level}`]).flat(),
  );
  for (const node of scene.nodes) {
    assert.equal(node.content[0], "circle");
    assert.ok(node.content[1].radius > 0);
  }
  const large = scene.nodes[0].content[1],
    small = scene.nodes[1].content[1];
  assert.deepEqual(large.fill, { r: 0.8533333333, g: 0.96, b: 0.64, a: 1 });
  assert.deepEqual(large.stroke, { r: 0.44, g: 0.6533333333, b: 0.76, a: 0.5 });
  assert.equal(large.width, 1);
  assert.deepEqual(small.fill, { r: 0.64, g: 0.8533333333, b: 0.96, a: 1 });
  assert.equal(small.width, 0);
  assert.deepEqual(toJsData(circlePoints(0, 0, 60))[0], { x: 60, y: 0 });
  assert.deepEqual([scene.nodes[1].content[1].cx, scene.nodes[1].content[1].cy], [100, -40]);
  assert.deepEqual(
    [scene.nodes[2].content[1].cx, scene.nodes[2].content[1].cy],
    [156, 24],
    "递归偏移受 0.6 倍缩放约束",
  );
});

test("填充图元参与 Scene 差分并按层序执行原生 Canvas arc/fill/stroke", () => {
  const delta = toJsData(diffScene(sceneAt(0), sceneAt(3), 0, 3));
  assert.ok(delta.changes.some((change) => change[0] === "updated" && change[2].geometry));
  const calls = [];
  const context = {
    fillStyle: "initial-fill",
    strokeStyle: "initial-stroke",
    lineWidth: 7,
    save() {
      this.saved = [this.fillStyle, this.strokeStyle, this.lineWidth];
    },
    restore() {
      [this.fillStyle, this.strokeStyle, this.lineWidth] = this.saved;
    },
    beginPath() {
      calls.push("begin");
    },
    arc() {
      calls.push("arc");
    },
    closePath() {},
    fill() {
      calls.push("fill");
    },
    stroke() {
      calls.push("stroke");
    },
  };
  draw(context, 0);
  assert.equal(calls.filter((call) => call === "arc").length, 10);
  assert.equal(calls.filter((call) => call === "fill").length, 10);
  assert.equal(calls.filter((call) => call === "stroke").length, 5);
  assert.deepEqual(calls.slice(0, 6), ["begin", "arc", "fill", "stroke", "begin", "arc"]);
  assert.deepEqual([context.fillStyle, context.strokeStyle, context.lineWidth], ["initial-fill", "initial-stroke", 7]);
});

test("旧 48 边圆在 4 倍放大与 DPR2 下超过 1px，原生圆弧消除分段边界", () => {
  const logicalError = 60 * (1 - Math.cos(Math.PI / 48));
  assert.ok(logicalError > 0.128 && logicalError < 0.129);
  assert.ok(logicalError * 4 * 2 > 1, `旧圆边界误差应超过 1 设备像素，实际 ${logicalError * 8}`);
});

test("绝对时间可乱序重复采样，不依赖上一帧", () => {
  const initial = toJsData(sceneAt(0));
  const later = toJsData(sceneAt(3));
  assert.notDeepEqual(
    [later.nodes[1].content[1].cx, later.nodes[1].content[1].cy],
    [initial.nodes[1].content[1].cx, initial.nodes[1].content[1].cy],
  );
  assert.deepEqual(toJsData(sceneAt(0)), initial);
  assert.deepEqual(toJsData(sceneAt(3)), later);
});
