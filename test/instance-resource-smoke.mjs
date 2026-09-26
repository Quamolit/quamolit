import assert from "node:assert/strict";
import { test } from "node:test";
import { _$n__PCT__$M_ as structWith, init_tags as initTags } from "../target/js/motion/calcit.core.mjs";
import { InstanceSource } from "../target/js/motion/quamolit.scene-ir.mjs";
import {
  create_table_$x_ as createTable,
  live_count as liveCount,
  register_$x_ as register,
  release_$x_ as release,
  resolve,
} from "../target/js/motion/quamolit.instance-resource.mjs";

const tags = initTags(["id", "version", "count"]);
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
