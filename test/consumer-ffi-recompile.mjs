import assert from "node:assert/strict";
import { cp, copyFile, mkdir, readFile, readdir, realpath, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const digest = (value) => createHash("sha256").update(value).digest("hex");

// 修改仅发生在本次消费测试拥有的副本，不写作者 checkout 或 caps 的共享缓存。
export async function verifyFileRecompile({ source, resolvedModule, temporary, run }) {
  const project = join(temporary, "ffi-recompile");
  const modules = join(project, ".calcit/modules");
  const library = join(modules, "quamolit");
  await mkdir(modules, { recursive: true });
  await cp(resolvedModule, library, {
    recursive: true,
    filter: (path) => !path.split(/[\\/]/).includes(".git"),
  });
  for (const entry of await readdir(join(source, ".calcit/modules"))) {
    if (entry === "quamolit") continue;
    await symlink(await realpath(join(source, ".calcit/modules", entry)), join(modules, entry));
  }
  for (const name of ["calcit.cirru", "deps.cirru"]) await copyFile(join(source, name), join(project, name));
  await symlink(join(source, "node_modules"), join(project, "node_modules"));
  assert.notEqual(await realpath(library), await realpath(resolvedModule));

  const fragment = "src/host/canvas-rect-batches.mjs";
  const originalHost = await readFile(join(resolvedModule, fragment), "utf8");
  const snapshotBefore = digest(await readFile(join(project, "calcit.cirru")));
  const libraryBefore = digest(await readFile(join(library, "calcit.cirru")));
  const compile = () => run("calcit", ["--emit-path", "target/js/app/", "js"], project);
  const generated = join(project, "target/js/app/quamolit.canvas-reference.mjs");

  // 每次在新 Node 进程加载产物，排除 ESM 缓存导致的假阴性。
  const execute = (expectChanged) => {
    const appUrl = pathToFileURL(join(project, "target/js/app/app.main.mjs")).href;
    const coreUrl = pathToFileURL(join(project, "target/js/app/calcit.core.mjs")).href;
    const code = `
      import assert from "node:assert/strict";
      import * as app from ${JSON.stringify(appUrl)};
      import {to_js_data as plain} from ${JSON.stringify(coreUrl)};
      const context = {calls:0, save(){}, restore(){}, fillRect(){this.calls++}};
      const draw = () => app.draw_instances_$x_(context, new Float32Array(20000));
      if (${JSON.stringify(expectChanged)}) {
        assert.throws(draw, /quamolit-file-recompile-control/);
        assert.equal(context.calls, 0);
      } else {
        assert.equal(plain(draw())["canvas-calls"], 10000);
        assert.equal(context.calls, 10000);
      }
    `;
    run(process.execPath, ["--input-type=module", "--eval", code], project);
  };

  compile();
  execute(false);
  const before = digest(await readFile(generated));
  const needle = "context.fillRect(positions[index * 2]";
  assert.equal(originalHost.split(needle).length, 2, "变更点须唯一且仍是实际 Canvas 提交");
  await writeFile(
    join(library, fragment),
    originalHost.replace(needle, `throw new Error("quamolit-file-recompile-control"); ${needle}`),
  );
  const changedHost = digest(await readFile(join(library, fragment)));
  assert.notEqual(changedHost, digest(originalHost));
  assert.equal(digest(await readFile(generated)), before, "只改片段不应悄悄改写现有产物");
  execute(false); // 负例：没有显式重编译，新 JS 行为不能已生效。
  compile();
  const after = digest(await readFile(generated));
  assert.notEqual(after, before, "显式重编译必须重读 :file，而不是复用旧片段");
  execute(true); // 正例：必须经消费者公共 Calcit 调用观察到新行为。
  assert.equal(digest(await readFile(join(project, "calcit.cirru"))), snapshotBefore);
  assert.equal(digest(await readFile(join(library, "calcit.cirru"))), libraryBefore);
  assert.equal(await readFile(join(resolvedModule, fragment), "utf8"), originalHost, "共享候选缓存必须未被修改");
  return {
    result: "PASS",
    scope: ":file 单函数片段；不声称 watch 或 inline 更新已验证",
    baselineCanvasCalls: 10000,
    unchangedWithoutCompile: true,
    changedAfterCompile: true,
    consumerSnapshotUnchanged: true,
    librarySnapshotUnchanged: true,
    sharedCacheUnchanged: true,
    generatedBefore: before,
    generatedAfter: after,
    fragmentBefore: digest(originalHost),
    fragmentAfter: changedHost,
  };
}
