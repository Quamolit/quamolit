import { expect, test } from "@playwright/test";

async function ready(page) {
  await page.goto("http://127.0.0.1:5180/examples/table/index.html");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}
async function clickCell(page, index) {
  const point = await page.evaluate(index => {
    const state = window.tableDemo.snapshot(), bounds = document.querySelector("canvas").getBoundingClientRect();
    const x = (index % 3 - 1) * 200, y = (Math.floor(index / 3) - 1) * 124;
    return { x: bounds.left + (state.view.x + x * state.view.scale) * bounds.width / state.width,
      y: bounds.top + (state.view.y + y * state.view.scale) * bounds.height / state.height };
  }, index);
  await page.mouse.click(point.x, point.y);
}

test("Canvas 点击、中文编辑、失焦、取消与分享重放", async ({ page }, testInfo) => {
  await ready(page);
  expect((await page.evaluate(() => window.tableDemo.snapshot())).scene.nodes).toHaveLength(18);
  await page.screenshot({ path: testInfo.outputPath("table-initial.png") });
  await clickCell(page, 4);
  await expect(page.locator("#editor")).toBeVisible();
  await page.locator("#editor").fill("中文输入测试");
  await page.screenshot({ path: testInfo.outputPath("table-editing.png") });
  await page.locator("#editor").dispatchEvent("keydown", { key: "Enter", isComposing: true });
  await expect(page.locator("#editor")).toBeVisible();
  await page.locator("#editor").press("Enter");
  expect((await page.evaluate(() => window.tableDemo.snapshot())).cells[4]).toBe("中文输入测试");
  await clickCell(page, 0);
  await page.locator("#editor").fill("取消此修改");
  await page.locator("#editor").press("Escape");
  expect((await page.evaluate(() => window.tableDemo.snapshot())).cells[0]).toBe("第一格");
  await clickCell(page, 8);
  await page.locator("#editor").fill("失焦提交");
  await page.locator("#panel-toggle").click();
  expect((await page.evaluate(() => window.tableDemo.snapshot())).cells[8]).toBe("失焦提交");
  await page.screenshot({ path: testInfo.outputPath("table-committed.png") });
  await page.locator("#panel-toggle").click();
  await page.locator("#share").click();
  const shared = page.url(), pixels = await page.locator("canvas").evaluate(canvas => canvas.toDataURL());
  const before = await page.evaluate(() => window.tableDemo.snapshot());
  await page.goto(shared);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  expect((await page.evaluate(() => window.tableDemo.snapshot())).cells).toEqual(before.cells);
  expect(await page.locator("canvas").evaluate(canvas => canvas.toDataURL())).toBe(pixels);
});

test("窄屏 DPR 2 resize 与浮层不改变九格", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    await page.evaluate(() => window.tableDemo.set(2, "月光"));
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.locator("canvas").evaluate(canvas => [canvas.width, canvas.height])).toEqual([780, 1688]);
    expect((await page.evaluate(() => window.tableDemo.snapshot())).cells[2]).toBe("月光");
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
    await page.screenshot({ path: testInfo.outputPath("table-mobile-dpr2.png") });
  } finally { await context.close(); }
});
