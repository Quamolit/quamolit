import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(await readFile(join(root, "demos/catalog.json"), "utf8"));
function run(args, cwd = root) {
  console.log("准备演示: yarn " + args.join(" "));
  const result = spawnSync("yarn", args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// 默认 compile 先由 caps 安装根模块；清单中的编译入口去重执行。
run(["compile"]);
for (const command of new Set(catalog.entries.map(entry => entry.compile))) {
  if (!command || command === "compile" || command === "consumer") continue;
  run([command]);
}
const consumer = join(root, "examples/retained-consumer");
run(["install", "--immutable"], consumer);
run(["compile"], consumer);
