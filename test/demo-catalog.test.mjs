import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(await readFile(join(root, "demos/catalog.json"), "utf8"));
const scripts = JSON.parse(await readFile(join(root, "package.json"), "utf8")).scripts;
const config = JSON.parse(
  execFileSync("calcit", ["config", "show", "--format", "json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
).data;
const entryNamespaces = Object.fromEntries([
  ...[
    "layer-composition",
    "todolist",
    "binary-tree",
    "clock",
    "curve",
    "tidal-bloom",
    "signal-weave",
    "cohort-pulse",
    "layered-dashboard",
    "solar",
    "icons",
    "raining",
    "finder",
    "table",
    "drag-demo",
    "folding-fan",
  ].map((name) => [name, `quamolit.examples.${name}`]),
  ...[
    "gpu-component",
    "retained-component",
    "scene-pointer-browser",
    "motion",
    "playback",
    "component",
    "cpu-motion",
    "replay-archive",
  ].map((name) => [name, `quamolit.test.${name}-fixture`]),
  ["fade", "quamolit.test.fade-migration-fixture"],
  ["visual", "quamolit.test.frame-fixture"],
  ["bootstrap", "quamolit.bootstrap"],
]);
const defaultEntry = {
  name: "default",
  mode: "js",
  target: "browser",
  init_fn: "quamolit.bootstrap/main!",
  reload_fn: "quamolit.bootstrap/reload!",
  description: "",
  modules: ["pointed-prompt/", "touch-control/", "js-ffi/"],
  type_slots: {},
  feature_policy: {},
};
function verifyNamedEntries(configuration, commands) {
  const names = Object.keys(entryNamespaces);
  assert.deepEqual(configuration.entries.map((entry) => entry.name).sort(), ["default", ...names].sort());
  assert.deepEqual(
    configuration.entries.find((entry) => entry.name === "default"),
    defaultEntry,
  );
  const compilations = Object.entries(commands).filter(
    ([name, command]) => name.startsWith("compile:") && /\bcalcit\b/.test(command),
  );
  assert.deepEqual(compilations.map(([name]) => name.slice("compile:".length)).sort(), names.sort());
  for (const [name, namespace] of Object.entries(entryNamespaces)) {
    const entry = configuration.entries.find((entry) => entry.name === name);
    assert.equal(entry.init_fn, `${namespace}/main!`, `${name}: init`);
    // 原命令未覆盖 reload 的两个入口保持 default；不是顺手修正热重载的切片。
    const reloadNamespace = ["layer-composition", "scene-pointer-browser"].includes(name)
      ? "quamolit.bootstrap"
      : namespace;
    assert.equal(entry.reload_fn, `${reloadNamespace}/reload!`, `${name}: reload`);
    for (const key of ["mode", "target", "modules", "type_slots", "feature_policy"])
      assert.deepEqual(entry[key], defaultEntry[key], `${name}: ${key}`);
    assert.ok(entry.description, `${name}: description`);
    const destination = { bootstrap: "app", "cpu-motion": "cpu", "replay-archive": "replay" }[name] ?? name;
    const command = commands[`compile:${name}`];
    assert.match(
      command,
      /^(?:mkdir -p target\/js\/[\w/-]+ && )?calcit --entry [\w-]+ --emit-path target\/js\/[\w-]+\/ calcit\.cirru js$/,
    );
    assert.ok(command.endsWith(`calcit --entry ${name} --emit-path target/js/${destination}/ calcit.cirru js`));
  }
}
test("27 个命名 entry 对应原编译上下文，default 与独立消费者边界不变", () => {
  verifyNamedEntries(config, scripts);
  assert.equal(scripts["compile:consumer"], undefined, "独立安装消费者不并入主 Snapshot");
});
test("entry 缺失、重复、错用函数或权限、脚本覆盖与输出漂移必须失败", () => {
  const mutations = [
    (c) =>
      c.entries.splice(
        c.entries.findIndex((entry) => entry.name === "todolist"),
        1,
      ),
    (c) => c.entries.push(structuredClone(c.entries[0])),
    (c) => c.entries.push({ ...c.entries[0], name: "orphan" }),
    (c) => {
      c.entries.find((entry) => entry.name === "default").init_fn = "quamolit.examples.todolist/main!";
    },
    (c) => {
      c.entries.find((entry) => entry.name === "todolist").init_fn = "quamolit.bootstrap/main!";
    },
    (c) => {
      c.entries.find((entry) => entry.name === "layer-composition").reload_fn =
        "quamolit.examples.layer-composition/reload!";
    },
    ...Object.entries({
      mode: "eval",
      target: "node",
      modules: [],
      type_slots: { Extra: "quamolit.motion/Vec2" },
      feature_policy: { "js-ffi": "allow" },
    }).map(([key, value]) => (c) => {
      c.entries.find((entry) => entry.name === "motion")[key] = value;
    }),
    (_, s) => {
      s["compile:motion"] += " --init-fn quamolit.bootstrap/main!";
    },
    (_, s) => {
      s["compile:cpu-motion"] = s["compile:cpu-motion"].replace("target/js/cpu/", "target/js/cpu-motion/");
    },
    (_, s) => {
      delete s["compile:visual"];
    },
  ];
  for (const mutate of mutations) {
    const configuration = structuredClone(config),
      commands = { ...scripts };
    mutate(configuration, commands);
    assert.throws(() => verifyNamedEntries(configuration, commands));
  }
});
function isArtifactDirectory(name) {
  return (
    ["node_modules", "target", ".calcit", ".yarn", "test-results", "dist", "dist-demos"].includes(name) ||
    /^playwright-report(?:-|$)/.test(name)
  );
}
async function htmlFiles(dir) {
  const files = [];
  for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
    if (isArtifactDirectory(entry.name)) continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}
test("目录扫描排除测试报告，不排除普通演示目录", () => {
  for (const name of ["playwright-report", "playwright-report-motion", "playwright-report-gpu", "test-results"])
    assert.equal(isArtifactDirectory(name), true);
  for (const name of ["m0", "retained-consumer", "new-demo"]) assert.equal(isArtifactDirectory(name), false);
});
test("原有 11 项不可遗漏或以占位冒充可运行", async () => {
  const originals = [...catalog.planned, ...catalog.entries.filter((e) => e.group === "originals")];
  assert.deepEqual(
    originals.map((e) => e.id).sort(),
    [
      "todolist",
      "clock",
      "solar",
      "binary-tree",
      "table",
      "finder",
      "raining",
      "icons",
      "curve",
      "folding-fan",
      "drag-demo",
    ].sort(),
  );
  for (const entry of catalog.planned) {
    assert.ok(entry.title && entry.summary && entry.group === "originals");
    assert.equal(entry.path, undefined);
    assert.equal(entry.compile, undefined);
  }
  await access(join(root, "docs/demo-restoration.md"));
  assert.ok(catalog.entries.some((entry) => entry.group === "art" && entry.id === "tidal-bloom"));
});
test("所有演示页面已登记，路径、说明和编译入口存在", async () => {
  const pages = ["index.html", ...(await htmlFiles("test")), ...(await htmlFiles("examples"))].sort();
  assert.deepEqual(
    catalog.entries.map((entry) => entry.path).sort(),
    pages,
    "新增页面必须登记，禁止孤立 demo 或重复入口",
  );
  const scripts = JSON.parse(await readFile(join(root, "package.json"), "utf8")).scripts;
  assert.equal(new Set(catalog.groups.map((group) => group.id)).size, catalog.groups.length);
  for (const entry of catalog.entries) {
    assert.ok(catalog.groups.some((group) => group.id === entry.group));
    assert.ok(entry.title && entry.summary && entry.status);
    assert.match(entry.path, /^(?:index\.html|(?:test|examples)\/[\w/-]+\.html)$/);
    await access(join(root, entry.docs));
    assert.ok(!entry.compile || entry.compile === "consumer" || scripts[entry.compile]);
    assert.ok(!["compile", "compile:demos"].includes(entry.compile), "清单不能递归调用完整编译");
    const html = await readFile(join(root, entry.path), "utf8");
    assert.match(html, /aria-label="演示导航"/);
    if (!entry.path.startsWith("examples/")) {
      const back = html.match(/<nav aria-label="演示导航"[^>]*><a href="([^"]+)"/)[1];
      assert.equal(new URL(back, `https://example.com/preview/${entry.path}`).pathname, "/preview/demos/index.html");
    }
  }
});

test("普通 compile/release 构建统一应用，bootstrap 只提供 smoke core", async () => {
  const { scripts } = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  assert.match(scripts.compile, /caps --ci.*scripts\/prepare-demos\.mjs/);
  assert.equal(scripts["compile:demos"], "yarn compile");
  assert.match(scripts["compile:bootstrap"], /target\/js\/app/);
  assert.match(scripts["test:demo-nav"], /yarn compile && yarn release/);
  const prepare = await readFile(join(root, "scripts/prepare-demos.mjs"), "utf8");
  assert.match(prepare, /run\(\["compile:bootstrap"\]\)/);
  assert.doesNotMatch(prepare, /run\(\["compile"\]\)/);
  const config = (await import("../vite.config.mjs")).default;
  assert.equal(config.build.outDir, "dist");
  for (const path of ["index.html", "demos/index.html", "examples/todolist/index.html"])
    assert.ok(config.build.rolldownOptions.input.includes(join(root, path)));
  const server = await readFile(join(root, "test/demo-nav-server.mjs"), "utf8");
  assert.match(server, /resolve\("dist"\)/);
  const main = await readFile(join(root, "main.mjs"), "utf8");
  assert.doesNotMatch(main, /import|target\/js|quamolit\.bootstrap/);
  assert.match(main, /location\.replace\(destination\)/);
});
