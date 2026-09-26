{} (:purpose |完整恢复TodoList操作与可直接采样的行动画)
  :flow $ [] |显式时间事件日志 |Calcit行Model和过渡意图 |Presence声明 |统一ComponentPlan |全屏Canvas绘制
  :boundaries $ [] |JS只管理DOM和浏览器调度 |新增编辑完成删除恢复重排均在Calcit |帧采样不修改Model |终点显式结算 |原生文字inline临时适配关联js-ffi124
  :verification $ [] |输入日志乱序重放 |重排打断连续性 |退出禁止命中 |终点释放一次 |空闲停帧 |视口DPR重绘 |文本和alpha像素 |导航往返
