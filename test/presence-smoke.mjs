import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { presence_frame_at as presenceFrameAt } from "../js-out/quamolit.test.motion-fixture.mjs";

const frame = (time, reenter = false) => toJsData(presenceFrameAt(time, reenter));
const ids = (value) => value.samples.map(({ entry }) => entry.node.id);

test("keyed list preserves identity on reorder and fades without paint-side state", () => {
  assert.deepEqual(ids(frame(0)), ["root", "b"]);
  assert.deepEqual(ids(frame(0.5)), ["root", "a", "b"]);
  assert.equal(frame(0.5).samples[1].alpha, 0.5);
  assert.equal(frame(0.5).samples[1].entry.path[1].key, "a");
  assert.deepEqual(ids(frame(0.75)), ["root", "b", "a"]);
  assert.equal(frame(0.75).samples[2].interactive, false);
  assert.equal(frame(0.875).samples[2].alpha, 0.75);
});

test("exit releases once; reentry cancels release and restores opacity", () => {
  const removed = frame(1.25);
  assert.deepEqual(ids(removed), ["root", "b"]);
  assert.deepEqual(removed.released.map(({ node }) => node.id), ["a"]);
  assert.equal(removed["needs-frame"], false);
  const revived = frame(1.375, true);
  assert.deepEqual(ids(revived), ["root", "b", "a"]);
  assert.equal(revived.samples[2].alpha, 1);
  assert.equal(revived.released.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(revived)), revived);
});
