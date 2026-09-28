import { expect, test } from "@playwright/test";

async function ready(page, time = 0) {
  await page.goto(`http://127.0.0.1:5180/examples/icons/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

async function captureWithAndWithoutOverlay(page, testInfo, name) {
  await page.screenshot({ path: testInfo.outputPath(`${name}-overlay.png`) });
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeHidden();
  await page.locator("nav, #panel-toggle").evaluateAll((elements) => {
    for (const element of elements) element.hidden = true;
  });
  await page.screenshot({ path: testInfo.outputPath(`${name}-canvas.png`) });
  await page.locator("nav, #panel-toggle").evaluateAll((elements) => {
    for (const element of elements) element.hidden = false;
  });
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeVisible();
}

async function canvasPoint(page, x, y) {
  return page.locator("canvas").evaluate(
    (canvas, point) => {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(canvas.width / 900, canvas.height / 540);
      return {
        x: (canvas.width * 0.42 + point.x * scale) / (canvas.width / rect.width),
        y: (canvas.height / 2 + point.y * scale) / (canvas.height / rect.height),
      };
    },
    { x, y },
  );
}

test("历史数字交叉位移的初始、中间和终点帧完整保留", async ({ page }, testInfo) => {
  await ready(page);
  const at = (time) => page.evaluate((value) => window.iconsDemo.seek(value), time);
  const start = await page.evaluate(() => window.iconsDemo.snapshot());
  expect(start.scene.nodes.slice(4, 6).map((node) => node.content[1].text)).toEqual(["1", "2"]);
  await captureWithAndWithoutOverlay(page, testInfo, "icons-history-start");

  await page.evaluate(() => window.iconsDemo.clickIncrease(0));
  const middle = await at(0.125);
  expect(middle.scene.nodes.slice(4, 6).map((node) => node.content[1].y)).toEqual([19, 1]);
  expect(middle.scene.nodes.slice(4, 6).map((node) => node.content[1].fill.a)).toEqual([0.5, 0.5]);
  await captureWithAndWithoutOverlay(page, testInfo, "icons-history-middle");

  const end = await at(0.25);
  expect(end.scene.nodes.slice(4, 6).map((node) => node.content[1].text)).toEqual(["2", "3"]);
  expect(end.scene.nodes.slice(4, 6).map((node) => node.content[1].fill.a)).toEqual([1, 0]);
  await captureWithAndWithoutOverlay(page, testInfo, "icons-history-end");
});

test("画布直接点击两块历史图标卡片并忽略舞台空白", async ({ page }) => {
  await ready(page);
  const canvas = page.locator("canvas");
  await canvas.click({ position: await canvasPoint(page, -200, 0) });
  expect((await page.evaluate(() => window.iconsDemo.snapshot())).model.count).toBe(1);
  await page.evaluate(() => window.iconsDemo.pause());
  await canvas.click({ position: await canvasPoint(page, 200, 0) });
  expect((await page.evaluate(() => window.iconsDemo.snapshot())).model.playing).toBe(true);
  await page.evaluate(() => window.iconsDemo.pause());
  const before = await page.evaluate(() => window.iconsDemo.snapshot().model);
  await canvas.click({ position: await canvasPoint(page, 0, 100) });
  expect((await page.evaluate(() => window.iconsDemo.snapshot())).model).toEqual(before);
});

test("两组图标：连续点击打断、固定时间截图及乱序重采样", async ({ page }, testInfo) => {
  await ready(page);
  const start = await page.evaluate(() => window.iconsDemo.snapshot());
  expect(start.scene.nodes).toHaveLength(8);
  expect(start.scene.nodes.slice(-2).map((node) => node.content[0])).toEqual(["polygon", "polygon"]);
  await page.locator("#increase").click();
  const once = await page.evaluate(() => window.iconsDemo.seek(0.1));
  const twice = await page.evaluate(() => window.iconsDemo.clickIncrease(0.1));
  expect(twice.model.count).toBe(2);
  expect(twice.countValue).toBeCloseTo(once.countValue);
  await page.evaluate(() => window.iconsDemo.seek(0.24));
  await page.screenshot({ path: testInfo.outputPath("icons-increase-mid.png") });
  const settled = await page.evaluate(() => window.iconsDemo.seek(0.38));
  expect(settled.countValue).toBe(2);
  const play = await page.evaluate(() => window.iconsDemo.clickPlay(0.38));
  const mid = await page.evaluate(() => window.iconsDemo.seek(0.47));
  expect(mid.playValue).toBeGreaterThan(play.playValue);
  await page.screenshot({ path: testInfo.outputPath("icons-play-mid.png") });
  const reversed = await page.evaluate(() => window.iconsDemo.clickPlay(0.47));
  expect(reversed.playValue).toBeCloseTo(mid.playValue);
  const final = await page.evaluate(() => window.iconsDemo.seek(0.65));
  expect(final.playValue).toBe(0);
  expect((await page.evaluate(() => window.iconsDemo.seek(0.65))).scene).toEqual(final.scene);
});

test("全屏 DPR 2：暂停 resize 不推进 Model，浮层可收起", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page, 1);
    const original = await page.evaluate(() => window.iconsDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    const after = await page.evaluate(() => window.iconsDemo.snapshot());
    expect(after.time).toBe(original.time);
    expect(after.model).toEqual(original.model);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("icons-390-dpr2.png") });
  } finally {
    await context.close();
  }
});
