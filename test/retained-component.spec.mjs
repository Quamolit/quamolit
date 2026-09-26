import { test, expect } from "@playwright/test";

test("Calcit 组件保留计划：乱序时间、同时间失效和 1000 帧对照", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/retained-component.html");
  const status = page.locator("#status");
  await expect(status).toContainText("PASS · 两侧全部像素一致 · t=0.5s · x=100 · y=62 · width=10");
  for (const [time, x] of [["1s", 120], ["0s", 80], ["0.25s", 90], ["0.5s", 100]]) {
    await page.getByRole("button", { name: time, exact: true }).click();
    await expect(status).toContainText(`x=${x}`);
  }
  await page.getByRole("button", { name: "Model +1", exact: true }).click();
  await expect(status).toContainText("y=63");
  await page.getByRole("button", { name: "资源 ready 切换" }).click();
  await expect(status).toContainText("ready=true");
  await page.getByRole("button", { name: "视口版本切换" }).click();
  await expect(status).toContainText("width=11");
  await page.getByRole("button", { name: "验证 1000 帧" }).click();
  await expect(page.locator("#counts")).toContainText("参考声明 1001 次 · 保留声明 1 次 · 计划构建 1 次 · 绑定采样 1001 次", { timeout: 45_000 });
  const pixel = await page.locator("#retained").evaluate((canvas) => Array.from(canvas.getContext("2d").getImageData(125, 70, 1, 1).data));
  expect(pixel).toEqual([235, 71, 153, 255]);
  await page.screenshot({ path: testInfo.outputPath("retained-component.png"), fullPage: true });
  await testInfo.attach("Calcit 保留组件演示", { path: testInfo.outputPath("retained-component.png"), contentType: "image/png" });
  expect(errors).toEqual([]);
});

test("非法时间明确失败", async ({ page }) => {
  await page.goto("/test/retained-component.html?time=NaN");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "fail");
});
