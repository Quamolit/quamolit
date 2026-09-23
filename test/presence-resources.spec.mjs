import { expect, test } from "@playwright/test";

test("退出期间保留实例快照，终点只释放一次且可乱序重放", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/presence-resources.html?time=0.875");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.875s · alpha=0.5 · live=1 · released=0 · active=true");
  await page.getByRole("button", { name: "1s", exact: true }).click();
  await expect(status).toContainText("t=1s · alpha=none · live=0 · released=1 · active=false · pixel=255,255,255,255");
  await page.getByRole("button", { name: "0.5s", exact: true }).click();
  await expect(status).toContainText("t=0.5s · alpha=1 · live=1");
  await page.reload();
  await expect(status).toContainText("t=0.875s · alpha=0.5 · live=1");
  expect(errors).toEqual([]);
});
