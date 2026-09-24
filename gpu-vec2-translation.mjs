function finiteF32(value) {
  return Number.isFinite(value) && Number.isFinite(Math.fround(value));
}

/** Typed Calcit GPU Vec2 tween plan → generic js-ffi translation uniform. */
export function prepareGpuVec2Translation(plan) {
  if (!Array.isArray(plan) || plan.length !== 2) throw new TypeError("serialized GPU Motion plan required");
  if (plan[0] === "unsupported") {
    return Object.freeze({ kind: "unsupported", reason: String(plan[1] ?? "unknown-motion") });
  }
  if (plan[0] !== "supported") throw new TypeError("GPU Motion plan status required");
  const descriptor = plan[1];
  const kernel = descriptor?.kernel;
  if (typeof descriptor?.id !== "string" || descriptor.id.length === 0
    || !Number.isSafeInteger(descriptor.version) || descriptor.version < 0) {
    throw new TypeError("GPU Motion ID/version required");
  }
  if (!Array.isArray(kernel) || kernel[0] !== "tween") {
    return Object.freeze({ kind: "unsupported", reason: "vec2-tween-required" });
  }
  const tween = kernel[1];
  if (!tween || !tween.from || !tween.to
    || ![tween.from.x, tween.from.y, tween.to.x, tween.to.y, tween.start, tween.duration].every(finiteF32)
    || tween.duration < 0) {
    return Object.freeze({ kind: "unsupported", reason: "valid-vec2-tween-required" });
  }
  const easing = Array.isArray(tween.easing) ? tween.easing[0] : undefined;
  if (easing !== "linear" && easing !== "smoothstep") {
    return Object.freeze({ kind: "unsupported", reason: "unsupported-vec2-easing" });
  }
  const base = Object.freeze({
    from: Object.freeze({ x: tween.from.x, y: tween.from.y }),
    to: Object.freeze({ x: tween.to.x, y: tween.to.y }),
    start: tween.start,
    duration: tween.duration,
    easing,
  });
  return Object.freeze({
    kind: "ready", id: descriptor.id, version: descriptor.version,
    at(time) {
      if (!finiteF32(time)) throw new RangeError("GPU Motion time must be finite f32");
      return { ...base, time };
    },
  });
}
