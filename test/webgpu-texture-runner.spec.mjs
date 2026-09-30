import { expect, test } from "@playwright/test";

test("Calcit texture runner 在两代 device 上上传同一像素并完整释放", async ({ page }) => {
  await page.goto("/test/instance-sources.html");
  const report = await page.evaluate(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return { result: "SKIP", reason: "adapter-unavailable" };

    const core = await import("/target/js/motion/calcit.core.mjs");
    const lifecycle = await import("/target/js/motion/quamolit.resource-lifecycle.mjs");
    const queueApi = await import("/target/js/motion/quamolit.resource-load-queue.mjs");
    const textures = await import("/target/js/motion/quamolit.webgpu-texture-runner.mjs");
    const tags = core.init_tags(["actions", "host", "identity", "queue", "registry", "task", "transition"]);
    const metrics = (host) => core.to_js_data(textures.texture_resource_metrics(host));
    const source = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#ff0000"/></svg>',
    );
    const descriptor = textures.texture_descriptor(
      "browser-red",
      1,
      `data:image/svg+xml;charset=utf-8,${source}`,
      2,
      2,
      "rgba8unorm",
    );
    const identity = descriptor.get(tags.identity);
    const errors = [];
    let registry = lifecycle.initial_registry(16);
    let host = textures.initial_texture_resource_host();
    let queue = queueApi.initial_load_queue(1, 4);
    const acquired = lifecycle.acquire_registry(registry, identity, textures.texture_resource_bytes(descriptor));
    registry = acquired.get(tags.registry);
    queue = textures.enqueue_texture_actions(queue, 1, acquired.get(tags.actions)).get(tags.queue);

    const readPixel = async (device, texture) => {
      const buffer = device.createBuffer({
        size: 264,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
      const encoder = device.createCommandEncoder();
      encoder.copyTextureToBuffer({ texture }, { buffer, bytesPerRow: 256 }, { width: 2, height: 2 });
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();
      await buffer.mapAsync(GPUMapMode.READ);
      const pixel = Array.from(new Uint8Array(buffer.getMappedRange()).slice(0, 4));
      buffer.unmap();
      buffer.destroy();
      return pixel;
    };
    const runOne = async (device) => {
      const taken = queueApi.take_load(queue);
      queue = taken.get(tags.queue);
      const task = core.option_$o_unwrap(taken.get(tags.task));
      const result = await textures.run_texture_load_task_$x_(descriptor, device, task);
      const completion = textures.complete_texture_load_$x_(host, registry, queue, result);
      queue = completion.get(tags.queue);
      host = completion.get(tags.host);
      registry = completion.get(tags.transition).get(tags.registry);
      return core.option_$o_unwrap(textures.installed_texture(host, identity));
    };

    let firstDevice;
    let secondDevice;
    try {
      firstDevice = await adapter.requestDevice();
      firstDevice.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
      const firstTexture = await runOne(firstDevice);
      const firstPixel = await readPixel(firstDevice, firstTexture);
      const firstMetrics = metrics(host);

      const rebuilt = textures.rebuild_texture_device_$x_(host, registry, queue, 2);
      host = rebuilt.get(tags.host);
      registry = rebuilt.get(tags.transition).get(tags.registry);
      queue = rebuilt.get(tags.queue);
      firstDevice.destroy();

      const secondAdapter = await navigator.gpu.requestAdapter();
      if (!secondAdapter) return { result: "SKIP", reason: "second-adapter-unavailable" };
      secondDevice = await secondAdapter.requestDevice();
      secondDevice.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
      const secondTexture = await runOne(secondDevice);
      const secondPixel = await readPixel(secondDevice, secondTexture);

      const closed = lifecycle.close_registry(registry);
      registry = closed.get(tags.registry);
      host = textures.apply_texture_actions_$x_(host, closed.get(tags.actions));
      return {
        result: "PASS",
        adapter: adapter.info ?? {},
        firstPixel,
        secondPixel,
        firstMetrics,
        finalMetrics: metrics(host),
        registry: core.to_js_data(lifecycle.registry_metrics(registry)),
        errors,
      };
    } finally {
      firstDevice?.destroy();
      secondDevice?.destroy();
    }
  });

  test.skip(report.result === "SKIP", JSON.stringify(report));
  expect(report.errors).toEqual([]);
  expect(report.firstPixel).toEqual([255, 0, 0, 255]);
  expect(report.secondPixel).toEqual(report.firstPixel);
  expect(report.firstMetrics).toEqual({
    created: 1,
    released: 0,
    live: 1,
    "live-bytes": 16,
    "uploaded-bytes": 16,
  });
  expect(report.finalMetrics).toEqual({
    created: 2,
    released: 2,
    live: 0,
    "live-bytes": 0,
    "uploaded-bytes": 32,
  });
  expect(report.registry).toMatchObject({ resident: 0, leased: 0, idle: 0, "resident-bytes": 0 });
});
