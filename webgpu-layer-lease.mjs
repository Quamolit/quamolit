function releaseDetached(candidate, layer) {
  const errors = [];
  try { layer?.dispose(); } catch (error) { errors.push(String(error?.message ?? error)); }
  try { candidate.release(); } catch (error) { errors.push(String(error?.message ?? error)); }
  return errors;
}

/** Quamolit-owned device/layer lease. Scene IR retains only reconstructible data. */
export class WebGpuLayerLease {
  #probe;
  #create;
  #onLost;
  #generation = 0;
  #pending;
  #capability;
  #layer;
  #created = 0;
  #disposed = 0;

  constructor({ probe, create, onLost = () => {} }) {
    if (typeof probe !== "function" || typeof create !== "function" || typeof onLost !== "function") {
      throw new TypeError("probe, create and onLost must be functions");
    }
    this.#probe = probe;
    this.#create = create;
    this.#onLost = onLost;
  }

  get capability() { return this.#capability; }
  get layer() { return this.#layer; }
  get metrics() { return Object.freeze({ created: this.#created, disposed: this.#disposed, live: this.#created - this.#disposed }); }

  open(host) {
    if (this.#layer && this.#capability?.state === "ready") {
      return Promise.resolve({ kind: "ready", capability: this.#capability, layer: this.#layer });
    }
    if (this.#layer) this.close();
    if (this.#pending) return this.#pending;
    const generation = ++this.#generation;
    const pending = this.#openAt(host, generation);
    this.#pending = pending;
    void pending.finally(() => { if (this.#pending === pending) this.#pending = undefined; }).catch(() => {});
    return pending;
  }

  async #openAt(host, generation) {
    let candidate;
    try { candidate = await this.#probe(host); }
    catch (error) {
      return generation === this.#generation
        ? { kind: "failed", stage: "probe", message: String(error?.message ?? error) }
        : { kind: "cancelled" };
    }
    if (candidate?.kind !== "ready") return generation === this.#generation
      ? candidate ?? { kind: "failed", stage: "probe", message: "missing probe result" }
      : { kind: "cancelled" };
    if (generation !== this.#generation) {
      return { kind: "cancelled", errors: releaseDetached(candidate) };
    }
    const adapterInfo = candidate.adapter?.info ?? {};
    if (adapterInfo.isFallbackAdapter === true) {
      return { kind: "fallback", adapterInfo, errors: releaseDetached(candidate) };
    }
    let layer;
    try {
      layer = await this.#create(candidate);
      if (generation !== this.#generation || candidate.state !== "ready") {
        const errors = releaseDetached(candidate, layer);
        return generation === this.#generation
          ? { kind: "failed", stage: "device", message: "device no longer ready", ...(errors.length ? { errors } : {}) }
          : { kind: "cancelled", errors };
      }
      if (typeof layer?.dispose !== "function" || typeof candidate.lost?.then !== "function") {
        throw new TypeError("ready device and layer must support loss and disposal");
      }
      this.#capability = candidate;
      this.#layer = layer;
      this.#created++;
      Promise.resolve(candidate.lost).then((info) => {
        if (generation !== this.#generation || this.#layer !== layer) return;
        const cleanup = this.close();
        this.#onLost(info, cleanup);
      }).catch((error) => {
        if (generation !== this.#generation || this.#layer !== layer) return;
        const cleanup = this.close();
        this.#onLost({ reason: "unknown", message: String(error?.message ?? error) }, cleanup);
      });
      return { kind: "ready", capability: candidate, layer, adapterInfo };
    } catch (error) {
      const errors = releaseDetached(candidate, layer);
      return generation === this.#generation
        ? { kind: "failed", stage: "create", message: String(error?.message ?? error), ...(errors.length ? { errors } : {}) }
        : { kind: "cancelled", errors };
    }
  }

  close() {
    this.#generation++;
    this.#pending = undefined;
    const layer = this.#layer;
    const capability = this.#capability;
    this.#layer = undefined;
    this.#capability = undefined;
    const errors = [];
    if (layer) {
      try { layer.dispose(); this.#disposed++; }
      catch (error) { errors.push(String(error?.message ?? error)); }
    }
    if (capability) {
      try { capability.release(); } catch (error) { errors.push(String(error?.message ?? error)); }
    }
    return Object.freeze({ released: Boolean(layer || capability), errors, ...this.metrics });
  }
}
