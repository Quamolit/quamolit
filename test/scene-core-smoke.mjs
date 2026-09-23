import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../js-out/calcit.core.mjs";
import { scene_document_at as sceneDocumentAt } from "../js-out/quamolit.test.motion-fixture.mjs";
import { validate_scene as validateScene } from "../js-out/quamolit.scene-ir.mjs";

test("typed Scene IR is valid and JSON-serializable without host handles", () => {
  for (const [time, x] of [[1, 120], [0, 80], [0.5, 100], [0.25, 90], [1, 120]]) {
    const document = sceneDocumentAt(time);
    assert.equal(validateScene(document), true);
    const plain = toJsData(document);
    const wire = JSON.parse(JSON.stringify(plain));
    assert.deepEqual(wire, plain);
    assert.equal(wire.nodes.length, 3);
    assert.deepEqual(wire.nodes.map((node) => node.id), ["root", "badge", "particles"]);
    assert.deepEqual(Object.keys(wire.nodes[1]), ["bindings", "content", "id", "interaction", "key", "parent"]);
    assert.equal(wire.nodes[1].content[0], "rect");
    assert.equal(wire.nodes[1].content[1].x, x);
    assert.equal(wire.nodes[1].interaction[1], "badge-click");
    assert.equal(wire.nodes[2].content[0], "instances");
    assert.deepEqual(wire.nodes[2].content[1].source, { count: 10000, id: "particles", version: 1 });
  }
});
