import { copy_range as float32CopyRange, draw_canvas_$x_ as drawCalcitRectBatch } from "./js-out/quamolit.instance-ffi.mjs";
import { to_js_data as toJsData } from "./js-out/calcit.core.mjs";

function colorStyle(fill) {
  if (fill === null || typeof fill !== "object") throw new TypeError("instance fill color required");
  for (const channel of ["r", "g", "b", "a"]) {
    if (!Number.isFinite(fill[channel]) || fill[channel] < 0 || fill[channel] > 1) {
      throw new RangeError(`instance fill ${channel} must be within 0..1`);
    }
  }
  return `rgba(${Math.round(fill.r * 255)}, ${Math.round(fill.g * 255)}, ${Math.round(fill.b * 255)}, ${fill.a})`;
}

/** Thin Scene instances → js-ffi Canvas batch adapter; copy once per immutable source token. */
export class CanvasInstanceBatches {
  #registry;
  #copies = new WeakMap();

  constructor(registry) {
    if (registry === null || typeof registry?.resolve !== "function") throw new TypeError("InstanceSourceRegistry required");
    this.#registry = registry;
  }

  draw(context, instance, alpha = 1, start = 0, count = instance?.source?.count) {
    const source = instance?.source;
    const token = this.#registry.resolve(source);
    const fillStyle = colorStyle(instance.fill);
    let positions = this.#copies.get(token);
    let positionBytesCopied = 0;
    if (positions === undefined) {
      positions = float32CopyRange(token, 0, source.count * 2);
      this.#copies.set(token, positions);
      positionBytesCopied = positions.byteLength;
    }
    const typedMetrics = drawCalcitRectBatch(context, positions, start, count, instance.width, instance.height, fillStyle, alpha);
    const result = toJsData(typedMetrics);
    const metrics = {
      boundaryCalls: result["boundary-calls"], canvasCalls: result["canvas-calls"],
      instances: result.instances, positionBytesRead: result["position-bytes-read"],
    };
    return Object.freeze({
      ...metrics,
      frameBoundaryCalls: metrics.boundaryCalls + (positionBytesCopied > 0 ? 1 : 0),
      positionBytesCopied,
    });
  }
}
