import { expect, test } from "@playwright/test";

async function ready(page, time = 60.5) {
  await page.goto(`http://127.0.0.1:5180/examples/clock/index.html?t=${time}`);
  await expect(page.locator("#status")).toHaveAttribute("data-result", "pass");
}

for (const dpr of [1, 2]) {
  test(`散开中间帧与独立原生绘制逐通道一致 DPR ${dpr}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width: 1000, height: 720 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    try {
      await ready(page);
      await page.getByRole("button", { name: "分钟进位 · 60.08 s", exact: true }).click();
      expect((await page.evaluate(() => window.clockDemo.snapshot())).time).toBe(60.08);
      const result = await page.evaluate(() => {
        const actual = document.querySelector("canvas"),
          ctx = actual.getContext("2d");
        const reference = document.createElement("canvas");
        reference.width = actual.width;
        reference.height = actual.height;
        const native = reference.getContext("2d");
        const positions = [-280, -200, -80, 0, 120, 200];
        const segments = [
          [0, 1, 1, 1],
          [1, 1, 1, 0],
          [1, 0, 0, 0],
          [0, 0, 0, 1],
          [0, 1, 0, 2],
          [0, 2, 1, 2],
          [1, 2, 1, 1],
        ];
        const masks = [
          [1, 2, 3, 4, 5, 6],
          [1, 6],
          [0, 1, 2, 4, 5],
          [0, 1, 2, 5, 6],
          [0, 1, 3, 6],
          [0, 2, 3, 5, 6],
          [0, 2, 3, 4, 5, 6],
          [1, 2, 6],
          [0, 1, 2, 3, 4, 5, 6],
          [0, 1, 2, 3, 5, 6],
        ];
        const digits = (tick) => {
          const seconds = Math.floor(tick) % 86400;
          const values = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
          return values.flatMap((value) => [Math.floor(value / 10), value % 10]);
        };
        const offset = (position, segment, coordinate, spread) => {
          const value = 43758.5453 * Math.sin(0.5 + position * 77 + segment * 31 + coordinate * 13);
          return spread * (2 * (value - Math.floor(value)) - 1);
        };
        const read = () => [...ctx.getImageData(0, 0, actual.width, actual.height).data];
        const frames = [];
        let first;
        for (const time of [60.08, 59.08, 60.5, 59.03, 60.08]) {
          window.clockDemo.seek(time);
          native.setTransform(1, 0, 0, 1, 0, 0);
          native.clearRect(0, 0, reference.width, reference.height);
          const scale = Math.min(reference.width / 900, reference.height / 520);
          native.setTransform(scale, 0, 0, scale, reference.width / 2, reference.height / 2);
          native.lineWidth = 3;
          native.lineCap = "round";
          native.lineJoin = "round";
          const current = digits(time),
            previous = digits(Math.floor(time) - 1),
            ramp = Math.min(1, (time - Math.floor(time)) / 0.25);
          for (let position = 0; position < 6; position++)
            for (let segment = 0; segment < 7; segment++) {
              const on = masks[current[position]].includes(segment),
                was = masks[previous[position]].includes(segment);
              const alpha = on && was ? 1 : on ? ramp : was ? 1 - ramp : 0;
              if (!alpha) continue;
              native.strokeStyle = alpha < 1 ? `rgba(158,241,250,${alpha})` : `rgba(110,110,247,${alpha})`;
              native.beginPath();
              const path = segments[segment];
              const point = (endpoint) => [
                positions[position] +
                  60 * path[2 * endpoint] +
                  (1 - alpha) * offset(position, segment, 2 * endpoint, 120),
                100 * path[2 * endpoint + 1] + (1 - alpha) * offset(position, segment, 2 * endpoint + 1, 160),
              ];
              native.moveTo(...point(0));
              native.lineTo(...point(1));
              native.stroke();
            }
          const image = read(),
            expected = native.getImageData(0, 0, reference.width, reference.height).data;
          frames.push({
            time,
            differences: image.reduce((count, value, i) => count + Number(value !== expected[i]), 0),
            nonempty: image.some((value) => value !== 0),
          });
          if (!first) first = image;
          else if (time === 60.08) frames.at(-1).repeatEqual = image.every((value, i) => value === first[i]);
        }
        return frames;
      });
      expect(result.every((frame) => frame.differences === 0 && frame.nonempty)).toBe(true);
      expect(result.at(-1).repeatEqual).toBe(true);
      await page.locator("#panel-toggle").click();
      await page.screenshot({ path: testInfo.outputPath(`clock-scatter-dpr${dpr}.png`) });
    } finally {
      await context.close();
    }
  });
}

test("注入时钟：跨秒/分钟进位与固定时间截图", async ({ page }, testInfo) => {
  await ready(page);
  const at = (t) => page.evaluate((x) => window.clockDemo.seek(x), t);
  expect((await at(59.5)).digits).toEqual([0, 0, 0, 0, 5, 9]);
  expect((await at(60)).digits).toEqual([0, 0, 0, 1, 0, 0]);
  expect((await at(119.5)).digits).toEqual([0, 0, 0, 1, 5, 9]);
  expect((await at(120)).digits).toEqual([0, 0, 0, 2, 0, 0]);
  await at(59.5);
  await page.screenshot({ path: testInfo.outputPath("clock-59.5.png") });
  await at(60.5);
  await page.screenshot({ path: testInfo.outputPath("clock-60.5.png") });
  const first = await at(60.5),
    second = await at(60.5);
  expect(second.scene).toEqual(first.scene);
  expect(second.nodeCount).toBe(32);
});

test("全屏 DPR 2：暂停 resize 不推进时间，浮层收起不误触", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await ready(page, 60.5);
    const original = await page.evaluate(() => window.clockDemo.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]))
      .toEqual([780, 1688]);
    const after = await page.evaluate(() => window.clockDemo.snapshot());
    expect(after.time).toBe(original.time);
    expect(after.digits).toEqual(original.digits);
    await page.locator("#panel-toggle").click();
    await expect(page.locator("#panel")).toBeHidden();
    expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).tagName)).toBe(
      "CANVAS",
    );
    await page.screenshot({ path: testInfo.outputPath("clock-390-dpr2.png") });
  } finally {
    await context.close();
  }
});
