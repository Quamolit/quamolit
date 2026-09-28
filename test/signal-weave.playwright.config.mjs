import { defineConfig } from "@playwright/test";
import motion from "./motion.playwright.config.mjs";

export default defineConfig({
  ...motion,
  testMatch: ["signal-weave.spec.mjs"],
  outputDir: "../test-results/signal-weave",
});
