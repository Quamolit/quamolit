// Calcit :ffi :js :file 单函数表达式；返回可复用的实例源资源表句柄。
// 只负责 Float32 位置快照与 id/version/count 所有权计数，不解释 Scene/Motion。
() => {
  const entries = new Map();
  const latest = new Map();
  const check = (id, version, count) => {
    if (typeof id !== 'string' || id.length === 0) throw new TypeError('InstanceSource id must be a nonempty string');
    if (!Number.isSafeInteger(version) || version < 0) throw new RangeError('InstanceSource version must be a nonnegative safe integer');
    if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(count * 2)) throw new RangeError('InstanceSource count must be a nonnegative safe integer with safe x/y length');
  };
  return {
    register(id, version, count, positions) {
      check(id, version, count);
      const previous = latest.get(id);
      if (previous !== undefined && version <= previous) throw new RangeError(`InstanceSource ${id} version must exceed ${previous}`);
      if (!(positions instanceof Float32Array)) throw new TypeError('Float32Array positions needed');
      if (positions.length !== count * 2) throw new RangeError(`InstanceSource ${id} needs ${count * 2} interleaved x/y values`);
      for (let index = 0; index < positions.length; index++) {
        if (!Number.isFinite(positions[index])) throw new RangeError(`non-finite instance coordinate at ${index}`);
      }
      const snapshot = positions.slice();
      let versions = entries.get(id);
      if (versions === undefined) { versions = new Map(); entries.set(id, versions); }
      versions.set(version, { count, snapshot });
      latest.set(id, version);
      return snapshot;
    },
    resolve(id, version, count) {
      check(id, version, count);
      const entry = entries.get(id)?.get(version);
      if (entry === undefined || entry.count !== count) throw new RangeError(`InstanceSource ${id}@${version} with count ${count} is unavailable`);
      return entry.snapshot;
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
