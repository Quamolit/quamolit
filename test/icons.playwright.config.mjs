import { defineConfig } from "@playwright/test";
import motion from "./motion.playwright.config.mjs";
export default defineConfig({ ...motion, testMatch: ["icons.spec.mjs"], outputDir: "../test-results/icons" });
