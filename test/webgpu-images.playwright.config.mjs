import gpu from "./gpu.playwright.config.mjs";
export default { ...gpu, testMatch: ["webgpu-images.spec.mjs"], outputDir: "../test-results/gpu-images" };
