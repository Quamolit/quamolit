import { expect, test } from "@playwright/test";

test("暂停、资源 ready 与 seek 将直接采样和模拟分开", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/playback.html");
  const status = page.locator("#status");
  await expect(status).toContainText("animation=0 · direct=25 · tick=0 · state=0 · ready=false");
  for (const [button, expected] of [
    ["运行 1s", "animation=1 · direct=35 · tick=4 · state=1 · ready=false"],
    ["运行 0.5s", "animation=0.5 · direct=30 · tick=2 · state=1.5 · ready=false"],
    ["暂停 @0.5s", "animation=0.5 · direct=30 · tick=2 · state=1.5 · ready=false"],
    ["资源 ready", "animation=0.5 · direct=50 · tick=2 · state=1.5 · ready=true"],
    ["seek→0.25s", "animation=0.25 · direct=27.5 · tick=1 · state=0.5 · ready=false"],
    ["重置 0s", "animation=0 · direct=25 · tick=0 · state=0 · ready=false"],
  ]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(status).toContainText(expected);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  await page.reload();
  await expect(status).toContainText("animation=0 · direct=25 · tick=0 · state=0 · ready=false");
  expect(pageErrors).toEqual([]);
});
