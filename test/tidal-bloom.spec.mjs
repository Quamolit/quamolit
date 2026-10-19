import { expect, test } from "@playwright/test";

async function ready(page, time = 1.4) {
  await page.goto(`http://127.0.0.1:5180/examples/tidal-bloom/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

test("时间轴、双向视图与数据系列保留绘制和旧投影的独立原生 Canvas 逐像素一致", async ({ browser }) => {
  for (const dpr of [1, 2]) {
    const context = await browser.newContext({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    try {
      await ready(page, 0);
      const differences = await page.evaluate(async () => {
        const { scene_at, initial_model, initial_series_model, interactive_scene_with_series_at } =
          await import("/target/js/tidal-bloom/quamolit.examples.tidal-bloom.mjs");
        const { to_js_data } = await import("/target/js/tidal-bloom/calcit.core.mjs");
        const source = document.querySelector("canvas");
        const reference = document.createElement("canvas");
        const paint = reference.getContext("2d");
        const results = [];
        let negativeChanged = 0;
        const compare = (time, scene) => {
          reference.width = source.width;
          reference.height = source.height;
          const scale = Math.min(source.width / 1000, source.height / 700);
          paint.setTransform(scale, 0, 0, scale, source.width / 2, source.height / 2);
          for (const node of to_js_data(scene).nodes) {
            const [kind, shape] = node.content;
            const { r, g, b, a } = shape.fill;
            paint.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
            if (kind === "rect") paint.fillRect(shape.x, shape.y, shape.width, shape.height);
            else if (kind === "text") {
              paint.font = `${shape.size}px monospace`;
              paint.textAlign = "left";
              paint.textBaseline = "middle";
              paint.direction = "ltr";
              paint.fillText(shape.text, shape.x, shape.y);
            } else throw new Error(`未覆盖参考图元 ${kind}`);
          }
          const actual = source.getContext("2d").getImageData(0, 0, source.width, source.height).data;
          const expected = paint.getImageData(0, 0, reference.width, reference.height).data;
          let changed = 0;
          for (let index = 0; index < actual.length; index++) if (actual[index] !== expected[index]) changed++;
          results.push({ time, changed });
          if (time === "timeline/0.325") {
            paint.setTransform(1, 0, 0, 1, 0, 0);
            paint.fillStyle = "red";
            paint.fillRect(0, 0, 1, 1);
            const wrong = paint.getImageData(0, 0, 1, 1).data;
            for (let index = 0; index < 4; index++) if (actual[index] !== wrong[index]) negativeChanged++;
          }
        };
        const demo = window.metricFlowDemo;
        for (const time of [0, 0.325, 1.4, 3.7, 4, 5.23, 7, 1.4]) {
          demo.seek(time);
          compare(`timeline/${time}`, scene_at(time));
        }
        const interactive = (label, times) => {
          for (const time of times) {
            const snapshot = demo.seekInteractive(time);
            if (!snapshot.retained) throw new Error("交互路径没有接入保留计划");
            compare(
              `${label}/${time}`,
              interactive_scene_with_series_at(
                initial_model(snapshot.position),
                initial_series_model(snapshot.seriesPosition),
                0,
              ),
            );
          }
        };
        demo.chooseView(1);
        interactive("enter", [0.2, 0.6, 0.9, 1.2]);
        demo.chooseSeries(1);
        interactive("series", [1.2, 1.65, 2.1]);
        demo.seekInteractive(1.65);
        demo.chooseSeries(0);
        interactive("series-reverse", [1.65, 1.9, 2.55]);
        demo.chooseView(0);
        interactive("exit", [2.8, 3.15, 3.75]);
        return { frames: results, negativeChanged };
      });
      expect(differences.frames, `DPR ${dpr}`).toEqual(differences.frames.map(({ time }) => ({ time, changed: 0 })));
      expect(differences.negativeChanged, `DPR ${dpr} 的故意错误参考必须被检测到`).toBeGreaterThan(0);
    } finally {
      await context.close();
    }
  }
});

test("图表 UI：组件错峰出入场、真实卸载与乱序重放", async ({ page }, testInfo) => {
  await ready(page);
  const at = (time) => page.evaluate((value) => window.tidalBloomDemo.seek(value), time);
  const first = await at(1.4);
  expect(first.nodeCount).toBe(50);
  expect(first.retained.declarations).toBe(1);
  expect(first.retained.planBuilds).toBe(1);
  const sameTopology = await at(2);
  expect(sameTopology.retained.declarations).toBe(1);
  expect(sameTopology.retained.planBuilds).toBe(1);
  const moving = await at(3.7);
  const middle = await at(4);
  const later = await at(7);
  expect(moving.overviewVisible).toBe(true);
  expect(moving.analyticsVisible).toBe(true);
  expect(middle.overviewVisible).toBe(false);
  expect(later.analyticsVisible).toBe(true);
  expect(later.chartBarHeight).toBe(126);
  expect((await at(1.4)).heroWidth).toEqual(first.heroWidth);
  expect((await at(7)).chartBarHeight).toEqual(later.chartBarHeight);
  for (const time of [0, 1.4, 3.7, 5, 7]) {
    await at(time);
    await page.screenshot({ path: testInfo.outputPath(`metric-flow-${time}.png`) });
  }
  const painted = await page.locator("canvas").evaluate((canvas) => {
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) count++;
    return count;
  });
  expect(painted).toBeGreaterThan(1000);
});

test("全屏与浮层：DPR 2 resize 不推进时间", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page, 7);
    const before = await page.evaluate(() => window.tidalBloomDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    const after = await page.evaluate(() => window.tidalBloomDemo.snapshot());
    expect(after.time).toBe(before.time);
    expect(after.chartBarHeight).toEqual(before.chartBarHeight);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("metric-flow-mobile.png") });
  } finally {
    await context.close();
  }
});

test("真实视图按钮：切换途中反向、再次进入与分享中间帧", async ({ page }, testInfo) => {
  await ready(page, 1.4);
  await page.locator("#view-analytics").click();
  const at = (time) => page.evaluate((value) => window.metricFlowDemo.seekInteractive(value), time);
  const quarter = await at(0.3);
  expect(quarter.mode).toBe("interactive");
  expect(quarter.position).toBeGreaterThan(0);
  expect(quarter.overviewVisible).toBe(true);
  expect(quarter.analyticsVisible).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("metric-flow-interrupt-before.png") });
  await page.locator("#view-overview").click();
  const reversed = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(reversed.position).toBeCloseTo(quarter.position, 4);
  expect(reversed.eventCount).toBe(2);
  const turning = await at(0.6);
  expect(turning.position).toBeLessThan(quarter.position);
  await page.locator("#view-analytics").click();
  const entering = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(entering.position).toBeCloseTo(turning.position, 4);
  const complete = await at(1.8);
  expect(complete.overviewVisible).toBe(false);
  expect(complete.analyticsVisible).toBe(true);
  expect(complete.chartBarHeight).toBe(126);
  expect(complete.eventCount).toBe(3);
  await page.screenshot({ path: testInfo.outputPath("metric-flow-interactive-analytics.png") });
  await page.locator("#view-overview").click();
  const returning = await at(2.4);
  expect(returning.analyticsVisible).toBe(true);
  expect(returning.overviewVisible).toBe(false);
  await page.locator("#share").click();
  await expect(page).toHaveURL(/progress=/);
  await page.reload();
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  const shared = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(shared.mode).toBe("interactive");
  expect(shared.position).toBeCloseTo(returning.position, 6);
  await page.screenshot({ path: testInfo.outputPath("metric-flow-shared-intermediate.png") });
});

test("交互切换到终点后停止连续绘制，输入可重新唤醒", async ({ page }) => {
  await ready(page, 1.4);
  await page.locator("#view-analytics").click();
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().playing)).toBe(false);
  const settled = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(settled.position).toBe(1);
  await page.waitForTimeout(250);
  expect((await page.evaluate(() => window.metricFlowDemo.snapshot())).paints).toBe(settled.paints);
  await page.locator("#view-overview").click();
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().position)).toBeLessThan(1);
});

test("默认进入交互切换；缩减动态效果下静止等待操作", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/tidal-bloom/index.html");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().position)).toBe(1);
  await page.locator("#play").click();
  await expect.poll(() => page.evaluate(() => window.metricFlowDemo.snapshot().position)).toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reduced = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(reduced.mode).toBe("interactive");
  expect(reduced.position).toBe(0);
  expect(reduced.playing).toBe(false);
});

test("分析图表可切换数据系列、中途反向并分享中间画面", async ({ page }, testInfo) => {
  await ready(page, 7);
  await page.locator("#view-analytics").click();
  await page.locator("#series-revenue").click();
  const at = (time) => page.evaluate((value) => window.metricFlowDemo.seekInteractive(value), time);
  const halfway = await at(0.45);
  expect(halfway.seriesPosition).toBeCloseTo(0.5, 4);
  expect(halfway.chartBarHeight).toBeCloseTo(109.5, 4);
  await page.screenshot({ path: testInfo.outputPath("metric-flow-series-middle.png") });
  // 真实按钮的 onclick 会重新启动 rAF。紧随其后在同一事件任务取样，
  // 再通过公开时钟入口暂停；跨 Playwright 调用读取会混入合法的时间推进。
  await page.locator("#series-visitors").evaluate((button) => {
    button.addEventListener(
      "click",
      () => {
        button.dataset.interruptionSnapshot = JSON.stringify(window.metricFlowDemo.snapshot());
        window.metricFlowDemo.pause();
      },
      { once: true },
    );
  });
  await page.locator("#series-visitors").click();
  const reversed = await page
    .locator("#series-visitors")
    .evaluate((button) => JSON.parse(button.dataset.interruptionSnapshot));
  expect(reversed.playing).toBe(true);
  expect(reversed.time).toBe(halfway.time);
  expect(reversed.seriesPosition).toBe(halfway.seriesPosition);
  expect(reversed.seriesEventCount).toBe(2);
  const settled = await at(1.35);
  expect(settled.seriesPosition).toBe(0);
  expect(settled.chartBarHeight).toBe(126);
  await page.locator("#series-revenue").click();
  const shared = await at(1.8);
  await page.locator("#share").click();
  await expect(page).toHaveURL(/seriesProgress=/);
  await page.reload();
  const reloaded = await page.evaluate(() => window.metricFlowDemo.snapshot());
  expect(reloaded.seriesPosition).toBeCloseTo(shared.seriesPosition, 6);
  expect(reloaded.chartBarHeight).toBeCloseTo(shared.chartBarHeight, 6);
  await page.screenshot({ path: testInfo.outputPath("metric-flow-series-shared.png") });
});
