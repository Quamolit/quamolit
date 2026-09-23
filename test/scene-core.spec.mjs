import { expect, test } from "@playwright/test";

test("Scene IR 任意时间构造、序列化后可绘制准确中间帧", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/scene-core.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · rect-center=108 · nodes=3 · instances=10000 · pixel=234,88,12,255");
  for (const [time, x] of [[1, 128], [0, 88], [0.25, 98], [0.5, 108], [0.5, 108]]) {
    await page.getByRole("button", { name: `${time}s`, exact: true }).click();
    await expect(status).toContainText(`t=${time}s · rect-center=${x} · nodes=3 · instances=10000 · pixel=234,88,12,255`);
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · rect-center=108");
  expect(pageErrors).toEqual([]);
});

test("非法时间不能产生 PASS 场景", async ({ page }) => {
  await page.goto("/test/scene-core.html?time=NaN");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "fail");
});
