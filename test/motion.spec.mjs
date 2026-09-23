import { expect, test } from "@playwright/test";

test("Calcit Motion 标量与二维向量中间帧可乱序、倒退和重复采样", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/motion.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · value=15 · center=(128,100)");
  for (const [button, result] of [
    ["0.75s", "t=0.75s · value=17.5 · center=(168,110)"],
    ["0.25s", "t=0.25s · value=12.5 · center=(88,90)"],
    ["1s", "t=1s · value=20 · center=(208,120)"],
    ["1s", "t=1s · value=20 · center=(208,120)"],
  ]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(status).toContainText(result);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · value=15 · center=(128,100)");
  expect(pageErrors).toEqual([]);
});
