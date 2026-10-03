// 旧根 URL 是兼容入口；应用始终复用统一画廊，不再运行空 bootstrap。
// 保留相对部署路径、筛选、demo、固定时间和 seed/tick 等分享参数。
const destination = new URL("./demos/index.html", location.href);
destination.search = location.search;
destination.hash = location.hash;
location.replace(destination);
