import { defineConfig } from "@playwright/test";
import motion from "./motion.playwright.config.mjs";

export default defineConfig({
  ...motion,
  testMatch: ["layered-dashboard.spec.mjs"],
  outputDir: "../test-results/layered-dashboard",
});
