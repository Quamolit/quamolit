import { expect, test } from "@playwright/test";

const pixelAt = (page, x, y) => page.locator("#scene").evaluate((canvas, point) =>
  Array.from(canvas.getContext("2d").getImageData(point.x, point.y, 1, 1).data), { x, y });

test("退出期间保留实例快照，终点只释放一次且可乱序重放", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/presence-resources.html?time=0.875");
  const status = page.locator("#status");
  await expect(page.locator("#backend")).toContainText(/WebGPU PASS|Canvas 参考/);
  await expect(status).toContainText("t=0.875s · alpha=0.5 · live=1 · released=0 · active=true · ffi=2 · canvas=10000");
  await page.getByRole("button", { name: "1s", exact: true }).click();
  await expect(status).toContainText("t=1s · alpha=none · live=0 · released=1 · active=false · ffi=0 · canvas=0 · pixel=255,255,255,255");
  await page.getByRole("button", { name: "0.5s", exact: true }).click();
  await expect(status).toContainText("t=0.5s · alpha=1 · live=1");
  await page.reload();
  await expect(status).toContainText("t=0.875s · alpha=0.5 · live=1");
  expect(errors).toEqual([]);
});

for (const mode of ["denied", "ready", "lost"]) {
  test(`WebGPU ${mode} 探测后仍可绘制固定退出时间帧`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/test/presence-resources.html?time=0.875&gpu=${mode}`);
    const backend = page.locator("#backend");
    if (mode === "denied") {
      await expect(backend).toHaveAttribute("data-kind", "failed");
      await expect(backend).toHaveAttribute("data-stage", "adapter");
      await expect(backend).toContainText("test-adapter-denied");
    } else {
      await expect(backend).toHaveAttribute("data-kind", "ready");
      await expect(backend).toContainText("state=");
      await expect(backend).toContainText("→released；destroyed=1");
      if (mode === "lost") await expect(backend).toContainText("loss=unknown/test-loss");
    }
    await expect(page.locator("#status")).toContainText("t=0.875s · alpha=0.5 · live=1 · released=0 · active=true · ffi=2 · canvas=10000");
    expect(await pixelAt(page, 40, 50)).toEqual([244, 171, 133, 255]);
    expect(await pixelAt(page, 2, 0)).toEqual([255, 255, 255, 255]);
    await page.getByRole("button", { name: "1s", exact: true }).click();
    await expect(page.locator("#status")).toContainText("t=1s · alpha=none · live=0 · released=1 · active=false");
    expect(await pixelAt(page, 40, 50)).toEqual([255, 255, 255, 255]);
    expect(errors).toEqual([]);
  });
}

test("强制禁用 GPU 时仍可乱序绘制 Presence 时间帧", async ({ page }) => {
  await page.goto("/test/presence-resources.html?time=0.875&gpu=off");
  await expect(page.locator("#backend")).toContainText("GPU 已强制禁用");
  await expect(page.locator("#gpu-scene")).toBeHidden();
  await expect(page.locator("#status")).toContainText("t=0.875s · alpha=0.5");
  await page.getByRole("button", { name: "1s", exact: true }).click();
  await expect(page.locator("#status")).toContainText("t=1s · alpha=none · live=0 · released=1");
  await page.getByRole("button", { name: "0.875s", exact: true }).click();
  await expect(page.locator("#status")).toContainText("t=0.875s · alpha=0.5 · live=1");
});
