import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/motion/calcit.core.mjs";
import { scene_document_at as sceneDocumentAt, scene_delta_at as sceneDeltaAt } from "../target/js/motion/quamolit.test.motion-fixture.mjs";
import { diff_scene as diffScene } from "../target/js/motion/quamolit.scene-diff.mjs";

test("typed Scene delta survives the JSON boundary and separates time from geometry", () => {
  const unchanged = toJsData(diffScene(sceneDocumentAt(0), sceneDocumentAt(0), 0, 1));
  assert.deepEqual(JSON.parse(JSON.stringify(unchanged)), { changes: [], "time-changed": true });

  const changed = toJsData(sceneDeltaAt(0, 0.5));
  assert.deepEqual(JSON.parse(JSON.stringify(changed)), changed);
  assert.equal(changed["time-changed"], true);
  assert.equal(changed.changes.length, 1);
  const [kind, entry, flags] = changed.changes[0];
  assert.equal(kind, "updated");
  assert.deepEqual(entry.path, [{ key: "root", kind: "group" }, { key: "badge", kind: "rect" }]);
  assert.equal(entry.node.content[1].x, 100);
  assert.deepEqual(flags, {
    bindings: false,
    geometry: true,
    interaction: false,
    order: false,
    properties: false,
    reference: false,
    resources: false,
  });
});
