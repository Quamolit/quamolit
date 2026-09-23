import assert from "node:assert/strict";
import test from "node:test";
import { createManifest, instanceAt, sampleFixture } from "./fixtures.mjs";

test("UI fixture replays a target interruption without a position jump", () => {
  const manifest = createManifest();
  const before = sampleFixture(manifest, 0.65);
  assert.ok(Math.abs(before.ui.x - 383.919) < 1e-9);
  assert.deepEqual(before.ui.appliedEvents, ["panel-enter", "target-interrupt"]);
  assert.equal(sampleFixture(manifest, 1.2).ui.x, 220);
  assert.equal(sampleFixture(manifest, 0).ui.x, 88);
  assert.equal(sampleFixture(manifest, 0.45).ui.panelPhase, "present");
  assert.equal(sampleFixture(manifest, 1.25).ui.panelPhase, "absent");
});

test("arbitrary-time sampling and a cold manifest reload agree", () => {
  const manifest = createManifest({ seed: 123, dpr: 2 });
  const order = [1.5, 0, 0.75, 0.25, 1.5];
  for (const time of order) {
    assert.deepEqual(sampleFixture(manifest, time), sampleFixture(JSON.parse(JSON.stringify(manifest)), time));
  }
  assert.deepEqual(sampleFixture(manifest, 1.5), sampleFixture(manifest, 1.5));
  assert.equal(manifest.pixelWidth, 1280);
});

test("instance data is indexed by seed without materializing scene nodes", () => {
  const manifest = createManifest({ fixture: "instances", count: 100_000, seed: 7 });
  assert.equal(sampleFixture(manifest, 0.5).count, 100_000);
  assert.deepEqual(instanceAt(7, 999), instanceAt(7, 999));
  assert.notDeepEqual(instanceAt(7, 999), instanceAt(8, 999));
  assert.ok(instanceAt(7, 99_999).x >= 16);
});

test("invalid fixture inputs fail rather than silently altering a baseline", () => {
  assert.throws(() => createManifest({ count: 123 }), /count/);
  assert.throws(() => createManifest({ dpr: 1.5 }), /dpr/);
  assert.throws(() => createManifest({ glyphState: "missing" }), /glyphState/);
  assert.equal(sampleFixture(createManifest({ glyphState: "error" }), 0).glyphState, "error");
  assert.throws(() => createManifest({ events: [{ id: "bad", time: NaN, type: "target", value: 2, duration: 1 }] }), /finite/);
  assert.throws(() => sampleFixture(createManifest(), -1), /non-negative/);
});
