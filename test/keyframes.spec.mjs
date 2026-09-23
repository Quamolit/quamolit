import { expect, test } from "@playwright/test";

test("关键帧重复、负时间、repeat 与 mirror 端点可重放", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/keyframes.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · clamp=144 · repeat=144 · mirror=144");
  for (const [button, result] of [
    ["1s", "t=1s · clamp=208 · repeat=48 · mirror=208"],
    ["-0.25s", "t=-0.25s · clamp=48 · repeat=176 · mirror=88"],
    ["1.25s", "t=1.25s · clamp=208 · repeat=88 · mirror=176"],
    ["1.25s", "t=1.25s · clamp=208 · repeat=88 · mirror=176"],
  ]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(status).toContainText(result);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · clamp=144 · repeat=144 · mirror=144");
  expect(pageErrors).toEqual([]);
});
