import assert from "node:assert/strict";
import { test } from "node:test";
import {
  _PCT__$o__$o_ as enumValue,
  init_tags as initTags,
  option_$o_unwrap as unwrapOption,
  to_js_data as toJsData,
} from "../target/js/motion/calcit.core.mjs";
import { instance_presence_document as instanceDocument } from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import {
  close_presence_resources as closeResources,
  initial_presence_resources as initialResources,
  instance_resource_identity as instanceResourceIdentity,
  ready_presence_resource as readyResource,
  rebuild_presence_resources as rebuildResources,
  sync_presence_resources as syncResources,
} from "../target/js/motion/quamolit.presence-resource-registry.mjs";
import {
  close_presence_gpu_host_$x_ as closeGpuHost,
  complete_presence_load_$x_ as completeLoad,
  complete_queued_presence_load_$x_ as completeQueuedLoad,
  draw_presence_buffer_$x_ as drawBuffer,
  enqueue_presence_load as enqueuePresenceLoad,
  execute_presence_device_action_$x_ as executeDeviceAction,
  execute_presence_resource_action_$x_ as executeAction,
  initial_presence_gpu_host as initialGpuHost,
  presence_load_request as presenceLoadRequest,
  presence_gpu_metrics as gpuMetrics,
  run_presence_load_request_$x_ as runLoadRequest,
  run_presence_load_task_$x_ as runLoadTask,
} from "../target/js/motion/quamolit.presence-webgpu-resources.mjs";
import {
  ResourceLoadPriority,
  cancel_stale_device_loads as cancelStaleDeviceLoads,
  initial_load_queue as initialLoadQueue,
  load_queue_metrics as loadQueueMetrics,
  take_load as takeLoad,
} from "../target/js/motion/quamolit.resource-load-queue.mjs";
import {
  close as closeCoordinator,
  create_resolved as coordinatorCreateResolved,
  device_lost as coordinatorDeviceLost,
  initial_state as initialCoordinator,
  probe_resolved as coordinatorProbeResolved,
  request_open as coordinatorRequestOpen,
  resource_ready as coordinatorResourceReady,
  sync_presence as syncCoordinator,
} from "../target/js/motion/quamolit.presence-device-coordinator.mjs";
import {
  create_ready as createReady,
  probe_ready as probeReady,
} from "../target/js/motion/quamolit.device-recovery.mjs";
import {
  create_table_$x_ as createTable,
  register_$x_ as registerSource,
} from "../target/js/motion/quamolit.instance-resource.mjs";
import { color } from "../target/js/motion/quamolit.webgpu-batches.mjs";
import { start_presence as start } from "../target/js/motion/quamolit.presence.mjs";

const tags = initTags([
  "actions",
  "host",
  "interactive",
  "outcome",
  "plan",
  "queue",
  "references",
  "resources",
  "source",
  "state",
  "task",
  "transition",
]);
const E = (type, variant, ...values) => enumValue(type, tags[variant], ...values);
const listValues = (list) => list.value.slice(list.start, list.end);
const stateOf = (transition) => transition.get(tags.state);
const actionsOf = (transition) => listValues(transition.get(tags.actions));
const referencesOf = (resources) => resources.get(tags.plan).get(tags.references);
const sourceOf = (resources) => listValues(referencesOf(resources))[0].get(tags.source);

function mockGpu({ writeError, pipelineGate } = {}) {
  const calls = { buffers: [], writes: [], draws: [], submits: 0, configurations: 0, unconfigurations: 0 };
  const context = {
    configure() {
      calls.configurations += 1;
    },
    unconfigure() {
      calls.unconfigurations += 1;
    },
    getCurrentTexture() {
      return { createView: () => ({}) };
    },
  };
  const canvas = {
    width: 320,
    height: 180,
    getContext(kind) {
      assert.equal(kind, "webgpu");
      return context;
    },
  };
  const device = {
    limits: { maxBufferSize: 80000 },
    queue: {
      writeBuffer(...args) {
        if (writeError) throw writeError;
        calls.writes.push(args);
      },
      submit(commands) {
        assert.equal(commands.length, 1);
        calls.submits += 1;
      },
    },
    createShaderModule() {
      return {};
    },
    async createRenderPipelineAsync() {
      if (pipelineGate) await pipelineGate;
      return { getBindGroupLayout: () => ({}) };
    },
    createBuffer(descriptor) {
      const buffer = {
        descriptor,
        destroyed: false,
        destroy() {
          this.destroyed = true;
        },
      };
      calls.buffers.push(buffer);
      return buffer;
    },
    createBindGroup() {
      return {};
    },
    createCommandEncoder() {
      return {
        beginRenderPass() {
          return {
            setPipeline() {},
            setBindGroup() {},
            setVertexBuffer() {},
            draw(...args) {
              calls.draws.push(args);
            },
            end() {},
          };
        },
        finish() {
          return {};
        },
      };
    },
  };
  return { canvas, device, calls };
}

async function applyActions(host, deviceGeneration, gpu, table, resources, actions) {
  for (const action of actions) {
    host = await executeAction(
      host,
      deviceGeneration,
      gpu.canvas,
      gpu.device,
      "bgra8unorm",
      table,
      referencesOf(resources),
      action,
    );
  }
  return host;
}

async function applyDeviceActions(host, activeDeviceGeneration, gpu, table, coordinatorState, actions) {
  const resources = coordinatorState.get(tags.resources);
  for (const action of actions) {
    host = await executeDeviceAction(
      host,
      activeDeviceGeneration,
      gpu.canvas,
      gpu.device,
      "bgra8unorm",
      table,
      referencesOf(resources),
      action,
    );
  }
  return host;
}

test("Presence registry 动作创建、安装、绘制并在 device rebuild 后替换真实 WebGPU batch", async () => {
  const positions = new Float32Array(20000);
  positions[0] = 40;
  positions[1] = 50;
  const model = start(instanceDocument(7, true));
  let resources = initialResources(80000);
  let transition = syncResources(resources, model);
  resources = stateOf(transition);
  const load = actionsOf(transition);
  const descriptor = load[0].extra[0];
  const table = createTable();
  registerSource(table, sourceOf(resources), positions);

  const firstGpu = mockGpu();
  let host = await applyActions(initialGpuHost(), 1, firstGpu, table, resources, load);
  assert.deepEqual(toJsData(gpuMetrics(host)), {
    created: 1,
    released: 0,
    live: 1,
    "live-bytes": 80000,
    "uploaded-bytes": 80000,
  });
  assert.equal(firstGpu.calls.buffers.length, 2);
  assert.equal(firstGpu.calls.writes[0][4], 20000);

  transition = readyResource(resources, descriptor, 1);
  resources = stateOf(transition);
  host = await applyActions(host, 1, firstGpu, table, resources, actionsOf(transition));
  const drawn = toJsData(drawBuffer(host, descriptor, 2, 2, color(234 / 255, 88 / 255, 12 / 255, 1), 1));
  assert.equal(drawn.instances, 10000);
  assert.deepEqual(firstGpu.calls.draws, [[6, 10000, 0, 0]]);

  transition = rebuildResources(resources);
  resources = stateOf(transition);
  const rebuiltActions = actionsOf(transition);
  assert.deepEqual(
    rebuiltActions.map((action) => toJsData(action)[2][0]),
    ["release", "load"],
  );
  const secondGpu = mockGpu();
  host = await applyActions(host, 2, secondGpu, table, resources, rebuiltActions);
  assert.ok(firstGpu.calls.buffers.every((buffer) => buffer.destroyed));
  assert.equal(firstGpu.calls.unconfigurations, 1);
  assert.equal(secondGpu.calls.buffers.length, 2);
  assert.deepEqual(toJsData(gpuMetrics(host)), {
    created: 2,
    released: 1,
    live: 1,
    "live-bytes": 80000,
    "uploaded-bytes": 160000,
  });

  // 旧设备迟到完成只释放旧 generation，不得碰到新设备 generation 3。
  host = await applyActions(host, 2, secondGpu, table, resources, actionsOf(readyResource(resources, descriptor, 1)));
  assert.equal(toJsData(gpuMetrics(host)).live, 1);
  transition = readyResource(resources, descriptor, 3);
  resources = stateOf(transition);
  host = await applyActions(host, 2, secondGpu, table, resources, actionsOf(transition));
  assert.equal(toJsData(drawBuffer(host, descriptor, 2, 2, color(1, 0, 0, 1), 1)).instances, 10000);

  transition = closeResources(resources);
  resources = stateOf(transition);
  host = await applyActions(host, 2, secondGpu, table, resources, actionsOf(transition));
  host = closeGpuHost(host);
  assert.deepEqual(toJsData(gpuMetrics(host)), {
    created: 2,
    released: 2,
    live: 0,
    "live-bytes": 0,
    "uploaded-bytes": 160000,
  });
  assert.ok(secondGpu.calls.buffers.every((buffer) => buffer.destroyed));
  assert.equal(secondGpu.calls.unconfigurations, 1);
});

test("100 次 device rebuild 始终只有一个实际 WebGPU batch，关闭后回到零", async () => {
  const positions = new Float32Array(20000);
  const model = start(instanceDocument(9, true));
  let resources = initialResources(80000);
  let transition = syncResources(resources, model);
  resources = stateOf(transition);
  const descriptor = actionsOf(transition)[0].extra[0];
  const table = createTable();
  registerSource(table, sourceOf(resources), positions);
  const devices = [mockGpu()];
  let host = await applyActions(initialGpuHost(), 1, devices[0], table, resources, actionsOf(transition));
  transition = readyResource(resources, descriptor, 1);
  resources = stateOf(transition);
  host = await applyActions(host, 1, devices[0], table, resources, actionsOf(transition));

  for (let cycle = 1; cycle <= 100; cycle += 1) {
    transition = rebuildResources(resources);
    resources = stateOf(transition);
    const actions = actionsOf(transition);
    const generation = actions.find((action) => action.extra[1].tag.value === "load").extra[1].extra[0];
    const gpu = mockGpu();
    devices.push(gpu);
    host = await applyActions(host, cycle + 1, gpu, table, resources, actions);
    transition = readyResource(resources, descriptor, generation);
    resources = stateOf(transition);
    host = await applyActions(host, cycle + 1, gpu, table, resources, actionsOf(transition));
    assert.deepEqual(toJsData(gpuMetrics(host)), {
      created: cycle + 1,
      released: cycle,
      live: 1,
      "live-bytes": 80000,
      "uploaded-bytes": (cycle + 1) * 80000,
    });
  }

  transition = closeResources(resources);
  resources = stateOf(transition);
  host = await applyActions(host, 101, devices.at(-1), table, resources, actionsOf(transition));
  assert.deepEqual(toJsData(gpuMetrics(host)), {
    created: 101,
    released: 101,
    live: 0,
    "live-bytes": 0,
    "uploaded-bytes": 8080000,
  });
  assert.ok(devices.every((gpu) => gpu.calls.buffers.every((buffer) => buffer.destroyed)));
  assert.ok(devices.every((gpu) => gpu.calls.unconfigurations === 1));
});

test("组合状态机动作自动关闭旧 GPU host、重建新 generation 并忽略旧设备动作", async () => {
  const positions = new Float32Array(20000);
  const model = start(instanceDocument(15, true));
  const table = createTable();
  let coordinator = initialCoordinator(80000, 1);
  let transition = syncCoordinator(coordinator, model);
  coordinator = stateOf(transition);
  const resources = coordinator.get(tags.resources);
  const source = sourceOf(resources);
  const descriptor = instanceResourceIdentity(source);
  registerSource(table, source, positions);

  transition = coordinatorRequestOpen(coordinator, 1);
  coordinator = stateOf(transition);
  transition = coordinatorProbeResolved(coordinator, 1, probeReady());
  coordinator = stateOf(transition);
  transition = coordinatorCreateResolved(coordinator, 1, createReady());
  coordinator = stateOf(transition);

  const firstGpu = mockGpu();
  let host = await applyDeviceActions(initialGpuHost(), 1, firstGpu, table, coordinator, actionsOf(transition));
  transition = coordinatorResourceReady(coordinator, 1, descriptor, 3);
  coordinator = stateOf(transition);
  host = await applyDeviceActions(host, 1, firstGpu, table, coordinator, actionsOf(transition));
  assert.equal(toJsData(gpuMetrics(host)).live, 1);

  transition = coordinatorDeviceLost(coordinator, 1, "simulated-loss");
  coordinator = stateOf(transition);
  host = await applyDeviceActions(host, 1, firstGpu, table, coordinator, actionsOf(transition));
  assert.equal(toJsData(gpuMetrics(host)).live, 0);
  assert.ok(firstGpu.calls.buffers.every((buffer) => buffer.destroyed));

  transition = coordinatorProbeResolved(coordinator, 2, probeReady());
  coordinator = stateOf(transition);
  transition = coordinatorCreateResolved(coordinator, 2, createReady());
  coordinator = stateOf(transition);
  const secondGpu = mockGpu();
  host = await applyDeviceActions(host, 2, secondGpu, table, coordinator, actionsOf(transition));
  transition = coordinatorResourceReady(coordinator, 2, descriptor, 5);
  coordinator = stateOf(transition);
  host = await applyDeviceActions(host, 2, secondGpu, table, coordinator, actionsOf(transition));
  assert.equal(toJsData(gpuMetrics(host)).live, 1);

  // 旧 device generation 的 release 不能释放第二代相同 identity 的 batch。
  const stale = coordinatorResourceReady(coordinator, 1, descriptor, 3);
  host = await applyDeviceActions(host, 2, secondGpu, table, coordinator, actionsOf(stale));
  assert.equal(toJsData(gpuMetrics(host)).live, 1);

  transition = closeCoordinator(coordinator);
  coordinator = stateOf(transition);
  host = await applyDeviceActions(host, 2, secondGpu, table, coordinator, actionsOf(transition));
  assert.deepEqual(toJsData(gpuMetrics(host)), {
    created: 2,
    released: 2,
    live: 0,
    "live-bytes": 0,
    "uploaded-bytes": 160000,
  });
});

function prepareCoordinatorLoad(id) {
  const positions = new Float32Array(20000);
  const model = start(instanceDocument(id, true));
  const table = createTable();
  let coordinator = initialCoordinator(80000, 1);
  coordinator = stateOf(syncCoordinator(coordinator, model));
  const resources = coordinator.get(tags.resources);
  registerSource(table, sourceOf(resources), positions);
  coordinator = stateOf(coordinatorRequestOpen(coordinator, 1));
  coordinator = stateOf(coordinatorProbeResolved(coordinator, 1, probeReady()));
  const ready = coordinatorCreateResolved(coordinator, 1, createReady());
  coordinator = stateOf(ready);
  const loadAction = actionsOf(ready).find((action) => toJsData(action)?.[2]?.[2]?.[0] === "load");
  assert.ok(loadAction, "新 device 安装后必须生成一个类型化 load request");
  return {
    coordinator,
    table,
    loadAction,
    request: unwrapOption(presenceLoadRequest(loadAction)),
  };
}

test("异步 load runner 成功后提交到最新 coordinator，再安装实际 batch", async () => {
  let { coordinator, table, request } = prepareCoordinatorLoad(21);
  const gpu = mockGpu();
  let host = initialGpuHost();
  const result = await runLoadRequest(
    host,
    1,
    gpu.canvas,
    gpu.device,
    "bgra8unorm",
    table,
    referencesOf(coordinator.get(tags.resources)),
    request,
  );
  const completion = completeLoad(host, coordinator, result);
  host = completion.get(tags.host);
  const transition = completion.get(tags.transition);
  coordinator = stateOf(transition);
  assert.deepEqual(
    actionsOf(transition).map((action) => toJsData(action)?.[2]?.[2]?.[0]),
    ["install", "wake-frame"],
  );
  assert.equal(toJsData(gpuMetrics(host)).live, 1);
  host = await applyDeviceActions(host, 1, gpu, table, coordinator, actionsOf(transition));
  assert.equal(toJsData(gpuMetrics(host)).live, 1);
  host = closeGpuHost(host);
  assert.ok(gpu.calls.buffers.every((buffer) => buffer.destroyed));
});

test("upload 抛错时 runner 销毁已创建 batch，并把失败提交给 registry", async () => {
  const { coordinator, table, request } = prepareCoordinatorLoad(22);
  const gpu = mockGpu({ writeError: new Error("upload exploded") });
  const host = initialGpuHost();
  const result = await runLoadRequest(
    host,
    1,
    gpu.canvas,
    gpu.device,
    "bgra8unorm",
    table,
    referencesOf(coordinator.get(tags.resources)),
    request,
  );
  const completion = completeLoad(host, coordinator, result);
  assert.deepEqual(toJsData(gpuMetrics(completion.get(tags.host))), {
    created: 0,
    released: 0,
    live: 0,
    "live-bytes": 0,
    "uploaded-bytes": 0,
  });
  const failureActions = actionsOf(completion.get(tags.transition)).map((action) => toJsData(action));
  assert.deepEqual(
    failureActions.map((action) => action[2][2][0]),
    ["release", "show-error", "wake-frame"],
  );
  assert.equal(failureActions[1][2][2][2], "upload exploded");
  assert.ok(gpu.calls.buffers.every((buffer) => buffer.destroyed));
  assert.equal(gpu.calls.unconfigurations, 1);
});

test("load 等待期间 device loss，任务完成时按最新状态丢弃并销毁孤立 batch", async () => {
  const { coordinator: loadingCoordinator, table, request } = prepareCoordinatorLoad(23);
  let releasePipeline;
  const pipelineGate = new Promise((resolve) => {
    releasePipeline = resolve;
  });
  const gpu = mockGpu({ pipelineGate });
  const host = initialGpuHost();
  const task = runLoadRequest(
    host,
    1,
    gpu.canvas,
    gpu.device,
    "bgra8unorm",
    table,
    referencesOf(loadingCoordinator.get(tags.resources)),
    request,
  );
  const latestCoordinator = stateOf(coordinatorDeviceLost(loadingCoordinator, 1, "lost-during-load"));
  releasePipeline();
  const result = await task;
  const completion = completeLoad(host, latestCoordinator, result);
  assert.equal(toJsData(gpuMetrics(completion.get(tags.host))).live, 0);
  assert.deepEqual(
    actionsOf(completion.get(tags.transition)).map((action) => toJsData(action)?.[2]?.[2]?.[0]),
    ["release"],
  );
  assert.ok(gpu.calls.buffers.every((buffer) => buffer.destroyed));
  assert.equal(gpu.calls.unconfigurations, 1);
});

test("Presence load action 经过有界队列启动并在 accepted 后安装 batch", async () => {
  let { coordinator, table, loadAction } = prepareCoordinatorLoad(24);
  let queue = initialLoadQueue(1, 4);
  const enqueued = unwrapOption(enqueuePresenceLoad(queue, loadAction, E(ResourceLoadPriority, "interactive")));
  queue = enqueued.get(tags.queue);
  const taken = takeLoad(queue);
  queue = taken.get(tags.queue);
  const task = unwrapOption(taken.get(tags.task));
  const gpu = mockGpu();
  let host = initialGpuHost();

  const result = await runLoadTask(
    host,
    1,
    gpu.canvas,
    gpu.device,
    "bgra8unorm",
    table,
    referencesOf(coordinator.get(tags.resources)),
    task,
  );
  const completion = completeQueuedLoad(host, coordinator, queue, result);
  queue = completion.get(tags.queue);
  host = completion.get(tags.host);
  const transition = completion.get(tags.transition);
  coordinator = stateOf(transition);

  assert.deepEqual(toJsData(loadQueueMetrics(queue)), {
    pending: 0,
    running: 0,
    "cancelled-running": 0,
    available: 1,
  });
  assert.deepEqual(
    actionsOf(transition).map((action) => toJsData(action)?.[2]?.[2]?.[0]),
    ["install", "wake-frame"],
  );
  assert.equal(toJsData(gpuMetrics(host)).live, 1);
  host = await applyDeviceActions(host, 1, gpu, table, coordinator, actionsOf(transition));
  closeGpuHost(host);
  assert.ok(gpu.calls.buffers.every((buffer) => buffer.destroyed));
});

test("队列切换 device generation 后，迟到 Presence 结果只销毁孤儿 batch", async () => {
  const { coordinator, table, loadAction } = prepareCoordinatorLoad(25);
  let queue = initialLoadQueue(1, 4);
  queue = unwrapOption(enqueuePresenceLoad(queue, loadAction, E(ResourceLoadPriority, "interactive"))).get(tags.queue);
  const taken = takeLoad(queue);
  queue = taken.get(tags.queue);
  const task = unwrapOption(taken.get(tags.task));
  let releasePipeline;
  const pipelineGate = new Promise((resolve) => {
    releasePipeline = resolve;
  });
  const gpu = mockGpu({ pipelineGate });
  const host = initialGpuHost();
  const pending = runLoadTask(
    host,
    1,
    gpu.canvas,
    gpu.device,
    "bgra8unorm",
    table,
    referencesOf(coordinator.get(tags.resources)),
    task,
  );

  queue = cancelStaleDeviceLoads(queue, 2);
  releasePipeline();
  const result = await pending;
  const completion = completeQueuedLoad(host, coordinator, queue, result);
  assert.deepEqual(toJsData(loadQueueMetrics(completion.get(tags.queue))), {
    pending: 0,
    running: 0,
    "cancelled-running": 0,
    available: 1,
  });
  assert.equal(toJsData(gpuMetrics(completion.get(tags.host))).live, 0);
  assert.equal(actionsOf(completion.get(tags.transition)).length, 0);
  assert.ok(gpu.calls.buffers.every((buffer) => buffer.destroyed));
  assert.equal(gpu.calls.unconfigurations, 1);
});
