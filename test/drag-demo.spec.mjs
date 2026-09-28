import { expect, test } from "@playwright/test";

async function ready(page) {
  await page.goto("http://127.0.0.1:5180/examples/drag-demo/index.html");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}
async function logicalPoint(page, x, y) {
  return page.evaluate(
    ({ x, y }) => {
      const state = window.dragDemo.snapshot(),
        bounds = document.querySelector("canvas").getBoundingClientRect();
      return {
        x: bounds.left + ((state.view.x + x * state.view.scale) * bounds.width) / state.width,
        y: bounds.top + ((state.view.y + y * state.view.scale) * bounds.height) / state.height,
      };
    },
    { x, y },
  );
}

test("真实指针跨矩形边界拖动、滑块夹取和捕获释放", async ({ page }, testInfo) => {
  await ready(page);
  const start = await page.evaluate(() => window.dragDemo.snapshot());
  expect(start.scene.nodes).toHaveLength(4);
  await page.screenshot({ path: testInfo.outputPath("drag-initial.png") });
  const down = await logicalPoint(page, 10, 5);
  await page.mouse.move(down.x, down.y);
  await page.mouse.down();
  expect((await page.evaluate(() => window.dragDemo.snapshot())).captured).toBe(1);
  const mid = await logicalPoint(page, 160, 95);
  await page.mouse.move(mid.x, mid.y);
  const dragged = await page.evaluate(() => window.dragDemo.snapshot());
  expect(dragged.model.x).toBeCloseTo(150, 3);
  expect(dragged.model.y).toBeCloseTo(90, 3);
  await page.screenshot({ path: testInfo.outputPath("drag-middle.png") });
  const far = await logicalPoint(page, 300, 180);
  await page.mouse.move(far.x, far.y);
  await page.mouse.up();
  const released = await page.evaluate(() => window.dragDemo.snapshot());
  expect(released.model.pointer).toBe(-1);
  expect(released.captured).toBeNull();
  expect(released.model.x).toBeCloseTo(290, 3);
  await page.screenshot({ path: testInfo.outputPath("drag-released.png") });
  const slider = await logicalPoint(page, 100, 40),
    max = await logicalPoint(page, 350, 40);
  await page.mouse.move(slider.x, slider.y);
  await page.mouse.down();
  await page.mouse.move(max.x, max.y);
  await page.mouse.up();
  expect((await page.evaluate(() => window.dragDemo.snapshot())).model.value).toBe(40);
  await page.screenshot({ path: testInfo.outputPath("slider-max.png") });
  const paints = (await page.evaluate(() => window.dragDemo.snapshot())).paints;
  await page.waitForTimeout(300);
  expect((await page.evaluate(() => window.dragDemo.snapshot())).paints).toBe(paints);
});

test("取消捕获、DPR 2 暂停 resize 与浮层不误触", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    const down = await logicalPoint(page, 0, 0);
    await page.mouse.move(down.x, down.y);
    await page.mouse.down();
    await page.evaluate(() =>
      document
        .querySelector("canvas")
        .dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1, bubbles: true })),
    );
    expect((await page.evaluate(() => window.dragDemo.snapshot())).captured).toBeNull();
    await page.mouse.up();
    const before = await page.evaluate(() => window.dragDemo.preset());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    expect((await page.evaluate(() => window.dragDemo.snapshot())).model).toEqual(before.model);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("drag-mobile-dpr2.png") });
  } finally {
    await context.close();
  }
});

test("实际 demo 卸载会释放捕获并移除指针监听器", async ({ page }) => {
  await ready(page);
  const down = await logicalPoint(page, 0, 0);
  await page.mouse.move(down.x, down.y);
  await page.mouse.down();
  expect((await page.evaluate(() => window.dragDemo.snapshot())).captured).toBe(1);
  const disposed = await page.evaluate(() => {
    const api = window.dragDemo;
    api.dispose();
    const canvas = document.querySelector("canvas"),
      before = api.snapshot();
    canvas.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 900, clientY: 700, bubbles: true }));
    return {
      before,
      after: api.snapshot(),
      apiRemoved: window.dragDemo === undefined,
      nativeCapture: canvas.hasPointerCapture(1),
    };
  });
  expect(disposed.apiRemoved).toBe(true);
  expect(disposed.nativeCapture).toBe(false);
  expect(disposed.before.captured).toBeNull();
  expect(disposed.after.model).toEqual(disposed.before.model);
  await page.mouse.up();
});
