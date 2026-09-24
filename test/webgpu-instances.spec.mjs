import { expect, test } from "@playwright/test";

test("真实 WebGPU 消费 10k 同源实例，并可释放回退及重建", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/instance-sources.html");
  const gpu = page.locator("#gpu-status");
  await expect(gpu).toHaveAttribute("data-result", /ready|fallback|failed/);
  const result = await gpu.getAttribute("data-result");
  console.log(`WebGPU adapter: fallback=${await gpu.getAttribute("data-adapter-fallback")}, vendor=${await gpu.getAttribute("data-adapter-vendor")}, description=${await gpu.getAttribute("data-adapter-description")}, result=${result}`);
  if (result === "fallback") {
    await expect(gpu).toContainText("Canvas 回退：");
    await expect(gpu).toHaveAttribute("data-live-layers", "0");
    await expect(page.locator("#gpu-scene")).toBeHidden();
    await expect(page.locator("#status")).toContainText("version=1 · nodes=3 · instances=10000");
  }
  test.skip(result === "fallback", `当前 Chromium 没有可用 WebGPU adapter：${await gpu.textContent()}`);
  await expect(gpu).toHaveAttribute("data-result", "ready");
  await expect(gpu).toHaveAttribute("data-live-layers", "1");
  await expect(gpu).toContainText("version=1 · draw=1 · instances=10000 · upload=80000");
  await expect(gpu).toContainText("pipeline=1 · buffers=2 · pixel=234,88,12,255");
  await page.locator("#v1").click();
  await expect(gpu).toContainText("version=1 · draw=1 · instances=10000 · upload=0 · copied=0");
  await page.locator("#v2").click();
  await expect(gpu).toContainText("version=2 · draw=1 · instances=10000 · upload=80000");
  await page.locator("#disable-gpu").click();
  await expect(gpu).toHaveAttribute("data-result", "fallback");
  await expect(gpu).toHaveAttribute("data-live-layers", "0");
  await expect(gpu).not.toContainText("释放错误");
  await expect(page.locator("#gpu-scene")).toBeHidden();
  await expect(page.locator("#status")).toContainText("version=2 · nodes=3 · instances=10000");
  await page.locator("#retry-gpu").click();
  await expect(gpu).toContainText("version=2 · draw=1 · instances=10000 · upload=80000");
  await expect(gpu).toHaveAttribute("data-result", "ready");
  await expect(gpu).toHaveAttribute("data-live-layers", "1");
  expect(errors).toEqual([]);
});
