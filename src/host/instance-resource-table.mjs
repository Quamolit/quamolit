// Calcit :ffi :js :file 单函数表达式；返回可复用的实例源资源表句柄。
// 只负责 Float32 位置快照与 id/version/count 所有权计数，不解释 Scene/Motion。
() => {
  const entries = new Map();
  const latest = new Map();
  const noPatch = Object.freeze({ available: false, baseVersion: -1, start: 0, count: 0, positions: new Float32Array(0) });
  const check = (id, version, count) => {
    if (typeof id !== 'string' || id.length === 0) throw new TypeError('InstanceSource id must be a nonempty string');
    if (!Number.isSafeInteger(version) || version < 0) throw new RangeError('InstanceSource version must be a nonnegative safe integer');
    if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(count * 2)) throw new RangeError('InstanceSource count must be a nonnegative safe integer with safe x/y length');
  };
  const checkPositions = (positions, length) => {
    if (!(positions instanceof Float32Array) ||
        (typeof SharedArrayBuffer !== 'undefined' && positions.buffer instanceof SharedArrayBuffer)) {
      throw new TypeError('non-shared Float32Array positions needed');
    }
    if (positions.length !== length) throw new RangeError(`InstanceSource needs ${length} interleaved x/y values`);
    for (let index = 0; index < positions.length; index++) {
      if (!Number.isFinite(positions[index])) throw new RangeError(`non-finite instance coordinate at ${index}`);
    }
  };
  const materialize = (entry) => {
    if (entry.snapshot === undefined) {
      const patches = [];
      let cursor = entry;
      while (cursor.snapshot === undefined) { patches.push(cursor); cursor = cursor.base; }
      const snapshot = cursor.snapshot.slice();
      for (let index = patches.length - 1; index >= 0; index--) {
        snapshot.set(patches[index].patch, patches[index].start * 2);
      }
      entry.snapshot = snapshot;
    }
    return entry.snapshot;
  };
  const entryFor = (id, version, count) => {
    check(id, version, count);
    const entry = entries.get(id)?.get(version);
    if (entry === undefined || entry.count !== count) throw new RangeError(`InstanceSource ${id}@${version} with count ${count} is unavailable`);
    return entry;
  };
  return {
    register(id, version, count, positions) {
      check(id, version, count);
      const previous = latest.get(id);
      if (previous !== undefined && version <= previous) throw new RangeError(`InstanceSource ${id} version must exceed ${previous}`);
      checkPositions(positions, count * 2);
      const snapshot = positions.slice();
      let versions = entries.get(id);
      if (versions === undefined) { versions = new Map(); entries.set(id, versions); }
      versions.set(version, { count, snapshot });
      latest.set(id, version);
      return snapshot;
    },
    registerPatch(id, version, count, baseVersion, start, positions) {
      check(id, version, count);
      if (!Number.isSafeInteger(baseVersion) || baseVersion < 0 || baseVersion >= version) throw new RangeError('invalid patch base version');
      const previous = latest.get(id);
      if (previous === undefined || version <= previous) throw new RangeError(`InstanceSource ${id} version must exceed ${previous}`);
      const base = entryFor(id, baseVersion, count);
      if (!Number.isSafeInteger(start) || start < 0 || start > count) throw new RangeError('invalid patch start');
      if (!(positions instanceof Float32Array) || positions.length % 2 !== 0) throw new TypeError('interleaved Float32Array patch needed');
      const patchCount = positions.length / 2;
      if (start + patchCount > count) throw new RangeError('patch exceeds source count');
      checkPositions(positions, patchCount * 2);
      const patch = positions.slice();
      entries.get(id).set(version, { count, base, baseVersion, start, patch });
      latest.set(id, version);
      return patch.byteLength;
    },
    resolve(id, version, count) {
      return materialize(entryFor(id, version, count));
    },
    patchInfo(id, version, count) {
      const entry = entryFor(id, version, count);
      return entry.patch === undefined ? noPatch : Object.freeze({ available: true, baseVersion: entry.baseVersion, start: entry.start, count: entry.patch.length / 2, positions: entry.patch.slice() });
    },
    release(id, version, count) {
      check(id, version, count);
      const versions = entries.get(id);
      const entry = versions?.get(version);
      if (entry === undefined || entry.count !== count) return false;
      versions.delete(version);
      if (versions.size === 0) entries.delete(id);
      return true;
    },
    liveCount() {
      let total = 0;
      for (const versions of entries.values()) total += versions.size;
      return total;
    },
  };
}
