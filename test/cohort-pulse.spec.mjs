import { expect, test } from "@playwright/test";

async function ready(page, time = 0.9) {
  await page.goto(`http://127.0.0.1:5180/examples/cohort-pulse/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

test("热力矩阵初始、中间和终点画面可复现", async ({ page }, testInfo) => {
  await ready(page, 0);
  const at = (time) => page.evaluate((value) => window.cohortPulseDemo.seek(value), time);
  expect((await at(0)).rowCount).toBe(0);
  const middle = await at(0.45);
  expect(middle.rowCount).toBe(6);
  expect(middle.cellCount).toBe(42);
  expect(middle.visibleCellCount).toBeGreaterThan(0);
  expect(middle.visibleCellCount).toBeLessThan(42);
  const end = await at(0.9);
  expect(end.rowCount).toBe(6);
  expect(end.cellCount).toBe(42);
  for (const time of [0, 0.45, 0.9]) {
    await at(time);
    await page.screenshot({ path: testInfo.outputPath(`cohort-pulse-${time}.png`) });
  }
});

test("风险筛选中途反向，详情面板独立切换并可分享", async ({ page }, testInfo) => {
  await ready(page);
  await page.locator("#filter-risk").click();
  const at = (time) => page.evaluate((value) => window.cohortPulseDemo.seek(value), time);
  const halfway = await at(1.4);
  expect(halfway.filter).toBeCloseTo(0.5, 4);
  expect(halfway.safeVisible).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("cohort-pulse-filter-middle.png") });
  await page.locator("#filter-all").click();
  expect((await page.evaluate(() => window.cohortPulseDemo.snapshot())).filter).toBeCloseTo(halfway.filter, 4);
  await at(1.7);
  expect((await page.evaluate(() => window.cohortPulseDemo.snapshot())).filter).toBeLessThan(halfway.filter);
  await page.locator("#panel-detail").click();
  const panelMiddle = await at(2.075);
  expect(panelMiddle.panel).toBeCloseTo(0.5, 4);
  expect(panelMiddle.summaryVisible).toBe(true);
  expect(panelMiddle.detailVisible).toBe(true);
  await page.locator("#share").click();
  await expect(page).toHaveURL(/filter=.*panel=/);
  await page.reload();
  const restored = await page.evaluate(() => window.cohortPulseDemo.snapshot());
  expect(restored.filter).toBeCloseTo(panelMiddle.filter, 6);
  expect(restored.panel).toBeCloseTo(panelMiddle.panel, 6);
});

test("筛选终点卸载安全行，DPR 2 窄屏和浮层收起保持时间", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    await page.locator("#filter-risk").click();
    await expect.poll(() => page.evaluate(() => window.cohortPulseDemo.snapshot().playing)).toBe(false);
    const settled = await page.evaluate(() => window.cohortPulseDemo.snapshot());
    expect(settled.filter).toBe(1);
    expect(settled.rowCount).toBe(3);
    expect(settled.cellCount).toBe(21);
    expect(settled.safeVisible).toBe(false);
    await page.waitForTimeout(200);
    expect((await page.evaluate(() => window.cohortPulseDemo.snapshot())).paints).toBe(settled.paints);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    expect((await page.evaluate(() => window.cohortPulseDemo.snapshot())).time).toBe(settled.time);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("cohort-pulse-mobile.png") });
  } finally {
    await context.close();
  }
});

test("默认错峰播放完成，缩减动态效果等待操作", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/cohort-pulse/index.html");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await expect.poll(() => page.evaluate(() => window.cohortPulseDemo.snapshot().rowCount)).toBe(6);
  await expect.poll(() => page.evaluate(() => window.cohortPulseDemo.snapshot().playing)).toBe(false);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reduced = await page.evaluate(() => window.cohortPulseDemo.snapshot());
  expect(reduced.rowCount).toBe(0);
  expect(reduced.playing).toBe(false);
});
