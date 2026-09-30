import assert from "node:assert/strict";
import { test } from "node:test";
import { init_tags as initTags, to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
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
  draw_presence_buffer_$x_ as drawBuffer,
  execute_presence_device_action_$x_ as executeDeviceAction,
  execute_presence_resource_action_$x_ as executeAction,
  initial_presence_gpu_host as initialGpuHost,
  presence_gpu_metrics as gpuMetrics,
} from "../target/js/motion/quamolit.presence-webgpu-resources.mjs";
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

const tags = initTags(["actions", "plan", "references", "resources", "source", "state"]);
const listValues = (list) => list.value.slice(list.start, list.end);
const stateOf = (transition) => transition.get(tags.state);
const actionsOf = (transition) => listValues(transition.get(tags.actions));
const referencesOf = (resources) => resources.get(tags.plan).get(tags.references);
const sourceOf = (resources) => listValues(referencesOf(resources))[0].get(tags.source);

function mockGpu() {
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
