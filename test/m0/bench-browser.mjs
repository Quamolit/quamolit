import { createManifest, sampleFixture } from "./fixtures.mjs";
import { renderCanvas } from "./render-canvas.mjs";

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function frameChecksum(context) {
  const pixels = context.getImageData(0, 0, context.canvas.width, context.canvas.height).data;
  let hash = 0x811c9dc5;
  for (const byte of pixels) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return hash;
}

export async function runBrowserBench(options) {
  const setupStart = performance.now();
  const manifest = createManifest(options);
  const setupMs = performance.now() - setupStart;
  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("2d", { alpha: false, willReadFrequently: false });
  if (!context) throw new Error("Canvas2D unavailable");
  const firstStart = performance.now();
  renderCanvas(context, manifest, sampleFixture(manifest, 0));
  const firstDrawMs = performance.now() - firstStart;
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
    return { elapsedMs: performance.now() - started, frames: index, samples };
  }

  const warmup = await phase(options.warmupSeconds, false);
  const measure = await phase(options.durationSeconds, true);
  if (measure.frames < 2) throw new Error("No usable rAF frame intervals; benchmark invalid");
  renderCanvas(context, manifest, sampleFixture(manifest, 0.5));
  const checksum = frameChecksum(context);
  return {
    manifest,
    setupMs,
    firstDrawMs,
    idleRafMedianMs,
    warmup: { elapsedMs: warmup.elapsedMs, frames: warmup.frames },
    measure,
    checksum,
    checksumTime: 0.5,
    canvas: { alpha: false, antialias: "browser-default", colorSpace: context.getContextAttributes?.().colorSpace ?? "unknown" },
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio,
  };
}
