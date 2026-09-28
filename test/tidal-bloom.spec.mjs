import { expect, test } from "@playwright/test";

async function ready(page, time = 1.4) {
  await page.goto(`http://127.0.0.1:5180/examples/tidal-bloom/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

test("图表 UI：组件错峰出入场、真实卸载与乱序重放", async ({ page }, testInfo) => {
  await ready(page);
  const at = (time) => page.evaluate((value) => window.tidalBloomDemo.seek(value), time);
  const first = await at(1.4);
  expect(first.nodeCount).toBe(50);
  const moving = await at(3.7);
  const middle = await at(4);
  const later = await at(7);
  expect(moving.overviewVisible).toBe(true);
  expect(moving.analyticsVisible).toBe(true);
  expect(middle.overviewVisible).toBe(false);
  expect(later.analyticsVisible).toBe(true);
  expect(later.chartBarHeight).toBe(126);
  expect((await at(1.4)).heroWidth).toEqual(first.heroWidth);
  expect((await at(7)).chartBarHeight).toEqual(later.chartBarHeight);
  for (const time of [0, 1.4, 3.7, 5, 7]) {
    await at(time);
    await page.screenshot({ path: testInfo.outputPath(`metric-flow-${time}.png`) });
  }
  const painted = await page.locator("canvas").evaluate((canvas) => {
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) count++;
    return count;
  });
  expect(painted).toBeGreaterThan(1000);
});

test("全屏与浮层：DPR 2 resize 不推进时间", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page, 7);
    const before = await page.evaluate(() => window.tidalBloomDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    const after = await page.evaluate(() => window.tidalBloomDemo.snapshot());
    expect(after.time).toBe(before.time);
    expect(after.chartBarHeight).toEqual(before.chartBarHeight);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("metric-flow-mobile.png") });
  } finally {
    await context.close();
  }
});

test("真实视图按钮：切换途中反向、再次进入与分享中间帧", async ({ page }, testInfo) => {
  await ready(page, 1.4);
  await page.locator("#view-analytics").click();
  const at = (time) => page.evaluate((value) => window.metricFlowDemo.seekInteractive(value), time);
  const quarter = await at(0.3);
  expect(quarter.mode).toBe("interactive");
  expect(quarter.position).toBeGreaterThan(0);
  expect(quarter.overviewVisible).toBe(true);
  expect(quarter.analyticsVisible).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("metric-flow-interrupt-before.png") });
  await page.locator("#view-overview").click();
  const reversed = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(reversed.position).toBeCloseTo(quarter.position, 4);
  expect(reversed.eventCount).toBe(2);
  const turning = await at(0.6);
  expect(turning.position).toBeLessThan(quarter.position);
  await page.locator("#view-analytics").click();
  const entering = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(entering.position).toBeCloseTo(turning.position, 4);
  const complete = await at(1.8);
  expect(complete.overviewVisible).toBe(false);
  expect(complete.analyticsVisible).toBe(true);
  expect(complete.chartBarHeight).toBe(126);
  expect(complete.eventCount).toBe(3);
  await page.screenshot({ path: testInfo.outputPath("metric-flow-interactive-analytics.png") });
  await page.locator("#view-overview").click();
  const returning = await at(2.4);
  expect(returning.analyticsVisible).toBe(true);
  expect(returning.overviewVisible).toBe(false);
  await page.locator("#share").click();
  await expect(page).toHaveURL(/progress=/);
  await page.reload();
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  const shared = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(shared.mode).toBe("interactive");
  expect(shared.position).toBeCloseTo(returning.position, 6);
  await page.screenshot({ path: testInfo.outputPath("metric-flow-shared-intermediate.png") });
});

test("交互切换到终点后停止连续绘制，输入可重新唤醒", async ({ page }) => {
  await ready(page, 1.4);
  await page.locator("#view-analytics").click();
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().playing)).toBe(false);
  const settled = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(settled.position).toBe(1);
  await page.waitForTimeout(250);
  expect((await page.evaluate(() => window.metricFlowDemo.snapshot())).paints).toBe(settled.paints);
  await page.locator("#view-overview").click();
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().position)).toBeLessThan(1);
});

test("默认进入交互切换；缩减动态效果下静止等待操作", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/tidal-bloom/index.html");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().position)).toBe(1);
  await page.locator("#play").click();
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().position)).toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reduced = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(reduced.mode).toBe("interactive");
  expect(reduced.position).toBe(0);
  expect(reduced.playing).toBe(false);
});

test("分析图表可切换数据系列、中途反向并分享中间画面", async ({ page }, testInfo) => {
  await ready(page, 7);
  await page.locator("#view-analytics").click();
  await page.locator("#series-revenue").click();
  const at = (time) => page.evaluate((value) => window.metricFlowDemo.seekInteractive(value), time);
  const halfway = await at(0.45);
  expect(halfway.seriesPosition).toBeCloseTo(0.5, 4);
  expect(halfway.chartBarHeight).toBeCloseTo(109.5, 4);
  await page.screenshot({ path: testInfo.outputPath("metric-flow-series-middle.png") });
  await page.locator("#series-visitors").click();
  const reversed = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(reversed.seriesPosition).toBeCloseTo(halfway.seriesPosition, 4);
  expect(reversed.seriesEventCount).toBe(2);
  const settled = await at(1.35);
  expect(settled.seriesPosition).toBe(0);
  expect(settled.chartBarHeight).toBe(126);
  await page.locator("#series-revenue").click();
  const shared = await at(1.8);
  await page.locator("#share").click();
  await expect(page).toHaveURL(/seriesProgress=/);
  await page.reload();
  const reloaded = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(reloaded.seriesPosition).toBeCloseTo(shared.seriesPosition, 6);
  expect(reloaded.chartBarHeight).toBeCloseTo(shared.chartBarHeight, 6);
  await page.screenshot({ path: testInfo.outputPath("metric-flow-series-shared.png") });
});
