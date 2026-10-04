import { expect, test } from "@playwright/test";

test("小数终点的公共 tween 可直接绘制严格 Scene，不需要下游 clamp (#213)", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/motion.html");
  const results = await page.evaluate(async () => {
    const core = await import("/target/js/motion/calcit.core.mjs");
    const motion = await import("/target/js/motion/quamolit.motion.mjs");
    const scene = await import("/target/js/motion/quamolit.scene-ir.mjs");
    const renderer = await import("/target/js/motion/quamolit.canvas-scene.mjs");
    const tags = core.init_tags([
      "start",
      "duration",
      "from",
      "to",
      "easing",
      "linear",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "r",
      "g",
      "x",
      "y",
      "width",
      "height",
      "fill",
      "id",
      "key",
      "parent",
      "bindings",
      "interaction",
      "content",
      "none",
      "group",
      "rect",
      "transform",
      "clip",
      "opacity",
      "nodes",
    ]);
    const struct = (type, fields) =>
      core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([key, value]) => [tags[key], value]));
    const en = (type, tag, ...values) => core._PCT__$o__$o_(type, tags[tag], ...values);
    const list = core.arrayToList;
    const matrix = struct(scene.Matrix2D, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    const black = struct(motion.ColorRgba, { r: 0, g: 0, b: 0, a: 1 });
    const canvas = document.querySelector("#frame");
    const context = canvas.getContext("2d");
    const results = [];
    for (const start of [0.3, 0.7, 1.1, 12.3, 59.9]) {
      for (const [from, to] of [
        [0, 1],
        [1, 0],
      ]) {
        const tween = struct(motion.ScalarTween, {
          start,
          duration: 0.25,
          from,
          to,
          easing: en(motion.Easing, "linear"),
        });
        for (const time of [start + 0.25, start, start + 0.125, start + 0.25]) {
          const opacity = motion.sample_tween(tween, time);
          const group = struct(scene.SceneNode, {
            id: "root",
            key: "root",
            parent: "",
            bindings: list([]),
            interaction: en(scene.SceneInteraction, "none"),
            content: en(
              scene.SceneContent,
              "group",
              struct(scene.GroupNode, { transform: matrix, clip: en(scene.ClipSpec, "none"), opacity }),
            ),
          });
          const rect = struct(scene.SceneNode, {
            id: "child",
            key: "child",
            parent: "root",
            bindings: list([]),
            interaction: en(scene.SceneInteraction, "none"),
            content: en(
              scene.SceneContent,
              "rect",
              struct(scene.RectNode, { x: 20, y: 20, width: 40, height: 40, fill: black }),
            ),
          });
          const document = struct(scene.SceneDocument, { nodes: list([group, rect]) });
          if (!scene.validate_scene(document)) throw new Error("invalid scene");
          context.clearRect(0, 0, canvas.width, canvas.height);
          renderer.draw_document_$x_(context, document, canvas.width, canvas.height, () => {
            throw new Error("no images");
          });
          const pixel = Array.from(context.getImageData(40, 40, 1, 1).data);
          results.push({ start, from, to, time, opacity, pixel });
        }
      }
    }
    return results;
  });
  expect(results).toHaveLength(40);
  for (const result of results) {
    expect(result.opacity).toBeGreaterThanOrEqual(0);
    expect(result.opacity).toBeLessThanOrEqual(1);
    if (result.time === result.start + 0.25) expect(result.opacity).toBe(result.to);
    expect(result.pixel.slice(0, 3)).toEqual([0, 0, 0]);
    expect(Math.abs(result.pixel[3] - Math.round(255 * result.opacity))).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});

test("Calcit Motion 标量与二维向量中间帧可乱序、倒退和重复采样", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/motion.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · value=15 · center=(128,100)");
  await expect(status).toContainText("GPU 候选: Vec2 tween");
  for (const [button, result] of [
    ["0.75s", "t=0.75s · value=17.5 · center=(168,110)"],
    ["0.25s", "t=0.25s · value=12.5 · center=(88,90)"],
    ["1s", "t=1s · value=20 · center=(208,120)"],
    ["1s", "t=1s · value=20 · center=(208,120)"],
  ]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(status).toContainText(result);
    await expect(status).toHaveAttribute("data-result", "pass");
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · value=15 · center=(128,100)");
  expect(pageErrors).toEqual([]);
});
