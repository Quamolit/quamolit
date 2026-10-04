import { expect, test } from "@playwright/test";

test("不透明无裁剪组零离屏分配，透明或裁剪组仍隔离", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const counts = await page.evaluate(async () => {
    const base = "/target/js/layered-dashboard/";
    const app = await import(`${base}quamolit.examples.layered-dashboard.mjs`);
    const renderer = await import(`${base}quamolit.canvas-scene.mjs`);
    const scene = await import(`${base}quamolit.scene-ir.mjs`);
    const core = await import(`${base}calcit.core.mjs`);
    const tags = core.init_tags(["nodes", "content", "group", "clip", "none", "opacity"]);
    const source = app.scene_at(1, 1000, 700);
    const originalNodes = source.get(tags.nodes).toArray();
    const groupValue = (node) => core._$n_enum_$o_nth(node.get(tags.content), 1);
    const isGroup = (node) => core.to_js_data(node.get(tags.content))[0] === "group";
    const groupNodes = originalNodes.filter(isGroup);
    const clipped = groupNodes.find((node) => core.to_js_data(groupValue(node)).clip[0] === "rect");
    if (!clipped) throw new Error("missing clipped reference");
    const withGroup = (node, group) =>
      node.assoc(tags.content, core._PCT__$o__$o_(scene.SceneContent, tags.group, group));
    const opaqueNodes = originalNodes.map((node) =>
      isGroup(node)
        ? withGroup(
            node,
            groupValue(node).assoc(tags.opacity, 1).assoc(tags.clip, core._PCT__$o__$o_(scene.ClipSpec, tags.none)),
          )
        : node,
    );
    const index = originalNodes.findIndex(isGroup);
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 700;
    const context = canvas.getContext("2d");
    const Original = window.OffscreenCanvas;
    let count = 0;
    window.OffscreenCanvas = class extends Original {
      constructor(width, height) {
        super(width, height);
        count++;
      }
    };
    try {
      const draw = (nodes) => {
        count = 0;
        context.clearRect(0, 0, 1000, 700);
        renderer.draw_document_$x_(context, source.assoc(tags.nodes, core.arrayToList(nodes)), 1000, 700, () => {
          throw new Error("unexpected image");
        });
        return count;
      };
      const opaque = draw(opaqueNodes);
      const transparent = [...opaqueNodes];
      transparent[index] = withGroup(opaqueNodes[index], groupValue(opaqueNodes[index]).assoc(tags.opacity, 0.5));
      const alpha = draw(transparent);
      const clipping = [...opaqueNodes];
      clipping[index] = withGroup(
        opaqueNodes[index],
        groupValue(opaqueNodes[index]).assoc(tags.clip, groupValue(clipped).get(tags.clip)),
      );
      return { opaque, alpha, clipped: draw(clipping) };
    } finally {
      window.OffscreenCanvas = Original;
    }
  });
  expect(counts).toEqual({ opaque: 0, alpha: 1, clipped: 1 });
});

test("首个rAF早于播放启动时间不倒退Model，终点仍停帧", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=0.96");
  await page.evaluate(() => {
    window.layeredDashboardDemo.pause();
    const original = requestAnimationFrame;
    let first = true;
    window.requestAnimationFrame = (callback) =>
      original((timestamp) => {
        const earlier = first;
        first = false;
        callback(earlier ? timestamp - 100 : timestamp);
      });
    window.layeredDashboardDemo.play();
  });
  await expect.poll(() => page.evaluate(() => window.layeredDashboardDemo.snapshot().playing)).toBe(false);
  const finished = await page.evaluate(() => window.layeredDashboardDemo.snapshot());
  expect(finished.time).toBe(1);
  expect(finished.pending).toBe(false);
  await page.waitForTimeout(2100);
  expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).paints).toBe(finished.paints);
  expect(errors).toEqual([]);
});

test("显隐按钮、事件重放和一百次往返沿用实际看板组件", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  await page.getByRole("button", { name: "隐藏看板", exact: true }).click();
  expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).visible).toBe(false);
  await page.evaluate(() => window.layeredDashboardDemo.seek(1.3));
  await page.getByRole("button", { name: "恢复看板", exact: true }).click();
  expect(
    (await page.evaluate(() => window.layeredDashboardDemo.snapshot())).scene.nodes[1].content[1].opacity,
  ).toBeCloseTo(0.5, 12);
  const result = await page.evaluate(async () => {
    const base = "/target/js/layered-dashboard/";
    const app = await import(`${base}quamolit.examples.layered-dashboard.mjs`);
    const presence = await import(`${base}quamolit.presence.mjs`);
    const core = await import(`${base}calcit.core.mjs`);
    let events = app.record_visibility(app.empty_events(), 1, false);
    events = app.record_visibility(events, 1.3, true);
    let model = app.initial(),
      previous = 0;
    const equivalent = [0, 0.25, 0.75, 1, 1.1, 1.3, 1.6, 1.9, 2].map((time) => {
      model = app.advance(model, events, previous, time);
      previous = time;
      return (
        JSON.stringify(core.to_js_data(model)) === JSON.stringify(core.to_js_data(app.replay_events(events, time)))
      );
    });
    const unordered = [1.9, 1.3, 0, 1.1, 1.9].map((time) => {
      const data = core.to_js_data(app.frame_at(app.replay_events(events, time), time, 1000, 700));
      return { time, opacity: data.nodes[1].content[1].opacity, count: data.nodes.length };
    });
    const branch = core.to_js_data(app.record_visibility(events, 1.1, true));
    const counts = [];
    model = app.initial();
    for (let index = 0; index < 100; index++) {
      const start = index * 2 + 1;
      model = app.set_visible(model, false, start);
      model = app.advance(model, app.empty_events(), start, start + 0.7);
      counts.push(core.to_js_data(model).items.length);
      model = app.set_visible(model, true, start + 1);
      model = app.advance(model, app.empty_events(), start + 1, start + 1.7);
      counts.push(core.to_js_data(model).items.length);
    }
    return { equivalent, unordered, branch, counts, needsFrame: presence.presence_needs_frame_$q_(model, 201) };
  });
  expect(result.equivalent).toEqual(Array(9).fill(true));
  expect(result.unordered.map((frame) => frame.count)).toEqual(Array(5).fill(28));
  result.unordered.forEach((frame, index) => expect(frame.opacity).toBeCloseTo([1, 0.5, 0, 5 / 6, 1][index], 12));
  expect(result.branch).toEqual([
    { time: 1, visible: false },
    { time: 1.1, visible: true },
  ]);
  expect(result.counts).toEqual(Array.from({ length: 200 }, (_, index) => (index % 2 === 0 ? 1 : 28)));
  expect(result.needsFrame).toBe(false);
});

test("嵌套换父保留新旧逻辑身份，退出叶不能借活跃祖先命中", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const result = await page.evaluate(async () => {
    const base = "/target/js/layered-dashboard/";
    const app = await import(`${base}quamolit.examples.layered-dashboard.mjs`);
    const presence = await import(`${base}quamolit.presence.mjs`);
    const component = await import(`${base}quamolit.presence-component.mjs`);
    const binding = await import(`${base}quamolit.scene-binding.mjs`);
    const hit = await import(`${base}quamolit.scene-hit.mjs`);
    const core = await import(`${base}calcit.core.mjs`);
    const tags = core.init_tags(["nodes", "items", "alpha", "easing", "model", "id", "parent", "released"]);
    const get = (value, key) => value.get(tags[key]);
    const source = app.interactive_scene_at(1, 1000, 700);
    const nodes = get(source, "nodes");
    const changed = [];
    const card = nodes.get(6);
    for (let index = 0; index < 28; index++) {
      if (index === 6) continue;
      const node = nodes.get(index);
      changed.push(node);
      if (index === 15) changed.push(card.assoc(tags.parent, "chart"));
    }
    const desired = source.assoc(tags.nodes, new core.CalcitSliceList(changed));
    const initial = presence.start_presence(source);
    const easing = get(get(get(initial, "items").get(0), "alpha"), "easing");
    const model = get(presence.reconcile_presence(initial, desired, 0, 1, easing), "model");
    const declaration = component.declare_tree(
      model,
      binding.empty_descriptors(),
      new core.CalcitSliceList(["metric-a"]),
    );
    const scene = binding.resolve_scene(
      declaration.get(core.init_tags(["scene"]).scene),
      declaration.get(core.init_tags(["motions"]).motions),
      0.5,
    );
    const data = core.to_js_data(scene);
    const cards = data.nodes.filter((node) => node.id.endsWith("/8:metric-a"));
    const candidates = core.to_js_data(hit.compile_hit_plan(scene)).candidates;
    const withoutBar = source.assoc(
      tags.nodes,
      new core.CalcitSliceList(
        Array.from({ length: 28 }, (_, index) => nodes.get(index)).filter((node) => get(node, "id") !== "bar-1"),
      ),
    );
    const leafExit = get(presence.reconcile_presence(initial, withoutBar, 0, 1, easing), "model");
    const leafDeclaration = component.declare_tree(
      leafExit,
      binding.empty_descriptors(),
      new core.CalcitSliceList(["bar-1"]),
    );
    const leafData = core.to_js_data(leafDeclaration);
    return {
      cards,
      unique: new Set(data.nodes.map((node) => node.id)).size === data.nodes.length,
      oldCandidate: candidates.some(
        (candidate) => candidate.node.id === cards.find((card) => card.interaction[0] === "disabled").id,
      ),
      released: core.to_js_data(get(presence.settle_presence(model, 1), "released")).map((entry) => entry.node.id),
      retainedBar: leafData.scene.nodes.findIndex((node) => node.id.endsWith("/5:bar-1")),
      nextGroup: leafData.scene.nodes.findIndex((node) => node.id.endsWith("/7:overlap")),
      leafCount: leafData.scene.nodes.length,
    };
  });
  expect(result.cards).toHaveLength(2);
  expect(result.cards[0].parent).not.toBe(result.cards[1].parent);
  expect(result.cards.map((card) => card.content[1].fill.a)).toEqual([0.5, 0.5]);
  expect(result.unique).toBe(true);
  expect(result.oldCandidate).toBe(false);
  expect(result.released).toEqual(["metric-a"]);
  expect(result.leafCount).toBe(28);
  expect(result.retainedBar).toBeGreaterThan(15);
  expect(result.retainedBar).toBeLessThan(result.nextGroup);
});

for (const dpr of [1, 2]) {
  test(`真实看板退出、resize、捕获与字体租约联合提交 DPR${dpr}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    try {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
      await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
      const nativeBefore = await page.evaluate(() => document.fonts.size);
      const loaded = await page.evaluate(() => window.layeredDashboardDemo.enableFont());
      expect(loaded.fonts.references).toHaveLength(1);
      expect(loaded.fonts.registry.loads).toBe(1);
      expect(loaded.fonts.host.accepted).toBe(1);
      expect(loaded.fonts.host.handles).toHaveLength(1);
      expect(loaded.fonts.host.handles[0]["installed?"]).toBe(true);
      expect(loaded.fonts.revision).toBe(1);
      expect(loaded.time).toBe(1);
      expect(loaded.events).toEqual([]);
      expect(await page.evaluate(() => document.fonts.size)).toBe(nativeBefore + 1);
      await page.evaluate(() => {
        const canvas = document.querySelector("canvas");
        window.captureCounts = { set: 0, release: 0 };
        for (const [method, key] of [
          ["setPointerCapture", "set"],
          ["releasePointerCapture", "release"],
        ]) {
          const original = canvas[method].bind(canvas);
          canvas[method] = (id) => {
            window.captureCounts[key]++;
            return original(id);
          };
        }
      });
      const point = () =>
        page.locator("canvas").evaluate((canvas) => {
          const bounds = canvas.getBoundingClientRect();
          return {
            x: bounds.left + ((canvas.width / 2 - 208) * bounds.width) / canvas.width,
            y: bounds.top + ((canvas.height / 2 + 140) * bounds.height) / canvas.height,
          };
        });
      let position = await point();
      await page.mouse.move(position.x, position.y);
      await page.mouse.down();
      const read = () =>
        page.evaluate(() => ({ ...window.layeredDashboardDemo.snapshot(), counts: { ...window.captureCounts } }));
      expect((await read()).pointer.capture[2]).toBe("chart");
      const exiting = await page.evaluate(() => {
        const canvas = document.querySelector("canvas");
        canvas.style.width = "calc(100vw - 80px)";
        canvas.style.height = "calc(100vh - 40px)";
        window.layeredDashboardDemo.setVisible(false);
        window.layeredDashboardDemo.pause();
        return { ...window.layeredDashboardDemo.snapshot(), counts: { ...window.captureCounts } };
      });
      expect(exiting.captured).toBeNull();
      expect(exiting.counts).toEqual({ set: 1, release: 1 });
      expect(exiting.width).toBe(1200 * dpr);
      expect(exiting.nodeCount).toBe(28); // 退出仍可见，不能用立刻删除替代。
      expect(exiting.fonts.references).toHaveLength(1);
      expect(exiting.fonts.host.handles).toHaveLength(1);
      expect(exiting.scene.nodes.slice(1).every((node) => node.interaction[0] === "disabled")).toBe(true);
      await page.evaluate(() => window.layeredDashboardDemo.seek(1.3));
      expect((await read()).scene.nodes[1].content[1].opacity).toBeCloseTo(0.5, 12);
      expect((await read()).fonts.registry.entries[0].references).toBe(1);
      await page.screenshot({ path: testInfo.outputPath(`dashboard-exit-dpr${dpr}.png`) });
      const reentered = await page.evaluate(() => {
        window.layeredDashboardDemo.setVisible(false); // 重复提交不重新计时，也不再次释放。
        const before = window.layeredDashboardDemo.snapshot().scene.nodes.map((node) => node.content);
        window.layeredDashboardDemo.setVisible(true);
        window.layeredDashboardDemo.pause();
        return { before, ...window.layeredDashboardDemo.snapshot(), counts: { ...window.captureCounts } };
      });
      expect(reentered.scene.nodes.map((node) => node.content)).toEqual(reentered.before);
      expect(reentered.captured).toBeNull();
      expect(reentered.counts.release).toBe(1);
      expect(reentered.fonts.registry.loads).toBe(1);
      await page.mouse.up();
      const settled = await page.evaluate(() => {
        const api = window.layeredDashboardDemo;
        api.setVisible(false);
        api.seek(api.snapshot().time + 0.6);
        const idle = api.snapshot();
        api.setVisible(true);
        api.seek(api.snapshot().time + 0.6);
        return { idle, resumed: api.snapshot() };
      });
      expect(settled.idle.nodeCount).toBe(1);
      expect(settled.idle.fonts.references).toEqual([]);
      expect(settled.idle.fonts.registry.entries[0].references).toBe(0);
      expect(settled.idle.fonts.host.handles).toHaveLength(1); // idle不是物理释放。
      expect(settled.resumed.nodeCount).toBe(28);
      expect(settled.resumed.fonts.registry.loads).toBe(1);
      expect(settled.resumed.fonts.host.accepted).toBe(1);
      expect(settled.resumed.fonts.registry.entries[0].references).toBe(1);
      position = await point();
      await page.mouse.move(position.x, position.y);
      await page.mouse.down();
      expect((await read()).counts.set).toBe(2);
      const unmounted = await page.evaluate(() => {
        const api = window.layeredDashboardDemo;
        api.dispose();
        api.dispose();
        document
          .querySelector("canvas")
          .dispatchEvent(new PointerEvent("pointerdown", { pointerId: 19, clientX: 500, clientY: 500 }));
        return { state: api.snapshot(), counts: { ...window.captureCounts }, removed: !window.layeredDashboardDemo };
      });
      expect(unmounted.removed).toBe(true);
      expect(unmounted.state.captured).toBeNull();
      expect(unmounted.state.pointer["hover-node"]).toBe("");
      expect(unmounted.counts).toEqual({ set: 2, release: 2 });
      expect(unmounted.state.pending).toBe(false);
      expect(unmounted.state.fonts["closed?"]).toBe(true);
      expect(unmounted.state.fonts.host.handles).toEqual([]);
      expect(unmounted.state.fonts.host.released).toBe(1);
      expect(await page.evaluate(() => document.fonts.size)).toBe(nativeBefore);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("真实 FontFace 等待期间卸载：迟到完成不安装、不重绘，重复关闭幂等", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const result = await page.evaluate(async () => {
    const api = window.layeredDashboardDemo;
    const Original = FontFace;
    const nativeBefore = document.fonts.size;
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    window.FontFace = class extends Original {
      load() {
        return super.load().then((face) => gate.then(() => face));
      }
    };
    try {
      const pending = api.enableFont();
      const during = api.snapshot();
      api.dispose();
      api.dispose();
      const closed = api.snapshot();
      release();
      await pending;
      return { during, closed, after: api.snapshot(), nativeBefore, nativeAfter: document.fonts.size };
    } finally {
      window.FontFace = Original;
      release();
    }
  });
  expect(result.during.fonts.queue.running).toHaveLength(1);
  expect(result.closed.fonts["closed?"]).toBe(true);
  expect(result.after.fonts.queue.running).toEqual([]);
  expect(result.after.fonts.host.accepted).toBe(0);
  expect(result.after.fonts.host.handles).toEqual([]);
  expect(result.after.fonts.revision).toBe(0);
  expect(result.after.paints).toBe(result.closed.paints);
  expect(result.after.pending).toBe(false);
  expect(result.nativeAfter).toBe(result.nativeBefore);
});

test("真实嵌套看板整组退出只合成一次 alpha，乱序采样与重入连续", async ({ page }, testInfo) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const result = await page.evaluate(async () => {
    const base = "/target/js/layered-dashboard/";
    const app = await import(`${base}quamolit.examples.layered-dashboard.mjs`);
    const presence = await import(`${base}quamolit.presence.mjs`);
    const canvas = await import(`${base}quamolit.canvas-scene.mjs`);
    const scene = await import(`${base}quamolit.scene-ir.mjs`);
    const hit = await import(`${base}quamolit.scene-hit.mjs`);
    const core = await import(`${base}calcit.core.mjs`);
    const tags = core.init_tags(["nodes", "items", "alpha", "easing", "model", "released", "interaction", "target"]);
    const get = (value, key) => value.get(tags[key]);
    const source = app.scene_at(1, 1000, 700);
    const sourceNodes = get(source, "nodes");
    const document = source.assoc(
      tags.nodes,
      new core.CalcitSliceList(
        Array.from({ length: 28 }, (_, index) => {
          const node = sourceNodes.get(index);
          // Both inherited ancestor target and a nested explicit target must disappear on exit.
          return index === 1 || index === 23
            ? node.assoc(
                tags.interaction,
                core._PCT__$o__$o_(scene.SceneInteraction, tags.target, index === 1 ? "dashboard" : "bar"),
              )
            : node;
        }),
      ),
    );
    const background = document.assoc(tags.nodes, new core.CalcitSliceList([get(document, "nodes").get(0)]));
    const initial = presence.start_presence(document);
    const easing = get(get(get(initial, "items").get(0), "alpha"), "easing");
    const exiting = get(presence.reconcile_presence(initial, background, 0, 1, easing), "model");
    const before = core.to_js_data(exiting);
    const create = () => {
      const element = window.document.createElement("canvas");
      element.width = 1000;
      element.height = 700;
      return element.getContext("2d");
    };
    const draw = (context, scene) =>
      canvas.draw_document_$x_(context, scene, 1000, 700, () => {
        throw Error("unexpected image");
      });
    const frames = [1, 0, 0.5, 0.25, 0.75, 0.5].map((time) => {
      const actual = create(),
        expected = create(),
        isolated = create();
      const sampled = app.presence_scene_at(exiting, time);
      draw(actual, sampled);
      // Independent lifecycle reference: one root surface composite, not per-leaf fading.
      draw(expected, background);
      draw(isolated, document);
      expected.globalAlpha = 1 - time;
      expected.drawImage(isolated.canvas, 0, 0);
      const a = actual.getImageData(0, 0, 1000, 700).data;
      const b = expected.getImageData(0, 0, 1000, 700).data;
      const data = core.to_js_data(sampled);
      return {
        time,
        equal: a.every((value, index) => value === b[index]),
        opacity: data.nodes[1].content[1].opacity,
        nestedOpacity: data.nodes[24].content[1].opacity,
        disabled: data.nodes.slice(1).every((node) => node.interaction[0] === "disabled"),
        candidates: core.to_js_data(hit.compile_hit_plan(sampled)).candidates.length,
        image: actual.canvas.toDataURL(),
      };
    });
    const continuity = [0.25, 0.5, 0.75].map((time) => {
      const revived = presence.reconcile_presence(exiting, document, time, 1, easing);
      const oldScene = core.to_js_data(app.presence_scene_at(exiting, time));
      const newScene = core.to_js_data(app.presence_scene_at(get(revived, "model"), time));
      return {
        same:
          JSON.stringify(oldScene.nodes.map((node) => node.content)) ===
          JSON.stringify(newScene.nodes.map((node) => node.content)),
        released: core.to_js_data(get(revived, "released")).length,
        enabled: newScene.nodes.every((node) => node.interaction[0] !== "disabled"),
        hittable:
          core.to_js_data(hit.compile_hit_plan(app.presence_scene_at(get(revived, "model"), time))).candidates.length >
          0,
      };
    });
    const settled = presence.settle_presence(exiting, 1);
    return {
      frames,
      continuity,
      immutable: JSON.stringify(before) === JSON.stringify(core.to_js_data(exiting)),
      released: core.to_js_data(get(settled, "released")).length,
      secondRelease: core.to_js_data(get(presence.settle_presence(get(settled, "model"), 1), "released")).length,
      remaining: core.to_js_data(app.presence_scene_at(get(settled, "model"), 1)).nodes.length,
      initiallyHittable: core.to_js_data(hit.compile_hit_plan(app.presence_scene_at(initial, 0))).candidates.length > 0,
    };
  });
  for (const frame of result.frames) {
    await testInfo.attach(`nested-presence-${frame.time}.png`, {
      body: Buffer.from(frame.image.split(",")[1], "base64"),
      contentType: "image/png",
    });
    expect(frame.equal, `isolated composite t=${frame.time}`).toBe(true);
    expect(frame.opacity).toBe(1 - frame.time);
    expect(frame.nestedOpacity).toBe(0.55);
    expect(frame.disabled).toBe(true);
    expect(frame.candidates).toBe(0);
  }
  expect(result.continuity).toEqual(Array(3).fill({ same: true, released: 0, enabled: true, hittable: true }));
  expect(result.initiallyHittable).toBe(true);
  expect(result.immutable).toBe(true);
  expect(result.released).toBe(27);
  expect(result.secondRelease).toBe(0);
  expect(result.remaining).toBe(1);
});

test("嵌套裁剪与隔离透明度可按确定时间截图", async ({ page }, testInfo) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=0");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  const at = (time) => page.evaluate((value) => window.layeredDashboardDemo.seek(value), time);
  expect((await at(0)).nodeCount).toBe(28);
  const background = await page
    .locator("canvas")
    .evaluate((canvas) =>
      Array.from(canvas.getContext("2d").getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data),
    );
  expect(background.slice(0, 3)).toEqual([6, 9, 18]);
  await at(0.5);
  const clipPixels = await page.locator("canvas").evaluate((canvas) => {
    const context = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 12;
    const scale = 0.93;
    const pixel = (x, y) => Array.from(context.getImageData(centerX + x * scale, centerY + y * scale, 1, 1).data);
    return { revealed: pixel(-80, 100), clipped: pixel(120, 100) };
  });
  expect(clipPixels.revealed).not.toEqual(clipPixels.clipped);
  expect(clipPixels.clipped.slice(0, 3)).toEqual([10, 14, 25]);
  await page.screenshot({ path: testInfo.outputPath("layered-dashboard-middle.png") });
  await at(1);
  const overlap = await page
    .locator("canvas")
    .evaluate((canvas) =>
      Array.from(canvas.getContext("2d").getImageData(canvas.width / 2 + 310, canvas.height / 2 - 190, 1, 1).data),
    );
  expect(overlap).toEqual([139, 56, 110, 255]);
  expect(overlap).not.toEqual([145, 110, 150, 255]); // 把 0.55 错乘到每个子节点会得到这一结果。
  await page.screenshot({ path: testInfo.outputPath("layered-dashboard-end.png") });
});

test("全屏 Canvas 与可收起 DOM 浮层保持状态", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=0.65");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  const before = await page.evaluate(() => window.layeredDashboardDemo.snapshot());
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeHidden();
  expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).time).toBe(before.time);
  expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe("CANVAS");
});
