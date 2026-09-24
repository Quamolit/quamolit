import { float32CopyRange } from "./.calcit/modules/js-ffi/typed-arrays.mjs";
import { _PCT_none as none, _PCT_some as some, to_js_data as toJsData } from "./js-out/calcit.core.mjs";
import {
  clear_$x_ as clearBatch, color as rectColor, create_$x_ as createBatch,
  dispose_$x_ as disposeBatch, draw_$x_ as drawBatch,
  read_pixel_$x_ as readPixel, translation as rectTranslation,
  read_translation_$x_ as readTranslation, upload_$x_ as uploadBatch,
} from "./js-out/quamolit.webgpu-batches.mjs";

function metricsToJs(value) {
  const metrics = toJsData(value);
  return {
    drawCalls: metrics["draw-calls"], instances: metrics.instances,
    positionBytesUploaded: metrics["position-bytes-uploaded"],
    uniformBytesUploaded: metrics["uniform-bytes-uploaded"],
    pipelinesCreated: metrics["pipelines-created"], buffersCreated: metrics["buffers-created"],
  };
}

/** Scene InstanceSource → one retained js-ffi WebGPU rectangle layer. */
export class WebGpuInstanceBatches {
  #registry;
  #batch;
  #copies = new WeakMap();
  #activeToken;

  static async create(canvas, capability, registry, capacity) {
    if (capability?.kind !== "ready" || capability.state !== "ready") throw new TypeError("ready WebGPU capability required");
    const batch = await createBatch(canvas, capability.device, capability.format, capacity);
    return new WebGpuInstanceBatches(registry, batch);
  }

  constructor(registry, batch) {
    if (registry === null || typeof registry?.resolve !== "function") throw new TypeError("InstanceSourceRegistry required");
    if (batch === null || typeof batch?.upload !== "function" || typeof batch?.draw !== "function" || typeof batch?.dispose !== "function") {
      throw new TypeError("WebGPU rectangle batch required");
    }
    this.#registry = registry;
    this.#batch = batch;
  }

  draw(instance, alpha = 1, translation) {
    const source = instance?.source;
    const token = this.#registry.resolve(source);
    let positions = this.#copies.get(token);
    let positionBytesCopied = 0;
    if (positions === undefined) {
      positions = float32CopyRange(token, 0, source.count * 2);
      this.#copies.set(token, positions);
      positionBytesCopied = positions.byteLength;
    }
    if (this.#activeToken !== token) {
      uploadBatch(this.#batch, positions, source.count);
      this.#activeToken = token;
    }
    const { r, g, b, a } = instance.fill;
    const fill = rectColor(r, g, b, a);
    const motion = translation === undefined ? none() : some(rectTranslation(
      translation.from.x, translation.from.y, translation.to.x, translation.to.y,
      translation.time, translation.start, translation.duration, translation.easing,
    ));
    const metrics = metricsToJs(drawBatch(this.#batch, instance.width, instance.height, fill, alpha, motion, none()));
    return Object.freeze({ ...metrics, positionBytesCopied });
  }

  clear() {
    return metricsToJs(clearBatch(this.#batch));
  }

  async readPixel(x, y) {
    if (typeof this.#batch.readPixel !== "function") throw new TypeError("WebGPU diagnostic readback unavailable");
    const pixel = toJsData(await readPixel(this.#batch, x, y));
    return [pixel.r, pixel.g, pixel.b, pixel.a];
  }

  async readTranslation() {
    if (typeof this.#batch.readTranslation !== "function") throw new TypeError("WebGPU translation diagnostic unavailable");
    return toJsData(await readTranslation(this.#batch));
  }

  dispose() {
    return disposeBatch(this.#batch);
  }
}
