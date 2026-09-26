// 仅为演示站点导航，不承担框架动画/渲染业务。
import catalog from "./catalog.json";
const gallery = document.querySelector("#gallery");
const search = document.querySelector("#search");
const select = document.querySelector("#group");
const params = new URLSearchParams(location.search);
search.value = params.get("q") || "";
for (const group of catalog.groups) select.add(new Option(group.title, group.id));
select.value = catalog.groups.some(g => g.id === params.get("group")) ? params.get("group") : "";
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function render() {
  gallery.replaceChildren();
  const query = search.value.trim().toLocaleLowerCase();
  const entries = catalog.entries.filter(entry =>
    (!select.value || entry.group === select.value) &&
    [entry.title,entry.summary,entry.status].join(" ").toLocaleLowerCase().includes(query));
  for (const group of catalog.groups) {
    const selected = entries.filter(entry => entry.group === group.id);
    if (!selected.length) continue;
    const section = element("section");
    section.id = group.id;
    section.append(element("h2", group.title));
    const cards = element("div", null, "cards");
    for (const entry of selected) {
      const card = element("article");
      card.dataset.group = group.id;
      card.append(element("span",entry.status,"badge"),element("h3",entry.title),element("p",entry.summary));
      const links = element("div", null, "card-links");
      const open = element("a","打开演示 →","open");
      open.href = "../" + entry.path;
      open.dataset.demo = entry.path;
      open.setAttribute("aria-label", "打开 " + entry.title);
      const docs = element("a","说明与检验");
      docs.href = "https://github.com/Quamolit/quamolit/blob/main/" + entry.docs;
      links.append(open, docs);
      card.append(links); cards.append(card);
    }
    section.append(cards); gallery.append(section);
  }
  document.querySelector("#count").textContent = entries.length + " / " + catalog.entries.length + " 个入口";
  document.querySelector("#empty").hidden = entries.length !== 0;
  const next = new URLSearchParams();
  if (query) next.set("q", search.value);
  if (select.value) next.set("group", select.value);
  history.replaceState(null, "", location.pathname + (next.size ? "?" + next : ""));
}
search.addEventListener("input", render);
select.addEventListener("change", render);
render();
