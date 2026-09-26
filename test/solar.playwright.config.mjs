import { defineConfig } from "@playwright/test";
import motion from "./motion.playwright.config.mjs";
export default defineConfig({ ...motion, testMatch: ["solar.spec.mjs"], outputDir: "../test-results/solar" });
