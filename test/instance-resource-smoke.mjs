import assert from "node:assert/strict";
import { test } from "node:test";
import { _$n__PCT__$M_ as structWith, init_tags as initTags } from "../target/js/motion/calcit.core.mjs";
import { InstanceSource } from "../target/js/motion/quamolit.scene-ir.mjs";
import {
  create_table_$x_ as createTable,
  live_count as liveCount,
  patch_info as patchInfo,
  register_$x_ as register,
  register_patch_$x_ as registerPatch,
  release_$x_ as release,
  resolve,
} from "../target/js/motion/quamolit.instance-resource.mjs";

const tags = initTags(["id", "version", "count", "available?", "base-version", "start", "positions"]);
const source = (id, version, count) => structWith(InstanceSource, tags.id, id, tags.version, version, tags.count, count);

test("版本化实例源表复制、解析、释放并回到 live 基线", () => {
  const table = createTable();
  assert.equal(liveCount(table), 0);
  const positions = new Float32Array([1, 2, 3, 4]);
  const snapshot = register(table, source("points", 1, 2), positions);
  assert.equal(liveCount(table), 1);
  positions[0] = 99; // 登记后修改原数组不影响已登记快照
  const resolved = resolve(table, source("points", 1, 2));
  assert.deepEqual(Array.from(resolved), [1, 2, 3, 4]);
  assert.equal(resolved, snapshot, "解析返回同一不可变快照");
  assert.equal(release(table, source("points", 1, 2)), true);
  assert.equal(liveCount(table), 0);
  assert.equal(release(table, source("points", 1, 2)), false, "重复释放返回 false");
});

test("版本递增、计数与类型非法显式失败，100 次装卸回到基线", () => {
  const table = createTable();
  assert.throws(() => register(table, source("a", 1, 1), new Float32Array(1)), /needs 2/);
  assert.throws(() => register(table, source("a", 1, 1), [1, 2]), /Float32Array/);
  register(table, source("a", 1, 1), new Float32Array([0, 0]));
  assert.throws(() => register(table, source("a", 1, 1), new Float32Array([0, 0])), /must exceed/);
  assert.throws(() => resolve(table, source("a", 2, 1)), /unavailable/);
  assert.equal(release(table, source("a", 1, 1)), true);
  for (let version = 2; version <= 101; version++) {
    register(table, source("a", version, 1), new Float32Array([version, 0]));
    assert.equal(liveCount(table), 1);
    assert.equal(release(table, source("a", version, 1)), true);
    assert.equal(liveCount(table), 0);
  }
});

test("10k 实例版本只复制脏范围，跳版本解析与释放后仍正确", () => {
  const table = createTable(), count = 10000;
  const base = source("grid", 1, count), next = source("grid", 2, count), third = source("grid", 3, count);
  register(table, base, new Float32Array(count * 2));
  const segment = new Float32Array([42, 43]);
  assert.equal(registerPatch(table, next, 1, 5000, segment), 8);
  segment[0] = 99;
  const patch = patchInfo(table, next);
  assert.equal(patch.get(tags["available?"]), true);
  assert.equal(patch.get(tags["base-version"]), 1);
  assert.equal(patch.get(tags.start), 5000);
  const borrowed = patch.get(tags.positions);
  assert.deepEqual(Array.from(borrowed), [42, 43]);
  borrowed[0] = 77;
  assert.deepEqual(Array.from(resolve(table, next).slice(10000, 10002)), [42, 43]);
  assert.equal(registerPatch(table, third, 2, 5001, new Float32Array([44, 45])), 8);
  assert.equal(release(table, base), true);
  assert.equal(release(table, next), true);
  assert.equal(liveCount(table), 1);
  assert.deepEqual(Array.from(resolve(table, third).slice(10000, 10004)), [42, 43, 44, 45]);
  assert.equal(release(table, third), true);
  assert.equal(liveCount(table), 0);
});

test("补丁越界、错误基版、非有限或共享输入不得登记版本", () => {
  const table = createTable(), base = source("grid", 1, 2), next = source("grid", 2, 2);
  register(table, base, new Float32Array([0, 0, 1, 1]));
  assert.equal(patchInfo(table, base).get(tags["available?"]), false);
  assert.throws(() => registerPatch(table, next, 0, 0, new Float32Array([2, 2])), /unavailable/);
  assert.throws(() => registerPatch(table, next, 1, 2, new Float32Array([2, 2])), /exceeds/);
  assert.throws(() => registerPatch(table, next, 1, 0, new Float32Array([NaN, 2])), /non-finite/);
  assert.throws(() => registerPatch(table, next, 1, 0, new Float32Array(3)), /interleaved/);
  if (typeof SharedArrayBuffer !== "undefined") assert.throws(() => registerPatch(table, next, 1, 0, new Float32Array(new SharedArrayBuffer(8))), /non-shared/);
  assert.equal(registerPatch(table, next, 1, 0, new Float32Array([2, 2])), 8, "失败不能占用版本号");
});

test("1000 次单实例版本推进不逐次物化整层，末版可一次解析", () => {
  const table = createTable(), count = 10000;
  register(table, source("chain", 1, count), new Float32Array(count * 2));
  let copiedBytes = 0;
  for (let version = 2; version <= 1001; version++) {
    copiedBytes += registerPatch(table, source("chain", version, count), version - 1, 5000, new Float32Array([version, 50]));
    assert.equal(release(table, source("chain", version - 1, count)), true);
    assert.equal(liveCount(table), 1);
  }
  assert.equal(copiedBytes, 8000);
  assert.deepEqual(Array.from(resolve(table, source("chain", 1001, count)).slice(10000, 10002)), [1001, 50]);
  assert.equal(release(table, source("chain", 1001, count)), true);
  assert.equal(liveCount(table), 0);
});
