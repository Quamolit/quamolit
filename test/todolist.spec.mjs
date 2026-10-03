import { test, expect } from "@playwright/test";

test("公共 Calcit 字体薄桥：真实加载、失败、过期拒绝与原生回退像素", async ({ page }) => {
  await page.goto("/demos/index.html?demo=todolist&t=0");
  const evidence = await page.evaluate(async () => {
    const [font, scene, core, todo, canvas, resource, loadQueue] = await Promise.all([
      import("/target/js/todolist/quamolit.font-resource.mjs"),
      import("/target/js/todolist/quamolit.scene-ir.mjs"),
      import("/target/js/todolist/calcit.core.mjs"),
      import("/target/js/todolist/quamolit.examples.todolist.mjs"),
      import("/target/js/todolist/quamolit.canvas-reference.mjs"),
      import("/target/js/todolist/quamolit.resource-lifecycle.mjs"),
      import("/target/js/todolist/quamolit.resource-load-queue.mjs"),
    ]);
    const tags = core.init_tags([
      "font",
      "family",
      "version",
      "face",
      "queue",
      "task",
      "state",
      "loaded",
      "outcome",
      "transition",
      "actions",
      "interactive",
    ]);
    const spec = scene.default_font().assoc(tags.family, "QuamolitFontFixture").assoc(tags.version, 1);
    const identity = resource.resource(core._PCT__$o__$o_(resource.ResourceKind, tags.font), "ui-font", 1);
    const begin = () => {
      const state = resource.request_resource(resource.initial_state(identity), identity).get(tags.state);
      const enqueued = loadQueue.enqueue_load(
        loadQueue.initial_load_queue(1, 4),
        1,
        identity,
        1,
        core._PCT__$o__$o_(loadQueue.ResourceLoadPriority, tags.interactive),
      );
      const taken = loadQueue.take_load(enqueued.get(tags.queue));
      return { state, queue: taken.get(tags.queue), task: core.option_$o_unwrap(taken.get(tags.task)) };
    };
    const source = "local('Arial'), local('Liberation Sans')";
    const active = begin();
    const queued = await font.run_font_load_task_$x_(spec, source, active.task);
    const result = queued.get(tags.outcome);
    const kind = core.to_js_data(result.get(0));
    if (kind !== "ready") return { kind, error: result.get(1) };
    const completed = font.complete_font_load(active.state, active.queue, queued);
    const loaded = core.option_$o_unwrap(completed.get(tags.loaded)),
      face = loaded.getRequired(tags.face);
    const queueState = core.to_js_data(completed.get(tags.transition).get(tags.state)).phase[0];
    const cancelled = begin();
    const latePending = font.run_font_load_task_$x_(spec, source, cancelled.task);
    cancelled.queue = loadQueue.cancel_resource_loads(cancelled.queue, identity);
    const lateResult = await latePending;
    const lateFace = lateResult.get(tags.outcome).get(1).getRequired(tags.face);
    const ignored = font.complete_font_load(cancelled.state, cancelled.queue, lateResult);
    const late = {
      delivered: core.to_js_data(ignored.get(tags.loaded))[0],
      installed: document.fonts.has(lateFace),
      actions: core.to_js_data(ignored.get(tags.transition).get(tags.actions)),
    };
    const autoInstalled = document.fonts.has(face);
    const stale = font.install_font_$x_(loaded, spec.assoc(tags.version, 2));
    const afterStale = document.fonts.has(face);
    font.install_font_$x_(loaded, spec);
    let failure,
      differences = 0,
      fallbackDifferences = 0,
      blankDifferences = 0;
    try {
      failure = await font.load_font_$x_(spec, "url(data:font/woff2;base64,AA==)");
      const actual = document.createElement("canvas"),
        reference = document.createElement("canvas");
      actual.width = reference.width = 320;
      actual.height = reference.height = 100;
      const a = actual.getContext("2d"),
        b = reference.getContext("2d");
      a.translate(0, 50);
      b.translate(0, 50);
      const content = todo.text(20, "Chart UI / 2026", 24, todo.color(1, 0, 0, 1));
      canvas.draw_text_$x_(a, content.get(1).assoc(tags.font, spec));
      b.font = '24px "QuamolitFont:1:QuamolitFontFixture", monospace';
      b.textBaseline = "middle";
      b.fillStyle = "rgb(255,0,0)";
      b.fillText("Chart UI / 2026", 20, 0);
      const av = a.getImageData(0, 0, 320, 100).data,
        bv = b.getImageData(0, 0, 320, 100).data;
      for (let i = 0; i < av.length; i++) {
        if (av[i] !== bv[i]) differences++;
        if (bv[i] !== 0) blankDifferences++;
      }
      a.clearRect(0, -50, 320, 100);
      b.clearRect(0, -50, 320, 100);
      const missing = spec.assoc(tags.family, "QuamolitMissingFontFixtureNeverInstalled");
      canvas.draw_text_$x_(a, content.get(1).assoc(tags.font, missing));
      b.font = "24px monospace";
      b.fillText("Chart UI / 2026", 20, 0);
      const fallbackActual = a.getImageData(0, 0, 320, 100).data;
      const fallbackReference = b.getImageData(0, 0, 320, 100).data;
      for (let i = 0; i < fallbackActual.length; i++)
        if (fallbackActual[i] !== fallbackReference[i]) fallbackDifferences++;
    } finally {
      font.release_font_$x_(loaded);
    }
    return {
      kind,
      autoInstalled,
      stale,
      afterStale,
      status: face.status,
      failure: core.to_js_data(failure),
      differences,
      fallbackDifferences,
      blankDifferences,
      retained: document.fonts.has(face),
      repeatedRelease: font.release_font_$x_(loaded),
      queueState,
      late,
    };
  });
  expect(evidence).toMatchObject({
    kind: "ready",
    status: "loaded",
    autoInstalled: false,
    stale: false,
    afterStale: false,
    differences: 0,
    fallbackDifferences: 0,
    retained: false,
    repeatedRelease: false,
    queueState: "ready",
    late: { delivered: "none", installed: false, actions: [] },
  });
  expect(evidence.failure[0]).toBe("failed");
  expect(evidence.failure[1].length).toBeGreaterThan(0);
  expect(evidence.blankDifferences).toBeGreaterThan(0);
});

test("同名字体不同来源版本共存，安装顺序和释放旧版不改变新版字形", async ({ page }) => {
  await page.goto("/demos/index.html?demo=todolist&t=0");
  const evidence = await page.evaluate(async () => {
    const [font, scene, core, todo, canvas] = await Promise.all([
      import("/target/js/todolist/quamolit.font-resource.mjs"),
      import("/target/js/todolist/quamolit.scene-ir.mjs"),
      import("/target/js/todolist/calcit.core.mjs"),
      import("/target/js/todolist/quamolit.examples.todolist.mjs"),
      import("/target/js/todolist/quamolit.canvas-reference.mjs"),
    ]);
    const tags = core.init_tags(["family", "version", "font", "face"]);
    const sources = ["local('Arial'), local('Liberation Sans')", "local('Courier New'), local('Liberation Mono')"];
    const specs = [1, 2].map((version) =>
      scene.default_font().assoc(tags.family, "QuamolitVersionFixture").assoc(tags.version, version),
    );
    const loaded = [];
    const references = [];
    const actual = document.createElement("canvas"),
      reference = document.createElement("canvas");
    actual.width = reference.width = 320;
    actual.height = reference.height = 100;
    const a = actual.getContext("2d"),
      b = reference.getContext("2d");
    const text = todo.text(20, "WWWWiiii2026", 24, todo.color(1, 0, 0, 1)).get(1);
    const pixels = (index) => {
      a.clearRect(0, 0, 320, 100);
      b.clearRect(0, 0, 320, 100);
      a.save();
      a.translate(0, 50);
      canvas.draw_text_$x_(a, text.assoc(tags.font, specs[index]));
      a.restore();
      b.font = `24px "QuamolitVersionReference${index}", monospace`;
      b.textBaseline = "middle";
      b.fillStyle = "rgb(255,0,0)";
      b.fillText("WWWWiiii2026", 20, 50);
      const av = Array.from(a.getImageData(0, 0, 320, 100).data);
      const bv = b.getImageData(0, 0, 320, 100).data;
      return { differences: av.filter((value, i) => value !== bv[i]).length, av };
    };
    try {
      for (let i = 0; i < 2; i++) {
        const result = await font.load_font_$x_(specs[i], sources[i]);
        if (core.to_js_data(result.get(0)) !== "ready") throw Error(JSON.stringify(core.to_js_data(result)));
        loaded.push(result.get(1));
        const ref = await new FontFace(`QuamolitVersionReference${i}`, sources[i]).load();
        references.push(ref);
        document.fonts.add(ref);
      }
      // 旧选择方式的独立反例：FontFaceSet 不知道逻辑 version，后加入的同名字体会改变选择。
      const collision = [];
      for (const source of sources) {
        const face = await new FontFace("QuamolitNativeCollision", source).load();
        collision.push(face);
        references.push(face);
      }
      b.font = '24px "QuamolitNativeCollision", monospace';
      document.fonts.add(collision[0]);
      const nativeBefore = b.measureText("WWWWiiii2026").width;
      document.fonts.add(collision[1]);
      const nativeBoth = b.measureText("WWWWiiii2026").width;
      for (const item of collision) document.fonts.delete(item);
      const checks = [];
      let distinctPixels = 0;
      for (const order of [
        [0, 1],
        [1, 0],
      ]) {
        for (const item of loaded) font.release_font_$x_(item);
        for (const index of order) font.install_font_$x_(loaded[index], specs[index]);
        const first = pixels(0),
          second = pixels(1);
        checks.push(first.differences, second.differences);
        distinctPixels = first.av.filter((value, i) => value !== second.av[i]).length;
        font.release_font_$x_(loaded[0]);
        checks.push(pixels(1).differences);
      }
      return {
        checks,
        distinctPixels,
        nativeCollision: nativeBefore !== nativeBoth,
        families: loaded.map((item) => item.getRequired(tags.face).family),
        newVersionInstalled: document.fonts.has(loaded[1].getRequired(tags.face)),
      };
    } finally {
      for (const item of loaded) font.release_font_$x_(item);
      for (const item of references) document.fonts.delete(item);
    }
  });
  expect(evidence.checks).toEqual([0, 0, 0, 0, 0, 0]);
  expect(evidence.distinctPixels).toBeGreaterThan(0);
  expect(evidence.nativeCollision).toBe(true);
  // FontFace.family 是 CSSOM 序列化结果，包含别名中的冒号时 Chromium 会加引号。
  expect(evidence.families).toEqual([
    '"QuamolitFont:1:QuamolitVersionFixture"',
    '"QuamolitFont:2:QuamolitVersionFixture"',
  ]);
  expect(evidence.newVersionInstalled).toBe(true);
});

test("未来日志按 deadline 唤醒，暂停/卸载取消，resize 不推迟事件", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const origin = new Date("2026-10-02T00:00:00Z");
  await page.clock.install({ time: origin });
  await page.clock.pauseAt(origin);
  await page.goto("/demos/index.html?demo=todolist&t=0");
  // 统一导航的淡入定时器也由同一可控宿主时钟驱动。
  await page.clock.runFor(400);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
  await page.clock.runFor(32);
  const snapshot = () => page.evaluate(() => window.todoDemo.snapshot());
  await page.evaluate(() => {
    window.todoDemo.importEvents({ version: 1, events: [{ at: 5, kind: "add", id: "", text: "Deadline" }] });
    window.todoDemo.play();
  });
  const idle = await snapshot();
  expect(idle).toMatchObject({ playing: true, pending: false, waiting: true });
  await page.clock.runFor(2100);
  expect((await snapshot()).paints).toBe(idle.paints);
  await page.setViewportSize({ width: 1000, height: 760 });
  await expect.poll(async () => (await snapshot()).pending).toBe(true);
  await page.clock.runFor(32);
  const resized = await snapshot();
  expect(resized.width).toBe(1000);
  expect(resized.model.rows).toHaveLength(0);
  expect(resized).toMatchObject({ pending: false, waiting: true });
  await page.clock.runFor(3000);
  expect((await snapshot()).model.rows[0].text).toBe("Deadline");
  await page.clock.runFor(1000);
  expect(await snapshot()).toMatchObject({ playing: false, pending: false, waiting: false });
  await page.evaluate(() => {
    window.todoDemo.seek(0);
    window.todoDemo.play();
    window.todoDemo.pause();
  });
  const paused = await snapshot();
  await page.clock.runFor(6000);
  expect(await snapshot()).toEqual(paused);
  await page.evaluate(() => {
    window.closedTodo = window.todoDemo;
    window.todoDemo.play();
  });
  expect((await snapshot()).waiting).toBe(true);
  // 不通过 Playwright click 自动等待动画帧，避免暂停的宿主时钟干扰导航。
  await page.evaluate(() => document.querySelector("#back-to-gallery").click());
  await page.clock.runFor(400);
  await expect(page.locator("#app")).toHaveAttribute("data-view", "gallery");
  const closed = await page.evaluate(() => window.closedTodo.snapshot());
  expect(closed).toMatchObject({ disposed: true, playing: false, pending: false, waiting: false });
  await page.clock.runFor(6000);
  expect(await page.evaluate(() => window.closedTodo.snapshot())).toEqual(closed);
  expect(errors).toEqual([]);
});

async function ready(page, time = 0.8) {
  await page.goto(`http://127.0.0.1:5180/examples/todolist/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}
async function clickRow(page, id, action) {
  const point = await page.evaluate(
    ({ id, action }) => {
      const s = window.todoDemo.snapshot(),
        kind = action === "toggle" ? "rect" : "text";
      const index = s.scene.nodes.findIndex((n) => n.id === `presence/${kind}/${id}/${action}`),
        m = s.transforms[index];
      if (!m) throw Error("missing row target");
      const x = { toggle: -270, edit: -160, front: 225, remove: 270 }[action];
      const c = document.querySelector("canvas"),
        b = c.getBoundingClientRect();
      return {
        x: b.x + ((s.view.x + (m.e + x) * s.view.scale) * b.width) / c.width,
        y: b.y + ((s.view.y + m.f * s.view.scale) * b.height) / c.height,
      };
    },
    { id, action },
  );
  await page.mouse.click(point.x, point.y);
}

test("Canvas 文字与矩形符合独立原生参考，固定时间截图", async ({ page }, testInfo) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const t = await import("/target/js/todolist/quamolit.examples.todolist.mjs");
    const r = await import("/target/js/todolist/quamolit.retained-component.mjs");
    const create = () => {
      const c = document.createElement("canvas");
      c.width = 900;
      c.height = 760;
      return c.getContext("2d");
    };
    const actual = create(),
      reference = create();
    actual.translate(450, 380);
    reference.translate(450, 380);
    r.draw_plan_$x_(actual, t.start_plan(t.replay(t.demo_log(), 0.8), 0.8));
    for (const [i, label] of ["Explore", "Animate", "Sketch"].entries()) {
      reference.save();
      reference.translate(0, -160 + i * 64);
      reference.fillStyle = "rgb(26,41,59)";
      reference.fillRect(-300, -25, 600, 50);
      reference.fillStyle = "rgb(51,77,107)";
      reference.fillRect(-282, -14, 28, 28);
      reference.textAlign = "left";
      reference.textBaseline = "middle";
      reference.direction = "ltr";
      reference.fillStyle = "rgb(224,237,250)";
      reference.font = "18px monospace";
      reference.fillText(label, -234, 0);
      reference.fillStyle = "rgb(133,179,224)";
      reference.font = "22px monospace";
      reference.fillText("↑", 215, 0);
      reference.fillStyle = "rgb(250,133,133)";
      reference.font = "24px monospace";
      reference.fillText("×", 260, 0);
      reference.restore();
    }
    const a = actual.getImageData(0, 0, 900, 760).data,
      b = reference.getImageData(0, 0, 900, 760).data;
    return {
      same: a.every((v, i) => v === b[i]),
      actual: actual.canvas.toDataURL(),
      expected: reference.canvas.toDataURL(),
    };
  });
  for (const name of ["actual", "expected"])
    await testInfo.attach(name, { body: Buffer.from(result[name].split(",")[1], "base64"), contentType: "image/png" });
  expect(result.same).toBe(true);
  await page.locator("#panel-toggle").click();
  for (const time of [0.25, 1.65, 1.7, 2.6, 4]) {
    await page.evaluate((t) => window.todoDemo.seek(t), time);
    await page.screenshot({ path: testInfo.outputPath(`todo-${time}.png`) });
  }
});

test("新增、Canvas 完成/编辑/置顶/删除、恢复与日志重放", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await page.locator("#draft").fill("New motion");
  await page.locator("#submit").click();
  await page.evaluate(() => window.todoDemo.pause());
  expect((await page.evaluate(() => window.todoDemo.snapshot())).model.rows[0].text).toBe("New motion");
  // 跳到当前自定义日志的终点，使进入动画结束；不会恢复被截断的示范未来事件。
  await page.evaluate(() => window.todoDemo.seek(2));
  await page.locator("#panel-toggle").click();
  await clickRow(page, "4", "toggle");
  await page.evaluate(() => window.todoDemo.pause());
  expect((await page.evaluate(() => window.todoDemo.snapshot())).model.rows.find((r) => r.id === "4").done).toBe(true);
  await clickRow(page, "4", "edit");
  await expect(page.locator("#panel")).toBeVisible();
  await page.locator("#draft").fill("Edited");
  await page.locator("#submit").click();
  await page.evaluate(() => window.todoDemo.pause());
  await page.locator("#panel-toggle").click();
  await clickRow(page, "1", "front");
  await page.evaluate(() => window.todoDemo.pause());
  expect((await page.evaluate(() => window.todoDemo.snapshot())).model.rows[0].id).toBe("1");
  await page.evaluate(() => window.todoDemo.seek(3));
  await clickRow(page, "4", "remove");
  await page.evaluate(() => window.todoDemo.pause());
  expect((await page.evaluate(() => window.todoDemo.snapshot())).model.rows.find((r) => r.id === "4").present).toBe(
    false,
  );
  await page.locator("#panel-toggle").click();
  await page.locator("#restore").click();
  await page.evaluate(() => window.todoDemo.pause());
  const snapshot = await page.evaluate(() => window.todoDemo.seek(4));
  expect(snapshot.model.rows.find((r) => r.id === "4")).toMatchObject({ text: "Edited", present: true, done: true });
  const imported = await page.evaluate((events) => {
    window.todoDemo.importEvents({ version: 1, events });
    return window.todoDemo.seek(4);
  }, snapshot.events);
  expect(imported.scene).toEqual(snapshot.scene);
  expect(imported.transforms).toEqual(snapshot.transforms);
  expect(errors).toEqual([]);
});

test("终点释放后两秒无连续绘制，输入重新唤醒", async ({ page }) => {
  await ready(page, 3.5);
  await page.locator("#play").click();
  await expect.poll(() => page.evaluate(() => window.todoDemo.snapshot().playing)).toBe(false);
  const before = await page.evaluate(() => window.todoDemo.snapshot());
  expect(before.model.released).toBe(6);
  await page.waitForTimeout(2100);
  expect((await page.evaluate(() => window.todoDemo.snapshot())).paints).toBe(before.paints);
  await page.locator("#reverse").click();
  await expect.poll(() => page.evaluate(() => window.todoDemo.snapshot().paints)).toBeGreaterThan(before.paints);
});

for (const dpr of [1, 2])
  test(`公共 Scene 命中 DPR ${dpr}：退出立即禁用、暂停 resize、恢复重新进入`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: dpr });
    try {
      const page = await context.newPage();
      await ready(page, 1);
      await page.locator("#live").click();
      await page.locator("#panel-toggle").click();
      const before = await page.evaluate(() => window.todoDemo.snapshot());
      expect(before.hitCandidates).toBe(3);
      await page.evaluate(() => {
        window.todoDemo.send("remove", "3");
        window.todoDemo.pause();
      });
      const exiting = await page.evaluate(() => window.todoDemo.snapshot());
      expect(exiting.hitCandidates).toBe(2);
      expect(exiting.scene.nodes.some((n) => n.id === "presence/rect/3/card")).toBe(true);
      await page.setViewportSize({ width: 1000, height: 720 });
      await expect.poll(() => page.evaluate(() => window.todoDemo.snapshot().width)).toBe(1000 * dpr);
      expect((await page.evaluate(() => window.todoDemo.snapshot())).model).toEqual(exiting.model);
      await clickRow(page, "3", "toggle");
      expect((await page.evaluate(() => window.todoDemo.snapshot())).events).toEqual(exiting.events);
      await clickRow(page, "1", "toggle");
      await page.evaluate(() => window.todoDemo.pause());
      expect((await page.evaluate(() => window.todoDemo.snapshot())).model.rows.find((r) => r.id === "1").done).toBe(
        true,
      );
      await page.evaluate(() => {
        window.todoDemo.send("restore");
        window.todoDemo.pause();
      });
      const restored = await page.evaluate(() => window.todoDemo.seek(2));
      expect(restored.hitCandidates).toBe(3);
      await clickRow(page, "3", "toggle");
      await page.evaluate(() => window.todoDemo.pause());
      expect((await page.evaluate(() => window.todoDemo.snapshot())).model.rows.find((r) => r.id === "3").done).toBe(
        true,
      );
    } finally {
      await context.close();
    }
  });

for (const dpr of [1, 2])
  test(`全屏 DPR ${dpr}：暂停 resize 不推进 Model，浮层不误触`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    try {
      await ready(page, 2.6);
      const original = await page.evaluate(() => window.todoDemo.snapshot());
      for (const size of [
        { width: 1280, height: 900 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(size);
        await expect
          .poll(() => page.locator("canvas").evaluate((c) => [c.width, c.height]))
          .toEqual([size.width * dpr, size.height * dpr]);
        expect(await page.locator("canvas").boundingBox()).toEqual({ x: 0, y: 0, ...size });
        const after = await page.evaluate(() => window.todoDemo.snapshot());
        expect(after.model).toEqual(original.model);
        expect(after.time).toBe(original.time);
        expect(after.scene).toEqual(original.scene);
        await page.locator("#panel-toggle").click();
        await expect(page.locator("#panel")).toBeHidden();
        expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
          "CANVAS",
        );
        await page.screenshot({ path: testInfo.outputPath(`todolist-${size.width}-${dpr}.png`) });
        await page.locator("#panel-toggle").click();
        expect((await page.evaluate(() => window.todoDemo.snapshot())).events).toEqual(original.events);
      }
    } finally {
      await context.close();
    }
  });

for (const dpr of [1, 2])
  test(`窄屏 DPR ${dpr}：18px 文字、44px 操作、原生参考与长列表视窗`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: dpr,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await ready(page, 1);
      await page.locator("#live").click();
      await page.locator("#panel-toggle").click();
      const original = await page.evaluate(() => window.todoDemo.snapshot());
      expect(original.compact).toBe(true);
      expect(original.view.scale).toBe(dpr);
      const pixels = await page.evaluate(() => {
        const s = window.todoDemo.snapshot(),
          canvas = document.querySelector("canvas");
        const layer = new OffscreenCanvas(canvas.width, canvas.height),
          c = layer.getContext("2d");
        const ratio = devicePixelRatio,
          cssWidth = canvas.width / ratio;
        c.setTransform(ratio, 0, 0, ratio, canvas.width / 2, 0);
        c.beginPath();
        c.rect(-cssWidth / 2, 0, cssWidth, canvas.height / ratio);
        c.clip();
        const color = (value) =>
          `rgba(${Math.round(value.r * 255)},${Math.round(value.g * 255)},${Math.round(value.b * 255)},${value.a})`;
        const half = (cssWidth - 24) / 2;
        for (let index = 0; index < s.scene.nodes.length; index++) {
          if (!s.scene.nodes[index].id.endsWith("/card")) continue;
          const source = s.scene.nodes.slice(index, index + 6),
            matrix = s.transforms[index];
          c.save();
          c.translate(matrix.e, 116 + ((matrix.f + 160) * 132) / 64 - s.scroll);
          c.fillStyle = color(source[0].content[1].fill);
          c.fillRect(-half, -46, half * 2, 112);
          for (const offset of [1, 2]) {
            c.fillStyle = color(source[offset].content[1].fill);
            c.fillRect(-half + 12, 25, source[offset].content[1].width, 28);
          }
          c.textAlign = "left";
          c.textBaseline = "middle";
          c.direction = "ltr";
          const label = source[3].content[1],
            cut = Math.min(Math.floor((cssWidth - 48) / 18), label.text.length);
          c.font = "18px monospace";
          c.fillStyle = color(label.fill);
          c.fillText(label.text.slice(0, cut), -half + 12, -26);
          c.fillText(label.text.slice(cut), -half + 12, -3);
          c.font = "24px monospace";
          c.fillStyle = color(source[4].content[1].fill);
          c.fillText("↑", half - 104, 39);
          c.font = "26px monospace";
          c.fillStyle = color(source[5].content[1].fill);
          c.fillText("×", half - 48, 39);
          c.restore();
        }
        const expected = document.createElement("canvas");
        expected.width = canvas.width;
        expected.height = canvas.height;
        expected.getContext("2d").drawImage(layer, 0, 0);
        const a = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        const b = expected.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let differences = 0,
          covered = 0;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) differences++;
        for (let i = 3; i < a.length; i += 4) if (a[i]) covered++;
        expected.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        expected.getContext("2d").drawImage(layer, 1, 0);
        const wrong = expected.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let shiftedDifferences = 0;
        for (let i = 0; i < a.length; i++) if (a[i] !== wrong[i]) shiftedDifferences++;
        return { differences, covered, shiftedDifferences };
      });
      expect(pixels.differences).toBe(0);
      expect(pixels.covered).toBeGreaterThan(0);
      expect(pixels.shiftedDifferences).toBeGreaterThan(0);
      const buttons = original.presentation.nodes.filter((n) => n.id.includes("/tap-") && !n.id.endsWith("tap-edit"));
      expect(buttons).toHaveLength(9);
      expect(buttons.every((n) => n.content[1].width === 44 && n.content[1].height === 44)).toBe(true);
      await page.touchscreen.tap(46, 155);
      await page.evaluate(() => window.todoDemo.pause());
      expect((await page.evaluate(() => window.todoDemo.snapshot())).model.rows.find((r) => r.id === "3").done).toBe(
        true,
      );
      await page.evaluate(() => {
        const s = window.todoDemo;
        s.send("edit", "3", "中文长内容验证保持完整二十八字符和操作区域正常可用");
        s.pause();
        for (let i = 0; i < 15; i++) {
          s.send("add", "", `Long English item number ${i}`);
          s.pause();
        }
        s.seek(10);
      });
      const long = await page.evaluate(() => window.todoDemo.snapshot());
      expect(long.scrollLimit).toBeGreaterThan(0);
      for (const row of long.model.rows) {
        const first = long.presentation.nodes.find((n) => n.id.endsWith(`/${row.id}/edit`));
        const second = long.presentation.nodes.find((n) => n.id.endsWith(`/${row.id}/edit/line-2`));
        expect(first.content[1].text + second.content[1].text).toBe(row.text);
      }
      const scrolled = await page.evaluate(() => window.todoDemo.setScroll(100000));
      expect(scrolled.scroll).toBe(scrolled.scrollLimit);
      expect(scrolled.model).toEqual(long.model);
      expect(scrolled.time).toBe(long.time);
      const rejected = await page.evaluate(() => {
        const before = window.todoDemo.snapshot();
        const failures = [];
        for (const value of [NaN, Infinity, -Infinity]) {
          try {
            window.todoDemo.setScroll(value);
          } catch (error) {
            failures.push(error.message);
          }
        }
        return { before, after: window.todoDemo.snapshot(), failures };
      });
      expect(rejected.failures).toHaveLength(3);
      expect(rejected.after).toEqual(rejected.before);
      await page.screenshot({ path: testInfo.outputPath(`compact-list-dpr${dpr}.png`) });
      // 独立布局公式：末行下边缘182，完成按钮中心155，滚到末尾后中心应在height-27。
      const lastRow = long.model.rows.at(-1);
      await page.touchscreen.tap(46, 844 - 27);
      await page.evaluate(() => window.todoDemo.pause());
      const tapped = await page.evaluate(() => window.todoDemo.snapshot());
      expect(tapped.model.rows.find((row) => row.id === lastRow.id).done).toBe(!lastRow.done);
      expect(tapped.events).toHaveLength(long.events.length + 1);
      await page.setViewportSize({ width: 320, height: 640 });
      await expect.poll(() => page.evaluate(() => window.todoDemo.snapshot().width)).toBe(320 * dpr);
      expect((await page.evaluate(() => window.todoDemo.snapshot())).model).toEqual(tapped.model);
      await page.setViewportSize({ width: 1280, height: 900 });
      await expect.poll(() => page.evaluate(() => window.todoDemo.snapshot().compact)).toBe(false);
      expect((await page.evaluate(() => window.todoDemo.snapshot())).model).toEqual(tapped.model);
    } finally {
      await context.close();
    }
  });

test("非法日志不污染当前状态", async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(() => {
    const before = window.todoDemo.snapshot();
    let error = "";
    try {
      window.todoDemo.importEvents({ version: 1, events: [{ at: 4, kind: "remove", id: "missing", text: "" }] });
    } catch (e) {
      error = e.message;
    }
    return { error, before, after: window.todoDemo.snapshot() };
  });
  expect(result.error).toContain("missing-active-todo-row");
  expect(result.after).toEqual(result.before);
});
