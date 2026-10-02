import assert from "node:assert/strict";
import { test } from "node:test";
import {
  consumerBenchOptions,
  summarizeConsumerRun,
  summarizeDynamicInstanceRun,
  runConsumerBench,
} from "./consumer-bench.mjs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatConsumerSummary } from "./consumer-contract.mjs";

test("关键链路摘要单列 SKIP，缺失/软件 GPU 不能伪装通过", () => {
  const evidence = { result: "PASS", adapter: { vendor: "apple", architecture: "metal-3" } };
  const report = {
    result: "PASS",
    gpuBrowser: evidence,
    gpuDualBrowser: evidence,
    gpuInstancesBrowser: { result: "SKIP", reason: "adapter-unavailable" },
    independentInstances: { browser: { result: "SKIP", reason: "software-adapter" } },
  };
  const summary = formatConsumerSummary(report);
  assert.match(summary, /PASS 2，SKIP 2，未执行 0/);
  assert.match(summary, /adapter-unavailable/);
  assert.match(summary, /software-adapter/);
  assert.match(summary, /SKIP ≠ 硬件通过/);
  assert.match(formatConsumerSummary({ result: "FAIL" }), /未执行 4/);
  assert.match(formatConsumerSummary({ result: "NOT_RUN" }), /NOT_RUN/);
  assert.throws(() => formatConsumerSummary({ result: "PASS" }), /缺少硬件专项/);
  assert.throws(() => formatConsumerSummary({ ...report, gpuBrowser: { result: "SKIP" } }), /缺少原因/);
  assert.throws(
    () => formatConsumerSummary({ ...report, gpuBrowser: { result: "PASS", adapter: { vendor: "swiftshader" } } }),
    /软件 adapter/,
  );
  assert.throws(() => formatConsumerSummary({ ...report, gpuBrowser: { result: "PASS" } }), /缺少 adapter/);
  assert.throws(
    () =>
      formatConsumerSummary({
        ...report,
        gpuBrowser: { result: "PASS", adapter: { vendor: "apple", isFallbackAdapter: true } },
      }),
    /软件 adapter/,
  );
  assert.throws(() => formatConsumerSummary({ ...report, gpuBrowser: { result: "OK" } }), /未知 GPU/);
  assert.throws(() => formatConsumerSummary({ result: "OK" }), /未知消费者/);
  const hostile = formatConsumerSummary({
    ...report,
    gpuInstancesBrowser: { result: "SKIP", reason: "<script>|\n`reason`" },
  });
  assert.ok(!hostile.includes("<script>") && !hostile.includes("`reason`"));
});

test("正式时长默认值与非法配置", () => {
  assert.deepEqual(consumerBenchOptions({}), { warmupSeconds: 5, durationSeconds: 30, runs: 3 });
  for (const env of [
    { QUAMOLIT_BENCH_WARMUP: "-1" },
    { QUAMOLIT_BENCH_DURATION: "NaN" },
    { QUAMOLIT_BENCH_DURATION: "0" },
    { QUAMOLIT_BENCH_RUNS: "1.5" },
    { QUAMOLIT_BENCH_LOAD: "static" },
    { QUAMOLIT_BENCH_SIZE: "1920x1080" },
    { QUAMOLIT_BENCH_LOAD: "independent-10k", QUAMOLIT_BENCH_SIZE: "0x180" },
  ]) {
    assert.throws(() => consumerBenchOptions(env));
  }
  assert.deepEqual(consumerBenchOptions({ QUAMOLIT_BENCH_LOAD: "independent-10k", QUAMOLIT_BENCH_SIZE: "1920x1080" }), {
    warmupSeconds: 5,
    durationSeconds: 30,
    runs: 3,
    workload: "independent-10k",
    pixelSize: [1920, 1080],
  });
});

test("同源独立实例测量拒绝热位置上传、重复帧上传与伪装画布尺寸", () => {
  const run = {
    ...validRun(),
    workload: "independent-10k",
    sourceCount: 10000,
    pixelSize: [1920, 1080],
    checksumTime: 1,
    coveredPixels: 40000,
    beforeDispose: { liveVersions: 0 },
    afterDispose: { liveBuffers: 0, liveVersions: 0 },
    coldCounters: { recordBytes: 640000, parameterBytes: 2240000 },
    byteProbes: [1, 1, 0].map((time) => ({
      time,
      recordBytes: 0,
      parameterBytes: 0,
      uniformBytes: 16,
      positionSnapshotBytes: 0,
    })),
  };
  for (const sample of run.measure.samples) Object.assign(sample, { drawCalls: 1, positionSnapshotBytes: 0 });
  assert.equal(summarizeConsumerRun(run).pixelSize[0], 1920);
  for (const [key, value] of [
    ["recordBytes", 80000],
    ["drawCalls", 10000],
    ["positionSnapshotBytes", 80000],
  ]) {
    const broken = structuredClone(run);
    broken.measure.samples[1][key] = value;
    assert.throws(() => summarizeConsumerRun(broken), key);
  }
  for (const [key, value] of [
    ["sourceCount", 1],
    ["pixelSize", [800, 600]],
    ["checksumTime", 0.5],
    ["coveredPixels", 0],
  ]) {
    assert.throws(() => summarizeConsumerRun({ ...run, [key]: value }), key);
  }
  const cpu = structuredClone(run);
  cpu.backend = "gpu-cpu";
  cpu.beforeDispose.liveVersions = 1;
  cpu.coldCounters.recordBytes = 80000;
  for (const sample of cpu.measure.samples)
    Object.assign(sample, { recordBytes: 80000, uniformBytes: 64, positionSnapshotBytes: 80000 });
  cpu.byteProbes[0].recordBytes = cpu.byteProbes[2].recordBytes = 80000;
  assert.equal(summarizeConsumerRun(cpu).totals.recordBytes, 160000);
  cpu.byteProbes[1].recordBytes = 80000;
  assert.throws(() => summarizeConsumerRun(cpu), "重复帧上传必须失败");
});

function validRun() {
  return {
    result: "PASS",
    backend: "gpu-scalar",
    errors: [],
    pixelSize: [320, 180],
    devicePixelRatio: 1,
    planCounts: { declarations: 1, "plan-builds": 1 },
    afterDispose: { liveBuffers: 0 },
    idleRafMedianMs: 16,
    measure: {
      elapsedMs: 32,
      samples: [null, 16].map((rafIntervalMs, index) => ({
        rafIntervalMs,
        cpuFrameMs: index + 1,
        samplePlanMs: 0,
        batchMs: 0,
        drawBoundaryMs: index + 1,
        queueWriteMs: 0.1,
        queueSubmitMs: 0.1,
        newBuffers: 0,
        newPipelines: 0,
        uniformBytes: 16,
        parameterBytes: 0,
        recordBytes: 0,
        submits: 1,
      })),
    },
  };
}
test("阶段统计、上传与长期资源反例", () => {
  const run = validRun(),
    result = summarizeConsumerRun(run);
  assert.equal(result.metrics.cpuFrameMs.p50, 1.5);
  assert.equal(result.totals.uniformBytes, 32);
  assert.equal(result.longIntervalFraction, 0);
  for (const [key, value] of [
    ["newBuffers", 1],
    ["newPipelines", 1],
    ["recordBytes", 64],
    ["parameterBytes", 32],
    ["uniformBytes", 32],
    ["submits", 0],
    ["cpuFrameMs", NaN],
    ["rafIntervalMs", NaN],
    ["queueWriteMs", -1],
  ]) {
    const broken = structuredClone(run);
    broken.measure.samples[1][key] = value;
    assert.throws(() => summarizeConsumerRun(broken), key);
  }
  const leaked = structuredClone(run);
  leaked.afterDispose.liveBuffers = 1;
  assert.throws(() => summarizeConsumerRun(leaked));
  const rebuilt = structuredClone(run);
  rebuilt.planCounts["plan-builds"] = 2;
  assert.throws(() => summarizeConsumerRun(rebuilt));
});

test("10k 动态实例基准拒绝全量热帧上传、重复合批和资源增长", () => {
  const run = {
    result: "PASS",
    backend: "gpu-instances-dynamic",
    errors: [],
    pixelSize: [320, 180],
    devicePixelRatio: 1,
    sourceCount: 10000,
    inputBytes: 80000,
    liveBeforeDispose: 1,
    cold: { uploadBytes: 80000 },
    firstDrawMs: 2,
    idleRafMedianMs: 16,
    measure: {
      samples: [null, 16].map((rafIntervalMs, index) => ({
        rafIntervalMs,
        cpuFrameMs: index + 1,
        sampleMs: 0.1,
        patchMs: 0.1,
        drawBoundaryMs: 0.8,
        copiedBytes: 8,
        uploadBytes: 8,
        drawCalls: 1,
        live: 1,
      })),
    },
  };
  const summary = summarizeDynamicInstanceRun(run);
  assert.equal(summary.totals.uploadBytes, 16);
  for (const [key, value] of [
    ["copiedBytes", 80000],
    ["uploadBytes", 80000],
    ["drawCalls", 10000],
    ["live", 2],
    ["cpuFrameMs", NaN],
  ]) {
    const broken = structuredClone(run);
    broken.measure.samples[1][key] = value;
    assert.throws(() => summarizeDynamicInstanceRun(broken));
  }
  const leaked = structuredClone(run);
  leaked.liveBeforeDispose = 2;
  assert.throws(() => summarizeDynamicInstanceRun(leaked));
});

test("浏览器中断必须覆盖上一轮 PASS，不能留下成功的旧报告", async () => {
  const directory = await mkdtemp(join(tmpdir(), "quamolit-bench-failure-"));
  const path = join(directory, "bench-report.json");
  await writeFile(path, JSON.stringify({ result: "PASS", stale: true }));
  const browser = {};
  await assert.rejects(
    runConsumerBench(browser, "http://localhost/", directory, { candidate: "test" }, {}, async () => {
      throw Error("browser closed");
    }),
    /browser closed/,
  );
  const report = JSON.parse(await readFile(path, "utf8"));
  assert.equal(report.result, "FAIL");
  assert.equal(report.stale, undefined);
  assert.match(report.error, /browser closed/);
});
