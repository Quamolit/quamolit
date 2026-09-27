import { defineConfig } from "@playwright/test";
import motion from "./motion.playwright.config.mjs";
export default defineConfig({ ...motion, testMatch: ["drag-demo.spec.mjs"], outputDir: "../test-results/drag-demo" });
