import { test } from "node:test";
import assert from "node:assert/strict";
import { InstanceSourceRegistry } from "../instance-sources.mjs";
import { WebGpuInstanceBatches } from "../webgpu-instance-batches.mjs";
import { instanceGrid } from "./instance-grid.mjs";

test("WebGPU thin adapter reuses immutable source copies and only uploads changed versions", () => {
  const registry = new InstanceSourceRegistry();
  const source1 = { id: "grid", version: 1, count: 10000 };
  const source2 = { ...source1, version: 2 };
  const raw1 = instanceGrid(10000, 40);
  const raw2 = instanceGrid(10000, 60);
  registry.register(source1, raw1);
  registry.register(source2, raw2);
  raw1[0] = 200;
  const uploads = [];
  const draws = [];
  let disposed = 0;
  const backend = {
    upload(positions) {
      uploads.push(positions);
      return { positionBytesUploaded: positions.byteLength };
    },
    draw(options) {
      draws.push(options);
      return { drawCalls: 1, instances: uploads.at(-1).length / 2, positionBytesUploaded: draws.length === 1 ? 80000 : 0 };
    },
    dispose() { disposed++; return disposed === 1; },
  };
  const layer = new WebGpuInstanceBatches(registry, backend);
  const shape = (source) => ({ source, width: 1, height: 1, fill: { r: 1, g: 0, b: 0, a: 1 } });
  assert.equal(layer.draw(shape(source1)).positionBytesCopied, 80000);
  assert.equal(uploads[0][0], 40);
  const translated = { from: { x: 0, y: 0 }, to: { x: 10, y: 0 }, time: 0.5, start: 0, duration: 1, easing: "linear" };
  assert.equal(layer.draw(shape(source1), 0.5, translated).positionBytesCopied, 0);
  assert.equal(uploads.length, 1);
  assert.equal(draws[1].alpha, 0.5);
  assert.equal(draws[1].translation, translated);
  layer.clear();
  assert.equal(draws.at(-1).count, 0);
  assert.equal(uploads.length, 1);
  assert.equal(layer.draw(shape(source1), 0.5).positionBytesCopied, 0);
  assert.equal(uploads.length, 1);
  assert.equal(layer.draw(shape(source2)).positionBytesCopied, 80000);
  assert.equal(uploads[1][0], 60);
  assert.equal(layer.draw(shape(source1)).positionBytesCopied, 0);
  assert.equal(uploads.length, 3); // One GPU buffer: switching versions reuploads, but never recopies the source.
  assert.equal(uploads[2], uploads[0]);
  registry.release(source1);
  assert.throws(() => layer.draw(shape(source1)), /unavailable/);
  assert.equal(layer.dispose(), true);
  assert.equal(layer.dispose(), false);
});
