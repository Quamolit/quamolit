import { expect, test } from "@playwright/test";

test("固定 tick 输入在乱序截图和检查点重放时画面一致", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/simulation.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · tick=2 · value=1.5 · x=160 · pixel=14,165,233,255 · direct=staged");
  for (const [seconds, tick, value, x] of [[1, 4, 1, 120], [0, 0, 0, 40], [0.25, 1, 0.5, 80], [0.75, 3, 1, 120], [0.5, 2, 1.5, 160]]) {
    await page.getByRole("button", { name: `${seconds}s`, exact: true }).click();
    await expect(status).toContainText(`t=${seconds}s · tick=${tick} · value=${value} · x=${x} · pixel=14,165,233,255 · direct=staged`);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · tick=2 · value=1.5 · x=160");
  expect(pageErrors).toEqual([]);
});
