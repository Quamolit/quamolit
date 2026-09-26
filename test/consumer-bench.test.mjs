import assert from "node:assert/strict";
import { test } from "node:test";
import { consumerBenchOptions, summarizeConsumerRun, runConsumerBench } from "./consumer-bench.mjs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("正式时长默认值与非法配置", () => {
  assert.deepEqual(consumerBenchOptions({}), { warmupSeconds: 5, durationSeconds: 30, runs: 3 });
  for (const env of [{ QUAMOLIT_BENCH_WARMUP: "-1" }, { QUAMOLIT_BENCH_DURATION: "NaN" }, { QUAMOLIT_BENCH_DURATION: "0" }, { QUAMOLIT_BENCH_RUNS: "1.5" }]) {
    assert.throws(() => consumerBenchOptions(env));
  }
});

function validRun() {
  return { result: "PASS", backend: "gpu-scalar", errors: [], pixelSize: [320, 180], devicePixelRatio: 1,
    planCounts: { declarations: 1, "plan-builds": 1 }, afterDispose: { liveBuffers: 0 }, idleRafMedianMs: 16,
    measure: { elapsedMs: 32, samples: [null, 16].map((rafIntervalMs, index) => ({ rafIntervalMs, cpuFrameMs: index + 1,
      samplePlanMs: 0, batchMs: 0, drawBoundaryMs: index + 1, queueWriteMs: 0.1, queueSubmitMs: 0.1,
      newBuffers: 0, newPipelines: 0, uniformBytes: 16, parameterBytes: 0, recordBytes: 0, submits: 1 })) } };
}
test("阶段统计、上传与长期资源反例", () => {
  const run = validRun(), result = summarizeConsumerRun(run);
  assert.equal(result.metrics.cpuFrameMs.p50, 1.5);
  assert.equal(result.totals.uniformBytes, 32);
  assert.equal(result.longIntervalFraction, 0);
  for (const [key, value] of [["newBuffers", 1], ["newPipelines", 1], ["recordBytes", 64], ["parameterBytes", 32], ["uniformBytes", 32], ["submits", 0], ["cpuFrameMs", NaN], ["rafIntervalMs", NaN], ["queueWriteMs", -1]]) {
    const broken = structuredClone(run); broken.measure.samples[1][key] = value;
    assert.throws(() => summarizeConsumerRun(broken), key);
  }
  const leaked = structuredClone(run); leaked.afterDispose.liveBuffers = 1;
  assert.throws(() => summarizeConsumerRun(leaked));
  const rebuilt = structuredClone(run); rebuilt.planCounts["plan-builds"] = 2;
  assert.throws(() => summarizeConsumerRun(rebuilt));
});

test("浏览器中断必须覆盖上一轮 PASS，不能留下成功的旧报告", async () => {
  const directory = await mkdtemp(join(tmpdir(), "quamolit-bench-failure-"));
  const path = join(directory, "bench-report.json");
  await writeFile(path, JSON.stringify({ result: "PASS", stale: true }));
  const browser = { async newContext() { throw Error("browser closed"); } };
  await assert.rejects(runConsumerBench(browser, "http://localhost/", directory, { candidate: "test" }, {}), /browser closed/);
  const report = JSON.parse(await readFile(path, "utf8"));
  assert.equal(report.result, "FAIL"); assert.equal(report.stale, undefined);
  assert.match(report.error, /browser closed/);
});
