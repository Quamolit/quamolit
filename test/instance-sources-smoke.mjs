import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { scene_document_at as sceneDocumentAt } from "../js-out/quamolit.test.motion-fixture.mjs";
import { float32At, float32CopyRange, float32Length } from "../.calcit/modules/js-ffi/typed-arrays.mjs";
import { InstanceSourceRegistry } from "../instance-sources.mjs";

function sceneSource() {
  const wire = toJsData(sceneDocumentAt(0.5));
  assert.equal(wire.nodes.length, 3);
  const instances = wire.nodes.filter((node) => node.content[0] === "instances");
  assert.equal(instances.length, 1);
  return instances[0].content[1].source;
}

test("one serializable Scene node resolves 10,000 copied positions", () => {
  const source = sceneSource();
  assert.deepEqual(source, { id: "particles", version: 1, count: 10000 });
  const positions = new Float32Array(source.count * 2);
  positions[0] = 40;
  positions[1] = 50;
  const registry = new InstanceSourceRegistry();
  const token = registry.register(source, positions);
  positions[0] = 900;
  assert.equal(registry.resolve(source), token);
  assert.equal(float32Length(token), 20000);
  assert.equal(float32At(token, 0), 40);
  const upload = float32CopyRange(token, 0, 2);
  upload[0] = 700;
  assert.equal(float32At(registry.resolve(source), 0), 40);
  assert.equal(registry.liveCount, 1);
  assert.equal(JSON.stringify(source).includes("Float32Array"), false);
});

test("version change cannot silently reuse a mutable source", () => {
  const source = sceneSource();
  const registry = new InstanceSourceRegistry();
  const first = new Float32Array(source.count * 2);
  first[0] = 40;
  registry.register(source, first);
  first[0] = 60;
  assert.throws(() => registry.register(source, first), /version must exceed/);
  const next = { ...source, version: 2 };
  const second = registry.register(next, first);
  assert.equal(float32At(registry.resolve(source), 0), 40);
  assert.equal(float32At(second, 0), 60);
  assert.equal(registry.liveCount, 2);
  assert.equal(registry.release(source), true);
  assert.throws(() => registry.resolve(source), /unavailable/);
  assert.throws(() => registry.register(source, first), /version must exceed/);
  assert.equal(registry.resolve(next), second);
});

test("bad descriptors and buffers fail at the host boundary", () => {
  const source = sceneSource();
  const registry = new InstanceSourceRegistry();
  assert.throws(() => registry.register({ ...source, count: 1.5 }, new Float32Array(3)), /count/);
  assert.throws(() => registry.register(source, new Float32Array(3)), /interleaved/);
  assert.throws(() => registry.register(source, new Float32Array([Number.NaN])), /non-finite/);
  assert.throws(() => registry.register(source, new Float64Array(source.count * 2)), /Float32Array/);
  assert.throws(() => registry.resolve({ ...source, version: 2 }), /unavailable/);
  assert.equal(registry.liveCount, 0);
});
