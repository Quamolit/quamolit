const REVISION_KEYS = ["model", "input", "resources", "viewport", "quality", "motion"];
const TARGETS = { rect: new Set(["x", "y", "width", "height"]), group: new Set(["opacity"]) };

function validatedRevisions(revisions) {
  if (revisions === null || typeof revisions !== "object") throw new TypeError("explicit revisions required");
  const result = {};
  for (const key of REVISION_KEYS) {
    const value = revisions[key];
    if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${key} revision must be a nonnegative safe integer`);
    result[key] = value;
  }
  return result;
}

function compileDocument(document, samplers) {
  if (!Array.isArray(document?.nodes) || document.nodes.length === 0) throw new TypeError("serialized SceneDocument required");
  if (!(samplers instanceof Map)) throw new TypeError("Motion sampler Map required");
  const nodes = structuredClone(document.nodes);
  const slots = [];
  for (const node of nodes) {
    const [kind, content] = node.content ?? [];
    if (typeof kind !== "string" || content === null || typeof content !== "object") throw new TypeError("Scene node content required");
    if (!Array.isArray(node.bindings)) throw new TypeError("Scene bindings required");
    for (const binding of node.bindings) {
      const target = binding.target;
      const field = Array.isArray(target) && target.length === 1 ? target[0] : undefined;
      if (!TARGETS[kind]?.has(field)) throw new TypeError(`unsupported ${kind} Motion target ${field}`);
      const id = binding["motion-id"];
      const version = binding.version;
      if (typeof id !== "string" || id.length === 0 || !Number.isSafeInteger(version) || version < 0) {
        throw new TypeError("valid Motion ID/version required");
      }
      const entry = samplers.get(`${id}@${version}`);
      if (typeof entry?.sample !== "function" || !Array.isArray(entry.dependencies)
        || entry.dependencies.some((key) => !REVISION_KEYS.includes(key))
        || new Set(entry.dependencies).size !== entry.dependencies.length) {
        throw new TypeError(`Motion ${id}@${version} requires a sampler and explicit dependencies`);
      }
      slots.push({ content, kind, field, sample: entry.sample, dependencies: new Set(entry.dependencies) });
    }
  }
  return { nodes, slots };
}

/** Host execution cache for a serialized, already validated SceneDocument. */
export class RetainedScenePlan {
  #nodes;
  #slots;
  #sceneRevision;
  #lastTime;
  #lastRevisions;
  #metrics = { planBuilds: 0, staticSceneCopies: 0, bindingSamples: 0, skippedUpdates: 0 };

  constructor(document, samplers, sceneRevision = 0) {
    if (!Number.isSafeInteger(sceneRevision) || sceneRevision < 0) throw new RangeError("scene revision must be a nonnegative safe integer");
    const compiled = compileDocument(document, samplers);
    this.#nodes = compiled.nodes;
    this.#slots = compiled.slots;
    this.#sceneRevision = sceneRevision;
    this.#metrics.planBuilds++;
    this.#metrics.staticSceneCopies++;
  }

  replace(document, samplers, sceneRevision) {
    if (!Number.isSafeInteger(sceneRevision) || sceneRevision <= this.#sceneRevision) {
      throw new RangeError("new scene revision must increase");
    }
    const compiled = compileDocument(document, samplers);
    this.#nodes = compiled.nodes;
    this.#slots = compiled.slots;
    this.#sceneRevision = sceneRevision;
    this.#lastTime = undefined;
    this.#lastRevisions = undefined;
    this.#metrics.planBuilds++;
    this.#metrics.staticSceneCopies++;
  }

  update(time, revisions, values) {
    if (!Number.isFinite(time)) throw new RangeError("time must be finite");
    const current = validatedRevisions(revisions);
    const reasons = [];
    if (this.#lastRevisions === undefined) reasons.push("initial");
    else {
      if (time !== this.#lastTime) reasons.push("time");
      for (const key of REVISION_KEYS) if (current[key] !== this.#lastRevisions[key]) reasons.push(key);
    }
    if (reasons.length === 0) {
      this.#metrics.skippedUpdates++;
      return Object.freeze({ changed: false, reasons: Object.freeze([]), ...this.metrics });
    }
    // Validate every result before modifying the retained frame.
    const next = this.#slots.filter(({ dependencies }) => reasons.includes("initial") || reasons.includes("time")
      || reasons.some((reason) => dependencies.has(reason))).map((slot) => {
      const { sample, kind, field } = slot;
      const value = sample(time, values);
      if (!Number.isFinite(value) || ((field === "width" || field === "height") && value < 0)
        || (kind === "group" && (value < 0 || value > 1))) {
        throw new RangeError(`invalid sampled ${kind}.${field}`);
      }
      return { slot, value };
    });
    for (const { slot, value } of next) slot.content[slot.field] = value;
    this.#metrics.bindingSamples += next.length;
    this.#lastTime = time;
    this.#lastRevisions = current;
    return Object.freeze({ changed: true, reasons: Object.freeze(reasons), ...this.metrics });
  }

  /** Borrowed nodes for synchronous draw only; use snapshot() to retain a frame. */
  forEachNode(visit) {
    if (typeof visit !== "function") throw new TypeError("draw visitor required");
    this.#nodes.forEach(visit);
  }
  snapshot() { return { nodes: structuredClone(this.#nodes) }; }
  get sceneRevision() { return this.#sceneRevision; }
  get metrics() { return Object.freeze({ ...this.#metrics }); }
}
