/** One pending frame at most; explicit invalidations and input events wake an idle scene. */
export class DemandFrameScheduler {
  #requestFrame;
  #cancelFrame;
  #paint;
  #handle;
  #paused = false;
  #disposed = false;
  #reasons = new Set();
  #inputs = [];
  #submissions = 0;

  constructor({ requestFrame, cancelFrame, paint }) {
    if (typeof requestFrame !== "function" || typeof cancelFrame !== "function" || typeof paint !== "function") {
      throw new TypeError("frame scheduler host functions required");
    }
    this.#requestFrame = requestFrame;
    this.#cancelFrame = cancelFrame;
    this.#paint = paint;
  }

  request(reason, input) {
    if (this.#disposed) throw new Error("frame scheduler disposed");
    if (typeof reason !== "string" || reason.length === 0) throw new TypeError("invalidation reason required");
    this.#reasons.add(reason);
    if (input !== undefined) this.#inputs.push(input);
    this.#schedule();
  }

  pause() {
    if (this.#disposed) return;
    this.#paused = true;
    if (this.#handle !== undefined) this.#cancelFrame(this.#handle);
    this.#handle = undefined;
  }

  resume() {
    if (this.#disposed) return;
    this.#paused = false;
    this.#schedule();
  }

  dispose() {
    if (this.#handle !== undefined) this.#cancelFrame(this.#handle);
    this.#handle = undefined;
    this.#disposed = true;
    this.#reasons.clear();
    this.#inputs.length = 0;
  }

  #schedule() {
    if (this.#paused || this.#disposed || this.#handle !== undefined || this.#reasons.size === 0) return;
    this.#handle = this.#requestFrame((timestamp) => {
      this.#handle = undefined;
      if (this.#paused || this.#disposed) return;
      const reasons = [...this.#reasons];
      const inputs = this.#inputs.splice(0);
      this.#reasons.clear();
      this.#submissions++;
      try { this.#paint(timestamp, Object.freeze(reasons), Object.freeze(inputs)); }
      finally { this.#schedule(); }
    });
  }

  get submissions() { return this.#submissions; }
  get pending() { return this.#handle !== undefined; }
  get queuedInputs() { return this.#inputs.length; }
}
