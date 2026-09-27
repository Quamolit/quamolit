import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as data, assoc, init_tags as tags, _$n_list_$o_nth as listNth, _$n_enum_$o_assoc as enumAssoc, _$n_enum_$o_nth as enumNth } from "../target/js/folding-fan/calcit.core.mjs";
import { initial, toggle, fold_value as foldValue, slices_at as slicesAt, scene_at as sceneAt, draw_$x_ as draw } from "../target/js/folding-fan/quamolit.examples.folding-fan.mjs";
import { validate_scene as validateScene } from "../target/js/folding-fan/quamolit.scene-ir.mjs";
import { diff_scene as diffScene } from "../target/js/folding-fan/quamolit.scene-diff.mjs";
import { draw_document_$x_ as drawDocument } from "../target/js/folding-fan/quamolit.canvas-images.mjs";

const field = tags(["nodes", "content", "source", "version"]);
function withFirstImageVersion(document, version) {
  const nodes = document.nthAt(0, field.nodes);
  const node = listNth(nodes, 0);
  const content = node.nthAt(1, field.content);
  const image = enumNth(content, 1);
  const source = image.nthAt(6, field.source);
  const changedImage = assoc(image, field.source, assoc(source, field.version, version));
  const changedNode = assoc(node, field.content, enumAssoc(content, 1, changedImage));
  return assoc(document, field.nodes, assoc(nodes, 0, changedNode));
}

test("原图 24 个纵向切片覆盖 650 像素，顺序和角度对称", () => {
  const start = initial(), closed = data(slicesAt(start, 0));
  assert.equal(closed.length, 24);
  assert.deepEqual(closed.map(piece => piece.index), Array.from({ length: 24 }, (_, i) => i));
  for (const piece of closed) {
    assert.ok(Math.abs(piece["source-x"] - piece.index * 650 / 24) < 1e-10);
    assert.ok(Math.abs(piece["source-width"] - 650 / 24) < 1e-10);
    assert.equal(Math.abs(piece.angle), 0);
  }
  const opened = data(slicesAt(toggle(start, 0), 0.36));
  assert.ok(opened[0].angle < 0 && opened[23].angle > 0);
  assert.ok(Math.abs(opened[0].angle + opened[23].angle) < 1e-12);
  assert.ok(Math.abs(opened[23]["source-x"] + opened[23]["source-width"] - 650) < 1e-10);
});

test("绝对时间乱序重采样和 Toggle 中途打断连续", () => {
  const opening = toggle(initial(), 0);
  assert.equal(foldValue(opening, 0), 0);
  assert.equal(foldValue(opening, 0.18), 0.5);
  assert.equal(foldValue(opening, 0.36), 1);
  const atMid = data(slicesAt(opening, 0.18));
  assert.deepEqual(data(slicesAt(opening, 0.18)), atMid);
  assert.equal(foldValue(opening, 0), 0);
  const closing = toggle(opening, 0.18);
  assert.equal(foldValue(closing, 0.18), 0.5);
  assert.deepEqual(data(slicesAt(closing, 0.18)), atMid);
  assert.equal(foldValue(closing, 0.54), 0);
  assert.throws(() => toggle(opening, -0.1));
});

test("折扇图片以纯数据 Scene 表达，时间变化仅标记几何", () => {
  const opening = toggle(initial(), 0);
  const closedScene = sceneAt(opening, 0);
  const midScene = sceneAt(opening, 0.18);
  assert.equal(validateScene(closedScene), true);
  assert.equal(validateScene(midScene), true);
  const closed = data(closedScene), mid = data(midScene);
  assert.deepEqual(JSON.parse(JSON.stringify(mid)), mid);
  assert.equal(mid.nodes.length, 24);
  assert.deepEqual(mid.nodes.map(node => node.id), Array.from({ length: 24 }, (_, i) => `fan-slice-${i}`));
  for (const [i, node] of mid.nodes.entries()) {
    assert.deepEqual(node.content[0], "image");
    assert.deepEqual(node.content[1].source, { id: "lotus", version: 1, width: 650, height: 432 });
    assert.ok(Math.abs(node.content[1].sx - i * 650 / 24) < 1e-10);
    assert.equal(node.content[1].sw, 650 / 24);
    assert.equal(node.content[1].sh, 432);
    assert.equal(node.content[1].dh, 432);
  }
  const delta = data(diffScene(closedScene, midScene, 0, 0.18));
  assert.equal(delta["time-changed"], true);
  assert.equal(delta.changes.length, 24);
  assert.ok(delta.changes.every(([kind, , flags]) => kind === "updated" && flags.geometry && !flags.resources && !flags.properties));
  const sameFrame = data(diffScene(midScene, sceneAt(opening, 0.18), 0.18, 0.18));
  assert.deepEqual(sameFrame, { changes: [], "time-changed": false });
  const versioned = withFirstImageVersion(midScene, 2);
  assert.equal(validateScene(versioned), true);
  const resourceDelta = data(diffScene(midScene, versioned, 0.18, 0.18));
  assert.equal(resourceDelta.changes.length, 1);
  assert.equal(resourceDelta.changes[0][0], "updated");
  assert.equal(resourceDelta.changes[0][2].resources, true);
  assert.equal(resourceDelta.changes[0][2].geometry, false);
});

test("图片参考绘制保持声明层序，预检失败不会画出半帧", () => {
  const calls = [];
  const context = Object.fromEntries(["save", "transform", "drawImage", "restore"].map(name => [name, (...args) => calls.push([name, ...args])]));
  const image = { naturalWidth: 650, naturalHeight: 432 };
  const opening = toggle(initial(), 0);
  draw(context, image, opening, 0.18);
  assert.equal(calls.length, 24 * 4);
  for (let i = 0; i < 24; i += 1) {
    const frame = calls.slice(i * 4, i * 4 + 4);
    assert.deepEqual(frame.map(([name]) => name), ["save", "transform", "drawImage", "restore"]);
    assert.equal(frame[2][1], image);
    assert.ok(Math.abs(frame[2][2] - i * 650 / 24) < 1e-10);
    assert.equal(frame[2][4], 650 / 24);
  }
  calls.length = 0;
  assert.throws(() => draw(context, { naturalWidth: 0, naturalHeight: 0 }, opening, 0.18), /image-size-mismatch/);
  assert.equal(calls.length, 0);
  const versioned = withFirstImageVersion(sceneAt(opening, 0.18), 2);
  assert.throws(() => drawDocument(context, versioned, (id, version) => version === 1 ? image : null), /missing-image-resource/);
  assert.equal(calls.length, 0);
});
