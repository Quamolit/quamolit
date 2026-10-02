import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { compareFanDisplay } from "./host/folding-fan-reference.mjs";

test("共享调度：暂停加载唤醒、终点停帧与卸载后的迟到图片隔离", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    window.holdFanDecode = true;
    window.fanDecodes = 0;
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this);
      if (window.holdFanDecode && this.src.endsWith("/assets/lotus.jpg")) {
        window.fanDecodes++;
        await new Promise((resolve) => {
          window.releaseFanDecode = resolve;
        });
      }
    };
  });
  await page.goto("/demos/index.html?demo=folding-fan&t=0.18&events=0", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.fanDecodes)).toBe(1);
  const snapshot = () => page.evaluate(() => window.foldingFanDemo.snapshot());
  await expect.poll(async () => (await snapshot()).pending).toBe(false);
  const loading = await snapshot();
  expect(loading.resource).toBe("loading");
  expect(loading.playing).toBe(false);
  await page.evaluate(() => window.foldingFanDemo.pause());
  await page.evaluate(() => {
    window.holdFanDecode = false;
    window.releaseFanDecode();
  });
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await expect.poll(async () => (await snapshot()).pending).toBe(false);
  const ready = await snapshot();
  expect(ready.time).toBe(loading.time);
  expect(ready.model).toEqual(loading.model);
  expect(ready.paints).toBeGreaterThan(loading.paints);
  expect(await compareHistoricalRenderer(page)).toMatchObject({ differentPixels: 0, maxChannelDelta: 0 });
  await page.waitForTimeout(2100);
  expect((await snapshot()).paints).toBe(ready.paints);
  await page.click("#toggle-fold");
  await expect.poll(async () => (await snapshot()).playing).toBe(false);
  expect((await snapshot()).pending).toBe(false);
  expect((await snapshot()).foldValue).toBe(0);
  // 再请求一个版本并离开共享 canvas；迟到完成只能清理资源，不能重新提交帧。
  await page.evaluate(() => {
    window.holdFanDecode = true;
    window.closedFan = window.foldingFanDemo;
    void window.closedFan.loadResource(2);
  });
  await expect.poll(() => page.evaluate(() => window.fanDecodes)).toBe(2);
  await page.click("#back-to-gallery");
  await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
  expect(await page.evaluate(() => typeof window.foldingFanDemo)).toBe("undefined");
  const closed = await page.evaluate(() => window.closedFan.snapshot());
  expect(closed).toMatchObject({ disposed: true, pending: false, playing: false });
  const pixels = await page.locator("canvas").evaluate((canvas) => canvas.toDataURL());
  await page.evaluate(() => {
    window.holdFanDecode = false;
    window.releaseFanDecode();
  });
  await expect.poll(() => page.evaluate(() => window.closedFan.snapshot().loadQueue.running)).toBe(0);
  await page.waitForTimeout(100);
  const settled = await page.evaluate(() => window.closedFan.snapshot());
  expect(settled.paints).toBe(closed.paints);
  expect(settled.pending).toBe(false);
  expect(settled.imageMetrics.live).toBe(0);
  expect(await page.locator("canvas").evaluate((canvas) => canvas.toDataURL())).toBe(pixels);
  expect(errors).toEqual([]);
});

test("文字与折线使用完整 Canvas Scene，DPR 2 中间帧与独立原生参考全像素一致", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: 900, height: 650 } });
  const page = await context.newPage();
  try {
    await page.goto("/examples/folding-fan/index.html?t=0.18&events=0&clip=window&annotations=1");
    await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
    const before = await page.evaluate(() => window.foldingFanDemo.snapshot());
    expect(before.annotated).toBe(true);
    expect(before.slices).toHaveLength(24);
    const comparison = await compareFanDisplay(page);
    expect(comparison).toMatchObject({ differentPixels: 0, maxChannelDelta: 0 });
    expect(comparison.notePixels).toBeGreaterThan(1000);
    await page.setViewportSize({ width: 700, height: 500 });
    await expect.poll(() => page.evaluate(() => window.foldingFanDemo.snapshot().width)).toBe(1400);
    expect(await compareFanDisplay(page)).toMatchObject({ differentPixels: 0, maxChannelDelta: 0 });
    await page.click("#share");
    expect(new URL(page.url()).searchParams.get("annotations")).toBe("1");
    await page.reload();
    await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
    expect(await compareFanDisplay(page)).toMatchObject({ differentPixels: 0, maxChannelDelta: 0 });
    expect((await page.evaluate(() => window.foldingFanDemo.snapshot())).model).toEqual(before.model);
    await page.screenshot({ path: testInfo.outputPath("fan-mixed-canvas-dpr2.png") });
  } finally {
    await context.close();
  }
});

async function savePureCanvas(page, path) {
  const dataUrl = await page.locator("canvas").evaluate((canvas) => canvas.toDataURL("image/png"));
  await writeFile(path, Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64"));
}

test("父组窗口裁剪保持原模型，窗口外无残留，分享与 DPR 2 暂停 resize 可重放", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: 900, height: 650 } });
  const page = await context.newPage();
  try {
    await page.goto("/examples/folding-fan/index.html?t=0.18&events=0&clip=window");
    await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
    const before = await page.evaluate(() => window.foldingFanDemo.snapshot());
    expect(before.clipped).toBe(true);
    const inspect = () =>
      page.locator("canvas").evaluate((canvas) => {
        const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        const scale = Math.min(canvas.width / 900, canvas.height / 650);
        const left = canvas.width / 2 - 150 * scale,
          right = canvas.width / 2 + 150 * scale;
        const top = canvas.height * 0.77 - 400 * scale,
          bottom = canvas.height * 0.77 - 100 * scale;
        let escaped = 0,
          inside = 0;
        for (let y = 0; y < canvas.height; y++)
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            if (data[i] === 23 && data[i + 1] === 16 && data[i + 2] === 34 && data[i + 3] === 255) continue;
            // Only allow the declared Canvas antialias boundary, not leaking descendants.
            if (x < Math.floor(left) || x >= Math.ceil(right) || y < Math.floor(top) || y >= Math.ceil(bottom))
              escaped++;
            else inside++;
          }
        return { escaped, inside };
      });
    expect(await inspect()).toMatchObject({ escaped: 0 });
    expect((await inspect()).inside).toBeGreaterThan(1000);
    await page.setViewportSize({ width: 700, height: 500 });
    await expect.poll(() => page.evaluate(() => window.foldingFanDemo.snapshot().width)).toBe(1400);
    expect((await page.evaluate(() => window.foldingFanDemo.snapshot())).model).toEqual(before.model);
    expect(await inspect()).toMatchObject({ escaped: 0 });
    await page.click("#share");
    expect(new URL(page.url()).searchParams.get("clip")).toBe("window");
    await page.reload();
    await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
    expect((await page.evaluate(() => window.foldingFanDemo.snapshot())).model).toEqual(before.model);
    await page.screenshot({ path: testInfo.outputPath("fan-canvas-window-dpr2.png") });
    await page.uncheck("#clip-window");
    expect((await page.evaluate(() => window.foldingFanDemo.snapshot())).model).toEqual(before.model);
  } finally {
    await context.close();
  }
});

async function compareHistoricalRenderer(page) {
  return page.evaluate(async () => {
    const canvas = document.querySelector("canvas");
    const actualContext = canvas.getContext("2d");
    const reference = document.createElement("canvas");
    reference.width = canvas.width;
    reference.height = canvas.height;
    const context = reference.getContext("2d");
    context.fillStyle = "#171022";
    context.fillRect(0, 0, reference.width, reference.height);

    const image = new Image();
    image.src = new URL("../../assets/lotus.jpg", location.href).href;
    await image.decode();
    const scale = Math.min(reference.width / 900, reference.height / 650);
    context.setTransform(scale, 0, 0, scale, reference.width / 2, reference.height * 0.77);
    const snapshot = window.foldingFanDemo.snapshot();
    for (const slice of snapshot.slices) {
      const cosine = Math.cos(slice.angle);
      const sine = Math.sin(slice.angle);
      context.save();
      context.transform(cosine, sine, -sine, cosine, 0, 0);
      context.drawImage(
        image,
        slice["source-x"],
        0,
        slice["source-width"],
        432,
        -650 / 48,
        -432,
        slice["source-width"],
        432,
      );
      context.restore();
    }

    const actual = actualContext.getImageData(0, 0, canvas.width, canvas.height).data;
    const expected = context.getImageData(0, 0, reference.width, reference.height).data;
    let differentPixels = 0;
    let maxChannelDelta = 0;
    for (let offset = 0; offset < actual.length; offset += 4) {
      let different = false;
      for (let channel = 0; channel < 4; channel += 1) {
        const delta = Math.abs(actual[offset + channel] - expected[offset + channel]);
        if (delta !== 0) different = true;
        if (delta > maxChannelDelta) maxChannelDelta = delta;
      }
      if (different) differentPixels += 1;
    }
    return {
      differentPixels,
      maxChannelDelta,
      imageSmoothingEnabled: actualContext.imageSmoothingEnabled,
      imageSmoothingQuality: actualContext.imageSmoothingQuality,
      pixelWidth: canvas.width,
      pixelHeight: canvas.height,
    };
  });
}

async function ready(page, suffix = "?t=0") {
  await page.goto(`http://127.0.0.1:5180/examples/folding-fan/index.html${suffix}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}
test("24 切片 Toggle 中间帧、终点与乱序截图", async ({ page }, testInfo) => {
  await ready(page);
  const start = await page.evaluate(() => window.foldingFanDemo.snapshot());
  expect(start.slices).toHaveLength(24);
  expect(start.resource).toBe("ready");
  expect(start.imageMetrics).toEqual({
    created: 1,
    released: 0,
    live: 1,
    "decoded-bytes": 650 * 432 * 4,
  });
  expect(start.loadQueue).toMatchObject({
    pending: 0,
    running: 0,
    "cancelled-running": 0,
    available: 1,
  });
  const colorAtFlower = () =>
    page.locator("canvas").evaluate((canvas) => [...canvas.getContext("2d").getImageData(500, 280, 1, 1).data]);
  const closedPixel = await colorAtFlower();
  const comparisons = {};
  comparisons.closed = await compareHistoricalRenderer(page);
  expect(comparisons.closed).toEqual({
    differentPixels: 0,
    maxChannelDelta: 0,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "low",
    pixelWidth: 1280,
    pixelHeight: 720,
  });
  await page.screenshot({ path: testInfo.outputPath("fan-closed-overlay.png") });
  await savePureCanvas(page, testInfo.outputPath("fan-closed-canvas.png"));
  await page.evaluate(() => window.foldingFanDemo.clickToggle(0));
  const mid = await page.evaluate(() => window.foldingFanDemo.seek(0.18));
  expect(mid.foldValue).toBeCloseTo(0.5);
  expect(mid.slices[0].angle).toBeLessThan(0);
  comparisons.mid = await compareHistoricalRenderer(page);
  expect(comparisons.mid).toMatchObject({ differentPixels: 0, maxChannelDelta: 0 });
  await page.screenshot({ path: testInfo.outputPath("fan-mid-overlay.png") });
  await savePureCanvas(page, testInfo.outputPath("fan-mid-canvas.png"));
  const opened = await page.evaluate(() => window.foldingFanDemo.seek(0.36));
  expect(opened.foldValue).toBe(1);
  expect(await colorAtFlower()).not.toEqual(closedPixel);
  comparisons.open = await compareHistoricalRenderer(page);
  expect(comparisons.open).toMatchObject({ differentPixels: 0, maxChannelDelta: 0 });
  await page.screenshot({ path: testInfo.outputPath("fan-open-overlay.png") });
  await savePureCanvas(page, testInfo.outputPath("fan-open-canvas.png"));
  await writeFile(
    testInfo.outputPath("fan-historical-comparison-dpr1.json"),
    `${JSON.stringify(comparisons, null, 2)}\n`,
  );
  const replay = await page.evaluate(() => window.foldingFanDemo.seek(0.18));
  expect(replay.slices).toEqual(mid.slices);
  const reverse = await page.evaluate(() => window.foldingFanDemo.clickToggle(0.18));
  expect(reverse.foldValue).toBeCloseTo(mid.foldValue);
  await page.locator("#share").click();
  expect(new URL(page.url()).searchParams.get("events")).toBe("0,0.18");
  await page.reload();
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  expect((await page.evaluate(() => window.foldingFanDemo.snapshot())).foldValue).toBeCloseTo(reverse.foldValue);
  const settled = await page.evaluate(() => window.foldingFanDemo.seek(0.54));
  expect(settled.foldValue).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("fan-closed-again.png") });
  const pixel = await page.locator("canvas").evaluate((canvas) => {
    const ctx = canvas.getContext("2d"),
      { width, height } = canvas;
    return [...ctx.getImageData(Math.round(width / 2), Math.round(height * 0.55), 1, 1).data];
  });
  expect(pixel[3]).toBe(255);
});
test("图片失败明确报错，不冒充正常渲染", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/folding-fan/index.html?image=missing&t=0");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "error");
  await expect(page.locator("#message")).toContainText("图片加载失败");
  const failed = await page.evaluate(() => window.foldingFanDemo.snapshot());
  expect(failed.resource).toBe("error");
  expect(failed.resourceState.attempts).toBe(1);
  expect(failed.imageMetrics).toEqual({ created: 1, released: 1, live: 0, "decoded-bytes": 0 });
  expect(failed.loadQueue).toMatchObject({ pending: 0, running: 0, "cancelled-running": 0, available: 1 });
  await page.evaluate(() => window.foldingFanDemo.loadResource());
  await expect(page.locator("#status")).toHaveAttribute("data-result", "error");
  const retried = await page.evaluate(() => window.foldingFanDemo.snapshot());
  expect(retried.resourceState.attempts).toBe(2);
  expect(retried.imageMetrics).toEqual({ created: 2, released: 2, live: 0, "decoded-bytes": 0 });
});
test("全屏 DPR 2 暂停 resize 与浮层收起", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    await page.evaluate(() => {
      window.foldingFanDemo.clickToggle(0);
      window.foldingFanDemo.seek(0.18);
    });
    const before = await page.evaluate(() => window.foldingFanDemo.snapshot());
    const dpr2Comparison = await compareHistoricalRenderer(page);
    expect(dpr2Comparison).toEqual({
      differentPixels: 0,
      maxChannelDelta: 0,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "low",
      pixelWidth: 2560,
      pixelHeight: 1800,
    });
    await page.screenshot({ path: testInfo.outputPath("fan-mid-dpr2-overlay.png") });
    await savePureCanvas(page, testInfo.outputPath("fan-mid-dpr2-canvas.png"));
    await writeFile(
      testInfo.outputPath("fan-historical-comparison-dpr2.json"),
      `${JSON.stringify({ mid: dpr2Comparison }, null, 2)}\n`,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    const after = await page.evaluate(() => window.foldingFanDemo.snapshot());
    expect(after.time).toBe(before.time);
    expect(after.model).toEqual(before.model);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("fan-mobile-dpr2.png") });
  } finally {
    await context.close();
  }
});

test("历史 seek 只重放事件前缀；分支与刷新保持相同像素", async ({ page }, testInfo) => {
  await ready(page, "?events=0,0.18");
  const imported = await page.evaluate(() => window.foldingFanDemo.snapshot());
  expect(imported.events.map((event) => event.at)).toEqual([0, 0.18]);
  expect(imported.time).toBe(0);
  await ready(page, "?t=0.05&events=0,0.18");
  const historical = await page.evaluate(() => ({
    snapshot: window.foldingFanDemo.snapshot(),
    pixels: document.querySelector("canvas").toDataURL(),
  }));
  expect(historical.snapshot.events.map((event) => event.at)).toEqual([0, 0.18]);
  await ready(page, "?t=0.05&events=0");
  const prefix = await page.evaluate(() => ({
    snapshot: window.foldingFanDemo.snapshot(),
    pixels: document.querySelector("canvas").toDataURL(),
  }));
  expect(historical.snapshot.slices).toEqual(prefix.snapshot.slices);
  expect(historical.pixels).toBe(prefix.pixels);
  await page.evaluate(() => {
    window.foldingFanDemo.clickToggle(0.18);
    window.foldingFanDemo.seek(0.05);
  });
  const branch = await page.evaluate(() => window.foldingFanDemo.clickToggle(0.05));
  expect(branch.events.map((event) => event.at)).toEqual([0, 0.05]);
  await page.screenshot({ path: testInfo.outputPath("fan-historical-branch.png") });
  const branchPixels = await page.locator("canvas").evaluate((canvas) => canvas.toDataURL());
  await page.locator("#share").click();
  expect(new URL(page.url()).searchParams.get("events")).toBe("0,0.05");
  await page.reload();
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  expect((await page.evaluate(() => window.foldingFanDemo.snapshot())).slices).toEqual(branch.slices);
  expect(await page.locator("canvas").evaluate((canvas) => canvas.toDataURL())).toBe(branchPixels);
});

test("100 次 Toggle URL 可重放，继续追加时保持有界", async ({ page }) => {
  const times = Array.from({ length: 100 }, (_, index) => (index / 100).toFixed(2)).join(",");
  await ready(page, `?t=1&events=${times}`);
  const before = await page.evaluate(() => window.foldingFanDemo.snapshot());
  expect(before.events).toHaveLength(100);
  expect(before.model.folded).toBe(false);
  expect(before.foldValue).toBeGreaterThan(0);
  expect(before.foldValue).toBeLessThan(1);
  const result = await page.evaluate(() => {
    try {
      window.foldingFanDemo.clickToggle(1);
      return "unexpected-success";
    } catch (cause) {
      return String(cause);
    }
  });
  expect(result).toContain("fan-log-capacity");
  await page.locator("#toggle-fold").click();
  await expect(page.locator("#message")).toContainText("输入日志已满 100 条");
  const after = await page.evaluate(() => window.foldingFanDemo.snapshot());
  expect(after.events).toEqual(before.events);
  expect(after.slices).toEqual(before.slices);
});
