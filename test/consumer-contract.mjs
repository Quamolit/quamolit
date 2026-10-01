import assert from "node:assert/strict";

// 摘要只读取现有报告；不执行测试，也不将 mock/缺失结果记为 GPU 通过。
export function formatConsumerSummary(report) {
  assert.ok(["PASS", "FAIL", "RUNNING", "NOT_RUN"].includes(report.result), "未知消费者结果");
  const checks = [
    ["线性矩形", report.gpuBrowser],
    ["双轴 smoothstep", report.gpuDualBrowser],
    ["单脏记录 10k", report.gpuInstancesBrowser],
    ["独立动画 10k", report.independentInstances?.browser],
  ];
  const counts = { PASS: 0, SKIP: 0, NOT_RUN: 0 };
  const text = (value) => String(value).replace(/[\\`|<>\r\n]/g, " ");
  const rows = checks.map(([name, evidence]) => {
    if (!evidence) {
      assert.notEqual(report.result, "PASS", `PASS 报告缺少硬件专项：${name}`);
      counts.NOT_RUN++;
      return `| ${name} | NOT_RUN | 无结果，不能视为通过 |`;
    }
    assert.ok(["PASS", "SKIP"].includes(evidence.result), `未知 GPU 结果：${name}`);
    counts[evidence.result]++;
    if (evidence.result === "SKIP") {
      assert.ok(typeof evidence.reason === "string" && evidence.reason.trim(), `SKIP 缺少原因：${name}`);
      return `| ${name} | SKIP | ${text(evidence.reason)} |`;
    }
    assert.ok(evidence.adapter && typeof evidence.adapter === "object", `GPU PASS 缺少 adapter：${name}`);
    assert.notEqual(evidence.adapter.isFallbackAdapter, true, `GPU PASS 不能使用软件 adapter：${name}`);
    const adapter = Object.values(evidence.adapter).filter(Boolean).join(" / ");
    assert.ok(adapter && !/swiftshader|software|llvmpipe/i.test(adapter), `GPU PASS 不能使用软件 adapter：${name}`);
    return `| ${name} | PASS | ${text(adapter)} |`;
  });
  return [
    "## 独立 Calcit 消费者关键链路",
    "",
    `安装/编译/搬移/语义门禁：${report.result}。硬件专项：PASS ${counts.PASS}，SKIP ${counts.SKIP}，未执行 ${counts.NOT_RUN}。`,
    "",
    "| GPU 专项 | 结果 | adapter / 原因 |",
    "| --- | --- | --- |",
    ...rows,
    "",
    "SKIP ≠ 硬件通过；原生设备 mock 不计硬件验收。GPU/GPU 帧通过也不证明 Canvas 中间帧等价，后者仍待 #144；本摘要不是性能报告。",
    "",
  ].join("\n");
}

// 独立于 Calcit sampler 的手算位置/颜色期望；同时检查真实对象身份。
export function verifyConsumer(app, core) {
  const tags = core.init_tags([
    "scene",
    "nodes",
    "slots",
    "declarations",
    "plan-builds",
    "binding-samples",
    "transform-samples",
    "transforms",
  ]);
  const field = (value, key) => value.get(tags[key]);
  const nodes = (plan) => field(field(plan, "scene"), "nodes");
  const rect = (plan) => core.to_js_data(field(plan, "scene")).nodes[1].content[1];
  let plan = app.start(0, 40, false, 100);
  const original = plan,
    fixed = nodes(plan).get(0),
    slots = field(plan, "slots");
  const ribbon = nodes(plan).get(2);
  const offset = (plan) => core.to_js_data(field(plan, "transforms"))[2].e;
  for (let frame = 1; frame <= 1000; frame++) {
    plan = app.update_plan(plan, frame / 1000, 40, false, 100);
    const expected = 80 + (40 * frame) / 1000;
    // lerp 的 (1-t)*from+t*to 与独立公式存在 IEEE754 运算顺序差异。
    // 仅给数值比较 8 ULP 预算；整数时间点与实色像素仍精确断言。
    assert.ok(Math.abs(rect(plan).x - expected) <= 8 * Number.EPSILON * Math.abs(expected));
    assert.equal(nodes(plan).get(0), fixed);
    assert.equal(field(plan, "slots"), slots);
    assert.equal(nodes(plan).get(2), ribbon);
    const expectedOffset = 20 + (10 * frame) / 1000;
    assert.ok(Math.abs(offset(plan) - expectedOffset) <= 8 * Number.EPSILON * Math.abs(expectedOffset));
  }
  const counts = {
    frames: 1000,
    declarations: field(plan, "declarations"),
    builds: field(plan, "plan-builds"),
    samples: field(plan, "binding-samples"),
  };
  assert.deepEqual(counts, { frames: 1000, declarations: 1, builds: 1, samples: 1001 });
  assert.equal(field(plan, "transform-samples"), 1001);
  counts.transformSamples = field(plan, "transform-samples");
  for (const [time, x] of [
    [1, 120],
    [0, 80],
    [0.5, 100],
    [0.25, 90],
    [1, 120],
  ]) {
    plan = app.update_plan(plan, time, 40, false, 100);
    assert.equal(rect(plan).x, x);
    assert.equal(offset(plan), 20 + 10 * time);
  }
  const repeated = app.update_plan(plan, 1, 40, false, 100);
  assert.equal(field(plan, "scene"), field(repeated, "scene"));
  assert.equal(field(plan, "transforms"), field(repeated, "transforms"));
  plan = app.update_plan(plan, 1, 41, false, 100);
  assert.equal(rect(plan).y, 63);
  assert.equal(offset(plan), 31);
  plan = app.update_plan(plan, 1, 41, true, 100);
  assert.equal(rect(plan).fill.g, 0.7);
  plan = app.update_plan(plan, 1, 41, true, 200);
  assert.equal(rect(plan).width, 20);
  assert.equal(field(plan, "declarations"), 4);
  for (const bad of [NaN, Infinity, -Infinity])
    assert.throws(() => app.update_plan(plan, bad, 41, true, 200), /invalid-component-request/);
  assert.equal(rect(original).x, 80);
  assert.equal(app.browser_available_$q_(), false, "依赖的 :file 片段在 Node 环境运行");
  return counts;
}
