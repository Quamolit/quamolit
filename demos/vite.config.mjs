import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(readFileSync(new URL("./catalog.json", import.meta.url), "utf8"));
export default {
  root,
  build: {
    outDir: "dist-demos",
    minify: false,
    rolldownOptions: {
      input: ["demos/index.html", ...catalog.entries.map(entry => entry.path)].map(path => resolve(root, path)),
    },
  },
};
