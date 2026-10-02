// 只通过 Calcit 查询读取 Snapshot；生成清单/合同不修改 calcit.cirru。
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, access, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const statuses = {
  stable: "稳定（alpha 合同）",
  experimental: "实验",
  legacy: "旧（迁移中）",
  internal: "内部",
};
export function expandManifest(manifest) {
  assert.equal(manifest.schemaVersion, 1);
  const rows = [...manifest.entries];
  for (const { namespaces, ...metadata } of manifest.groups) {
    assert.ok(Array.isArray(namespaces) && namespaces.length > 0);
    rows.push(...namespaces.map((namespace) => ({ namespace, ...metadata })));
  }
  const seen = new Set();
  for (const row of rows) {
    assert.match(row.namespace, /^quamolit\.[\w.$-]+$/);
    assert.ok(!seen.has(row.namespace), `重复分类: ${row.namespace}`);
    seen.add(row.namespace);
    assert.ok(Object.hasOwn(statuses, row.status), `非法状态: ${row.namespace}`);
    assert.ok(typeof row.purpose === "string" && row.purpose.trim());
    assert.ok(typeof row.doc === "string" && row.doc.trim());
    assert.ok(row.replacement === null || (typeof row.replacement === "string" && row.replacement.trim()));
    if (row.status === "legacy") assert.ok(row.replacement, `旧入口缺迁移去向: ${row.namespace}`);
  }
  return rows.sort((a, b) => a.namespace.localeCompare(b.namespace, "en"));
}
export function parseNamespaces(output) {
  const header = output.match(/^Project namespaces: \((\d+) namespaces\)$/m);
  assert.ok(header, "Calcit 查询格式变化；不可把空输出算覆盖通过");
  const names = [...output.matchAll(/^  (quamolit\.[\w.$-]+)$/gm)].map((match) => match[1]);
  assert.equal(names.length, Number(header[1]));
  assert.equal(new Set(names).size, names.length);
  return names;
}
export function verifyCoverage(rows, names) {
  const actual = new Set(names),
    classified = new Set(rows.map((row) => row.namespace));
  const missing = names.filter((name) => !classified.has(name));
  const stale = [...classified].filter((name) => !actual.has(name));
  assert.deepEqual(missing, [], `新命名空间未分类: ${missing.join(", ")}`);
  assert.deepEqual(stale, [], `清单包含已移除命名空间: ${stale.join(", ")}`);
}
export function consumerViolations(rows, declaration) {
  assert.match(declaration, /NS declaration:/);
  const imports = [...declaration.matchAll(/\((quamolit\.[\w.$-]+)\s+:(?:as|refer|default)\b/g)].map(
    (match) => match[1],
  );
  assert.ok(imports.length, "消费者 import 未解析，不能报告稳定边界通过");
  const classified = new Map(rows.map((row) => [row.namespace, row.status]));
  return [...new Set(imports)]
    .filter((name) => classified.get(name) !== "stable")
    .map((namespace) => ({ namespace, status: classified.get(namespace) ?? "unclassified" }));
}
export function verifyStableContract(expected, actual) {
  assert.deepEqual(expected, actual, "稳定 API 签名/类型变更需单独审查、迁移说明及版本计划，不能自动接受");
}
export function verifyHostBoundary(source, name) {
  // 保守源码门禁：正式宿主不能依赖测试路径或任何本地编译产物。
  // 演示 glue 也不是生产依赖；实际闭包仍由 test:consumer 编译/搬移验证，不以文本扫描替代。
  assert.doesNotMatch(
    source,
    /\b(?:test\/|target\/js\/|examples\/|demos\/|quamolit\.(?:test|examples)\.)/,
    `宿主混入测试/演示/编译路径: ${name}`,
  );
}
export function readmeExamples(rows, contract, markdown) {
  const examples = [...markdown.matchAll(/^```cirru\s*\n([\s\S]*?)^```\s*$/gm)].map((match) => match[1]);
  assert.ok(examples.length, "README 缺少可执行的 Calcit 示例");
  const stable = new Set(rows.filter((row) => row.status === "stable").map((row) => row.namespace));
  for (const example of examples) {
    // 首页用全限定名，避免隐式 import/别名上下文；实际语法和调用交给 Calcit 验证。
    const references = [...example.matchAll(/\b(quamolit\.[\w.$-]+)(?:\/([\w!?$-]+))?/g)];
    assert.ok(references.length, "README 示例未引用任何公开 Calcit 定义");
    for (const [, namespace, name] of references) {
      assert.ok(stable.has(namespace), `README 示例引用非稳定入口: ${namespace}`);
      assert.ok(
        name && Object.hasOwn(contract.namespaces[namespace] ?? {}, name),
        `README 示例引用未冻结定义: ${namespace}/${name ?? ""}`,
      );
    }
  }
  return examples;
}
export function verifyTypeCoverage(contract) {
  const definitions = new Map(Object.entries(contract.types));
  for (const [namespace, entries] of Object.entries(contract.namespaces)) {
    for (const [name, entry] of Object.entries(entries)) definitions.set(`${namespace}/${name}`, entry);
  }
  const visit = (value) => {
    if (typeof value === "string" && /^'quamolit\.[\w.$-]+\/[\w!?$-]+$/.test(value)) {
      const id = value.slice(1);
      assert.ok(definitions.has(id), `稳定合同缺少引用类型声明: ${id}`);
      assert.ok(definitions.get(id).declaration, `稳定引用类型不能仅冻结名称: ${id}`);
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  // 同时检查外部类型的声明：嵌套类型也不能留在合同之外。
  for (const entry of definitions.values()) visit(entry);
}
export function renderInventory(rows) {
  const cell = (value) =>
    String(value ?? "—")
      .replaceAll("|", "\\|")
      .replaceAll("\n", " ");
  return [
    "<!-- api-inventory:start -->",
    `全部 ${rows.length} 个项目命名空间（包含旧应用、示例和测试）；分类由 \`docs/api-namespaces.json\` 显式维护，不按前缀自动批准新增命名空间。`,
    "",
    "| 命名空间 | 稳定性 | 用途 | 替代入口 | 文档/示例 |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| \`${row.namespace}\` | ${statuses[row.status]} | ${cell(row.purpose)} | ${cell(row.replacement)} | [说明](../${row.doc}) |`,
    ),
    "<!-- api-inventory:end -->",
  ].join("\n");
}
export function query(args, cwd) {
  return execFileSync(process.env.CALCIT_BIN ?? "calcit", ["query", ...args], {
    cwd,
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 8 * 1024 * 1024,
  });
}
export function queryJson(args, cwd) {
  const output = query(args, cwd);
  const start = output.search(/^\{/m);
  assert.ok(start >= 0, "缺少查询 JSON envelope");
  const result = JSON.parse(output.slice(start));
  assert.equal(result.schema_version, 1);
  assert.ok(result.data && !result.diagnostics.some((item) => item.severity === "error"));
  return result.data;
}
export function signatureEntry(data) {
  assert.ok(data.schema, `缺少稳定定义 schema: ${data.id}`);
  if (typeof data.schema === "string" && /(?:StructDef|EnumDef|TypeDef|Trait)$/.test(data.schema)) {
    assert.ok(Array.isArray(data.code), "类型声明不可丢失字段/枚举项");
    return { schema: data.schema, declaration: data.code };
  }
  return { schema: data.schema };
}
async function stableContract(rows, cwd, stableTypes) {
  const namespaces = {};
  for (const row of rows.filter((row) => row.status === "stable")) {
    const output = query(["defs", row.namespace], cwd);
    const count = output.match(/^Definitions: (\d+)$/m);
    assert.ok(count);
    const names = [...output.matchAll(/^  ([\w!?$-]+) \[schema\]/gm)].map((match) => match[1]);
    assert.equal(names.length, Number(count[1]), "稳定 namespace 的每个定义都需 schema");
    namespaces[row.namespace] = {};
    for (const name of names) {
      const data = queryJson(["def", `${row.namespace}/${name}`, "--format", "json"], cwd);
      namespaces[row.namespace][name] = signatureEntry(data);
    }
  }
  const types = {};
  for (const id of stableTypes) types[id] = signatureEntry(queryJson(["def", id, "--format", "json"], cwd));
  const contract = { schemaVersion: 1, namespaces, types };
  verifyTypeCoverage(contract);
  return contract;
}
export async function main(args = process.argv.slice(2)) {
  assert.ok(
    args.every((arg) => ["--write-doc", "--write-contract", "--audit-consumer"].includes(arg)),
    "未知参数",
  );
  const root = fileURLToPath(new URL("../", import.meta.url));
  for (const name of await readdir(resolve(root, "src/host"), { recursive: true })) {
    if (/\.(?:[cm]?js)$/.test(name)) verifyHostBoundary(await readFile(resolve(root, "src/host", name), "utf8"), name);
  }
  const manifest = JSON.parse(await readFile(resolve(root, "docs/api-namespaces.json"), "utf8"));
  const version = execFileSync(process.env.CALCIT_BIN ?? "calcit", ["--version"], { encoding: "utf8" }).trim();
  assert.equal(version, manifest.calcitVersion, "先对齐 Calcit 工具链，再更新查询门禁");
  const rows = expandManifest(manifest);
  verifyCoverage(rows, parseNamespaces(query(["ns"], root)));
  for (const row of rows) await access(resolve(root, row.doc));
  const docPath = resolve(root, "docs/api-contract.md");
  const document = await readFile(docPath, "utf8");
  const section = /<!-- api-inventory:start -->[\s\S]*?<!-- api-inventory:end -->/;
  assert.ok(section.test(document), "缺少文档清单边界");
  const rendered = renderInventory(rows);
  if (args.includes("--write-doc"))
    await writeFile(
      docPath,
      document.replace(section, () => rendered),
    );
  else assert.equal(document.match(section)[0], rendered, "命名空间表已漂移；运行 yarn update:api-inventory");
  const contract = await stableContract(rows, root, manifest.stableTypes);
  const contractPath = resolve(root, "docs/api-stable-contract.json");
  if (args.includes("--write-contract")) await writeFile(contractPath, JSON.stringify(contract, null, 2) + "\n");
  else verifyStableContract(JSON.parse(await readFile(contractPath, "utf8")), contract);
  const examples = readmeExamples(rows, contract, await readFile(resolve(root, "README.md"), "utf8"));
  for (const input of examples) {
    execFileSync(process.env.CALCIT_BIN ?? "calcit", ["eval", "--dep", "./calcit.cirru", "--stdin"], {
      cwd: root,
      input,
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
  }
  console.log(`README 稳定示例: ${examples.length} 个已执行`);
  console.log(`API 覆盖: ${rows.length}/${rows.length}; 稳定 namespace: ${Object.keys(contract.namespaces).length}`);
  if (args.includes("--audit-consumer")) {
    const violations = consumerViolations(rows, query(["ns", "app.main"], resolve(root, "examples/retained-consumer")));
    assert.deepEqual(violations, [], `独立消费者仍依赖非稳定入口: ${JSON.stringify(violations)}`);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
