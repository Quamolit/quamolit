import { test, expect } from "@playwright/test";

test("运行中 DPR 1→2 两层同步，Scene 命中不依赖 Canvas 后端", async ({ page }) => {
  await page.goto("/examples/layer-composition/index.html?t=0.5");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await expect.poll(() => page.evaluate(() => window.layerCompositionDemo.snapshot().viewport.dpr)).toBe(1);
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 720,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await expect.poll(() => page.evaluate(() => window.layerCompositionDemo.snapshot().viewport.dpr)).toBe(2);
  expect(await page.locator("canvas").evaluateAll((nodes) => nodes.map((node) => [node.width, node.height]))).toEqual([
    [2560, 1440],
    [2560, 1440],
  ]);
  expect((await page.evaluate(() => window.layerCompositionDemo.snapshot())).time).toBe(0.5);
  await page.locator("#panel-toggle").click();
  // 与独立 Calcit 数值测试使用同一 CSS 点：中心 + 父组 0.93 缩放 + rise=12。
  await page.mouse.click(640 - 250 * 0.93, 360 + 12 - 88 * 0.93);
  const hit = await page.evaluate(() => {
    const state = window.layerCompositionDemo.snapshot();
    window.layerCompositionDemo.pause();
    return state;
  });
  expect(hit.lastHit).toEqual({ "layer-id": "ui", hit: { target: "toggle-play", "node-id": "metric-a", visited: 1 } });
  expect(hit.playing).toBe(true);
  expect(
    Object.values(hit.costs)
      .filter((value) => value !== null)
      .every((value) => Number.isFinite(value) && value >= 0),
  ).toBe(true);
  expect(hit.costs.compositorMs).toBeNull();
  await session.detach();
});

test("真实 GPU 透明底层与 Canvas UI 同屏，切回 Canvas 不重置帧", async ({ page }, testInfo) => {
  test.skip(!process.env.QUAMOLIT_LAYER_REQUIRE_GPU, "真实 GPU 使用本机 headed 专项，不以云端软件 adapter 验收");
  await page.goto("/examples/layer-composition/index.html?t=0.5");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await page.evaluate(() => {
    const ui = document.querySelector('canvas[data-layer="ui"]');
    const bottom = document.querySelector('canvas[data-layer="instances"]');
    const expected = new OffscreenCanvas(ui.width, ui.height);
    const context = expected.getContext("2d");
    context.drawImage(bottom, 0, 0);
    context.drawImage(ui, 0, 0);
    window.layerExpected = context.getImageData(0, 0, ui.width, ui.height).data;
  });
  await page.evaluate(() => window.layerCompositionDemo.setBackend("webgpu"));
  const state = await page.evaluate(() => window.layerCompositionDemo.snapshot());
  expect(state.backend, JSON.stringify(state)).toBe("webgpu");
  expect(JSON.stringify(state.adapter)).not.toMatch(/swiftshader|llvmpipe|software/i);
  expect(Object.values(state.adapter).some(Boolean)).toBe(true);
  console.log("分层 GPU adapter", state.adapter);
  expect(state.metrics.instances).toBe(10000);
  expect(state.plan).toEqual([["webgpu"], ["canvas", "declared-canvas"]]);
  await page.evaluate(() => window.layerCompositionDemo.whenSubmitted());
  const delta = await page.evaluate(() => {
    // WebGPU 呈现后的 drawing buffer 不可作为持久快照；在同一任务内重绘并采集当前帧。
    window.layerCompositionDemo.seek(0.5);
    const ui = document.querySelector('canvas[data-layer="ui"]');
    const bottom = document.querySelector('canvas[data-layer="instances"]');
    const surface = new OffscreenCanvas(ui.width, ui.height);
    const context = surface.getContext("2d");
    context.drawImage(bottom, 0, 0);
    context.drawImage(ui, 0, 0);
    const actual = context.getImageData(0, 0, ui.width, ui.height).data;
    let maxRgb = 0,
      maxAlpha = 0,
      firstDifference = null;
    for (let i = 0; i < actual.length; i++) {
      const delta = Math.abs(actual[i] - window.layerExpected[i]);
      if (delta > 2 && !firstDifference) {
        const p = i - (i % 4);
        firstDifference = {
          x: (p / 4) % ui.width,
          y: Math.floor(p / 4 / ui.width),
          actual: Array.from(actual.slice(p, p + 4)),
          expected: Array.from(window.layerExpected.slice(p, p + 4)),
        };
      }
      if (i % 4 === 3) maxAlpha = Math.max(maxAlpha, delta);
      else maxRgb = Math.max(maxRgb, delta);
    }
    return { maxRgb, maxAlpha, firstDifference };
  });
  console.log("分层 GPU 全图差异", delta);
  await page.screenshot({ path: testInfo.outputPath("layer-composition-webgpu.png") });
  // 8-bit 预乘量化在 alpha=0.5 时至多带来 2 个 RGB 级别；整图检查，不忽略边缘。
  expect(delta.maxRgb).toBeLessThanOrEqual(2);
  expect(delta.maxAlpha).toBeLessThanOrEqual(1);
  await page.evaluate(() => window.layerCompositionDemo.loseDevice());
  await expect.poll(() => page.evaluate(() => window.layerCompositionDemo.snapshot().reason)).toBe("device-lost");
  const lost = await page.evaluate(() => window.layerCompositionDemo.snapshot());
  expect(lost.time).toBe(0.5);
  expect(lost.metrics.instances).toBe(10000);
  expect(lost.gpuCreated).toBe(lost.gpuReleased);
  await page.evaluate(() => window.layerCompositionDemo.setBackend("webgpu"));
  const rebuilt = await page.evaluate(() => window.layerCompositionDemo.snapshot());
  expect(rebuilt.backend).toBe("webgpu");
  expect(rebuilt.version).toBe(state.version);
  expect(rebuilt.metrics["position-bytes-uploaded"]).toBe(80000);
  await page.evaluate(() => window.layerCompositionDemo.setBackend("canvas"));
  expect((await page.evaluate(() => window.layerCompositionDemo.snapshot())).time).toBe(0.5);
});

test("共享视口和时间的两层全屏合成，暂停 resize 不重置 Model", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/examples/layer-composition/index.html?t=0.5");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await expect(page.locator("canvas")).toHaveCount(2);
  const before = await page.evaluate(() => window.layerCompositionDemo.snapshot());
  expect(before.metrics.instances).toBe(10000);
  expect(before.plan).toEqual([
    ["canvas", "webgpu-unavailable"],
    ["canvas", "declared-canvas"],
  ]);
  const compare = () =>
    page.evaluate(() => {
      const ui = document.querySelector('canvas[data-layer="ui"]');
      const bottom = document.querySelector('canvas[data-layer="instances"]');
      const actual = new OffscreenCanvas(ui.width, ui.height);
      const expected = new OffscreenCanvas(ui.width, ui.height);
      const a = actual.getContext("2d"),
        e = expected.getContext("2d");
      a.drawImage(bottom, 0, 0);
      a.drawImage(ui, 0, 0);
      // 公共 Canvas 颜色合同先将 0.7 * 255 四舍五入为 179，再交给 CSS。
      e.fillStyle = "rgba(51,179,153,0.5)";
      const dpr = devicePixelRatio;
      for (let i = 0; i < 10000; i++)
        e.fillRect(
          Math.round(ui.width * ((0.5 + (i % 125)) / 125)),
          Math.round(ui.height * ((0.5 + Math.floor(i / 125)) / 80)),
          Math.round(2 * dpr),
          Math.round(2 * dpr),
        );
      e.drawImage(ui, 0, 0);
      const aa = a.getImageData(0, 0, ui.width, ui.height).data;
      const ee = e.getImageData(0, 0, ui.width, ui.height).data;
      let differing = 0,
        maxDelta = 0;
      let firstDifference = null;
      for (let i = 0; i < aa.length; i++) {
        if (aa[i] !== ee[i]) {
          differing++;
          if (!firstDifference) {
            const start = i - (i % 4);
            firstDifference = {
              x: (start / 4) % ui.width,
              y: Math.floor(start / 4 / ui.width),
              actual: Array.from(aa.slice(start, start + 4)),
              expected: Array.from(ee.slice(start, start + 4)),
            };
          }
        }
        maxDelta = Math.max(maxDelta, Math.abs(aa[i] - ee[i]));
      }
      return {
        differing,
        maxDelta,
        firstDifference,
        widths: [ui.width, bottom.width],
        heights: [ui.height, bottom.height],
        pointerEvents: getComputedStyle(bottom).pointerEvents,
      };
    });
  const first = await compare();
  expect(first.differing, JSON.stringify(first)).toBe(0);
  expect(first.pointerEvents).toBe("none");
  await page.screenshot({ path: testInfo.outputPath("layer-composition-middle.png") });
  await page.setViewportSize({ width: 1100, height: 800 });
  await expect
    .poll(() => page.evaluate(() => window.layerCompositionDemo.snapshot().viewport.width))
    .toBe(1100 * before.viewport.dpr);
  expect((await page.evaluate(() => window.layerCompositionDemo.snapshot())).time).toBe(before.time);
  const resized = await compare();
  expect(resized.widths).toEqual([1100 * before.viewport.dpr, 1100 * before.viewport.dpr]);
  expect(resized.heights).toEqual([800 * before.viewport.dpr, 800 * before.viewport.dpr]);
  expect(resized.differing).toBe(0);
  expect(errors).toEqual([]);
});

test("adapter 获取失败只回退实例层，无漏绘或逻辑时间变化", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value: {
        requestAdapter: async () => {
          throw new Error("test-adapter-failure");
        },
      },
    }),
  );
  await page.goto("/examples/layer-composition/index.html?t=0.65&backend=webgpu");
  await expect
    .poll(() => page.evaluate(() => window.layerCompositionDemo?.snapshot().reason))
    .toBe("test-adapter-failure");
  const state = await page.evaluate(() => window.layerCompositionDemo.snapshot());
  expect(state.time).toBe(0.65);
  expect(state.backend).toBe("canvas");
  expect(state.metrics.instances).toBe(10000);
  await expect(page.locator("canvas")).toHaveCount(2);
  const occupied = await page.locator('canvas[data-layer="instances"]').evaluate((canvas) => {
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) count++;
    return count;
  });
  expect(occupied).toBe(40000 * state.viewport.dpr ** 2);
});
