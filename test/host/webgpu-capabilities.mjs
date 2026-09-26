import { probe_$x_ as probeCalcit } from "../../target/js/motion/quamolit.webgpu-capabilities.mjs";
import { to_js_data as toJsData } from "../../target/js/motion/calcit.core.mjs";

/** Adapt the upstream Calcit enum to the existing fixture/backend host shape. */
export async function probeWebGpuDevice(navigatorHost) {
  const result = await probeCalcit(navigatorHost);
  const kind = result?.tag?.value;
  if (kind === "ready") return result.extra[0];
  if (kind === "unavailable" || kind === "failed") {
    return Object.freeze({ kind, ...toJsData(result.extra[0]) });
  }
  throw new TypeError(`Unexpected Calcit WebGPU probe result: ${String(kind)}`);
}
