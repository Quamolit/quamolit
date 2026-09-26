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

test("恢复清单可搜索但不能假装打开，艺术分类有空状态", async ({ page }) => {
  await page.goto("demos/index.html?group=originals");
  await expect(page.locator("[data-planned]")).toHaveCount(catalog.planned.length);
  await expect(page.locator("a[data-demo]")).toHaveCount(catalog.entries.filter(e => e.group === "originals").length);
  await page.getByLabel("查找演示").fill("折扇");
  await expect(page.locator("[data-planned]")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("[data-planned=folding-fan]")).toBeVisible();
  await page.getByLabel("查找演示").fill("");
  await page.getByLabel("分类", { exact: true }).selectOption("art");
  await expect(page.locator("#art .reserved")).toContainText("尚无已交付作品");
  await expect(page.locator("#empty")).toBeHidden();
});

for (const dpr of [1, 2]) test(`全屏消费者：DPR ${dpr}、暂停 resize 与浮层`, async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: dpr });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:5190/preview/examples/retained-consumer/index.html");
    await page.waitForFunction(() => window.consumer?.snapshot().browser);
    await page.evaluate(() => window.consumer.set({ time: 0.5 }));
    const before = await page.evaluate(() => window.consumer.snapshot());
    for (const size of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      await expect.poll(() => page.locator("canvas").evaluate(c => [c.width, c.height])).toEqual([size.width * dpr, size.height * dpr]);
      expect(await page.locator("canvas").boundingBox()).toEqual({ x: 0, y: 0, ...size });
      expect(await page.evaluate(() => window.consumer.snapshot())).toEqual(before);
      await page.locator("#panel-toggle").click();
      await expect(page.locator("#panel")).toBeHidden();
      // 未被实际浮层覆盖的区域直接落在 canvas，不存在透明全屏遮罩。
      expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
      const pixel = await page.locator("canvas").evaluate(c => {
        const s = Math.min(c.width / 320, c.height / 180);
        const x = Math.floor((c.width - 320 * s) / 2 + 103 * s);
        const y = Math.floor((c.height - 180 * s) / 2 + 65 * s);
        return [...c.getContext("2d").getImageData(x, y, 1, 1).data];
      });
      expect(pixel).toEqual([235, 71, 153, 255]);
      await page.screenshot({ path: testInfo.outputPath(`stage-${size.width}.png`) });
      await page.locator("#panel-toggle").focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("#panel")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`overlay-${size.width}.png`) });
    }
  } finally { await context.close(); }
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
    await page.getByLabel("分类", { exact: true }).selectOption("");
    await expect(page.locator("a[data-demo]")).toHaveCount(catalog.entries.length);
    expect(errors).toEqual([]);
  });
}
