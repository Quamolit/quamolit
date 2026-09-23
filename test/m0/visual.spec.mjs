import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const cases = [
  { name: "ui-initial", fixture: "ui-transition", time: 0, maxDiffPixels: 40 },
  { name: "ui-middle", fixture: "ui-transition", time: 0.5, maxDiffPixels: 40 },
  { name: "ui-interrupted", fixture: "ui-transition", time: 0.75, maxDiffPixels: 40 },
  { name: "ui-end", fixture: "ui-transition", time: 1.4, maxDiffPixels: 40 },
  { name: "instances-1k", fixture: "instances", time: 0.5, count: 1_000, maxDiffPixels: 100 },
  { name: "text-path", fixture: "text-path", time: 0.5, maxDiffPixels: 180 },
];

function fixtureUrl(item) {
  const params = new URLSearchParams({
    fixture: item.fixture,
    time: String(item.time),
    count: String(item.count ?? 10_000),
    seed: "7",
    dpr: "1",
    glyph: item.glyphState ?? "ready",
  });
  return `/test/m0/?${params}`;
}

async function attachJson(testInfo, name, value) {
  const path = testInfo.outputPath(`${name}.json`);
  await writeFile(path, JSON.stringify(value, null, 2));
  await testInfo.attach(name, { path, contentType: "application/json" });
}

async function environment(page) {
  return {
    browserVersion: page.context().browser()?.version() ?? "unavailable",
    userAgent: await page.evaluate(() => navigator.userAgent),
    os: process.platform,
    node: process.version,
    gitSha: process.env.GITHUB_SHA ?? null,
    viewport: page.viewportSize(),
    devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
  };
}

async function openFixture(page, testInfo, item) {
  const url = fixtureUrl(item);
  await attachJson(testInfo, "requested-input", { url, ...item, viewport: [1280, 720], dpr: 1 });
  await page.goto(url);
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true", { timeout: 10_000 });
  await expect(page.locator("#status")).toHaveAttribute("data-result", "ready");
  const snapshot = JSON.parse(await page.locator("#manifest").textContent());
  expect(snapshot.manifest.resources.glyphAtlas.state).toBe("ready");
  expect(snapshot.manifest.dpr).toBe(1);
  expect(snapshot.sampleTime).toBe(item.time);
  await attachJson(testInfo, "runtime-manifest", { ...snapshot, environment: await environment(page) });
  return snapshot;
}

for (const item of cases) {
  test(`固定画面 ${item.name}`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const snapshot = await openFixture(page, testInfo, item);
    const canvas = page.locator("#frame");
    await expect(canvas).toHaveAttribute("width", "640");
    await expect(canvas).toHaveAttribute("height", "360");

    if (item.name === "ui-middle") {
      const colors = await canvas.evaluate((element) => {
        const ctx = element.getContext("2d");
        const pixel = (x, y) => [...ctx.getImageData(x, y, 1, 1).data];
        return { background: pixel(20, 20), card: pixel(550, 150), paper: pixel(40, 100) };
      });
      expect(colors).toEqual({
        background: [245, 247, 252, 255],
        card: [91, 91, 214, 255],
        paper: [255, 255, 255, 255],
      });
      expect(snapshot.referenceModel.ui.panelPhase).toBe("present");
      if (process.env.QUAMOLIT_VISUAL_MUTATION === "color") {
        await canvas.evaluate((element) => {
          const ctx = element.getContext("2d");
          ctx.fillStyle = "#00ff00";
          ctx.fillRect(450, 190, 35, 35);
        });
      }
    }

    // The per-scene edge allowance is below a visibly shifted or missing shape.
    await expect(canvas).toHaveScreenshot(`${item.name}.png`, {
      threshold: 0.04,
      maxDiffPixels: item.maxDiffPixels,
      animations: "disabled",
      caret: "hide",
    });
    expect(errors).toEqual([]);
  });
}

test("固定输入序列和重复绘制可重放", async ({ page }, testInfo) => {
  await openFixture(page, testInfo, { fixture: "ui-transition", time: 0.75 });
  const first = await page.locator("#frame").evaluate((canvas) => canvas.toDataURL("image/png"));
  const replay = await page.evaluate(() => {
    for (const time of [0, 0.5, 1.4, 0.75]) window.quamolitM0.renderAt(time);
    return {
      image: window.quamolitM0.getFramePng(),
      model: window.quamolitM0.getReferenceModel(),
    };
  });
  expect(replay.image).toBe(first);
  expect(replay.model.ui.appliedEvents).toContain("target-interrupt");
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  expect(await page.locator("#frame").evaluate((canvas) => canvas.toDataURL("image/png"))).toBe(first);
});

test("手动打断的输入记录可在刷新后重放", async ({ page }, testInfo) => {
  await openFixture(page, testInfo, { fixture: "ui-transition", time: 0.75 });
  await page.getByRole("button", { name: "此刻改目标" }).click();
  const model = await page.evaluate(() => window.quamolitM0.renderAt(1));
  const first = await page.locator("#frame").evaluate((canvas) => canvas.toDataURL("image/png"));
  const recordedUrl = page.url();
  expect(recordedUrl).toContain("events=");
  await attachJson(testInfo, "recorded-input", { recordedUrl, model });
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  const replayed = await page.evaluate(() => window.quamolitM0.renderAt(1));
  expect(replayed).toEqual(model);
  expect(await page.locator("#frame").evaluate((canvas) => canvas.toDataURL("image/png"))).toBe(first);
});

test("资源未就绪不能被视觉门禁当作成功", async ({ page }, testInfo) => {
  await expect(openFixture(page, testInfo, { fixture: "text-path", time: 0.5, glyphState: "error" })).rejects.toThrow();
  await expect(openFixture(page, testInfo, { fixture: "text-path", time: 0.5, glyphState: "loading" })).rejects.toThrow();
});

test("旧版顺序帧夹具检查矩形中间帧与只绘制重放", async ({ page }, testInfo) => {
  await attachJson(testInfo, "requested-input", { page: "/test/visual.html", time: 0.5, sequence: [0, 0.25, 0.5, 0.75, 1] });
  await page.goto("/test/visual.html?time=0.5");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass", { timeout: 10_000 });
  await attachJson(testInfo, "runtime-manifest", { time: 0.5, environment: await environment(page) });
  const result = await page.evaluate(() => {
    const first = window.quamolitFixture.renderAt(0.5);
    const count = window.quamolitFixture.runChecks();
    const second = window.quamolitFixture.renderAt(0.5);
    return { same: first === second, count, progress: window.quamolitFixture.progress() };
  });
  expect(result).toEqual({ same: true, count: 5, progress: 0.5 });
  await expect(page.locator("#frame")).toHaveScreenshot("legacy-half.png", { threshold: 0.04, maxDiffPixels: 40 });
});
