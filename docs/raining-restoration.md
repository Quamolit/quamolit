# Raining 雨滴恢复：M3 #36 切片

推进 #36/#37。历史 `9b5bcdd` 的雨滴由逐帧 `rand` 生成，雨滴下落、触地展开成水花并消散。这里保留三段视觉行为，改用 Calcit `quamolit.examples.raining/scene-at (seed tick)` 生成确定帧。页面只管理时钟、URL、视口和 DOM；没有单独的 JS 粒子模拟器。

每秒 30 个整数 tick；48 个固定槽位，每个槽位 120 tick 周期，前 75 tick 下落、接着 11 tick 展开水花，其余时间消失。每轮由 seed、槽位和周期数计算水平位置，节点 ID 带周期数。因此同一 seed/tick 可直接乱序采样，重置和分享链接可重放；最多 48 个节点，不随运行时间增长。此运动有解析式，用固定 tick 采样即可，无需保存可变模拟状态或从 0 追帧；这不等于 #54 的 GPU 常驻历史模拟。

全屏 Canvas 使用 contain 的 1100 × 800 逻辑坐标，CSS 视口与 DPR backing store 分离。`?seed=17&tick=75` 为固定截图入口；播放只将宿主时间量化成 tick，暂停和 resize 不改变 tick。

检验：

```sh
yarn test:raining-demo
yarn test:demo-nav
```

Node 检查 0–900 tick 节点上界、身份、下落/水花/消失、乱序和种子复现；Chromium 保存初始、水花、下一周期与窄屏 DPR 2 截图。CI 上传 `test-results/raining/`。当前只有 Canvas2D 参考绘制，未证明真实 GPU 吞吐；48 槽位与旧版随机新增数量不完全相同，也未实现天气/风力交互。其余四个原示例仍待恢复，M3 不关闭。
