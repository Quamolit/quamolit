import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { scene_document_at as sceneDocumentAt } from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import { CanvasInstanceBatches } from "../src/host/canvas-instance-batches.mjs";
import { InstanceSourceRegistry } from "../src/host/instance-sources.mjs";

function fixture() {
  return toJsData(sceneDocumentAt(0.5)).nodes.find((node) => node.content[0] === "instances").content[1];
}

function fakeContext() {
  return {
    fillStyle: "#ffffff", globalAlpha: 1, calls: 0,
    save() { this.saved = [this.fillStyle, this.globalAlpha]; },
    restore() { [this.fillStyle, this.globalAlpha] = this.saved; },
    fillRect() { this.calls++; },
  };
}

test("10k instances use one batch call per warm frame, not 20k scalar reads", () => {
  const instance = fixture();
  const registry = new InstanceSourceRegistry();
  const positions = new Float32Array(instance.source.count * 2);
  positions[0] = 40;
  positions[1] = 50;
  registry.register(instance.source, positions);
  const batches = new CanvasInstanceBatches(registry);
  const context = fakeContext();
  const cold = batches.draw(context, instance);
  assert.deepEqual(cold, {
    boundaryCalls: 1, canvasCalls: 10000, instances: 10000, positionBytesRead: 80000,
    frameBoundaryCalls: 2, positionBytesCopied: 80000,
  });
  const warm = batches.draw(context, instance);
  assert.equal(warm.frameBoundaryCalls, 1);
  assert.equal(warm.positionBytesCopied, 0);
  assert.equal(warm.canvasCalls, 10000);
  assert.equal(context.calls, 20000, "Canvas still draws each rectangle; no GPU claim");
  assert.equal(context.fillStyle, "#ffffff");
  assert.equal(context.globalAlpha, 1);
  const dirty = batches.draw(context, instance, 1, 0, 1);
  assert.equal(dirty.frameBoundaryCalls, 1);
  assert.equal(dirty.positionBytesRead, 8);
  assert.equal(dirty.canvasCalls, 1);
  assert.equal(context.calls, 20001);
});

test("source version changes copy once; released source cannot use stale cached batch", () => {
  const instance = fixture();
  const registry = new InstanceSourceRegistry();
  const batches = new CanvasInstanceBatches(registry);
  const context = fakeContext();
  registry.register(instance.source, new Float32Array(instance.source.count * 2));
  batches.draw(context, instance);
  const newer = { ...instance, source: { ...instance.source, version: 2 } };
  registry.register(newer.source, new Float32Array(newer.source.count * 2));
  assert.equal(batches.draw(context, newer).positionBytesCopied, 80000);
  assert.equal(batches.draw(context, newer).positionBytesCopied, 0);
  assert.equal(registry.release(instance.source), true);
  assert.throws(() => batches.draw(context, instance), /unavailable/);
});

test("invalid color or alpha cannot partially paint", () => {
  const instance = fixture();
  const registry = new InstanceSourceRegistry();
  registry.register(instance.source, new Float32Array(instance.source.count * 2));
  const batches = new CanvasInstanceBatches(registry);
  const context = fakeContext();
  assert.throws(() => batches.draw(context, { ...instance, fill: { ...instance.fill, r: 2 } }), /fill r/);
  assert.throws(() => batches.draw(context, instance, Number.NaN), /alpha/);
  assert.equal(context.calls, 0);
});
