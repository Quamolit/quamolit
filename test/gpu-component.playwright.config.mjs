import gpu from './gpu.playwright.config.mjs';
export default {...gpu,testMatch:['gpu-component.spec.mjs'],outputDir:'../test-results/gpu-component'};
