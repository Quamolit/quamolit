import { expect, test } from "@playwright/test";

test("声明式组件可乱序采样，并响应同时间 Model、资源和视口变化", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/component.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · x=100 · y=62 · width=10 · ready=false · pixel=235,71,153,255");
  for (const [time, x] of [["1s", 120], ["0s", 80], ["0.25s", 90], ["0.5s", 100]]) {
    await page.getByRole("button", { name: time, exact: true }).click();
    await expect(status).toContainText(`x=${x} · y=62`);
  }
  await page.getByRole("button", { name: "Model +1" }).click();
  await expect(status).toContainText("t=0.5s · x=100 · y=63");
  await page.getByRole("button", { name: "资源 ready 切换" }).click();
  await expect(status).toContainText("ready=true · pixel=0,179,102,255");
  await page.getByRole("button", { name: "视口版本切换" }).click();
  await expect(status).toContainText("width=11 · ready=true");
  await page.reload();
  await expect(status).toContainText("t=0.5s · x=100 · y=62 · width=10 · ready=false");
  expect(errors).toEqual([]);
});

test("非法时间不能得到通过状态", async ({ page }) => {
  await page.goto("/test/component.html?time=NaN");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "fail");
});
