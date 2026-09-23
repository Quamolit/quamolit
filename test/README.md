# 确定性帧测试

三类独立的 M0 参考场景及固定画面见 [m0/README.md](m0/README.md)。本页描述 Calcit 顺序帧求值测试；M0 参考场景使用独立、可乱序采样的数学输入，不代表公共动画 API 已完成。

时间单位为秒。新代码使用 `initial-frame` 建立模型和场景，再用 `evaluate-at` 显式推进时间；重复时间复用模型与场景，较早的时间戳会报错。详见[显式帧求值](../docs/frame-evaluation.md)。旧版 `advance-frame-clock!` 继续供 `on-tick` 使用。`sample-times` 用于包含首尾的等距采样，例如 `sample-times 0 1 4` 得到 0、0.25、0.5、0.75、1。

在项目目录中使用 Node.js 24 和 Calcit 0.19.1：

```sh
yarn test:clock
yarn compile:visual
yarn vite
```

打开 `http://localhost:5173/test/visual.html?time=0.5`。页面会检查五个采样点的像素，验证重绘和重复时间戳不会推进进度，并验证时间倒退会被拒绝。Canvas 下方显示 `PASS` 表示检查通过。点击时间按钮或修改 `time` 查询参数即可截取指定帧。每帧都从重置后的时钟开始，因此截图不依赖墙上时间、动画帧调度或点击顺序。画布大小为 280×160，背景为白色；在时间 `t`，粉色矩形的中心位置是 `x = 48 + 160t`、`y = 80`。

测试夹具以 `evaluate-at` 计算下一份模型和场景，再把结果中的 `scene` 交给 `paint-tree-only-with` 和真实的矩形绘制器。重绘直接消费已保存的场景，不重新求值。旧版 tick 遍历仍由单元测试覆盖。其他绘制分支暂未覆盖，因为其旧版严格类型诊断仍会阻止可视化入口编译。完成这些分支的迁移后，应为文本、变换、路径、图片、透明度和事件区域增加专项夹具，并在固定版本的浏览器环境中建立图像基线。目前的浏览器检查是确定性像素与截图测试工具，还不是完整的视觉回归 CI 测试套件。

`yarn compile:visual` 只修改被忽略的 `js-out/` 产物。构建普通 bootstrap 入口前，应重新运行 `yarn compile`。
