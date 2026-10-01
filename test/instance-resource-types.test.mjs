import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const bin = process.env.CALCIT_BIN ?? "calcit";
test("真实 Calcit 预处理拒绝非实例表句柄和普通 List 位置数据", async () => {
  const scratch = await mkdtemp(join(tmpdir(), "quamolit-instance-types-"));
  try {
    await copyFile(join(root, "calcit.cirru"), join(scratch, "calcit.cirru"));
    await copyFile(join(root, "deps.cirru"), join(scratch, "deps.cirru"));
    await mkdir(join(scratch, ".calcit"));
    await symlink(join(root, ".calcit/modules"), join(scratch, ".calcit/modules"));
    const fn = (args, ret) => [
      "::",
      ":fn",
      ["{}", [":args", ["[]", ...args]], [":return", ret], [":features", ["#{}", ":js-ffi"]]],
    ];
    const ns = "quamolit.test.invalid-instance-types";
    const cases = [
      ["numeric-table", [], "'Number", ["quamolit.instance-resource/live-count", "1"]],
      [
        "gpu-is-not-table",
        ["'quamolit.webgpu-batches/RectBatchHost"],
        "'Number",
        ["quamolit.instance-resource/live-count", "gpu"],
      ],
      [
        "list-is-not-floats",
        [],
        "'js-ffi.typed-arrays/Float32ArrayHost",
        [
          "let",
          [
            ["table", ["quamolit.instance-resource/create-table!"]],
            ["source", ["quamolit.scene-ir/InstanceSource", ":id", "|bad", ":version", "1", ":count", "1"]],
          ],
          ["quamolit.instance-resource/register!", "table", "source", ["[]", "1", "2"]],
        ],
      ],
    ];
    const ops = [["edit", "add-ns", ns]];
    for (const [name, args, ret, body] of cases) {
      const id = `${ns}/${name}`;
      ops.push([
        "edit",
        "def",
        id,
        "--input-format",
        "json-ast",
        "--code",
        JSON.stringify(["defn", name, name === "gpu-is-not-table" ? ["gpu"] : [], body]),
      ]);
      ops.push(["edit", "schema", id, "--input-format", "json-ast", "--code", JSON.stringify(fn(args, ret))]);
    }
    const options = {
      cwd: scratch,
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 8 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    };
    const command = ["edit", "transaction", "--code", JSON.stringify(ops), "--format", "json"];
    const dry = JSON.parse(execFileSync(bin, [...command, "--dry-run"], options));
    execFileSync(bin, [...command, "--expect-revision", dry.original_revision], options);
    const result = spawnSync(bin, ["analyze", "check-public", "--ns", ns], options);
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0, "非法类型不能编译通过");
    const output = result.stdout + result.stderr;
    assert.match(output, /coverage: 3\/3 definitions checked/);
    assert.match(output, /source definitions passed: 0/);
    for (const [name] of cases) assert.match(output, new RegExp(`\\[warning\\].*${name}`), `必须逐定义拒绝 ${name}`);
    assert.match(output, /expects type.*InstanceTableHost/);
    assert.match(output, /expects type.*Float32ArrayHost/);
    assert.match(output, /Function .*live-count.*arg 1/);
    assert.match(output, /Function .*register!.*arg 3/);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});
