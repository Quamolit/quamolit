import { expect, test } from "@playwright/test";

test("CPU 自定义采样可乱序、倒退、重复，并给出 GPU 不支持诊断", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/custom.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · value=11 · x=130 · pixel=13,148,136,255 · GPU=unsupported:runtime-callback");
  for (const [seconds, value, x] of [[1, 12, 140], [0, 10, 120], [0.25, 10.5, 125], [0.5, 11, 130], [0.5, 11, 130]]) {
    await page.getByRole("button", { name: `${seconds}s`, exact: true }).click();
    await expect(status).toContainText(`t=${seconds}s · value=${value} · x=${x} · pixel=13,148,136,255`);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · value=11 · x=130");
  expect(pageErrors).toEqual([]);
});
