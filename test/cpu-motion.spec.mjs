import { expect, test } from "@playwright/test";

test("泛型 CPU Vec2 中间帧可乱序采样，同时间输入变更不会复用旧画面", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/cpu-motion.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("center=(100,70)");
  for (const [button, expected] of [
    ["1s", "center=(120,70)"], ["0s", "center=(80,70)"],
    ["0.25s", "center=(90,70)"], ["0.5s", "center=(100,70)"],
    ["ready", "center=(120,70)"], ["viewport", "center=(100,71)"],
    ["model", "center=(101,70)"], ["0.5s", "center=(100,70)"],
  ]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(status).toContainText(expected);
    await expect(status).toContainText("GPU: runtime-callback-vec2");
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  expect(errors).toEqual([]);
});
