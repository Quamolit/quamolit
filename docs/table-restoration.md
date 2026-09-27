# Table 九宫格恢复：M3 #36/#37 切片

历史 `9b5bcdd` 的 Table 是 3 × 3 可编辑文字格。本切片保留九格编辑：Calcit `initial`、`set-cell`、`hit-at` 和 `scene-at` 负责数据、逻辑命中及 18 个 Canvas Scene 节点；JS 宿主只负责视口/DPR、坐标逆变换、一个临时定位的 DOM 输入框与分享 URL。表格内容不会因绘制或 resize 更新；编辑失焦、Enter 提交，Esc 取消，输入法组合中的 Enter 不提交。

浮层展开时按 760 × 570 contain 避让面板，收起时按 640 × 500 contain 放大格子；真实 Canvas 始终覆盖整个视口。页面可在桌面和窄屏 DPR 1/2 下使用，暂停状态的 resize 仅重绘，不改变格子。分享 URL 保存九格文字并在加载时校验长度和类型。

```sh
yarn test:table-demo
yarn test:demo-nav
```

Node 验证九格数量、中文写入、稳定 Scene ID、坐标命中和非法索引；Chromium 验证画布点击、失焦与键盘提交/取消、中文文字、分享重载和 DPR 2 窄屏重绘，并保存初始、编辑、提交画面。当前是 Canvas2D 参考路径；DOM 输入位置属于宿主编辑 affordance，不是 DOM 表格渲染。没有通用文本光标/选择的 Canvas 方案，也没有 WebGPU 文本或 #34 通用命中索引，不能用此切片关闭 #36/#37/#53。
