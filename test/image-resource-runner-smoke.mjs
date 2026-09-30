import assert from "node:assert/strict";
import { test } from "node:test";
import {
  init_tags as initTags,
  option_$o_unwrap as unwrapOption,
  to_js_data as toJsData,
} from "../target/js/folding-fan/calcit.core.mjs";
import {
  close_resource as closeResource,
  image_resource as imageResource,
  initial_state as initialState,
  request_resource as requestResource,
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
} from "../target/js/folding-fan/quamolit.image-resource-runner.mjs";
import {
  cancel_stale_device_loads as cancelStaleDeviceLoads,
  initial_load_queue as initialLoadQueue,
  take_load as takeLoad,
} from "../target/js/folding-fan/quamolit.resource-load-queue.mjs";

const tags = initTags(["actions", "host", "queue", "state", "task", "transition"]);
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
