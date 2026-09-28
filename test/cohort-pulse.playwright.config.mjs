import { defineConfig } from "@playwright/test";
import motion from "./motion.playwright.config.mjs";

export default defineConfig({
  ...motion,
  testMatch: ["cohort-pulse.spec.mjs"],
  outputDir: "../test-results/cohort-pulse",
});
