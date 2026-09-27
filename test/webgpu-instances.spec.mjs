import { expect, test } from "@playwright/test";

test("真实 WebGPU 消费 10k 同源实例，并可释放回退及重建", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/test/instance-sources.html");
  const gpu = page.locator("#gpu-status");
  await expect(gpu).toHaveAttribute("data-result", /ready|fallback|failed/);
  const result = await gpu.getAttribute("data-result");
  console.log(
    `WebGPU adapter: fallback=${await gpu.getAttribute("data-adapter-fallback")}, vendor=${await gpu.getAttribute("data-adapter-vendor")}, description=${await gpu.getAttribute("data-adapter-description")}, result=${result}`,
  );
  if (result === "fallback") {
    await expect(gpu).toContainText("Canvas 回退：");
    await expect(gpu).toHaveAttribute("data-live-layers", "0");
    await expect(page.locator("#gpu-scene")).toBeHidden();
    await expect(page.locator("#status")).toContainText("version=1 · nodes=3 · instances=10000");
  }
  test.skip(result === "fallback", `当前 Chromium 没有可用 WebGPU adapter：${await gpu.textContent()}`);
  await expect(gpu).toHaveAttribute("data-result", "ready");
  await expect(gpu).toHaveAttribute("data-live-layers", "1");
  await expect(gpu).toContainText("version=1 · draw=1 · instances=10000 · upload=80000");
  await expect(gpu).toContainText("pipeline=1 · buffers=2 · pixel=234,88,12,255");
  await page.locator("#v1").click();
  await expect(gpu).toContainText("version=1 · draw=1 · instances=10000 · upload=0 · copied=0");
  await page.locator("#v2").click();
  await expect(gpu).toContainText("version=2 · draw=1 · instances=10000 · upload=80000");
  await page.locator("#disable-gpu").click();
  await expect(gpu).toHaveAttribute("data-result", "fallback");
  await expect(gpu).toHaveAttribute("data-live-layers", "0");
  await expect(gpu).not.toContainText("释放错误");
  await expect(page.locator("#gpu-scene")).toBeHidden();
  await expect(page.locator("#status")).toContainText("version=2 · nodes=3 · instances=10000");
  await page.locator("#retry-gpu").click();
  await expect(gpu).toContainText("version=2 · draw=1 · instances=10000 · upload=80000");
  await expect(gpu).toHaveAttribute("data-result", "ready");
  await expect(gpu).toHaveAttribute("data-live-layers", "1");
  expect(errors).toEqual([]);
});

test("公共 Calcit 10k 实例脏区仅上传 8 B，并和 Canvas 像素一致", async ({ page }) => {
  await page.goto("/test/instance-sources.html?gpu=off");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  const result = await page.evaluate(async () => {
    const core = await import("/target/js/motion/calcit.core.mjs");
    const scene = await import("/target/js/motion/quamolit.scene-ir.mjs");
    const motion = await import("/target/js/motion/quamolit.motion.mjs");
    const resource = await import("/target/js/motion/quamolit.instance-resource.mjs");
    const gpu = await import("/target/js/motion/quamolit.instance-gpu.mjs");
    const batches = await import("/target/js/motion/quamolit.webgpu-batches.mjs");
    const reference = await import("/target/js/motion/quamolit.canvas-reference.mjs");
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return { result: "SKIP", reason: "adapter-unavailable" };
    const info = adapter.info ?? {};
    const adapterInfo = {
      vendor: info.vendor ?? "unknown",
      architecture: info.architecture ?? "unknown",
      device: info.device ?? "unknown",
      description: info.description ?? "unknown",
      isFallbackAdapter: Boolean(info.isFallbackAdapter || adapter.isFallbackAdapter),
    };
    if (adapterInfo.isFallbackAdapter || /software|swiftshader|llvmpipe/i.test(Object.values(adapterInfo).join(" "))) {
      return { result: "SKIP", reason: "software-adapter", adapter: adapterInfo };
    }
    const device = await adapter.requestDevice();
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 100;
    document.body.append(canvas);
    const tags = core.init_tags(["id", "version", "count", "source", "width", "height", "fill", "r", "g", "b", "a"]);
    const source = (version) =>
      core._$n__PCT__$M_(scene.InstanceSource, tags.id, "public-grid", tags.version, version, tags.count, 10000);
    const color = core._$n__PCT__$M_(motion.ColorRgba, tags.r, 0.917, tags.g, 0.345, tags.b, 0.047, tags.a, 1);
    const layer = (version) =>
      core._$n__PCT__$M_(
        scene.InstanceNode,
        tags.source,
        source(version),
        tags.width,
        3,
        tags.height,
        3,
        tags.fill,
        color,
      );
    const table = resource.create_table_$x_();
    const positions = new Float32Array(20000);
    for (let i = 0; i < 10000; i++) {
      positions[i * 2] = 400;
      positions[i * 2 + 1] = 400;
    }
    positions[0] = 40;
    positions[1] = 50;
    resource.register_$x_(table, source(1), positions);
    const format = navigator.gpu.getPreferredCanvasFormat();
    let batch;
    try {
      batch = await batches.create_$x_(canvas, device, format, 10000);
      const initial = core.to_js_data(gpu.draw_source_$x_(-1, batch, table, layer(1)));
      const at = async (x, y) => core.to_js_data(await batches.read_pixel_$x_(batch, x, y));
      const before = await at(41, 51);
      const copied = resource.register_patch_$x_(table, source(2), 1, 0, new Float32Array([60, 50]));
      const patched = core.to_js_data(gpu.draw_source_$x_(1, batch, table, layer(2)));
      const [oldPixel, newPixel] = await Promise.all([at(41, 51), at(61, 51)]);
      const referenceCanvas = document.createElement("canvas");
      referenceCanvas.width = 320;
      referenceCanvas.height = 100;
      const referenceContext = referenceCanvas.getContext("2d");
      referenceContext.fillStyle = "white";
      referenceContext.fillRect(0, 0, 320, 100);
      reference.draw_instances_$x_(referenceContext, layer(2), resource.resolve(table, source(2)));
      const referenceOld = Array.from(referenceContext.getImageData(41, 51, 1, 1).data);
      const referenceNew = Array.from(referenceContext.getImageData(61, 51, 1, 1).data);
      const warm = core.to_js_data(gpu.draw_source_$x_(2, batch, table, layer(2)));
      const copiedAgain = resource.register_patch_$x_(table, source(3), 2, 1, new Float32Array([80, 50]));
      const skipped = core.to_js_data(gpu.draw_source_$x_(1, batch, table, layer(3)));
      const [retainedPixel, addedPixel] = await Promise.all([at(61, 51), at(81, 51)]);
      referenceContext.fillStyle = "white";
      referenceContext.fillRect(0, 0, 320, 100);
      reference.draw_instances_$x_(referenceContext, layer(3), resource.resolve(table, source(3)));
      const referenceRetained = Array.from(referenceContext.getImageData(61, 51, 1, 1).data);
      const referenceAdded = Array.from(referenceContext.getImageData(81, 51, 1, 1).data);
      return {
        result: "PASS",
        adapter: adapterInfo,
        initial,
        copied,
        patched,
        warm,
        skipped,
        copiedAgain,
        before,
        oldPixel,
        newPixel,
        referenceOld,
        referenceNew,
        retainedPixel,
        addedPixel,
        referenceRetained,
        referenceAdded,
      };
    } finally {
      if (batch) batches.dispose_$x_(batch);
      device.destroy();
      canvas.remove();
    }
  });
  console.log(
    `公共实例脏区 GPU adapter=${JSON.stringify(result.adapter ?? null)} result=${result.result} initial=${result.initial?.["upload-bytes"]} patch=${result.patched?.["upload-bytes"]} skipped=${result.skipped?.["upload-bytes"]}`,
  );
  test.skip(result.result === "SKIP", JSON.stringify(result));
  expect(result.initial["upload-bytes"]).toBe(80000);
  expect(result.copied).toBe(8);
  expect(result.patched["upload-bytes"]).toBe(8);
  expect(result.patched.instances).toBe(10000);
  expect(result.warm["upload-bytes"]).toBe(0);
  expect(result.copiedAgain).toBe(8);
  expect(result.skipped["upload-bytes"]).toBe(80000);
  expect(result.before).toEqual({ r: 234, g: 88, b: 12, a: 255 });
  expect(result.oldPixel).toEqual({ r: 255, g: 255, b: 255, a: 255 });
  expect(result.newPixel).toEqual(result.before);
  expect([result.oldPixel.r, result.oldPixel.g, result.oldPixel.b, result.oldPixel.a]).toEqual(result.referenceOld);
  expect([result.newPixel.r, result.newPixel.g, result.newPixel.b, result.newPixel.a]).toEqual(result.referenceNew);
  expect([result.retainedPixel.r, result.retainedPixel.g, result.retainedPixel.b, result.retainedPixel.a]).toEqual(
    result.referenceRetained,
  );
  expect([result.addedPixel.r, result.addedPixel.g, result.addedPixel.b, result.addedPixel.a]).toEqual(
    result.referenceAdded,
  );
});
