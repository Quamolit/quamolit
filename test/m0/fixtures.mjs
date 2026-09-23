// M0 reference input. This module has no browser or renderer dependency.
export const WIDTH = 640;
export const HEIGHT = 360;
export const FIXTURE_IDS = ["ui-transition", "instances", "text-path"];
export const INSTANCE_COUNTS = [1_000, 10_000, 100_000];

const DEFAULT_EVENTS = [
  { id: "panel-enter", time: 0.15, type: "enter", key: "detail-card", duration: 0.3 },
  { id: "target-interrupt", time: 0.65, type: "target", value: 220, duration: 0.55 },
  { id: "panel-exit", time: 0.9, type: "exit", key: "detail-card", duration: 0.35 },
];

function finite(value, label) {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`);
  return value;
}

function eventCopy(event, index) {
  if (typeof event !== "object" || event === null) throw new TypeError(`event ${index} is invalid`);
  const { id, time, type, duration } = event;
  if (typeof id !== "string" || !id) throw new TypeError(`event ${index} needs an id`);
  finite(time, `event ${id} time`);
  finite(duration, `event ${id} duration`);
  if (time < 0 || duration < 0) throw new RangeError(`event ${id} time/duration must be non-negative`);
  if (!["target", "enter", "exit"].includes(type)) throw new TypeError(`event ${id} has unknown type`);
  if (type === "target") finite(event.value, `event ${id} value`);
  if (type !== "target" && event.key !== "detail-card") throw new TypeError(`event ${id} has unknown key`);
  return type === "target"
    ? { id, time, type, value: event.value, duration }
    : { id, time, type, key: event.key, duration };
}

export function createManifest({
  fixture = "ui-transition",
  seed = 7,
  count = 10_000,
  dpr = 1,
  glyphState = "ready",
  events = DEFAULT_EVENTS,
} = {}) {
  if (!FIXTURE_IDS.includes(fixture)) throw new RangeError(`Unknown fixture: ${fixture}`);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError("seed must be uint32");
  if (!INSTANCE_COUNTS.includes(count)) throw new RangeError("count must be 1000, 10000 or 100000");
  if (dpr !== 1 && dpr !== 2) throw new RangeError("dpr must be 1 or 2");
  if (!["loading", "ready", "error"].includes(glyphState)) throw new RangeError("glyphState must be loading, ready or error");
  if (!Array.isArray(events)) throw new TypeError("events must be an array");
  const copied = events.map(eventCopy);
  if (new Set(copied.map((event) => event.id)).size !== copied.length) throw new TypeError("event ids must be unique");
  copied.sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
  return {
    schema: "quamolit.m0.fixture.v1",
    fixture,
    seed,
    count,
    width: WIDTH,
    height: HEIGHT,
    dpr,
    pixelWidth: WIDTH * dpr,
    pixelHeight: HEIGHT * dpr,
    resources: {
      glyphAtlas: { id: "m0-pixel-5x7", version: 1, state: glyphState },
      image: { id: "none", version: 0, state: "ready" },
    },
    events: copied,
  };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function ease(value) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function tween(transition, time) {
  if (transition.duration === 0) return transition.to;
  return transition.from + (transition.to - transition.from) * ease((time - transition.start) / transition.duration);
}

function sampleUi(manifest, time) {
  let movement = { from: 88, to: 500, start: 0, duration: 1 };
  let panel = { from: 0, to: 0, start: 0, duration: 0 };
  let phase = "absent";
  const appliedEvents = [];
  for (const event of manifest.events) {
    if (event.time > time) break;
    if (event.type === "target") {
      movement = { from: tween(movement, event.time), to: event.value, start: event.time, duration: event.duration };
    } else {
      panel = { from: tween(panel, event.time), to: event.type === "enter" ? 1 : 0, start: event.time, duration: event.duration };
      phase = event.type === "enter" ? "enter" : "exit";
    }
    appliedEvents.push(event.id);
  }
  const opacity = tween(panel, time);
  if (phase === "enter" && time >= panel.start + panel.duration) phase = "present";
  if (phase === "exit" && time >= panel.start + panel.duration) phase = "absent";
  return { x: tween(movement, time), panelOpacity: opacity, panelPhase: phase, appliedEvents };
}

export function sampleFixture(manifest, time) {
  finite(time, "time");
  if (time < 0) throw new RangeError("time must be non-negative");
  if (manifest.schema !== "quamolit.m0.fixture.v1") throw new TypeError("Unknown fixture schema");
  const base = { fixture: manifest.fixture, time, seed: manifest.seed, width: manifest.width, height: manifest.height, glyphState: manifest.resources.glyphAtlas.state };
  switch (manifest.fixture) {
    case "ui-transition": return { ...base, ui: sampleUi(manifest, time) };
    case "instances": return { ...base, count: manifest.count, motionPhase: time * 0.8 };
    case "text-path": return { ...base, label: "QUAMOLIT 0123", pathPhase: time * Math.PI };
    default: throw new RangeError(`Unknown fixture: ${manifest.fixture}`);
  }
}

// Deterministic index-addressable instance data; no 100k-node component tree.
export function instanceAt(seed, index) {
  const hash = (salt) => {
    let value = (seed ^ Math.imul(index + 1, 0x9e3779b1) ^ salt) >>> 0;
    value = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
    value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
    return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
  };
  return {
    x: 16 + hash(0) * (WIDTH - 32),
    y: 16 + hash(1) * (HEIGHT - 32),
    radius: 1.25 + hash(2) * 2.25,
    phase: hash(3) * Math.PI * 2,
    palette: Math.floor(hash(4) * 4),
  };
}
