import {defineConfig} from "@playwright/test";
import motion from "./motion.playwright.config.mjs";
export default defineConfig({...motion,testMatch:["todolist.spec.mjs"],outputDir:"../test-results/todolist"});
