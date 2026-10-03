import { expect, test } from "@playwright/test";

async function ready(page) {
  await page.goto("http://127.0.0.1:5180/examples/table/index.html");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}
async function clickCell(page, index) {
  const point = await page.evaluate((index) => {
    const state = window.tableDemo.snapshot(),
      bounds = document.querySelector("canvas").getBoundingClientRect();
    const x = ((index % 3) - 1) * 200,
      y = (Math.floor(index / 3) - 1) * 124;
    return {
      x: bounds.left + ((state.view.x + x * state.view.scale) * bounds.width) / state.width,
      y: bounds.top + ((state.view.y + y * state.view.scale) * bounds.height) / state.height,
    };
  }, index);
  await page.mouse.click(point.x, point.y);
}

test("Canvas 点击、中文编辑、失焦、取消与分享重放", async ({ page }, testInfo) => {
  await ready(page);
  expect((await page.evaluate(() => window.tableDemo.snapshot())).scene.nodes).toHaveLength(18);
  await page.screenshot({ path: testInfo.outputPath("table-initial.png") });
  await clickCell(page, 4);
  await expect(page.locator("#editor")).toBeVisible();
  await page.locator("#editor").fill("中文输入测试");
  await page.screenshot({ path: testInfo.outputPath("table-editing.png") });
  await page.locator("#editor").dispatchEvent("keydown", { key: "Enter", isComposing: true });
  await expect(page.locator("#editor")).toBeVisible();
  await page.locator("#editor").press("Enter");
  expect((await page.evaluate(() => window.tableDemo.snapshot())).cells[4]).toBe("中文输入测试");
  await clickCell(page, 0);
  await page.locator("#editor").fill("取消此修改");
  await page.locator("#editor").press("Escape");
  expect((await page.evaluate(() => window.tableDemo.snapshot())).cells[0]).toBe("第一格");
  await clickCell(page, 8);
  await page.locator("#editor").fill("失焦提交");
  await page.locator("#panel-toggle").click();
  expect((await page.evaluate(() => window.tableDemo.snapshot())).cells[8]).toBe("失焦提交");
  await page.screenshot({ path: testInfo.outputPath("table-committed.png") });
  await page.locator("#panel-toggle").click();
  await page.locator("#share").click();
  const shared = page.url(),
    pixels = await page.locator("canvas").evaluate((canvas) => canvas.toDataURL());
  const before = await page.evaluate(() => window.tableDemo.snapshot());
  await page.goto(shared);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  expect((await page.evaluate(() => window.tableDemo.snapshot())).cells).toEqual(before.cells);
  expect(await page.locator("canvas").evaluate((canvas) => canvas.toDataURL())).toBe(pixels);
});

test("窄屏 DPR 2 resize 与浮层不改变九格", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    await page.evaluate(() => window.tableDemo.set(2, "月光"));
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    expect((await page.evaluate(() => window.tableDemo.snapshot())).cells[2]).toBe("月光");
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("table-mobile-dpr2.png") });
  } finally {
    await context.close();
  }
});

for (const dpr of [1, 2]) {
  test(`实际 Scene 命中 DPR ${dpr}：标签、格子边缘、resize与面板缩放后使用当前视图`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await ready(page);
      const clickLocal = async (x, y) => {
        const point = await page.evaluate(
          ({ x, y }) => {
            const state = window.tableDemo.snapshot(),
              bounds = document.querySelector("canvas").getBoundingClientRect();
            return {
              x: bounds.left + ((state.view.x + x * state.view.scale) * bounds.width) / state.width,
              y: bounds.top + ((state.view.y + y * state.view.scale) * bounds.height) / state.height,
            };
          },
          { x, y },
        );
        await page.mouse.click(point.x, point.y);
      };
      await clickLocal(-76, 8); // 文本覆盖的区域仍属于中间格子，不生成第二套交互。
      await expect(page.locator("#editor")).toBeVisible();
      expect((await page.evaluate(() => window.tableDemo.snapshot())).selected).toBe(4);
      await page.locator("#editor").fill("当前Scene");
      await page.locator("#editor").press("Enter");
      await page.locator("#panel-toggle").click();
      await expect(page.locator("#panel")).toBeHidden();
      await clickLocal(88, 50); // 含抗锯齿取整的鼠标坐标避开精确边界；纯Node覆盖边界。
      expect((await page.evaluate(() => window.tableDemo.snapshot())).selected).toBe(4);
      await page.locator("#editor").press("Escape");
      await clickLocal(92, 0); // 可见格子之间的缝隙不能误开编辑器。
      await expect(page.locator("#editor")).toBeHidden();
      const before = await page.evaluate(() => window.tableDemo.snapshot());
      await page.setViewportSize({ width: 740, height: 680 });
      await expect
        .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
        .toEqual([740 * dpr, 680 * dpr]);
      await clickCell(page, 8);
      expect((await page.evaluate(() => window.tableDemo.snapshot())).selected).toBe(8);
      await page.locator("#editor").fill("重绘后命中");
      await page.locator("#editor").press("Enter");
      const after = await page.evaluate(() => window.tableDemo.snapshot());
      expect(after.cells[4]).toBe(before.cells[4]);
      expect(after.cells[8]).toBe("重绘后命中");
      expect(after.scene.nodes[17].content[1].text).toBe("重绘后命中");
      expect(after.scene.nodes).toHaveLength(18);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
