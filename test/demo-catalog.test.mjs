import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(await readFile(join(root, "demos/catalog.json"), "utf8"));
async function htmlFiles(dir) {
  const files = [];
  for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
    if (["node_modules", "target", ".calcit", ".yarn"].includes(entry.name)) continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}
test("所有演示页面已登记，路径、说明和编译入口存在", async () => {
  const pages = ["index.html", ...await htmlFiles("test"), ...await htmlFiles("examples")].sort();
  assert.deepEqual(catalog.entries.map(entry => entry.path).sort(), pages, "新增页面必须登记，禁止孤立 demo 或重复入口");
  const scripts = JSON.parse(await readFile(join(root, "package.json"), "utf8")).scripts;
  assert.equal(new Set(catalog.groups.map(group => group.id)).size, catalog.groups.length);
  for (const entry of catalog.entries) {
    assert.ok(catalog.groups.some(group => group.id === entry.group));
    assert.ok(entry.title && entry.summary && entry.status);
    assert.match(entry.path, /^(?:index\.html|(?:test|examples)\/[\w/-]+\.html)$/);
    await access(join(root, entry.docs));
    assert.ok(!entry.compile || entry.compile === "consumer" || scripts[entry.compile]);
    const html = await readFile(join(root, entry.path), "utf8");
    assert.match(html, /aria-label="演示导航"/);
    if (!entry.path.startsWith("examples/")) {
      const back = html.match(/<nav aria-label="演示导航"[^>]*><a href="([^"]+)"/)[1];
      assert.equal(new URL(back, `https://example.com/preview/${entry.path}`).pathname, "/preview/demos/index.html");
    }
  }
});
