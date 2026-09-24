const ownedRegistries = new WeakSet();

function sourceFromItem(item) {
  const content = item?.entry?.node?.content;
  if (!Array.isArray(content) || content.length !== 2) throw new TypeError("Presence item needs SceneContent");
  if (content[0] !== "instances") return null;
  const source = content[1]?.source;
  if (source === null || typeof source !== "object") throw new TypeError("InstanceSource required");
  return source;
}

/** Live-host ownership of registered instance snapshots retained by PresenceModel. */
export class PresenceInstanceResources {
  #registry;
  #references = new Map();

  constructor(registry) {
    if (registry === null || typeof registry?.resolve !== "function" || typeof registry?.release !== "function") {
      throw new TypeError("InstanceSourceRegistry required");
    }
    if (ownedRegistries.has(registry)) throw new TypeError("InstanceSourceRegistry already has a Presence owner");
    ownedRegistries.add(registry);
    this.#registry = registry;
  }

  sync(model) {
    if (!Array.isArray(model?.items)) throw new TypeError("Plain PresenceModel with items required");
    const next = new Map();
    for (const item of model.items) {
      const source = sourceFromItem(item);
      if (source === null) continue;
      this.#registry.resolve(source); // Validate all new references before any release.
      const key = JSON.stringify([source.id, source.version, source.count]);
      const retained = next.get(key);
      next.set(key, { source, count: (retained?.count ?? 0) + 1 });
    }
    for (const [key, previous] of this.#references) {
      if (!next.has(key)) this.#registry.resolve(previous.source);
    }
    let released = 0;
    for (const [key, previous] of this.#references) {
      if (!next.has(key)) {
        if (!this.#registry.release(previous.source)) throw new Error(`Lost retained InstanceSource ${key}`);
        released++;
      }
    }
    this.#references = next;
    return {
      liveReferences: [...next.values()].reduce((total, entry) => total + entry.count, 0),
      liveSources: next.size,
      released,
    };
  }

  clear() {
    return this.sync({ items: [] });
  }
}
