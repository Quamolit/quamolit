// 只读 Snapshot 的显式 schema/类型声明；不把函数体搜索误称为类型审计。
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expandManifest, parseNamespaces, verifyCoverage, query, queryJson } from "./api-inventory.mjs";

export function parseDefinitions(output) {
  const header = output.match(/^Definitions: (\d+)$/m);
  assert.ok(header, "缺少定义计数，不能把查询失败算作空 namespace");
  const names = [...output.matchAll(/^  (\S+)(?: \[schema\])?(?: - .*?)?$/gm)].map((match) => match[1]);
  assert.equal(names.length, Number(header[1]));
  assert.equal(new Set(names).size, names.length);
  return names;
}
export function inspectTypeBoundary(data) {
  assert.ok(data && typeof data.id === "string", "缺少定义身份");
  const missingSchema = data.schema == null;
  const findings = [];
  function scan(value, path) {
    if (typeof value === "string") {
      for (const kind of ["Dynamic", "JsObject"]) {
        if (new RegExp(`(?:^|[^A-Za-z0-9_])${kind}(?=$|[^A-Za-z0-9_])`).test(value)) {
          findings.push({ kind, path, token: value });
        }
      }
    } else if (Array.isArray(value)) value.forEach((child, index) => scan(child, `${path}/${index}`));
    else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) scan(child, `${path}/${key}`);
    }
  }
  if (!missingSchema) scan(data.schema, "schema");
  // 类型/trait schema 可能只是标签，字段和方法签名在声明内；不扫描普通函数体/文档。
  if (typeof data.schema === "string" && /(?:StructDef|EnumDef|TypeDef|Trait)$/.test(data.schema)) {
    assert.ok(Array.isArray(data.code), `类型声明缺少字段: ${data.id}`);
    scan(data.code.slice(2), "declaration");
  }
  return { id: data.id, missingSchema, findings };
}
export function summarizeBoundaries(entries) {
  const summary = {};
  for (const status of ["stable", "experimental", "legacy", "internal"]) {
    const selected = entries.filter((entry) => entry.status === status);
    summary[status] = {
      definitions: selected.length,
      missingSchema: selected.filter((entry) => entry.missingSchema).length,
      dynamicDefinitions: selected.filter((entry) => entry.findings.some((finding) => finding.kind === "Dynamic"))
        .length,
      jsObjectDefinitions: selected.filter((entry) => entry.findings.some((finding) => finding.kind === "JsObject"))
        .length,
    };
  }
  return summary;
}
export function verifyStableTypeBoundaries(entries, stableTypes) {
  for (const id of stableTypes)
    assert.ok(
      entries.some((entry) => entry.id === id),
      `缺少稳定引用类型: ${id}`,
    );
  assert.deepEqual(
    entries.filter(
      (entry) =>
        (entry.status === "stable" || stableTypes.includes(entry.id)) && (entry.missingSchema || entry.findings.length),
    ),
    [],
    "稳定 namespace 或引用类型存在未声明或开放类型边界",
  );
}
export async function main(args = process.argv.slice(2)) {
  assert.equal(args.length, 0, "不支持隐式缩小扫描范围");
  const root = fileURLToPath(new URL("../", import.meta.url));
  const source = await readFile(resolve(root, "calcit.cirru"));
  const manifestBytes = await readFile(resolve(root, "docs/api-namespaces.json"));
  const manifest = JSON.parse(manifestBytes);
  // 复用完整清单/稳定合同门禁的工具链验证。
  const { execFileSync } = await import("node:child_process");
  assert.equal(
    execFileSync(process.env.CALCIT_BIN ?? "calcit", ["--version"], { encoding: "utf8" }).trim(),
    manifest.calcitVersion,
  );
  const rows = expandManifest(manifest);
  verifyCoverage(rows, parseNamespaces(query(["ns"], root)));
  const entries = [];
  for (const row of rows) {
    for (const name of parseDefinitions(query(["defs", row.namespace], root))) {
      const id = `${row.namespace}/${name}`;
      const data = queryJson(["def", id, "--format", "json"], root);
      assert.equal(data.id, id);
      entries.push({ ...inspectTypeBoundary(data), status: row.status });
    }
    console.log(`类型盘点: ${row.namespace}`);
  }
  const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
  assert.equal(digest(await readFile(resolve(root, "calcit.cirru"))), digest(source), "盘点期间源码变化，报告不可采纳");
  assert.equal(
    digest(await readFile(resolve(root, "docs/api-namespaces.json"))),
    digest(manifestBytes),
    "盘点期间分类变化，报告不可采纳",
  );
  const report = {
    schemaVersion: 1,
    calcitVersion: manifest.calcitVersion,
    sourceSha256: digest(source),
    manifestSha256: digest(manifestBytes),
    scope: "全部项目定义的显式 schema 及 Struct/Enum/Type/Trait 声明；不含推断类型、函数体、外部依赖或语义上的句柄传播",
    namespaces: rows.length,
    definitions: entries.length,
    summary: summarizeBoundaries(entries),
    entries,
  };
  const output = resolve(root, "test-results/api-types");
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`完整审计产物: ${output}/report.json（不入库）`);
  verifyStableTypeBoundaries(entries, manifest.stableTypes);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
