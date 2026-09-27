import { expect, test } from "@playwright/test";

async function ready(page, suffix = "?t=0") {
  await page.goto(`http://127.0.0.1:5180/examples/folding-fan/index.html${suffix}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}
test("24 切片 Toggle 中间帧、终点与乱序截图", async ({ page }, testInfo) => {
  await ready(page);
  const start = await page.evaluate(() => window.foldingFanDemo.snapshot());
  expect(start.slices).toHaveLength(24);
  expect(start.resource).toBe("ready");
  const colorAtFlower = () => page.locator("canvas").evaluate(canvas => [...canvas.getContext("2d").getImageData(500, 280, 1, 1).data]);
  const closedPixel = await colorAtFlower();
  await page.screenshot({ path: testInfo.outputPath("fan-closed.png") });
  await page.evaluate(() => window.foldingFanDemo.clickToggle(0));
  const mid = await page.evaluate(() => window.foldingFanDemo.seek(0.18));
  expect(mid.foldValue).toBeCloseTo(0.5);
  expect(mid.slices[0].angle).toBeLessThan(0);
  await page.screenshot({ path: testInfo.outputPath("fan-mid.png") });
  const opened = await page.evaluate(() => window.foldingFanDemo.seek(0.36));
  expect(opened.foldValue).toBe(1);
  expect(await colorAtFlower()).not.toEqual(closedPixel);
  await page.screenshot({ path: testInfo.outputPath("fan-open.png") });
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
  const pixel = await page.locator("canvas").evaluate(canvas => {
    const ctx = canvas.getContext("2d"), { width, height } = canvas;
    return [...ctx.getImageData(Math.round(width / 2), Math.round(height * 0.55), 1, 1).data];
  });
  expect(pixel[3]).toBe(255);
});
test("图片失败明确报错，不冒充正常渲染", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/folding-fan/index.html?image=missing&t=0");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "error");
  await expect(page.locator("#message")).toContainText("图片加载失败");
  expect((await page.evaluate(() => window.foldingFanDemo.snapshot())).resource).toBe("error");
});
test("全屏 DPR 2 暂停 resize 与浮层收起", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    await page.evaluate(() => { window.foldingFanDemo.clickToggle(0); window.foldingFanDemo.seek(0.18); });
    const before = await page.evaluate(() => window.foldingFanDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.locator("canvas").evaluate(canvas => [canvas.width, canvas.height])).toEqual([780, 1688]);
    const after = await page.evaluate(() => window.foldingFanDemo.snapshot());
    expect(after.time).toBe(before.time);
    expect(after.model).toEqual(before.model);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
    await page.screenshot({ path: testInfo.outputPath("fan-mobile-dpr2.png") });
  } finally { await context.close(); }
});
