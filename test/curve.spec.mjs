import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

async function ready(page, time = 30) {
  await page.goto(`http://127.0.0.1:5180/examples/curve/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

async function captureStage(page, testInfo, name) {
  await page.screenshot({ path: testInfo.outputPath(`curve-${name}-overlay.png`) });
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeHidden();
  await page
    .locator("nav, #panel-toggle")
    .evaluateAll((nodes) => nodes.forEach((node) => (node.style.visibility = "hidden")));
  await page.screenshot({ path: testInfo.outputPath(`curve-${name}-canvas.png`) });
  await page
    .locator("nav, #panel-toggle")
    .evaluateAll((nodes) => nodes.forEach((node) => (node.style.visibility = "")));
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeVisible();
}

for (const dpr of [1, 2])
  test(`实例绘制与 Calcit 命中使用相同位置：DPR ${dpr} 的旋转、clip、版本与索引`, async ({ page }, testInfo) => {
    await ready(page);
    const result = await page.evaluate(async (scale) => {
      const core = await import("/target/js/curve/calcit.core.mjs");
      const hit = await import("/target/js/curve/quamolit.scene-hit.mjs");
      const fixture = await import("/target/js/curve/quamolit.test.scene-hit-fixture.mjs");
      const { draw_instances_$x_: drawInstances } = await import("/target/js/curve/quamolit.canvas-reference.mjs");
      const tags = core.init_tags(["nodes", "content", "points", "source", "x", "y"]);
      const results = [];
      for (const version of [1, 2]) {
        const sceneDocument = fixture.instance_hit_document(version);
        const instances = sceneDocument.getRequired(tags.nodes).toArray()[1].getRequired(tags.content).extra[0];
        const source = fixture.instance_hit_source(instances.getRequired(tags.source));
        const positions = new Float32Array(
          source
            .getRequired(tags.points)
            .toArray()
            .flatMap((p) => [p.getRequired(tags.x), p.getRequired(tags.y)]),
        );
        const plan = hit.compile_hit_plan_with_positions(sceneDocument, fixture.instance_hit_source);
        const surface = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 160 * scale;
          canvas.height = 180 * scale;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          context.scale(scale, scale);
          context.transform(0, 2, -2, 0, 100, 100);
          return context;
        };
        const actual = surface(),
          reference = surface();
        const clip = new Path2D();
        clip.rect(0, 0, 20, 20);
        actual.clip(clip);
        reference.clip(clip);
        const metrics = core.to_js_data(drawInstances(actual, instances, positions));
        // 原生参考独立使用明确坐标，不以被测实例源生成期望位置。
        const starts = version === 1 ? [0, 8] : [40, 48];
        const paths = starts.map((x) => {
          const path = new Path2D();
          path.rect(x, 0, 20, 20);
          return path;
        });
        reference.fillStyle = "red";
        for (const x of starts) reference.fillRect(x, 0, 20, 20);
        let mismatches = 0,
          queries = 0;
        for (let x = 55; x <= 105; x += 5)
          for (let y = 90; y <= 155; y += 5) {
            let index = -1;
            if (reference.isPointInPath(clip, x * scale, y * scale))
              for (let i = paths.length - 1; i >= 0; i--)
                if (reference.isPointInPath(paths[i], x * scale, y * scale)) {
                  index = i;
                  break;
                }
            const got = core.to_js_data(hit.instance_hit_index(plan, "dots", x, y));
            if ((got[0] === "some" ? got[1] : -1) !== index) mismatches++;
            if ((core.to_js_data(hit.hit_test_plan(plan, x, y))[0] === "hit") !== index >= 0) mismatches++;
            queries++;
          }
        const pixels = (ctx) => ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
        const got = pixels(actual),
          expected = pixels(reference);
        let differingChannels = 0;
        for (let i = 0; i < got.length; i++) if (got[i] !== expected[i]) differingChannels++;
        results.push({ version, queries, mismatches, differingChannels, metrics, png: actual.canvas.toDataURL() });
      }
      return results;
    }, dpr);
    for (const row of result) {
      const path = testInfo.outputPath(`instances-v${row.version}-dpr${dpr}.png`);
      await writeFile(path, Buffer.from(row.png.split(",")[1], "base64"));
      await testInfo.attach(`instances-v${row.version}`, { path, contentType: "image/png" });
      expect(row.queries).toBe(154);
      expect(row.mismatches).toBe(0);
      expect(row.differingChannels).toBe(0);
      expect(row.metrics["canvas-calls"]).toBe(2);
    }
  });

for (const dpr of [1, 2])
  test(`原生路径样式不继承宿主：DPR ${dpr} 的端点、接头和状态恢复`, async ({ page }, testInfo) => {
    await ready(page);
    const results = await page.evaluate(async (scale) => {
      const { draw_content_$x_: drawContent } = await import("/target/js/curve/quamolit.canvas-reference.mjs");
      const fixture = await import("/target/js/curve/quamolit.test.scene-hit-fixture.mjs");
      const results = [];
      for (const polygon of [false, true]) {
        const surface = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 120 * scale;
          canvas.height = 100 * scale;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          context.scale(scale, scale);
          context.strokeStyle = "red";
          context.lineWidth = 20;
          return context;
        };
        const actual = surface(),
          reference = surface(),
          negative = surface();
        for (const context of [actual, negative]) {
          context.lineCap = "square";
          context.lineJoin = "bevel";
          context.miterLimit = 1;
        }
        const rawPath = (context) => {
          context.beginPath();
          context.moveTo(20, 70);
          if (polygon) {
            context.lineTo(80, 70);
            context.lineTo(80, 10);
            context.closePath();
          } else {
            context.bezierCurveTo(40, 70, 60, 70, 80, 70);
            context.bezierCurveTo(80, 50, 80, 30, 80, 10);
          }
          context.stroke();
        };
        reference.lineCap = "butt";
        reference.lineJoin = "miter";
        reference.miterLimit = 10;
        rawPath(reference);
        rawPath(negative); // 旧行为：继承 square/bevel/1，必须产生差异。
        const content = polygon ? fixture.polygon_stroke_content() : fixture.cubic_stroke_content();
        drawContent(actual, content);
        const pixels = (context) => context.getImageData(0, 0, context.canvas.width, context.canvas.height).data;
        const expected = pixels(reference),
          got = pixels(actual),
          wrong = pixels(negative);
        let differing = 0,
          negativeDiffering = 0;
        for (let index = 0; index < got.length; index += 4) {
          if (got.slice(index, index + 4).some((channel, offset) => channel !== expected[index + offset])) differing++;
          if (wrong.slice(index, index + 4).some((channel, offset) => channel !== expected[index + offset]))
            negativeDiffering++;
        }
        results.push({
          polygon,
          differing,
          negativeDiffering,
          restored: [actual.lineCap, actual.lineJoin, actual.miterLimit, actual.lineWidth, actual.strokeStyle],
          actualPng: actual.canvas.toDataURL(),
          expectedPng: reference.canvas.toDataURL(),
          negativePng: negative.canvas.toDataURL(),
        });
      }
      return results;
    }, dpr);
    for (const result of results) {
      for (const name of ["actualPng", "expectedPng", "negativePng"]) {
        const path = testInfo.outputPath(`${result.polygon ? "polygon" : "cubic"}-${name}.png`);
        await writeFile(path, Buffer.from(result[name].split(",")[1], "base64"));
        await testInfo.attach(`${result.polygon ? "polygon" : "cubic"}-${name}`, {
          path,
          contentType: "image/png",
        });
      }
      expect(result.differing).toBe(0);
      expect(result.negativeDiffering).toBeGreaterThan(100 * dpr * dpr);
      expect(result.restored).toEqual(["square", "bevel", 1, 20, "#ff0000"]);
    }
  });

for (const dpr of [1, 2])
  test(`闭合多边形命中：DPR ${dpr} 原生描边、miterLimit 与退化点`, async ({ page }, testInfo) => {
    await ready(page);
    const results = await page.evaluate(async (scale) => {
      const { local_hit_$q_: localHit } = await import("/target/js/curve/quamolit.scene-hit.mjs");
      const { to_js_data: toJsData } = await import("/target/js/curve/calcit.core.mjs");
      const { polygon_stroke_profile: profileContent } =
        await import("/target/js/curve/quamolit.test.scene-hit-fixture.mjs");
      const results = [];
      for (const profile of [
        "square",
        "clockwise",
        "acute-miter",
        "acute-bevel",
        "duplicates",
        "collapsed",
        "collinear",
        "zero-width",
      ]) {
        const content = profileContent(profile);
        const { points, width } = toJsData(content)[1];
        const context = document.createElement("canvas").getContext("2d");
        context.scale(scale, scale);
        context.lineWidth = width || 20;
        context.lineCap = "butt";
        context.lineJoin = "miter";
        context.miterLimit = 10;
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (const point of points.slice(1)) context.lineTo(point.x, point.y);
        context.closePath();
        let differing = 0,
          oldDiffering = 0,
          samples = 0;
        const mismatches = [];
        // 采用离轴的确定性采样；不靠抗锯齿像素或宽松阈值掩盖轮廓错误。
        for (let y = -20.29; y < 100; y += 3)
          for (let x = -20.37; x < 220; x += 3) {
            const filled = context.isPointInPath(x * scale, y * scale);
            const expected = filled || (width > 0 && context.isPointInStroke(x * scale, y * scale));
            const actual = localHit(content, x, y);
            if (actual !== expected) {
              differing++;
              if (mismatches.length < 5) mismatches.push({ x, y, actual, expected });
            }
            // 原开放圆头算法的负例：缺闭合边与 miter 外角，且会扩张圆头。
            const oldStroke =
              width > 0 &&
              points.slice(1).some((end, index) => {
                const start = points[index],
                  dx = end.x - start.x,
                  dy = end.y - start.y;
                const length = dx * dx + dy * dy;
                const t = length ? Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / length)) : 0;
                return (x - start.x - t * dx) ** 2 + (y - start.y - t * dy) ** 2 <= (width / 2) ** 2;
              });
            if ((filled || oldStroke) !== expected) oldDiffering++;
            samples++;
          }
        results.push({ profile, samples, differing, oldDiffering, mismatches });
      }
      return results;
    }, dpr);
    const path = testInfo.outputPath(`polygon-hit-dpr-${dpr}.json`);
    await writeFile(path, JSON.stringify({ dpr, results }, null, 2));
    await testInfo.attach("polygon-hit-native-comparison", { path, contentType: "application/json" });
    for (const result of results) {
      expect(result.samples).toBe(3321);
      expect(result.differing, JSON.stringify(result)).toBe(0);
    }
    expect(results.find((result) => result.profile === "square").oldDiffering).toBeGreaterThan(20);
    expect(results.find((result) => result.profile === "acute-bevel").oldDiffering).toBeGreaterThan(0);
    expect(results.find((result) => result.profile === "collapsed").oldDiffering).toBeGreaterThan(0);
  });

for (const dpr of [1, 2])
  test(`三次曲线命中：DPR ${dpr} 自适应几何、真实切线与退化`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await ready(page);
    const results = await page.evaluate(async (scale) => {
      const { compile_hit_plan: compile, hit_test_plan: hit } = await import("/target/js/curve/quamolit.scene-hit.mjs");
      const { to_js_data: plain } = await import("/target/js/curve/calcit.core.mjs");
      const { cubic_stroke_scene: scene } = await import("/target/js/curve/quamolit.test.scene-hit-fixture.mjs");
      const results = [];
      for (const profile of [
        "straight",
        "arch",
        "elbow",
        "s-curve",
        "loop",
        "tangent-zero",
        "reverse-line",
        "collapsed",
        "zero-segment",
        "thin",
      ]) {
        const sceneDocument = scene(profile),
          plan = compile(sceneDocument);
        const { start, segments, width } = plain(sceneDocument).nodes[0].content[1];
        const geometry = plain(plan).candidates[0]["curve-parts"];
        // #34 的原生精度反例：默认尺度会漏细曲线中心点。
        // 几何 oracle 放大坐标而非只改 CTM；默认尺度仍单列，不隐藏差异。
        const makeContext = (precision) => {
          const context = document.createElement("canvas").getContext("2d");
          context.scale(scale, scale);
          context.lineWidth = width * precision;
          context.lineCap = "butt";
          context.lineJoin = "miter";
          context.miterLimit = 10;
          context.beginPath();
          context.moveTo(start.x * precision, start.y * precision);
          for (const segment of segments)
            context.bezierCurveTo(
              segment["control-1"].x * precision,
              segment["control-1"].y * precision,
              segment["control-2"].x * precision,
              segment["control-2"].y * precision,
              segment.end.x * precision,
              segment.end.y * precision,
            );
          return (x, y) => context.isPointInStroke(x * precision * scale, y * precision * scale);
        };
        // 起终点重合也不自动 closePath，与生产 CubicPath 的开放合同一致。
        const native = makeContext(64),
          defaultNative = makeContext(1);
        let samples = 0,
          boundary = 0,
          differing = 0,
          defaultDiffering = 0;
        const mismatches = [];
        // 在实现前固定的几何边界带：1/32 local CSS px；不接受带外误差。
        const band = 1 / 32;
        for (let y = -20.29; y < 100; y += 3)
          for (let x = -20.37; x < 220; x += 3) {
            const expected = native(x, y),
              actual = plain(hit(plan, x, y))[0] === "hit";
            if (actual !== defaultNative(x, y)) defaultDiffering++;
            const nearBoundary = [
              [-band, 0],
              [band, 0],
              [0, -band],
              [0, band],
              [-band, -band],
              [-band, band],
              [band, -band],
              [band, band],
            ].some(([dx, dy]) => native(x + dx, y + dy) !== expected);
            if (nearBoundary) boundary++;
            if (actual !== expected && !nearBoundary) {
              differing++;
              if (mismatches.length < 5) mismatches.push({ x, y, actual, expected });
            }
            samples++;
          }
        let thinProbes = 0,
          oldThinMisses = 0,
          defaultThinMisses = 0;
        if (profile === "thin") {
          const cubic = (t) => {
            const u = 1 - t,
              segment = segments[0];
            const at = (axis) =>
              u ** 3 * start[axis] +
              3 * u ** 2 * t * segment["control-1"][axis] +
              3 * u * t ** 2 * segment["control-2"][axis] +
              t ** 3 * segment.end[axis];
            return { x: at("x"), y: at("y") };
          };
          const wrong = document.createElement("canvas").getContext("2d");
          wrong.lineWidth = width;
          wrong.lineCap = "butt";
          wrong.lineJoin = "miter";
          wrong.beginPath();
          wrong.moveTo(start.x, start.y);
          for (let index = 1; index <= 16; index++) {
            const point = cubic(index / 16);
            wrong.lineTo(point.x, point.y);
          }
          for (let index = 0; index < 32; index++) {
            const { x, y } = cubic((index + 0.5) / 32);
            if (!native(x, y) || plain(hit(plan, x, y))[0] !== "hit") mismatches.push({ thinCenter: true, x, y });
            if (!wrong.isPointInStroke(x, y)) oldThinMisses++;
            if (!defaultNative(x, y)) defaultThinMisses++;
            thinProbes++;
          }
        }
        results.push({
          profile,
          samples,
          boundary,
          differing,
          mismatches,
          preparedPoints: geometry.map((part) => part.points.length),
          thinProbes,
          oldThinMisses,
          defaultDiffering,
          defaultThinMisses,
          archCounterexample:
            profile === "arch"
              ? {
                  defaultNative: defaultNative(12.63, 48.71),
                  preciseNative: native(12.63, 48.71),
                  actual: plain(hit(plan, 12.63, 48.71))[0] === "hit",
                }
              : null,
        });
      }
      return results;
    }, dpr);
    const path = testInfo.outputPath(`cubic-hit-dpr-${dpr}.json`);
    await writeFile(
      path,
      JSON.stringify({ dpr, nativeCoordinatePrecision: 64, localBoundaryBand: 1 / 32, results }, null, 2),
    );
    await testInfo.attach("cubic-hit-native-comparison", { path, contentType: "application/json" });
    for (const result of results) {
      expect(result.samples).toBe(3321);
      expect(result.differing, JSON.stringify(result)).toBe(0);
      expect(result.boundary).toBeLessThan(result.samples * 0.01);
      expect(result.mismatches).toEqual([]);
    }
    const thin = results.find((result) => result.profile === "thin");
    expect(thin.thinProbes).toBe(32);
    expect(thin.oldThinMisses).toBeGreaterThan(0);
    expect(thin.defaultThinMisses).toBe(12);
    expect(results.find((result) => result.profile === "arch").archCounterexample).toEqual({
      defaultNative: true,
      preciseNative: false,
      actual: false,
    });
  });

test("动态闭合曲线：固定时间顶点与截图，重复采样一致", async ({ page }, testInfo) => {
  await ready(page);
  const at = (t) => page.evaluate((x) => window.curveDemo.seek(x), t);
  const first = await at(0);
  expect(first.pointCount).toBe(98);
  expect(first.nodeCount).toBe(1);
  expect(first.scene.nodes[0].content[0]).toBe("cubic-path");
  expect(first.scene.nodes[0].content[1].segments).toHaveLength(32);
  await captureStage(page, testInfo, "initial");
  const later = await at(60);
  expect(later.pointCount).toBe(98);
  expect(later.points).not.toEqual(first.points);
  await captureStage(page, testInfo, "middle");
  await at(120);
  await captureStage(page, testInfo, "end");
  await at(60);
  const repeat = await at(60);
  expect(repeat.points).toEqual(later.points);
});

test("全屏 DPR 2：暂停 resize 不推进时间，浮层收起不误触", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page, 30);
    const original = await page.evaluate(() => window.curveDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    const after = await page.evaluate(() => window.curveDemo.snapshot());
    expect(after.time).toBe(original.time);
    expect(after.points).toEqual(original.points);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("curve-390-dpr2.png") });
  } finally {
    await context.close();
  }
});
