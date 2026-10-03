import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(await readFile(join(root, "demos/catalog.json"), "utf8"));
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
