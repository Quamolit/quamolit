#!/usr/bin/env node
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import { platform, release, arch, cpus } from "node:os";
import { compareBaseline, environmentMismatches, median, summarizeRun } from "./bench-metrics.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const help = `用法: yarn bench [--fixture ui-transition|mixed-ui|instances|text-path] [--count 1000|10000|100000]
  [--backend canvas2d] [--seed uint32] [--dpr 1|2] [--warmup 秒] [--duration 秒]
  [--runs 次数] [--power 供电状态] [--gpu GPU说明] [--out 目录] [--baseline report.json]
默认：Canvas2D、seed=7、DPR=1、预热 5 秒、采样 30 秒、独立运行 3 次。mixed-ui 固定 1000 个混合节点。
输出 report.json、每次原始样本 run-N.json；--baseline 仅同环境比较，超过 10% 且 0.5ms 退出 1。
短时调试可覆盖时长，但不得把这种结果当作正式基线。`;

function parseArgs(args) {
  const options = { fixture: "ui-transition", count: 10_000, backend: "canvas2d", seed: 7, dpr: 1, warmupSeconds: 5, durationSeconds: 30, runs: 3, power: "unknown", gpu: "unknown", out: "test-results/bench", baseline: null };
  const names = { "--fixture": "fixture", "--count": "count", "--backend": "backend", "--seed": "seed", "--dpr": "dpr", "--warmup": "warmupSeconds", "--duration": "durationSeconds", "--runs": "runs", "--power": "power", "--gpu": "gpu", "--out": "out", "--baseline": "baseline" };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") { console.log(help); process.exit(0); }
    const name = names[arg];
    if (!name || index + 1 >= args.length) throw new Error(`无效参数：${arg}\n${help}`);
    options[name] = args[++index];
  }
  for (const key of ["count", "seed", "dpr", "warmupSeconds", "durationSeconds", "runs"]) options[key] = Number(options[key]);
  if (!["ui-transition", "mixed-ui", "instances", "text-path"].includes(options.fixture)) throw new Error("无效 fixture");
  if (options.fixture === "mixed-ui" && !args.includes("--count")) options.count = 1_000;
  if (![1000, 10000, 100000].includes(options.count)) throw new Error("count 只支持 1000、10000、100000");
  if (options.fixture === "mixed-ui" && options.count !== 1_000) throw new Error("mixed-ui 固定 1000 个节点");
  if (options.backend !== "canvas2d") throw new Error("当前只实现 canvas2d；其他后端不得假报为已测");
  if (!Number.isSafeInteger(options.seed) || options.seed < 0 || options.seed > 0xffffffff) throw new Error("seed 必须是 uint32");
  if (![1, 2].includes(options.dpr)) throw new Error("dpr 只支持 1 或 2");
  if (!Number.isFinite(options.warmupSeconds) || options.warmupSeconds < 0) throw new Error("warmup 必须是非负秒数");
  if (!Number.isFinite(options.durationSeconds) || options.durationSeconds <= 0) throw new Error("duration 必须是正秒数");
  if (!Number.isSafeInteger(options.runs) || options.runs < 1) throw new Error("runs 必须是正整数");
  return options;
}

function gitSha() {
  try { return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(); }
  catch { return "unknown"; }
}

function gitDirty() {
  try { return execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], { cwd: root, encoding: "utf8" }).trim().length > 0; }
  catch { return null; }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const server = await createServer({ root, server: { host: "127.0.0.1", port: 0, strictPort: false }, logLevel: "error" });
  let browser;
  try {
    await server.listen();
    const origin = server.resolvedUrls.local[0].replace(/\/$/, "");
    browser = await chromium.launch({ headless: true });
    const environment = {
      fixture: options.fixture, count: options.count, backend: options.backend,
      seed: options.seed, dpr: options.dpr, power: options.power, gpu: options.gpu,
      browserVersion: browser.version(), platform: platform(), osRelease: release(), arch: arch(),
      node: process.version, cpu: cpus()[0]?.model ?? "unknown", gitSha: gitSha(), gitDirty: gitDirty(),
      viewport: { width: 1280, height: 720 }, pixelSize: { width: 640 * options.dpr, height: 360 * options.dpr },
      resourceState: "glyphAtlas=ready;image=ready", alpha: false, blend: "source-over", antialias: "browser-default", driver: "unavailable",
      sceneComposition: options.fixture === "mixed-ui" ? { groups: 20, nodes: 1_000, rects: 250, circles: 250, lines: 250, glyphs: 250, animated: 250 } : null,
      command: process.argv.join(" "), warmupSeconds: options.warmupSeconds,
      durationSeconds: options.durationSeconds, runs: options.runs,
    };
    const out = resolve(root, options.out);
    await mkdir(out, { recursive: true });
    const summaries = [];
    const rawFiles = [];
    for (let index = 0; index < options.runs; index += 1) {
      const context = await browser.newContext({ viewport: environment.viewport, deviceScaleFactor: options.dpr, colorScheme: "light", locale: "zh-CN", reducedMotion: "reduce" });
      try {
        const page = await context.newPage();
        const navigationStart = performance.now();
        await page.goto(`${origin}/test/m0/bench.html`, { waitUntil: "load" });
        const pageLoadMs = performance.now() - navigationStart;
        const run = await page.evaluate(async (config) => {
          const { runBrowserBench } = await import("/test/m0/bench-browser.mjs");
          return runBrowserBench(config);
        }, options);
        if (run.devicePixelRatio !== options.dpr || run.manifest.pixelWidth !== environment.pixelSize.width) throw new Error("实际 DPR/画布尺寸与请求不一致");
        const summary = { ...summarizeRun(run), pageLoadMs };
        summaries.push(summary);
        const rawName = `run-${index + 1}.json`;
        rawFiles.push(rawName);
        await writeFile(join(out, rawName), JSON.stringify({ environment, run: index + 1, ...run, summary }, null, 2) + "\n");
        console.log(`第 ${index + 1}/${options.runs} 次：${summary.frames} 帧，CPU p95=${summary.cpuFrameMs.p95.toFixed(3)}ms，rAF p95=${summary.rafIntervalMs.p95.toFixed(3)}ms`);
      } finally { await context.close(); }
    }
    const report = {
      schema: "quamolit.m0.bench.v1", createdAt: new Date().toISOString(), environment, rawFiles,
      runs: summaries,
      aggregate: {
        cpuP95MedianMs: median(summaries.map((item) => item.cpuFrameMs.p95)),
        cpuP95RangeMs: [Math.min(...summaries.map((item) => item.cpuFrameMs.p95)), Math.max(...summaries.map((item) => item.cpuFrameMs.p95))],
        rafP95MedianMs: median(summaries.map((item) => item.rafIntervalMs.p95)),
        longIntervalFractionMedian: median(summaries.map((item) => item.longIntervalFraction)),
        checksumConsistent: new Set(summaries.map((item) => item.checksum)).size === 1,
      },
      unavailable: {
        componentEvaluationMs: "M0 夹具没有组件树", changeCalculationMs: "M0 夹具没有变更计算阶段",
        packingMs: "Canvas2D 参考路径没有显式数据打包阶段", commandSubmitMs: "Canvas2D 不暴露队列提交阶段",
        gpuTimestampMs: "Canvas2D 无 GPU timestamp", uploadBytes: "Canvas2D API 不暴露实际上传字节",
        drawCalls: "Canvas2D 不暴露驱动 draw call", allocationsPerFrame: "浏览器不提供稳定逐帧分配数据",
        liveResources: "M0 参考绘制器没有资源表", inputToVisibleMs: "rAF 不是实际呈现时间戳",
      },
    };
    if (options.baseline) {
      const baseline = JSON.parse(await readFile(resolve(root, options.baseline), "utf8"));
      if (baseline.schema !== report.schema) throw new Error("基线 schema 不匹配");
      const mismatches = environmentMismatches(environment, baseline.environment);
      if (mismatches.length) throw new Error(`环境不匹配，拒绝比较：${mismatches.join(", ")}`);
      report.comparison = compareBaseline(report, baseline);
    }
    await writeFile(join(out, "report.json"), JSON.stringify(report, null, 2) + "\n");
    console.log(`报告：${join(out, "report.json")}`);
    if (!report.aggregate.checksumConsistent) throw new Error("固定 t=0.5 画面校验和跨运行不一致；原始样本已保存，基准无效");
    if (report.comparison?.regression) throw new Error(`CPU p95 回归：+${report.comparison.deltaMs.toFixed(3)}ms / +${(report.comparison.deltaFraction * 100).toFixed(1)}%`);
  } finally {
    await browser?.close();
    await server.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
