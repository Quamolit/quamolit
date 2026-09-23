import { expect, test } from "@playwright/test";

test("暂停、变速、倒放和 seek 后绘制映射时间的中间帧", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/host-clock.html");
  const status = page.locator("#status");
  await expect(status).toContainText("host=10.25 · animation=0.25 · x=110 · pixel=234,88,12,255");
  for (const [button, expected] of [
    ["暂停 @10.5", "host=20 · animation=0.5 · x=120"],
    ["恢复 @20", "host=20.25 · animation=0.75 · x=130"],
    ["加速 2× @20.25", "host=20.35 · animation=0.95 · x=138"],
    ["倒放 -1× @20.35", "host=20.6 · animation=0.7 · x=128"],
    ["seek→0.2 @20.6", "host=20.6 · animation=0.2 · x=108"],
  ]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(status).toContainText(`${expected} · pixel=234,88,12,255`);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  await page.reload();
  await expect(status).toContainText("host=10.25 · animation=0.25 · x=110");
  expect(pageErrors).toEqual([]);
});
