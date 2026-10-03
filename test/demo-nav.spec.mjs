import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const catalog = JSON.parse(await readFile(new URL("../demos/catalog.json", import.meta.url), "utf8"));
const artifactURL = `http://127.0.0.1:${process.env.QUAMOLIT_DEMO_TEST_PORT || 5190}/preview/`;

for (const [entry, dpr] of [
  ["index.html", 1],
  ["", 2],
])
  test(`普通发布根入口 ${entry || "/"}：DPR ${dpr} 保留分享参数并实际编辑 TodoList`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    try {
      const query = "?demo=todolist&t=0.8&seed=17#shared";
      await page.goto(`${artifactURL}${entry}${query}`);
      await expect(page).toHaveURL(`${artifactURL}demos/index.html${query}`);
      await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
      await expect(page.locator("canvas")).toHaveCount(1);
      expect((await page.evaluate(() => window.todoDemo.snapshot())).time).toBe(0.8);
      await page.evaluate(() => {
        window.rootSharedCanvas = document.querySelector("#scene");
        window.rootTodoApi = window.todoDemo;
      });
      await page.locator("#draft").fill("从普通发布入口新增");
      await page.locator("#submit").click();
      await page.evaluate(() => window.todoDemo.pause());
      expect((await page.evaluate(() => window.todoDemo.snapshot())).model.rows[0].text).toBe("从普通发布入口新增");
      await page.evaluate(() => window.todoDemo.seek(2));
      await page.screenshot({ path: testInfo.outputPath(`root-todolist-dpr${dpr}.png`) });
      await page.getByRole("button", { name: /所有演示/ }).click();
      await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
      expect(await page.evaluate(() => document.querySelector("#scene") === window.rootSharedCanvas)).toBe(true);
      expect(await page.evaluate(() => window.rootTodoApi.snapshot().disposed)).toBe(true);
      expect(await page.evaluate(() => "todoDemo" in window)).toBe(false);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });

for (const [demo, api, input, time, end] of [
  ["tidal-bloom", "metricFlowDemo", "#view-analytics", 1.4],
  ["signal-weave", "signalWeaveDemo", "#mode-campaign", 1.2],
  ["cohort-pulse", "cohortPulseDemo", "#filter-risk", 0.9],
  ["binary-tree", "treeDemo", "#play", 1, 60],
  ["curve", "curveDemo", "#play", 1, 120],
  ["solar", "solarDemo", "#play", 1, 120],
  ["clock", "clockDemo", "#play", 1, 120],
  ["raining", "rainingDemo", "#play", 75, 900],
  ["finder", "finderDemo", "#tour", 1, 10],
  ["icons", "iconsDemo", "#increase", 1, 120],
  ["layered-dashboard", "layeredDashboardDemo", "#play", 0.5, 1],
  ["layer-composition", "layerCompositionDemo", "#play", 0.5, 1],
]) {
  test(`${demo}：共享调度的空闲、输入/尺寸与 DPR 通知唤醒、卸载取消`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`demos/index.html?demo=${demo}&t=${time}&tick=${time}`);
    await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
    const snapshot = () => page.evaluate((name) => window[name].snapshot(), api);
    if (end !== undefined) {
      await page.evaluate(
        ({ api, end, demo }) => {
          window[api].seek(end - (demo === "raining" ? 1 : 0.04));
          window[api].play();
        },
        { api, end, demo },
      );
      await expect.poll(async () => (await snapshot()).playing).toBe(false);
      const finished = await snapshot();
      expect(finished.time ?? finished.tick).toBe(end);
    }
    await expect.poll(async () => (await snapshot()).pending).toBe(false);
    const idle = await snapshot();
    await page.waitForTimeout(2100);
    expect((await snapshot()).paints).toBe(idle.paints);
    await page.locator(input).click();
    await expect.poll(async () => (await snapshot()).paints).toBeGreaterThan(idle.paints);
    await page.evaluate((name) => window[name].pause(), api);
    const paused = await snapshot();
    expect(paused.pending).toBe(false);
    await page.setViewportSize({ width: 1000, height: 760 });
    await expect.poll(async () => (await snapshot()).width).toBe(1000);
    expect((await snapshot()).time ?? (await snapshot()).tick).toBe(paused.time ?? paused.tick);
    const resized = await snapshot();
    const session = await page.context().newCDPSession(page);
    // 同时改变 CSS 尺寸，验证真实 ResizeObserver 通知；无通知的 DPR-only 更新另记 #50。
    await session.send("Emulation.setDeviceMetricsOverride", {
      width: 1001,
      height: 760,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await expect.poll(async () => (await snapshot()).width).toBe(2002);
    expect((await snapshot()).time ?? (await snapshot()).tick).toBe(paused.time ?? paused.tick);
    expect((await snapshot()).paints).toBeGreaterThan(resized.paints);
    await page.evaluate((name) => {
      window.disposedChartApi = window[name];
      window[name].play();
    }, api);
    await page.getByRole("button", { name: /所有演示/ }).click();
    await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
    expect(await page.evaluate((name) => name in window, api)).toBe(false);
    const disposed = await page.evaluate(() => window.disposedChartApi.snapshot());
    expect(disposed.pending).toBe(false);
    expect(disposed.playing).toBe(false);
    await page.waitForTimeout(200);
    expect((await page.evaluate(() => window.disposedChartApi.snapshot())).paints).toBe(disposed.paints);
    expect(errors).toEqual([]);
  });
}

test("分层 GPU 初始化等待期间离开，迟到 adapter 不再创建设备或复活画布", async ({ page }) => {
  await page.addInitScript(() => {
    window.layerCreatedDevices = 0;
    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value: {
        requestAdapter: () =>
          new Promise((resolve) => {
            window.layerResolveAdapter = () =>
              resolve({
                requestDevice() {
                  window.layerCreatedDevices++;
                  throw new Error("closed-layer-created-device");
                },
              });
          }),
      },
    });
  });
  await page.goto("demos/index.html?demo=layer-composition&t=0.5&backend=webgpu");
  await page.waitForFunction(() => window.layerResolveAdapter);
  await page.getByRole("button", { name: /所有演示/ }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
  await page.evaluate(() => window.layerResolveAdapter());
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.layerCreatedDevices)).toBe(0);
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(await page.evaluate(() => "layerCompositionDemo" in window)).toBe(false);
});

test("分层示例在统一页面切换，卸载底层 Canvas 并保留共享 UI Canvas", async ({ page }) => {
  await page.goto("demos/index.html?demo=layer-composition&t=0.5");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await expect(page.locator("canvas")).toHaveCount(2);
  await page.evaluate(() => {
    window.layerSharedCanvas = document.querySelector("#scene");
    window.layerDisposedApi = window.layerCompositionDemo;
  });
  expect((await page.evaluate(() => window.layerCompositionDemo.snapshot())).time).toBe(0.5);
  await page.getByRole("button", { name: /所有演示/ }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(await page.evaluate(() => document.querySelector("#scene") === window.layerSharedCanvas)).toBe(true);
  expect(await page.evaluate(() => "layerCompositionDemo" in window)).toBe(false);
  expect(await page.evaluate(() => window.layerDisposedApi.snapshot().sourceLive)).toBe(0);
  const before = await page.evaluate(() => window.layerDisposedApi.snapshot().time);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.layerDisposedApi.snapshot().time)).toBe(before);
  await page.getByLabel("分类", { exact: true }).selectOption("gpu");
  await page.locator('a[data-demo-id="layer-composition"]').click();
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await expect(page.locator("canvas")).toHaveCount(2);
  expect(await page.evaluate(() => document.querySelector("#scene") === window.layerSharedCanvas)).toBe(true);
});

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

test("恢复清单与艺术作品分类均可打开", async ({ page }) => {
  await page.goto("demos/index.html?group=originals");
  await expect(page.locator("[data-planned]")).toHaveCount(0);
  await expect(page.locator("a[data-demo]")).toHaveCount(catalog.entries.filter((e) => e.group === "originals").length);
  await page.getByLabel("查找演示").fill("折扇");
  await expect(page.locator('a[data-demo="examples/folding-fan/index.html"]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('a[data-demo="examples/folding-fan/index.html"]')).toBeVisible();
  await page.getByLabel("查找演示").fill("");
  await page.getByLabel("分类", { exact: true }).selectOption("art");
  await expect(page.locator('a[data-demo="examples/tidal-bloom/index.html"]')).toBeVisible();
  await expect(page.locator('a[data-demo="examples/tidal-bloom/index.html"]')).toHaveAttribute(
    "aria-label",
    /Metric Flow/,
  );
  await expect(page.locator('a[data-demo="examples/signal-weave/index.html"]')).toHaveAttribute(
    "aria-label",
    /Signal Weave/,
  );
  await expect(page.locator('a[data-demo="examples/cohort-pulse/index.html"]')).toHaveAttribute(
    "aria-label",
    /Cohort Pulse/,
  );
  await expect(page.locator("#art .reserved")).toHaveCount(0);
  await expect(page.locator("#empty")).toBeHidden();
});

for (const dpr of [1, 2])
  test(`全屏消费者：DPR ${dpr}、暂停 resize 与浮层`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    try {
      await page.goto(`${artifactURL}examples/retained-consumer/index.html`);
      await page.waitForFunction(() => window.consumer?.snapshot().browser);
      await page.evaluate(() => window.consumer.set({ time: 0.5 }));
      const before = await page.evaluate(() => window.consumer.snapshot());
      for (const size of [
        { width: 1280, height: 900 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(size);
        await expect
          .poll(() => page.locator("canvas").evaluate((c) => [c.width, c.height]))
          .toEqual([size.width * dpr, size.height * dpr]);
        expect(await page.locator("canvas").boundingBox()).toEqual({ x: 0, y: 0, ...size });
        expect(await page.evaluate(() => window.consumer.snapshot())).toEqual(before);
        await page.locator("#panel-toggle").click();
        await expect(page.locator("#panel")).toBeHidden();
        // 未被实际浮层覆盖的区域直接落在 canvas，不存在透明全屏遮罩。
        expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
          "CANVAS",
        );
        const pixel = await page.locator("canvas").evaluate((c) => {
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
    } finally {
      await context.close();
    }
  });

for (const entry of catalog.entries) {
  test(`发布产物导航往返：${entry.title}`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => errors.push(`${request.url()} ${request.failure()?.errorText}`));
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    // 这个门禁验证入口与完整 Canvas 回退，不把 CI 软件 GPU 当作硬件验收。
    await page.addInitScript(() => Object.defineProperty(navigator, "gpu", { value: undefined, configurable: true }));
    await page.goto("demos/index.html");
    const inlineEntry = ["originals", "art"].includes(entry.group) || entry.id === "layer-composition";
    if (inlineEntry)
      await page.evaluate(() => {
        window.__shellIdentity = crypto.randomUUID();
      });
    await page.locator(`a[data-demo="${entry.path}"]`).click();
    if (inlineEntry) {
      await expect(page).toHaveURL(new RegExp(`/preview/demos/index\\.html\\?demo=${entry.id}$`));
      await expect(page.locator("#app")).toHaveAttribute("data-view", "demo");
      expect(await page.evaluate(() => window.__shellIdentity)).toBeTruthy();
      await expect(page.locator("#scene")).toHaveCount(1);
    } else if (entry.path === "index.html") {
      await expect(page).toHaveURL(/\/preview\/demos\/index\.html$/);
      await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
    } else {
      await expect(page).toHaveURL(new RegExp(`/preview/${entry.path.replaceAll(".", "\\.")}$`));
    }
    if (entry.path === "examples/retained-consumer/index.html") {
      await page.waitForFunction(() => window.consumer?.snapshot().browser);
    } else if (entry.path === "test/m0/index.html") {
      await expect(page.locator("#status")).toHaveAttribute("data-result", "ready");
    } else if (!["index.html", "test/m0/bench.html"].includes(entry.path)) {
      await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
    }
    await expect(page.locator("canvas").first()).toBeAttached();
    expect(errors).toEqual([]);
    await testInfo.attach("entry", {
      body: JSON.stringify(
        {
          ...entry,
          url: page.url(),
          browser: page.context().browser().version(),
          gpu: "forced-unavailable; fallback only",
          errors,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
    if (inlineEntry) {
      await page
        .getByRole("navigation", { name: "演示导航" })
        .getByRole("button", { name: /所有演示/ })
        .click();
      await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
      expect(await page.evaluate(() => window.__shellIdentity)).toBeTruthy();
    } else if (entry.path !== "index.html") {
      await page.getByRole("navigation", { name: "演示导航" }).getByRole("link").click();
    }
    await page.getByLabel("分类", { exact: true }).selectOption("");
    await expect(page.locator("a[data-demo]")).toHaveCount(catalog.entries.length);
    expect(errors).toEqual([]);
  });
}

test("统一页面支持前后切换、历史记录和浮层卸载", async ({ page }) => {
  await page.goto("demos/index.html?demo=curve&t=30");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await expect(page.locator("#app")).toHaveAttribute("data-view", "demo");
  expect(await page.evaluate(() => window.curveDemo.snapshot().time)).toBe(30);
  await page.getByRole("button", { name: "下一个演示" }).click();
  await expect(page.locator("#demo-title")).toContainText("Solar");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  expect(
    await page.evaluate(() => ({
      old: "curveDemo" in window,
      next: "solarDemo" in window,
      canvases: document.querySelectorAll("canvas").length,
    })),
  ).toEqual({ old: false, next: true, canvases: 1 });
  await page.goBack();
  await expect(page.locator("#demo-title")).toContainText("Curve");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await page.getByRole("button", { name: /所有演示/ }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
  expect(await page.evaluate(() => "curveDemo" in window)).toBe(false);
});

for (const dpr of [1, 2])
  test(`统一静态页面 DPR${dpr}：捕获卸载与迟到字体不污染同名新挂载`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: dpr,
      reducedMotion: "reduce",
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${artifactURL}demos/index.html?demo=layered-dashboard&t=1`);
      await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
      await page.evaluate(() => {
        window.oldDashboardApi = window.layeredDashboardDemo;
        window.dashboardStage = document.querySelector("#scene");
        window.dashboardNativeBefore = document.fonts.size;
        window.dashboardOriginalFont = FontFace;
        const gate = new Promise((resolve) => {
          window.releaseOldDashboardFont = resolve;
        });
        window.FontFace = class extends window.dashboardOriginalFont {
          load() {
            return super.load().then((face) => gate.then(() => face));
          }
        };
        window.oldDashboardFontPending = window.oldDashboardApi.enableFont();
        window.dashboardCaptureCounts = { set: 0, release: 0 };
        for (const [method, key] of [
          ["setPointerCapture", "set"],
          ["releasePointerCapture", "release"],
        ]) {
          const original = window.dashboardStage[method].bind(window.dashboardStage);
          window.dashboardStage[method] = (id) => {
            window.dashboardCaptureCounts[key]++;
            return original(id);
          };
        }
      });
      const point = await page.locator("#scene").evaluate((canvas) => {
        const bounds = canvas.getBoundingClientRect();
        return {
          x: bounds.left + ((canvas.width / 2 - 208) * bounds.width) / canvas.width,
          y: bounds.top + ((canvas.height / 2 + 140) * bounds.height) / canvas.height,
        };
      });
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      expect((await page.evaluate(() => window.oldDashboardApi.snapshot())).captured).not.toBeNull();
      // 只激活已有导航按钮，不生成pointerup，验证卸载本身释放capture。
      await page.getByRole("button", { name: /所有演示/ }).evaluate((button) => button.click());
      await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
      const closed = await page.evaluate(() => {
        window.FontFace = window.dashboardOriginalFont;
        return { state: window.oldDashboardApi.snapshot(), counts: window.dashboardCaptureCounts };
      });
      expect(closed.state.fonts["closed?"]).toBe(true);
      expect(closed.state.captured).toBeNull();
      expect(closed.state.pending).toBe(false);
      expect(closed.counts).toEqual({ set: 1, release: 1 });
      await page.mouse.up();
      await page.locator('a[data-demo="examples/layered-dashboard/index.html"]').click();
      await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
      await page.evaluate(async () => {
        window.layeredDashboardDemo.seek(1);
        await window.layeredDashboardDemo.enableFont();
        // 新挂载的ResizeObserver/DPR通知先结算；随后才观察旧完成是否意外重绘。
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      await expect.poll(() => page.evaluate(() => window.layeredDashboardDemo.snapshot().pending)).toBe(false);
      const ready = await page.evaluate(() => {
        return { state: window.layeredDashboardDemo.snapshot(), size: document.fonts.size };
      });
      expect(ready.state.fonts.host.accepted).toBe(1);
      expect(ready.state.fonts.host.handles[0]["installed?"]).toBe(true);
      const late = await page.evaluate(async () => {
        window.releaseOldDashboardFont();
        await window.oldDashboardFontPending;
        return {
          old: window.oldDashboardApi.snapshot(),
          next: window.layeredDashboardDemo.snapshot(),
          size: document.fonts.size,
          baseline: window.dashboardNativeBefore,
          sameCanvas: window.dashboardStage === document.querySelector("#scene"),
        };
      });
      expect(late.sameCanvas).toBe(true);
      expect(late.old.paints).toBe(closed.state.paints);
      expect(late.old.fonts.queue.running).toEqual([]);
      expect(late.old.fonts.host.accepted).toBe(0);
      expect(late.old.fonts.host.handles).toEqual([]);
      expect(late.next).toEqual(ready.state);
      expect(late.size).toBe(ready.size);
      expect(late.size).toBe(late.baseline + 1);
      await page.getByRole("button", { name: /所有演示/ }).click();
      await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
      expect(await page.evaluate(() => document.fonts.size)).toBe(late.baseline);
      expect(await page.evaluate(() => "layeredDashboardDemo" in window)).toBe(false);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });

test("Metric Flow 在统一画布内可交互反向切换且离开后卸载时钟", async ({ page }) => {
  await page.goto("demos/index.html?demo=tidal-bloom");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await page.locator("#view-overview").click();
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().position)).toBe(0);
  await page.locator("#view-analytics").click();
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().position)).toBeGreaterThan(0);
  await page.locator("#series-revenue").click();
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().seriesPosition)).toBeGreaterThan(0);
  await page.locator("#series-visitors").click();
  expect((await page.evaluate(() => window.metricFlowDemo.snapshot())).seriesEventCount).toBe(2);
  await page.getByRole("button", { name: /所有演示/ }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
  expect(
    await page.evaluate(() => ({
      api: "metricFlowDemo" in window,
      canvases: document.querySelectorAll("canvas").length,
    })),
  ).toEqual({ api: false, canvases: 1 });
});

test("Signal Weave 在统一画布内生长与反向切换，离开后卸载时钟", async ({ page }) => {
  await page.goto("demos/index.html?demo=signal-weave&t=1.2");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  expect(await page.evaluate(() => window.signalWeaveDemo.snapshot().pathPoints)).toBe(12);
  await page.locator("#mode-campaign").click();
  await expect.poll(() => page.evaluate(() => window.signalWeaveDemo.snapshot().position)).toBeGreaterThan(0);
  await page.locator("#mode-standard").click();
  expect((await page.evaluate(() => window.signalWeaveDemo.snapshot())).eventCount).toBe(2);
  await page.getByRole("button", { name: /所有演示/ }).click();
  await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
  expect(
    await page.evaluate(() => ({
      api: "signalWeaveDemo" in window,
      canvases: document.querySelectorAll("canvas").length,
    })),
  ).toEqual({ api: false, canvases: 1 });
});

test("三个图表作品在统一页面往返时复用 Canvas 并卸载旧 API", async ({ page }, testInfo) => {
  await page.goto("demos/index.html?group=art");
  const works = [
    ["cohort-pulse", "cohortPulseDemo"],
    ["signal-weave", "signalWeaveDemo"],
    ["tidal-bloom", "metricFlowDemo"],
  ];

  for (const [id, api] of works) {
    await page.locator(`a[data-demo="examples/${id}/index.html"]`).click();
    await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
    await expect(page.locator("#scene")).toHaveCount(1);
    if (id === works[0][0]) await page.locator("#scene").evaluate((canvas) => (canvas.dataset.artStage = "shared"));
    await expect(page.locator("#scene")).toHaveAttribute("data-art-stage", "shared");
    expect(
      await page.evaluate(
        ({ current, all }) => ({
          current: current in window,
          stale: all.filter((name) => name !== current && name in window),
          canvases: document.querySelectorAll("canvas").length,
        }),
        { current: api, all: works.map((item) => item[1]) },
      ),
    ).toEqual({ current: true, stale: [], canvases: 1 });
    await page.screenshot({ path: testInfo.outputPath(`art-stage-${id}.png`) });
    await page.getByRole("button", { name: /所有演示/ }).click();
    await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
    await page.getByLabel("分类", { exact: true }).selectOption("art");
  }

  expect(
    await page.evaluate(
      (all) => ({
        stale: all.filter((name) => name in window),
        canvases: document.querySelectorAll("canvas").length,
      }),
      works.map((item) => item[1]),
    ),
  ).toEqual({ stale: [], canvases: 1 });
});

test("浏览器历史记录恢复画廊筛选和对应 HTML", async ({ page }) => {
  await page.goto("demos/index.html?group=originals&q=曲线");
  await expect(page.getByLabel("查找演示")).toHaveValue("曲线");
  await page.getByRole("link", { name: "打开 Curve · 动态曲线" }).click();
  await expect(page.locator("#demo-title")).toContainText("Curve");
  await page.goBack();
  await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
  await expect(page.getByLabel("查找演示")).toHaveValue("曲线");
  await expect(page.getByLabel("分类", { exact: true })).toHaveValue("originals");
  await expect(page.locator("a[data-demo]")).toHaveCount(1);
});

test("11 个原有动画复用一块全屏 Canvas，缩减动态效果时不等待淡入", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("demos/index.html?demo=folding-fan&t=0");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await page.locator("#scene").evaluate((canvas) => {
    canvas.dataset.persistent = "yes";
  });
  await expect(page.locator("#scene")).toHaveCSS("position", "fixed");
  for (const entry of catalog.entries.filter((item) => item.group === "originals").slice(1)) {
    await page.getByRole("button", { name: "下一个演示" }).click();
    await expect(page).toHaveURL(new RegExp(`demo=${entry.id}$`));
    await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
    await expect(page.locator("#scene")).toHaveAttribute("data-persistent", "yes");
    await expect(page.locator("#scene")).toHaveCSS("transition-duration", "0s");
    if (entry.id === "drag-demo") {
      await page.getByRole("button", { name: "禁用交互", exact: true }).click();
      expect((await page.evaluate(() => window.dragDemo.snapshot())).model["enabled?"]).toBe(false);
      await page.getByRole("button", { name: "恢复交互", exact: true }).click();
      expect((await page.evaluate(() => window.dragDemo.snapshot())).model["enabled?"]).toBe(true);
    }
  }
  expect(await page.locator("canvas").count()).toBe(1);
  expect(await page.locator("#scene").boundingBox()).toEqual({ x: 0, y: 0, width: 1280, height: 900 });
});
