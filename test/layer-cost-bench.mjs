// 浏览器测量驱动；动画声明和绘制仍调用实际 Calcit 消费者。
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import { summarizeLayerRun } from "./layer-cost-metrics.mjs";

const options = {
  warmupSeconds: Number(process.env.QUAMOLIT_BENCH_WARMUP ?? 5),
  durationSeconds: Number(process.env.QUAMOLIT_BENCH_DURATION ?? 30),
  runs: Number(process.env.QUAMOLIT_BENCH_RUNS ?? 3),
};
assert.ok(Number.isFinite(options.warmupSeconds) && options.warmupSeconds >= 0);
assert.ok(Number.isFinite(options.durationSeconds) && options.durationSeconds > 0);
assert.ok(Number.isSafeInteger(options.runs) && options.runs > 0);
// 正式测量服务静态产物，避免保存报告触发 Vite HMR 而卸载测量中的页面。
const url = process.env.QUAMOLIT_LAYER_BENCH_URL ?? "http://127.0.0.1:5195/preview/demos/index.html";
let server = null;
if (!process.env.QUAMOLIT_LAYER_BENCH_URL) {
  server = spawn(process.execPath, ["test/demo-nav-server.mjs"], {
    env: { ...process.env, QUAMOLIT_DEMO_TEST_PORT: "5195" },
    stdio: "inherit",
  });
  process.on("exit", () => server.kill("SIGTERM"));
  let ready = false;
  for (let attempt = 0; attempt < 60 && !ready; attempt++) {
    assert.equal(server.exitCode, null, "测量静态服务启动失败，不能复用未知进程");
    try {
      ready = (await fetch(url)).ok;
    } catch {}
    if (!ready) await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "静态产物服务未就绪");
}
const output = process.env.QUAMOLIT_LAYER_BENCH_OUTPUT ?? "test-results/layer-cost";
await mkdir(output, { recursive: true });
function command(binary, args) {
  return execFileSync(binary, args, { encoding: "utf8" }).trim();
}
const report = {
  schema: "quamolit-layer-cost-v1",
  createdAt: new Date().toISOString(),
  complete: false,
  url,
  command: process.argv.join(" "),
  options,
  formalDuration: options.warmupSeconds >= 5 && options.durationSeconds >= 30 && options.runs >= 3,
  fixture: {
    instances: 10000,
    animation: "static instances + Calcit UI reveal, t=(elapsed/1500)%1",
    viewport: [1920, 1080],
    dpr: 1,
    alpha: "premultiplied; instances 0.5; UI unchanged",
    fonts: "demo system fonts",
    seed: null,
  },
  environment: {
    git: command("git", ["rev-parse", "HEAD"]),
    dirty: command("git", ["status", "--porcelain"]),
    os: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpu: os.cpus()[0]?.model,
    power: os.platform() === "darwin" ? command("pmset", ["-g", "batt"]) : "unavailable",
    calcit: command("calcit", ["--version"]),
    sourceHashes: Object.fromEntries(
      await Promise.all(
        [
          "calcit.cirru",
          "examples/layer-composition/main.mjs",
          "test/layer-cost-bench.mjs",
          "test/layer-cost-metrics.mjs",
        ].map(async (path) => [
          path,
          createHash("sha256")
            .update(await readFile(path))
            .digest("hex"),
        ]),
      ),
    ),
  },
  limitations: [
    "rAF 是调度代理，不是精确呈现；不判定 60 FPS",
    "compositor/GPU execution/分配量/UI native calls 未测",
    "不是 #175 的 10k 独立动画，也不是三路径基线",
    "生产路径仍每帧重新声明并编译 UI/命中计划；不宣称结构保留",
  ],
  runs: [],
};
for (let index = 0; index < options.runs; index++) {
  for (const backend of ["canvas", "webgpu"]) {
    const browser = await chromium.launch({ headless: process.env.QUAMOLIT_LAYER_BENCH_HEADLESS === "1" });
    try {
      report.environment.browser = browser.version();
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${url}?demo=layer-composition&t=0.5`);
      await page.waitForFunction(() => window.layerCompositionDemo && document.body.dataset.transition === "idle");
      await page.evaluate((backend) => window.layerCompositionDemo.setBackend(backend), backend);
      const cold = await page.evaluate(() => window.layerCompositionDemo.snapshot());
      assert.equal(cold.backend, backend, JSON.stringify(cold));
      if (backend === "webgpu") {
        assert.doesNotMatch(JSON.stringify(cold.adapter), /swiftshader|llvmpipe|software/i);
        assert.ok(Object.values(cold.adapter).some(Boolean), "必须有硬件 adapter 标识");
        assert.equal(cold.metrics["position-bytes-uploaded"], 80000);
      }
      const measure = await page.evaluate(async (options) => {
        const api = window.layerCompositionDemo;
        window.layerMeasuredApi = api;
        const samples = [];
        const origin = await new Promise(requestAnimationFrame);
        let previous = origin,
          last = origin;
        while (last - origin < (options.warmupSeconds + options.durationSeconds) * 1000) {
          const now = await new Promise(requestAnimationFrame);
          const state = api.seek(((now - origin) / 1500) % 1);
          if (now - origin >= options.warmupSeconds * 1000) samples.push({ ...state, rafIntervalMs: now - previous });
          previous = last = now;
        }
        return { samples, elapsedMs: last - origin - options.warmupSeconds * 1000 };
      }, options);
      await page.getByRole("button", { name: /所有演示/ }).click();
      await page.waitForFunction(() => !window.layerCompositionDemo);
      const afterDispose = await page.evaluate(() => window.layerMeasuredApi.snapshot());
      assert.equal(afterDispose.sourceLive, 0);
      assert.equal(afterDispose.gpuCreated, afterDispose.gpuReleased);
      const run = { index, backend, cold, afterDispose, errors, ...measure };
      const summary = summarizeLayerRun(run);
      const rawFile = `run-${index + 1}-${backend}.json.gz`;
      const raw = gzipSync(JSON.stringify(run));
      await writeFile(`${output}/${rawFile}`, raw);
      report.runs.push({ ...summary, rawFile, rawSha256: createHash("sha256").update(raw).digest("hex") });
      await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
      console.log(
        `${backend} ${index + 1}/${options.runs}: ${summary.frames} 帧, CPU p95=${summary.metrics.cpuFrameMs.p95.toFixed(3)} ms`,
      );
    } finally {
      await browser.close();
    }
  }
}
report.complete = true;
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
console.log(`报告: ${output}/report.json；compositor/GPU 时间保持未知。`);
server?.kill("SIGTERM");
