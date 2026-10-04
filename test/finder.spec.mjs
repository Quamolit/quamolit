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

async function checkCompactPixels(page) {
  const evidence = await page.evaluate(() => {
    const snapshot = window.finderDemo.snapshot(),
      canvas = document.querySelector("canvas");
    const cssWidth = canvas.clientWidth,
      cssHeight = canvas.clientHeight;
    const reference = document.createElement("canvas");
    reference.width = canvas.width;
    reference.height = canvas.height;
    const ctx = reference.getContext("2d");
    ctx.setTransform(
      snapshot.view.scale,
      0,
      0,
      snapshot.view.scale,
      canvas.width / 2,
      (Math.max(cssHeight, 600) / 2 - snapshot.scroll) * snapshot.view.scale,
    );
    const ew = cssWidth - 24,
      eh = Math.min(Math.max(cssHeight, 600) - 120, 600),
      base = (ew - 48) / 2;
    const color = (c) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${c.a})`;
    const geometry = (id) => {
      const card = id.startsWith("card-"),
        [folder, index] = id
          .replace(/^(folder-|card-)/, "")
          .split("/")
          .map(Number);
      const source = snapshot.scene.nodes.find((node) => node.id === id).content[1];
      const parent = snapshot.scene.nodes.find((node) => node.id === `folder-${folder}`).content[1];
      const f = (parent.width - 140) / 560,
        center = (folder * 124 - 248) * (1 - f);
      if (!card) {
        const width = 140 + (ew - 140) * f,
          height = 100 + (eh - 100) * f;
        return { x: -width / 2, y: center - height / 2, width, height };
      }
      const factor = Math.max(f, 0.0001),
        q = (source.width / factor - 150) / 540;
      const width = factor * (base + (ew - 32 - base) * q),
        height = factor * (88 + (eh - 112 - 88) * q);
      const x = factor * ((index % 2) * 2 - 1) * ((base + 16) / 2) * (1 - q);
      const y = center + factor * ((Math.floor(index / 2) * 120 - 128) * (1 - q) + 28 * q);
      return { x: x - width / 2, y: y - height / 2, width, height };
    };
    for (const node of snapshot.scene.nodes) {
      const source = node.content[1],
        label = node.content[0] === "text",
        id = node.id.replace(/\/label$/, "");
      const body = geometry(id);
      ctx.fillStyle = color(source.fill);
      if (!label) ctx.fillRect(body.x, body.y, body.width, body.height);
      else {
        const folder = id.startsWith("folder-"),
          ratio = body.width / base;
        ctx.font = `${folder ? source.size : 18 * ratio}px monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.direction = "ltr";
        ctx.fillText(
          source.text,
          body.x + (folder ? 14 : 12 * ratio),
          folder ? body.y + 35 : body.y + body.height / 2 + 6 * ratio,
        );
      }
    }
    const actual = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    const expected = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const shifted = document.createElement("canvas");
    shifted.width = canvas.width;
    shifted.height = canvas.height;
    shifted.getContext("2d").drawImage(reference, 1, 0);
    const wrong = shifted.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let differences = 0,
      shiftedDifferences = 0;
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) differences++;
      if (actual[i] !== wrong[i]) shiftedDifferences++;
    }
    return { differences, shiftedDifferences };
  });
  expect(evidence.differences).toBe(0);
  expect(evidence.shiftedDifferences).toBeGreaterThan(0);
}

for (const dpr of [1, 2])
  test(`窄屏 DPR ${dpr}：五组18张卡片真实触摸、独立中间帧与暂停resize`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: dpr,
      hasTouch: true,
    });
    const page = await context.newPage();
    try {
      for (let folder = 0; folder < 5; folder++) {
        await ready(page, "?t=0");
        await checkCompactPixels(page);
        await page.touchscreen.tap(195, 422 + folder * 124 - 248);
        await page.evaluate(() => window.finderDemo.pause());
        const middle = await page.evaluate(() => window.finderDemo.seek(0.21));
        expect(middle.model.folder).toBe(folder);
        await checkCompactPixels(page);
        let time = 0.42;
        const open = await page.evaluate((t) => window.finderDemo.seek(t), time);
        await checkCompactPixels(page);
        for (const node of open.presentation.nodes.filter(
          (node) => node.id.startsWith(`card-${folder}/`) && !node.id.endsWith("/label"),
        )) {
          expect(node.content[1].width).toBeGreaterThanOrEqual(44);
          expect(node.content[1].height).toBeGreaterThanOrEqual(44);
          const label = open.presentation.nodes.find((item) => item.id === `${node.id}/label`).content[1];
          expect(label.size).toBeGreaterThanOrEqual(18);
        }
        const count = open.presentation.nodes.filter(
          (node) => node.id.startsWith(`card-${folder}/`) && !node.id.endsWith("/label"),
        ).length;
        for (let card = 0; card < count; card++) {
          await page.touchscreen.tap(
            195 + (((card % 2) * 2 - 1) * ((390 - 72) / 2 + 16)) / 2,
            422 + Math.floor(card / 2) * 120 - 128,
          );
          await page.evaluate(() => window.finderDemo.pause());
          expect((await page.evaluate(() => window.finderDemo.snapshot())).model.card).toBe(card);
          await page.evaluate((t) => window.finderDemo.seek(t), time + 0.18);
          await checkCompactPixels(page);
          time += 0.42;
          await page.evaluate((t) => window.finderDemo.seek(t), time);
          await checkCompactPixels(page);
          if (card === 0) await page.screenshot({ path: testInfo.outputPath(`folder-${folder}-focus-dpr${dpr}.png`) });
          await page.touchscreen.tap(8, 836);
          await page.evaluate(() => window.finderDemo.pause());
          time += 0.42;
          await page.evaluate((t) => window.finderDemo.seek(t), time);
        }
        const before = await page.evaluate(() => window.finderDemo.snapshot());
        await page.setViewportSize({ width: 320, height: 640 });
        await expect.poll(() => page.evaluate(() => window.finderDemo.snapshot().width)).toBe(320 * dpr);
        const resized = await page.evaluate(() => window.finderDemo.snapshot());
        expect(resized.model).toEqual(before.model);
        expect(resized.time).toBe(before.time);
        await checkCompactPixels(page);
        await page.locator("#panel-toggle").click();
        await expect(page.locator("#panel")).toBeVisible();
        await page.locator("#panel-toggle").click();
        await expect(page.locator("#panel")).toBeHidden();
        expect((await page.evaluate(() => window.finderDemo.snapshot())).model).toEqual(before.model);
        await page.setViewportSize({ width: 390, height: 844 });
      }
    } finally {
      await context.close();
    }
  });
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

for (const dpr of [1, 2])
  test(`短视口 DPR ${dpr}：视窗、滚轮与五组全部卡片可达，滚动不改意图`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 390 },
      deviceScaleFactor: dpr,
      hasTouch: true,
    });
    const page = await context.newPage();
    try {
      for (let folder = 0; folder < 5; folder++) {
        await ready(page, "?t=0");
        const initial = await page.evaluate(() => window.finderDemo.snapshot());
        expect(initial.scrollLimit).toBe(210);
        expect(initial.view.y).toBe(300 * dpr);
        await page.locator("#panel-toggle").click();
        await expect(page.locator("#finder-viewport")).toBeVisible();
        await page.locator("#finder-scroll").press("End");
        await expect.poll(() => page.evaluate(() => window.finderDemo.snapshot().scroll)).toBe(210);
        await page.locator("#panel-toggle").click();
        await page.mouse.move(195, 220);
        await page.mouse.wheel(0, -1000);
        await expect.poll(() => page.evaluate(() => window.finderDemo.snapshot().scroll)).toBe(0);
        const position = Math.max(0, Math.min(52 + folder * 124 - 200, 210));
        const scrolled = await page.evaluate((value) => window.finderDemo.setScroll(value), position);
        expect(scrolled.model).toEqual(initial.model);
        expect(scrolled.events).toEqual(initial.events);
        expect(scrolled.time).toBe(initial.time);
        await checkCompactPixels(page);
        const failure = await page.evaluate(() => {
          const before = window.finderDemo.snapshot();
          let rejected = 0;
          for (const value of [NaN, Infinity, -Infinity])
            try {
              window.finderDemo.setScroll(value);
            } catch {
              rejected++;
            }
          return { before, after: window.finderDemo.snapshot(), rejected };
        });
        expect(failure.rejected).toBe(3);
        expect(failure.after).toEqual(failure.before);
        await page.touchscreen.tap(195, 52 + folder * 124 - position);
        await page.evaluate(() => window.finderDemo.pause());
        let time = 0.42;
        const opened = await page.evaluate((value) => window.finderDemo.seek(value), time);
        expect(opened.model.folder).toBe(folder);
        const count = opened.presentation.nodes.filter(
          (node) => node.id.startsWith(`card-${folder}/`) && !node.id.endsWith("/label"),
        ).length;
        for (let card = 0; card < count; card++) {
          const scroll = Math.max(0, Math.min(172 + Math.floor(card / 2) * 120 - 200, 210));
          const before = await page.evaluate(() => window.finderDemo.snapshot());
          const after = await page.evaluate((value) => window.finderDemo.setScroll(value), scroll);
          expect(after.model).toEqual(before.model);
          expect(after.time).toBe(before.time);
          expect(after.events).toEqual(before.events);
          await page.touchscreen.tap(195 + ((card % 2) * 2 - 1) * 87.5, 172 + Math.floor(card / 2) * 120 - scroll);
          await page.evaluate(() => window.finderDemo.pause());
          expect((await page.evaluate(() => window.finderDemo.snapshot())).model.card).toBe(card);
          time += 0.42;
          await page.evaluate((value) => window.finderDemo.seek(value), time);
          await checkCompactPixels(page);
          if (folder === 3 && card === 4)
            await page.screenshot({ path: testInfo.outputPath(`finder-short-last-dpr${dpr}.png`) });
          await page.touchscreen.tap(8, 380);
          await page.evaluate(() => window.finderDemo.pause());
          time += 0.42;
          await page.evaluate((value) => window.finderDemo.seek(value), time);
        }
        const paused = await page.evaluate(() => window.finderDemo.snapshot());
        await page.setViewportSize({ width: 390, height: 844 });
        await expect.poll(() => page.evaluate(() => window.finderDemo.snapshot().scrollLimit)).toBe(0);
        await expect(page.locator("#finder-viewport")).toBeHidden();
        const taller = await page.evaluate(() => window.finderDemo.snapshot());
        expect(taller.scroll).toBe(0);
        expect(taller.model).toEqual(paused.model);
        expect(taller.time).toBe(paused.time);
        await page.setViewportSize({ width: 390, height: 390 });
      }
    } finally {
      await context.close();
    }
  });

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
