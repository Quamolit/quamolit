import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const catalog = JSON.parse(await readFile(new URL("../demos/catalog.json", import.meta.url), "utf8"));

test("导航分类、搜索、刷新与移动端可用", async ({ page }, testInfo) => {
  await page.goto("demos/index.html");
  await expect(page.locator("a[data-demo]")).toHaveCount(catalog.entries.length);
  await page.screenshot({ path: testInfo.outputPath("gallery-desktop.png") });
  await page.getByLabel("分类", { exact: true }).selectOption("public");
  await expect(page.locator("a[data-demo]")).toHaveCount(2);
  await page.getByLabel("查找演示").fill("独立");
  await expect(page.locator("a[data-demo]")).toHaveCount(1);
  await page.reload();
  await expect(page.getByLabel("查找演示")).toHaveValue("独立");
  await expect(page.locator("a[data-demo]")).toHaveCount(1);
  await page.getByLabel("查找演示").fill("不存在的例子");
  await expect(page.locator("#empty")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("demos/index.html");
  await expect(page.locator("a[data-demo]")).toHaveCount(catalog.entries.length);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("gallery-mobile.png") });
});

for (const entry of catalog.entries) {
  test(`发布产物导航往返：${entry.title}`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("requestfailed", request => errors.push(`${request.url()} ${request.failure()?.errorText}`));
    page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    // 这个门禁验证入口与完整 Canvas 回退，不把 CI 软件 GPU 当作硬件验收。
    await page.addInitScript(() => Object.defineProperty(navigator, "gpu", { value: undefined, configurable: true }));
    await page.goto("demos/index.html");
    await page.locator(`a[data-demo="${entry.path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/preview/${entry.path.replaceAll(".", "\\.")}$`));
    if (entry.path === "examples/retained-consumer/index.html") {
      await page.waitForFunction(() => window.consumer?.snapshot().browser);
    } else if (entry.path === "test/m0/index.html") {
      await expect(page.locator("#status")).toHaveAttribute("data-result", "ready");
    } else if (!["index.html", "test/m0/bench.html"].includes(entry.path)) {
      await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
    }
    await expect(page.locator("canvas").first()).toBeAttached();
    expect(errors).toEqual([]);
    await testInfo.attach("entry", { body: JSON.stringify({ ...entry, url: page.url(), browser: page.context().browser().version(), gpu: "forced-unavailable; fallback only", errors }, null, 2), contentType: "application/json" });
    await page.getByRole("navigation", { name: "演示导航" }).getByRole("link").click();
    await expect(page.locator("a[data-demo]")).toHaveCount(catalog.entries.length);
    expect(errors).toEqual([]);
  });
}
