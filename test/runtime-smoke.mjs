import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { _$n__$M_ as map } from "@calcit/procs";
import { vals } from "../target/js/app/calcit.core.mjs";

const root = path.resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const expectedVersion = packageJson.dependencies["@calcit/procs"];
const declaredCalcitVersion = readFileSync(path.join(root, "deps.cirru"), "utf8").match(
  /:calcit-version \|([^\s)]+)/,
)?.[1];
const declaredJsFfiVersion = readFileSync(path.join(root, "deps.cirru"), "utf8").match(
  /\|calcit-lang\/js-ffi \|([^\s)]+)/,
)?.[1];
const jsFfiTag = packageJson.dependencies["@calcit/js-ffi"].match(/#tag=([^\s]+)$/)?.[1];
const installedJsFfi = JSON.parse(
  readFileSync(path.join(root, "node_modules/@calcit/js-ffi/package.json"), "utf8"),
).version;
const installedCalcitJsFfi = readFileSync(path.join(root, ".calcit/modules/js-ffi/deps.cirru"), "utf8").match(
  /:version \|([^\s)]+)/,
)?.[1];
const consumerPackageJson = JSON.parse(
  readFileSync(path.join(root, "examples/retained-consumer/package.json"), "utf8"),
);
const consumerCalcitVersion = readFileSync(path.join(root, "examples/retained-consumer/deps.cirru"), "utf8").match(
  /:calcit-version \|([^\s)]+)/,
)?.[1];
const installedRuntime = JSON.parse(
  readFileSync(path.join(root, "node_modules/@calcit/procs/package.json"), "utf8"),
).version;
const requireFromJsFfi = createRequire(path.join(root, "node_modules/@calcit/js-ffi/package.json"));
const jsFfiRuntime = JSON.parse(readFileSync(requireFromJsFfi.resolve("@calcit/procs/package.json"), "utf8")).version;
const cliVersion = execFileSync("calcit", ["--version"], { encoding: "utf8" }).trim();

assert.equal(declaredCalcitVersion, expectedVersion, "deps.cirru 必须与根 JS runtime 对齐");
assert.equal(consumerCalcitVersion, expectedVersion, "独立消费者的 Calcit CLI 必须与主项目对齐");
assert.equal(
  consumerPackageJson.dependencies["@calcit/procs"],
  expectedVersion,
  "独立消费者的 JS runtime 必须与主项目对齐",
);
assert.equal(installedRuntime, expectedVersion, "根 JS runtime 安装版本必须与声明对齐");
assert.equal(jsFfiRuntime, expectedVersion, "js-ffi 必须解析到统一 JS runtime");
assert.equal(cliVersion, expectedVersion, "执行测试的 Calcit CLI 必须与项目声明对齐");
assert.ok(declaredJsFfiVersion, "必须声明 js-ffi 模块版本");
assert.equal(jsFfiTag, declaredJsFfiVersion, "npm 与 Calcit js-ffi 必须引用同一发布 tag");
assert.equal(installedJsFfi, declaredJsFfiVersion, "实际 npm js-ffi 必须与声明匹配");
assert.equal(installedCalcitJsFfi, declaredJsFfiVersion, "实际 Calcit js-ffi 模块必须与声明匹配");

// Exercise generated core against the matching JS runtime, not just codegen.
const values = vals(map("first", 1, "second", 1));
assert.equal(values.toString(), "(#{} 1)");

console.log(`Calcit CLI/runtime aligned at ${expectedVersion}`);
