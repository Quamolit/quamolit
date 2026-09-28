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

test("lostpointercapture 只清理匹配的逻辑所有者", async ({ page }) => {
  await ready(page);
  const canvas = page.locator("#pointer-surface");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await canvas.evaluate((node) => node.releasePointerCapture(1));
  // Chromium headless does not consistently schedule lostpointercapture after an explicit
  // release until another native pointer task; dispatch the platform event deterministically.
  await canvas.dispatchEvent("lostpointercapture", { pointerId: 1 });
  await expect(canvas).toHaveAttribute("data-lost", "true");
  await expect(canvas).toHaveAttribute("data-lost-released", "true");
  await expect(canvas).toHaveAttribute("data-capture-cleared", "true");
  expect(await canvas.evaluate((node) => node.hasPointerCapture(1))).toBe(false);

  await canvas.dispatchEvent("pointermove", {
    pointerId: 1,
    clientX: box.x + box.width + 80,
    clientY: box.y + box.height + 80,
  });
  await expect(canvas).toHaveAttribute("data-target", "");
  await expect(canvas).toHaveAttribute("data-captured", "false");
  await page.mouse.up();
});

test("窗口失焦主动释放 DOM capture 并清理纯状态", async ({ page }) => {
  await ready(page);
  const canvas = page.locator("#pointer-surface");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  expect(await canvas.evaluate((node) => node.hasPointerCapture(1))).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(canvas).toHaveAttribute("data-blurred", "true");
  await expect(canvas).toHaveAttribute("data-blur-released", "true");
  await expect(canvas).toHaveAttribute("data-capture-cleared", "true");
  expect(await canvas.evaluate((node) => node.hasPointerCapture(1))).toBe(false);
  await page.mouse.up();
});

test("拖拽中 surface 移动和 resize 后每个事件重新读取 CSS 边界", async ({ page }) => {
  await ready(page);
  const canvas = page.locator("#pointer-surface");
  const initial = await canvas.boundingBox();
  expect(initial).not.toBeNull();

  await page.mouse.move(initial.x + 20, initial.y + 20);
  await page.mouse.down();
  expect(await canvas.evaluate((node) => node.hasPointerCapture(1))).toBe(true);

  await canvas.evaluate((node) => {
    node.style.marginLeft = "180px";
    node.style.marginTop = "90px";
    node.style.width = "260px";
    node.style.height = "140px";
  });
  const resized = await canvas.boundingBox();
  expect(resized).toMatchObject({ x: 180, y: 90, width: 260, height: 140 });

  await canvas.dispatchEvent("pointermove", {
    pointerId: 2,
    clientX: resized.x + 120,
    clientY: resized.y + 20,
  });
  await expect(canvas).toHaveAttribute("data-target", "b-action");
  await expect(canvas).toHaveAttribute("data-captured", "false");

  await page.mouse.move(resized.x + resized.width + 80, resized.y + resized.height + 80);
  await expect(canvas).toHaveAttribute("data-target", "a-action");
  await expect(canvas).toHaveAttribute("data-captured", "true");
  await page.mouse.up();
  await expect(canvas).toHaveAttribute("data-released", "true");
  expect(await canvas.evaluate((node) => node.hasPointerCapture(1))).toBe(false);
});
