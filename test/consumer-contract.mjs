import assert from "node:assert/strict";

// 独立于 Calcit sampler 的手算位置/颜色期望；同时检查真实对象身份。
export function verifyConsumer(app, core) {
  const tags = core.init_tags(["scene", "nodes", "slots", "declarations", "plan-builds", "binding-samples", "transform-samples", "transforms"]);
  const field = (value, key) => value.get(tags[key]);
  const nodes = plan => field(field(plan, "scene"), "nodes");
  const rect = plan => core.to_js_data(field(plan, "scene")).nodes[1].content[1];
  let plan = app.start(0, 40, false, 100);
  const original = plan, fixed = nodes(plan).get(0), slots = field(plan, "slots");
  const ribbon = nodes(plan).get(2);
  const offset = plan => core.to_js_data(field(plan,"transforms"))[2].e;
  for (let frame = 1; frame <= 1000; frame++) {
    plan = app.update_plan(plan, frame / 1000, 40, false, 100);
    const expected = 80 + 40 * frame / 1000;
    // lerp 的 (1-t)*from+t*to 与独立公式存在 IEEE754 运算顺序差异。
    // 仅给数值比较 8 ULP 预算；整数时间点与实色像素仍精确断言。
    assert.ok(Math.abs(rect(plan).x - expected) <= 8 * Number.EPSILON * Math.abs(expected));
    assert.equal(nodes(plan).get(0), fixed);
    assert.equal(field(plan, "slots"), slots);
    assert.equal(nodes(plan).get(2), ribbon);
    const expectedOffset=20+10*frame/1000;
    assert.ok(Math.abs(offset(plan)-expectedOffset)<=8*Number.EPSILON*Math.abs(expectedOffset));
  }
  const counts = { frames: 1000, declarations: field(plan, "declarations"), builds: field(plan, "plan-builds"), samples: field(plan, "binding-samples") };
  assert.deepEqual(counts, { frames: 1000, declarations: 1, builds: 1, samples: 1001 });
  assert.equal(field(plan,"transform-samples"),1001);
  counts.transformSamples=field(plan,"transform-samples");
  for (const [time, x] of [[1, 120], [0, 80], [0.5, 100], [0.25, 90], [1, 120]]) {
    plan = app.update_plan(plan, time, 40, false, 100);
    assert.equal(rect(plan).x, x);
    assert.equal(offset(plan),20+10*time);
  }
  const repeated = app.update_plan(plan, 1, 40, false, 100);
  assert.equal(field(plan, "scene"), field(repeated, "scene"));
  assert.equal(field(plan,"transforms"),field(repeated,"transforms"));
  plan = app.update_plan(plan, 1, 41, false, 100);
  assert.equal(rect(plan).y, 63);
  assert.equal(offset(plan),31);
  plan = app.update_plan(plan, 1, 41, true, 100);
  assert.equal(rect(plan).fill.g, 0.7);
  plan = app.update_plan(plan, 1, 41, true, 200);
  assert.equal(rect(plan).width, 20);
  assert.equal(field(plan, "declarations"), 4);
  for (const bad of [NaN, Infinity, -Infinity]) assert.throws(() => app.update_plan(plan, bad, 41, true, 200), /invalid-component-request/);
  assert.equal(rect(original).x, 80);
  assert.equal(app.browser_available_$q_(), false, "依赖的 :file 片段在 Node 环境运行");
  return counts;
}
