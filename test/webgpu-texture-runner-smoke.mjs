import assert from "node:assert/strict";
import { test } from "node:test";
import {
  init_tags as initTags,
  option_$o_unwrap as unwrapOption,
  to_js_data as toJsData,
} from "../target/js/motion/calcit.core.mjs";
import {
  acquire_registry as acquireRegistry,
  close_registry as closeRegistry,
  initial_registry as initialRegistry,
} from "../target/js/motion/quamolit.resource-lifecycle.mjs";
import {
  cancel_stale_device_loads as cancelStaleDeviceLoads,
  initial_load_queue as initialLoadQueue,
  take_load as takeLoad,
} from "../target/js/motion/quamolit.resource-load-queue.mjs";
import {
  apply_texture_actions_$x_ as applyTextureActions,
  complete_texture_load_$x_ as completeTextureLoad,
  enqueue_texture_actions as enqueueTextureActions,
  initial_texture_resource_host as initialTextureHost,
  installed_texture as installedTexture,
  rebuild_texture_device_$x_ as rebuildTextureDevice,
  run_texture_load_task_$x_ as runTextureLoadTask,
  texture_descriptor as textureDescriptor,
  texture_resource_bytes as textureResourceBytes,
  texture_resource_metrics as textureMetrics,
} from "../target/js/motion/quamolit.webgpu-texture-runner.mjs";

const tags = initTags(["actions", "host", "identity", "queue", "registry", "task", "transition"]);
const plain = toJsData;

class MockImage {
  constructor() {
    this.src = "";
    this.naturalWidth = 0;
    this.naturalHeight = 0;
  }

  async decode() {
    if (this.src.includes("missing")) throw new Error("mock image missing");
    this.naturalWidth = this.src.includes("wrong-size") ? 3 : 2;
    this.naturalHeight = 2;
  }
}

globalThis.Image = MockImage;

function mockDevice({ failUpload = false } = {}) {
  const textures = [];
  const copies = [];
  return {
    textures,
    copies,
    createTexture({ size, format, usage }) {
      const texture = {
        width: size.width,
        height: size.height,
        format,
        usage,
        destroyed: false,
        destroyCalls: 0,
        destroy() {
          this.destroyed = true;
          this.destroyCalls += 1;
        },
      };
      textures.push(texture);
      return texture;
    },
    queue: {
      copyExternalImageToTexture(source, destination, size) {
        if (failUpload) throw new Error("mock texture upload failed");
        copies.push({ source, destination, size });
      },
    },
  };
}

function beginLoad({ version = 1, url = "https://example.test/atlas.png", deviceGeneration = 1 } = {}) {
  const descriptor = textureDescriptor("atlas", version, url, 2, 2, "rgba8unorm");
  const identity = descriptor.get(tags.identity);
  let registry = initialRegistry(16);
  const acquired = acquireRegistry(registry, identity, textureResourceBytes(descriptor));
  registry = acquired.get(tags.registry);
  const queued = enqueueTextureActions(initialLoadQueue(1, 4), deviceGeneration, acquired.get(tags.actions));
  const taken = takeLoad(queued.get(tags.queue));
  return {
    descriptor,
    identity,
    registry,
    queue: taken.get(tags.queue),
    task: unwrapOption(taken.get(tags.task)),
    host: initialTextureHost(),
  };
}

async function finishLoad(state, device) {
  const result = await runTextureLoadTask(state.descriptor, device, state.task);
  const completion = completeTextureLoad(state.host, state.registry, state.queue, result);
  return {
    ...state,
    host: completion.get(tags.host),
    queue: completion.get(tags.queue),
    registry: completion.get(tags.transition).get(tags.registry),
  };
}

test("真实 texture 任务经队列创建、上传、安装并在 registry 关闭后销毁", async () => {
  const device = mockDevice();
  let state = await finishLoad(beginLoad(), device);

  assert.equal(device.textures.length, 1);
  assert.equal(device.copies.length, 1);
  assert.equal(unwrapOption(installedTexture(state.host, state.identity)), device.textures[0]);
  assert.deepEqual(plain(textureMetrics(state.host)), {
    created: 1,
    released: 0,
    live: 1,
    "live-bytes": 16,
    "uploaded-bytes": 16,
  });

  const closed = closeRegistry(state.registry);
  state.host = applyTextureActions(state.host, closed.get(tags.actions));
  assert.equal(device.textures[0].destroyed, true);
  assert.equal(device.textures[0].destroyCalls, 1);
  assert.deepEqual(plain(textureMetrics(state.host)), {
    created: 1,
    released: 1,
    live: 0,
    "live-bytes": 0,
    "uploaded-bytes": 16,
  });
});

test("解码、尺寸与上传失败都进入 error，已创建 texture 不泄漏", async () => {
  for (const [url, device, expectedCreated] of [
    ["https://example.test/missing.png", mockDevice(), 0],
    ["https://example.test/wrong-size.png", mockDevice(), 0],
    ["https://example.test/atlas.png", mockDevice({ failUpload: true }), 1],
  ]) {
    const state = await finishLoad(beginLoad({ url }), device);
    const entry = plain(state.registry).entries[0];
    assert.equal(entry.state.phase[0], "error");
    assert.deepEqual(plain(textureMetrics(state.host)), {
      created: expectedCreated,
      released: expectedCreated,
      live: 0,
      "live-bytes": 0,
      "uploaded-bytes": 0,
    });
    assert.equal(
      device.textures.every((texture) => texture.destroyed),
      true,
    );
  }
});

test("device generation 切换后迟到上传只销毁，不改变 registry", async () => {
  const device = mockDevice();
  const state = beginLoad();
  const result = await runTextureLoadTask(state.descriptor, device, state.task);
  state.queue = cancelStaleDeviceLoads(state.queue, 2);
  const completion = completeTextureLoad(state.host, state.registry, state.queue, result);

  assert.equal(plain(completion.get(tags.transition).get(tags.registry)).entries[0].state.phase[0], "loading");
  assert.deepEqual(plain(textureMetrics(completion.get(tags.host))), {
    created: 1,
    released: 1,
    live: 0,
    "live-bytes": 0,
    "uploaded-bytes": 16,
  });
  assert.equal(device.textures[0].destroyed, true);
});

test("100 次 device rebuild 保持 live=1，关闭后 created=released", async () => {
  const device = mockDevice();
  let state = await finishLoad(beginLoad(), device);

  for (let deviceGeneration = 2; deviceGeneration <= 101; deviceGeneration += 1) {
    const rebuilt = rebuildTextureDevice(state.host, state.registry, state.queue, deviceGeneration);
    state.host = rebuilt.get(tags.host);
    state.registry = rebuilt.get(tags.transition).get(tags.registry);
    const taken = takeLoad(rebuilt.get(tags.queue));
    state.queue = taken.get(tags.queue);
    state.task = unwrapOption(taken.get(tags.task));
    state = await finishLoad(state, device);
    assert.equal(plain(textureMetrics(state.host)).live, 1);
  }

  const closed = closeRegistry(state.registry);
  state.host = applyTextureActions(state.host, closed.get(tags.actions));
  assert.deepEqual(plain(textureMetrics(state.host)), {
    created: 101,
    released: 101,
    live: 0,
    "live-bytes": 0,
    "uploaded-bytes": 1616,
  });
  assert.equal(
    device.textures.every((texture) => texture.destroyCalls === 1),
    true,
  );
});
