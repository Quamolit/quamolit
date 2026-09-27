import { defineConfig } from "@playwright/test";
import motion from "./motion.playwright.config.mjs";

export default defineConfig({
  ...motion,
  testMatch: ["tidal-bloom.spec.mjs"],
  outputDir: "../test-results/tidal-bloom",
});
