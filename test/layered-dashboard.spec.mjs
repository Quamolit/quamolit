import { expect, test } from "@playwright/test";

test("真实嵌套看板整组退出只合成一次 alpha，乱序采样与重入连续", async ({ page }, testInfo) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const result = await page.evaluate(async () => {
    const base = "/target/js/layered-dashboard/";
    const app = await import(`${base}quamolit.examples.layered-dashboard.mjs`);
    const presence = await import(`${base}quamolit.presence.mjs`);
    const canvas = await import(`${base}quamolit.canvas-scene.mjs`);
    const scene = await import(`${base}quamolit.scene-ir.mjs`);
    const hit = await import(`${base}quamolit.scene-hit.mjs`);
    const core = await import(`${base}calcit.core.mjs`);
    const tags = core.init_tags(["nodes", "items", "alpha", "easing", "model", "released", "interaction", "target"]);
    const get = (value, key) => value.get(tags[key]);
    const source = app.scene_at(1, 1000, 700);
    const sourceNodes = get(source, "nodes");
    const document = source.assoc(
      tags.nodes,
      new core.CalcitSliceList(
        Array.from({ length: 28 }, (_, index) => {
          const node = sourceNodes.get(index);
          // Both inherited ancestor target and a nested explicit target must disappear on exit.
          return index === 1 || index === 23
            ? node.assoc(
                tags.interaction,
                core._PCT__$o__$o_(scene.SceneInteraction, tags.target, index === 1 ? "dashboard" : "bar"),
              )
            : node;
        }),
      ),
    );
    const background = document.assoc(tags.nodes, new core.CalcitSliceList([get(document, "nodes").get(0)]));
    const initial = presence.start_presence(document);
    const easing = get(get(get(initial, "items").get(0), "alpha"), "easing");
    const exiting = get(presence.reconcile_presence(initial, background, 0, 1, easing), "model");
    const before = core.to_js_data(exiting);
    const create = () => {
      const element = window.document.createElement("canvas");
      element.width = 1000;
      element.height = 700;
      return element.getContext("2d");
    };
    const draw = (context, scene) =>
      canvas.draw_document_$x_(context, scene, 1000, 700, () => {
        throw Error("unexpected image");
      });
    const frames = [1, 0, 0.5, 0.25, 0.75, 0.5].map((time) => {
      const actual = create(),
        expected = create(),
        isolated = create();
      const sampled = app.presence_scene_at(exiting, time);
      draw(actual, sampled);
      // Independent lifecycle reference: one root surface composite, not per-leaf fading.
      draw(expected, background);
      draw(isolated, document);
      expected.globalAlpha = 1 - time;
      expected.drawImage(isolated.canvas, 0, 0);
      const a = actual.getImageData(0, 0, 1000, 700).data;
      const b = expected.getImageData(0, 0, 1000, 700).data;
      const data = core.to_js_data(sampled);
      return {
        time,
        equal: a.every((value, index) => value === b[index]),
        opacity: data.nodes[1].content[1].opacity,
        nestedOpacity: data.nodes[24].content[1].opacity,
        disabled: data.nodes.slice(1).every((node) => node.interaction[0] === "disabled"),
        candidates: core.to_js_data(hit.compile_hit_plan(sampled)).candidates.length,
        image: actual.canvas.toDataURL(),
      };
    });
    const continuity = [0.25, 0.5, 0.75].map((time) => {
      const revived = presence.reconcile_presence(exiting, document, time, 1, easing);
      const oldScene = core.to_js_data(app.presence_scene_at(exiting, time));
      const newScene = core.to_js_data(app.presence_scene_at(get(revived, "model"), time));
      return {
        same:
          JSON.stringify(oldScene.nodes.map((node) => node.content)) ===
          JSON.stringify(newScene.nodes.map((node) => node.content)),
        released: core.to_js_data(get(revived, "released")).length,
        enabled: newScene.nodes.every((node) => node.interaction[0] !== "disabled"),
        hittable:
          core.to_js_data(hit.compile_hit_plan(app.presence_scene_at(get(revived, "model"), time))).candidates.length >
          0,
      };
    });
    const settled = presence.settle_presence(exiting, 1);
    return {
      frames,
      continuity,
      immutable: JSON.stringify(before) === JSON.stringify(core.to_js_data(exiting)),
      released: core.to_js_data(get(settled, "released")).length,
      secondRelease: core.to_js_data(get(presence.settle_presence(get(settled, "model"), 1), "released")).length,
      remaining: core.to_js_data(app.presence_scene_at(get(settled, "model"), 1)).nodes.length,
      initiallyHittable: core.to_js_data(hit.compile_hit_plan(app.presence_scene_at(initial, 0))).candidates.length > 0,
    };
  });
  for (const frame of result.frames) {
    await testInfo.attach(`nested-presence-${frame.time}.png`, {
      body: Buffer.from(frame.image.split(",")[1], "base64"),
      contentType: "image/png",
    });
    expect(frame.equal, `isolated composite t=${frame.time}`).toBe(true);
    expect(frame.opacity).toBe(1 - frame.time);
    expect(frame.nestedOpacity).toBe(0.55);
    expect(frame.disabled).toBe(true);
    expect(frame.candidates).toBe(0);
  }
  expect(result.continuity).toEqual(Array(3).fill({ same: true, released: 0, enabled: true, hittable: true }));
  expect(result.initiallyHittable).toBe(true);
  expect(result.immutable).toBe(true);
  expect(result.released).toBe(27);
  expect(result.secondRelease).toBe(0);
  expect(result.remaining).toBe(1);
});

test("嵌套裁剪与隔离透明度可按确定时间截图", async ({ page }, testInfo) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=0");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  const at = (time) => page.evaluate((value) => window.layeredDashboardDemo.seek(value), time);
  expect((await at(0)).nodeCount).toBe(28);
  const background = await page
    .locator("canvas")
    .evaluate((canvas) =>
      Array.from(canvas.getContext("2d").getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data),
    );
  expect(background.slice(0, 3)).toEqual([6, 9, 18]);
  await at(0.5);
  const clipPixels = await page.locator("canvas").evaluate((canvas) => {
    const context = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 12;
    const scale = 0.93;
    const pixel = (x, y) => Array.from(context.getImageData(centerX + x * scale, centerY + y * scale, 1, 1).data);
    return { revealed: pixel(-80, 100), clipped: pixel(120, 100) };
  });
  expect(clipPixels.revealed).not.toEqual(clipPixels.clipped);
  expect(clipPixels.clipped.slice(0, 3)).toEqual([10, 14, 25]);
  await page.screenshot({ path: testInfo.outputPath("layered-dashboard-middle.png") });
  await at(1);
  const overlap = await page
    .locator("canvas")
    .evaluate((canvas) =>
      Array.from(canvas.getContext("2d").getImageData(canvas.width / 2 + 310, canvas.height / 2 - 190, 1, 1).data),
    );
  expect(overlap).toEqual([139, 56, 110, 255]);
  expect(overlap).not.toEqual([145, 110, 150, 255]); // 把 0.55 错乘到每个子节点会得到这一结果。
  await page.screenshot({ path: testInfo.outputPath("layered-dashboard-end.png") });
});

test("全屏 Canvas 与可收起 DOM 浮层保持状态", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=0.65");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  const before = await page.evaluate(() => window.layeredDashboardDemo.snapshot());
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeHidden();
  expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).time).toBe(before.time);
  expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
});
