import { test } from "node:test";
import assert from "node:assert/strict";
import { percentile, summarizeRun, compareBaseline, environmentMismatches } from "./bench-metrics.mjs";

test("percentile interpolates without mutating raw samples", () => {
  const values = [5, 1, 3];
  assert.equal(percentile(values, 0.5), 3);
  assert.equal(percentile(values, 0.95), 4.8);
  assert.deepEqual(values, [5, 1, 3]);
});

test("run summary keeps CPU work separate from rAF cadence", () => {
  const samples = [0, 1, 2].map((index) => ({ index, rafIntervalMs: index ? 16 : null, sampleMs: 1, canvasCallMs: 2, cpuFrameMs: 3 }));
  const summary = summarizeRun({ measure: { samples, elapsedMs: 50 }, setupMs: 2, firstDrawMs: 4, idleRafMedianMs: 16, checksum: 9 });
  assert.equal(summary.setupMs, 2);
  assert.equal(summary.cpuFrameMs.p95, 3);
  assert.equal(summary.rafIntervalMs.p95, 16);
  assert.equal(summary.longIntervalFraction, 0);
});

test("slow workload does not redefine the idle refresh proxy", () => {
  const samples = [0, 1, 2].map((index) => ({ index, rafIntervalMs: index ? 33 : null, sampleMs: 5, canvasCallMs: 25, cpuFrameMs: 30 }));
  const summary = summarizeRun({ measure: { samples, elapsedMs: 100 }, firstDrawMs: 30, idleRafMedianMs: 16.7, checksum: 9 });
  assert.equal(summary.longIntervalFraction, 1);
});

test("regression requires both absolute and relative thresholds", () => {
  const report = (values) => ({ runs: values.map((value) => ({ cpuFrameMs: { p95: value } })) });
  assert.equal(compareBaseline(report([11, 11, 11]), report([10, 10, 10])).regression, false);
  assert.equal(compareBaseline(report([12, 12, 12]), report([10, 10, 10])).regression, true);
  assert.equal(compareBaseline(report([0.5, 0.5, 0.5]), report([0.4, 0.4, 0.4])).regression, false);
  const noisy = compareBaseline(report([11, 99, 11]), report([10, 10, 10]));
  assert.equal(noisy.regression, false);
  assert.equal(noisy.currentMedian, 11);
  assert.throws(() => compareBaseline(report([12, 12]), report([10, 10, 10])), /3 independent runs/);
});

test("baseline comparison rejects changed workload or measurement protocol", () => {
  const environment = { fixture: "mixed-ui", count: 1_000, seed: 7, durationSeconds: 30, warmupSeconds: 5, sceneComposition: { groups: 20, nodes: 1_000 } };
  assert.deepEqual(environmentMismatches(environment, structuredClone(environment)), []);
  assert.deepEqual(environmentMismatches(environment, { ...environment, durationSeconds: 0.6, sceneComposition: { groups: 20, nodes: 1_000 } }), ["durationSeconds"]);
  assert.deepEqual(environmentMismatches(environment, { ...environment, sceneComposition: { groups: 20, nodes: 999 } }), ["sceneComposition"]);
});
