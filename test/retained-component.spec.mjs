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

test("统一计划混合标量矩形与仿射折线，保持声明层序", async ({ page }) => {
  await page.goto("/test/retained-component.html");
  const results=await page.evaluate(async()=>{
    const fixture=await import("/target/js/retained-component/quamolit.test.retained-component-fixture.mjs");
    const execution=await import("/target/js/retained-component/quamolit.retained-component.mjs");
    const canvas=await import("/target/js/retained-component/quamolit.canvas-reference.mjs");
    const create=()=>{const c=document.createElement("canvas");c.width=320;c.height=180;return c.getContext("2d");};
    return [1,0,0.5,0.25,1].map(time=>{
      const actual=create(),expected=create();
      execution.draw_plan_$x_(actual,fixture.start_mixed(time,40,false,100));
      canvas.draw_reference_$x_(expected,fixture.reference_at(time,40,false,100));
      // 独立原生参考：全量标量矩形在前，半透明折线在后。
      expected.translate(40+10*time,0);expected.strokeStyle="rgba(0,128,255,0.5)";
      expected.lineWidth=4;expected.lineCap=expected.lineJoin="round";
      expected.beginPath();expected.moveTo(40,60);expected.lineTo(80,70);expected.stroke();
      const a=actual.getImageData(0,0,320,180).data,b=expected.getImageData(0,0,320,180).data;
      return a.every((value,i)=>value===b[i]);
    });
  });
  expect(results).toEqual([true,true,true,true,true]);
});
