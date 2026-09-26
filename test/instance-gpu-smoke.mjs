import assert from "node:assert/strict";
import { test } from "node:test";
import { _$n__PCT__$M_ as structWith, init_tags as initTags, to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { InstanceSource } from "../target/js/motion/quamolit.scene-ir.mjs";
import { create_table_$x_ as createTable, register_$x_ as register } from "../target/js/motion/quamolit.instance-resource.mjs";
import { upload_source_$x_ as uploadSource } from "../target/js/motion/quamolit.instance-gpu.mjs";

const tags = initTags(["id", "version", "count"]);
const source = (id, version, count) => structWith(InstanceSource, tags.id, id, tags.version, version, tags.count, count);
const fakeBatch = () => ({
  uploads: 0, bytes: 0,
  upload(positions, start, count) {
    assert.ok(positions instanceof Float32Array, "GPU 上传收到 Float32 快照");
    assert.equal(start, 0);
    this.uploads++; this.bytes += count * 8;
    return { positionBytesUploaded: count * 8 };
  },
});

test("GPU 上传按 (id,version) 只发生一次，版本变更后才重新上传", () => {
  const table = createTable();
  const positions = new Float32Array([10, 20, 30, 40]);
  register(table, source("points", 1, 2), positions);
  const batch = fakeBatch();
  assert.deepEqual(toJsData(uploadSource(-1, batch, table, source("points", 1, 2))), { version: 1, bytes: 16, "uploaded?": true });
  assert.equal(batch.uploads, 1);
  assert.deepEqual(toJsData(uploadSource(1, batch, table, source("points", 1, 2))), { version: 1, bytes: 0, "uploaded?": false });
  assert.equal(batch.uploads, 1, "同版本热帧不新增上传");
  register(table, source("points", 2, 3), new Float32Array([1, 2, 3, 4, 5, 6]));
  assert.deepEqual(toJsData(uploadSource(1, batch, table, source("points", 2, 3))), { version: 2, bytes: 24, "uploaded?": true });
  assert.equal(batch.uploads, 2);
  assert.equal(batch.bytes, 40, "累计上传字节按版本而非帧数增长");
});

test("解析缺失源显式失败，不产生上传副作用", () => {
  const table = createTable();
  const batch = fakeBatch();
  assert.throws(() => uploadSource(-1, batch, table, source("missing", 1, 1)), /unavailable/);
  assert.equal(batch.uploads, 0);
});
