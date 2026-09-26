// Calcit :ffi :js :file 单函数表达式；一次 JS 边界调用绘制交错 Float32 x/y 矩形批次。
// 宿主文件不实现动画或 Scene 语义，只做 Canvas2D 提交与边界计数。
(context, positions, start, count, width, height, fillStyle, alpha) => {
  if (context === null || typeof context !== 'object' || typeof context.save !== 'function' ||
      typeof context.restore !== 'function' || typeof context.fillRect !== 'function') {
    throw new TypeError('Canvas2D context needs save/restore/fillRect');
  }
  if (!(positions instanceof Float32Array)) throw new TypeError('Float32Array positions needed');
  if (typeof SharedArrayBuffer !== 'undefined' && positions.buffer instanceof SharedArrayBuffer) {
    throw new TypeError('SharedArrayBuffer positions are not a stable batch');
  }
  if (positions.length % 2 !== 0) throw new RangeError('Float32 positions need interleaved x/y pairs');
  const total = positions.length / 2;
  if (!Number.isSafeInteger(start) || start < 0 || start > total ||
      !Number.isSafeInteger(count) || count < 0 || count > total - start) {
    throw new RangeError(`rect batch range must be safe within 0..${total}`);
  }
  if (!Number.isFinite(width) || width < 0) throw new RangeError('width must be finite and nonnegative');
  if (!Number.isFinite(height) || height < 0) throw new RangeError('height must be finite and nonnegative');
  if (typeof fillStyle !== 'string' || fillStyle.length === 0) throw new TypeError('nonempty fillStyle needed');
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
