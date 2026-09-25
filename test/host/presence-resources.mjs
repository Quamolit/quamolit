import {
  empty_instance_resource_plan as emptyResourcePlan,
  empty_presence_model as emptyPresenceModel,
  instance_resource_plan as instanceResourcePlan,
} from "../../target/js/motion/quamolit.presence.mjs";
import { to_js_data as toJsData } from "../../target/js/motion/calcit.core.mjs";

const ownedRegistries = new WeakSet();

/**
 * Host ownership of registered instance snapshots retained by PresenceModel.
 * Reference counting, release decisions and live counts come from the Calcit
 * `quamolit.presence/instance-resource-plan`; this adapter only applies the
 * plan to a live registry and validates that new references exist first.
 */
export class PresenceInstanceResources {
  #registry;
  #plan;

  constructor(registry) {
    if (registry === null || typeof registry?.resolve !== "function" || typeof registry?.release !== "function") {
      throw new TypeError("InstanceSourceRegistry required");
    }
    if (ownedRegistries.has(registry)) throw new TypeError("InstanceSourceRegistry already has a Presence owner");
    ownedRegistries.add(registry);
    this.#registry = registry;
    this.#plan = emptyResourcePlan();
  }

  sync(model) {
    const plan = instanceResourcePlan(model, this.#plan);
    const plain = toJsData(plan);
    for (const ref of plain.references) this.#registry.resolve(ref.source); // Validate all new references before any release.
    let released = 0;
    for (const source of plain.release) {
      if (!this.#registry.release(source)) throw new Error("Lost retained InstanceSource");
      released++;
    }
    this.#plan = plan;
    return { liveReferences: plain["live-references"], liveSources: plain["live-sources"], released };
  }

  clear() {
    return this.sync(emptyPresenceModel());
  }
}
