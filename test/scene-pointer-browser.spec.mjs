import { expect, test } from "@playwright/test";

async function ready(page) {
  await page.goto("http://127.0.0.1:5180/test/scene-pointer-browser.html");
  await expect(page.locator("#pointer-surface")).toHaveAttribute("data-ready", "true");
}

test("真实 PointerEvent 在画布外继续投递并恰好释放一次", async ({ page }) => {
  await ready(page);
  const canvas = page.locator("#pointer-surface");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await expect(canvas).toHaveAttribute("data-target", "a-action");
  expect(await canvas.evaluate((node) => node.hasPointerCapture(1))).toBe(true);

  await page.mouse.move(box.x + box.width + 120, box.y + box.height + 80);
  await expect(canvas).toHaveAttribute("data-target", "a-action");
  await expect(canvas).toHaveAttribute("data-captured", "true");

  await page.mouse.up();
  await expect(canvas).toHaveAttribute("data-released", "true");
  expect(await canvas.evaluate((node) => node.hasPointerCapture(1))).toBe(false);
});

test("DPR 2 仍使用 CSS px，并在 pointercancel 后清除原生捕获", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    const canvas = page.locator("#pointer-surface");
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box.x + 120, box.y + 20);
    await expect(canvas).toHaveAttribute("data-target", "b-action");
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    expect(await canvas.evaluate((node) => node.hasPointerCapture(1))).toBe(true);
    await canvas.dispatchEvent("pointercancel", { pointerId: 1, clientX: box.x + 20, clientY: box.y + 20 });
    await expect(canvas).toHaveAttribute("data-released", "true");
    expect(await canvas.evaluate((node) => node.hasPointerCapture(1))).toBe(false);
    await page.mouse.up();
  } finally {
    await context.close();
  }
});
