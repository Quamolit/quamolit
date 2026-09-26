import assert from "node:assert/strict";
import { test } from "node:test";
import * as core from "../target/js/binary-tree/calcit.core.mjs";
import * as tree from "../target/js/binary-tree/quamolit.examples.binary-tree.mjs";
import * as retained from "../target/js/binary-tree/quamolit.retained-path.mjs";
const tags = core.init_tags(["scene", "props", "transforms", "samples", "skipped", "sample", "a", "nodes", "content"]);
const plain = core.to_js_data;

test("1000 帧保持静态 Scene、拓扑和局部几何身份，对照全量树的全部顶点", () => {
  const initial = tree.build_plan(0, 5);
  const scene = initial.get(tags.scene), props = initial.get(tags.props);
  const local = plain(scene).nodes;
  const nodes=scene.get(tags.nodes),geometry=nodes.get(0).get(tags.content).extra[0];
  for(let i=0;i<63;i++) assert.equal(nodes.get(i).get(tags.content).extra[0],geometry);
  let plan = initial, actualCalls = 0;
  const sampler = plan.get(tags.sample);
  plan = plan.assoc(tags.sample, (...args) => { actualCalls++; return sampler(...args); });
  for (let i = 0; i < 1000; i++) {
    const time = (i % 2 ? -1 : 1) * (i + 1) / 31;
    plan = retained.sample_plan_at(plan, time);
    assert.equal(plan.get(tags.scene), scene);
    assert.equal(plan.get(tags.props), props);
    const transforms = plain(plan.get(tags.transforms));
    const reference = plain(tree.scene_at(time, 5)).nodes;
    local.forEach((node, j) => {
      const m = transforms[j], path = node.content[1], expected = reference[j].content[1];
      assert.equal(node.id, reference[j].id);
      path.points.forEach((p, k) => {
        assert.ok(Math.abs(m.a*p.x + m.c*p.y + m.e - expected.points[k].x) < 1e-9);
        assert.ok(Math.abs(m.b*p.x + m.d*p.y + m.f - expected.points[k].y) < 1e-9);
      });
      assert.ok(Math.abs(path.width*Math.hypot(m.a,m.b)-expected.width) < 1e-10);
    });
  }
  assert.equal(actualCalls,1000);
  assert.equal(plan.get(tags.samples),1001);
  const repeated = retained.sample_plan_at(plan, -1000/31);
  assert.equal(repeated.get(tags.transforms),plan.get(tags.transforms));
  assert.equal(actualCalls,1000);
  assert.equal(repeated.get(tags.skipped),1);
  const rebuilt = tree.build_plan(-1000/31, 3);
  assert.equal(plain(rebuilt.get(tags.scene)).nodes.length,15);
  assert.notEqual(rebuilt.get(tags.scene),scene);
});

test("采样失败不污染旧计划，变换数量和有限性受检", () => {
  const plan = tree.build_plan(0,0);
  const before = plain(plan.get(tags.transforms));
  for (const time of [NaN,Infinity]) assert.throws(()=>retained.sample_plan_at(plan,time));
  assert.throws(()=>retained.sample_plan_at(plan.assoc(tags.sample,()=>new core.CalcitSliceList([])),1));
  const invalid = plan.get(tags.transforms).get(0).assoc(tags.a,NaN);
  assert.throws(()=>retained.sample_plan_at(plan.assoc(tags.sample,()=>new core.CalcitSliceList([invalid])),1));
  assert.deepEqual(plain(plan.get(tags.transforms)),before);
  for(const depth of [-1,9,1.5]) assert.throws(()=>tree.build_plan(0,depth));
});
