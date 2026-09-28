import { defineConfig } from "@playwright/test";
import motion from "./motion.playwright.config.mjs";

export default defineConfig({
  ...motion,
  testMatch: ["scene-pointer-browser.spec.mjs"],
  outputDir: "../test-results/scene-pointer-browser",
});
