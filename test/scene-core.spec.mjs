import { expect, test } from "@playwright/test";

for (const dpr of [1, 2])
  test(`公共原生圆弧：方向/跨0/完整圆/零长度/圆头和乱序时间 DPR${dpr} (#212)`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    await page.goto("/test/scene-core.html");
    const results = await page.evaluate(async (dpr) => {
      const core = await import("/target/js/motion/calcit.core.mjs");
      const ir = await import("/target/js/motion/quamolit.scene-ir.mjs");
      const motion = await import("/target/js/motion/quamolit.motion.mjs");
      const reference = await import("/target/js/motion/quamolit.canvas-reference.mjs");
      const renderer = await import("/target/js/motion/quamolit.canvas-scene.mjs");
      const tags = core.init_tags([
        "cx",
        "cy",
        "radius",
        "start-angle",
        "end-angle",
        "counterclockwise",
        "width",
        "stroke",
        "r",
        "g",
        "b",
        "a",
        "arc",
        "id",
        "key",
        "parent",
        "content",
        "bindings",
        "interaction",
        "none",
        "nodes",
        "group",
        "transform",
        "clip",
        "opacity",
        "c",
        "d",
        "e",
        "f",
      ]);
      const record = (type, fields) =>
        core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([key, value]) => [tags[key], value]));
      const color = record(motion.ColorRgba, { r: 1, g: 0, b: 0, a: 0.5 });
      const makeCanvas = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 128 * dpr;
        c.getContext("2d").scale(dpr, dpr);
        return c;
      };
      const pixelDiff = (a, b) => {
        const aa = a.getContext("2d").getImageData(0, 0, a.width, a.height).data;
        const bb = b.getContext("2d").getImageData(0, 0, b.width, b.height).data;
        return aa.reduce((count, value, i) => count + (value !== bb[i] ? 1 : 0), 0);
      };
      const results = [];
      for (const time of [2.5, 0, 0.5, 2.5])
        for (const [start, end, ccw, width] of [
          [0.2, 2.4, false, 4],
          [5, 1, false, 4],
          [1, 5, true, 4],
          [0, 2 * Math.PI, false, 4],
          [0, -2 * Math.PI, true, 4],
          [1, 1, false, 4],
          [0.2, 2.4, false, 0],
        ]) {
          const angle = time * 0.7;
          const fields = {
            cx: 64,
            cy: 64,
            radius: 40,
            "start-angle": start + angle,
            "end-angle": end + angle,
            counterclockwise: ccw,
            width,
            stroke: color,
          };
          const arc = record(ir.ArcNode, fields);
          const content = core._PCT__$o__$o_(ir.SceneContent, tags.arc, arc);
          const node = record(ir.SceneNode, {
            id: "arc",
            key: "arc",
            parent: "",
            content,
            bindings: core.arrayToList([]),
            interaction: core._PCT__$o__$o_(ir.SceneInteraction, tags.none),
          });
          const document = record(ir.SceneDocument, { nodes: core.arrayToList([node]) });
          // Scene uses absolute transforms; DPR belongs in its root, not the caller's context.
          const root = record(ir.SceneNode, {
            id: "root",
            key: "root",
            parent: "",
            bindings: core.arrayToList([]),
            interaction: core._PCT__$o__$o_(ir.SceneInteraction, tags.none),
            content: core._PCT__$o__$o_(
              ir.SceneContent,
              tags.group,
              record(ir.GroupNode, {
                transform: record(ir.Matrix2D, { a: dpr, b: 0, c: 0, d: dpr, e: 0, f: 0 }),
                clip: core._PCT__$o__$o_(ir.ClipSpec, tags.none),
                opacity: 1,
              }),
            ),
          });
          const scaledDocument = record(ir.SceneDocument, {
            nodes: core.arrayToList([root, node.assoc(tags.parent, "root")]),
          });
          const actual = makeCanvas(),
            flat = makeCanvas(),
            expected = makeCanvas(),
            wrongDirection = makeCanvas(),
            wrongCap = makeCanvas();
          const native = (canvas, counterclockwise, cap) => {
            if (width === 0) return;
            const ctx = canvas.getContext("2d");
            ctx.strokeStyle = "rgba(255,0,0,0.5)";
            ctx.lineWidth = width;
            ctx.lineCap = cap;
            ctx.beginPath();
            ctx.arc(64, 64, 40, start + angle, end + angle, counterclockwise);
            ctx.stroke();
          };
          renderer.draw_document_$x_(actual.getContext("2d"), scaledDocument, actual.width, actual.height, () => {
            throw new Error("unexpected image");
          });
          reference.draw_reference_$x_(flat.getContext("2d"), document);
          native(expected, ccw, "round");
          native(wrongDirection, !ccw, "round");
          native(wrongCap, ccw, "butt");
          results.push({
            time,
            start,
            end,
            width,
            scene: pixelDiff(actual, expected),
            flat: pixelDiff(flat, expected),
            wrongDirection: pixelDiff(wrongDirection, expected),
            wrongCap: pixelDiff(wrongCap, expected),
          });
        }
      return results;
    }, dpr);
    expect(results).toHaveLength(28);
    for (const result of results) {
      expect(result.scene).toBe(0);
      expect(result.flat).toBe(0);
      if (result.start === 0.2 && result.width === 4) {
        expect(result.wrongDirection).toBeGreaterThan(0);
        expect(result.wrongCap).toBeGreaterThan(0);
      }
    }
    await context.close();
  });

test("Scene IR 任意时间构造、序列化后可绘制准确中间帧", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/scene-core.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · rect-center=108 · nodes=3 · instances=10000 · pixel=234,88,12,255");
  await expect(status).toContainText("bound=pass");
  for (const [time, x] of [
    [1, 128],
    [0, 88],
    [0.25, 98],
    [0.5, 108],
    [0.5, 108],
  ]) {
    await page.getByRole("button", { name: `${time}s`, exact: true }).click();
    await expect(status).toContainText(
      `t=${time}s · rect-center=${x} · nodes=3 · instances=10000 · pixel=234,88,12,255`,
    );
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · rect-center=108");
  expect(pageErrors).toEqual([]);
});

test("非法时间不能产生 PASS 场景", async ({ page }) => {
  await page.goto("/test/scene-core.html?time=NaN");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "fail");
});

test("正式 Scene 矩形和圆角折线保持半透明层序", async ({ page }) => {
  await page.goto("/test/scene-core.html");
  const result = await page.evaluate(async () => {
    const core = await import("/target/js/motion/calcit.core.mjs");
    const ir = await import("/target/js/motion/quamolit.scene-ir.mjs");
    const motion = await import("/target/js/motion/quamolit.motion.mjs");
    const { draw_reference_$x_: draw } = await import("/target/js/motion/quamolit.canvas-reference.mjs");
    const tags = core.init_tags([
      "r",
      "g",
      "b",
      "a",
      "x",
      "y",
      "width",
      "height",
      "fill",
      "points",
      "stroke",
      "id",
      "key",
      "parent",
      "content",
      "bindings",
      "interaction",
      "none",
      "rect",
      "polyline",
      "nodes",
    ]);
    const record = (type, fields) =>
      core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([k, v]) => [tags[k], v]));
    const list = (xs) => new core.CalcitSliceList(xs);
    const variant = (type, tag, ...xs) => core._PCT__$o__$o_(type, tags[tag], ...xs);
    const color = (r, g, b) => record(motion.ColorRgba, { r, g, b, a: 0.5 });
    const rect = record(ir.RectNode, { x: 8, y: 8, width: 40, height: 40, fill: color(1, 0, 0) });
    const path = record(ir.PolylineNode, {
      points: list(
        [
          [10, 32],
          [32, 12],
          [52, 32],
        ].map(([x, y]) => record(motion.Vec2, { x, y })),
      ),
      width: 12,
      stroke: color(0, 0, 1),
    });
    const node = (id, kind, value) =>
      record(ir.SceneNode, {
        id,
        key: id,
        parent: "",
        content: variant(ir.SceneContent, kind, value),
        bindings: list([]),
        interaction: variant(ir.SceneInteraction, "none"),
      });
    const nodes = [node("red", "rect", rect), node("blue", "polyline", path)];
    const canvas = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      return c;
    };
    const actual = canvas(),
      expected = canvas(),
      reversed = canvas();
    draw(actual.getContext("2d"), record(ir.SceneDocument, { nodes: list(nodes) }));
    draw(reversed.getContext("2d"), record(ir.SceneDocument, { nodes: list([...nodes].reverse()) }));
    const ctx = expected.getContext("2d");
    ctx.fillStyle = "rgba(255,0,0,0.5)";
    ctx.fillRect(8, 8, 40, 40);
    ctx.strokeStyle = "rgba(0,0,255,0.5)";
    ctx.lineWidth = 12;
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(10, 32);
    ctx.lineTo(32, 12);
    ctx.lineTo(52, 32);
    ctx.stroke();
    const pixels = (c) => c.getContext("2d").getImageData(0, 0, 64, 64).data;
    const a = pixels(actual),
      e = pixels(expected),
      r = pixels(reversed);
    return {
      maxError: Math.max(...a.map((v, i) => Math.abs(v - e[i]))),
      reorderedChannels: a.filter((v, i) => v !== r[i]).length,
    };
  });
  expect(result.maxError).toBe(0);
  expect(result.reorderedChannels).toBeGreaterThan(100);
});
