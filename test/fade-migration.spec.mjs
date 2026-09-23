import { expect, test } from "@playwright/test";

test("旧 fade 进入、退出与中途打断可乱序截图且位置连续", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/fade-migration.html?mode=enter&time=0.125");
  const status = page.locator("#status");
  await expect(status).toContainText("mode=enter · t=0.125s · alpha=0.5");
  await page.getByRole("button", { name: "0.25s", exact: true }).click();
  await expect(status).toContainText("mode=enter · t=0.25s · alpha=1");
  await page.getByRole("button", { name: "0s", exact: true }).click();
  await expect(status).toContainText("mode=enter · t=0s · alpha=0");
  await page.getByRole("button", { name: "退出", exact: true }).click();
  await page.getByRole("button", { name: "0.625s", exact: true }).click();
  await expect(status).toContainText("mode=exit · t=0.625s · alpha=0.5");
  await page.getByRole("button", { name: "中途打断", exact: true }).click();
  await page.getByRole("button", { name: "0.125s", exact: true }).click();
  await expect(status).toContainText("mode=interrupt · t=0.125s · alpha=0.5");
  await page.getByRole("button", { name: "0.25s", exact: true }).click();
  await expect(status).toContainText("mode=interrupt · t=0.25s · alpha=0.25");
  await page.reload();
  await expect(status).toContainText("mode=enter · t=0.125s · alpha=0.5");
  expect(errors).toEqual([]);
});

test("非法时间不会得到通过画面", async ({ page }) => {
  await page.goto("/test/fade-migration.html?time=NaN");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "fail");
});
