import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const baseURL = "http://127.0.0.1:5181";
const projectRoot = fileURLToPath(new URL("../", import.meta.url));

export default defineConfig({
  testDir: ".",
  testMatch: ["webgpu-instances.spec.mjs", "webgpu-presence.spec.mjs"],
  workers: 1,
  retries: 0,
  timeout: 30_000,
  outputDir: "../test-results/gpu",
  reporter: "list",
  projects: [{ name: "chromium-webgpu", use: {
    browserName: "chromium",
    launchOptions: { args: ["--enable-unsafe-webgpu"] },
  } }],
  use: { baseURL, viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  webServer: {
    command: "yarn vite --host 127.0.0.1 --port 5181 --strictPort",
    cwd: projectRoot,
    url: `${baseURL}/test/instance-sources.html`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
