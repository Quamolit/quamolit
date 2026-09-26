import { expect, test } from "@playwright/test";

async function ready(page, time = 60.5) {
  await page.goto(`http://127.0.0.1:5180/examples/clock/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

test("注入时钟：跨秒/分钟进位与固定时间截图", async ({ page }, testInfo) => {
  await ready(page);
  const at = t => page.evaluate(x => window.clockDemo.seek(x), t);
  expect((await at(59.5)).digits).toEqual([0, 0, 0, 0, 5, 9]);
  expect((await at(60)).digits).toEqual([0, 0, 0, 1, 0, 0]);
  expect((await at(119.5)).digits).toEqual([0, 0, 0, 1, 5, 9]);
  expect((await at(120)).digits).toEqual([0, 0, 0, 2, 0, 0]);
  await at(59.5); await page.screenshot({ path: testInfo.outputPath("clock-59.5.png") });
  await at(60.5); await page.screenshot({ path: testInfo.outputPath("clock-60.5.png") });
  const first = await at(60.5), second = await at(60.5);
  expect(second.scene).toEqual(first.scene);
  expect(second.nodeCount).toBe(32);
});

test("全屏 DPR 2：暂停 resize 不推进时间，浮层收起不误触", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page, 60.5);
    const original = await page.evaluate(() => window.clockDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.locator("canvas").evaluate(canvas => [canvas.width, canvas.height])).toEqual([780, 1688]);
    const after = await page.evaluate(() => window.clockDemo.snapshot());
    expect(after.time).toBe(original.time);
    expect(after.digits).toEqual(original.digits);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
    await page.screenshot({ path: testInfo.outputPath("clock-390-dpr2.png") });
  } finally {
    await context.close();
  }
});
