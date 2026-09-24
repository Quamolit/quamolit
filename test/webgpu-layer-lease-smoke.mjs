import assert from "node:assert/strict";
import { test } from "node:test";
import { WebGpuLayerLease } from "../src/host/webgpu-layer-lease.mjs";

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function ready(lost = deferred()) {
  let state = "ready";
  let releases = 0;
  return {
    kind: "ready", adapter: { info: { vendor: "test", isFallbackAdapter: false } }, lost: lost.promise,
    get state() { return state; },
    get releases() { return releases; },
    release() { if (state === "released") return false; state = "released"; releases++; return true; },
    lose(info) { state = "lost"; lost.resolve(info); },
  };
}

test("100 mounts release layer and device with stable live count", async () => {
  const candidates = [];
  let disposed = 0;
  const lease = new WebGpuLayerLease({
    probe: async () => { const candidate = ready(); candidates.push(candidate); return candidate; },
    create: async () => ({ dispose() { disposed++; } }),
  });
  for (let i = 0; i < 100; i++) {
    assert.equal((await lease.open({})).kind, "ready");
    assert.deepEqual(lease.metrics, { created: i + 1, disposed: i, live: 1 });
    assert.equal(lease.close().live, 0);
    assert.equal(lease.close().released, false);
  }
  assert.equal(disposed, 100);
  assert(candidates.every((candidate) => candidate.releases === 1));
});

test("close invalidates pending probe/create and retry owns only new generation", async () => {
  const probe = deferred();
  const created = deferred();
  const first = ready();
  const second = ready();
  let disposed = 0;
  let calls = 0;
  const lease = new WebGpuLayerLease({
    probe: () => ++calls === 1 ? probe.promise : second,
    create: (candidate) => candidate === first ? created.promise : { dispose() { disposed++; } },
  });
  const stale = lease.open({});
  assert.equal(lease.open({}), stale, "concurrent open should share one probe");
  lease.close();
  probe.resolve(first);
  assert.equal((await stale).kind, "cancelled");
  assert.equal(first.releases, 1);
  assert.equal((await lease.open({})).kind, "ready");
  assert.equal(lease.close().live, 0);
  assert.equal(second.releases, 1);

  const third = ready();
  const createLease = new WebGpuLayerLease({ probe: async () => third, create: () => created.promise });
  const inFlight = createLease.open({});
  await Promise.resolve();
  createLease.close();
  created.resolve({ dispose() { disposed++; } });
  assert.equal((await inFlight).kind, "cancelled");
  assert.equal(third.releases, 1);
  assert.equal(disposed, 2);
  assert.equal(createLease.metrics.live, 0);
});

test("loss closes lease once and reports failure; software fallback is released", async () => {
  const candidate = ready();
  let losses = 0;
  let disposed = 0;
  const lease = new WebGpuLayerLease({
    probe: async () => candidate,
    create: async () => ({ dispose() { disposed++; } }),
    onLost(info, cleanup) { assert.equal(info.message, "test loss"); assert.equal(cleanup.live, 0); losses++; },
  });
  await lease.open({});
  candidate.lose({ reason: "unknown", message: "test loss" });
  await Promise.resolve();
  assert.equal(losses, 1);
  assert.equal(disposed, 1);
  assert.equal(candidate.releases, 1);

  const software = ready();
  software.adapter.info.isFallbackAdapter = true;
  const fallback = new WebGpuLayerLease({ probe: async () => software, create() { throw new Error("must not create"); } });
  assert.equal((await fallback.open({})).kind, "fallback");
  assert.equal(software.releases, 1);
  assert.equal(fallback.metrics.live, 0);
});

test("creation failure releases device and can retry without stale ownership", async () => {
  const first = ready();
  const second = ready();
  let probes = 0;
  let disposed = 0;
  const lease = new WebGpuLayerLease({
    probe: async () => ++probes === 1 ? first : second,
    create: async (candidate) => {
      if (candidate === first) throw new Error("pipeline failed");
      return { dispose() { disposed++; } };
    },
  });
  assert.deepEqual(await lease.open({}), { kind: "failed", stage: "create", message: "pipeline failed" });
  assert.equal(first.releases, 1);
  assert.equal(lease.metrics.live, 0);
  assert.equal((await lease.open({})).kind, "ready");
  assert.equal(lease.close().live, 0);
  assert.equal(disposed, 1);
  assert.equal(second.releases, 1);
});

test("dispose errors are reported and do not suppress device release", async () => {
  const candidate = ready();
  const lease = new WebGpuLayerLease({
    probe: async () => candidate,
    create: async () => ({ dispose() { throw new Error("dispose failed"); } }),
  });
  await lease.open({});
  const cleanup = lease.close();
  assert.deepEqual(cleanup.errors, ["dispose failed"]);
  assert.equal(cleanup.live, 1, "unknown disposal must remain visible as a possible leak");
  assert.equal(candidate.releases, 1);
});

test("old device loss cannot tear down a rebuilt layer", async () => {
  const first = ready();
  const second = ready();
  let probes = 0;
  let losses = 0;
  let disposed = 0;
  const lease = new WebGpuLayerLease({
    probe: async () => ++probes === 1 ? first : second,
    create: async () => ({ dispose() { disposed++; } }),
    onLost() { losses++; },
  });
  await lease.open({});
  lease.close();
  await lease.open({});
  first.lose({ reason: "unknown", message: "late" });
  await Promise.resolve();
  assert.equal(lease.capability, second);
  assert.equal(lease.metrics.live, 1);
  assert.equal(losses, 0);
  lease.close();
  assert.equal(disposed, 2);
});
