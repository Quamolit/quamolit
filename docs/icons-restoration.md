# Icons 图标变形恢复：M3 #36 切片

推进 #36/#136，恢复历史 `9b5bcdd` 中 `quamolit.app.comp.icon-increase` 与 `icon-play` 的两组行为，不恢复旧门户。前者点击后加号旋转 90°，当前数字向下退出、下一数字从上方进入，并在中间帧等权重叠；历史初始可见数字为 1。后者播放/暂停由两条四点路径变形。旧实现逐帧累加 `elapsed`；当前实现将计数、开关与两条 `TransitionIntent` 存在 Calcit `IconModel`，以绝对时间恢复计数 1/4 秒、播放形变 1/6 秒的线性节奏，同时允许从当前采样值打断。

## 公共 Calcit 入口

- `initial ()` 创建显式 Model；`increase (model at)` 和 `toggle-play (model at)` 只修改目标意图。
- `count-value`、`play-value` 在任意时间采样；用现有 `transition/interrupt-transition` 从打断瞬间的采样值接续，不丢连续点击。
- `scene-at (model time)` 输出八个稳定 ID 的 Scene 节点：两块原有底色、两条旋转加号线、前后数字文本、播放/暂停的左右实心路径。`draw!` 走 Canvas 参考绘制。

页面 `examples/icons/` 使用全屏 Canvas、可收起 DOM 控件、固定时间和分享链接。页面只持有 Model、转发事件及管理宿主时间/DPR，几何、插值和两块卡片的命中区域都在 Calcit 中定义；JavaScript 只把浏览器像素换算为逻辑坐标。`?t=` 进入暂停的确定时间，测试可直接注入事件时间与乱序采样。画布卡片和 DOM 按钮触发相同事件，并推进约 0.34 秒宿主时间，供人直接观看中间帧。

## 检验

```sh
yarn test:icons-demo
yarn test:demo-nav
```

前者检查严格类型、Calcit 原生打断连续性与命中、Node 的数字/路径与乱序合同、Chromium 的真实画布点击、连续打断和 DPR 2 暂停 resize。初始、重叠中间帧、终点分别保存纯 Canvas 与带浮层截图到 `test-results/icons/` 并上传 CI artifact；导航验证发布产物的入口往返。

## 边界

- 实心 Polygon 与原有底色已经恢复；文字交叉淡入的坐标、内容与旧版的逐帧状态机仍可能不同，连续快速点击时以目标计数与加号角度连续性为主，旧版所有文字重叠细节尚未恢复。
- 目前通过 DOM 浮层按钮触发，不冒充已完成 #34 的独立 Canvas 命中/捕获。鼠标直接点击画布图标仍待接通。
- GPU 图层和路径/文字同源绘制留给 #53/#40。全部旧 Demo 已有入口，但保真差异见 [逐项核对](demo-fidelity-audit.md)；本切片不关闭 #36 或 M3。
