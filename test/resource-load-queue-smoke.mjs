import assert from "node:assert/strict";
import { test } from "node:test";
import * as core from "../target/js/motion/calcit.core.mjs";
import {
  ResourceLoadPriority,
  cancel_resource_loads as cancelResourceLoads,
  cancel_stale_device_loads as cancelStaleDeviceLoads,
  enqueue_load as enqueueLoad,
  finish_load as finishLoad,
  initial_load_queue as initialQueue,
  load_queue_metrics as queueMetrics,
  take_load as takeLoad,
} from "../target/js/motion/quamolit.resource-load-queue.mjs";
import { ResourceKind, resource } from "../target/js/motion/quamolit.resource-lifecycle.mjs";

const tags = core.init_tags([
  "accepted",
  "background",
  "backpressured",
  "cancelled-running",
  "deduplicated",
  "device-generation",
  "discarded",
  "font",
  "id",
  "identity",
  "interactive",
  "normal",
  "outcome",
  "pending",
  "pipeline",
  "priority",
  "queue",
  "queued",
  "resource-generation",
  "running",
  "task",
  "texture",
  "token",
  "unknown",
  "version",
]);
const E = (type, variant, ...values) => core._PCT__$o__$o_(type, tags[variant], ...values);
const plain = core.to_js_data;
const unwrap = core.option_$o_unwrap;
const priority = (name) => E(ResourceLoadPriority, name);
const identity = (kind, id, version = 1) => resource(E(ResourceKind, kind), id, version);
const queueOf = (result) => result.get(tags.queue);
const outcomeOf = (result) => plain(result.get(tags.outcome));
const takeTask = (result) => unwrap(result.get(tags.task));
const metrics = (queue) => plain(queueMetrics(queue));

test("交互资源优先，等优先级保持 FIFO，且并发上限形成实际背压", () => {
  let queue = initialQueue(1, 4);
  queue = queueOf(enqueueLoad(queue, 1, identity("texture", "background"), 1, priority("background")));
  queue = queueOf(enqueueLoad(queue, 1, identity("font", "normal-a"), 1, priority("normal")));
  queue = queueOf(enqueueLoad(queue, 1, identity("font", "normal-b"), 1, priority("normal")));
  queue = queueOf(enqueueLoad(queue, 1, identity("pipeline", "interactive"), 1, priority("interactive")));

  let taken = takeLoad(queue);
  const first = takeTask(taken);
  assert.equal(first.get(tags.identity).get(tags.id), "interactive");
  queue = queueOf(taken);
  assert.deepEqual(metrics(queue), { pending: 3, running: 1, "cancelled-running": 0, available: 0 });
  assert.deepEqual(plain(takeLoad(queue).get(tags.task)), ["none"]);

  queue = queueOf(finishLoad(queue, first.get(tags.token)));
  taken = takeLoad(queue);
  const normalA = takeTask(taken);
  assert.equal(normalA.get(tags.identity).get(tags.id), "normal-a");
  queue = queueOf(finishLoad(queueOf(taken), normalA.get(tags.token)));
  assert.equal(takeTask(takeLoad(queue)).get(tags.identity).get(tags.id), "normal-b");
});

test("相同请求去重并提升优先级，不消耗第二个 token", () => {
  const descriptor = identity("texture", "atlas");
  let result = enqueueLoad(initialQueue(2, 4), 1, descriptor, 1, priority("background"));
  let queue = queueOf(result);
  const firstToken = plain(result.get(tags.outcome))[1].token;

  result = enqueueLoad(queue, 1, descriptor, 1, priority("interactive"));
  queue = queueOf(result);
  assert.equal(outcomeOf(result)[0], "deduplicated");
  const task = takeTask(takeLoad(queue));
  assert.equal(task.get(tags.token), firstToken);
  assert.equal(plain(task.get(tags.priority))[0], "interactive");
});

test("运行中资源被新版本取代后仍占槽，迟到完成只能 discarded", () => {
  const v1 = identity("texture", "atlas", 1);
  const v2 = identity("texture", "atlas", 2);
  let queue = queueOf(enqueueLoad(initialQueue(1, 4), 1, v1, 1, priority("normal")));
  let taken = takeLoad(queue);
  const oldTask = takeTask(taken);
  queue = queueOf(taken);

  queue = queueOf(enqueueLoad(queue, 1, v2, 2, priority("interactive")));
  assert.deepEqual(metrics(queue), { pending: 1, running: 1, "cancelled-running": 1, available: 0 });
  assert.deepEqual(plain(takeLoad(queue).get(tags.task)), ["none"]);

  const finished = finishLoad(queue, oldTask.get(tags.token));
  assert.equal(outcomeOf(finished)[0], "discarded");
  taken = takeLoad(queueOf(finished));
  assert.equal(takeTask(taken).get(tags.identity).get(tags.version), 2);
});

test("pending 上限拒绝新任务；显式资源取消和 device generation 切换均可判定迟到结果", () => {
  const atlas = identity("texture", "atlas");
  const font = identity("font", "ui-font");
  let queue = initialQueue(1, 1);
  queue = queueOf(enqueueLoad(queue, 1, atlas, 1, priority("normal")));
  let rejected = enqueueLoad(queue, 1, font, 1, priority("interactive"));
  assert.equal(outcomeOf(rejected)[0], "backpressured");
  assert.deepEqual(metrics(queueOf(rejected)), { pending: 1, running: 0, "cancelled-running": 0, available: 1 });

  let taken = takeLoad(queue);
  const task = takeTask(taken);
  queue = cancelResourceLoads(queueOf(taken), atlas);
  assert.equal(metrics(queue)["cancelled-running"], 1);
  queue = cancelStaleDeviceLoads(queue, 2);
  const finished = finishLoad(queue, task.get(tags.token));
  assert.equal(outcomeOf(finished)[0], "discarded");
  assert.equal(outcomeOf(finishLoad(queueOf(finished), 999))[0], "unknown");
});
