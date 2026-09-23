import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const baseURL = "http://127.0.0.1:5180";
const projectRoot = fileURLToPath(new URL("../", import.meta.url));

export default defineConfig({
  testDir: ".",
  testMatch: ["motion.spec.mjs", "keyframes.spec.mjs", "color.spec.mjs"],
  workers: 1,
  retries: 0,
  timeout: 30_000,
  outputDir: "../test-results/motion",
  reporter: process.env.CI ? [["line"], ["html", { open: "never", outputFolder: "playwright-report-motion" }]] : "list",
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  use: { baseURL, viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  webServer: {
    command: "yarn vite --host 127.0.0.1 --port 5180 --strictPort",
    cwd: projectRoot,
    url: `${baseURL}/test/motion.html`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
