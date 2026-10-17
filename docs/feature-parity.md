# flomo 功能对照与剩余差距

核对日期：2026-10-18。依据为官方公开帮助与会员对照，不是付费账号全流程测试。**没有达到全功能平替，也没有完成“比收费版更好用”的对照实验。** 下表不把服务代码、模型夹具或模拟协议测试当成真实服务上线。

| 功能 | 原版公开说明 | 免费浮墨当前状态 |
|---|---|---|
| 快速文字、图片记录 | [快速记录](https://help.flomoapp.com/basic/quick-input.html) | 已实现并浏览器验证；原图保存，每条9张、单张10MB |
| 画廊 | 同上 | 已实现图片网格及大图 |
| Live Photos | 同上 | 未实现原生 Live Photo 动画资源配对 |
| 系统全局输入、原生桌面/锁屏小组件 | [小组件](https://help.flomoapp.com/membership/widgets.html) | 未实现；网页快捷键与系统小组件不等价 |
| 语音录音、转写与原文保留 | [语音](https://help.flomoapp.com/ai/aivoice.html) | 浏览器录音、原音频下载与转写适配已写；麦克风、真实语音服务未验收，原音频尚不进入笔记数据库 |
| 多级标签、父级聚合 | [标签](https://help.flomoapp.com/basic/tag.html) | 已实现并验证 |
| 标签重命名、删除、emoji 前缀、置顶 | 同上、[会员](https://help.flomoapp.com/membership/pro.html) | 重命名已验证；已补充标签移除、移入回收站、emoji显示前缀和置顶，新增操作待单独验收 |
| 多关键词、媒体、无标签、日期范围 | [搜索](https://help.flomoapp.com/advance/search.html) | 文字/图片/链接/无标签/日期已实现；音频、排除标签等完整高级搜索未齐 |
| 置顶、回收站 | 原版公开客户端入口 | 已实现并验证；不自动清空回收站 |
| 每日回顾与规则 | [每日回顾](https://help.flomoapp.com/advance/lucky.html) | 日期固定选择、数量、包含/排除标签、最短间隔已实现；微信与关闭网页后的推送未实现 |
| 关联漫步 | [随机漫步](https://help.flomoapp.com/advance/random-walk.html) | 优先从相关笔记继续走；无相关结果时随机。无向量服务时仅文字重合度 |
| 语义相关笔记 | [相关笔记](https://help.flomoapp.com/ai/xgbj.html) | 可配置向量模型的后端已写；未接真实向量服务、未验证检索质量 |
| 向量认知地图 | [认知地图](https://help.flomoapp.com/advance/cognitive-map.html) | 当前仅本地文字关联图，最多180条；向量聚类山峰地图未实现，不按等价功能计 |
| 引用、反向引用、快速选择 | [引用](https://help.flomoapp.com/advance/thread.html) | 卡片引用、@选择、反向引用已写；单条记录目前只有一个结构化引用目标 |
| 历史版本 | [历史](https://help.flomoapp.com/basic/history.html) | 自动留存文字、查看与恢复已验证；不按时间清除，单条最多1000个版本；历史包含在JSON |
| 热力图、周/月统计 | [统计](https://help.flomoapp.com/advance/notes-graph.html) | 已实现；热力图可按天筛选 |
| 时间、字数、标签矩阵 | 同上 | 已实现；完整月历、年热力图、平台/媒体图表、年度分享图仍未齐 |
| 账号、跨设备同步 | [官方概览](https://help.flomoapp.com/) | 本地两个独立浏览器空间已贯通后端验证；公网服务未部署，真实手机未验收 |
| 本地离线 | 本项目设计 | HTML内嵌ZIP库，无CDN依赖；已添加Service Worker，断网重开/新增/刷新恢复已通过桌面浏览器验收 |
| AI 对话、工具与写回 | [Agent](https://help.flomoapp.com/ai/agent.html) | AI SDK工具循环、账号内搜索、待确认写入已实现并用模型夹具测试；未接真实模型，未实现完整多轮对话档案、联网搜索与自动技能调度 |
| AI 洞察 | [洞察](https://help.flomoapp.com/ai/insight.html) | 指定笔记的模型调用已写；无模型凭证，质量未验收 |
| AI 记忆档案与碎片 | [记忆](https://help.flomoapp.com/ai/memory.html) | 生成/读取/编辑后端、Markdown导出已写；当前生成最多200条且按文本上限截取，不是全量逐条长期记忆；碎片流水线/范围选择/双回答对照未实现 |
| 记忆特殊玩法与画像插图 | 同上 | 未实现；不能把普通模型提示词当成同等体验 |
| 微信文字、图片输入 | [微信输入](https://help.flomoapp.com/basic/wechat-input.html) | 验签、AES消息、绑定码、幂等已通过本地协议测试；真实服务号回调及图片获取未验收 |
| 微信AI伙伴、语音聊天 | [Agent](https://help.flomoapp.com/ai/agent.html) | 未实现；当前微信适配仅记录、搜索、随机回顾、解绑 |
| API、外部连接 | [API](https://help.flomoapp.com/advance/api.html) | Bearer身份的新增/读取/同步API已实现并测试；原生flomo://协议不注册为本项目协议 |
| MCP | [官方入口](https://help.flomoapp.com/) | initialize/tools/list/tools/call JSON-RPC可用；未做完整协议兼容和外部客户端验收 |
| 密码锁 | [密码锁](https://help.flomoapp.com/advance/passcode.html) | 界面锁、PBKDF2校验、闲置/刷新锁定已验证；明确不加密数据库，无生物识别 |
| JSON/HTML/Markdown导出 | [存储导出](https://help.flomoapp.com/basic/storage.html) | 已实现，真实下载与重新导入已验证；支持全部或当前筛选导出，条件导出已实际下载并核对 |
| flomo HTML导入 | [导入](https://help.flomoapp.com/basic/import.html) | .memo/.content/.time兼容解析；内嵌图片可导入，外链不自动抓取；已增加ZIP相对路径附件还原，已通过ZIP导入与原图还原验收 |
| 微信读书/得到/备忘录/手记/Day One/CSV/ZIP导入 | 同上 | 已增加通用CSV、Day One JSON、文本、Markdown及flomo ZIP；Apple专用导出和微信读书/得到结构化粘贴仍未完整适配 |
| 开放存储、备份、数据迁移 | 本项目设计 | 本地+自托管，完整JSON不收费；SQLite本地持久化已测试，大规模媒体存储未测试 |
| 云空间权益20G/500G | [会员](https://help.flomoapp.com/membership/pro.html) | 没有提供对应公网容量；取决于自托管磁盘，不能宣称已免费提供500GB云存储 |
| 分享、原生分发、账户找回与运维 | 客户端/平台服务 | 仍需补齐与部署，不把GitHub源码当成这些服务已经存在 |

## “更好用”的验收方式

可以验证的当前差异是：单文件可用、不设会员墙、JSON包含历史与图片、历史不按30天删除、后端可自托管。尚未与 PRO/MAX 做同样笔记、同样任务的盲测，不能据此得出整体优于原版。

后续应使用相同数据测试：记录到保存的步骤数和耗时、原图与历史备份往返、断网恢复、双端冲突、相关笔记召回率、AI引用准确性、完整导入覆盖率、手机真实操作，以及持续运行/备份恢复。每项需要可复现结果，不能用按钮存在代替通过。
