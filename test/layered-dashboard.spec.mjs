import { expect, test } from "@playwright/test";

test("嵌套裁剪与隔离透明度可按确定时间截图", async ({ page }, testInfo) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=0");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  const at = (time) => page.evaluate((value) => window.layeredDashboardDemo.seek(value), time);
  expect((await at(0)).nodeCount).toBe(28);
  const background = await page
    .locator("canvas")
    .evaluate((canvas) =>
      Array.from(canvas.getContext("2d").getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data),
    );
  expect(background.slice(0, 3)).toEqual([6, 9, 18]);
  await at(0.5);
  const clipPixels = await page.locator("canvas").evaluate((canvas) => {
    const context = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 12;
    const scale = 0.93;
    const pixel = (x, y) => Array.from(context.getImageData(centerX + x * scale, centerY + y * scale, 1, 1).data);
    return { revealed: pixel(-80, 100), clipped: pixel(120, 100) };
  });
  expect(clipPixels.revealed).not.toEqual(clipPixels.clipped);
  expect(clipPixels.clipped.slice(0, 3)).toEqual([10, 14, 25]);
  await page.screenshot({ path: testInfo.outputPath("layered-dashboard-middle.png") });
  await at(1);
  const overlap = await page
    .locator("canvas")
    .evaluate((canvas) =>
      Array.from(canvas.getContext("2d").getImageData(canvas.width / 2 + 310, canvas.height / 2 - 190, 1, 1).data),
    );
  expect(overlap).toEqual([139, 56, 110, 255]);
  expect(overlap).not.toEqual([145, 110, 150, 255]); // 把 0.55 错乘到每个子节点会得到这一结果。
  await page.screenshot({ path: testInfo.outputPath("layered-dashboard-end.png") });
});

test("全屏 Canvas 与可收起 DOM 浮层保持状态", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=0.65");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  const before = await page.evaluate(() => window.layeredDashboardDemo.snapshot());
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeHidden();
  expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).time).toBe(before.time);
  expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
});
