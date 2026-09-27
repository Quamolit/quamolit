# Tidal Bloom：第一个生成艺术动画

`/demos/index.html?demo=tidal-bloom&t=18` 在统一页面的全屏 Canvas 中打开；`/examples/tidal-bloom/index.html?t=18` 是独立兼容入口。画廊的“艺术动画”分类已有正式作品，不再展示空占位。

## 构图与组件

Calcit 的 `quamolit.examples.tidal-bloom` 将一条花环定义为可复用的 `ring-node` 组件：绝对时间、层号和曲线序号决定 97 个点，`ring-color` 决定 RGBA；29 个组件按声明顺序组成一个 `SceneDocument`。页面不计算波形、不缓存历史帧，只负责时间、视口、Canvas context 和 DOM 浮层。`scene-at(t)` 在任意有限时间直接求值，适合乱序 seek、截图和重放。

当前是 Canvas2D 的细线透明叠加作品，不宣称 WebGPU 或自动合批支持。环线层序不可为了减少调用任意改变；组件/Scene 使用已有公共类型与 Canvas 参考绘制入口，没有引入新的宿主 JS renderer。背景是 Canvas 元素的 CSS 渐变，画布绘制层本身保持透明。

## 体验与验证

- 初潮 `t=0`、交汇 `t=18`、盛放 `t=42`、回旋 `t=72` 可一键跳转。播放与滑块可打断，分享按钮把当前时间写入 URL；缩减动态效果下不自动播放。
- `yarn test:tidal-bloom` 严格检查 11 个 Calcit 定义、编译、Node 乱序/闭合/颜色合同，以及 Chromium 的三个固定时间截图、DPR 2 窄屏和浮层收起。
- `QUAMOLIT_DEMO_TEST_PORT=5192 yarn test:demo-nav` 检查发布产物的分类、同页进入/返回、唯一 Canvas、网络请求和全部原有 demo 回归；端口可避开常驻 5190 Vite。

截图保存在 `test-results/tidal-bloom/`，发布站点和导航证据保存在 `test-results/demo-nav/`。后续作品可以继续复用“纯 Calcit 参数曲线组件 + 显式时间 + 全屏舞台”结构，再逐步增加调色盘、交互 Model 与不同图元，而不是把艺术分类填成技术占位页。
