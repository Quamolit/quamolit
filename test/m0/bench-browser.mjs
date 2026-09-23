import { createManifest, sampleFixture } from "./fixtures.mjs";
import { renderCanvas } from "./render-canvas.mjs";

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

export async function runBrowserBench(options) {
  const manifest = createManifest(options);
  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("2d", { alpha: false, willReadFrequently: false });
  if (!context) throw new Error("Canvas2D unavailable");
  const firstStart = performance.now();
  renderCanvas(context, manifest, sampleFixture(manifest, 0));
  const firstDrawMs = performance.now() - firstStart;
  let checksum = 0;
  const idleRaf = [];
  for (let index = 0; index < 61; index += 1) idleRaf.push(await frame());
  const idleIntervals = idleRaf.slice(1).map((time, index) => time - idleRaf[index]).sort((a, b) => a - b);
  const idleRafMedianMs = (idleIntervals[29] + idleIntervals[30]) / 2;

  async function phase(seconds, collect) {
    const started = performance.now();
    let previous = null;
    let index = 0;
    const samples = [];
    while (performance.now() - started < seconds * 1000) {
      const rafTime = await frame();
      const sampleStart = performance.now();
      const model = sampleFixture(manifest, index / 60);
      const renderStart = performance.now();
      renderCanvas(context, manifest, model);
      const renderEnd = performance.now();
      if (collect) samples.push({
        index,
        fixtureTime: index / 60,
        rafTime,
        rafIntervalMs: previous === null ? null : rafTime - previous,
        sampleMs: renderStart - sampleStart,
        canvasCallMs: renderEnd - renderStart,
        cpuFrameMs: renderEnd - sampleStart,
      });
      previous = rafTime;
      index += 1;
    }
    const pixel = context.getImageData(0, 0, 1, 1).data;
    checksum = (checksum + pixel[0] + pixel[1] * 3 + pixel[2] * 7 + pixel[3] * 11 + index) >>> 0;
    return { elapsedMs: performance.now() - started, frames: index, samples };
  }

  const warmup = await phase(options.warmupSeconds, false);
  const measure = await phase(options.durationSeconds, true);
  if (measure.frames < 2) throw new Error("No usable rAF frame intervals; benchmark invalid");
  return {
    manifest,
    firstDrawMs,
    idleRafMedianMs,
    warmup: { elapsedMs: warmup.elapsedMs, frames: warmup.frames },
    measure,
    checksum,
    canvas: { alpha: false, antialias: "browser-default", colorSpace: context.getContextAttributes?.().colorSpace ?? "unknown" },
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio,
  };
}
