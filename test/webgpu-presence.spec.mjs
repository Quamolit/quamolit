import { expect, test } from "@playwright/test";

test("Presence 时间帧在真实 WebGPU 与 Canvas 间对照，终点可乱序回放", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/presence-resources.html?time=0.875");
  const gpu = page.locator("#backend");
  await expect(gpu).toHaveAttribute("data-kind", /ready|fallback|failed|unavailable/);
  await expect(page.locator("#status")).toContainText("t=0.875s · alpha=0.5");
  const kind = await gpu.getAttribute("data-kind");
  console.log(`Presence WebGPU adapter: ${await gpu.getAttribute("data-adapter-vendor")}/${await gpu.getAttribute("data-adapter-fallback")}, kind=${kind}`);
  if (kind !== "ready") {
    await expect(page.locator("#gpu-scene")).toBeHidden();
    await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  }
  test.skip(kind === "fallback" || kind === "unavailable", `当前 Chromium 没有可用硬件 WebGPU：${await gpu.textContent()}`);
  await expect(gpu).toHaveAttribute("data-kind", "ready");
  await expect(gpu).toHaveAttribute("data-result", "pass");
  await expect(gpu).toContainText("t=0.875s · alpha=0.5 · draw=1 · upload=0 · copied=0 · pipeline=1 · buffers=2");
  await page.getByRole("button", { name: "1s", exact: true }).click();
  await expect(gpu).toContainText("t=1s · alpha=none · draw=0 · upload=0");
  await expect(page.locator("#status")).toContainText("t=1s · alpha=none · live=0 · released=1 · active=false");
  await page.getByRole("button", { name: "0.5s", exact: true }).click();
  await expect(gpu).toContainText("t=0.5s · alpha=1 · draw=1 · upload=0 · copied=0");
  await expect(gpu).toContainText("pixel=234,88,12,255");
  await page.getByRole("button", { name: "0.875s", exact: true }).click();
  await expect(gpu).toContainText("t=0.875s · alpha=0.5 · draw=1 · upload=0 · copied=0");
  await page.getByRole("button", { name: "禁用 GPU" }).click();
  await expect(gpu).toHaveAttribute("data-kind", "fallback");
  await expect(page.locator("#gpu-scene")).toBeHidden();
  await expect(page.locator("#status")).toContainText("t=0.875s · alpha=0.5 · live=1");
  await page.getByRole("button", { name: "重试 GPU" }).click();
  await expect(gpu).toContainText("t=0.875s · alpha=0.5 · draw=1 · upload=80000 · copied=80000");
  await expect(gpu).toHaveAttribute("data-kind", "ready");
  expect(errors).toEqual([]);
});
