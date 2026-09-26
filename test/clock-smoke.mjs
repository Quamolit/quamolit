import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/clock/calcit.core.mjs";
import { digits_at as digitsAt, scene_at as sceneAt } from "../target/js/clock/quamolit.examples.clock.mjs";

test("注入时钟决定进位与回绕，不读取墙钟", () => {
  assert.deepEqual(toJsData(digitsAt(0)), [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(toJsData(digitsAt(59)), [0, 0, 0, 0, 5, 9]);
  assert.deepEqual(toJsData(digitsAt(60)), [0, 0, 0, 1, 0, 0]);
  assert.deepEqual(toJsData(digitsAt(3599)), [0, 0, 5, 9, 5, 9]);
  assert.deepEqual(toJsData(digitsAt(3600)), [0, 1, 0, 0, 0, 0]);
  assert.deepEqual(toJsData(digitsAt(86399)), [2, 3, 5, 9, 5, 9]);
  assert.deepEqual(toJsData(digitsAt(86400)), [0, 0, 0, 0, 0, 0]);
});

test("Scene 只由绝对时间决定，重复采样一致，渐变窗口内存在部分透明度", () => {
  assert.equal(toJsData(sceneAt(60.5)).nodes.length, 32, "00:01:00 稳定帧的七段数");
  assert.equal(toJsData(sceneAt(0.5)).nodes.length, 36, "00:00:00 稳定帧的七段数");
  assert.deepEqual(toJsData(sceneAt(59.03)), toJsData(sceneAt(59.03)), "乱序/重复采样一致");
  const alphas = toJsData(sceneAt(59.03)).nodes.map(node => node.content[1].stroke.a);
  assert.ok(alphas.some(a => a > 0 && a < 1), "进位瞬间应有部分透明度的渐变笔画");
  const settled = toJsData(sceneAt(59.5)).nodes.map(node => node.content[1].stroke.a);
  assert.ok(settled.every(a => a === 0 || a === 1), "渐变窗口结束后笔画应为全开或全关");
});
