import { expect, test } from "@playwright/test";

test("一个逻辑节点的万实例数据可按版本重绘且像素确定", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/instance-sources.html");
  const status = page.locator("#status");
  await expect(status).toContainText("PASS · t=0.5s · version=1 · nodes=3 · instances=10000 · pixel=234,88,12,255");
  await page.locator("#v2").click();
  await expect(status).toHaveAttribute("data-version", "2");
  await page.locator("#v1").click();
  await expect(status).toHaveAttribute("data-version", "1");
  expect(errors).toEqual([]);
});
