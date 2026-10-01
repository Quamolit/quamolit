import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
export default defineConfig({
  testDir: ".",
  testMatch: "layer-composition.spec.mjs",
  workers: 1,
  timeout: 30000,
  outputDir: "../test-results/layer-composition",
  use: { baseURL: "http://127.0.0.1:5193", viewport: { width: 1280, height: 720 } },
  projects: [
    { name: "chromium", use: { browserName: "chromium", deviceScaleFactor: 1 } },
    { name: "chromium-dpr2", use: { browserName: "chromium", deviceScaleFactor: 2 } },
  ],
  webServer: {
    command: "yarn vite --host 127.0.0.1 --port 5193 --strictPort",
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    url: "http://127.0.0.1:5193/examples/layer-composition/index.html",
    reuseExistingServer: false,
  },
});
