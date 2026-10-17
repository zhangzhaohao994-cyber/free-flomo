# 分析范围与证据

核对日期：2026-10-18（北京时间）。

使用 [ERA](https://github.com/dav1dngy/era-agent) v0.2.0，固定源码修订 `a6056e20fb597fb7b8cceb23f19b761d27852a4e`，其调用原版 [REA](https://github.com/morluto/rea) 6.4.0。

输入是 [flomo 公开 Web 入口](https://v.flomoapp.com/) 引用的 runtime、core、editor 和 index 四份 JavaScript。下载后解压 HTTP gzip 编码再分析；完整来源地址与解压后 SHA-256 见 `rea-evidence-summary.json`。没有把这些脚本放入发行物，也没有执行原始 bundle。

命令：

```text
node .tools/era-agent/bin/era.mjs analyze .research/flomo-public --json
```

最终成功记录：

- analysis_id：`analysis-20261017T211536-c5040e`
- evidence_id：`ev_d10bdef1967d7a28e42657de9ce28a625d73c9736ff00beaae7b4543b6a63907`
- 4 个 JS 文件解析成功，0 个解析失败；1,288 个模块；6,354 个 findings。
- 覆盖级别为 **partial**，505 项 unknown；部分大文件语义图受结果预算限制。

静态结构与文字检查可以支持这些观察：存在编辑器 bundle、笔记 slug/content/created_at、pinnedMemos/deletedMemos 状态及搜索、标签、回顾、导出相关 UI 入口。它不能证明对应接口在当前账号下实际可用，也不能还原服务器实现、推荐算法或模型效果。

自动化浏览器访问原版进入登录页。本次没有登录原版账号、读取私人笔记、分析 iPhone 安装包或测试其付费权限。没有声称“恢复原源码”或“破解会员”。

功能需求另外逐页核对 [flomo 官方帮助](https://help.flomoapp.com/)，不是把静态脚本内出现的字符串直接当成功能验收。原始脚本与完整 REA 输出只保存在忽略的本机研究目录；公开仓库保留来源、摘要和复核边界。
