import { expect, test } from "@playwright/test";

async function ready(page, time = 30) {
  await page.goto(`http://127.0.0.1:5180/examples/curve/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

test("动态闭合曲线：固定时间顶点与截图，重复采样一致", async ({ page }, testInfo) => {
  await ready(page);
  const at = t => page.evaluate(x => window.curveDemo.seek(x), t);
  const first = await at(0);
  expect(first.pointCount).toBe(98);
  expect(first.nodeCount).toBe(1);
  const later = await at(60);
  expect(later.pointCount).toBe(98);
  expect(later.points).not.toEqual(first.points);
  await at(0); await page.screenshot({ path: testInfo.outputPath("curve-0.png") });
  await at(60); await page.screenshot({ path: testInfo.outputPath("curve-60.png") });
  const repeat = await at(60);
  expect(repeat.points).toEqual(later.points);
});

test("全屏 DPR 2：暂停 resize 不推进时间，浮层收起不误触", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page, 30);
    const original = await page.evaluate(() => window.curveDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.locator("canvas").evaluate(canvas => [canvas.width, canvas.height])).toEqual([780, 1688]);
    const after = await page.evaluate(() => window.curveDemo.snapshot());
    expect(after.time).toBe(original.time);
    expect(after.points).toEqual(original.points);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
    await page.screenshot({ path: testInfo.outputPath("curve-390-dpr2.png") });
  } finally {
    await context.close();
  }
});
