import { expect, test } from "@playwright/test";

test("列表 fade、重排、退出和停帧可乱序截图", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/presence.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · order=root,a,b · a-alpha=0.5");
  await expect(status).toContainText("pixel=30,144,255,255");
  await page.getByRole("button", { name: "0.75s", exact: true }).click();
  await expect(status).toContainText("order=root,b,a · a-alpha=1 · a-interactive=false");
  await page.getByRole("button", { name: "1.25s", exact: true }).click();
  await expect(status).toContainText("order=root,b · a-alpha=none · a-interactive=false · released=1 · active=false");
  await page.getByRole("button", { name: "0.25s", exact: true }).click();
  await expect(status).toContainText("order=root,b,a · a-alpha=0");
  await page.reload();
  await expect(status).toContainText("t=0.5s · order=root,a,b");
  expect(errors).toEqual([]);
});

test("退出途中同 key 重入保留显示实例且取消释放", async ({ page }) => {
  await page.goto("/test/presence.html?time=1.375&reenter=1");
  const status = page.locator("#status");
  await expect(status).toContainText("order=root,b,a · a-alpha=1 · a-interactive=true · released=0 · active=false");
});
