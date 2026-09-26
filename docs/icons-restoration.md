# Icons 图标变形恢复：M3 #36 切片

推进 #36，恢复历史 `9b5bcdd` 中 `quamolit.app.comp.icon-increase` 与 `icon-play` 的两组行为，不恢复旧门户。前者点击后加号旋转 90°、数字过渡；后者播放/暂停由两条四点路径变形。旧实现逐帧累加 `elapsed`；本切片将计数、开关与两条 `TransitionIntent` 存在 Calcit `IconModel`，时间采样、事件打断及几何都在 Calcit。

## 公共 Calcit 入口

- `initial ()` 创建显式 Model；`increase (model at)` 和 `toggle-play (model at)` 只修改目标意图。
- `count-value`、`play-value` 在任意时间采样；用现有 `transition/interrupt-transition` 从打断瞬间的采样值接续，不丢连续点击。
- `scene-at (model time)` 输出六个稳定 ID 的 Scene 节点：两条旋转加号线、前后数字文本、播放/暂停的左右闭合路径。`draw!` 走 Canvas 参考绘制。

页面 `examples/icons/` 使用全屏 Canvas、可收起 DOM 控件、固定时间和分享链接。页面只持有 Model、转发事件及管理宿主时间/DPR，几何和插值不在 JS 中实现。`?t=` 进入暂停的确定时间，测试可直接注入事件时间与乱序采样。按钮触发约 0.34 秒宿主时间推进，供人直接观看中间帧。

## 检验

```sh
yarn test:icons-demo
yarn test:demo-nav
```

前者检查严格类型、Calcit 原生打断连续性、Node 的数字/路径与乱序合同、Chromium 的连续点击、固定时间截图和 DPR 2 暂停 resize。截图保存到 `test-results/icons/` 并上传 CI artifact；导航验证发布产物的入口往返。

## 边界

- Scene 当前只有开放折线，没有实心 Polygon/Path；原填充路径先用闭合描边轮廓呈现。文字交叉淡入简化了旧版位移，连续快速点击时以目标计数与加号角度连续性为主，旧版所有文字重叠细节尚未恢复。
- 目前通过 DOM 浮层按钮触发，不冒充已完成 #34 的独立 Canvas 命中/捕获。鼠标直接点击画布图标仍待接通。
- GPU 图层和路径/文字同源绘制留给 #53/#40。其余五个原 demo（table、finder、raining、folding-fan、drag-demo）待恢复；本切片不关闭 #36 或 M3。
