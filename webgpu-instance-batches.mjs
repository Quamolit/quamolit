import { float32CopyRange } from "./.calcit/modules/js-ffi/typed-arrays.mjs";
import { createFloat32RectBatch } from "./.calcit/modules/js-ffi/webgpu-rect-batches.mjs";

/** Scene InstanceSource → one retained js-ffi WebGPU rectangle layer. */
export class WebGpuInstanceBatches {
  #registry;
  #batch;
  #copies = new WeakMap();
  #activeToken;

  static async create(canvas, capability, registry, capacity) {
    if (capability?.kind !== "ready" || capability.state !== "ready") throw new TypeError("ready WebGPU capability required");
    const batch = await createFloat32RectBatch(canvas, capability.device, capability.format, capacity);
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
      this.#batch.upload(positions);
      this.#activeToken = token;
    }
    const metrics = this.#batch.draw({ width: instance.width, height: instance.height, fill: instance.fill, alpha, translation });
    return Object.freeze({ ...metrics, positionBytesCopied });
  }

  clear() {
    return this.#batch.draw({ count: 0, width: 0, height: 0, fill: { r: 1, g: 1, b: 1, a: 1 } });
  }

  readPixel(x, y) {
    if (typeof this.#batch.readPixel !== "function") throw new TypeError("WebGPU diagnostic readback unavailable");
    return this.#batch.readPixel(x, y);
  }

  dispose() {
    return this.#batch.dispose();
  }
}
