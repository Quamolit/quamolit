import { defineConfig } from "@playwright/test";
import motion from "./motion.playwright.config.mjs";

export default defineConfig({
  ...motion,
  testMatch: ["retained-component.spec.mjs"],
  outputDir: "../test-results/retained-component",
});
