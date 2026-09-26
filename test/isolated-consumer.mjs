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
import { verifyGpuConsumer, verifyDualGpuConsumer } from "./consumer-gpu-contract.mjs";
import { verifyGpuConsumerBrowser } from "./consumer-gpu-browser.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = join(root, "examples/retained-consumer");
const artifacts = join(root, "test-results/consumer");
const temporary = await mkdtemp(join(tmpdir(), "quamolit-consumer-"));
const source = join(temporary, "source"), runtime = join(temporary, "runtime");
const candidate = process.env.QUAMOLIT_CONSUMER_REF || spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim();
// 候选库版本不等于本地消费者/测试源码版本；二者分别记录，防止误认旧 SHA 已包含新 fixture。
const harness = {
  revision: spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim(),
  dirty: spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).stdout.trim().length > 0,
  sha256: {},
};
for (const name of ["examples/retained-consumer/calcit.cirru", "examples/retained-consumer/main.mjs", "examples/retained-consumer/index.html",
  "test/isolated-consumer.mjs", "test/consumer-gpu-contract.mjs", "test/consumer-gpu-browser.mjs", "test/host/gpu-scalar-readback.mjs"]) {
  harness.sha256[name] = createHash("sha256").update(await readFile(join(root, name))).digest("hex");
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
  for (const file of ["calcit.cirru", "deps.cirru", "package.json", "yarn.lock", ".yarnrc.yml", "index.html", "main.mjs"]) {
    await cp(join(fixture, file), join(source, file));
  }
  run("caps", ["--ci", "add", "Quamolit/quamolit", "-r", candidate], source);
  run("caps", ["--ci", "verify"], source);
  const resolvedModule = await realpath(join(source, ".calcit/modules/quamolit"));
  assert.notEqual(resolvedModule, await realpath(root), "不能链接作者工作树");
  run("yarn", ["install", "--immutable"], source);
  run("calcit", ["analyze", "check-public", "--ns", "app.main"], source);
  run("calcit", ["--emit-path", "target/js/app/", "js"], source);
  const output = join(source, "target/js/app");
  const modules = new Set();
  // Calcit 0.22 输出的 ESM 静态导入均为单行。只复制入口可达闭包，
  // 禁止动态导入、原始宿主文件、测试模块及除标准 runtime 外的 npm 包。
  async function collect(name) {
    if (modules.has(name)) return;
    assert.match(name, /^[a-zA-Z0-9.$_-]+\.mjs$/);
    assert.doesNotMatch(name, /(?:^|\.)test(?:\.|-)|-fixture/);
    modules.add(name);
    const code = await readFile(join(output, name), "utf8");
    assert.doesNotMatch(code, /\bimport\s*\(/, "当前门禁不接受动态导入");
    const imports = code.matchAll(/^(?:import\s+(?:[^\n]*?\s+from\s+)?|export\s+(?:\*|\{[^\n]*\})\s+from\s+)["']([^"']+)["']/gm);
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
  for (const file of ["package.json", "yarn.lock", ".yarnrc.yml", "index.html", "main.mjs", "node_modules"]) {
    await rename(join(source, file), join(runtime, file));
  }
  // 编译目录改名：实际执行从仅含产物与标准 runtime 的同级目录开始。
  await rename(source, join(temporary, "source-retired"));
  const moduleUrl = name => pathToFileURL(join(runtime, "target/js/app", name)).href;
  const app = await import(moduleUrl("app.main.mjs")), core = await import(moduleUrl("calcit.core.mjs"));
  const counts = verifyConsumer(app, core);
  const gpuCounts = verifyGpuConsumer(app, core);
  const gpuDualCounts = verifyDualGpuConsumer(app, core);
  assert.throws(() => verifyDualGpuConsumer({ ...app, update_dual: plan => plan }, core), /AssertionError/,
    "反例：停止双轴 CPU 参考更新必须失败");
  assert.throws(() => verifyGpuConsumer({ ...app, draw_gpu_$x_: () => {} }, core), /AssertionError/,
    "反例：停止 GPU 时间 uniform 写入必须失败");
  assert.throws(() => verifyConsumer({ ...app, update_plan: plan => plan }, core), /AssertionError/, "反例：停掉时间采样必须失败");
  const errors = [], requests = [];
  server = await createServer({ configFile: false, root: runtime, server: { host: "127.0.0.1", port: 0, fs: { strict: true, allow: [runtime] } } });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  browser = await chromium.launch({ headless: process.env.QUAMOLIT_CONSUMER_HEADED !== "1" });
  page = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
  page.on("pageerror", error => errors.push(error.message));
  page.on("requestfailed", request => errors.push(`${request.url()} ${request.failure()?.errorText}`));
  page.on("request", request => requests.push(request.url()));
  await page.goto(`${url}?fixture=1`);
  await page.waitForFunction(() => window.consumer);
  for (const [time, x] of [[1, 120], [0, 80], [0.5, 100], [0.25, 90], [1, 120]]) {
    const result = await page.evaluate(t => window.consumer.set({ time: t }), time);
    assert.equal(result.browser, true, "依赖 :file 片段在浏览器返回 true");
    assert.equal(result.scene.nodes[1].content[1].x, x);
    const pixels = await page.evaluate(x => {
      const ctx = document.querySelector("canvas").getContext("2d");
      return [Array.from(ctx.getImageData(x + 2, 64, 1, 1).data), Array.from(ctx.getImageData(18, 102, 1, 1).data), Array.from(ctx.getImageData(x - 2, 64, 1, 1).data)];
    }, x);
    assert.deepEqual(pixels, [[235, 71, 153, 255], [102, 102, 102, 255], [0, 0, 0, 0]]);
    assert.equal(result.scene.nodes[2].content[0], "polyline");
    assert.equal(result.transforms[2].e,20+10*time);
    const ribbon=await page.evaluate(offset=>{
      const ctx=document.querySelector("canvas").getContext("2d");
      return [Array.from(ctx.getImageData(offset+10,140,1,1).data),Array.from(ctx.getImageData(offset-5,140,1,1).data)];
    },20+10*time);
    assert.deepEqual(ribbon,[[0,128,255,255],[0,0,0,0]],"统一入口实际绘制变换后的折线，而不只是序列化其数据");
    if ([0, 0.5, 1].includes(time)) await page.screenshot({ path: join(artifacts, `frame-${time}.png`), fullPage: true });
  }
  for (const id of ["model", "ready", "viewport"]) await page.click(`#${id}`);
  const changed = await page.evaluate(() => window.consumer.snapshot());
  assert.equal(changed.scene.nodes[1].content[1].y, 63);
  assert.equal(changed.scene.nodes[1].content[1].width, 20);
  assert.equal(changed.declarations, 4);
  assert.deepEqual(await page.evaluate(() => Array.from(document.querySelector("canvas").getContext("2d").getImageData(138, 64, 1, 1).data)), [0, 179, 102, 255]);
  await page.click('[data-mode="dual"]');
  await page.click('[data-time="0.5"]');
  const dual = await page.evaluate(() => window.consumer.snapshot());
  assert.equal(dual.mode, "dual");
  assert.equal(dual.scene.nodes.length, 2);
  assert.equal(dual.scene.nodes[1].content[1].x, 112);
  assert.equal(dual.scene.nodes[1].content[1].y, 79);
  assert.deepEqual(await page.evaluate(() => Array.from(document.querySelector("canvas").getContext("2d").getImageData(114, 81, 1, 1).data)), [0, 179, 102, 255]);
  await page.screenshot({ path: join(artifacts, "dual-frame-0.5.png"), fullPage: true });
  await page.click('[data-mode="mixed"]');
  assert.equal(await page.evaluate(() => window.consumer.snapshot().scene.nodes[2].content[0]), "polyline");
  const gpuBrowser = await verifyGpuConsumerBrowser(page, artifacts);
  const gpuDualBrowser = await verifyGpuConsumerBrowser(page, artifacts, true);
  if (process.env.QUAMOLIT_CONSUMER_REQUIRE_GPU === "1") {
    assert.equal(gpuBrowser.result, "PASS", `要求真实 GPU，但专项未运行：${JSON.stringify(gpuBrowser)}`);
    assert.equal(gpuDualBrowser.result, "PASS", `要求双轴真实 GPU，但专项未运行：${JSON.stringify(gpuDualBrowser)}`);
  }
  assert.deepEqual(errors, []);
  assert.ok(requests.every(url => !/test\/host|quamolit\.test|js-ffi-assets|source-retired/.test(url)));
  const report = { result: "PASS", candidate, harness, temporary, resolvedModule, modules: [...modules].sort(), counts, gpuCounts, gpuDualCounts, gpuBrowser, gpuDualBrowser,
    negativeControl: ["停止 CPU 时间采样被断言检出", "停止 GPU uniform 写入被断言检出", "停止双轴 CPU 参考更新被断言检出"],
    browser: await browser.version(), node: process.version, calcit: run("calcit", ["-v"], runtime).trim(),
    times: [1, 0, 0.5, 0.25, 1], sameTimeInvalidations: ["model", "resources", "viewport"], requests,
    limitations: ["GPU 硬件结果独立见 gpuBrowser；设备 mock 不是硬件证据", "尚未验证逻辑生命周期集成、真实资源表释放与端到端性能", "模块缓存可复用；消费者目录和运行产物目录独立", "尚未验证仅 JS 片段修改后的显式重编译"] };
  await writeFile(join(artifacts, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ result: "PASS", candidate, counts, gpuCounts, gpuBrowser, gpuDualBrowser, modules: modules.size, artifacts, runtime }, null, 2));
} catch (error) {
  await writeFile(join(artifacts, "report.json"), JSON.stringify({ result: "FAIL", candidate, temporary, error: error.stack }, null, 2));
  if (page) await page.screenshot({ path: join(artifacts, "failure.png"), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  await writeFile(join(artifacts, "commands.json"), JSON.stringify(log, null, 2));
  console.log(`独立消费者保留在 ${temporary}，便于检查或复现。`);
}
