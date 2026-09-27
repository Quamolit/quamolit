import { expect, test } from "@playwright/test";

async function ready(page, time = 18) {
  await page.goto(`http://127.0.0.1:5180/examples/tidal-bloom/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

test("艺术花纹：任意时间、乱序与重复采样保留 29 层", async ({ page }, testInfo) => {
  await ready(page);
  const at = (time) => page.evaluate((value) => window.tidalBloomDemo.seek(value), time);
  const first = await at(0);
  expect(first.ringCount).toBe(29);
  const middle = await at(18);
  const later = await at(42);
  expect(middle.firstPoint).not.toEqual(first.firstPoint);
  expect(later.lastPoint).not.toEqual(middle.lastPoint);
  expect((await at(18)).firstPoint).toEqual(middle.firstPoint);
  expect((await at(0)).firstPoint).toEqual(first.firstPoint);
  for (const time of [0, 18, 42]) {
    await at(time);
    await page.screenshot({ path: testInfo.outputPath(`tidal-bloom-${time}.png`) });
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
    await ready(page, 42);
    const before = await page.evaluate(() => window.tidalBloomDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    const after = await page.evaluate(() => window.tidalBloomDemo.snapshot());
    expect(after.time).toBe(before.time);
    expect(after.firstPoint).toEqual(before.firstPoint);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("tidal-bloom-mobile.png") });
  } finally {
    await context.close();
  }
});
