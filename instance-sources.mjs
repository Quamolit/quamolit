import { float32Length, snapshotFloat32 } from "./.calcit/modules/js-ffi/typed-arrays.mjs";

function validateDescriptor(source) {
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    throw new TypeError("InstanceSource descriptor required");
  }
  const { id, version, count } = source;
  if (typeof id !== "string" || id.length === 0) throw new TypeError("InstanceSource id must be a nonempty string");
  if (!Number.isSafeInteger(version) || version < 0) throw new RangeError("InstanceSource version must be a nonnegative safe integer");
  if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(count * 2)) {
    throw new RangeError("InstanceSource count must be a nonnegative safe integer with safe x/y length");
  }
  return { id, version, count };
}

/** Host-side position storage for serializable Scene IR InstanceSource references. */
export class InstanceSourceRegistry {
  #entries = new Map();
  #latestVersions = new Map();

  register(source, positions) {
    const { id, version, count } = validateDescriptor(source);
    const latest = this.#latestVersions.get(id);
    if (latest !== undefined && version <= latest) {
      throw new RangeError(`InstanceSource ${id} version must exceed ${latest}`);
    }
    const snapshot = snapshotFloat32(positions);
    if (float32Length(snapshot) !== count * 2) {
      throw new RangeError(`InstanceSource ${id} requires ${count * 2} interleaved x/y values`);
    }
    let versions = this.#entries.get(id);
    if (versions === undefined) {
      versions = new Map();
      this.#entries.set(id, versions);
    }
    versions.set(version, { count, snapshot });
    this.#latestVersions.set(id, version);
    return snapshot;
  }

  resolve(source) {
    const { id, version, count } = validateDescriptor(source);
    const entry = this.#entries.get(id)?.get(version);
    if (entry === undefined || entry.count !== count) {
      throw new RangeError(`InstanceSource ${id}@${version} with count ${count} is unavailable`);
    }
    return entry.snapshot;
  }

  release(source) {
    const { id, version, count } = validateDescriptor(source);
    const versions = this.#entries.get(id);
    const entry = versions?.get(version);
    if (entry === undefined || entry.count !== count) return false;
    versions.delete(version);
    if (versions.size === 0) this.#entries.delete(id);
    return true;
  }

  get liveCount() {
    let total = 0;
    for (const versions of this.#entries.values()) total += versions.size;
    return total;
  }
}
