import { expect, test } from "@playwright/test";

test("两输入组合可乱序、倒退、重复采样并保留位置像素", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/composition.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · value=17 · x=190 · pixel=124,58,237,255");
  for (const [seconds, value, x] of [[1, 23, 250], [0, 11, 130], [0.25, 14, 160], [0.5, 17, 190], [0.5, 17, 190]]) {
    await page.getByRole("button", { name: `${seconds}s`, exact: true }).click();
    await expect(status).toContainText(`t=${seconds}s · value=${value} · x=${x} · pixel=124,58,237,255`);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · value=17 · x=190");
  expect(pageErrors).toEqual([]);
});
