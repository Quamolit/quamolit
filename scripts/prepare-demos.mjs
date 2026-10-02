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
// 调用方 compile 已安装根模块；bootstrap 仅为旧 runtime smoke 提供生成 core。
// 真正应用按同一清单编译，不能递归调用 compile/compile:demos。
run(["compile:bootstrap"]);
for (const command of new Set(catalog.entries.map(entry => entry.compile))) {
  if (command === "compile" || command === "compile:demos")
    throw new Error("清单入口不能递归调用完整 compile；请填写具体 Calcit 编译命令");
  if (!command || command === "compile:bootstrap" || command === "consumer") continue;
  run([command]);
}
const consumer = join(root, "examples/retained-consumer");
run(["install", "--immutable"], consumer);
run(["compile"], consumer);
