import assert from "node:assert/strict";
import { cp, copyFile, mkdir, readFile, readdir, realpath, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const digest = (value) => createHash("sha256").update(value).digest("hex");

// 修改仅发生在本次消费测试拥有的副本，不写作者 checkout 或 caps 的共享缓存。
export async function verifyFfiRecompile({ source, resolvedModule, temporary, run }) {
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
  const execute = (expectChanged, expectInlineChanged = false) => {
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
      const released = [];
      const host = {
        disposed: false,
        context: {unconfigure(){released.push("context")}},
        vertices: {destroy(){released.push("vertices")}},
        params: {destroy(){released.push("params")}},
        motions: {destroy(){released.push("motions")}},
      };
      if (${JSON.stringify(expectInlineChanged)}) {
        assert.throws(() => app.dispose_gpu_$x_(host), /quamolit-inline-recompile-control/);
        assert.equal(host.disposed, false);
        assert.deepEqual(released, []);
      } else {
        app.dispose_gpu_$x_(host);
        app.dispose_gpu_$x_(host);
        assert.equal(host.disposed, true);
        assert.deepEqual(released, ["context", "vertices", "params", "motions"]);
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

  // 同一副本继续验证 inline。只通过 Calcit CLI 修改定义级 FFI 元数据，不文本改写 Snapshot。
  const target = "quamolit.gpu-component/raw-dispose!";
  const snapshot = join(library, "calcit.cirru");
  const json = (output) => {
    const offset = output.search(/^\{/m);
    assert.ok(offset >= 0, "Calcit CLI 缺少 JSON envelope");
    return JSON.parse(output.slice(offset));
  };
  const query = () => json(run("calcit", [snapshot, "query", "def", target, "--format", "json"], project)).data;
  const definition = query();
  assert.equal(definition.js_ffi.source_kind, "inline");
  const inline = definition.ffi[":js"][":inline"];
  assert.equal(inline.split("h=>{").length, 2, "inline 故障注入必须命中真实释放函数");
  const changedInline = inline.replace("h=>{", 'h=>{throw Error("quamolit-inline-recompile-control");');
  const metadata = `{} (:backend :js) (:target :browser)\n  :js $ {} $ :inline ${JSON.stringify("|" + changedInline)}`;
  const transaction = [
    snapshot,
    "edit",
    "transaction",
    "--code",
    JSON.stringify([["edit", "ffi", target, "--code", metadata]]),
    "--format",
    "json",
  ];
  const inlineGenerated = join(project, "target/js/app/quamolit.gpu-component.mjs");
  const inlineBefore = digest(await readFile(inlineGenerated));
  const preview = json(run("calcit", [...transaction, "--dry-run"], project));
  assert.equal(digest(await readFile(snapshot)), libraryBefore, "dry-run 不得修改库副本");
  run("calcit", [...transaction, "--expect-revision", preview.original_revision], project);
  const changed = query();
  assert.equal(changed.ffi[":js"][":inline"], changedInline);
  assert.deepEqual(changed.code, definition.code, "不能靠修改 Calcit 函数体触发新行为");
  assert.deepEqual(changed.schema, definition.schema);
  assert.notEqual(digest(await readFile(snapshot)), libraryBefore);
  assert.equal(digest(await readFile(inlineGenerated)), inlineBefore);
  execute(true, false); // inline 仅改元数据，已生成的旧释放函数仍执行且幂等。
  compile();
  const inlineAfter = digest(await readFile(inlineGenerated));
  assert.notEqual(inlineAfter, inlineBefore);
  execute(true, true); // 公共消费者调用观察到新 inline，释放前故障可见。
  assert.equal(digest(await readFile(join(project, "calcit.cirru"))), snapshotBefore);
  assert.equal(digest(await readFile(join(resolvedModule, "calcit.cirru"))), libraryBefore, "共享 Snapshot 不得改变");
  assert.equal(await readFile(join(resolvedModule, fragment), "utf8"), originalHost);
  return {
    result: "PASS",
    scope: ":file 与 :inline 显式重编译；不声称 watch/热更新已验证",
    consumerSnapshotUnchanged: true,
    sharedCacheUnchanged: true,
    file: {
      result: "PASS",
      baselineCanvasCalls: 10000,
      unchangedWithoutCompile: true,
      changedAfterCompile: true,
      librarySnapshotUnchanged: true,
      generatedBefore: before,
      generatedAfter: after,
      fragmentBefore: digest(originalHost),
      fragmentAfter: changedHost,
    },
    inline: {
      result: "PASS",
      target,
      baselineReleases: 4,
      unchangedWithoutCompile: true,
      changedAfterCompile: true,
      definitionBodyUnchanged: true,
      schemaUnchanged: true,
      generatedBefore: inlineBefore,
      generatedAfter: inlineAfter,
    },
  };
}
