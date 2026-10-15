import { expect, test } from "@playwright/test";

async function ready(page) {
  await page.goto("http://127.0.0.1:5180/examples/drag-demo/index.html");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}
async function logicalPoint(page, x, y) {
  return page.evaluate(
    ({ x, y }) => {
      const state = window.dragDemo.snapshot(),
        bounds = document.querySelector("canvas").getBoundingClientRect();
      return {
        x: bounds.left + ((state.view.x + x * state.view.scale) * bounds.width) / state.width,
        y: bounds.top + ((state.view.y + y * state.view.scale) * bounds.height) / state.height,
      };
    },
    { x, y },
  );
}

for (const dpr of [1, 2]) {
  test(`静止鼠标的视图提交重算hover，capture与取消独立 DPR${dpr}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    try {
      await ready(page);
      const point = await logicalPoint(page, -45, -25);
      await page.mouse.move(point.x, point.y);
      const before = await page.evaluate(() => {
        window.hoverInputs = 0;
        const canvas = document.querySelector("canvas");
        for (const type of ["pointermove", "pointerdown", "pointerup", "pointercancel"])
          canvas.addEventListener(type, () => {
            window.hoverInputs++;
          });
        return window.dragDemo.snapshot();
      });
      expect(before.pointerState["hover-node"]).toBe("drag-rect");
      const resize = (width, height) =>
        page.evaluate(
          ({ width, height }) => {
            const canvas = document.querySelector("canvas");
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            window.hoverInputs = 0;
            window.dragDemo.draw();
            return {
              state: window.dragDemo.snapshot(),
              inputs: window.hoverInputs,
              native: canvas.hasPointerCapture(1),
            };
          },
          { width, height },
        );
      const moved = await resize(1440, 1000);
      expect(moved.inputs).toBe(0);
      expect(moved.state.pointerState["hover-node"]).toBe("");
      expect(moved.state.model).toEqual(before.model);
      expect(moved.state.width).toBe(1440 * dpr);
      const covered = await resize(1280, 900);
      expect(covered.inputs).toBe(0);
      expect(covered.state.pointerState["hover-node"]).toBe("drag-rect");
      const translated = await page.evaluate(() => {
        document.querySelector("canvas").style.transform = "translate(100px,80px)";
        window.hoverInputs = 0;
        window.dragDemo.draw();
        return { state: window.dragDemo.snapshot(), inputs: window.hoverInputs };
      });
      expect(translated.inputs).toBe(0);
      expect(translated.state.pointerState["hover-node"]).toBe("");
      expect(translated.state.model).toEqual(before.model);
      const untranslated = await page.evaluate(() => {
        document.querySelector("canvas").style.transform = "";
        window.hoverInputs = 0;
        window.dragDemo.draw();
        return { state: window.dragDemo.snapshot(), inputs: window.hoverInputs };
      });
      expect(untranslated.inputs).toBe(0);
      expect(untranslated.state.pointerState["hover-node"]).toBe("drag-rect");
      await page.mouse.down();
      const captured = await resize(1440, 1000);
      expect(captured.inputs).toBe(0);
      expect(captured.state.captured).toBe(1);
      expect(captured.native).toBe(true);
      expect(captured.state.pointerState["hover-node"]).toBe("");
      const cancelled = await page.evaluate(() => {
        const canvas = document.querySelector("canvas");
        canvas.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1, bubbles: true }));
        window.dragDemo.draw();
        return { state: window.dragDemo.snapshot(), native: canvas.hasPointerCapture(1) };
      });
      expect(cancelled.state.captured).toBeNull();
      expect(cancelled.native).toBe(false);
      expect(cancelled.state.pointerState["hover-node"]).toBe("");
      expect((await resize(1280, 900)).state.pointerState["hover-node"]).toBe("");
      await page.mouse.up();
      await page.mouse.move(point.x, point.y);
      expect((await page.evaluate(() => window.dragDemo.snapshot())).pointerState["hover-node"]).toBe("drag-rect");
      const blurred = await page.evaluate(() => {
        window.dispatchEvent(new Event("blur"));
        window.dragDemo.draw();
        return window.dragDemo.snapshot();
      });
      expect(blurred.pointerState["hover-node"]).toBe("");
      expect((await resize(1280, 900)).state.pointerState["hover-node"]).toBe("");
      await page.mouse.move(point.x, point.y);
      await page.mouse.move(-10, -10);
      expect(
        (
          await page.evaluate(() => {
            window.dragDemo.draw();
            return window.dragDemo.snapshot();
          })
        ).pointerState["hover-node"],
      ).toBe("");
      const disposed = await page.evaluate(({ x, y }) => {
        const api = window.dragDemo,
          canvas = document.querySelector("canvas");
        api.dispose();
        api.dispose();
        canvas.dispatchEvent(new PointerEvent("pointerenter", { pointerId: 1, clientX: x, clientY: y }));
        canvas.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: x, clientY: y }));
        return api.snapshot();
      }, point);
      expect(disposed.pointerState["hover-node"]).toBe("");
      expect(disposed.captured).toBeNull();
    } finally {
      await context.close();
    }
  });
}

test("真实指针跨矩形边界拖动、滑块夹取和捕获释放", async ({ page }, testInfo) => {
  await ready(page);
  const start = await page.evaluate(() => window.dragDemo.snapshot());
  expect(start.scene.nodes).toHaveLength(4);
  await page.screenshot({ path: testInfo.outputPath("drag-initial.png") });
  const down = await logicalPoint(page, 10, 5);
  await page.mouse.move(down.x, down.y);
  await page.mouse.down();
  expect((await page.evaluate(() => window.dragDemo.snapshot())).captured).toBe(1);
  const mid = await logicalPoint(page, 160, 95);
  await page.mouse.move(mid.x, mid.y);
  const dragged = await page.evaluate(() => window.dragDemo.snapshot());
  expect(dragged.model.x).toBeCloseTo(150, 3);
  expect(dragged.model.y).toBeCloseTo(90, 3);
  await page.screenshot({ path: testInfo.outputPath("drag-middle.png") });
  const far = await logicalPoint(page, 300, 180);
  await page.mouse.move(far.x, far.y);
  await page.mouse.up();
  const released = await page.evaluate(() => window.dragDemo.snapshot());
  expect(released.model.pointer).toBe(-1);
  expect(released.captured).toBeNull();
  expect(released.model.x).toBeCloseTo(290, 3);
  await page.screenshot({ path: testInfo.outputPath("drag-released.png") });
  const slider = await logicalPoint(page, 100, 40),
    max = await logicalPoint(page, 350, 40);
  await page.mouse.move(slider.x, slider.y);
  await page.mouse.down();
  await page.mouse.move(max.x, max.y);
  await page.mouse.up();
  expect((await page.evaluate(() => window.dragDemo.snapshot())).model.value).toBe(40);
  await page.screenshot({ path: testInfo.outputPath("slider-max.png") });
  const paints = (await page.evaluate(() => window.dragDemo.snapshot())).paints;
  await page.waitForTimeout(300);
  expect((await page.evaluate(() => window.dragDemo.snapshot())).paints).toBe(paints);
});

test("取消捕获、DPR 2 暂停 resize 与浮层不误触", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page);
    const down = await logicalPoint(page, 0, 0);
    await page.mouse.move(down.x, down.y);
    await page.mouse.down();
    await page.evaluate(() =>
      document
        .querySelector("canvas")
        .dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1, bubbles: true })),
    );
    expect((await page.evaluate(() => window.dragDemo.snapshot())).captured).toBeNull();
    await page.mouse.up();
    const before = await page.evaluate(() => window.dragDemo.preset());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    expect((await page.evaluate(() => window.dragDemo.snapshot())).model).toEqual(before.model);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("drag-mobile-dpr2.png") });
  } finally {
    await context.close();
  }
});

test("实际 demo 卸载会释放捕获并移除指针监听器", async ({ page }) => {
  await ready(page);
  const down = await logicalPoint(page, 0, 0);
  await page.mouse.move(down.x, down.y);
  await page.mouse.down();
  expect((await page.evaluate(() => window.dragDemo.snapshot())).captured).toBe(1);
  const disposed = await page.evaluate(() => {
    const api = window.dragDemo;
    api.dispose();
    const canvas = document.querySelector("canvas"),
      before = api.snapshot();
    canvas.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 900, clientY: 700, bubbles: true }));
    return {
      before,
      after: api.snapshot(),
      apiRemoved: window.dragDemo === undefined,
      nativeCapture: canvas.hasPointerCapture(1),
    };
  });
  expect(disposed.apiRemoved).toBe(true);
  expect(disposed.nativeCapture).toBe(false);
  expect(disposed.before.captured).toBeNull();
  expect(disposed.after.model).toEqual(disposed.before.model);
  await page.mouse.up();
});

for (const dpr of [1, 2]) {
  test(`真实应用提交禁用/resize即时释放，恢复与重置不继承旧捕获 DPR${dpr}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    try {
      await ready(page);
      let down = await logicalPoint(page, 0, 0);
      await page.mouse.move(down.x, down.y);
      await page.mouse.down();
      expect((await page.evaluate(() => window.dragDemo.snapshot())).captured).toBe(1);
      const committed = await page.evaluate(() => {
        const canvas = document.querySelector("canvas"),
          release = canvas.releasePointerCapture.bind(canvas);
        let releases = 0;
        canvas.releasePointerCapture = (id) => {
          releases++;
          release(id);
        };
        canvas.style.width = "calc(100vw - 10px)";
        const first = window.dragDemo.setInteraction(false);
        window.dragDemo.setInteraction(false);
        return { first, releases, native: canvas.hasPointerCapture(1) };
      });
      expect(committed.first.captured).toBeNull();
      expect(committed.first.model.pointer).toBe(-1);
      expect(committed.native).toBe(false);
      expect(committed.releases).toBe(1);
      const disabled = committed.first.model;
      await page.mouse.move(down.x + 60, down.y + 30);
      await page.mouse.up();
      expect((await page.evaluate(() => window.dragDemo.snapshot())).model).toEqual(disabled);
      await page.locator("#interaction").click();
      expect((await page.evaluate(() => window.dragDemo.snapshot())).captured).toBeNull();
      down = await logicalPoint(page, 0, 0);
      await page.mouse.move(down.x, down.y);
      await page.mouse.down();
      expect((await page.evaluate(() => window.dragDemo.snapshot())).captured).toBe(1);
      const reset = await page.evaluate(() => {
        const state = window.dragDemo.reset();
        return { state, native: document.querySelector("canvas").hasPointerCapture(1) };
      });
      expect(reset.state.captured).toBeNull();
      expect(reset.state.model.pointer).toBe(-1);
      expect(reset.native).toBe(false);
      await page.mouse.up();
      const paints = (await page.evaluate(() => window.dragDemo.snapshot())).paints;
      await page.waitForTimeout(2100);
      expect((await page.evaluate(() => window.dragDemo.snapshot())).paints).toBe(paints);
    } finally {
      await context.close();
    }
  });
}
