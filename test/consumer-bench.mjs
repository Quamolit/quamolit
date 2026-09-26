import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import os from "node:os";
import { percentile, median } from "./m0/bench-metrics.mjs";
import { measureConsumerFrames } from "./consumer-bench-browser.mjs";

export function consumerBenchOptions(env = process.env) {
  const options = { warmupSeconds: Number(env.QUAMOLIT_BENCH_WARMUP ?? 5), durationSeconds: Number(env.QUAMOLIT_BENCH_DURATION ?? 30), runs: Number(env.QUAMOLIT_BENCH_RUNS ?? 3) };
  if (!Number.isFinite(options.warmupSeconds) || options.warmupSeconds < 0) throw Error("invalid warmup");
  if (!Number.isFinite(options.durationSeconds) || options.durationSeconds <= 0) throw Error("invalid duration");
  if (!Number.isSafeInteger(options.runs) || options.runs < 1) throw Error("invalid runs");
  return options;
}

export function summarizeConsumerRun(run) {
  assert.equal(run.result, "PASS");
  assert.deepEqual(run.errors, []);
  assert.deepEqual(run.pixelSize, [320, 180]);
  assert.equal(run.devicePixelRatio, 1);
  assert.equal(run.planCounts.declarations, 1);
  assert.equal(run.planCounts["plan-builds"], 1);
  assert.equal(run.afterDispose.liveBuffers, 0);
  const samples = run.measure.samples;
  assert.ok(samples.length >= 2);
  const gpu = run.backend !== "canvas";
  for (const sample of samples) {
    for (const key of ["cpuFrameMs", "samplePlanMs", "batchMs", "drawBoundaryMs"]) assert.ok(Number.isFinite(sample[key]) && sample[key] >= 0);
    assert.equal(sample.newBuffers, 0); assert.equal(sample.newPipelines, 0);
    if (sample.rafIntervalMs !== null) assert.ok(Number.isFinite(sample.rafIntervalMs) && sample.rafIntervalMs > 0);
    if (gpu) {
      for (const key of ["queueWriteMs", "queueSubmitMs"]) assert.ok(Number.isFinite(sample[key]) && sample[key] >= 0);
      assert.equal(sample.uniformBytes, 16); assert.equal(sample.submits, 1); assert.equal(sample.parameterBytes, 0);
      if (run.backend === "gpu-scalar") assert.equal(sample.recordBytes, 0);
      else assert.ok(sample.recordBytes === 0 || sample.recordBytes === 64);
    }
  }
  const keys = ["cpuFrameMs", "samplePlanMs", "batchMs", "drawBoundaryMs", "rafIntervalMs", "queueWriteMs", "queueSubmitMs"];
  const metrics = Object.fromEntries(keys.map(key => {
    const values = samples.map(s => s[key]).filter(v => v !== null);
    return [key, values.length ? { p50: percentile(values, 0.5), p95: percentile(values, 0.95), p99: percentile(values, 0.99) } : null];
  }));
  const intervals = samples.map(s => s.rafIntervalMs).filter(v => v !== null);
  assert.ok(Number.isFinite(run.idleRafMedianMs) && run.idleRafMedianMs > 0);
  return { backend: run.backend, frames: samples.length, elapsedMs: run.measure.elapsedMs,
    declarationMs: run.declarationMs, rendererSetupMs: run.rendererSetupMs, firstDrawMs: run.firstDrawMs,
    metrics, idleRafMedianMs: run.idleRafMedianMs,
    longIntervalFraction: intervals.filter(v => v > run.idleRafMedianMs * 1.5).length / intervals.length,
    totals: Object.fromEntries(["recordBytes", "parameterBytes", "uniformBytes", "submits"].map(key => [key, gpu ? samples.reduce((n, s) => n + s[key], 0) : null])),
    checksum: run.checksum, adapter: run.adapter, coldCounters: run.coldCounters, beforeDispose: run.beforeDispose, afterDispose: run.afterDispose };
}

async function runConsumerBenchImpl(browser, url, artifacts, identity, env) {
  const options = consumerBenchOptions(env), summaries = [], skipped = [], rawFiles = [];
  const backends = ["canvas", "gpu-cpu", "gpu-scalar"];
  for (let index = 0; index < options.runs; index++) {
    // 轮换后端次序，避免把固定排序/温度效应当作方案差异。
    const order = [...backends.slice(index % 3), ...backends.slice(0, index % 3)];
    for (const backend of order) {
      const context = await browser.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
      try {
        const page = await context.newPage(), errors = [];
        page.on("crash", () => console.error(`consumer bench: renderer crashed (${backend}, run ${index + 1})`));
        page.on("pageerror", e => errors.push(e.message));
        await page.goto(`${url}?fixture=1&motion=dual`);
        await page.waitForFunction(() => window.consumer);
        await page.bringToFront();
        let run;
        try {
          run = await page.evaluate(measureConsumerFrames, { ...options, backend });
        } catch (error) {
          await writeFile(join(artifacts, "bench-report.json"), JSON.stringify({ schema: "quamolit.consumer-bench.v1", result: "FAIL",
            ...identity, options, rawFiles, completed: summaries, interrupted: { backend, run: index + 1, browserConnected: browser.isConnected(), pageClosed: page.isClosed() }, error: error.stack }, null, 2));
          throw error;
        }
        assert.deepEqual(errors, []);
        if (run.result === "SKIP") {
          skipped.push({ run: index + 1, ...run });
          if (env.QUAMOLIT_CONSUMER_REQUIRE_GPU === "1") throw Error(`required GPU benchmark skipped: ${JSON.stringify(run)}`);
          continue;
        }
        const summary = summarizeConsumerRun(run), filename = `bench-${backend}-${index + 1}.json`;
        await writeFile(join(artifacts, filename), JSON.stringify({ identity, options, run }, null, 2));
        rawFiles.push(filename); summaries.push({ run: index + 1, ...summary });
        console.log(`consumer bench ${backend} ${index + 1}/${options.runs}: ${summary.frames} frames, CPU p95 ${summary.metrics.cpuFrameMs.p95.toFixed(3)} ms`);
      } finally { await context.close(); }
    }
  }
  assert.ok(summaries.length > 0);
  assert.equal(new Set(summaries.map(s => s.checksum)).size, 1, "跨运行/跨后端的固定时间画面必须完全相同");
  const aggregates = Object.fromEntries(backends.map(backend => {
    const runs = summaries.filter(s => s.backend === backend);
    return [backend, runs.length ? { runs: runs.length, cpuP95MedianMs: median(runs.map(s => s.metrics.cpuFrameMs.p95)),
      rafP95MedianMs: median(runs.map(s => s.metrics.rafIntervalMs.p95)), longIntervalFractionMedian: median(runs.map(s => s.longIntervalFraction)) } : null];
  }));
  const report = { schema: "quamolit.consumer-bench.v1", result: "PASS", ...identity, options, rawFiles, summaries, skipped, aggregates,
    formalDuration: options.warmupSeconds >= 5 && options.durationSeconds >= 30 && options.runs >= 3,
    environment: { browser: browser.version(), node: process.version, os: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model,
      power: env.QUAMOLIT_BENCH_POWER || "unknown", dpr: 1, pixelSize: [320, 180], fixture: "Calcit consumer dual smoothstep", nodes: 2, animatedNodes: 1,
      alpha: "premultiplied; white background", blend: "source-over", antialias: "browser-default; GPU sampleCount=1",
      input: "t=abs((frameIndex%120)/60-1), model=40, ready=false, viewport=100", resourceState: "no textures/fonts" },
    unavailable: { gpuTimestampMs: "未启用，queue.submit CPU 时间不是 GPU 执行时间", inputToVisibleMs: "rAF 仅呈现节奏代理", allocationsPerFrame: "未测 Calcit/JS 分配；GPU 对象创建单独计数",
      packingMs: "drawBoundary 合并 Calcit 验证/打包/编码；queueWrite/queueSubmit 是其子区间，不能再次相加", canvasUploadBytes: "Canvas API 不暴露上传量" },
    limitations: ["只有 2 个图元，不能外推 1k/10k/100k 吞吐", "正式时长不等于硬件目标通过；需核对供电、设备、画质、显示刷新率", "当前仅固定 Model 的时间帧；输入延迟、资源恢复和大规模 instances 待验收", "每帧测量/queue 包装本身有开销，小负载受时钟精度影响"] };
  await writeFile(join(artifacts, "bench-report.json"), JSON.stringify(report, null, 2));
  return { schema: report.schema, formalDuration: report.formalDuration, aggregates, skipped, report: "bench-report.json" };
}

export async function runConsumerBench(browser, url, artifacts, identity, env = process.env) {
  const path = join(artifacts, "bench-report.json");
  await writeFile(path, JSON.stringify({ schema: "quamolit.consumer-bench.v1", result: "RUNNING", ...identity }, null, 2));
  try {
    return await runConsumerBenchImpl(browser, url, artifacts, identity, env);
  } catch (error) {
    const previous = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify({ ...previous, result: "FAIL", error: error.stack }, null, 2));
    throw error;
  }
}
