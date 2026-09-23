import { expect, test } from "@playwright/test";

test("颜色在任意时间和倒退采样时保持线性 sRGB 与透明端点", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/color.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s");
  for (const [seconds, channels, pixel] of [
    [1, "RGB=(0.000000,0,1.000000) · alpha=1.00", "pixel=0,0,255,255"],
    [0, "RGB=(1.000000,0,0.000000) · alpha=0.00", "pixel=255,255,255,255"],
    [0.25, "RGB=(0.880825,0,0.537099) · alpha=0.25", null],
    [0.5, "RGB=(0.735357,0,0.735357) · alpha=0.50", "pixel=221,127,221,255"],
    [0.5, "RGB=(0.735357,0,0.735357) · alpha=0.50", "pixel=221,127,221,255"],
  ]) {
    await page.getByRole("button", { name: `${seconds}s`, exact: true }).click();
    await expect(status).toContainText(`t=${seconds}s`);
    await expect(status).toContainText(channels);
    if (pixel) await expect(status).toContainText(pixel);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s");
  expect(pageErrors).toEqual([]);
});
