import { expect, test } from "@playwright/test";

test("一个逻辑节点的万实例数据可按版本重绘且像素确定", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/instance-sources.html");
  const status = page.locator("#status");
  await expect(status).toContainText("PASS · t=0.5s · version=1 · nodes=3 · instances=10000 · ffi=2 · copied=80000 · canvas=10000 · pixel=234,88,12,255");
  await page.locator("#v2").click();
  await expect(status).toHaveAttribute("data-version", "2");
  await expect(status).toContainText("ffi=1 · copied=0 · canvas=10000");
  await page.locator("#v1").click();
  await expect(status).toHaveAttribute("data-version", "1");
  const gpu = page.locator("#gpu-status");
  await expect(gpu).toHaveAttribute("data-result", /ready|fallback/);
  if ((await gpu.getAttribute("data-result")) === "ready") {
    await expect(gpu).toContainText("draw=1 · instances=10000 · upload=80000");
    await page.locator("#v1").click();
    await expect(gpu).toContainText("draw=1 · instances=10000 · upload=0 · copied=0 · pipeline=1 · buffers=2");
  } else {
    await expect(gpu).toContainText("Canvas 回退：WebGPU");
  }
  expect(errors).toEqual([]);
});

test("强制无 GPU 时完整实例图层回退，版本切换仍按时间正确绘制", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/instance-sources.html?gpu=off");
  await expect(page.locator("#gpu-status")).toHaveAttribute("data-result", "fallback");
  await expect(page.locator("#gpu-status")).toContainText("GPU 已强制禁用");
  await expect(page.locator("#gpu-scene")).toBeHidden();
  await expect(page.locator("#status")).toContainText("version=1 · nodes=3 · instances=10000");
  await page.locator("#v2").click();
  await expect(page.locator("#status")).toContainText("version=2 · nodes=3 · instances=10000");
  await page.locator("#retry-gpu").click();
  await expect(page.locator("#gpu-status")).toContainText("GPU 已强制禁用");
  expect(errors).toEqual([]);
});
