import { expect, test } from "@playwright/test";

for (const dpr of [1, 2]) {
  test(`标题精确文字命中随同时间字体ready和暂停resize重提交 DPR${dpr}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    try {
      await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
      await page.evaluate(() => {
        document.querySelector("#panel").hidden = true;
      });
      const probes = () =>
        page.evaluate(() => {
          const state = window.layeredDashboardDemo.snapshot();
          const titleNode = state.scene.nodes.find((node) => node.id.endsWith("/5:title"));
          const title = titleNode.content[1];
          const transform = state.scene.nodes.find((node) => node.id.endsWith("/9:dashboard")).content[1].transform;
          const canvas = document.querySelector("canvas");
          const bounds = canvas.getBoundingClientRect();
          const ctx = canvas.getContext("2d");
          ctx.save();
          ctx.font = `${title.size}px ${title.font.family ? JSON.stringify(`QuamolitFont:${title.font.version}:${title.font.family}`) + ", " : ""}monospace`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.direction = "ltr";
          const ink = ctx.measureText(title.text);
          ctx.restore();
          const box = {
            left: title.x - ink.actualBoundingBoxLeft,
            right: title.x + ink.actualBoundingBoxRight,
            top: title.y - ink.actualBoundingBoxAscent,
            bottom: title.y + ink.actualBoundingBoxDescent,
          };
          const point = (x, y) => ({
            x: bounds.left + ((transform.a * x + transform.c * y + transform.e) * bounds.width) / canvas.width,
            y: bounds.top + ((transform.b * x + transform.d * y + transform.f) * bounds.height) / canvas.height,
          });
          const inside = point((box.left + box.right) / 2, (box.top + box.bottom) / 2);
          const negative = [];
          for (let y = title.y - title.size / 2 + 1; y < title.y + title.size / 2; y++) {
            if (y < box.top - 0.5 || y > box.bottom + 0.5) negative.push(point(title.x + 10, y));
          }
          return {
            state,
            box,
            inside,
            outside: negative[0] ?? point(box.left - 2, (box.top + box.bottom) / 2),
            approximateFalsePositive: negative.length > 0,
            titleId: titleNode.id,
          };
        });
      const check = async (probe) => {
        expect(probe.outside).toBeDefined();
        await page.mouse.move(probe.inside.x, probe.inside.y);
        expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).pointer["hover-node"]).toBe(
          probe.titleId,
        );
        await page.mouse.move(probe.outside.x, probe.outside.y);
        expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).pointer["hover-node"]).not.toBe(
          probe.titleId,
        );
      };
      const initial = await probes();
      expect(initial.approximateFalsePositive).toBe(true); // 固定monospace的旧近似框负例必须存在。
      await check(initial);
      await page.evaluate(() => {
        const Original = FontFace;
        let release;
        const gate = new Promise((resolve) => {
          release = resolve;
        });
        window.FontFace = class extends Original {
          load() {
            return super.load().then((face) => gate.then(() => face));
          }
        };
        window.fontHitGate = {
          release,
          restore: () => {
            window.FontFace = Original;
          },
        };
        window.fontHitPending = window.layeredDashboardDemo.enableFont("local('Arial'), local('Liberation Sans')");
      });
      const waiting = await probes();
      expect(waiting.state.fonts.host.accepted).toBe(0);
      expect(waiting.state.time).toBe(1);
      expect(waiting.approximateFalsePositive).toBe(true);
      await check(waiting);
      await page.evaluate(async () => {
        window.fontHitGate.release();
        await window.fontHitPending;
        window.fontHitGate.restore();
      });
      const ready = await probes();
      expect(ready.state.fonts.host.accepted).toBe(1);
      expect(ready.state.time).toBe(waiting.state.time);
      expect(ready.state.events).toEqual(waiting.state.events);
      expect(ready.state.playing).toBe(false);
      expect(Math.abs(ready.box.right - waiting.box.right)).toBeGreaterThan(1);
      await check(ready);
      // 选取新旧字体边界之间的位置，检测同时间ready后继续用fallback计划的错误。
      const changed = { x: (ready.inside.x + waiting.inside.x) / 2, y: ready.inside.y };
      const boundaryProbe = await page.evaluate(
        ({ oldBox, newBox }) => {
          const s = window.layeredDashboardDemo.snapshot();
          const m = s.scene.nodes.find((n) => n.id.endsWith("/9:dashboard")).content[1].transform;
          const canvas = document.querySelector("canvas"),
            b = canvas.getBoundingClientRect();
          const x = (oldBox.right + newBox.right) / 2,
            y = (newBox.top + newBox.bottom) / 2;
          return {
            x: b.left + ((m.a * x + m.e) * b.width) / canvas.width,
            y: b.top + ((m.d * y + m.f) * b.height) / canvas.height,
            expected: x < newBox.right,
          };
        },
        { oldBox: waiting.box, newBox: ready.box },
      );
      await page.mouse.move(boundaryProbe.x, boundaryProbe.y);
      expect(
        (await page.evaluate(() => window.layeredDashboardDemo.snapshot())).pointer["hover-node"] === ready.titleId,
      ).toBe(boundaryProbe.expected);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await expect.poll(() => page.evaluate(() => window.layeredDashboardDemo.snapshot().width)).toBe(1440 * dpr);
      const resized = await probes();
      expect(resized.state.time).toBe(1);
      await check(resized);
      await page.evaluate(() => window.layeredDashboardDemo.enableImages());
      await page.evaluate(() => {
        const Original = FontFace;
        let release, began;
        const gate = new Promise((resolve) => {
          release = resolve;
        });
        const started = new Promise((resolve) => {
          began = resolve;
        });
        window.FontFace = class extends Original {
          load() {
            const loaded = super.load();
            if (this.family.includes(":2:")) {
              began();
              return loaded.then((face) => gate.then(() => face));
            }
            return loaded;
          }
        };
        window.fontVersionGate = {
          release,
          started,
          restore: () => {
            window.FontFace = Original;
          },
        };
        window.fontVersionPending = window.layeredDashboardDemo.setFontSource(
          "local('Courier New'), local('Liberation Mono')",
        );
      });
      await page.evaluate(() => window.fontVersionGate.started);
      const replacementWaiting = await probes();
      expect(replacementWaiting.state.fontVersion).toBe(2);
      expect(replacementWaiting.state.time).toBe(1);
      await check(replacementWaiting);
      await page.evaluate(() => window.layeredDashboardDemo.setFontSource("local('Arial'), local('Liberation Sans')"));
      const latest = await probes();
      expect(latest.state.fontVersion).toBe(3);
      expect(latest.state.fonts.host.accepted).toBe(2);
      expect(latest.state.imageReady).toBe(true);
      expect(latest.state.imageVersion).toBe(1);
      expect(latest.state.fonts.images.created).toBe(1);
      expect(latest.state.events).toEqual(waiting.state.events);
      expect(
        latest.state.scene.nodes
          .filter((node) => node.content[0] === "text")
          .every((node) => node.content[1].font.version === 3),
      ).toBe(true);
      await check(latest);
      const beforeLate = await page.evaluate(() => ({
        state: window.layeredDashboardDemo.snapshot(),
        pixels: document.querySelector("canvas").toDataURL(),
      }));
      await page.evaluate(async () => {
        window.fontVersionGate.release();
        await window.fontVersionPending;
        window.fontVersionGate.restore();
      });
      const afterLate = await page.evaluate(() => ({
        state: window.layeredDashboardDemo.snapshot(),
        pixels: document.querySelector("canvas").toDataURL(),
        oldInstalled: [...document.fonts].some((face) => face.family.includes(":2:")),
      }));
      expect(afterLate.state.fontVersion).toBe(3);
      expect(afterLate.state.fonts.revision).toBe(beforeLate.state.fonts.revision);
      expect(afterLate.state.paints).toBe(beforeLate.state.paints);
      expect(afterLate.state.fonts.host.accepted).toBe(2);
      expect(afterLate.state.fonts.images).toEqual(beforeLate.state.fonts.images);
      expect(afterLate.oldInstalled).toBe(false);
      expect(afterLate.pixels).toBe(beforeLate.pixels);
      await page.mouse.move(resized.inside.x, resized.inside.y);
      await page.mouse.down();
      expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).pointer.capture).toEqual([
        "captured",
        1,
        "title",
        resized.titleId,
      ]);
      const exiting = await page.evaluate(() => {
        const api = window.layeredDashboardDemo;
        api.setVisible(false);
        api.pause();
        return api.snapshot();
      });
      expect(exiting.captured).toBeNull();
      expect(exiting.pointer["hover-node"]).not.toBe(resized.titleId);
      await page.mouse.up();
      await page.mouse.move(changed.x, changed.y);
      expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).pointer["hover-node"]).not.toBe(
        resized.titleId,
      );
      await page.evaluate(() => {
        const api = window.layeredDashboardDemo;
        api.seek(1.3);
        api.setVisible(true);
        api.pause();
        api.seek(1.9);
      });
      await check(await probes());
      const closedVersions = await page.evaluate(() => {
        const api = window.layeredDashboardDemo;
        api.dispose();
        api.dispose();
        return { state: api.snapshot(), nativeFonts: document.fonts.size };
      });
      expect(closedVersions.state.fonts.host.handles).toEqual([]);
      expect(closedVersions.state.fonts.host.released).toBe(closedVersions.state.fonts.host.accepted);
      expect(closedVersions.state.fonts.images.released).toBe(closedVersions.state.fonts.images.created);
      expect(closedVersions.state.fonts.references).toEqual([]);
      expect(closedVersions.nativeFonts).toBe(0);
      // 失败分支必须以实际fallback墨迹命中，不能保留上次挂载的字体计划。
      await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
      await page.evaluate(async () => {
        document.querySelector("#panel").hidden = true;
        await window.layeredDashboardDemo.enableFont("local('QuamolitMissingFont-TextHitRegression')");
      });
      const failed = await probes();
      expect(failed.state.mediaError).not.toBe("");
      expect(failed.state.fonts.host.accepted).toBe(0);
      expect(failed.state.time).toBe(1);
      await check(failed);
      // 按钮真正使用新版本恢复失败字体，不偷偷在version=1下换来源。
      await page.evaluate(() => {
        document.querySelector("#panel").hidden = false;
      });
      await page.getByRole("button", { name: "刷新字体（新版本）", exact: true }).click();
      await expect.poll(() => page.evaluate(() => window.layeredDashboardDemo.snapshot().fonts.host.accepted)).toBe(1);
      expect((await probes()).state.fontVersion).toBe(2);
      await page.evaluate(() => {
        document.querySelector("#panel").hidden = true;
      });
      await check(await probes());
    } finally {
      await context.close();
    }
  });
}

test("两个旧decode占槽时，新版本等待排队且不越过有界背压", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const result = await page.evaluate(async () => {
    const api = window.layeredDashboardDemo;
    await api.enableFont();
    const original = HTMLImageElement.prototype.decode;
    const picture = (color) =>
      `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="650" height="432"><rect width="650" height="432" fill="${color}"/></svg>`)}`;
    const red = picture("red"),
      green = picture("green"),
      blue = picture("blue");
    const gates = new Map();
    const beginnings = new Map();
    for (const url of [red, green]) {
      let release, started;
      const wait = new Promise((resolve) => {
        release = resolve;
      });
      const began = new Promise((resolve) => {
        started = resolve;
      });
      gates.set(url, { wait, release, started });
      beginnings.set(url, began);
    }
    HTMLImageElement.prototype.decode = function () {
      return original.call(this).then(() => {
        const gate = gates.get(this.src);
        if (gate) {
          gate.started();
          return gate.wait;
        }
      });
    };
    try {
      const first = api.setImageSource(red);
      await beginnings.get(red);
      const second = api.setImageSource(green);
      await beginnings.get(green);
      let completed = false;
      const latest = api.setImageSource(blue).then((value) => {
        completed = true;
        return value;
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      const queued = { ...api.snapshot(), completed };
      gates.get(red).release();
      const ready = await latest;
      const pixels = document.querySelector("canvas").toDataURL();
      gates.get(green).release();
      await Promise.all([first, second]);
      const after = api.snapshot();
      return { queued, ready, after, samePixels: pixels === document.querySelector("canvas").toDataURL() };
    } finally {
      HTMLImageElement.prototype.decode = original;
      for (const gate of gates.values()) gate.release();
    }
  });
  expect(result.queued.completed).toBe(false);
  expect(result.queued.imageReady).toBe(false);
  expect(result.queued.fonts.queue.running).toHaveLength(2);
  expect(result.queued.fonts.queue.pending).toHaveLength(1);
  expect(result.ready.imageVersion).toBe(4);
  expect(result.ready.imageReady).toBe(true);
  expect(result.ready.fonts.queue.running).toHaveLength(1);
  expect(result.after.fonts.queue.running).toEqual([]);
  expect(result.after.fonts.images.created).toBe(3);
  expect(result.after.fonts.images.released).toBe(2);
  expect(result.after.fonts.images.handles).toHaveLength(1);
  expect(result.after.fonts.revision).toBe(result.ready.fonts.revision);
  expect(result.after.paints).toBe(result.ready.paints);
  expect(result.samePixels).toBe(true);
});

test("图片就地重试保留同identity和字体；仅新版本刷新改变version", async ({ page }) => {
  let attempts = 0;
  await page.route("**/assets/lotus.jpg", (route) => (++attempts === 1 ? route.abort() : route.continue()));
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const failed = await page.evaluate(async () => {
    await Promise.all([window.layeredDashboardDemo.enableFont(), window.layeredDashboardDemo.enableImages()]);
    return window.layeredDashboardDemo.snapshot();
  });
  expect(failed.imageError).not.toBe("");
  expect(failed.imageVersion).toBe(1);
  await page.getByRole("button", { name: "重试图片", exact: true }).click();
  await expect
    .poll(async () => (await page.evaluate(() => window.layeredDashboardDemo.snapshot())).imageReady)
    .toBe(true);
  const retried = await page.evaluate(() => window.layeredDashboardDemo.snapshot());
  expect(retried.imageVersion).toBe(1);
  expect(retried.imageError).toBe("");
  expect(retried.fonts.host.accepted).toBe(1);
  expect(retried.fonts.references).toHaveLength(2);
  expect(retried.fonts.registry.loads).toBe(3);
  expect(retried.fonts.images.handles).toHaveLength(1);
  const events = retried.events;
  await page.getByRole("button", { name: "刷新图片（新版本）", exact: true }).click();
  await expect
    .poll(async () => (await page.evaluate(() => window.layeredDashboardDemo.snapshot())).imageVersion)
    .toBe(2);
  await expect
    .poll(async () => (await page.evaluate(() => window.layeredDashboardDemo.snapshot())).imageReady)
    .toBe(true);
  const refreshed = await page.evaluate(() => window.layeredDashboardDemo.snapshot());
  expect(refreshed.events).toEqual(events);
  expect(refreshed.time).toBe(retried.time);
  expect(refreshed.fonts.host.accepted).toBe(1);
  expect(refreshed.fonts.images.handles).toHaveLength(1);
  expect(
    refreshed.scene.nodes.filter((node) => node.content[0] === "image").map((node) => node.content[1].source.version),
  ).toEqual([2, 2]);
  const closed = await page.evaluate(() => {
    const api = window.layeredDashboardDemo;
    api.dispose();
    return { ...api.snapshot(), apiRemoved: !window.layeredDashboardDemo };
  });
  expect(closed.apiRemoved).toBe(true);
  expect(closed.fonts.images.created).toBe(closed.fonts.images.released);
});

test("新图片先就绪，旧版本解码迟到不覆盖、不重绘或阻塞刷新完成", async ({ page }, testInfo) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const result = await page.evaluate(async () => {
    const api = window.layeredDashboardDemo;
    await api.enableFont();
    const original = HTMLImageElement.prototype.decode;
    const picture = (color) =>
      `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="650" height="432"><rect width="650" height="432" fill="${color}"/></svg>`)}`;
    const red = picture("red"),
      blue = picture("blue");
    let unlock, started;
    const gate = new Promise((resolve) => {
      unlock = resolve;
    });
    const began = new Promise((resolve) => {
      started = resolve;
    });
    HTMLImageElement.prototype.decode = function () {
      return original.call(this).then(() => {
        if (this.src === red) {
          started();
          return gate;
        }
      });
    };
    try {
      const stale = api.setImageSource(red);
      await began;
      const during = api.snapshot();
      await api.setImageSource(blue); // 不等待旧版本gate；等到的必须是当前version。
      const current = api.snapshot(),
        pixels = document.querySelector("canvas").toDataURL();
      const canvas = document.querySelector("canvas"),
        ctx = canvas.getContext("2d");
      const pixel = [...ctx.getImageData(canvas.width / 2 + 250, canvas.height / 2 - 215, 1, 1).data];
      unlock();
      await stale;
      const after = api.snapshot();
      return { during, current, after, pixel, samePixels: pixels === canvas.toDataURL() };
    } finally {
      HTMLImageElement.prototype.decode = original;
      unlock();
    }
  });
  expect(result.during.imageVersion).toBe(2);
  expect(result.during.imageReady).toBe(false);
  expect(result.current.imageVersion).toBe(3);
  expect(result.current.imageReady).toBe(true);
  expect(result.current.fonts.queue.running).toHaveLength(1); // 旧decode仍被有界队列跟踪。
  expect(result.pixel[2]).toBeGreaterThan(result.pixel[0]); // 实际画面是新蓝图，而非旧红图。
  expect(result.after.imageVersion).toBe(3);
  expect(result.after.fonts.queue.running).toEqual([]);
  expect(result.after.fonts.images.created).toBe(2);
  expect(result.after.fonts.images.released).toBe(1);
  expect(result.after.fonts.images.handles).toHaveLength(1);
  expect(result.after.paints).toBe(result.current.paints);
  expect(result.after.fonts.revision).toBe(result.current.fonts.revision);
  expect(result.samePixels).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("current-blue-after-stale-red.png") });
});

for (const dpr of [1, 2]) {
  test(`字体与共享图片：独立像素、捕获/resize、100次退出重入与卸载 DPR ${dpr}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: dpr,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
      const nativeBefore = await page.evaluate(() => document.fonts.size);
      const loaded = await page.evaluate(async () => {
        await Promise.all([window.layeredDashboardDemo.enableFont(), window.layeredDashboardDemo.enableImages()]);
        return window.layeredDashboardDemo.snapshot();
      });
      expect(loaded.imageReady).toBe(true);
      expect(loaded.fonts.registry.loads).toBe(2);
      expect(loaded.fonts.references).toHaveLength(2);
      expect(loaded.fonts.host.accepted).toBe(1);
      expect(loaded.fonts.images.created).toBe(1);
      expect(loaded.fonts.images.handles).toHaveLength(1);
      expect(loaded.scene.nodes.filter((node) => node.content[0] === "image")).toHaveLength(2);
      expect(loaded.fonts.queue.running).toEqual([]);
      const compareImageRegion = async (alpha) =>
        page.evaluate(async (alpha) => {
          const picture = new Image();
          picture.src = "/assets/lotus.jpg";
          await picture.decode();
          const canvas = document.querySelector("canvas"),
            cx = canvas.width / 2,
            cy = canvas.height / 2;
          const create = () => {
            const c = document.createElement("canvas");
            c.width = canvas.width;
            c.height = canvas.height;
            return c.getContext("2d");
          };
          const expected = create(),
            panel = create(),
            cards = create();
          expected.fillStyle = "rgb(6.375,8.925,17.85)";
          expected.fillRect(0, 0, canvas.width, canvas.height);
          panel.fillStyle = "rgb(14.025,19.125,33.15)";
          panel.fillRect(cx - 410, cy - 270, 820, 540);
          cards.drawImage(picture, 0, 0, 650, 432, cx + 242, cy - 226, 84, 42);
          cards.drawImage(picture, 0, 0, 650, 432, cx + 276, cy - 210, 84, 42);
          panel.globalAlpha = 0.55;
          panel.drawImage(cards.canvas, 0, 0);
          expected.globalAlpha = alpha;
          expected.drawImage(panel.canvas, 0, 0);
          const actual = canvas
            .getContext("2d")
            .getImageData(canvas.width / 2 + 236, canvas.height / 2 - 232, 130, 82).data;
          const reference = expected.getImageData(cx + 236, cy - 232, 130, 82).data;
          return {
            differences: actual.reduce((n, v, i) => n + Number(v !== reference[i]), 0),
            imageWidth: picture.naturalWidth,
            imageHeight: picture.naturalHeight,
          };
        }, alpha);
      expect(await compareImageRegion(1)).toEqual({ differences: 0, imageWidth: 650, imageHeight: 432 });
      const point = await page.locator("canvas").evaluate((canvas) => ({
        x: (canvas.width / 2 + 250) / devicePixelRatio,
        y: (canvas.height / 2 - 215) / devicePixelRatio,
      }));
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).captured).not.toBeNull();
      const start = await page.evaluate(() => window.layeredDashboardDemo.setVisible(false));
      expect(start.captured).toBeNull();
      expect(start.fonts.references).toHaveLength(2);
      await page.mouse.up();
      await page.evaluate(() => window.layeredDashboardDemo.seek(1.3));
      expect(await compareImageRegion(0.5)).toEqual({ differences: 0, imageWidth: 650, imageHeight: 432 });
      await page.screenshot({ path: testInfo.outputPath(`shared-media-mid-dpr${dpr}.png`) });
      await page.setViewportSize({ width: 1320, height: 740 });
      await expect
        .poll(async () => (await page.evaluate(() => window.layeredDashboardDemo.snapshot())).width)
        .toBe(1320 * dpr);
      expect(await compareImageRegion(0.5)).toEqual({ differences: 0, imageWidth: 650, imageHeight: 432 });
      // 像素/resize 已在完整尺寸验证；计数链路使用固定物理尺寸，避免把 100 次重绘变成吞吐基准。
      await page.setViewportSize({ width: 800 / dpr, height: 600 / dpr });
      await expect
        .poll(async () => (await page.evaluate(() => window.layeredDashboardDemo.snapshot())).width)
        .toBe(800);
      const lifecycle = await page.evaluate(() => {
        const api = window.layeredDashboardDemo;
        api.seek(1.6);
        const idle = api.snapshot();
        api.setVisible(true);
        api.seek(2.2);
        const cycles = [];
        for (let i = 0; i < 100; i++) {
          api.reset();
          api.seek(1); // 独立生命周期，不把历史日志增长混成资源门禁。
          const start = api.snapshot().time;
          api.setVisible(false);
          api.seek(start + 0.6);
          const hidden = api.snapshot();
          api.setVisible(true);
          api.seek(start + 1.2);
          const visible = api.snapshot();
          cycles.push([
            hidden.fonts.references.length,
            visible.fonts.references.length,
            visible.fonts.registry.loads,
            visible.fonts.images.created,
          ]);
        }
        api.dispose();
        api.dispose();
        return { idle, cycles, closed: api.snapshot(), nativeAfter: document.fonts.size };
      });
      expect(lifecycle.idle.fonts.references).toEqual([]);
      expect(lifecycle.idle.fonts.images.handles).toHaveLength(1);
      expect(lifecycle.cycles).toEqual(Array.from({ length: 100 }, () => [0, 2, 2, 1]));
      expect(lifecycle.closed.fonts.host.handles).toEqual([]);
      expect(lifecycle.closed.fonts.host.released).toBe(1);
      expect(lifecycle.closed.fonts.images.handles).toEqual([]);
      expect(lifecycle.closed.fonts.images.released).toBe(1);
      expect(lifecycle.nativeAfter).toBe(nativeBefore);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("共享队列图片解码迟到：卸载后释放候选、不开新帧、不复活字体", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const result = await page.evaluate(async () => {
    const api = window.layeredDashboardDemo;
    const nativeBefore = document.fonts.size;
    await api.enableFont();
    const original = HTMLImageElement.prototype.decode;
    let unlock, started;
    const gate = new Promise((resolve) => {
      unlock = resolve;
    });
    const began = new Promise((resolve) => {
      started = resolve;
    });
    HTMLImageElement.prototype.decode = function () {
      return original.call(this).then(() => {
        started();
        return gate;
      });
    };
    try {
      const pending = api.enableImages();
      await began;
      const during = api.snapshot();
      api.dispose();
      api.dispose();
      const closed = api.snapshot();
      unlock();
      await pending;
      return { during, closed, after: api.snapshot(), nativeBefore, nativeAfter: document.fonts.size };
    } finally {
      HTMLImageElement.prototype.decode = original;
      unlock();
    }
  });
  expect(result.during.fonts.queue.running).toHaveLength(1);
  expect(result.during.fonts.references).toHaveLength(2);
  expect(result.after.fonts.queue.running).toEqual([]);
  expect(result.after.fonts.host.handles).toEqual([]);
  expect(result.after.fonts.images.handles).toEqual([]);
  expect(result.after.fonts.images.created).toBe(1);
  expect(result.after.fonts.images.released).toBe(1);
  expect(result.after.fonts.revision).toBe(result.closed.fonts.revision);
  expect(result.after.paints).toBe(result.closed.paints);
  expect(result.after.pending).toBe(false);
  expect(result.nativeAfter).toBe(result.nativeBefore);
});

test("共享队列图片失败：字体仍可使用，原卡片保留且错误可见", async ({ page }) => {
  await page.route("**/assets/lotus.jpg", (route) => route.abort());
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const state = await page.evaluate(async () => {
    await Promise.all([window.layeredDashboardDemo.enableFont(), window.layeredDashboardDemo.enableImages()]);
    return window.layeredDashboardDemo.snapshot();
  });
  expect(state.imageReady).toBe(false);
  expect(state.mediaError).not.toBe("");
  expect(state.fonts.host.accepted).toBe(1);
  expect(state.fonts.host.handles).toHaveLength(1);
  expect(state.fonts.images.handles).toEqual([]);
  expect(state.fonts.images.created).toBe(state.fonts.images.released);
  expect(state.fonts.queue.running).toEqual([]);
  expect(state.scene.nodes.filter((node) => node.content[0] === "image")).toEqual([]);
  expect(state.scene.nodes.filter((node) => /overlap-[ab]$/.test(node.id)).map((node) => node.content[0])).toEqual([
    "rect",
    "rect",
  ]);
  await expect(page.locator("#media-status")).toContainText("资源错误");
});

for (const dpr of [1, 2]) {
  test(`图表换类型保留旧图退出与新图进入，快速切回连续 DPR ${dpr}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: dpr,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
      const point = await page.locator("canvas").evaluate((canvas) => {
        const b = canvas.getBoundingClientRect();
        return {
          x: b.left + ((canvas.width / 2 - 208) * b.width) / canvas.width,
          y: b.top + ((canvas.height / 2 + 140) * b.height) / canvas.height,
        };
      });
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).captured).not.toBeNull();
      const start = await page.evaluate(() => window.layeredDashboardDemo.setChartVariant(true));
      expect(start).toMatchObject({ nodeCount: 29, captured: null, lineChart: true });
      await page.mouse.up();
      const bars = (state) => state.scene.nodes.filter((node) => /\/5:bar-[1-7]$/.test(node.id));
      expect(new Set(start.scene.nodes.map((node) => node.id)).size).toBe(29);
      expect(
        bars(start)
          .filter((node) => node.content[0] === "rect")
          .every((node) => node.interaction[0] === "disabled"),
      ).toBe(true);
      const middle = await page.evaluate(() => window.layeredDashboardDemo.seek(1.3));
      expect(bars(middle)).toHaveLength(8);
      bars(middle).forEach((node) =>
        expect((node.content[0] === "rect" ? node.content[1].fill : node.content[1].stroke).a).toBeCloseTo(0.5, 12),
      );
      await page.screenshot({ path: testInfo.outputPath(`chart-type-mid-dpr${dpr}.png`) });
      const interrupted = await page.evaluate(() => {
        const before = document.querySelector("canvas").toDataURL();
        window.layeredDashboardDemo.setChartVariant(false);
        return {
          samePixels: before === document.querySelector("canvas").toDataURL(),
          ...window.layeredDashboardDemo.snapshot(),
        };
      });
      expect(interrupted.samePixels).toBe(true);
      expect(interrupted.nodeCount).toBe(29);
      expect((await page.evaluate(() => window.layeredDashboardDemo.seek(1.9))).nodeCount).toBe(28);
      await page.getByRole("button", { name: "切换折线图", exact: true }).click();
      const line = await page.evaluate(() => window.layeredDashboardDemo.seek(2.6));
      expect(line.nodeCount).toBe(22);
      expect(bars(line).map((node) => node.content[0])).toEqual(["polyline"]);
      expect(line).toMatchObject({ playing: false, pending: false });
      const replay = await page.evaluate(() => {
        window.layeredDashboardDemo.seek(1.3);
        window.layeredDashboardDemo.seek(2.6);
        return window.layeredDashboardDemo.snapshot().scene;
      });
      expect(replay).toEqual(line.scene);
      const protocol = await page.evaluate(async () => {
        const base = "/target/js/layered-dashboard/";
        const app = await import(`${base}quamolit.examples.layered-dashboard.mjs`);
        const core = await import(`${base}calcit.core.mjs`);
        let events = app.record_chart_variant(app.empty_events(), 1, true);
        events = app.record_chart_variant(events, 1.3, false);
        events = app.record_chart_variant(events, 1.9, true);
        let model = app.initial(),
          previous = 0;
        const equivalent = [0, 1, 1.3, 1.6, 1.9, 2.2, 2.6].map((time) => {
          model = app.advance(model, events, previous, time);
          previous = time;
          return (
            JSON.stringify(core.to_js_data(model)) === JSON.stringify(core.to_js_data(app.replay_events(events, time)))
          );
        });
        model = app.initial();
        const counts = [];
        for (let index = 0; index < 100; index++) {
          const time = index * 2 + 1;
          model = app.set_layout_variant(model, true, true, true, time);
          model = app.advance(model, app.empty_events(), time, time + 0.7);
          counts.push(core.to_js_data(model).items.length);
          model = app.set_layout_variant(model, true, true, false, time + 1);
          model = app.advance(model, app.empty_events(), time + 1, time + 1.7);
          counts.push(core.to_js_data(model).items.length);
        }
        return { equivalent, counts };
      });
      expect(protocol.equivalent).toEqual(Array(7).fill(true));
      expect(protocol.counts).toEqual(Array.from({ length: 200 }, (_, index) => (index % 2 ? 28 : 22)));
      await page.getByRole("button", { name: "隐藏图表", exact: true }).click();
      expect((await page.evaluate(() => window.layeredDashboardDemo.seek(3.3))).nodeCount).toBe(19);
      await page.getByRole("button", { name: "恢复图表", exact: true }).click();
      expect((await page.evaluate(() => window.layeredDashboardDemo.seek(4))).nodeCount).toBe(22);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

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

test("类型化隔离层覆盖离屏与 DOM 回退，合成像素和目标状态不变", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const results = await page.evaluate(async () => {
    const renderer = await import("/target/js/layered-dashboard/quamolit.canvas-scene.mjs");
    const Original = window.OffscreenCanvas;
    const results = [];
    try {
      for (const fallback of [false, true]) {
        window.OffscreenCanvas = fallback ? undefined : Original;
        const layer = renderer.layer_create_$x_(16, 12);
        const context = renderer.layer_context_$x_(layer);
        context.fillStyle = "#248abc";
        context.fillRect(2, 3, 8, 6);
        const makeTarget = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 16;
          canvas.height = 12;
          const target = canvas.getContext("2d");
          target.setTransform(2, 0, 0, 2, 3, 4);
          target.globalAlpha = 0.75;
          return target;
        };
        const actual = makeTarget();
        renderer.composite_layer_$x_(actual, layer, 0.5);
        const expected = makeTarget();
        expected.save();
        expected.setTransform(1, 0, 0, 1, 0, 0);
        expected.globalAlpha = 0.5;
        expected.drawImage(layer, 0, 0);
        expected.restore();
        const pixels = actual.getImageData(0, 0, 16, 12).data;
        const reference = expected.getImageData(0, 0, 16, 12).data;
        results.push({
          kind: layer instanceof HTMLCanvasElement ? "dom" : "offscreen",
          size: [layer.width, layer.height],
          differentBytes: pixels.filter((value, index) => value !== reference[index]).length,
          visiblePixels: pixels.filter((_, index) => index % 4 === 3 && pixels[index] > 0).length,
          alpha: actual.globalAlpha,
          transform: [...actual.getTransform().toFloat64Array()],
        });
      }
      for (const [width, height] of [
        [0, 12],
        [16, -1],
        [NaN, 12],
        [16, Infinity],
      ]) {
        let rejected = false;
        try {
          renderer.layer_create_$x_(width, height);
        } catch {
          rejected = true;
        }
        if (!rejected) throw new Error(`invalid surface accepted: ${width},${height}`);
      }
    } finally {
      window.OffscreenCanvas = Original;
    }
    return results;
  });
  expect(results.map((result) => result.kind)).toEqual(["offscreen", "dom"]);
  for (const result of results) {
    expect(result).toMatchObject({ size: [16, 12], differentBytes: 0, visiblePixels: 48, alpha: 0.75 });
    expect(result.transform).toEqual([2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 3, 4, 0, 1]);
  }
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
    { time: 1, visible: false, "chart-visible": true, "line-chart": false },
    { time: 1.1, visible: true, "chart-visible": true, "line-chart": false },
  ]);
  expect(result.counts).toEqual(Array.from({ length: 200 }, (_, index) => (index % 2 === 0 ? 1 : 28)));
  expect(result.needsFrame).toBe(false);
});

test("嵌套淡化显式合并同一意图，独立子动画与原declare-tree叠加合同保留", async ({ page }) => {
  await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
  const result = await page.evaluate(async () => {
    const base = "/target/js/layered-dashboard/";
    const app = await import(`${base}quamolit.examples.layered-dashboard.mjs`);
    const component = await import(`${base}quamolit.presence-component.mjs`);
    const binding = await import(`${base}quamolit.scene-binding.mjs`);
    const core = await import(`${base}calcit.core.mjs`);
    const tags = core.init_tags(["scene", "motions"]);
    const owners = core.arrayToList(["dashboard", "chart"]);
    const sample = (model, time, coalesced) => {
      const declared = (coalesced ? component.declare_tree_coalesced : component.declare_tree)(
        model,
        binding.empty_descriptors(),
        owners,
      );
      const data = core.to_js_data(binding.resolve_scene(declared.get(tags.scene), declared.get(tags.motions), time));
      return {
        opacities: ["dashboard", "chart", "overlap"].map(
          (id) => data.nodes.find((node) => node.id.endsWith(`/${id.length}:${id}`))?.content[1].opacity,
        ),
        motions: core.to_js_data(declared.get(tags.motions)).length,
      };
    };
    const parent = app.set_layout(app.initial(), false, true, 1);
    const parentBefore = JSON.stringify(core.to_js_data(parent));
    const child = app.set_layout(app.initial(), true, false, 1);
    const independent = app.set_layout(child, false, false, 1.3);
    let events = app.record_chart_visibility(app.empty_events(), 1, false);
    events = app.record_visibility(events, 1.3, false);
    events = app.record_visibility(events, 1.6, true);
    events = app.record_chart_visibility(events, 1.9, true);
    let model = app.initial(),
      previous = 0;
    const equivalent = [0, 1, 1.1, 1.3, 1.6, 1.9, 2.2, 2.6].map((time) => {
      model = app.advance(model, events, previous, time);
      previous = time;
      return (
        JSON.stringify(core.to_js_data(model)) === JSON.stringify(core.to_js_data(app.replay_events(events, time)))
      );
    });
    const branch = app.record_chart_visibility(events, 1.4, true);
    const counts = [];
    model = app.initial();
    for (let index = 0; index < 100; index++) {
      const time = 1 + index * 2;
      model = app.set_layout(model, true, false, time);
      model = app.advance(model, app.empty_events(), time, time + 0.7);
      counts.push(core.to_js_data(model).items.length);
      model = app.set_layout(model, true, true, time + 1);
      model = app.advance(model, app.empty_events(), time + 1, time + 1.7);
      counts.push(core.to_js_data(model).items.length);
    }
    return {
      parent: sample(parent, 1.3, true),
      deliberate: sample(parent, 1.3, false),
      child: sample(child, 1.3, true),
      independent: sample(independent, 1.6, true),
      siblingMotions: core.to_js_data(
        component
          .declare_tree_coalesced(parent, binding.empty_descriptors(), core.arrayToList(["metric-a", "metric-b"]))
          .get(tags.motions),
      ).length,
      immutable: JSON.stringify(core.to_js_data(parent)) === parentBefore,
      equivalent,
      branch: core.to_js_data(branch),
      counts,
    };
  });
  expect(result.parent.motions).toBe(1);
  expect(result.deliberate.motions).toBe(2);
  expect(result.siblingMotions).toBe(2);
  expect(result.immutable).toBe(true);
  for (const [actual, expected] of [
    [result.parent.opacities, [0.5, 1, 0.55]],
    [result.deliberate.opacities, [0.5, 0.5, 0.55]],
    [result.child.opacities, [1, 0.5, 0.55]],
    [result.independent.opacities, [0.5, 0, 0.55]],
  ])
    actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 12));
  expect(result.equivalent).toEqual(Array(8).fill(true));
  expect(result.branch).toEqual([
    { time: 1, visible: true, "chart-visible": false, "line-chart": false },
    { time: 1.3, visible: false, "chart-visible": false, "line-chart": false },
    { time: 1.4, visible: false, "chart-visible": true, "line-chart": false },
  ]);
  expect(result.counts).toEqual(Array.from({ length: 200 }, (_, index) => (index % 2 === 0 ? 19 : 28)));
});

for (const dpr of [1, 2]) {
  test(`图表子组件退出与resize释放捕获，重入连续、父级退出不重复淡化 DPR${dpr}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: dpr,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto("http://127.0.0.1:5180/examples/layered-dashboard/index.html?t=1");
      await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
      await page.evaluate(() => {
        const canvas = document.querySelector("canvas");
        window.chartCaptureCounts = { set: 0, release: 0 };
        for (const [method, key] of [
          ["setPointerCapture", "set"],
          ["releasePointerCapture", "release"],
        ]) {
          const original = canvas[method].bind(canvas);
          canvas[method] = (id) => {
            window.chartCaptureCounts[key]++;
            return original(id);
          };
        }
      });
      const point = await page.locator("canvas").evaluate((canvas) => {
        const bounds = canvas.getBoundingClientRect();
        return {
          x: bounds.left + ((canvas.width / 2 - 208) * bounds.width) / canvas.width,
          y: bounds.top + ((canvas.height / 2 + 140) * bounds.height) / canvas.height,
        };
      });
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).pointer.capture[2]).toBe("chart");
      const exiting = await page.evaluate(() => {
        document.querySelector("canvas").style.width = "calc(100vw - 80px)";
        window.layeredDashboardDemo.setChartVisible(false);
        return { ...window.layeredDashboardDemo.snapshot(), counts: window.chartCaptureCounts };
      });
      expect(exiting).toMatchObject({
        visible: true,
        chartVisible: false,
        captured: null,
        nodeCount: 28,
        width: 1200 * dpr,
        counts: { set: 1, release: 1 },
      });
      const groups = (state) =>
        ["dashboard", "chart", "overlap"].map(
          (id) => state.scene.nodes.find((node) => node.id.endsWith(`/${id.length}:${id}`))?.content[1].opacity,
        );
      const middle = await page.evaluate(() => window.layeredDashboardDemo.seek(1.3));
      groups(middle).forEach((value, index) => expect(value).toBeCloseTo([1, 0.5, 0.55][index], 12));
      await page.screenshot({ path: testInfo.outputPath(`nested-chart-mid-dpr${dpr}.png`) });
      const revived = await page.evaluate(() => {
        const before = Object.fromEntries(
          window.layeredDashboardDemo.snapshot().scene.nodes.map((node) => [node.id, node.content]),
        );
        const pixels = document.querySelector("canvas").toDataURL();
        window.layeredDashboardDemo.setChartVisible(true);
        return {
          before,
          samePixels: pixels === document.querySelector("canvas").toDataURL(),
          ...window.layeredDashboardDemo.snapshot(),
        };
      });
      expect(Object.fromEntries(revived.scene.nodes.map((node) => [node.id, node.content]))).toEqual(revived.before);
      expect(revived.samePixels).toBe(true);
      expect(revived.captured).toBeNull();
      await page.mouse.up();
      await page.evaluate(() => window.layeredDashboardDemo.seek(1.9));
      await page.getByRole("button", { name: "隐藏图表", exact: true }).click();
      const removed = await page.evaluate(() => window.layeredDashboardDemo.seek(2.6));
      expect(removed.nodeCount).toBe(19);
      expect(removed.visible).toBe(true);
      await page.getByRole("button", { name: "恢复图表", exact: true }).click();
      await page.evaluate(() => window.layeredDashboardDemo.seek(3.3));
      expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).nodeCount).toBe(28);
      const parentStart = (await page.evaluate(() => window.layeredDashboardDemo.snapshot())).time;
      await page.getByRole("button", { name: "隐藏看板", exact: true }).click();
      const parent = await page.evaluate((time) => window.layeredDashboardDemo.seek(time + 0.3), parentStart);
      groups(parent).forEach((value, index) => expect(value).toBeCloseTo([0.5, 1, 0.55][index], 12));
      await page.evaluate(() => window.layeredDashboardDemo.seek(4));
      expect((await page.evaluate(() => window.layeredDashboardDemo.snapshot())).nodeCount).toBe(1);
      await expect.poll(() => page.evaluate(() => window.layeredDashboardDemo.snapshot().pending)).toBe(false);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

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
      const expectDisplayFont = (state) => {
        const labels = state.scene.nodes.filter((node) => node.content[0] === "text");
        expect(labels.length).toBeGreaterThan(0);
        expect(labels.every((node) => node.content[1].font.family === "QuamolitDashboard")).toBe(true);
        expect(state.fonts.registry.loads).toBe(1);
        expect(state.fonts.host.accepted).toBe(1);
      };
      expectDisplayFont(loaded);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByRole("button", { name: "切换折线图", exact: true }).click();
      const line = await page.evaluate(() => window.layeredDashboardDemo.seek(1.6));
      expect(line.nodeCount).toBe(22);
      expectDisplayFont(line);
      await page.getByRole("button", { name: "隐藏图表", exact: true }).click();
      const withoutChart = await page.evaluate(() => window.layeredDashboardDemo.seek(2.2));
      expect(withoutChart.nodeCount).toBe(19);
      expectDisplayFont(withoutChart);
      await page.getByRole("button", { name: "恢复图表", exact: true }).click();
      expectDisplayFont(await page.evaluate(() => window.layeredDashboardDemo.seek(2.8)));
      const restored = await page.evaluate(() => {
        window.layeredDashboardDemo.reset();
        return window.layeredDashboardDemo.seek(1);
      });
      expect(restored.nodeCount).toBe(28);
      expectDisplayFont(restored);
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
      expectDisplayFont(exiting);
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
