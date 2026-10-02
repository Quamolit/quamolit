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
  #generation = 0;
  #setTimer;
  #clearTimer;
  #timer;
  #timerGeneration = 0;

  constructor({ requestFrame, cancelFrame, paint, setTimer = setTimeout, clearTimer = clearTimeout }) {
    if (typeof requestFrame !== "function" || typeof cancelFrame !== "function" || typeof paint !== "function") {
      throw new TypeError("frame scheduler host functions required");
    }
    this.#requestFrame = requestFrame;
    this.#cancelFrame = cancelFrame;
    this.#paint = paint;
    if (typeof setTimer !== "function" || typeof clearTimer !== "function") throw new TypeError("timer host functions required");
    this.#setTimer = setTimer;
    this.#clearTimer = clearTimer;
  }

  request(reason, input) {
    if (this.#disposed) throw new Error("frame scheduler disposed");
    if (typeof reason !== "string" || reason.length === 0) throw new TypeError("invalidation reason required");
    this.#cancelTimer();
    this.#reasons.add(reason);
    if (input !== undefined) this.#inputs.push(input);
    this.#schedule();
  }

  // A single future wake, replaced by immediate invalidation or another deadline.
  // Pause/dispose cancel it; the caller recomputes its deadline when playback resumes.
  requestAfter(reason, delay) {
    if (this.#disposed) throw new Error("frame scheduler disposed");
    if (typeof reason !== "string" || reason.length === 0) throw new TypeError("invalidation reason required");
    if (!Number.isFinite(delay) || delay < 0) throw new RangeError("delay must be finite and nonnegative");
    this.#cancelTimer();
    if (this.#paused) return;
    const generation = this.#timerGeneration;
    this.#timer = this.#setTimer(() => {
      if (generation !== this.#timerGeneration) return;
      this.#timer = undefined;
      this.request(reason);
    }, Math.min(delay, 2147483647));
  }

  #cancelTimer() {
    this.#timerGeneration++;
    if (this.#timer !== undefined) this.#clearTimer(this.#timer);
    this.#timer = undefined;
  }

  pause() {
    if (this.#disposed) return;
    this.#paused = true;
    this.#cancelTimer();
    if (this.#handle !== undefined) {
      this.#generation++;
      this.#cancelFrame(this.#handle);
    }
    this.#handle = undefined;
  }

  resume() {
    if (this.#disposed) return;
    this.#paused = false;
    this.#schedule();
  }

  dispose() {
    this.#cancelTimer();
    if (this.#handle !== undefined) {
      this.#generation++;
      this.#cancelFrame(this.#handle);
    }
    this.#handle = undefined;
    this.#disposed = true;
    this.#reasons.clear();
    this.#inputs.length = 0;
  }

  #schedule() {
    if (this.#paused || this.#disposed || this.#handle !== undefined || this.#reasons.size === 0) return;
    const generation = ++this.#generation;
    this.#handle = this.#requestFrame((timestamp) => {
      if (generation !== this.#generation) return;
      this.#generation++;
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
  get waiting() { return this.#timer !== undefined; }
  get queuedInputs() { return this.#inputs.length; }
}
