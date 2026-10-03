import assert from "node:assert/strict";
import { test } from "node:test";
import {
  init_tags as initTags,
  option_$o_unwrap as unwrapOption,
  to_js_data as toJsData,
  _$n__PCT__$M_ as struct,
} from "../target/js/folding-fan/calcit.core.mjs";
import {
  close_resource as closeResource,
  image_resource as imageResource,
  initial_state as initialState,
  request_resource as requestResource,
  initial_registry as initialRegistry,
  acquire_registry as acquireRegistry,
  release_registry as releaseRegistry,
  close_registry as closeRegistry,
  registry_metrics as registryMetrics,
} from "../target/js/folding-fan/quamolit.resource-lifecycle.mjs";
import {
  apply_image_actions as applyImageActions,
  complete_image_load as completeImageLoad,
  enqueue_image_actions as enqueueImageActions,
  image_descriptor as imageDescriptor,
  image_resource_metrics as imageMetrics,
  initial_image_resource_host as initialImageHost,
  installed_image as installedImage,
  run_image_load_task_$x_ as runImageLoadTask,
  apply_image_registry_actions as applyRegistryActions,
  enqueue_image_registry_actions as enqueueRegistryActions,
  complete_image_registry_load as completeRegistryLoad,
  installed_image_resource as installedImageResource,
  release_image_resource as releaseImageResource,
  QueuedImageLoadResult,
  ImageResourceHandle,
} from "../target/js/folding-fan/quamolit.image-resource-runner.mjs";
import {
  cancel_stale_device_loads as cancelStaleDeviceLoads,
  initial_load_queue as initialLoadQueue,
  take_load as takeLoad,
} from "../target/js/folding-fan/quamolit.resource-load-queue.mjs";

const tags = initTags([
  "actions",
  "host",
  "queue",
  "registry",
  "state",
  "task",
  "transition",
  "identity",
  "image",
  "installed?",
  "resource-generation",
  "handle",
  "outcome",
  "token",
]);
const plain = toJsData;
const stateOf = (transition) => transition.get(tags.state);
const actionsOf = (transition) => transition.get(tags.actions);

class MockImage {
  constructor() {
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this.src = "";
  }

  async decode() {
    if (this.src.includes("missing")) throw new Error("mock image missing");
    if (this.src.includes("wrong-size")) {
      this.naturalWidth = 320;
      this.naturalHeight = 200;
      return;
    }
    this.naturalWidth = 650;
    this.naturalHeight = 432;
  }
}

globalThis.Image = MockImage;

function enqueueTransition(queue, runtimeGeneration, transition) {
  return enqueueImageActions(queue, runtimeGeneration, actionsOf(transition)).get(tags.queue);
}

async function finishOne({ host, state, queue, url }) {
  const taken = takeLoad(queue);
  queue = taken.get(tags.queue);
  const task = unwrapOption(taken.get(tags.task));
  const identity = plain(task).identity;
  const descriptor = imageDescriptor(identity.id, identity.version, url, 650, 432);
  const result = await runImageLoadTask(descriptor, task);
  const completion = completeImageLoad(host, state, queue, result);
  return {
    host: completion.get(tags.host),
    queue: completion.get(tags.queue),
    transition: completion.get(tags.transition),
  };
}

test("真实图片任务经统一队列解码、安装并在关闭后回到 live=0", async () => {
  let state = initialState(imageResource("lotus", 1));
  let host = initialImageHost();
  let queue = initialLoadQueue(1, 4);
  const requested = requestResource(state, imageResource("lotus", 1));
  state = stateOf(requested);
  queue = enqueueTransition(queue, 1, requested);

  const finished = await finishOne({ host, state, queue, url: "https://example.test/lotus.jpg" });
  host = finished.host;
  queue = finished.queue;
  state = stateOf(finished.transition);
  host = applyImageActions(host, actionsOf(finished.transition));

  assert.equal(plain(state).phase[0], "ready");
  assert.equal(unwrapOption(installedImage(host)).naturalWidth, 650);
  assert.deepEqual(plain(imageMetrics(host)), {
    created: 1,
    released: 0,
    live: 1,
    "decoded-bytes": 650 * 432 * 4,
  });

  const closed = closeResource(state);
  host = applyImageActions(host, actionsOf(closed));
  assert.deepEqual(plain(imageMetrics(host)), {
    created: 1,
    released: 1,
    live: 0,
    "decoded-bytes": 650 * 432 * 4,
  });
});

test("解码失败和尺寸不符都进入 error，并释放失败句柄", async () => {
  for (const url of ["https://example.test/missing.jpg", "https://example.test/wrong-size.jpg"]) {
    let state = initialState(imageResource("lotus", 1));
    let host = initialImageHost();
    let queue = initialLoadQueue(1, 4);
    const requested = requestResource(state, imageResource("lotus", 1));
    state = stateOf(requested);
    queue = enqueueTransition(queue, 1, requested);
    const finished = await finishOne({ host, state, queue, url });
    host = applyImageActions(finished.host, actionsOf(finished.transition));
    state = stateOf(finished.transition);

    assert.equal(plain(state).phase[0], "error");
    assert.match(plain(state).phase[1], /mock image missing|image-size-mismatch/);
    assert.deepEqual(plain(imageMetrics(host)), {
      created: 1,
      released: 1,
      live: 0,
      "decoded-bytes": 0,
    });
  }
});

test("runtime generation 切换后，迟到图片只计为已创建并释放", async () => {
  let state = initialState(imageResource("lotus", 1));
  const host = initialImageHost();
  let queue = initialLoadQueue(1, 4);
  const requested = requestResource(state, imageResource("lotus", 1));
  state = stateOf(requested);
  queue = enqueueTransition(queue, 1, requested);
  const taken = takeLoad(queue);
  queue = taken.get(tags.queue);
  const task = unwrapOption(taken.get(tags.task));
  const result = await runImageLoadTask(imageDescriptor("lotus", 1, "https://example.test/lotus.jpg", 650, 432), task);
  queue = cancelStaleDeviceLoads(queue, 2);
  const completion = completeImageLoad(host, state, queue, result);

  assert.deepEqual(plain(imageMetrics(completion.get(tags.host))), {
    created: 1,
    released: 1,
    live: 0,
    "decoded-bytes": 650 * 432 * 4,
  });
  assert.equal(plain(stateOf(completion.get(tags.transition))).phase[0], "loading");
  assert.equal(plain(actionsOf(completion.get(tags.transition))).length, 0);
});

test("100 次图片装卸保持单句柄上限并最终 created=released", async () => {
  let state = initialState(imageResource("lotus", 0));
  let host = initialImageHost();
  let queue = initialLoadQueue(1, 4);

  for (let version = 1; version <= 100; version += 1) {
    const requested = requestResource(state, imageResource("lotus", version));
    state = stateOf(requested);
    host = applyImageActions(host, actionsOf(requested));
    queue = enqueueTransition(queue, 1, requested);
    const finished = await finishOne({
      host,
      state,
      queue,
      url: `https://example.test/lotus-${version}.jpg`,
    });
    host = applyImageActions(finished.host, actionsOf(finished.transition));
    state = stateOf(finished.transition);
    queue = finished.queue;
    assert.equal(plain(imageMetrics(host)).live, 1);
  }

  const closed = closeResource(state);
  host = applyImageActions(host, actionsOf(closed));
  assert.deepEqual(plain(imageMetrics(host)), {
    created: 100,
    released: 100,
    live: 0,
    "decoded-bytes": 100 * 650 * 432 * 4,
  });
});

const imageBytes = 650 * 432 * 4;
function registryRuntime(capacity = imageBytes * 2) {
  return { registry: initialRegistry(capacity), host: initialImageHost(), queue: initialLoadQueue(2, 4) };
}
function commitRegistry(runtime, transition) {
  runtime.registry = transition.get(tags.registry);
  runtime.host = applyRegistryActions(runtime.host, actionsOf(transition));
  runtime.queue = enqueueRegistryActions(runtime.queue, 1, actionsOf(transition)).get(tags.queue);
}
async function runRegistryTask(runtime, url = "https://example.test/lotus.jpg") {
  const taken = takeLoad(runtime.queue);
  runtime.queue = taken.get(tags.queue);
  const task = unwrapOption(taken.get(tags.task));
  const identity = plain(task).identity;
  return runImageLoadTask(imageDescriptor(identity.id, identity.version, url, 650, 432), task);
}
function completeRegistryTask(runtime, result) {
  const completed = completeRegistryLoad(runtime.host, runtime.registry, runtime.queue, result);
  runtime.host = completed.get(tags.host);
  runtime.queue = completed.get(tags.queue);
  const transition = completed.get(tags.transition);
  runtime.registry = transition.get(tags.registry);
  return plain(actionsOf(transition));
}

test("两张同 generation 图片独立安装、共享 lease、idle 重入和精确释放", async () => {
  const runtime = registryRuntime();
  const lotus = imageResource("lotus", 1),
    chart = imageResource("chart", 1);
  for (const identity of [lotus, lotus, chart])
    commitRegistry(runtime, acquireRegistry(runtime.registry, identity, imageBytes));
  const lotusResult = await runRegistryTask(runtime),
    chartResult = await runRegistryTask(runtime);
  assert.equal(plain(lotusResult).handle["resource-generation"], 1);
  assert.equal(plain(chartResult).handle["resource-generation"], 1);
  completeRegistryTask(runtime, chartResult);
  completeRegistryTask(runtime, lotusResult);
  const lotusImage = unwrapOption(installedImageResource(runtime.host, lotus));
  const chartImage = unwrapOption(installedImageResource(runtime.host, chart));
  assert.notEqual(lotusImage, chartImage);
  assert.equal(plain(registryMetrics(runtime.registry)).loads, 2);
  const beforeReplay = plain(imageMetrics(runtime.host));
  assert.deepEqual(completeRegistryTask(runtime, lotusResult), []);
  assert.deepEqual(plain(imageMetrics(runtime.host)), beforeReplay, "重复完成不计为新图片，也不释放活动图片");
  assert.equal(unwrapOption(installedImageResource(runtime.host, lotus)), lotusImage);
  for (let index = 0; index < 2; index++) commitRegistry(runtime, releaseRegistry(runtime.registry, lotus));
  assert.equal(plain(registryMetrics(runtime.registry)).idle, 1);
  commitRegistry(runtime, acquireRegistry(runtime.registry, lotus, imageBytes));
  assert.equal(plain(registryMetrics(runtime.registry)).loads, 2);
  assert.equal(unwrapOption(installedImageResource(runtime.host, lotus)), lotusImage);
  runtime.host = releaseImageResource(runtime.host, lotus, 999);
  assert.equal(plain(imageMetrics(runtime.host)).live, 2, "错误 generation 不误释放");
  runtime.host = releaseImageResource(runtime.host, lotus, 1);
  assert.deepEqual(plain(installedImageResource(runtime.host, lotus)), ["none"]);
  assert.equal(unwrapOption(installedImageResource(runtime.host, chart)), chartImage, "同代另一身份仍已安装");
  commitRegistry(runtime, closeRegistry(runtime.registry));
  commitRegistry(runtime, closeRegistry(runtime.registry));
  assert.deepEqual(plain(imageMetrics(runtime.host)), {
    created: 2,
    released: 2,
    live: 0,
    "decoded-bytes": imageBytes * 2,
  });
});

test("版本驱逐后的旧结果、关闭后的结果和 runtime 取消均不能复活图片", async () => {
  for (const mode of ["version", "closed", "cancelled"]) {
    const runtime = registryRuntime(imageBytes),
      old = imageResource("lotus", 1),
      next = imageResource("lotus", 2);
    commitRegistry(runtime, acquireRegistry(runtime.registry, old, imageBytes));
    const oldResult = await runRegistryTask(runtime);
    if (mode === "version") {
      commitRegistry(runtime, releaseRegistry(runtime.registry, old));
      commitRegistry(runtime, acquireRegistry(runtime.registry, next, imageBytes));
      completeRegistryTask(runtime, await runRegistryTask(runtime));
    } else if (mode === "closed") commitRegistry(runtime, closeRegistry(runtime.registry));
    else runtime.queue = cancelStaleDeviceLoads(runtime.queue, 2);
    const before = plain(runtime.registry);
    const actions = completeRegistryTask(runtime, oldResult);
    assert.deepEqual(plain(runtime.registry), before, "迟到完成不改变新代/关闭/取消后的 registry");
    assert.equal(
      actions.some((wrapped) => wrapped[2][0] === "wake-frame"),
      false,
    );
    assert.deepEqual(plain(installedImageResource(runtime.host, old)), ["none"]);
    if (mode === "version") assert.equal(unwrapOption(installedImageResource(runtime.host, next)).naturalWidth, 650);
    commitRegistry(runtime, closeRegistry(runtime.registry));
    assert.equal(plain(imageMetrics(runtime.host)).live, 0);
    assert.equal(plain(imageMetrics(runtime.host)).created, plain(imageMetrics(runtime.host)).released);
    assert.equal(plain(runtime.queue).running.length, 0);
  }
});

test("图片失败后原 identity 可重试，未知 token 不安装也不唤醒", async () => {
  const runtime = registryRuntime(),
    identity = imageResource("lotus", 1);
  commitRegistry(runtime, acquireRegistry(runtime.registry, identity, imageBytes));
  completeRegistryTask(runtime, await runRegistryTask(runtime, "https://example.test/missing.jpg"));
  assert.equal(plain(imageMetrics(runtime.host)).live, 0);
  commitRegistry(runtime, releaseRegistry(runtime.registry, identity));
  commitRegistry(runtime, acquireRegistry(runtime.registry, identity, imageBytes));
  completeRegistryTask(runtime, await runRegistryTask(runtime));
  assert.equal(unwrapOption(installedImageResource(runtime.host, identity)).naturalWidth, 650);
  const foreign = registryRuntime();
  commitRegistry(foreign, acquireRegistry(foreign.registry, imageResource("foreign", 1), imageBytes));
  const foreignResult = await runRegistryTask(foreign);
  assert.deepEqual(completeRegistryTask(runtime, foreignResult), []);
  assert.deepEqual(plain(installedImageResource(runtime.host, imageResource("foreign", 1))), ["none"]);
  assert.equal(plain(imageMetrics(runtime.host)).live, 1);
  commitRegistry(runtime, closeRegistry(runtime.registry));
  assert.deepEqual(plain(imageMetrics(runtime.host)), {
    created: 3,
    released: 3,
    live: 0,
    "decoded-bytes": imageBytes * 2,
  });
});

test("100 次 registry 图片版本替换有界，关闭后 created=released", async () => {
  const runtime = registryRuntime(imageBytes);
  let previous;
  for (let version = 1; version <= 100; version++) {
    if (previous) commitRegistry(runtime, releaseRegistry(runtime.registry, previous));
    previous = imageResource("lotus", version);
    commitRegistry(runtime, acquireRegistry(runtime.registry, previous, imageBytes));
    completeRegistryTask(runtime, await runRegistryTask(runtime));
    assert.equal(plain(imageMetrics(runtime.host)).live, 1);
    assert.equal(plain(registryMetrics(runtime.registry)).resident, 1);
  }
  commitRegistry(runtime, closeRegistry(runtime.registry));
  assert.deepEqual(plain(imageMetrics(runtime.host)), {
    created: 100,
    released: 100,
    live: 0,
    "decoded-bytes": imageBytes * 100,
  });
});

test("有效 token 但错误 identity/generation 的结果被拒绝，不推进队列或宿主", async () => {
  const runtime = registryRuntime();
  commitRegistry(runtime, acquireRegistry(runtime.registry, imageResource("lotus", 1), imageBytes));
  const result = await runRegistryTask(runtime);
  const handle = result.get(tags.handle);
  for (const [identity, generation, expected] of [
    [imageResource("foreign", 1), 1, /image-load-identity-mismatch/],
    [imageResource("lotus", 1), 99, /image-load-generation-mismatch/],
  ]) {
    const changed = struct(
      ImageResourceHandle,
      tags.identity,
      identity,
      tags["resource-generation"],
      generation,
      tags.image,
      handle.get(tags.image),
      tags["installed?"],
      false,
    );
    const forged = struct(
      QueuedImageLoadResult,
      tags.token,
      result.get(tags.token),
      tags.handle,
      changed,
      tags.outcome,
      result.get(tags.outcome),
    );
    assert.throws(() => completeRegistryLoad(runtime.host, runtime.registry, runtime.queue, forged), expected);
    assert.equal(plain(runtime.queue).running.length, 1);
    assert.equal(plain(imageMetrics(runtime.host)).created, 0);
  }
  completeRegistryTask(runtime, result);
  assert.equal(plain(imageMetrics(runtime.host)).live, 1);
  commitRegistry(runtime, closeRegistry(runtime.registry));
});
