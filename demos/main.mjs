// 导航、DOM 和宿主生命周期在 JS；场景与绘制继续由 Calcit 定义。
import catalog from "./catalog.json";

const originals = catalog.entries.filter((entry) => entry.group === "originals");
const inlineEntries = [...originals, ...catalog.entries.filter((entry) => entry.group === "art")];
const loaders = {
  "layered-dashboard": [
    () => import("../examples/layered-dashboard/index.html?raw"),
    () => import("../examples/layered-dashboard/main.mjs"),
  ],
  "cohort-pulse": [
    () => import("../examples/cohort-pulse/index.html?raw"),
    () => import("../examples/cohort-pulse/main.mjs"),
  ],
  "signal-weave": [
    () => import("../examples/signal-weave/index.html?raw"),
    () => import("../examples/signal-weave/main.mjs"),
  ],
  "tidal-bloom": [
    () => import("../examples/tidal-bloom/index.html?raw"),
    () => import("../examples/tidal-bloom/main.mjs"),
  ],
  "folding-fan": [
    () => import("../examples/folding-fan/index.html?raw"),
    () => import("../examples/folding-fan/main.mjs"),
  ],
  "drag-demo": [() => import("../examples/drag-demo/index.html?raw"), () => import("../examples/drag-demo/main.mjs")],
  table: [() => import("../examples/table/index.html?raw"), () => import("../examples/table/main.mjs")],
  todolist: [() => import("../examples/todolist/index.html?raw"), () => import("../examples/todolist/main.mjs")],
  "binary-tree": [
    () => import("../examples/binary-tree/index.html?raw"),
    () => import("../examples/binary-tree/main.mjs"),
  ],
  clock: [() => import("../examples/clock/index.html?raw"), () => import("../examples/clock/main.mjs")],
  curve: [() => import("../examples/curve/index.html?raw"), () => import("../examples/curve/main.mjs")],
  solar: [() => import("../examples/solar/index.html?raw"), () => import("../examples/solar/main.mjs")],
  icons: [() => import("../examples/icons/index.html?raw"), () => import("../examples/icons/main.mjs")],
  raining: [() => import("../examples/raining/index.html?raw"), () => import("../examples/raining/main.mjs")],
  finder: [() => import("../examples/finder/index.html?raw"), () => import("../examples/finder/main.mjs")],
};
const app = document.querySelector("#app");
const canvas = document.querySelector("#scene");
const galleryView = document.querySelector("#gallery-view");
const demoView = document.querySelector("#demo-view");
const content = document.querySelector("#demo-content");
const gallery = document.querySelector("#gallery");
const search = document.querySelector("#search");
const select = document.querySelector("#group");
let activeId = null;
let dispose = null;
let routeQueue = Promise.resolve();

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  if (className) node.className = className;
  return node;
}
function route() {
  const id = new URLSearchParams(location.search).get("demo");
  return Object.hasOwn(loaders, id) ? id : null;
}
function galleryURL() {
  const params = new URLSearchParams();
  if (search.value.trim()) params.set("q", search.value);
  if (select.value) params.set("group", select.value);
  return `${location.pathname}${params.size ? `?${params}` : ""}`;
}
function demoURL(id) {
  return `${location.pathname}?demo=${encodeURIComponent(id)}`;
}
function renderGallery() {
  gallery.replaceChildren();
  const query = search.value.trim().toLocaleLowerCase();
  const entries = [
    ...catalog.entries,
    ...catalog.planned.map((entry) => ({
      ...entry,
      status: "待恢复",
      docs: "docs/demo-restoration.md",
      planned: true,
    })),
  ].filter(
    (entry) =>
      (!select.value || entry.group === select.value) &&
      [entry.title, entry.summary, entry.status].join(" ").toLocaleLowerCase().includes(query),
  );
  for (const group of catalog.groups) {
    const selected = entries.filter((entry) => entry.group === group.id);
    const reserved = group.empty && !query && (!select.value || select.value === group.id);
    if (!selected.length && !reserved) continue;
    const section = element("section");
    section.id = group.id;
    section.append(element("h2", group.title));
    if (reserved) section.append(element("p", group.empty, "reserved"));
    const cards = element("div", null, "cards");
    for (const entry of selected) {
      const card = element("article");
      card.dataset.group = group.id;
      if (entry.planned) card.dataset.planned = entry.id;
      card.append(element("span", entry.status, "badge"), element("h3", entry.title), element("p", entry.summary));
      const links = element("div", null, "card-links");
      if (!entry.planned) {
        const open = element("a", "打开演示 →", "open");
        open.href = Object.hasOwn(loaders, entry.id) ? demoURL(entry.id) : `../${entry.path}`;
        open.dataset.demo = entry.path;
        if (Object.hasOwn(loaders, entry.id)) open.dataset.demoId = entry.id;
        open.setAttribute("aria-label", `打开 ${entry.title}`);
        links.append(open);
      }
      const docs = element("a", "说明与检验");
      docs.href = `https://github.com/Quamolit/quamolit/blob/main/${entry.docs}`;
      links.append(docs);
      card.append(links);
      cards.append(card);
    }
    section.append(cards);
    gallery.append(section);
  }
  document.querySelector("#count").textContent =
    `${entries.filter((e) => !e.planned).length} / ${catalog.entries.length} 个现有入口 · ${entries.filter((e) => e.planned).length} / ${catalog.planned.length} 个待恢复`;
  document.querySelector("#empty").hidden = entries.length !== 0 || gallery.children.length !== 0;
  if (!route()) history.replaceState(null, "", galleryURL());
}

const pause = () =>
  new Promise((resolve) => setTimeout(resolve, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180));
async function applyRoute() {
  if (route() === activeId) return;
  app.dataset.transition = "leaving";
  document.body.dataset.transition = "leaving";
  await pause();
  dispose?.();
  dispose = null;
  content.replaceChildren();
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  activeId = null;
  // 连续点击只装载最新目标，避免旧异步导入覆盖当前状态。
  const target = route();
  if (target) {
    const [template, module] = await Promise.all(loaders[target].map((load) => load()));
    if (route() !== target) return;
    const doc = new DOMParser().parseFromString(template.default, "text/html");
    content.append(...[...doc.body.children].filter((node) => !["CANVAS", "NAV", "SCRIPT"].includes(node.tagName)));
    document.querySelector("#demo-title").textContent =
      inlineEntries.find((entry) => entry.id === target)?.title || target;
    const index = inlineEntries.findIndex((entry) => entry.id === target);
    document.querySelector("#previous-demo").disabled = index <= 0;
    document.querySelector("#next-demo").disabled = index >= inlineEntries.length - 1;
    app.dataset.view = "demo";
    document.body.dataset.view = "demo";
    document.body.dataset.demo = target;
    galleryView.inert = true;
    demoView.inert = false;
    dispose = module.mountDemo();
    activeId = target;
    canvas.setAttribute("aria-label", doc.querySelector("canvas")?.getAttribute("aria-label") || "当前动画画布");
  } else {
    app.dataset.view = "gallery";
    document.body.dataset.view = "gallery";
    delete document.body.dataset.demo;
    galleryView.inert = false;
    demoView.inert = true;
  }
  requestAnimationFrame(() => {
    app.dataset.transition = "idle";
    document.body.dataset.transition = "idle";
  });
}
function scheduleRoute() {
  routeQueue = routeQueue.then(applyRoute).catch((error) => {
    console.error("Demo 切换失败", error);
    dispose?.();
    dispose = null;
    activeId = null;
    content.replaceChildren();
    app.dataset.view = "gallery";
    app.dataset.transition = "idle";
    document.body.dataset.view = "gallery";
    document.body.dataset.transition = "idle";
    delete document.body.dataset.demo;
    galleryView.inert = false;
    demoView.inert = true;
  });
}
function navigate(id) {
  history.pushState(null, "", id ? demoURL(id) : galleryURL());
  scheduleRoute();
}
gallery.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-demo-id]");
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  navigate(link.dataset.demoId);
});
document.querySelector("#back-to-gallery").addEventListener("click", () => navigate(null));
for (const [button, offset] of [
  ["#previous-demo", -1],
  ["#next-demo", 1],
]) {
  document.querySelector(button).addEventListener("click", () => {
    const index = inlineEntries.findIndex((entry) => entry.id === activeId);
    if (inlineEntries[index + offset]) navigate(inlineEntries[index + offset].id);
  });
}
window.addEventListener("popstate", () => {
  const params = new URLSearchParams(location.search);
  search.value = params.get("q") || "";
  select.value = catalog.groups.some((group) => group.id === params.get("group")) ? params.get("group") : "";
  renderGallery();
  scheduleRoute();
});
search.addEventListener("input", renderGallery);
select.addEventListener("change", renderGallery);
const params = new URLSearchParams(location.search);
search.value = params.get("q") || "";
for (const group of catalog.groups) select.add(new Option(group.title, group.id));
select.value = catalog.groups.some((group) => group.id === params.get("group")) ? params.get("group") : "";
renderGallery();
scheduleRoute();
