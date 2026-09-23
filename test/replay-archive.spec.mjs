import { expect, test } from "@playwright/test";

test("检查点淘汰后从完整输入日志倒退重放，画面和像素一致", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/replay-archive.html?tick=6");
  const status = page.locator("#status");
  await expect(status).toContainText("tick=6 · value=2 · center=(160,70) · inputs=6 · checkpoints=2");
  for (const [tick, value, x] of [[0, 0, 80], [2, 1.5, 140], [4, 1, 120], [5, 2.5, 180], [2, 1.5, 140]]) {
    await page.getByRole("button", { name: `tick ${tick}` }).click();
    await expect(status).toContainText(`tick=${tick} · value=${value} · center=(${x},70)`);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  for (const button of ["暂停到 20s", "seek 到 20s"]) {
    await page.getByRole("button", { name: button }).click();
    await expect(status).toContainText("tick=2 · value=1.5 · center=(140,70)");
  }
  const rejected = await page.evaluate(() => {
    try { window.quamolitReplayArchiveFixture.renderAt(2, 1); return false; }
    catch { return true; }
  });
  expect(rejected).toBe(true);
  expect(errors).toEqual([]);
});
