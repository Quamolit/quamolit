import { expect, test } from "@playwright/test";

for (const dpr of [1, 2])
  test(`DPR ${dpr}：点击已提交画面，不按尚未绘制的宿主时间重新命中`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    try {
      const origin = new Date("2026-10-04T00:00:00Z");
      await page.clock.install({ time: origin });
      await page.clock.pauseAt(origin);
      await ready(page);
      await page.locator("#panel-toggle").click();
      await page.evaluate(() => window.finderDemo.send("folder", 0, -1, 0, false));
      const shown = await page.evaluate(() => window.finderDemo.seek(0.1));
      const folder = shown.scene.nodes.find((node) => node.id === "folder-0").content[1];
      await page.evaluate(() => {
        window.finderDemo.play();
        const now = performance.now();
        // 模拟主线程时钟已前进但rAF尚未提交新帧；不改变当前可见Scene。
        performance.now = () => now + 1000;
      });
      await clickLogical(page, folder.x + folder.width / 2, folder.y + folder.height / 2);
      const result = await page.evaluate(() => window.finderDemo.snapshot());
      expect(result.events.at(-1)).toMatchObject({ kind: "back", at: 0.1 });
      expect(result.scene).toEqual(shown.scene);
      expect(result.time).toBe(0.1);
    } finally {
      await context.close();
    }
  });

async function ready(page, query = "") {
  await page.goto(`http://127.0.0.1:5180/examples/finder/index.html${query}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}
async function clickLogical(page, x, y) {
  const position = await page.evaluate(
    ({ x, y }) => {
      const view = window.finderDemo.snapshot().view,
        bounds = document.querySelector("canvas").getBoundingClientRect();
      return {
        x: bounds.left + ((view.x + x * view.scale) * bounds.width) / document.querySelector("canvas").width,
        y: bounds.top + ((view.y + y * view.scale) * bounds.height) / document.querySelector("canvas").height,
      };
    },
    { x, y },
  );
  await page.mouse.click(position.x, position.y);
}

async function captureWithAndWithoutOverlay(page, testInfo, name) {
  await page.screenshot({ path: testInfo.outputPath(`${name}-overlay.png`) });
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeHidden();
  await page.locator("nav, #panel-toggle").evaluateAll((elements) => {
    for (const element of elements) element.hidden = true;
  });
  await page.screenshot({ path: testInfo.outputPath(`${name}-canvas.png`) });
  await page.locator("nav, #panel-toggle").evaluateAll((elements) => {
    for (const element of elements) element.hidden = false;
  });
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeVisible();
}

test("文件夹和卡片未完全关闭时可直接点击另一项", async ({ page }, testInfo) => {
  await ready(page);
  await page.evaluate(() => window.finderDemo.send("folder", 0, -1, 0, false));
  await page.evaluate(() => window.finderDemo.seek(0.42));
  await page.evaluate(() => window.finderDemo.send("back", 0, -1, 0.42, false));
  const folderStart = await page.evaluate(() => window.finderDemo.seek(0.56));
  await captureWithAndWithoutOverlay(page, testInfo, "finder-folder-switch-start");
  const folderOne = folderStart.scene.nodes.find((node) => node.id === "folder-1").content[1];
  await clickLogical(page, folderOne.x + folderOne.width / 2, folderOne.y + folderOne.height / 2);
  const folderEvent = await page.evaluate(() => window.finderDemo.seek(0.56));
  expect(folderEvent.model.folder).toBe(1);
  expect(folderEvent.scene).toEqual(folderStart.scene);
  const folderMiddle = await page.evaluate(() => window.finderDemo.seek(0.72));
  expect(folderMiddle.folderValues[0]).toBeGreaterThan(0);
  expect(folderMiddle.folderValues[1]).toBeGreaterThan(0);
  await captureWithAndWithoutOverlay(page, testInfo, "finder-folder-switch-middle");
  const folderEnd = await page.evaluate(() => window.finderDemo.seek(0.98));
  expect(folderEnd.folderValues[0]).toBe(0);
  expect(folderEnd.folderValues[1]).toBe(1);
  await captureWithAndWithoutOverlay(page, testInfo, "finder-folder-switch-end");

  await page.evaluate(() => window.finderDemo.send("card", 1, 0, 0.98, false));
  await page.evaluate(() => window.finderDemo.seek(1.34));
  await page.evaluate(() => window.finderDemo.send("back", 1, -1, 1.34, false));
  const cardStart = await page.evaluate(() => window.finderDemo.seek(1.46));
  const cardOne = cardStart.scene.nodes.find((node) => node.id === "card-1/1").content[1];
  await clickLogical(page, cardOne.x + cardOne.width / 2, cardOne.y + cardOne.height / 2);
  const cardEvent = await page.evaluate(() => window.finderDemo.seek(1.46));
  expect(cardEvent.model.card).toBe(1);
  expect(cardEvent.scene).toEqual(cardStart.scene);
  const cardMiddle = await page.evaluate(() => window.finderDemo.seek(1.59));
  expect(cardMiddle.cardValues[4]).toBeGreaterThan(0);
  expect(cardMiddle.cardValues[5]).toBeGreaterThan(0);
  await captureWithAndWithoutOverlay(page, testInfo, "finder-card-switch-middle");
  const cardEnd = await page.evaluate(() => window.finderDemo.seek(1.82));
  expect(cardEnd.cardValues[4]).toBe(0);
  expect(cardEnd.cardValues[5]).toBe(1);
});

test("Canvas 点击文件夹与卡片、返回、快速打断和分享重放", async ({ page }, testInfo) => {
  await ready(page);
  const start = await page.evaluate(() => window.finderDemo.snapshot());
  expect(start.scene.nodes).toHaveLength(10);
  await page.screenshot({ path: testInfo.outputPath("finder-initial.png") });
  await clickLogical(page, -340, -20);
  const opened = await page.evaluate(() => window.finderDemo.seek(0.42));
  expect(opened.model.folder).toBe(0);
  expect(opened.scene.nodes).toHaveLength(18);
  await page.screenshot({ path: testInfo.outputPath("finder-folder-open.png") });
  await clickLogical(page, -245, -120);
  const focused = await page.evaluate(() => window.finderDemo.seek(0.78));
  expect(focused.model.card).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("finder-card-focus.png") });
  await page.evaluate(() => window.finderDemo.send("back", 0, -1, 0.78, false));
  const partial = await page.evaluate(() => window.finderDemo.seek(0.88));
  const rect = partial.scene.nodes.find((node) => node.id === "card-0/0").content[1];
  await clickLogical(page, rect.x + rect.width / 2, rect.y + rect.height / 2);
  const reopened = await page.evaluate(() => window.finderDemo.seek(0.88));
  expect(reopened.events.at(-1).kind).toBe("card");
  expect(reopened.scene).toEqual(partial.scene);
  await page.evaluate(() => window.finderDemo.seek(1.24));
  await page.locator("#share").click();
  const shared = page.url();
  const before = await page.evaluate(() => window.finderDemo.snapshot());
  const pixels = await page.locator("canvas").evaluate((canvas) => canvas.toDataURL());
  await page.goto(shared);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  expect((await page.evaluate(() => window.finderDemo.snapshot())).scene).toEqual(before.scene);
  expect(await page.locator("canvas").evaluate((canvas) => canvas.toDataURL())).toBe(pixels);
});

test("固定预设日志可乱序采样；DPR 2 暂停 resize 不推进 Model", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    await page.evaluate(() => window.finderDemo.tour());
    const mid = await page.evaluate(() => window.finderDemo.seek(2.85));
    expect(mid.model.folder).toBe(3);
    await page.screenshot({ path: testInfo.outputPath("finder-tour-mid.png") });
    await page.evaluate(() => window.finderDemo.seek(0));
    const repeated = await page.evaluate(() => window.finderDemo.seek(2.85));
    expect(repeated.scene).toEqual(mid.scene);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    const after = await page.evaluate(() => window.finderDemo.snapshot());
    expect(after.time).toBe(mid.time);
    expect(after.model).toEqual(mid.model);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("finder-390-dpr2.png") });
  } finally {
    await context.close();
  }
});

test("文字使用 Canvas 实际字宽也始终留在缩放卡片内", async ({ page }, testInfo) => {
  await ready(page);
  await page.evaluate(() => window.finderDemo.tour());
  for (const time of [0.55, 0.75, 0.91, 2.85]) {
    const overflow = await page.evaluate((time) => {
      const nodes = window.finderDemo.seek(time).scene.nodes;
      const context = document.querySelector("canvas").getContext("2d");
      return nodes
        .filter((node) => /^card-\d+\/\d+$/.test(node.id))
        .flatMap((node) => {
          const rect = node.content[1];
          const label = nodes.find((item) => item.id === `${node.id}/label`).content[1];
          context.font = `${label.size}px monospace`;
          const width = context.measureText(label.text).width;
          return label.x < rect.x ||
            label.x + width > rect.x + rect.width ||
            label.y - label.size / 2 < rect.y ||
            label.y + label.size / 2 > rect.y + rect.height
            ? [{ id: node.id, time, rect, label, width }]
            : [];
        });
    }, time);
    expect(overflow).toEqual([]);
    if (time === 0.75) await page.screenshot({ path: testInfo.outputPath("finder-card-label-contained.png") });
  }
});

test("文件夹开合的中间帧不露出内部卡片", async ({ page }, testInfo) => {
  await ready(page);
  await page.evaluate(() => window.finderDemo.tour());
  for (const time of [0.08, 0.2, 0.34, 1.72, 1.88, 2.23, 2.38, 3.78]) {
    const overflow = await page.evaluate((time) => {
      const { scene, model } = window.finderDemo.seek(time);
      const folder = scene.nodes.find((node) => node.id === `folder-${model.folder}`)?.content[1];
      if (!folder) return [];
      return scene.nodes
        .filter((node) => node.id.startsWith(`card-${model.folder}/`) && !node.id.endsWith("/label"))
        .flatMap((node) => {
          const card = node.content[1];
          return card.x < folder.x - 1e-7 ||
            card.x + card.width > folder.x + folder.width + 1e-7 ||
            card.y < folder.y - 1e-7 ||
            card.y + card.height > folder.y + folder.height + 1e-7
            ? [{ id: node.id, time, folder, card }]
            : [];
        });
    }, time);
    expect(overflow).toEqual([]);
    if (time === 0.2 || time === 2.38)
      await page.screenshot({ path: testInfo.outputPath(`finder-folder-contained-${time}.png`) });
  }
});
