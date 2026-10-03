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
  return { times: [1, 0, 0.5, 0.25, 1], transformFrames: 1000, buildsBeforeFontChange: 1, buildsAfterFontChange: 2 };
}

// 只驱动消费方 Calcit；不在测试 JS 中实现 FontSpec、文字声明或动画采样。
export async function verifyFontConsumerBrowser(page, artifacts) {
  const evidence = await page.evaluate(async () => {
    const app = await import("/target/js/app/app.main.mjs");
    const core = await import("/target/js/app/calcit.core.mjs");
    const tags = core.init_tags(["face"]);
    const spec = app.font_spec("QuamolitChineseFixture", 1);
    const source = "local('PingFangSC-Regular'), local('Noto Sans CJK SC'), local('WenQuanYi Zen Hei')";
    const result = await app.load_font_$x_(spec, source);
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
    let released, failure, sharedRegistry;
    const frames = [];
    let plan = app.start_font(0, spec);
    try {
      const nativeBefore = document.fonts.size;
      // 获取、共享、idle重入及close均由消费方Calcit完成；JS不实现registry/loader。
      const shared = core.to_js_data(await app.shared_font_cycle_$x_(spec, source));
      sharedRegistry = {
        accepted: shared.host.accepted,
        released: shared.host.released,
        live: shared.host.handles.length,
        loads: shared.transition.registry.loads,
        resident: shared.transition.registry.entries.length,
        running: shared.queue.running.length,
        nativeBefore,
        nativeAfter: document.fonts.size,
        originalRetained: document.fonts.has(face),
      };
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
        sharedRegistry,
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
  assert.deepEqual(
    Object.fromEntries(
      ["accepted", "released", "live", "loads", "resident", "running", "originalRetained"].map((key) => [
        key,
        evidence.sharedRegistry[key],
      ]),
    ),
    { accepted: 1, released: 1, live: 0, loads: 1, resident: 0, running: 0, originalRetained: true },
  );
  assert.equal(
    evidence.sharedRegistry.nativeBefore,
    evidence.sharedRegistry.nativeAfter,
    "共享字体close只删除自己的确切FontFace",
  );
  for (const [index, frame] of evidence.frames.entries()) {
    if (artifacts) {
      frame.screenshot = `font-chinese-${index}-${frame.time}.png`;
      await writeFile(join(artifacts, frame.screenshot), Buffer.from(frame.png.split(",")[1], "base64"));
    }
    delete frame.png;
  }
  return evidence;
}

// 声明、变换、裁剪、计划和查询均由独立消费者的 Calcit 调用公共模块。
export function verifyCurveConsumer(app, core) {
  let builds = 0,
    queries = 0;
  const sample = (time) => {
    const plan = app.curve_hit_plan(time);
    builds++;
    const hit = (x, y) => {
      queries++;
      return core.to_js_data(app.curve_hit(plan, x, y));
    };
    assert.deepEqual(hit(180, 100 + 20 * time), [
      "hit",
      {
        "node-id": "consumer-curve",
        target: "curve-action",
        visited: 1,
      },
    ]);
    assert.deepEqual(hit(140, 100 + 20 * time), ["miss", 1], "曲线内部空洞不应当作填充");
    assert.deepEqual(hit(78, 40 + 20 * time), ["miss", 1], "butt端点不扩张");
    assert.deepEqual(hit(160, 220), ["miss", 1], "祖先裁剪仍独立于绘制");
    return core.to_js_data(app.curve_document(time));
  };
  let previous;
  for (const time of [1, 0, 0.5, 0.25, 1]) {
    const scene = sample(time);
    assert.equal(scene.nodes[1].content[1].start.x, 20 + 10 * time);
    if (time === 1 && previous) assert.deepEqual(scene, previous);
    if (time === 1) previous = scene;
  }
  // time=3时末段确实在clip外，不能用未覆盖到该处的曲线冒充裁剪负例。
  const clipped = app.curve_hit_plan(3);
  builds++;
  assert.deepEqual(core.to_js_data(app.curve_hit(clipped, 120, 220)), ["miss", 1]);
  queries++;
  for (const bad of [NaN, Infinity, -Infinity])
    assert.throws(() => app.curve_hit_plan(bad), /invalid-consumer-curve-time/);
  return {
    builds,
    queries,
    times: [1, 0, 0.5, 0.25, 1],
    scope: "下游Calcit声明、旋转2x、clip、butt、空洞与乱序时间；不是性能测量",
  };
}

// 嵌套组沿原公共保留计划采样；仅通过下游 app 的 Calcit 导出调用库。
export function verifyLayeredConsumer(app, core) {
  const tags = core.init_tags([
    "scene",
    "nodes",
    "content",
    "slots",
    "declarations",
    "plan-builds",
    "binding-samples",
    "id",
    "key",
    "parent",
    "instances",
  ]);
  const get = (value, key) => value.get(tags[key]);
  let plan = app.start_layered(0, 40, false, 100);
  const original = plan;
  const nodes = (p) => get(get(p, "scene"), "nodes");
  const slots = get(plan, "slots");
  for (let frame = 1; frame <= 1000; frame++) {
    const time = frame / 1000,
      progress = time * time * (3 - 2 * time);
    plan = app.update_layered(plan, time, 40, false, 100);
    const sampled = core.to_js_data(get(plan, "scene")).nodes;
    assert.ok(Math.abs(sampled[0].content[1].opacity - progress) < 1e-12);
    assert.ok(Math.abs(sampled[3].content[1].width - 120 * progress) < 1e-10);
    for (const index of [1, 2, 4]) assert.equal(nodes(plan).get(index), nodes(original).get(index));
    assert.equal(get(plan, "slots"), slots);
  }
  const counts = {
    frames: 1000,
    declarations: get(plan, "declarations"),
    builds: get(plan, "plan-builds"),
    samples: get(plan, "binding-samples"),
  };
  assert.deepEqual(counts, { frames: 1000, declarations: 1, builds: 1, samples: 2002 });
  for (const time of [1, 0, 0.5, 0.25, 1]) {
    plan = app.update_layered(plan, time, 40, false, 100);
    const progress = time * time * (3 - 2 * time);
    assert.equal(core.to_js_data(get(plan, "scene")).nodes[3].content[1].width, 120 * progress);
  }
  plan = app.update_layered(plan, 0.5, 64, false, 100);
  assert.equal(core.to_js_data(get(plan, "scene")).nodes[3].content[1].width, 72, "同时间 Model 变化必须更新图表");
  const document = get(plan, "scene");
  assert.deepEqual(core.to_js_data(app.canvas_diagnostics(document)), []);
  assert.deepEqual(
    core.to_js_data(app.gpu_diagnostics(plan)),
    core.to_js_data(document).nodes.map((node) => ({
      id: node.id,
      key: node.key,
      kind: node.content[0],
      reason: node.parent ? "nested-scene-requires-layer-fallback" : "unsupported-node:group",
    })),
    "同一 Calcit 组件向 GPU 返回全部节点诊断，不能只报首个节点或静默漏绘",
  );
  const prototype = nodes(plan).get(0).get(tags.content).enumPrototype;
  const kinds = Object.keys(core.to_js_data(prototype.prototype)).sort();
  assert.deepEqual(
    kinds,
    ["arc", "circle", "cubic-path", "group", "image", "instances", "polygon", "polyline", "rect", "text"],
    "新增 Scene 种类必须同步能力表和门禁",
  );
  // 这里只测种类分类，不以空 payload 声称图元数据合法或已经绘制。
  for (const kind of kinds) {
    const tag = core.init_tags([kind])[kind];
    assert.equal(app.canvas_content_supported_$q_(core._PCT__$o__$o_(prototype, tag, null)), kind !== "instances");
  }
  const instance = nodes(plan)
    .get(4)
    .assoc(tags.id, "external-particles")
    .assoc(tags.key, "particles-key")
    .assoc(tags.parent, "")
    .assoc(tags.content, core._PCT__$o__$o_(prototype, tags.instances, app.instances_declaration()));
  const unsupported = document.assoc(tags.nodes, nodes(plan).assoc(4, instance));
  assert.deepEqual(core.to_js_data(app.canvas_diagnostics(unsupported)), [
    { id: "external-particles", key: "particles-key", kind: "instances", reason: "unsupported-canvas-scene-instances" },
  ]);
  const gpuDiagnostics = core.to_js_data(app.gpu_diagnostics(plan.assoc(tags.scene, unsupported)));
  assert.deepEqual(gpuDiagnostics.at(-1), {
    id: "external-particles",
    key: "particles-key",
    kind: "instances",
    reason: "unsupported-node:instances",
  });
  let calls = 0;
  const context = new Proxy(
    {},
    {
      get() {
        calls++;
        throw Error("unexpected-canvas-access");
      },
    },
  );
  assert.throws(
    () => app.draw_document_$x_(context, unsupported, 320, 180),
    /unsupported-canvas-scene-instances.*external-particles.*particles-key/,
  );
  assert.equal(calls, 0, "完整预检必须发生在任何 Canvas 操作之前");
  assert.equal(app.prepare_gpu(plan).tag.value, "fallback", "组语义不能静默变为矩形子集");
  const primitive = app.primitive_document(0.5);
  const primitiveBefore = core.to_js_data(primitive);
  assert.deepEqual(
    primitiveBefore.nodes.map((node) => node.content[0]).sort(),
    kinds.filter((kind) => kind !== "instances"),
    "所有声明支持的 document 图元必须具有合法的真实 payload",
  );
  assert.deepEqual(core.to_js_data(app.canvas_diagnostics(primitive)), []);
  for (const time of [1, 0, 0.5, 0.25, 1]) {
    assert.equal(
      core.to_js_data(app.primitive_document(time)).nodes[0].content[1].opacity,
      time * time * (3 - 2 * time),
    );
  }
  assert.throws(() => app.primitive_document(NaN), /invalid-motion-time/);
  assert.throws(() => app.draw_primitives_$x_(context, primitive, null, 320, 180), /missing-image-resource/);
  assert.throws(
    () => app.draw_primitives_$x_(context, primitive, { naturalWidth: 7, naturalHeight: 8 }, 320, 180),
    /image-size-mismatch/,
  );
  assert.equal(calls, 0, "晚于其他图元的图片失败仍必须在任何绘制前检出");
  assert.deepEqual(core.to_js_data(primitive), primitiveBefore, "资源预检和布局不能修改声明");
  const presenceTimes = [1, 0, 0.5, 0.25, 1];
  for (const time of presenceTimes) {
    const nested = core.to_js_data(app.nested_presence_at(time)).nodes;
    assert.equal(nested.length, 5);
    assert.equal(nested[0].content[1].opacity, 1 - time);
    assert.equal(nested[2].content[1].opacity, 0.5, "整组Presence不能向嵌套子组重复下推alpha");
    assert.ok(nested.every((node) => node.interaction[0] === "disabled"));
    assert.equal(new Set(nested.map((node) => node.id)).size, 5);
  }
  assert.throws(() => app.nested_presence_at(NaN), /invalid-scene-sample-time/);
  return { ...counts, nestedPresence: { times: presenceTimes, nodes: 5, disabled: true } };
}

// 同一个搬移后的消费者、同一个 Canvas；参考只用独立原生绘制，不解释 Scene 数据。
async function verifyPrimitiveCanvasConsumer(page, artifacts) {
  const frames = [];
  for (const time of [1, 0, 0.5, 0.25, 1]) {
    const result = await page.evaluate(async (time) => {
      const app = await import(new URL("./target/js/app/app.main.mjs", location.href).href);
      const core = await import(new URL("./target/js/app/calcit.core.mjs", location.href).href);
      const canvas = document.querySelector("canvas"),
        actual = canvas.getContext("2d"),
        width = canvas.width,
        height = canvas.height,
        scale = Math.min(width / 320, height / 180),
        x = width / 2 - 144 * scale,
        y = height / 2 - 74 * scale;
      const bitmap = document.createElement("canvas");
      bitmap.width = bitmap.height = 8;
      const pixels = bitmap.getContext("2d");
      pixels.fillStyle = "#ffff00";
      pixels.fillRect(0, 0, 4, 8);
      pixels.fillStyle = "#00ffff";
      pixels.fillRect(4, 0, 4, 8);
      const image = new Image();
      image.src = bitmap.toDataURL();
      await image.decode();
      actual.setTransform(1, 0, 0, 1, 0, 0);
      actual.clearRect(0, 0, width, height);
      const declaration = app.primitive_document(time),
        before = JSON.stringify(core.to_js_data(declaration));
      app.draw_primitives_$x_(actual, declaration, image, width, height);
      const layer =
        typeof OffscreenCanvas === "function" ? new OffscreenCanvas(width, height) : document.createElement("canvas");
      layer.width = width;
      layer.height = height;
      const c = layer.getContext("2d");
      c.setTransform(scale, 0, 0, scale, x, y);
      c.beginPath();
      c.rect(0, 0, 288, 148);
      c.clip();
      c.fillStyle = "#ff0000";
      c.fillRect(8, 8, 48, 24);
      c.save();
      c.strokeStyle = "#0000ff";
      c.lineWidth = 4;
      c.lineCap = c.lineJoin = "round";
      c.beginPath();
      c.moveTo(72, 12);
      c.lineTo(96, 40);
      c.lineTo(120, 12);
      c.stroke();
      c.restore();
      c.font = "12px monospace";
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.direction = "ltr";
      c.fillStyle = "#000000";
      c.fillText("Metrics", 8, 60);
      c.drawImage(image, 0, 0, 8, 8, 144, 8, 32, 32);
      c.fillStyle = "#00ff00";
      c.strokeStyle = "#000000";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(192, 12);
      c.lineTo(224, 12);
      c.lineTo(216, 40);
      c.closePath();
      c.fill();
      c.stroke();
      c.strokeStyle = "#ff00ff";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(248, 12);
      c.bezierCurveTo(248, 40, 280, 40, 280, 12);
      c.stroke();
      c.fillStyle = "#00ffff";
      c.strokeStyle = "#000000";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(36, 112, 20, 0, Math.PI * 2, false);
      c.closePath();
      c.fill();
      c.stroke();
      c.save();
      c.strokeStyle = "rgba(0,0,255,0.5)";
      c.lineWidth = 4;
      c.lineCap = "round";
      c.beginPath();
      c.arc(112, 112, 18, 0.2, 2.4, false);
      c.stroke();
      c.restore();
      const expected = document.createElement("canvas");
      expected.width = width;
      expected.height = height;
      const e = expected.getContext("2d");
      e.globalAlpha = time * time * (3 - 2 * time);
      e.drawImage(layer, 0, 0);
      const a = actual.getImageData(0, 0, width, height).data,
        b = e.getImageData(0, 0, width, height).data;
      let differences = 0,
        covered = 0;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) differences++;
      for (let i = 3; i < a.length; i += 4) if (a[i]) covered++;
      return {
        time,
        width,
        height,
        differences,
        covered,
        unchanged: before === JSON.stringify(core.to_js_data(declaration)),
        gpuAvailable: navigator.gpu !== undefined,
      };
    }, time);
    assert.equal(result.gpuAvailable, false);
    assert.equal(result.unchanged, true, "布局与绘制不修改 Calcit 声明");
    assert.equal(result.differences, 0, "九种合法 Canvas document 图元须实际绘制，不能缺失或简化");
    assert.equal(result.covered === 0, time === 0);
    frames.push(result);
    if ([0, 0.5, 1].includes(time))
      await page.screenshot({ path: `${artifacts}/primitives-frame-${time}.png`, fullPage: true });
  }
  return { result: "PASS", frames, scope: "九种 document 图元，无 GPU，独立原生 Canvas 全图参考" };
}

export async function verifyLayeredCanvasConsumer(page, artifacts) {
  await page.evaluate(() => {
    window.__consumerGpuDescriptor = Object.getOwnPropertyDescriptor(navigator, "gpu");
    Object.defineProperty(navigator, "gpu", { value: undefined, configurable: true });
  });
  try {
    await page.click('[data-mode="layered"]');
    await page.evaluate(() => window.consumer.set({ model: 40, ready: false, viewport: 100 }));
    const frames = [];
    const nestedFrames = [];
    for (const nested of [false, true]) {
      for (const time of [1, 0, 0.5, 0.25, 1]) {
        const result = await page.evaluate(
          async ({ time, nested }) => {
            const state = window.consumer.set({ time });
            const canvas = document.querySelector("canvas"),
              actual = canvas.getContext("2d");
            const width = canvas.width,
              height = canvas.height,
              scale = Math.min(width / 320, height / 180);
            const x = width / 2 - 144 * scale,
              y = height / 2 - 74 * scale;
            const progress = Math.max(0, Math.min(1, time));
            const fade = progress * progress * (3 - 2 * progress);
            if (nested) {
              const app = await import(new URL("./target/js/app/app.main.mjs", location.href).href);
              actual.clearRect(0, 0, width, height);
              app.draw_document_$x_(
                actual,
                app.fit_layered_document(app.nested_presence_at(time), width, height),
                width,
                height,
              );
            }
            // 对照独立原生绘制，不调用库；隔离 surface 类型必须与声明的后端一致。
            // Chromium 的 DOM/Offscreen 分数 clip 边缘并非像素等价。
            const surface = (isolated = true) => {
              const c =
                isolated && typeof OffscreenCanvas === "function"
                  ? new OffscreenCanvas(width, height)
                  : document.createElement("canvas");
              c.width = width;
              c.height = height;
              return c;
            };
            const expected = surface(false),
              panel = surface(),
              plot = surface();
            const p = panel.getContext("2d"),
              q = plot.getContext("2d"),
              e = expected.getContext("2d");
            p.setTransform(scale, 0, 0, scale, x, y);
            p.beginPath();
            p.rect(0, 0, 288, 148);
            p.clip();
            p.font = "12px monospace";
            p.textBaseline = "middle";
            p.fillStyle = "rgb(33,51,77)";
            p.fillText("渠道转化", 8, 18);
            q.setTransform(scale, 0, 0, scale, x + 8 * scale, y + 40 * scale);
            q.beginPath();
            q.rect(0, 0, 120, 64);
            q.clip();
            q.fillStyle = "red";
            q.fillRect(0, 0, 120 * (nested ? 1 : fade), 32);
            q.fillStyle = "blue";
            q.fillRect(48, 16, 104, 32);
            p.setTransform(1, 0, 0, 1, 0, 0);
            p.globalAlpha = 0.5;
            p.drawImage(plot, 0, 0);
            e.globalAlpha = nested ? 1 - time : fade;
            e.drawImage(panel, 0, 0);
            const a = actual.getImageData(0, 0, width, height).data;
            const b = e.getImageData(0, 0, width, height).data;
            let differences = 0;
            for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) differences++;
            const pixel = (px, py) => Array.from(actual.getImageData(x + px * scale, y + py * scale, 1, 1).data);
            return {
              time,
              width,
              height,
              differences,
              gpuAvailable: navigator.gpu !== undefined,
              mode: state.mode,
              overlap: pixel(69, 64),
              clipped: pixel(134, 64),
              opacity: nested ? 1 - time : state.scene.nodes[0].content[1].opacity,
            };
          },
          { time, nested },
        );
        assert.equal(result.mode, "layered");
        assert.equal(result.gpuAvailable, false, "同一组场景在强制无 WebGPU 下仍必须完整绘制");
        assert.equal(result.differences, 0, "Calcit 组/裁剪/透明度须与独立原生 Canvas 全像素一致");
        assert.deepEqual(result.clipped, [0, 0, 0, 0]);
        if ((!nested && time === 1) || (nested && time === 0)) {
          assert.deepEqual(result.overlap, [0, 0, 255, 128]);
          assert.notDeepEqual(result.overlap, [85, 0, 170, 191], "不能把隔离透明度改成逐子节点透明度");
        }
        (nested ? nestedFrames : frames).push(result);
        if ([0, 0.5, 1].includes(time))
          await page.screenshot({
            path: `${artifacts}/${nested ? "nested-presence" : "layered"}-frame-${time}.png`,
            fullPage: true,
          });
      }
    }
    const primitives = await verifyPrimitiveCanvasConsumer(page, artifacts);
    await page.click('[data-mode="mixed"]');
    return {
      result: "PASS",
      frames,
      nestedPresence: { result: "PASS", frames: nestedFrames },
      primitives,
      scope: "强制无 WebGPU 的嵌套组/裁剪/隔离透明度 Calcit 下游 Canvas 路径；非 GPU 性能证据",
    };
  } finally {
    await page.evaluate(() => {
      if (window.__consumerGpuDescriptor) Object.defineProperty(navigator, "gpu", window.__consumerGpuDescriptor);
      else delete navigator.gpu;
      delete window.__consumerGpuDescriptor;
    });
  }
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
