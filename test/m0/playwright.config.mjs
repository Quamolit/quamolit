import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const baseURL = "http://127.0.0.1:5179";
const projectRoot = fileURLToPath(new URL("../../", import.meta.url));

export default defineConfig({
  testDir: ".",
  testMatch: "visual.spec.mjs",
  workers: 1,
  retries: 0,
  timeout: 30_000,
  updateSnapshots: "none",
  snapshotPathTemplate: "{testDir}/snapshots/{arg}-{projectName}-{platform}{ext}",
  outputDir: "../../test-results/visual",
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  use: {
    baseURL,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    locale: "zh-CN",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "yarn vite --host 127.0.0.1 --port 5179 --strictPort",
    cwd: projectRoot,
    url: `${baseURL}/test/m0/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
