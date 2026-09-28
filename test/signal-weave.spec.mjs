import { expect, test } from "@playwright/test";

async function ready(page, time = 1.2) {
  await page.goto(`http://127.0.0.1:5180/examples/signal-weave/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

test("面积曲线初始、中间、终点画面可复现", async ({ page }, testInfo) => {
  await ready(page, 0);
  const at = (time) => page.evaluate((value) => window.signalWeaveDemo.seek(value), time);
  const start = await at(0);
  const middle = await at(0.45);
  const end = await at(1.2);
  expect(start.pathPoints).toBe(2);
  expect(middle.pathPoints).toBe(5);
  expect(end.pathPoints).toBe(12);
  expect(start.statusVisible).toBe(false);
  expect(end.statusVisible).toBe(true);
  for (const time of [0, 0.45, 1.2]) {
    await at(time);
    await page.screenshot({ path: testInfo.outputPath(`signal-weave-${time}.png`) });
  }
  expect((await at(0.45)).lastPoint).toEqual(middle.lastPoint);
});

test("情境按钮在中途反向且分享链接恢复视觉位置", async ({ page }, testInfo) => {
  await ready(page);
  await page.locator("#mode-campaign").click();
  const at = (time) => page.evaluate((value) => window.signalWeaveDemo.seek(value), time);
  const halfway = await at(1.75);
  expect(halfway.position).toBeCloseTo(0.5, 4);
  await page.screenshot({ path: testInfo.outputPath("signal-weave-morph-middle.png") });
  await page.locator("#mode-standard").click();
  const reversed = await page.evaluate(() => window.signalWeaveDemo.snapshot());
  expect(reversed.position).toBeCloseTo(halfway.position, 4);
  expect(reversed.eventCount).toBe(2);
  const returning = await at(2.05);
  expect(returning.position).toBeLessThan(halfway.position);
  await page.locator("#share").click();
  await expect(page).toHaveURL(/position=/);
  await page.reload();
  const shared = await page.evaluate(() => window.signalWeaveDemo.snapshot());
  expect(shared.position).toBeCloseTo(returning.position, 6);
  expect(shared.lastPoint.y).toBeCloseTo(returning.lastPoint.y, 6);
});

test("终点停帧、DPR 2 窄屏与浮层收起不改变时间", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    await page.locator("#mode-campaign").click();
    await expect.poll(() => page.evaluate(() => window.signalWeaveDemo.snapshot().playing)).toBe(false);
    const settled = await page.evaluate(() => window.signalWeaveDemo.snapshot());
    expect(settled.position).toBe(1);
    await page.waitForTimeout(200);
    expect((await page.evaluate(() => window.signalWeaveDemo.snapshot())).paints).toBe(settled.paints);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    expect((await page.evaluate(() => window.signalWeaveDemo.snapshot())).time).toBe(settled.time);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("signal-weave-mobile.png") });
  } finally {
    await context.close();
  }
});

test("默认播放路径生长；缩减动态效果静止等待操作", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/signal-weave/index.html");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await expect.poll(() => page.evaluate(() => window.signalWeaveDemo.snapshot().pathPoints)).toBe(12);
  await expect.poll(() => page.evaluate(() => window.signalWeaveDemo.snapshot().playing)).toBe(false);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reduced = await page.evaluate(() => window.signalWeaveDemo.snapshot());
  expect(reduced.pathPoints).toBe(2);
  expect(reduced.playing).toBe(false);
});
