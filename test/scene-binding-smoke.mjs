import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { bound_scene_document_at as boundSceneDocumentAt, scene_document_at as sceneDocumentAt } from "../js-out/quamolit.test.motion-fixture.mjs";

test("Scene binding samples absolute time and retains serializable references", () => {
  for (const [time, expectedX] of [[1, 120], [0, 80], [0.5, 100], [-0.25, 80], [0.25, 90], [1, 120]]) {
    const bound = toJsData(boundSceneDocumentAt(time));
    const reference = toJsData(sceneDocumentAt(time));
    assert.deepEqual(bound.nodes.map((node) => node.content), reference.nodes.map((node) => node.content));
    assert.equal(bound.nodes[1].content[1].x, expectedX);
    assert.deepEqual(bound.nodes[1].bindings, [{ "motion-id": "badge-x", target: ["x"], version: 1 }]);
    assert.deepEqual(JSON.parse(JSON.stringify(bound)), bound);
  }
});
