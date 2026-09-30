import { expect, test } from "@playwright/test";

test("Presence registry 在新 device 上重建同一实例源并保持画面", async ({ page }) => {
  await page.goto("/test/instance-sources.html");
  const report = await page.evaluate(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return { result: "SKIP", reason: "adapter-unavailable" };
    const info = adapter.info ?? {};
    const adapterText = Object.values(info).join(" ");
    if (info.isFallbackAdapter || adapter.isFallbackAdapter || /swiftshader|software|llvmpipe/i.test(adapterText)) {
      return { result: "SKIP", reason: "software-adapter", adapter: info };
    }

    const core = await import("/target/js/motion/calcit.core.mjs");
    const fixture = await import("/target/js/motion/quamolit.test.motion-fixture.mjs");
    const presence = await import("/target/js/motion/quamolit.presence.mjs");
    const registry = await import("/target/js/motion/quamolit.presence-resource-registry.mjs");
    const gpuResources = await import("/target/js/motion/quamolit.presence-webgpu-resources.mjs");
    const instances = await import("/target/js/motion/quamolit.instance-resource.mjs");
    const batches = await import("/target/js/motion/quamolit.webgpu-batches.mjs");
    const tags = core.init_tags(["actions", "plan", "references", "source", "state"]);
    const list = (value) => value.value.slice(value.start, value.end);
    const stateOf = (transition) => transition.get(tags.state);
    const actionsOf = (transition) => list(transition.get(tags.actions));
    const referencesOf = (resources) => resources.get(tags.plan).get(tags.references);
    const sourceOf = (resources) => list(referencesOf(resources))[0].get(tags.source);
    const metrics = (host) => core.to_js_data(gpuResources.presence_gpu_metrics(host));
    const format = navigator.gpu.getPreferredCanvasFormat();
    const table = instances.create_table_$x_();
    const positions = new Float32Array(20000);
    positions[0] = 1;
    positions[1] = 1;
    let resources = registry.initial_presence_resources(80000);
    const model = presence.start_presence(fixture.instance_presence_document(12, true));
    let transition = registry.sync_presence_resources(resources, model);
    resources = stateOf(transition);
    const descriptor = actionsOf(transition)[0].extra[0];
    instances.register_$x_(table, sourceOf(resources), positions);

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const captured = document.createElement("canvas");
    captured.width = 64;
    captured.height = 64;
    const capturedContext = captured.getContext("2d");
    const errors = [];
    const apply = async (host, deviceGeneration, device, actions) => {
      for (const action of actions) {
        host = await gpuResources.execute_presence_resource_action_$x_(
          host,
          deviceGeneration,
          canvas,
          device,
          format,
          table,
          referencesOf(resources),
          action,
        );
      }
      return host;
    };
    const capture = async () => {
      const bitmap = await createImageBitmap(canvas);
      capturedContext.clearRect(0, 0, 64, 64);
      capturedContext.drawImage(bitmap, 0, 0);
      bitmap.close();
      return Array.from(capturedContext.getImageData(1, 1, 1, 1).data);
    };

    let firstDevice;
    let secondDevice;
    let host = gpuResources.initial_presence_gpu_host();
    try {
      firstDevice = await adapter.requestDevice();
      firstDevice.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
      host = await apply(host, 1, firstDevice, actionsOf(transition));
      transition = registry.ready_presence_resource(resources, descriptor, 1);
      resources = stateOf(transition);
      host = await apply(host, 1, firstDevice, actionsOf(transition));
      gpuResources.draw_presence_buffer_$x_(host, descriptor, 8, 8, batches.color(234 / 255, 88 / 255, 12 / 255, 1), 1);
      await firstDevice.queue.onSubmittedWorkDone();
      const before = await capture();

      firstDevice.destroy();
      secondDevice = await adapter.requestDevice();
      secondDevice.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
      transition = registry.rebuild_presence_resources(resources);
      resources = stateOf(transition);
      const rebuildActions = actionsOf(transition);
      const generation = rebuildActions.find((action) => action.extra[1].tag.value === "load").extra[1].extra[0];
      host = await apply(host, 2, secondDevice, rebuildActions);
      transition = registry.ready_presence_resource(resources, descriptor, generation);
      resources = stateOf(transition);
      host = await apply(host, 2, secondDevice, actionsOf(transition));
      gpuResources.draw_presence_buffer_$x_(host, descriptor, 8, 8, batches.color(234 / 255, 88 / 255, 12 / 255, 1), 1);
      await secondDevice.queue.onSubmittedWorkDone();
      const after = await capture();

      transition = registry.close_presence_resources(resources);
      resources = stateOf(transition);
      host = await apply(host, 2, secondDevice, actionsOf(transition));
      return { result: "PASS", adapter: info, before, after, metrics: metrics(host), errors };
    } finally {
      host = gpuResources.close_presence_gpu_host_$x_(host);
      firstDevice?.destroy();
      secondDevice?.destroy();
    }
  });

  test.skip(report.result === "SKIP", JSON.stringify(report));
  expect(report.errors).toEqual([]);
  expect(report.before).toEqual([234, 88, 12, 255]);
  expect(report.after).toEqual(report.before);
  expect(report.metrics).toEqual({
    created: 2,
    released: 2,
    live: 0,
    "live-bytes": 0,
    "uploaded-bytes": 160000,
  });
});
