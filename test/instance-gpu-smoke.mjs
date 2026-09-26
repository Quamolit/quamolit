import assert from "node:assert/strict";
import { test } from "node:test";
import { _$n__PCT__$M_ as structWith, init_tags as initTags, to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { InstanceNode, InstanceSource } from "../target/js/motion/quamolit.scene-ir.mjs";
import { ColorRgba } from "../target/js/motion/quamolit.motion.mjs";
import { create_table_$x_ as createTable, register_$x_ as register } from "../target/js/motion/quamolit.instance-resource.mjs";
import { draw_source_$x_ as drawSource, upload_source_$x_ as uploadSource } from "../target/js/motion/quamolit.instance-gpu.mjs";

const tags = initTags(["id", "version", "count", "source", "width", "height", "fill", "r", "g", "b", "a"]);
const source = (id, version, count) => structWith(InstanceSource, tags.id, id, tags.version, version, tags.count, count);
const node = (id, version, count) => structWith(InstanceNode, tags.source, source(id, version, count), tags.width, 3, tags.height, 3, tags.fill, structWith(ColorRgba, tags.r, 0.9, tags.g, 0.3, tags.b, 0.1, tags.a, 1));
const fakeBatch = () => ({
  uploads: 0, draws: 0, bytes: 0,
  upload(positions, start, count) {
    assert.ok(positions instanceof Float32Array, "GPU 上传收到 Float32 快照");
    assert.equal(start, 0);
    this.uploads++; this.bytes += count * 8;
    return { positionBytesUploaded: count * 8 };
  },
  draw(options) {
    this.draws++;
    assert.equal(options.width, 3);
    assert.equal(options.height, 3);
    return { drawCalls: options.count > 0 ? 1 : 0, instances: options.count, positionBytesUploaded: 0, uniformBytesUploaded: 0, pipelinesCreated: 0, buffersCreated: 0 };
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

test("draw-source! 按版本上传并绘制整个实例层，热帧只重绘不重传", () => {
  const table = createTable();
  register(table, source("points", 1, 2), new Float32Array([10, 20, 30, 40]));
  const batch = fakeBatch();
  assert.deepEqual(toJsData(drawSource(-1, batch, table, node("points", 1, 2))), {
    version: 1, "uploaded?": true, "upload-bytes": 16, instances: 2, "draw-calls": 1,
  });
  assert.equal(batch.uploads, 1);
  assert.equal(batch.draws, 1);
  assert.deepEqual(toJsData(drawSource(1, batch, table, node("points", 1, 2))), {
    version: 1, "uploaded?": false, "upload-bytes": 0, instances: 2, "draw-calls": 1,
  });
  assert.equal(batch.uploads, 1, "同版本热帧只重绘不重传");
  assert.equal(batch.draws, 2);
  register(table, source("points", 2, 3), new Float32Array([1, 2, 3, 4, 5, 6]));
  assert.deepEqual(toJsData(drawSource(1, batch, table, node("points", 2, 3))), {
    version: 2, "uploaded?": true, "upload-bytes": 24, instances: 3, "draw-calls": 1,
  });
  assert.equal(batch.uploads, 2);
  assert.equal(batch.bytes, 40, "累计上传字节按版本而非帧数增长");
});
