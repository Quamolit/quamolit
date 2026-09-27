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
    await page.screenshot({ path: testInfo.outputPath(`tidal-studio-${time}.png`) });
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
    await page.screenshot({ path: testInfo.outputPath("tidal-studio-mobile.png") });
  } finally {
    await context.close();
  }
});
