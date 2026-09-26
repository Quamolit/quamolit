{} (:purpose |Presence连接统一组件执行入口，为TodoList恢复提供生命周期绑定)
  :namespaces $ [] |quamolit.presence-component |quamolit.scene-ir |quamolit.scene-binding
  :flow $ [] |事件协调PresenceModel |declare-flat生成Scene与Motion |ExecutionDeclaration |保留计划按绝对时间采样 |显式settle释放
  :constraints $ [] |业务逻辑使用Calcit |绘制不修改Model |不引入第二运行时 |只支持顶层矩形折线与基础文字 |拒绝已有alpha绑定冲突 |保留原始颜色alpha乘生命周期alpha |退出节点禁交互 |不冒充组隔离透明度
  :verification $ [] |严格类型 |乱序采样 |重入连续性 |终点释放一次 |静态折线点共享 |Canvas像素对照
