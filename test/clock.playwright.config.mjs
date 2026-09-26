import { defineConfig } from "@playwright/test";
import motion from "./motion.playwright.config.mjs";
export default defineConfig({ ...motion, testMatch: ["clock.spec.mjs"], outputDir: "../test-results/clock" });
