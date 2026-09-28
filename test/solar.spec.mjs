import { expect, test } from "@playwright/test";

async function ready(page, time = 1) {
  await page.goto(`http://127.0.0.1:5180/examples/solar/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

async function captureStage(page, testInfo, name) {
  await page.screenshot({ path: testInfo.outputPath(`solar-${name}-overlay.png`) });
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeHidden();
  await page
    .locator("nav, #panel-toggle")
    .evaluateAll((nodes) => nodes.forEach((node) => (node.style.visibility = "hidden")));
  await page.screenshot({ path: testInfo.outputPath(`solar-${name}-canvas.png`) });
  await page
    .locator("nav, #panel-toggle")
    .evaluateAll((nodes) => nodes.forEach((node) => (node.style.visibility = "")));
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeVisible();
}

test("递归轨道：固定时间截图、旋转与乱序重复采样", async ({ page }, testInfo) => {
  await ready(page);
  const at = (t) => page.evaluate((x) => window.solarDemo.seek(x), t);
  const first = await at(0);
  expect(first.nodeCount).toBe(10);
  expect(first.scene.nodes.every((node) => node.content[0] === "circle")).toBe(true);
  await captureStage(page, testInfo, "initial");
  const later = await at(3);
  expect(later.nodeCount).toBe(10);
  expect([later.scene.nodes[1].content[1].cx, later.scene.nodes[1].content[1].cy]).not.toEqual([
    first.scene.nodes[1].content[1].cx,
    first.scene.nodes[1].content[1].cy,
  ]);
  await captureStage(page, testInfo, "middle");
  await at(10);
  await captureStage(page, testInfo, "end");
  await at(0);
  expect((await at(3)).scene).toEqual(later.scene);
});

test("全屏 DPR 2：暂停 resize 保持逻辑时间，浮层收起不遮盖舞台", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page, 1);
    const original = await page.evaluate(() => window.solarDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    const after = await page.evaluate(() => window.solarDemo.snapshot());
    expect(after.time).toBe(original.time);
    expect(after.scene).toEqual(original.scene);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("solar-390-dpr2.png") });
  } finally {
    await context.close();
  }
});
