import { createManifest, FIXTURE_IDS, INSTANCE_COUNTS, sampleFixture } from "./fixtures.mjs";
import { renderCanvas } from "./render-canvas.mjs";

const query = new URLSearchParams(location.search);
const controls = {
  fixture: document.querySelector("#fixture"),
  count: document.querySelector("#count"),
  time: document.querySelector("#time"),
  timeLabel: document.querySelector("#time-label"),
  play: document.querySelector("#play"),
  interrupt: document.querySelector("#interrupt"),
  reset: document.querySelector("#reset"),
  canvas: document.querySelector("#frame"),
  status: document.querySelector("#status"),
  manifest: document.querySelector("#manifest"),
};
const context = controls.canvas.getContext("2d", { alpha: false });
let manifest;
let currentTime = 0;
let frameId = 0;
let startWallTime = 0;
let startFixtureTime = 0;

function stop() {
  if (frameId) cancelAnimationFrame(frameId);
  frameId = 0;
  controls.play.textContent = "播放";
}

function showError(error) {
  stop();
  controls.status.dataset.result = "error";
  controls.status.textContent = `ERROR · ${error.message}`;
  document.body.dataset.ready = "error";
  throw error;
}

function renderAt(time) {
  try {
    const model = sampleFixture(manifest, time);
    renderCanvas(context, manifest, model);
    currentTime = time;
    controls.time.value = String(Math.min(1.5, time));
    controls.timeLabel.textContent = `${time.toFixed(2)}s`;
    controls.count.disabled = manifest.fixture !== "instances";
    if (manifest.fixture === "mixed-ui") controls.count.value = "1000";
    controls.interrupt.disabled = manifest.fixture !== "ui-transition";
    controls.manifest.textContent = JSON.stringify({ manifest, sampleTime: time, referenceModel: model }, null, 2);
    controls.status.dataset.result = "ready";
    controls.status.textContent = `${manifest.fixture} · t=${time.toFixed(2)}s · ${manifest.pixelWidth}×${manifest.pixelHeight}px · seed=${manifest.seed}`;
    document.body.dataset.ready = "true";
    return model;
  } catch (error) {
    return showError(error);
  }
}

function makeManifest(overrides = {}) {
  manifest = createManifest({
    fixture: controls.fixture.value,
    count: Number(controls.count.value),
    seed: Number(query.get("seed") ?? 7),
    dpr: Number(query.get("dpr") ?? 1),
    glyphState: query.get("glyph") ?? "ready",
    ...overrides,
  });
  return manifest;
}

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set("fixture", manifest.fixture);
  url.searchParams.set("time", String(currentTime));
  url.searchParams.set("count", String(manifest.count));
  url.searchParams.set("seed", String(manifest.seed));
  url.searchParams.set("dpr", String(manifest.dpr));
  url.searchParams.set("glyph", manifest.resources.glyphAtlas.state);
  if (manifest.events.some((event) => event.id.startsWith("manual-"))) {
    url.searchParams.set("events", JSON.stringify(manifest.events));
  } else {
    url.searchParams.delete("events");
  }
  history.replaceState(null, "", url);
}

function playFrame(wallTime) {
  const time = Math.min(1.5, startFixtureTime + (wallTime - startWallTime) / 1000);
  renderAt(time);
  if (time < 1.5) frameId = requestAnimationFrame(playFrame);
  else {
    stop();
    updateUrl();
  }
}

controls.fixture.addEventListener("change", () => {
  stop();
  makeManifest(controls.fixture.value === "mixed-ui" ? { count: 1_000 } : {});
  renderAt(currentTime);
  updateUrl();
});
controls.count.addEventListener("change", () => {
  stop();
  makeManifest({ events: manifest.events });
  renderAt(currentTime);
  updateUrl();
});
controls.time.addEventListener("input", () => {
  stop();
  renderAt(Number(controls.time.value));
  updateUrl();
});
controls.play.addEventListener("click", () => {
  if (frameId) {
    stop();
    updateUrl();
    return;
  }
  startFixtureTime = currentTime >= 1.5 ? 0 : currentTime;
  startWallTime = performance.now();
  controls.play.textContent = "暂停";
  frameId = requestAnimationFrame(playFrame);
});
controls.interrupt.addEventListener("click", () => {
  stop();
  const event = {
    id: `manual-${manifest.events.filter((item) => item.id.startsWith("manual-")).length + 1}`,
    time: currentTime,
    type: "target",
    value: 100 + (manifest.events.length % 2) * 380,
    duration: 0.45,
  };
  makeManifest({ events: [...manifest.events, event] });
  renderAt(currentTime);
  updateUrl();
});
controls.reset.addEventListener("click", () => {
  stop();
  makeManifest();
  renderAt(currentTime);
  updateUrl();
});

try {
  const fixture = query.get("fixture") ?? "ui-transition";
  const count = Number(query.get("count") ?? (fixture === "mixed-ui" ? 1_000 : 10_000));
  if (!FIXTURE_IDS.includes(fixture) || !INSTANCE_COUNTS.includes(count)) throw new RangeError("Invalid fixture or count URL parameter");
  controls.fixture.value = fixture;
  controls.count.value = String(count);
  makeManifest(query.has("events") ? { events: JSON.parse(query.get("events")) } : {});
  renderAt(Number(query.get("time") ?? 0.5));
  window.quamolitM0 = {
    renderAt,
    getManifest: () => structuredClone(manifest),
    getReferenceModel: () => sampleFixture(manifest, currentTime),
    getCanvas: () => controls.canvas,
    getFramePng: () => controls.canvas.toDataURL("image/png"),
  };
} catch (error) {
  showError(error);
}
