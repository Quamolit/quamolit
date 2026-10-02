import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import os from "node:os";
import { chromium } from "@playwright/test";
import { percentile, median } from "./m0/bench-metrics.mjs";
import {
  measureConsumerFrames,
  measureConsumerInstancesFrames,
  measureConsumerDynamicInstancesFrames,
} from "./consumer-bench-browser.mjs";

export function consumerBenchOptions(env = process.env) {
  const options = {
    warmupSeconds: Number(env.QUAMOLIT_BENCH_WARMUP ?? 5),
    durationSeconds: Number(env.QUAMOLIT_BENCH_DURATION ?? 30),
    runs: Number(env.QUAMOLIT_BENCH_RUNS ?? 3),
  };
  if (env.QUAMOLIT_BENCH_LOAD !== undefined) {
    if (env.QUAMOLIT_BENCH_LOAD !== "independent-10k") throw Error("invalid workload");
    const size = env.QUAMOLIT_BENCH_SIZE || "320x180";
    if (!["320x180", "1920x1080"].includes(size)) throw Error("invalid pixel size");
    options.workload = "independent-10k";
    options.pixelSize = size.split("x").map(Number);
  } else if (env.QUAMOLIT_BENCH_SIZE !== undefined) throw Error("size requires independent workload");
  if (!Number.isFinite(options.warmupSeconds) || options.warmupSeconds < 0) throw Error("invalid warmup");
  if (!Number.isFinite(options.durationSeconds) || options.durationSeconds <= 0) throw Error("invalid duration");
  if (!Number.isSafeInteger(options.runs) || options.runs < 1) throw Error("invalid runs");
  return options;
}

export function summarizeConsumerRun(run) {
  assert.equal(run.result, "PASS");
  assert.deepEqual(run.errors, []);
  const independent = run.workload === "independent-10k";
  assert.ok(!run.workload || ["dual", "independent-10k"].includes(run.workload));
  assert.ok(["canvas", "gpu-cpu", "gpu-scalar"].includes(run.backend));
  assert.ok(["320,180", ...(independent ? ["1920,1080"] : [])].includes(run.pixelSize.join(",")));
  assert.equal(run.devicePixelRatio, 1);
  if (independent) {
    assert.equal(run.sourceCount, 10000);
    assert.equal(run.beforeDispose.liveVersions, run.backend === "gpu-scalar" ? 0 : 1);
    assert.equal(run.afterDispose.liveVersions, 0);
    assert.equal(run.checksumTime, 1);
    assert.ok(Number.isSafeInteger(run.coveredPixels) && run.coveredPixels > 0);
    assert.equal(run.byteProbes.length, 3);
    assert.equal(run.byteProbes[1].time, run.byteProbes[0].time);
    assert.equal(run.byteProbes[1].positionSnapshotBytes, 0);
    if (run.backend !== "canvas") assert.equal(run.byteProbes[1].recordBytes, 0, "重复帧不得上传位置");
    if (run.backend === "gpu-cpu") {
      assert.equal(run.coldCounters.recordBytes, 80000);
      assert.equal(run.byteProbes[0].recordBytes, 80000);
      assert.equal(run.byteProbes[2].recordBytes, 80000);
    }
    if (run.backend === "gpu-scalar")
      for (const probe of run.byteProbes) {
        assert.equal(probe.recordBytes, 0);
        assert.equal(probe.parameterBytes, 0);
        assert.equal(probe.uniformBytes, 16);
      }
    if (run.backend === "gpu-scalar") {
      assert.equal(run.coldCounters.recordBytes, 640000);
      assert.equal(run.coldCounters.parameterBytes, 1600000);
    }
  } else {
    assert.equal(run.planCounts.declarations, 1);
    assert.equal(run.planCounts["plan-builds"], 1);
  }
  assert.equal(run.afterDispose.liveBuffers, 0);
  const samples = run.measure.samples;
  assert.ok(samples.length >= 2);
  const gpu = run.backend !== "canvas";
  for (const sample of samples) {
    for (const key of ["cpuFrameMs", "samplePlanMs", "batchMs", "drawBoundaryMs"])
      assert.ok(Number.isFinite(sample[key]) && sample[key] >= 0);
    assert.equal(sample.newBuffers, 0);
    assert.equal(sample.newPipelines, 0);
    if (sample.rafIntervalMs !== null) assert.ok(Number.isFinite(sample.rafIntervalMs) && sample.rafIntervalMs > 0);
    if (gpu) {
      for (const key of ["queueWriteMs", "queueSubmitMs"]) assert.ok(Number.isFinite(sample[key]) && sample[key] >= 0);
      assert.equal(sample.uniformBytes, independent && run.backend === "gpu-cpu" ? 64 : 16);
      assert.equal(sample.submits, 1);
      assert.equal(sample.parameterBytes, 0);
      if (run.backend === "gpu-scalar") assert.equal(sample.recordBytes, 0);
      else assert.ok(sample.recordBytes === 0 || sample.recordBytes === (independent ? 80000 : 64));
    }
    if (independent) {
      assert.equal(sample.drawCalls, gpu ? 1 : 10000);
      if (run.backend === "gpu-scalar") assert.equal(sample.positionSnapshotBytes, 0);
      else assert.ok([0, 80000].includes(sample.positionSnapshotBytes));
      if (run.backend === "gpu-cpu") assert.equal(sample.recordBytes, sample.positionSnapshotBytes);
    }
  }
  const keys = [
    "cpuFrameMs",
    "samplePlanMs",
    "batchMs",
    "drawBoundaryMs",
    "rafIntervalMs",
    "queueWriteMs",
    "queueSubmitMs",
  ];
  const metrics = Object.fromEntries(
    keys.map((key) => {
      const values = samples.map((s) => s[key]).filter((v) => v !== null);
      return [
        key,
        values.length
          ? { p50: percentile(values, 0.5), p95: percentile(values, 0.95), p99: percentile(values, 0.99) }
          : null,
      ];
    }),
  );
  const intervals = samples.map((s) => s.rafIntervalMs).filter((v) => v !== null);
  assert.ok(Number.isFinite(run.idleRafMedianMs) && run.idleRafMedianMs > 0);
  return {
    backend: run.backend,
    workload: run.workload || "dual",
    pixelSize: run.pixelSize,
    coveredPixels: run.coveredPixels,
    byteProbes: run.byteProbes,
    frames: samples.length,
    elapsedMs: run.measure.elapsedMs,
    declarationMs: run.declarationMs,
    rendererSetupMs: run.rendererSetupMs,
    firstDrawMs: run.firstDrawMs,
    metrics,
    idleRafMedianMs: run.idleRafMedianMs,
    longIntervalFraction: intervals.filter((v) => v > run.idleRafMedianMs * 1.5).length / intervals.length,
    totals: Object.fromEntries(
      ["recordBytes", "parameterBytes", "uniformBytes", "submits"].map((key) => [
        key,
        gpu ? samples.reduce((n, s) => n + s[key], 0) : null,
      ]),
    ),
    checksum: run.checksum,
    adapter: run.adapter,
    coldCounters: run.coldCounters,
    beforeDispose: run.beforeDispose,
    afterDispose: run.afterDispose,
  };
}

export function summarizeDynamicInstanceRun(run) {
  assert.equal(run.result, "PASS");
  assert.deepEqual(run.errors, []);
  assert.deepEqual(run.pixelSize, [320, 180]);
  assert.equal(run.devicePixelRatio, 1);
  assert.equal(run.sourceCount, 10000);
  assert.equal(run.inputBytes, 80000);
  assert.equal(run.liveBeforeDispose, 1);
  assert.equal(run.cold.uploadBytes, run.backend === "gpu-instances-dynamic" ? 80000 : null);
  const samples = run.measure.samples;
  assert.ok(samples.length >= 2);
  for (const sample of samples) {
    for (const key of ["cpuFrameMs", "sampleMs", "patchMs", "drawBoundaryMs"]) {
      assert.ok(Number.isFinite(sample[key]) && sample[key] >= 0, key);
    }
    assert.equal(sample.copiedBytes, 8, "每个动态时间帧只复制一个实例");
    assert.equal(sample.uploadBytes, run.backend === "gpu-instances-dynamic" ? 8 : null, "GPU 只上传脏区");
    assert.equal(sample.drawCalls, run.backend === "gpu-instances-dynamic" ? 1 : 10000);
    assert.equal(sample.live, 1, "长期运行只公开保留当前版本");
    if (sample.rafIntervalMs !== null) assert.ok(Number.isFinite(sample.rafIntervalMs) && sample.rafIntervalMs > 0);
  }
  const metrics = Object.fromEntries(
    ["cpuFrameMs", "sampleMs", "patchMs", "drawBoundaryMs", "rafIntervalMs"].map((key) => {
      const values = samples.map((sample) => sample[key]).filter((value) => value !== null);
      return [key, { p50: percentile(values, 0.5), p95: percentile(values, 0.95), p99: percentile(values, 0.99) }];
    }),
  );
  return {
    backend: run.backend,
    frames: samples.length,
    firstDrawMs: run.firstDrawMs,
    idleRafMedianMs: run.idleRafMedianMs,
    metrics,
    checksum: run.checksum,
    adapter: run.adapter,
    totals: {
      copiedBytes: samples.reduce((sum, sample) => sum + sample.copiedBytes, 0),
      uploadBytes:
        run.backend === "gpu-instances-dynamic" ? samples.reduce((sum, sample) => sum + sample.uploadBytes, 0) : null,
    },
  };
}

async function runConsumerBenchImpl(browser, url, artifacts, identity, env, launchBrowser) {
  const options = consumerBenchOptions(env),
    summaries = [],
    skipped = [],
    rawFiles = [],
    instanceSummaries = [],
    dynamicSummaries = [];
  const backends = ["canvas", "gpu-cpu", "gpu-scalar"];
  const independent = options.workload === "independent-10k";
  const prefix = independent ? `bench-independent-${options.pixelSize.join("x")}` : "bench";
  // 长测连续复用同一 Chromium 进程时，第二轮曾出现页面被浏览器提前关闭。
  // 每个独立运行使用新的浏览器进程，同时隔离 WebGPU device 与渲染器生命周期。
  async function openRun() {
    const isolatedBrowser = await launchBrowser({ headless: env.QUAMOLIT_CONSUMER_HEADED !== "1" });
    try {
      const context = await isolatedBrowser.newContext({
        viewport: {
          width: Math.max(1000, options.pixelSize?.[0] || 0),
          height: Math.max(900, options.pixelSize?.[1] || 0),
        },
        deviceScaleFactor: 1,
      });
      return { isolatedBrowser, context };
    } catch (error) {
      await isolatedBrowser.close();
      throw error;
    }
  }
  async function closeRun(run) {
    await run.context.close();
    await run.isolatedBrowser.close();
  }
  for (let index = 0; index < options.runs; index++) {
    // 轮换后端次序，避免把固定排序/温度效应当作方案差异。
    const order = [...backends.slice(index % 3), ...backends.slice(0, index % 3)];
    for (const backend of order) {
      const isolated = await openRun(),
        { context } = isolated;
      try {
        const page = await context.newPage(),
          errors = [];
        page.on("crash", () => console.error(`consumer bench: renderer crashed (${backend}, run ${index + 1})`));
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`${url}?fixture=1&motion=dual`);
        await page.waitForFunction(() => window.consumer);
        await page.bringToFront();
        let run;
        try {
          run = await page.evaluate(measureConsumerFrames, { ...options, backend });
        } catch (error) {
          await writeFile(
            join(artifacts, "bench-report.json"),
            JSON.stringify(
              {
                schema: "quamolit.consumer-bench.v1",
                result: "FAIL",
                ...identity,
                options,
                rawFiles,
                completed: summaries,
                interrupted: {
                  backend,
                  run: index + 1,
                  browserConnected: isolated.isolatedBrowser.isConnected(),
                  pageClosed: page.isClosed(),
                },
                error: error.stack,
              },
              null,
              2,
            ),
          );
          throw error;
        }
        assert.deepEqual(errors, []);
        if (run.result === "SKIP") {
          skipped.push({ run: index + 1, ...run });
          if (env.QUAMOLIT_CONSUMER_REQUIRE_GPU === "1")
            throw Error(`required GPU benchmark skipped: ${JSON.stringify(run)}`);
          continue;
        }
        const summary = summarizeConsumerRun(run),
          filename = `${prefix}-${backend}-${index + 1}.json`;
        await writeFile(join(artifacts, filename), JSON.stringify({ identity, options, run }, null, 2));
        rawFiles.push(filename);
        summaries.push({ run: index + 1, ...summary });
        console.log(
          `consumer bench ${backend} ${index + 1}/${options.runs}: ${summary.frames} frames, CPU p95 ${summary.metrics.cpuFrameMs.p95.toFixed(3)} ms`,
        );
      } finally {
        await closeRun(isolated);
      }
    }
    if (independent) continue;
    const staticRun = await openRun(),
      instanceContext = staticRun.context;
    try {
      const page = await instanceContext.newPage(),
        errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${url}?fixture=1&motion=instances`);
      await page.waitForFunction(() => window.consumer?.snapshot().mode === "instances");
      await page.bringToFront();
      const run = await page.evaluate(measureConsumerInstancesFrames, options);
      assert.deepEqual(errors, []);
      assert.equal(run.result, "PASS");
      assert.deepEqual(run.pixelSize, [320, 180]);
      assert.equal(run.devicePixelRatio, 1);
      assert.equal(run.sourceCount, 10000);
      assert.equal(run.inputBytes, 80000);
      assert.deepEqual(run.firstMetrics, {
        "boundary-calls": 1,
        "canvas-calls": 10000,
        instances: 10000,
        "position-bytes-read": 80000,
      });
      assert.ok(run.measure.samples.length >= 2);
      for (const sample of run.measure.samples) {
        assert.ok(Number.isFinite(sample.cpuFrameMs) && sample.cpuFrameMs >= 0);
        assert.deepEqual(sample.metrics, run.firstMetrics);
      }
      const values = run.measure.samples.map((sample) => sample.cpuFrameMs);
      const intervals = run.measure.samples.map((sample) => sample.rafIntervalMs).filter((value) => value !== null);
      const summary = {
        run: index + 1,
        frames: values.length,
        cpuFrameMs: { p50: percentile(values, 0.5), p95: percentile(values, 0.95), p99: percentile(values, 0.99) },
        rafIntervalMs: {
          p50: percentile(intervals, 0.5),
          p95: percentile(intervals, 0.95),
          p99: percentile(intervals, 0.99),
        },
        firstDrawMs: run.firstDrawMs,
        idleRafMedianMs: run.idleRafMedianMs,
        checksum: run.checksum,
      };
      const filename = `bench-canvas-instances-${index + 1}.json`;
      await writeFile(join(artifacts, filename), JSON.stringify({ identity, options, run }, null, 2));
      rawFiles.push(filename);
      instanceSummaries.push(summary);
      console.log(
        `consumer bench canvas-instances ${index + 1}/${options.runs}: ${summary.frames} frames, CPU p95 ${summary.cpuFrameMs.p95.toFixed(3)} ms`,
      );
    } finally {
      await closeRun(staticRun);
    }
    for (const backend of ["canvas-instances-dynamic", "gpu-instances-dynamic"]) {
      const isolated = await openRun(),
        { context } = isolated;
      try {
        const page = await context.newPage(),
          errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`${url}?fixture=1&motion=instances`);
        await page.waitForFunction(() => window.consumer?.snapshot().mode === "instances");
        await page.bringToFront();
        const run = await page.evaluate(measureConsumerDynamicInstancesFrames, { ...options, backend });
        assert.deepEqual(errors, []);
        if (run.result === "SKIP") {
          skipped.push({ run: index + 1, ...run });
          if (env.QUAMOLIT_CONSUMER_REQUIRE_GPU === "1")
            throw Error(`required GPU instances benchmark skipped: ${JSON.stringify(run)}`);
          continue;
        }
        const summary = summarizeDynamicInstanceRun(run);
        const filename = `bench-${backend}-${index + 1}.json`;
        await writeFile(join(artifacts, filename), JSON.stringify({ identity, options, run }, null, 2));
        rawFiles.push(filename);
        dynamicSummaries.push({ run: index + 1, ...summary });
        console.log(
          `consumer bench ${backend} ${index + 1}/${options.runs}: ${summary.frames} frames, CPU p95 ${summary.metrics.cpuFrameMs.p95.toFixed(3)} ms`,
        );
      } finally {
        await closeRun(isolated);
      }
    }
  }
  assert.ok(summaries.length > 0);
  assert.equal(new Set(summaries.map((s) => s.checksum)).size, 1, "跨运行/跨后端的固定时间画面必须完全相同");
  if (!independent)
    assert.equal(new Set(instanceSummaries.map((s) => s.checksum)).size, 1, "静态 10k 实例跨运行画面必须完全相同");
  for (const backend of ["canvas-instances-dynamic", "gpu-instances-dynamic"]) {
    assert.equal(
      new Set(dynamicSummaries.filter((summary) => summary.backend === backend).map((summary) => summary.checksum))
        .size,
      dynamicSummaries.some((summary) => summary.backend === backend) ? 1 : 0,
      `${backend} 跨运行画面必须相同`,
    );
  }
  if (dynamicSummaries.some((summary) => summary.backend === "gpu-instances-dynamic")) {
    assert.equal(
      new Set(dynamicSummaries.map((summary) => summary.checksum)).size,
      1,
      "像素对齐动态实例在 Canvas/GPU 间的终点画面必须一致",
    );
  }
  const aggregates = Object.fromEntries(
    backends.map((backend) => {
      const runs = summaries.filter((s) => s.backend === backend);
      return [
        backend,
        runs.length
          ? {
              runs: runs.length,
              cpuP95MedianMs: median(runs.map((s) => s.metrics.cpuFrameMs.p95)),
              rafP95MedianMs: median(runs.map((s) => s.metrics.rafIntervalMs.p95)),
              longIntervalFractionMedian: median(runs.map((s) => s.longIntervalFraction)),
            }
          : null,
      ];
    }),
  );
  const report = {
    schema: "quamolit.consumer-bench.v1",
    result: "PASS",
    ...identity,
    options,
    rawFiles,
    summaries,
    skipped,
    aggregates,
    instances: independent
      ? null
      : {
          workload: "static-10k-canvas-reference",
          sourceCount: 10000,
          inputBytes: 80000,
          summaries: instanceSummaries,
          cpuP95MedianMs: median(instanceSummaries.map((s) => s.cpuFrameMs.p95)),
          rafP95MedianMs: median(instanceSummaries.map((s) => s.rafIntervalMs.p95)),
          limitations: [
            "静态宿主网格输入，不代表 10k 独立动画",
            "10k Canvas fillRect，不等同 GPU instances",
            "只与自身同环境历史报告比较，不与两图元负载比较吞吐倍数",
          ],
        },
    dynamicInstances: independent
      ? null
      : {
          workload: "10k-instances-one-dirty-record-per-frame",
          sourceCount: 10000,
          inputBytes: 80000,
          summaries: dynamicSummaries,
          backends: Object.fromEntries(
            ["canvas-instances-dynamic", "gpu-instances-dynamic"].map((backend) => {
              const runs = dynamicSummaries.filter((summary) => summary.backend === backend);
              return [
                backend,
                runs.length
                  ? {
                      runs: runs.length,
                      cpuP95MedianMs: median(runs.map((summary) => summary.metrics.cpuFrameMs.p95)),
                      rafP95MedianMs: median(runs.map((summary) => summary.metrics.rafIntervalMs.p95)),
                    }
                  : null,
              ];
            }),
          ),
          limitations: [
            "每帧只有一个实例运动，不代表 10k 独立动画",
            "Canvas 每帧重绘 10k，GPU 每帧提交一层并上传 8 B 位置与 64 B uniform",
            "跨设备/尺寸及小数重叠栅格化另验收 #144",
          ],
        },
    formalDuration: options.warmupSeconds >= 5 && options.durationSeconds >= 30 && options.runs >= 3,
    environment: {
      browser: browser.version(),
      node: process.version,
      os: `${os.platform()} ${os.release()} ${os.arch()}`,
      cpu: os.cpus()[0]?.model,
      power: env.QUAMOLIT_BENCH_POWER || "unknown",
      dpr: 1,
      pixelSize: options.pixelSize || [320, 180],
      fixture: independent ? "Calcit consumer independent Vec2 10k" : "Calcit consumer dual smoothstep",
      nodes: independent ? 1 : 2,
      animatedNodes: independent ? 10000 : 1,
      alpha: "premultiplied; white background",
      blend: "source-over",
      antialias: "browser-default; GPU sampleCount=1",
      input: independent
        ? "t=abs((frameIndex%120)/60-1); 125x80 grid; 2x2 rect; independent linear/smoothstep Vec2"
        : "t=abs((frameIndex%120)/60-1), model=40, ready=false, viewport=100",
      resourceState: "no textures/fonts",
    },
    unavailable: {
      gpuTimestampMs: "未启用，queue.submit CPU 时间不是 GPU 执行时间",
      inputToVisibleMs: "rAF 仅呈现节奏代理",
      allocationsPerFrame: "未测 Calcit/JS 分配；GPU 对象创建单独计数",
      packingMs: "drawBoundary 合并 Calcit 验证/打包/编码；queueWrite/queueSubmit 是其子区间，不能再次相加",
      canvasUploadBytes: "Canvas API 不暴露上传量",
    },
    limitations: [
      independent
        ? "10k 独立动画固定原始像素几何；1920x1080 不扩大图元，coveredPixels 单独记录，不与其他分辨率计算加速比"
        : "三路径对比仍只有 2 个图元，不能外推 1k/10k/100k 吞吐；10k 静态与单脏记录动态负载分别报告",
      "正式时长不等于硬件目标通过；需核对供电、设备、画质、显示刷新率",
      independent
        ? "checksumTime=1 只锁定整数终点；小数中间帧 Canvas/GPU 一致性仍待 #144 合同，不因报告 PASS 宣称画质通过"
        : "输入延迟、资源恢复与 10k 独立运动待验收",
      ...(independent
        ? ["CPU 路径每个不同时间生成并登记全量 80kB 位置快照；不证明按实际变更实例数上传，重复时间复用快照"]
        : []),
      "每帧测量本身有开销；GPU drawBoundary/queue.submit CPU 时间不是 GPU 执行时间",
    ],
  };
  await writeFile(join(artifacts, "bench-report.json"), JSON.stringify(report, null, 2));
  if (independent) await writeFile(join(artifacts, `${prefix}-report.json`), JSON.stringify(report, null, 2));
  return {
    schema: report.schema,
    formalDuration: report.formalDuration,
    aggregates,
    skipped,
    report: "bench-report.json",
  };
}

export async function runConsumerBench(
  browser,
  url,
  artifacts,
  identity,
  env = process.env,
  launchBrowser = (options) => chromium.launch(options),
) {
  const path = join(artifacts, "bench-report.json");
  await writeFile(
    path,
    JSON.stringify({ schema: "quamolit.consumer-bench.v1", result: "RUNNING", ...identity }, null, 2),
  );
  try {
    return await runConsumerBenchImpl(browser, url, artifacts, identity, env, launchBrowser);
  } catch (error) {
    const previous = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify({ ...previous, result: "FAIL", error: error.stack }, null, 2));
    throw error;
  }
}
