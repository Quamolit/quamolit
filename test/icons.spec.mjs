import { expect, test } from "@playwright/test";

async function ready(page, time = 0) {
  await page.goto(`http://127.0.0.1:5180/examples/icons/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

test("两组图标：连续点击打断、固定时间截图及乱序重采样", async ({ page }, testInfo) => {
  await ready(page);
  const start = await page.evaluate(() => window.iconsDemo.snapshot());
  expect(start.scene.nodes).toHaveLength(6);
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
    await expect.poll(() => page.locator("canvas").evaluate(canvas => [canvas.width, canvas.height])).toEqual([780, 1688]);
    const after = await page.evaluate(() => window.iconsDemo.snapshot());
    expect(after.time).toBe(original.time);
    expect(after.model).toEqual(original.model);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
    await page.screenshot({ path: testInfo.outputPath("icons-390-dpr2.png") });
  } finally {
    await context.close();
  }
});
