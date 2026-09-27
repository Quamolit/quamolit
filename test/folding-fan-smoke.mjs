import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as data } from "../target/js/folding-fan/calcit.core.mjs";
import { initial, toggle, fold_value as foldValue, slices_at as slicesAt } from "../target/js/folding-fan/quamolit.examples.folding-fan.mjs";

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
