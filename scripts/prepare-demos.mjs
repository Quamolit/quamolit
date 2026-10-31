import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(await readFile(join(root, "demos/catalog.json"), "utf8"));
function run(command, args, cwd = root) {
  console.log("准备演示: " + command + " " + args.join(" "));
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} 退出码 ${result.status}`);
}
// 调用方 compile 已安装根模块；bootstrap 仅为旧 runtime smoke 提供生成 core。
// 真正应用按同一清单编译，不能递归调用 compile/compile:demos。
run("yarn", ["compile:bootstrap"]);
for (const command of new Set(catalog.entries.map(entry => entry.compile))) {
  if (command === "compile" || command === "compile:demos")
    throw new Error("清单入口不能递归调用完整 compile；请填写具体 Calcit 编译命令");
  if (!command || command === "compile:bootstrap" || command === "consumer") continue;
  run("yarn", [command]);
}
const consumer = join(root, "examples/retained-consumer");
run("yarn", ["install", "--immutable"], consumer);
const candidate = process.env.QUAMOLIT_CONSUMER_REF;
if (candidate) {
  // PR 画廊消费本次提交；正式示例的 deps 仍指向发布 tag，不回写候选 hash。
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(candidate)) throw new Error("无效的候选 Git ref");
  const source = await mkdtemp(join(tmpdir(), "quamolit-gallery-consumer-"));
  try {
    for (const file of ["calcit.cirru", "deps.cirru", "package.json"])
      await cp(join(consumer, file), join(source, file));
    run("caps", ["--ci", "add", "Quamolit/quamolit", "-r", candidate], source);
    run("calcit", ["--emit-path", join(consumer, "target/js/app/"), "js"], source);
  } finally {
    await rm(source, { recursive: true, force: true });
  }
} else {
  run("yarn", ["compile"], consumer);
}
