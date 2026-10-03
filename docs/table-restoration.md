# Table 九宫格恢复：M3 #36/#37 切片

历史 `9b5bcdd` 的 Table 是 3 × 3 可编辑文字格。本切片保留九格编辑：Calcit `initial`、`set-cell`、`scene-at` 负责数据及18个Canvas Scene节点；同次声明经`hit-plan(document)`进入公共`scene-hit/HitPlan`，`draw-scene!`绘制这个文档，浏览器点击复用已提交计划而不重建或另扫九格坐标。标签是非交互装饰，9个格子各有target；`hit-with-plan`按实际几何/层序返回格子索引。原`hit-at(x,y)`仍是初始布局便利入口，每次编译，实时页面不用它；删除只有它调用的旧`scan-hit`，不是删除框架公共HitPlan。JS宿主只负责视口/DPR、坐标逆变换、一个临时定位的DOM输入框与分享URL。表格内容不会因绘制或resize更新；编辑失焦、Enter提交，Esc取消，输入法组合中的Enter不提交。

浮层展开时按 760 × 570 contain 避让面板，收起时按 640 × 500 contain 放大格子；真实 Canvas 始终覆盖整个视口。页面可在桌面和窄屏 DPR 1/2 下使用，暂停状态的 resize 仅重绘，不改变格子。分享 URL 保存九格文字并在加载时校验长度和类型。

```sh
yarn test:table-demo
yarn test:demo-nav
```

Node验证九格数量、中文写入、稳定Scene ID、历史范围的504个内外/精确边界点和非法索引。实际Scene移动/缩小格子与重排重叠层的反例，保证命中不偷用历史布局；disabled上层不遮挡下层，未知target不冒充格子，新计划不改旧计划。Chromium验证画布点击、失焦与键盘提交/取消、中文文字、分享重载，DPR1/2下标签覆盖区域、格子边缘/缝隙、面板缩放与暂停resize后的当前视图命中，保留窄屏重绘和原有截图。当前是Canvas2D参考路径，没有新增动画或renderer；DOM输入位置是宿主编辑affordance，不是DOM表格。它接入公共命中，但没有指针capture、Presence资源组合、Canvas文本光标/选择或WebGPU文本，不能用此切片关闭#34/#36/#37/#53。
