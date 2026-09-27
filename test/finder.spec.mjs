import { expect, test } from "@playwright/test";

async function ready(page, query = "") {
  await page.goto(`http://127.0.0.1:5180/examples/finder/index.html${query}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}
async function clickLogical(page, x, y) {
  const position = await page.evaluate(({ x, y }) => {
    const view = window.finderDemo.snapshot().view, bounds = document.querySelector("canvas").getBoundingClientRect();
    return { x: bounds.left + (view.x + x * view.scale) * bounds.width / document.querySelector("canvas").width,
      y: bounds.top + (view.y + y * view.scale) * bounds.height / document.querySelector("canvas").height };
  }, { x, y });
  await page.mouse.click(position.x, position.y);
}

test("Canvas 点击文件夹与卡片、返回、快速打断和分享重放", async ({ page }, testInfo) => {
  await ready(page);
  const start = await page.evaluate(() => window.finderDemo.snapshot());
  expect(start.scene.nodes).toHaveLength(10);
  await page.screenshot({ path: testInfo.outputPath("finder-initial.png") });
  await clickLogical(page, -340, -20);
  const opened = await page.evaluate(() => window.finderDemo.seek(0.42));
  expect(opened.model.folder).toBe(0);
  expect(opened.scene.nodes).toHaveLength(18);
  await page.screenshot({ path: testInfo.outputPath("finder-folder-open.png") });
  await clickLogical(page, -245, -120);
  const focused = await page.evaluate(() => window.finderDemo.seek(0.78));
  expect(focused.model.card).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("finder-card-focus.png") });
  await page.evaluate(() => window.finderDemo.send("back", 0, -1, 0.78, false));
  const partial = await page.evaluate(() => window.finderDemo.seek(0.88));
  const rect = partial.scene.nodes.find(node => node.id === "card-0/0").content[1];
  await clickLogical(page, rect.x + rect.width / 2, rect.y + rect.height / 2);
  const reopened = await page.evaluate(() => window.finderDemo.seek(0.88));
  expect(reopened.events.at(-1).kind).toBe("card");
  expect(reopened.scene).toEqual(partial.scene);
  await page.evaluate(() => window.finderDemo.seek(1.24));
  await page.locator("#share").click();
  const shared = page.url();
  const before = await page.evaluate(() => window.finderDemo.snapshot());
  const pixels = await page.locator("canvas").evaluate(canvas => canvas.toDataURL());
  await page.goto(shared);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  expect((await page.evaluate(() => window.finderDemo.snapshot())).scene).toEqual(before.scene);
  expect(await page.locator("canvas").evaluate(canvas => canvas.toDataURL())).toBe(pixels);
});

test("固定预设日志可乱序采样；DPR 2 暂停 resize 不推进 Model", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    await page.evaluate(() => window.finderDemo.tour());
    const mid = await page.evaluate(() => window.finderDemo.seek(2.85));
    expect(mid.model.folder).toBe(3);
    await page.screenshot({ path: testInfo.outputPath("finder-tour-mid.png") });
    await page.evaluate(() => window.finderDemo.seek(0));
    const repeated = await page.evaluate(() => window.finderDemo.seek(2.85));
    expect(repeated.scene).toEqual(mid.scene);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.locator("canvas").evaluate(canvas => [canvas.width, canvas.height])).toEqual([780, 1688]);
    const after = await page.evaluate(() => window.finderDemo.snapshot());
    expect(after.time).toBe(mid.time);
    expect(after.model).toEqual(mid.model);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
    await page.screenshot({ path: testInfo.outputPath("finder-390-dpr2.png") });
  } finally { await context.close(); }
});
