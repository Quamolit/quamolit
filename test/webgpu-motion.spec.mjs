import { expect, test } from "@playwright/test";

test("硬件 WebGPU 按同一 Vec2 Motion 计划采样 10k 实例且热帧不重传位置", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/gpu-vec2.html?time=0.5");
  const gpu = page.locator("#backend");
  const cpu = page.locator("#status");
  await expect(cpu).toContainText("t=0.5s · x=128 · y=100");
  await expect(gpu).toHaveAttribute("data-kind", /ready|fallback|unavailable|failed/);
  const kind = await gpu.getAttribute("data-kind");
  console.log(`Vec2 GPU adapter: ${await gpu.getAttribute("data-adapter")}, kind=${kind}`);
  test.skip(kind === "fallback" || kind === "unavailable", `当前 Chromium 无可用硬件 WebGPU：${await gpu.textContent()}`);
  await expect(gpu).toHaveAttribute("data-kind", "ready");
  await expect(gpu).toContainText("t=0.5s · motion=moving-rect@1 · draw=1 · upload=0 · copied=0 · uniform=64 · pipeline=1 · buffers=2 · pixel=234,88,12,255");
  for (const time of [1, 0, 0.75, 0.25, 0.5]) {
    await page.getByRole("button", { name: `${time}s`, exact: true }).click();
    await expect(gpu).toContainText(`t=${time}s · motion=moving-rect@1 · draw=1 · upload=0 · copied=0 · uniform=64 · pipeline=1 · buffers=2`);
    await expect(cpu).toContainText(`t=${time}s`);
  }
  for (const time of [0.37, 0.81]) {
    await page.getByRole("button", { name: `${time}s`, exact: true }).click();
    await expect(gpu).toContainText(`t=${time}s · motion=moving-rect@1 · draw=1 · upload=0 · copied=0`);
    await expect(gpu).toContainText("pixel=numeric-only");
    const x = Number(await gpu.getAttribute("data-sample-x"));
    const y = Number(await gpu.getAttribute("data-sample-y"));
    const expectedX = 48 + 160 * time;
    const expectedY = 80 + 40 * time;
    expect(Math.abs(x - expectedX)).toBeLessThanOrEqual(1e-5 + 1e-5 * Math.abs(expectedX));
    expect(Math.abs(y - expectedY)).toBeLessThanOrEqual(1e-5 + 1e-5 * Math.abs(expectedY));
  }
  await page.getByRole("button", { name: "禁用 GPU" }).click();
  await expect(gpu).toHaveAttribute("data-kind", "fallback");
  await expect(page.locator("#gpu-scene")).toBeHidden();
  await expect(cpu).toContainText("t=0.5s · x=128 · y=100");
  await page.getByRole("button", { name: "重试 GPU" }).click();
  await expect(gpu).toContainText("t=0.5s · motion=moving-rect@1 · draw=1 · upload=80000 · copied=80000 · uniform=64");
  await expect(gpu).toHaveAttribute("data-kind", "ready");
  expect(errors).toEqual([]);
});
