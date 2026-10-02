import demos from "./demos/vite.config.mjs";

// 普通 release 与 release:demos 共用输入和语义，仅输出目录不同。
export default {
  ...demos,
  build: {
    ...demos.build,
    outDir: "dist",
  },
};
