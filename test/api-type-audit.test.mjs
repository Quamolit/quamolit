import { test } from "node:test";
import assert from "node:assert/strict";
import {
  inspectTypeBoundary,
  parseDefinitions,
  summarizeBoundaries,
  verifyStableTypeBoundaries,
} from "../scripts/api-type-audit.mjs";

test("稳定入口及引用类型都拒绝开放边界；缺少引用类型也不能通过", () => {
  const entry = { ...inspectTypeBoundary({ id: "x/A", schema: "'Dynamic" }), status: "experimental" };
  verifyStableTypeBoundaries([entry], []);
  assert.throws(() => verifyStableTypeBoundaries([{ ...entry, status: "stable" }], []));
  assert.throws(() => verifyStableTypeBoundaries([entry], ["x/A"]));
  assert.throws(() => verifyStableTypeBoundaries([], ["x/A"]));
  assert.throws(() =>
    verifyStableTypeBoundaries([{ id: "x/f", status: "stable", missingSchema: true, findings: [] }], []),
  );
});

test("定义查询计数和格式变化必须失败，不能漏掉无 schema 定义", () => {
  assert.deepEqual(parseDefinitions("Definitions: 2\n  *state\n  draw! [schema] - 宿主\n"), ["*state", "draw!"]);
  assert.throws(() => parseDefinitions("Definitions: 2\n  only-one\n"));
  assert.throws(() => parseDefinitions(""));
});
test("扫描嵌套参数/返回类型，但函数体和文档中的同名词不算类型边界", () => {
  const result = inspectTypeBoundary({
    id: "quamolit.host/draw!",
    schema: { args: [["List", "'JsObject"]], return: "'Dynamic" },
    code: ["defn", "draw!", ["x"], "Dynamic"],
    doc: "JsObject",
  });
  assert.equal(result.findings.length, 2);
  assert.deepEqual(
    result.findings.map((finding) => finding.path),
    ["schema/args/0/1", "schema/return"],
  );
  assert.equal(
    inspectTypeBoundary({ id: "x/f", schema: "'Number", code: ["JsObject"], doc: "Dynamic" }).findings.length,
    0,
  );
});
test("Struct/Enum 标签后面的字段也须扫描，无 schema 必须单列未知", () => {
  const data = { id: "x/A", schema: "'StructDef", code: ["defstruct", "A", [":handle", "'JsObject"]] };
  assert.equal(inspectTypeBoundary(data).findings[0].kind, "JsObject");
  assert.throws(() => inspectTypeBoundary({ id: "x/A", schema: "'EnumDef" }));
  assert.equal(inspectTypeBoundary({ id: "x/f", code: ["defn"] }).missingSchema, true);
});
test("统计定义数而非类型 token 数，不把实验开放边界算稳定通过", () => {
  const row = inspectTypeBoundary({ id: "x/f", schema: ["'Dynamic", "'Dynamic", "'JsObject"] });
  const summary = summarizeBoundaries([
    { ...row, status: "experimental" },
    { id: "x/g", status: "internal", missingSchema: true, findings: [] },
  ]);
  assert.deepEqual(summary.experimental, {
    definitions: 1,
    missingSchema: 0,
    dynamicDefinitions: 1,
    jsObjectDefinitions: 1,
  });
  assert.equal(summary.internal.missingSchema, 1);
  assert.equal(summary.stable.definitions, 0);
});
