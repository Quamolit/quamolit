# 多资源注册表：M2 #51 第三切片

`quamolit.resource-lifecycle/ResourceRegistry` 是纯 Calcit 的多资源所有权与容量协议。它建立在单资源 `ResourceState` 状态机之上，不保存 DOM、Promise、Image、GPUBuffer 或其他宿主句柄，因而可以随 Model/资源版本跨 Canvas 与 WebGPU 后端重建。

## 数据合同

- `RegistryEntry` 保存单资源状态、引用数、估算字节数和最后使用时钟。
- `ResourceRegistry` 保存容量、当前常驻字节、单调时钟、load/eviction 累计计数和按使用顺序排列的 entries。
- `RegistryAction(:resource identity action)` 把底层 `ResourceAction` 绑定到完整 `ResourceIdentity`。宿主表必须以 `(kind,id,version,generation)` 定位句柄，不能只用 generation。
- `RegistryMetrics` 暴露 resident、leased、idle、resident bytes、loads 和 evictions，供测试、诊断浮层和后续性能报告使用。

所有字节值当前都是调用者给出的逻辑预算，不等同于浏览器报告的物理显存。纹理宿主后续应按实际像素格式、mip 和对齐规则计算；pipeline/font 等没有自然字节数的资源应使用文档化的预算单位，不能传 0 绕过容量。

## 获取、共享与释放

`acquire-registry(registry, identity, bytes)`：

1. 已存在相同 identity 时增加引用并移到最近使用端；loading/ready 不重复 load，error 会沿用单资源协议创建新 generation 重试。
2. 首次获取先为容量腾挪，再建立 `references=1` 的 entry 并发出带身份的 load。
3. 同一 identity 再次获取必须给出相同 bytes；版本变化属于新的 identity，可以和旧版本暂时并存。

`release-registry` 只减少引用。最后一个引用释放后资源进入 idle cache，不立即销毁；重复释放明确失败，避免所有权下溢被静默吞掉。真实 Presence 终点应恰好调用一次 release；重入只需重新 acquire 同一 identity，即可复用尚未被淘汰的 ready/loading 状态。

## 容量与迟到结果

新资源超过总容量时直接失败。当前常驻空间不足时，从最久未使用端扫描并淘汰第一个零引用 entry；若只有活跃资源则失败，原 registry 保持不变。可能连续淘汰多个 idle entry，直到新资源可放入。淘汰会先执行单资源 close，再发出带身份 release。

`ready-registry` 和 `failed-registry` 只更新仍存在的相同 identity/generation。若 entry 已被淘汰或整个 registry 已关闭，迟到结果只发出 `(resource identity (release generation))`，不会重建 entry、增加 resident bytes 或唤醒旧画面。这是异步解码、上传与 device recovery 竞态的公共兜底。

`close-registry` 关闭全部 entry、清空常驻字节并返回全部 release 动作；宿主必须允许 release 幂等执行。关闭并不承诺物理显存同步归零，只保证逻辑句柄不再可达。

## 本切片验证

```bash
yarn test:folding-fan
```

Node 门禁覆盖：两个消费者共享一次 load、引用归零进入 idle、LRU 淘汰、活跃资源容量阻塞、不同资源 generation 隔离、淘汰／关闭后的迟到 ready/failed、100 次多资源装卸不超过 32 B 逻辑容量且最终 resident/live 回零。Folding Fan 浏览器回归继续证明现有图片消费者和历史画面不受影响。

Presence 的实例源已经通过纯 Calcit `quamolit.presence-resource-registry` 接入本协议，详见 [Presence 宿主实例资源跟踪](presence-resources.md)。`yarn test:presence-resources` 额外覆盖退出到 idle、退出中重入、idle 重入、80 kB 单容量换版本、带身份动作，以及 100 次 10k buffer 装卸后显式关闭回零。

`rebuild-registry` 为 device replacement 提供公共规则：删除 idle entry，为仍有 lease 的 entry 关闭旧 generation 并重新 load，保持 identity/version/reference 不变。实例专项的实际宿主执行见 [Presence WebGPU 资源宿主](presence-webgpu-resources.md)。

## 尚未完成

- Presence instances 已把真实 WebGPU batch 创建/上传/绘制/释放及 device generation 接入 registry；其他 texture/buffer/pipeline、多图层共享和 queue 完成后的安全延迟释放尚未接入。
- 当前只有总量 LRU；未提供按 kind 分池、优先级、TTL、pin、脏范围或后端实际内存反馈。这些需要真实消费者数据后再增加，不在无证据时预设复杂策略。
