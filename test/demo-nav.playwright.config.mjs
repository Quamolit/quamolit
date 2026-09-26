import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
const baseURL = "http://127.0.0.1:5190/preview/";
export default defineConfig({
  testDir: ".",
  testMatch: "demo-nav.spec.mjs",
  workers: 1,
  retries: 0,
  timeout: 30000,
  outputDir: "../test-results/demo-nav",
  reporter: "list",
  use: { baseURL, browserName: "chromium", viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, trace: "retain-on-failure" },
  webServer: {
    command: "node test/demo-nav-server.mjs",
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    url: `${baseURL}demos/index.html`,
    reuseExistingServer: false,
  },
});
