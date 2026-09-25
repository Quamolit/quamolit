function requireNonnegativeFinite(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative`);
}

/** Draw an interleaved Float32 x/y range in one JavaScript boundary call. */
export function drawFloat32RectBatch(context, positions, start, count, width, height, fillStyle, alpha) {
  if (context === null || typeof context !== 'object' || typeof context.save !== 'function' ||
      typeof context.restore !== 'function' || typeof context.fillRect !== 'function') {
    throw new TypeError('Canvas2D context with save/restore/fillRect required');
  }
  if (!(positions instanceof Float32Array)) throw new TypeError('Float32Array positions required');
  if (typeof SharedArrayBuffer !== 'undefined' && positions.buffer instanceof SharedArrayBuffer) {
    throw new TypeError('SharedArrayBuffer positions are not a stable batch');
  }
  if (positions.length % 2 !== 0) throw new RangeError('Float32 positions require interleaved x/y pairs');
  const total = positions.length / 2;
  if (!Number.isSafeInteger(start) || start < 0 || start > total ||
      !Number.isSafeInteger(count) || count < 0 || count > total - start) {
    throw new RangeError(`rect batch range must be safe within 0..${total}`);
  }
  requireNonnegativeFinite(width, 'width');
  requireNonnegativeFinite(height, 'height');
  if (typeof fillStyle !== 'string' || fillStyle.length === 0) throw new TypeError('nonempty fillStyle required');
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new RangeError('alpha must be finite within 0..1');
  for (let index = start * 2; index < (start + count) * 2; index++) {
    if (!Number.isFinite(positions[index])) throw new RangeError(`non-finite batch coordinate at ${index}`);
  }
  if (count > 0) {
    context.save();
    try {
      context.fillStyle = fillStyle;
      context.globalAlpha = alpha;
      for (let index = start; index < start + count; index++) {
        context.fillRect(positions[index * 2], positions[index * 2 + 1], width, height);
      }
    } finally {
      context.restore();
    }
  }
  return Object.freeze({ boundaryCalls: 1, canvasCalls: count, instances: count, positionBytesRead: count * 8 });
}
