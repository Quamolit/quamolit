import { expect, test } from "@playwright/test";

test("Calcit Vec2 Motion 在 Canvas 参考路径乱序绘制 10k 实例", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/gpu-vec2.html?time=0.5&gpu=off");
  const status = page.locator("#status");
  await expect(page.locator("#backend")).toContainText("GPU 已强制禁用");
  await expect(status).toContainText("t=0.5s · x=128 · y=100 · instances=10000 · canvas=10000 · copied=0 · pixel=234,88,12,255");
  for (const [time, x, y] of [[1, 208, 120], [0, 48, 80], [0.25, 88, 90], [0.75, 168, 110], [0.5, 128, 100]]) {
    await page.getByRole("button", { name: `${time}s`, exact: true }).click();
    await expect(status).toContainText(`t=${time}s · x=${x} · y=${y} · instances=10000 · canvas=10000 · copied=0 · pixel=234,88,12,255`);
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · x=128 · y=100");
  expect(errors).toEqual([]);
});
