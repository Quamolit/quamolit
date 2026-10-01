import { test } from "node:test";
import assert from "node:assert/strict";
import {
  expandManifest,
  parseNamespaces,
  verifyCoverage,
  renderInventory,
  consumerViolations,
  verifyStableContract,
  signatureEntry,
  verifyTypeCoverage,
} from "../scripts/api-inventory.mjs";

const manifest = () => ({
  schemaVersion: 1,
  groups: [
    {
      status: "internal",
      purpose: "测试",
      doc: "test/README.md",
      replacement: null,
      namespaces: ["quamolit.test.demo"],
    },
  ],
  entries: [
    {
      namespace: "quamolit.ui-motion",
      status: "stable",
      purpose: "UI",
      doc: "docs/ui-motion-components.md",
      replacement: null,
    },
  ],
});

test("稳定签名引用的项目类型必须冻结完整声明，包含嵌套依赖", () => {
  const contract = {
    namespaces: { "quamolit.ui-motion": { make: { schema: ["'quamolit.motion/A"] } } },
    types: {
      "quamolit.motion/A": { schema: "'StructDef", declaration: ["defstruct", "A", [":value", "'quamolit.motion/B"]] },
      "quamolit.motion/B": { schema: "'EnumDef", declaration: ["defenum", "B", [":linear"]] },
    },
  };
  verifyTypeCoverage(contract);
  const missing = structuredClone(contract);
  delete missing.types["quamolit.motion/B"];
  assert.throws(() => verifyTypeCoverage(missing), /缺少引用类型声明/);
  const labelOnly = structuredClone(contract);
  delete labelOnly.types["quamolit.motion/A"].declaration;
  assert.throws(() => verifyTypeCoverage(labelOnly), /不能仅冻结名称/);
});

test("Struct/Enum 不能仅保存 StructDef/EnumDef 标签而遗漏字段", () => {
  const a = signatureEntry({ id: "x/A", schema: "'StructDef", code: ["defstruct", "A", [":x", "Number"]] });
  const b = signatureEntry({ id: "x/A", schema: "'StructDef", code: ["defstruct", "A", [":x", "String"]] });
  assert.throws(() => verifyStableContract(a, b));
  assert.throws(() => signatureEntry({ id: "x/A", schema: "'EnumDef" }));
});
test("显式清单覆盖全部 namespace，不自动接受新的 test/examples", () => {
  const rows = expandManifest(manifest());
  verifyCoverage(rows, ["quamolit.ui-motion", "quamolit.test.demo"]);
  assert.throws(() => verifyCoverage(rows, ["quamolit.ui-motion", "quamolit.test.demo", "quamolit.examples.new"]));
  assert.throws(() => verifyCoverage(rows, ["quamolit.ui-motion"]));
});
test("重复分类、未知状态和缺失迁移去向必须拒绝", () => {
  for (const mutate of [
    (m) => m.entries.push({ ...m.entries[0] }),
    (m) => {
      m.entries[0].status = "ready";
    },
    (m) => {
      m.entries[0].status = "legacy";
    },
  ]) {
    const m = manifest();
    mutate(m);
    assert.throws(() => expandManifest(m));
  }
});
test("Calcit 输出计数与格式不符不能被当作空清单通过", () => {
  assert.deepEqual(parseNamespaces("Project namespaces: (1 namespaces)\n  quamolit.ui-motion\n"), [
    "quamolit.ui-motion",
  ]);
  assert.throws(() => parseNamespaces(""));
  assert.throws(() => parseNamespaces("Project namespaces: (2 namespaces)\n  quamolit.ui-motion\n"));
});
test("生成的每行包含状态、用途、替代和真实文档入口", () => {
  const output = renderInventory(expandManifest(manifest()));
  assert.match(output, /稳定（alpha 合同）/);
  assert.match(output, /内部/);
  assert.match(output, /\.\.\/docs\/ui-motion-components\.md/);
});
test("消费者的 as/refer 导入都会审计，不放行内部或未分类入口", () => {
  const rows = expandManifest(manifest());
  assert.deepEqual(consumerViolations(rows, "NS declaration:\nns app.main $ :require (quamolit.ui-motion :as ui)"), []);
  assert.deepEqual(
    consumerViolations(
      rows,
      "NS declaration:\nns app.main $ :require (quamolit.test.demo :refer helper) (quamolit.new :as x)",
    ),
    [
      { namespace: "quamolit.test.demo", status: "internal" },
      { namespace: "quamolit.new", status: "unclassified" },
    ],
  );
  assert.throws(() => consumerViolations(rows, "NS declaration:\nns app.main"));
});
test("稳定定义新增、删除或参数/返回类型改变均须审查", () => {
  const contract = { namespaces: { "quamolit.ui-motion": { tween: { args: ["Number"], return: "Number" } } } };
  verifyStableContract(contract, structuredClone(contract));
  for (const mutate of [
    (c) => {
      c.namespaces["quamolit.ui-motion"].tween.return = "String";
    },
    (c) => {
      c.namespaces["quamolit.ui-motion"].tween.args.push("Number");
    },
    (c) => {
      delete c.namespaces["quamolit.ui-motion"].tween;
    },
    (c) => {
      c.namespaces["quamolit.ui-motion"].new = {};
    },
  ]) {
    const changed = structuredClone(contract);
    mutate(changed);
    assert.throws(() => verifyStableContract(contract, changed));
  }
});
