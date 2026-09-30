import { expect, test } from "@playwright/test";

test("Scene 图片裁剪、90 度旋转与透明层序，1000 帧复用 GPU 资源", async ({ page }, testInfo) => {
  await page.goto("/test/instance-sources.html");
  const report = await page.evaluate(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return { result: "SKIP", reason: "adapter-unavailable" };
    if (
      adapter.info?.isFallbackAdapter ||
      adapter.isFallbackAdapter ||
      /swiftshader|software|llvmpipe/i.test(
        `${adapter.info?.vendor} ${adapter.info?.architecture} ${adapter.info?.description}`,
      )
    ) {
      return { result: "SKIP", reason: "software-adapter" };
    }
    const device = await adapter.requestDevice();
    const errors = [];
    device.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
    const core = await import("/target/js/motion/calcit.core.mjs");
    const scene = await import("/target/js/motion/quamolit.scene-ir.mjs");
    const motion = await import("/target/js/motion/quamolit.motion.mjs");
    const images = await import("/target/js/motion/quamolit.webgpu-images.mjs");
    const textures = await import("/target/js/motion/quamolit.webgpu-texture-runner.mjs");
    const lifecycle = await import("/target/js/motion/quamolit.resource-lifecycle.mjs");
    const queues = await import("/target/js/motion/quamolit.resource-load-queue.mjs");
    const canvasImages = await import("/target/js/motion/quamolit.canvas-images.mjs");
    const tags = core.init_tags([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "r",
      "g",
      "identity",
      "actions",
      "registry",
      "queue",
      "task",
      "host",
      "transition",
      "source",
      "matrix",
      "sx",
      "sy",
      "sw",
      "sh",
      "dx",
      "dy",
      "dw",
      "dh",
      "width",
      "height",
      "id",
      "version",
      "content",
      "image",
      "nodes",
      "key",
      "parent",
      "bindings",
      "interaction",
      "none",
    ]);
    const R = (type, fields) =>
      core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([key, value]) => [tags[key], value]));
    const L = (values) => new core.CalcitSliceList(values);
    const E = (type, tag, ...args) => core._PCT__$o__$o_(type, tags[tag], ...args);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="4" height="8" fill="red"/><rect x="4" width="4" height="8" fill="blue" fill-opacity="0.5"/></svg>';
    const descriptor = textures.texture_descriptor(
      "checker",
      1,
      `data:image/svg+xml,${encodeURIComponent(svg)}`,
      8,
      8,
      "rgba8unorm",
    );
    const identity = descriptor.get(tags.identity);
    const acquired = lifecycle.acquire_registry(lifecycle.initial_registry(256), identity, 256);
    const queued = textures.enqueue_texture_actions(queues.initial_load_queue(1, 4), 1, acquired.get(tags.actions));
    const taken = queues.take_load(queued.get(tags.queue));
    const loaded = await textures.run_texture_load_task_$x_(
      descriptor,
      device,
      core.option_$o_unwrap(taken.get(tags.task)),
    );
    const completion = textures.complete_texture_load_$x_(
      textures.initial_texture_resource_host(),
      acquired.get(tags.registry),
      taken.get(tags.queue),
      loaded,
    );
    const texture = core.option_$o_unwrap(textures.installed_texture(completion.get(tags.host), identity));
    const source = R(scene.ImageSource, { id: "checker", version: 1, width: 8, height: 8 });
    const matrix = (a, b, c, d, e, f) => R(scene.Matrix2D, { a, b, c, d, e, f });
    const image = (sx, transform) =>
      R(scene.ImageNode, { source, matrix: transform, sx, sy: 0, sw: 4, sh: 8, dx: 0, dy: 0, dw: 16, dh: 16 });
    const node = (id, content) =>
      R(scene.SceneNode, {
        id,
        key: id,
        parent: "",
        bindings: L([]),
        interaction: E(scene.SceneInteraction, "none"),
        content: E(scene.SceneContent, "image", content),
      });
    const document = R(scene.SceneDocument, {
      nodes: L([node("red", image(0, matrix(1, 0, 0, 1, 8, 8))), node("blue", image(4, matrix(0, 1, -1, 0, 32, 8)))]),
    });
    const canvas = window.document.createElement("canvas");
    canvas.width = canvas.height = 48;
    const host = images.create_$x_(canvas, device, navigator.gpu.getPreferredCanvasFormat(), 2);
    const view = matrix(1, 0, 0, 1, 0, 0);
    const clear = R(motion.ColorRgba, { r: 0, g: 0, b: 0, a: 1 });
    const draw = () => core.to_js_data(images.draw_document_$x_(host, document, () => texture, view, 48, 48, clear));
    try {
      const first = draw();
      let last;
      for (let frame = 0; frame < 1000; frame++) last = draw();
      await device.queue.onSubmittedWorkDone();
      const bitmap = await createImageBitmap(canvas);
      const capture = window.document.createElement("canvas");
      capture.width = capture.height = 48;
      const context = capture.getContext("2d");
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const points = [
        [12, 12],
        [20, 12],
        [28, 12],
        [4, 4],
      ];
      const pixels = points.map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data));
      const reference = window.document.createElement("canvas");
      reference.width = reference.height = 48;
      const referenceContext = reference.getContext("2d");
      referenceContext.fillStyle = "black";
      referenceContext.fillRect(0, 0, 48, 48);
      const sourceImage = new Image();
      sourceImage.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      await sourceImage.decode();
      canvasImages.draw_document_$x_(referenceContext, document, () => sourceImage);
      const referencePixels = points.map(([x, y]) => Array.from(referenceContext.getImageData(x, y, 1, 1).data));
      return {
        result: "PASS",
        adapter: {
          vendor: adapter.info.vendor,
          architecture: adapter.info.architecture,
          isFallbackAdapter: adapter.info.isFallbackAdapter,
        },
        pixels,
        referencePixels,
        first,
        last,
        errors,
      };
    } finally {
      await device.queue.onSubmittedWorkDone();
      images.dispose_$x_(host);
      const closed = lifecycle.close_registry(completion.get(tags.transition).get(tags.registry));
      textures.apply_texture_actions_$x_(completion.get(tags.host), closed.get(tags.actions));
      device.destroy();
    }
  });
  await testInfo.attach("image-scene-report", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  console.log(`Scene image report: ${JSON.stringify(report)}`);
  test.skip(report.result === "SKIP", JSON.stringify(report));
  expect(report.errors).toEqual([]);
  // Solid interiors; permit one channel level for 0.5-alpha conversion/rounding.
  const expected = [
    [255, 0, 0, 255],
    [127, 0, 128, 255],
    [0, 0, 128, 255],
    [0, 0, 0, 255],
  ];
  report.pixels.forEach((pixel, index) =>
    pixel.forEach((value, channel) => expect(Math.abs(value - expected[index][channel])).toBeLessThanOrEqual(1)),
  );
  report.pixels.forEach((pixel, index) =>
    pixel.forEach((value, channel) =>
      expect(Math.abs(value - report.referencePixels[index][channel])).toBeLessThanOrEqual(1),
    ),
  );
  expect(report.first).toMatchObject({ "draw-calls": 2, "uniform-bytes-uploaded": 160, "bind-groups-created": 2 });
  expect(report.last).toMatchObject({
    frames: 1001,
    "uniform-bytes-uploaded": 0,
    "pipelines-created": 1,
    "buffers-created": 1,
    "bind-groups-created": 2,
  });
});

test("Folding Fan 保持原动画，状态切换 GPU/Canvas 与暂停 resize", async ({ page }, testInfo) => {
  await page.goto("/examples/folding-fan/index.html?t=0&backend=webgpu");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await page.waitForFunction(
    () =>
      window.foldingFanDemo.snapshot().backend === "webgpu" ||
      document.querySelector("#message").textContent.includes("初始化失败"),
  );
  const initial = await page.evaluate(() => window.foldingFanDemo.snapshot());
  test.skip(initial.backend !== "webgpu" && /adapter 不可用|软件 GPU/.test(initial.error), initial.error);
  expect(initial.backend).toBe("webgpu");
  await page.evaluate(() => window.foldingFanDemo.clickToggle(0));
  for (const at of [0, 0.18, 0.36, 0.18]) {
    const state = await page.evaluate((time) => window.foldingFanDemo.seek(time), at);
    expect(state.slices).toHaveLength(24);
    expect(state.gpuMetrics["draw-calls"]).toBe(24);
    expect(state.gpuMetrics["bind-groups-created"]).toBe(24);
    await page.screenshot({ path: testInfo.outputPath(`fan-gpu-${at}.png`) });
  }
  const repeated = await page.evaluate(() => window.foldingFanDemo.seek(0.18));
  expect(repeated.gpuMetrics["uniform-bytes-uploaded"]).toBe(0);
  await page.setViewportSize({ width: 900, height: 600 });
  await expect.poll(() => page.evaluate(() => window.foldingFanDemo.snapshot().width)).toBe(900);
  const resized = await page.evaluate(() => window.foldingFanDemo.snapshot());
  expect(resized.time).toBe(0.18);
  expect(resized.model).toEqual(repeated.model);
  await page.selectOption("#backend", "canvas");
  await expect.poll(() => page.evaluate(() => window.foldingFanDemo.snapshot().backend)).toBe("canvas");
  expect(await page.evaluate(() => window.foldingFanDemo.snapshot().model)).toEqual(repeated.model);
});
