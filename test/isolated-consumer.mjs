import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, realpath, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { verifyConsumer } from "./consumer-contract.mjs";
import { verifyInstancesConsumer } from "./consumer-instances-contract.mjs";
import { verifyPresenceConsumer } from "./consumer-presence-contract.mjs";
import { verifyRecoveryConsumer } from "./consumer-recovery-contract.mjs";
import { verifyGpuConsumer, verifyDualGpuConsumer, verifyIndependentGpuConsumer } from "./consumer-gpu-contract.mjs";
import {
  verifyGpuConsumerBrowser,
  verifyGpuInstancesConsumerBrowser,
  verifyIndependentGpuConsumerBrowser,
} from "./consumer-gpu-browser.mjs";
import { runConsumerBench } from "./consumer-bench.mjs";
import { verifyFileRecompile } from "./consumer-ffi-recompile.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = join(root, "examples/retained-consumer");
const artifacts = join(root, "test-results/consumer");
const temporary = await mkdtemp(join(tmpdir(), "quamolit-consumer-"));
const source = join(temporary, "source"),
  runtime = join(temporary, "runtime");
const candidate =
  process.env.QUAMOLIT_CONSUMER_REF ||
  spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim();
// 候选库版本不等于本地消费者/测试源码版本；二者分别记录，防止误认旧 SHA 已包含新 fixture。
const harness = {
  revision: spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim(),
  dirty: spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).stdout.trim().length > 0,
  sha256: {},
};
for (const name of [
  "examples/retained-consumer/calcit.cirru",
  "examples/retained-consumer/main.mjs",
  "examples/retained-consumer/instances-input.mjs",
  "examples/retained-consumer/index.html",
  "test/isolated-consumer.mjs",
  "test/consumer-gpu-contract.mjs",
  "test/consumer-gpu-browser.mjs",
  "test/consumer-instances-contract.mjs",
  "test/consumer-presence-contract.mjs",
  "test/consumer-recovery-contract.mjs",
  "test/host/gpu-scalar-readback.mjs",
  "test/consumer-bench.mjs",
  "test/consumer-bench-browser.mjs",
  "test/consumer-ffi-recompile.mjs",
]) {
  harness.sha256[name] = createHash("sha256")
    .update(await readFile(join(root, name)))
    .digest("hex");
}
assert.match(candidate, /^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "候选提交或 tag 必须是安全 Git ref");
await mkdir(artifacts, { recursive: true });
const log = [];
function run(command, args, cwd) {
  console.log(`consumer: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 180_000, maxBuffer: 16 * 1024 * 1024 });
  log.push({ command, args, status: result.status, stdout: result.stdout, stderr: result.stderr });
  assert.equal(result.status, 0, `${command} failed: ${result.error || ""}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
let server, browser, page;
await writeFile(join(artifacts, "report.json"), JSON.stringify({ result: "RUNNING", candidate, temporary }, null, 2));
try {
  await mkdir(source);
  for (const file of [
    "calcit.cirru",
    "deps.cirru",
    "package.json",
    "yarn.lock",
    ".yarnrc.yml",
    "index.html",
    "main.mjs",
    "instances-input.mjs",
  ]) {
    await cp(join(fixture, file), join(source, file));
  }
  run("caps", ["--ci", "add", "Quamolit/quamolit", "-r", candidate], source);
  run("caps", ["--ci", "verify"], source);
  const resolvedModule = await realpath(join(source, ".calcit/modules/quamolit"));
  assert.notEqual(resolvedModule, await realpath(root), "不能链接作者工作树");
  run("yarn", ["install", "--immutable"], source);
  run("calcit", ["analyze", "check-public", "--ns", "app.main"], source);
  run("calcit", ["--emit-path", "target/js/app/", "js"], source);
  const fileRecompile = await verifyFileRecompile({ source, resolvedModule, temporary, run });
  const output = join(source, "target/js/app");
  const modules = new Set();
  // Current Calcit ESM static imports are single-line. Copy only the entry-reachable closure;
  // reject dynamic imports, raw host paths, test modules, and extra npm packages.
  async function collect(name) {
    if (modules.has(name)) return;
    assert.match(name, /^[a-zA-Z0-9.$_-]+\.mjs$/);
    assert.doesNotMatch(name, /(?:^|\.)test(?:\.|-)|-fixture/);
    modules.add(name);
    const code = await readFile(join(output, name), "utf8");
    assert.doesNotMatch(code, /\bimport\s*\(/, "当前门禁不接受动态导入");
    const imports = code.matchAll(
      /^(?:import\s+(?:[^\n]*?\s+from\s+)?|export\s+(?:\*|\{[^\n]*\})\s+from\s+)["']([^"']+)["']/gm,
    );
    for (const [, specifier] of imports) {
      if (specifier === "@calcit/procs") continue;
      assert.match(specifier, /^\.\/[a-zA-Z0-9.$_-]+\.mjs$/, `不允许源码/内部 JS 依赖: ${specifier}`);
      await collect(specifier.slice(2));
    }
    const target = join(runtime, "target/js/app", name);
    await mkdir(dirname(target), { recursive: true });
    await cp(join(output, name), target);
  }
  await collect("app.main.mjs");
  const asset = join(source, ".calcit/modules/js-ffi/js-ffi-assets/document-available.js");
  assert.match(await readFile(asset, "utf8"), /typeof document/);
  assert.match(await readFile(join(runtime, "target/js/app/js-ffi.browser.mjs"), "utf8"), /typeof document/);
  const gpuAsset = join(resolvedModule, "src/host/gpu-component-create.mjs");
  assert.match(await readFile(gpuAsset, "utf8"), /sampleMotion/);
  assert.match(await readFile(join(runtime, "target/js/app/quamolit.gpu-scalar-program.mjs"), "utf8"), /sampleMotion/);
  for (const file of [
    "package.json",
    "yarn.lock",
    ".yarnrc.yml",
    "index.html",
    "main.mjs",
    "instances-input.mjs",
    "node_modules",
  ]) {
    await rename(join(source, file), join(runtime, file));
  }
  // 编译目录改名：实际执行从仅含产物与标准 runtime 的同级目录开始。
  await rename(source, join(temporary, "source-retired"));
  const moduleUrl = (name) => pathToFileURL(join(runtime, "target/js/app", name)).href;
  const app = await import(moduleUrl("app.main.mjs")),
    core = await import(moduleUrl("calcit.core.mjs"));
  const counts = verifyConsumer(app, core);
  const instancesCounts = verifyInstancesConsumer(app, core);
  const presenceCounts = verifyPresenceConsumer(app, core);
  const recoveryCounts = verifyRecoveryConsumer(app, core);
  const gpuCounts = verifyGpuConsumer(app, core);
  const gpuDualCounts = verifyDualGpuConsumer(app, core);
  const independentGpuCounts = verifyIndependentGpuConsumer(app, core);
  assert.throws(
    () => verifyDualGpuConsumer({ ...app, update_dual: (plan) => plan }, core),
    /AssertionError/,
    "反例：停止双轴 CPU 参考更新必须失败",
  );
  assert.throws(
    () => verifyGpuConsumer({ ...app, draw_gpu_$x_: () => {} }, core),
    /AssertionError/,
    "反例：停止 GPU 时间 uniform 写入必须失败",
  );
  assert.throws(
    () => verifyConsumer({ ...app, update_plan: (plan) => plan }, core),
    /AssertionError/,
    "反例：停掉时间采样必须失败",
  );
  assert.throws(
    () => verifyInstancesConsumer({ ...app, draw_instances_$x_: () => ({}) }, core),
    /AssertionError/,
    "反例：伪造实例计数必须失败",
  );
  assert.throws(
    () => verifyPresenceConsumer({ ...app, presence_resource_plan: (_model, previous) => previous }, core),
    /AssertionError/,
    "反例：停掉 Presence 资源同步必须失败",
  );
  assert.throws(
    () => verifyRecoveryConsumer({ ...app, gpu_recovery_lost: (state) => ({ get: () => state }) }, core),
    /AssertionError|TypeError/,
    "反例：停掉 device loss 转移必须失败",
  );
  const errors = [],
    requests = [];
  server = await createServer({
    configFile: false,
    root: runtime,
    server: { host: "127.0.0.1", port: 0, fs: { strict: true, allow: [runtime] } },
  });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  browser = await chromium.launch({ headless: process.env.QUAMOLIT_CONSUMER_HEADED !== "1" });
  page = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => errors.push(`${request.url()} ${request.failure()?.errorText}`));
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(`${url}?fixture=1`);
  await page.waitForFunction(() => window.consumer);
  for (const [time, x] of [
    [1, 120],
    [0, 80],
    [0.5, 100],
    [0.25, 90],
    [1, 120],
  ]) {
    const result = await page.evaluate((t) => window.consumer.set({ time: t }), time);
    assert.equal(result.browser, true, "依赖 :file 片段在浏览器返回 true");
    assert.equal(result.scene.nodes[1].content[1].x, x);
    const pixels = await page.evaluate((x) => {
      const ctx = document.querySelector("canvas").getContext("2d");
      return [
        Array.from(ctx.getImageData(x + 2, 64, 1, 1).data),
        Array.from(ctx.getImageData(18, 102, 1, 1).data),
        Array.from(ctx.getImageData(x - 2, 64, 1, 1).data),
      ];
    }, x);
    assert.deepEqual(pixels, [
      [235, 71, 153, 255],
      [102, 102, 102, 255],
      [0, 0, 0, 0],
    ]);
    assert.equal(result.scene.nodes[2].content[0], "polyline");
    assert.equal(result.transforms[2].e, 20 + 10 * time);
    const ribbon = await page.evaluate(
      (offset) => {
        const ctx = document.querySelector("canvas").getContext("2d");
        return [
          Array.from(ctx.getImageData(offset + 10, 140, 1, 1).data),
          Array.from(ctx.getImageData(offset - 5, 140, 1, 1).data),
        ];
      },
      20 + 10 * time,
    );
    assert.deepEqual(
      ribbon,
      [
        [0, 128, 255, 255],
        [0, 0, 0, 0],
      ],
      "统一入口实际绘制变换后的折线，而不只是序列化其数据",
    );
    if ([0, 0.5, 1].includes(time))
      await page.screenshot({ path: join(artifacts, `frame-${time}.png`), fullPage: true });
  }
  for (const id of ["model", "ready", "viewport"]) await page.click(`#${id}`);
  const changed = await page.evaluate(() => window.consumer.snapshot());
  assert.equal(changed.scene.nodes[1].content[1].y, 63);
  assert.equal(changed.scene.nodes[1].content[1].width, 20);
  assert.equal(changed.declarations, 4);
  assert.deepEqual(
    await page.evaluate(() =>
      Array.from(document.querySelector("canvas").getContext("2d").getImageData(138, 64, 1, 1).data),
    ),
    [0, 179, 102, 255],
  );
  await page.click('[data-mode="dual"]');
  await page.click('[data-time="0.5"]');
  const dual = await page.evaluate(() => window.consumer.snapshot());
  assert.equal(dual.mode, "dual");
  assert.equal(dual.scene.nodes.length, 2);
  assert.equal(dual.scene.nodes[1].content[1].x, 112);
  assert.equal(dual.scene.nodes[1].content[1].y, 79);
  assert.deepEqual(
    await page.evaluate(() =>
      Array.from(document.querySelector("canvas").getContext("2d").getImageData(114, 81, 1, 1).data),
    ),
    [0, 179, 102, 255],
  );
  await page.screenshot({ path: join(artifacts, "dual-frame-0.5.png"), fullPage: true });
  await page.click('[data-mode="mixed"]');
  assert.equal(await page.evaluate(() => window.consumer.snapshot().scene.nodes[2].content[0]), "polyline");
  await page.evaluate(async () => {
    await window.consumer.setMode("presence");
    window.consumer.set({ time: 0 });
  });
  assert.deepEqual(
    (await page.evaluate(() => window.consumer.setPresence("reordered"))).samples.map((item) => item.entry.node.key),
    ["b", "a"],
  );
  await page.evaluate(() => window.consumer.setPresence("without-a"));
  const presenceHalf = await page.evaluate(() => window.consumer.set({ time: 0.5 }));
  const exitingA = presenceHalf.samples.find((item) => item.entry.node.key === "a");
  assert.equal(exitingA.alpha, 0.5);
  assert.equal(exitingA.interactive, false);
  assert.equal(presenceHalf.needsFrame, true);
  const presencePixel = await page.evaluate(() =>
    Array.from(document.querySelector("canvas").getContext("2d").getImageData(80, 60, 1, 1).data),
  );
  assert.ok(presencePixel[3] >= 127 && presencePixel[3] <= 128, "退出中间帧必须绘制半透明卡片");
  await page.screenshot({ path: join(artifacts, "presence-exit-0.5.png"), fullPage: true });
  await page.evaluate(() => window.consumer.setPresence("full"));
  const reentered = await page.evaluate(() => window.consumer.set({ time: 0.75 }));
  assert.ok(reentered.samples.find((item) => item.entry.node.key === "a").alpha > 0.5);
  await page.evaluate(() => {
    window.consumer.set({ time: 1.5 });
    window.consumer.setPresence("settle");
    window.consumer.set({ time: 2 });
    window.consumer.setPresence("without-a");
    window.consumer.set({ time: 3 });
  });
  const presenceSettled = await page.evaluate(() => window.consumer.setPresence("settle"));
  assert.deepEqual(
    presenceSettled.released.map((entry) => entry.node.key),
    ["a"],
  );
  assert.equal(presenceSettled.needsFrame, false);
  assert.equal(
    await page.evaluate(() => document.querySelector("canvas").getContext("2d").getImageData(80, 60, 1, 1).data[3]),
    0,
    "显式结算后退出卡片必须从画面消失",
  );
  await page.screenshot({ path: join(artifacts, "presence-settled.png"), fullPage: true });
  await page.click('[data-mode="instances"]');
  const instancePage = await page.evaluate(() => window.consumer.snapshot());
  assert.equal(instancePage.mode, "instances");
  assert.deepEqual(instancePage.source, { count: 10000, positionBytes: 80000, version: 2, copiedBytes: 8, live: 1 });
  assert.deepEqual(instancePage.metrics, {
    "boundary-calls": 1,
    "canvas-calls": 10000,
    instances: 10000,
    "position-bytes-read": 80000,
  });
  assert.equal(await page.locator('[data-time="0.5"]').isDisabled(), false);
  await page.click('[data-time="1"]');
  const movedInstance = await page.evaluate(() => window.consumer.snapshot());
  assert.equal(movedInstance.source.version, 3);
  assert.equal(movedInstance.source.copiedBytes, 8);
  assert.equal(movedInstance.source.live, 1);
  const instancePixels = await page.evaluate(() => {
    const context = document.querySelector("canvas").getContext("2d");
    return [
      context.getImageData(1, 1, 1, 1).data[3],
      context.getImageData(9, 11, 1, 1).data[3],
      context.getImageData(319, 179, 1, 1).data[3],
    ];
  });
  assert.deepEqual(instancePixels, [255, 255, 0], "10k 公共实例源更新必须真正改变可见画面");
  await page.screenshot({ path: join(artifacts, "instances-10k.png"), fullPage: true });
  const visibleGpu = await page.evaluate(() => window.consumer.setMode("instances-gpu"));
  assert.equal(await page.locator("canvas").count(), 1, "后端切换后仍是一整页的单一 Canvas 舞台");
  assert.equal(visibleGpu.mode, "instances-gpu", "GPU 不可用时保留用户选择，并显示 Canvas 回退");
  if (visibleGpu.recovery.phase[0] === "ready") {
    assert.equal(visibleGpu.metrics["upload-bytes"], 80000);
    assert.equal(visibleGpu.gpuResources, 1);
    const reusedGpu = await page.evaluate(() => window.consumer.set({ time: 1 }));
    assert.equal(reusedGpu.metrics["upload-bytes"], 0, "显式重复绘制才应返回零上传，不能覆盖首次安装计数");
    const previousGeneration = visibleGpu.recovery.generation;
    const changedGpu = await page.evaluate(() => window.consumer.set({ time: 0 }));
    assert.equal(changedGpu.metrics["upload-bytes"], 8);
    assert.equal(changedGpu.source.live, 1);
    const recoveredGpu = await page.evaluate(async () => {
      await window.consumer.simulateGpuLoss("isolated-consumer-loss");
      return window.consumer.snapshot();
    });
    assert.equal(recoveredGpu.mode, "instances-gpu");
    assert.equal(recoveredGpu.recovery.phase[0], "ready");
    assert.equal(recoveredGpu.recovery.generation, previousGeneration + 1);
    assert.equal(recoveredGpu.recovery["resource-version"], changedGpu.source.version);
    assert.equal(recoveredGpu.gpuResources, 1, "device loss 重建后只保留一代 GPU 资源");
    await page.screenshot({ path: join(artifacts, "instances-10k-gpu.png"), fullPage: true });
  } else {
    assert.ok(["fallback", "failed"].includes(visibleGpu.recovery.phase[0]));
    assert.equal(visibleGpu.gpuResources, 0);
    assert.notEqual(await page.locator("#gpu-note").textContent(), "", "GPU 不可用时应可见地回退 Canvas");
  }
  await page.evaluate(() => window.consumer.setMode("instances"));
  await page.check("#independent");
  const independentFrames = [];
  for (const time of [1, 0, 0.5, 0.25, 1]) {
    const state = await page.evaluate((time) => window.consumer.set({ time }), time);
    assert.equal(state.pattern, "independent");
    assert.equal(state.source.copiedBytes, 80000);
    assert.equal(state.source.live, 1);
    assert.equal(state.metrics["canvas-calls"], 10000);
    independentFrames.push({ time, version: state.source.version });
  }
  const independentPixels = await page.evaluate(() => {
    const context = document.querySelector("canvas").getContext("2d");
    return [context.getImageData(8, 10, 1, 1).data[3], context.getImageData(9, 8, 1, 1).data[3]];
  });
  assert.deepEqual(independentPixels, [0, 255], "独立模式终点必须清除原坐标并绘制新坐标，不只更新计数");
  await page.screenshot({ path: join(artifacts, "independent-instances-canvas.png"), fullPage: true });
  const independentGpu = await page.evaluate(() => window.consumer.setMode("instances-gpu"));
  if (independentGpu.recovery.phase[0] === "ready") {
    assert.equal(independentGpu.metrics["upload-bytes"], 80000);
    assert.equal((await page.evaluate(() => window.consumer.set({ time: 1 }))).metrics["upload-bytes"], 0);
    assert.equal((await page.evaluate(() => window.consumer.set({ time: 0.5 }))).metrics["upload-bytes"], 80000);
    await page.screenshot({ path: join(artifacts, "independent-instances-gpu.png"), fullPage: true });
  }
  const scalarGpu = await page.evaluate(() => window.consumer.setMode("instances-scalar"));
  if (scalarGpu.recovery.phase[0] === "ready") {
    assert.equal(scalarGpu.metrics["cold-record-bytes"], 640000);
    assert.equal(scalarGpu.metrics["cold-parameter-bytes"], 1280000);
    for (const time of [1, 0, 0.5, 0.25, 1]) {
      const state = await page.evaluate((time) => window.consumer.set({ time }), time);
      assert.equal(state.source.copiedBytes, 0);
      assert.equal(state.metrics["upload-bytes"], 0);
      assert.equal(state.metrics["parameter-bytes"], 0);
      assert.equal(state.metrics["uniform-bytes"], 16);
    }
    const beforeGeneration = scalarGpu.recovery.generation;
    await page.evaluate(() => window.consumer.simulateGpuLoss("scalar recovery test"));
    await page.waitForFunction(
      (generation) =>
        window.consumer.snapshot().recovery.phase[0] === "ready" &&
        window.consumer.snapshot().recovery.generation > generation,
      beforeGeneration,
    );
    const recovered = await page.evaluate(() => window.consumer.snapshot());
    assert.equal(recovered.gpuResources, 1);
    assert.equal(recovered.metrics["cold-record-bytes"], 640000);
    await page.screenshot({ path: join(artifacts, "independent-instances-scalar.png"), fullPage: true });
  } else {
    assert.equal(scalarGpu.metrics["canvas-calls"], 10000);
    assert.notEqual(await page.locator("#gpu-note").textContent(), "");
  }
  await page.evaluate(() => window.consumer.setMode("instances"));
  await page.evaluate(() => window.consumer.setInstancePattern(false));
  await page.evaluate(() => window.consumer.setMode("mixed"));
  assert.equal(await page.locator("canvas").count(), 1);
  const gpuBrowser = await verifyGpuConsumerBrowser(page, artifacts);
  const gpuDualBrowser = await verifyGpuConsumerBrowser(page, artifacts, true);
  const gpuInstancesBrowser = await verifyGpuInstancesConsumerBrowser(page, artifacts);
  const independentGpuBrowser = await verifyIndependentGpuConsumerBrowser(page, artifacts);
  if (process.env.QUAMOLIT_CONSUMER_REQUIRE_GPU === "1") {
    assert.equal(gpuBrowser.result, "PASS", `要求真实 GPU，但专项未运行：${JSON.stringify(gpuBrowser)}`);
    assert.equal(gpuDualBrowser.result, "PASS", `要求双轴真实 GPU，但专项未运行：${JSON.stringify(gpuDualBrowser)}`);
    assert.equal(
      independentGpuBrowser.result,
      "PASS",
      `要求独立动画真实 GPU，但专项未运行：${JSON.stringify(independentGpuBrowser)}`,
    );
    assert.equal(
      gpuInstancesBrowser.result,
      "PASS",
      `要求 10k 实例真实 GPU，但专项未运行：${JSON.stringify(gpuInstancesBrowser)}`,
    );
  }
  assert.deepEqual(errors, []);
  assert.ok(requests.every((url) => !/test\/host|quamolit\.test|js-ffi-assets|source-retired/.test(url)));
  const benchmark =
    process.env.QUAMOLIT_CONSUMER_BENCH === "1"
      ? await runConsumerBench(browser, url, artifacts, {
          candidate,
          harness,
          calcit: run("calcit", ["-v"], runtime).trim(),
        })
      : null;
  const report = {
    result: "PASS",
    candidate,
    harness,
    temporary,
    resolvedModule,
    modules: [...modules].sort(),
    counts,
    instancesCounts,
    independentInstances: {
      frames: independentFrames,
      gpu: independentGpu.recovery.phase[0] === "ready" ? "PASS" : "SKIP",
      scalar: scalarGpu.recovery.phase[0] === "ready" ? "PASS" : "SKIP",
      counts: independentGpuCounts,
      browser: independentGpuBrowser,
      scope: "同源 GPU 两路径固定完整帧及 Canvas 整数端点；Canvas 中间帧待 #144 合同，未验收正式性能",
    },
    presenceCounts,
    recoveryCounts,
    gpuCounts,
    gpuDualCounts,
    gpuBrowser,
    gpuDualBrowser,
    gpuInstancesBrowser,
    benchmark,
    fileRecompile,
    negativeControl: [
      "停止 CPU 时间采样被断言检出",
      "停止 GPU uniform 写入被断言检出",
      "停止双轴 CPU 参考更新被断言检出",
      "伪造实例计数被断言检出",
      "停止 Presence 资源同步被断言检出",
      "停止 device loss 转移被断言检出",
    ],
    browser: await browser.version(),
    node: process.version,
    calcit: run("calcit", ["-v"], runtime).trim(),
    times: [1, 0, 0.5, 0.25, 1],
    sameTimeInvalidations: ["model", "resources", "viewport"],
    requests,
    limitations: [
      "GPU 硬件结果独立见 gpuBrowser/gpuInstancesBrowser；设备 mock 不是硬件证据",
      "已验证逻辑生命周期、真实实例表释放和 device loss 后同版本重建；尚未验证动态实例端到端性能",
      "模块缓存可复用；消费者目录和运行产物目录独立",
      "JS-only 显式重编译已验证 :file 单函数片段；watch 与 inline 更新未验证",
    ],
  };
  await writeFile(join(artifacts, "report.json"), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        candidate,
        counts,
        instancesCounts,
        presenceCounts,
        recoveryCounts,
        gpuCounts,
        gpuBrowser,
        gpuDualBrowser,
        gpuInstancesBrowser,
        modules: modules.size,
        artifacts,
        runtime,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await writeFile(
    join(artifacts, "report.json"),
    JSON.stringify({ result: "FAIL", candidate, temporary, error: error.stack }, null, 2),
  );
  if (page) await page.screenshot({ path: join(artifacts, "failure.png"), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  await writeFile(join(artifacts, "commands.json"), JSON.stringify(log, null, 2));
  console.log(`独立消费者保留在 ${temporary}，便于检查或复现。`);
}
