import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export function verifyFontConsumer(app, core) {
  const tags = core.init_tags(["scene", "nodes", "content", "font", "slots", "transforms", "plan-builds"]);
  const spec = app.font_spec("QuamolitChineseFixture", 0);
  let plan = app.start_font(0, spec);
  const slots = plan.get(tags.slots);
  const textNode = plan.get(tags.scene).get(tags.nodes).get(0);
  for (const [time, x] of [
    [1, 60],
    [0, 20],
    [0.5, 40],
    [0.25, 30],
    [1, 60],
  ]) {
    plan = app.update_font(plan, time, spec);
    const text = core.to_js_data(plan.get(tags.scene)).nodes[0].content[1];
    assert.equal(text.x + core.to_js_data(plan.get(tags.transforms))[0].e, x);
    assert.equal(text.text, "图表收入");
    assert.equal(text.font.version, 0);
    assert.equal(plan.get(tags.slots), slots);
    assert.equal(plan.get(tags.scene).get(tags.nodes).get(0), textNode, "移动复用文字声明，不重建几何");
    assert.equal(plan.get(tags["plan-builds"]), 1);
  }
  const before = plan;
  for (let frame = 0; frame < 1000; frame++) {
    plan = app.update_font(plan, frame / 1000, spec);
    assert.equal(plan.get(tags.scene).get(tags.nodes).get(0), textNode);
    assert.equal(plan.get(tags["plan-builds"]), 1);
  }
  plan = app.update_font(plan, 1, app.font_spec("QuamolitChineseFixture", 1));
  assert.equal(plan.get(tags["plan-builds"]), 2, "同时间字体来源换版不可复用旧计划");
  assert.equal(core.to_js_data(plan.get(tags.scene)).nodes[0].content[1].font.version, 1);
  assert.equal(core.to_js_data(before.get(tags.scene)).nodes[0].content[1].font.version, 0);
  return { times: [1, 0, 0.5, 0.25, 1], transformFrames: 1000, buildsBeforeReady: 1, buildsAfterReady: 2 };
}

// 只驱动消费方 Calcit；不在测试 JS 中实现 FontSpec、文字声明或动画采样。
export async function verifyFontConsumerBrowser(page, artifacts) {
  const evidence = await page.evaluate(async () => {
    const app = await import("/target/js/app/app.main.mjs");
    const core = await import("/target/js/app/calcit.core.mjs");
    const tags = core.init_tags(["face"]);
    const spec = app.font_spec("QuamolitChineseFixture", 1);
    const result = await app.load_font_$x_(
      spec,
      "local('PingFangSC-Regular'), local('Noto Sans CJK SC'), local('WenQuanYi Zen Hei')",
    );
    if (core.to_js_data(result.get(0)) !== "ready") return { result: core.to_js_data(result) };
    const loaded = result.get(1),
      face = loaded.getRequired(tags.face);
    const autoInstalled = document.fonts.has(face);
    const stale = app.install_font_$x_(loaded, app.font_spec("QuamolitChineseFixture", 2));
    const afterStale = document.fonts.has(face);
    const installed = app.install_font_$x_(loaded, spec);
    const actual = document.createElement("canvas"),
      reference = document.createElement("canvas");
    actual.width = reference.width = 320;
    actual.height = reference.height = 180;
    document.body.append(actual);
    actual.id = "consumer-font-evidence";
    const a = actual.getContext("2d"),
      b = reference.getContext("2d");
    let released, failure;
    const frames = [];
    let plan = app.start_font(0, spec);
    try {
      failure = core.to_js_data(await app.load_font_$x_(spec, "not-a-font-source"));
      for (const time of [1, 0, 0.5, 0.25, 1]) {
        plan = app.update_font(plan, time, spec);
        app.draw_$x_(a, plan);
        b.clearRect(0, 0, 320, 180);
        b.font = '24px "QuamolitFont:1:QuamolitChineseFixture", monospace';
        b.textBaseline = "middle";
        b.fillStyle = "rgb(255,0,0)";
        b.fillText("图表收入", 20 + 40 * time, 50);
        const av = a.getImageData(0, 0, 320, 180).data,
          bv = b.getImageData(0, 0, 320, 180).data;
        let differences = 0,
          nonblank = 0;
        for (let i = 0; i < av.length; i++) {
          if (av[i] !== bv[i]) differences++;
          if (bv[i]) nonblank++;
        }
        frames.push({ time, differences, nonblank, png: actual.toDataURL("image/png") });
      }
      // 单独缺字负例：四个汉字都必须非空，且与同字体的缺字字形不同。
      const glyphs = ["图", "表", "收", "入", "\uFFFF"].map((text) => {
        b.clearRect(0, 0, 320, 180);
        b.fillText(text, 20, 50);
        return Array.from(b.getImageData(0, 0, 80, 100).data);
      });
      const glyphChecks = glyphs.slice(0, 4).map((pixels) => ({
        nonblank: pixels.some((value) => value !== 0),
        differsFromMissing: pixels.some((value, index) => value !== glyphs[4][index]),
      }));
      const missing = app.font_spec("QuamolitMissingFontNeverInstalled", 2);
      app.draw_$x_(a, app.update_font(plan, 1, missing));
      b.clearRect(0, 0, 320, 180);
      b.font = "24px monospace";
      b.fillText("图表收入", 60, 50);
      const av = a.getImageData(0, 0, 320, 180).data,
        bv = b.getImageData(0, 0, 320, 180).data;
      let fallbackDifferences = 0;
      for (let i = 0; i < av.length; i++) if (av[i] !== bv[i]) fallbackDifferences++;
      return {
        result: "PASS",
        autoInstalled,
        stale,
        afterStale,
        installed,
        failure,
        frames,
        glyphChecks,
        fallbackDifferences,
        status: face.status,
      };
    } finally {
      released = app.release_font_$x_(loaded);
      if (!released || document.fonts.has(face) || app.release_font_$x_(loaded))
        throw new Error("font-release-contract-failed");
    }
  });
  assert.equal(evidence.result, "PASS", JSON.stringify(evidence));
  assert.deepEqual(
    [evidence.autoInstalled, evidence.stale, evidence.afterStale, evidence.installed],
    [false, false, false, true],
  );
  assert.equal(evidence.status, "loaded");
  assert.equal(evidence.failure[0], "failed");
  assert.ok(evidence.failure[1].length > 0);
  assert.ok(evidence.frames.every((frame) => frame.differences === 0 && frame.nonblank > 0));
  assert.ok(
    evidence.glyphChecks.every((glyph) => glyph.nonblank && glyph.differsFromMissing),
    "中文不能以空白/缺字画面互比冒充通过",
  );
  assert.equal(evidence.fallbackDifferences, 0);
  for (const [index, frame] of evidence.frames.entries()) {
    if (artifacts) {
      frame.screenshot = `font-chinese-${index}-${frame.time}.png`;
      await writeFile(join(artifacts, frame.screenshot), Buffer.from(frame.png.split(",")[1], "base64"));
    }
    delete frame.png;
  }
  return evidence;
}

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
