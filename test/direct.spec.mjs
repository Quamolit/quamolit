import { expect, test } from "@playwright/test";

test("直接采样可乱序并在相同时间刷新模型、输入、资源和视口", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/direct.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · value=25 · x=120 · pixel=234,88,12,255 · versions=m0/i0/r0/v0");
  for (const [seconds, value, x] of [[1, 30, 140], [0, 20, 100], [0.25, 22.5, 110], [0.5, 25, 120], [0.5, 25, 120]]) {
    await page.getByRole("button", { name: `${seconds}s`, exact: true }).click();
    await expect(status).toContainText(`t=${seconds}s · value=${value} · x=${x} · pixel=234,88,12,255`);
  }
  for (const [label, value, x, revisions] of [
    ["资源 ready", 45, 200, "m0/i0/r1/v0"],
    ["模型 +5", 50, 220, "m1/i0/r1/v0"],
    ["输入 +2", 52, 228, "m1/i1/r1/v0"],
    ["视口 150", 57, 248, "m1/i1/r1/v1"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(status).toContainText(`t=0.5s · value=${value} · x=${x} · pixel=234,88,12,255 · versions=${revisions}`);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · value=25 · x=120");
  expect(pageErrors).toEqual([]);
});

test("非有限时间不会产出 PASS 画面", async ({ page }) => {
  await page.goto("/test/direct.html?time=NaN");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "fail");
});
