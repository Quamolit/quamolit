import { expect, test } from "@playwright/test";

async function ready(page, tick = 0, seed = 17) {
  await page.goto(`http://127.0.0.1:5180/examples/raining/index.html?seed=${seed}&tick=${tick}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

test("固定时间、种子、重置和乱序截图", async ({ page }, testInfo) => {
  await ready(page);
  const first = await page.evaluate(() => window.rainingDemo.snapshot());
  expect(first.scene.nodes.length).toBeGreaterThan(0);
  const firstPixels = await page.locator("canvas").evaluate(canvas => canvas.toDataURL());
  await page.evaluate(() => window.rainingDemo.seek(75));
  await page.screenshot({ path: testInfo.outputPath("raining-splash-75.png") });
  const later = await page.evaluate(() => window.rainingDemo.seek(120));
  await page.screenshot({ path: testInfo.outputPath("raining-cycle-120.png") });
  expect(later.scene).not.toEqual(first.scene);
  const replay = await page.evaluate(() => window.rainingDemo.seek(0));
  expect(replay.scene).toEqual(first.scene);
  expect(await page.locator("canvas").evaluate(canvas => canvas.toDataURL())).toBe(firstPixels);
  const changed = await page.evaluate(() => window.rainingDemo.setSeed(18));
  expect(changed.scene).not.toEqual(first.scene);
  expect(await page.locator("canvas").evaluate(canvas => canvas.toDataURL())).not.toBe(firstPixels);
  const restored = await page.evaluate(() => window.rainingDemo.setSeed(17));
  expect(restored.scene).toEqual(first.scene);
  await page.screenshot({ path: testInfo.outputPath("raining-initial.png") });
});

test("全屏 DPR 2：暂停 resize 不推进 tick，浮层可收起", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page, 75);
    const before = await page.evaluate(() => window.rainingDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.locator("canvas").evaluate(canvas => [canvas.width, canvas.height])).toEqual([780, 1688]);
    const after = await page.evaluate(() => window.rainingDemo.snapshot());
    expect(after.seed).toBe(before.seed);
    expect(after.tick).toBe(before.tick);
    expect(after.scene).toEqual(before.scene);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
    await page.screenshot({ path: testInfo.outputPath("raining-390-dpr2.png") });
  } finally { await context.close(); }
});
