import { expect, test } from "@playwright/test";

test("打断过渡可按固定事件乱序重放，完成后停帧", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/transition.html?time=0.75");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.75s · x=70 · active=true · pixel=249,115,22,255");
  for (const [time, x, active] of [[1.25, 120, false], [0.25, 90, true], [0.5, 100, true], [1, 95, true], [1.25, 120, false]]) {
    await page.getByRole("button", { name: `${time}s`, exact: true }).click();
    await expect(status).toContainText(`t=${time}s · x=${x} · active=${active} · pixel=249,115,22,255`);
  }
  await page.reload();
  await expect(status).toContainText("t=0.75s · x=70");
  expect(errors).toEqual([]);
});
