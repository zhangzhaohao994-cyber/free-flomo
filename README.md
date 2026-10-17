# 免费浮墨 · Free Flomo

最高的独立开源卡片笔记。前端是一个可直接打开的 `index.html`；可选 Node 后端提供账号与同步、API/MCP，以及需要自行配置服务的 AI、语音和微信接入。

**当前是可用的开发版本，尚未实现 flomo 全功能，也没有证据证明比其 PRO/MAX 更好用。** 逐项状态见 [功能对照](docs/feature-parity.md)。本项目与 flomo 官方无关联，不包含其原始代码、图标或服务凭证。

## 直接使用

- 在线：[GitHub Pages](https://zhangzhaohao994-cyber.github.io/free-flomo/)
- 下载本仓库的 `index.html`，用现代浏览器打开。前端无 CDN、字体或框架依赖；ZIP库已内嵌。联网部署同时提供 sw.js 后支持离线重开。
- 默认空白空间；点「先看看示例笔记」可添加 5 条明确标记的原创示例。
- 本地数据按网址、浏览器和设备隔离。清理浏览器前导出 JSON；换网址也需要导入迁移。

## 已实现的主要操作

文字/图片记录、草稿恢复、简单 Markdown 与待办、多级标签和重命名、多关键词搜索、日期/图片/链接/无标签筛选、置顶、回收站、引用与反向引用、文字历史与恢复、每日回顾、关联漫步、图片画廊、热力图、周/月统计、时间/字数分布、标签关联矩阵、浅深色和界面密码锁。

JSON 备份包含图片、历史版本、引用、置顶和回收站；支持 JSON/HTML 重新导入、flomo ZIP及原图导入、CSV、文本、Markdown与部分Day One JSON导入。外链图片不自动抓取。

## 运行后端

需要 Node.js 24.16 或更高版本。SQLite 存储在 `.data/notes.sqlite`，必须持久化和备份。

```bash
npm ci
cp .env.example .env
npm start
```

打开 `http://127.0.0.1:4188`，在「账号与同步」填写同一地址创建首个账号。默认关闭后续公开注册。**先在本地创建自己的账号，再把服务暴露到公网。** 登录后切换到独立账号空间；本地空间不会自动上传，可手动选择合并。

两个设备连接同一 HTTPS 后端并登录同一账号后可同步。使用版本号检测冲突，保留本机冲突副本；永久删除保留服务端墓碑，避免旧设备复活已删除记录。当前同步按全量记录传输，适合个人小规模使用，大型素材库仍需增量传输、独立对象存储和压测。

## AI、语音、微信与 MCP

- AI：服务端配置 `AI_GATEWAY_API_KEY`、`AI_MODEL`；语义相关笔记另需 `EMBEDDING_MODEL`。模型 ID 从你的服务当前模型列表选择，不内置过时型号。AI SDK 7 工具循环可搜索当前用户笔记，提出新笔记/提醒，写入由前端明确确认。
- 语音：浏览器真实录音，原录音可下载；服务端配置兼容 multipart 转写接口的 `SPEECH_API_URL`、`SPEECH_API_KEY`、`SPEECH_MODEL`。未配置不会转写，也不会模拟输出。真实麦克风及实际转写质量尚未验证。
- 微信：使用你有权限配置的专用服务号，将回调设为 `https://你的后端/integrations/wechat`，配置 `WECHAT_*`。生成绑定码后在服务号发送「绑定 绑定码」。支持文字、图片，以及 `/搜索 关键词`、`/回顾`、`/解绑`。不支持把本工具伪装成 flomo 官方服务号。未做真实公众号验收，不要直接替换已有账号正在使用的回调。
- API：`POST /api/notes`，`Authorization: Bearer <专用令牌>`，请求 `{"text":"一个想法 #标签"}`。
- MCP：`POST /mcp`，使用独立 Bearer 令牌；提供 `search_notes`、`save_note`、`get_memory`。仅完成本地 JSON-RPC 接口测试，尚未通过外部 MCP 客户端互通认证。
- 提醒：连接后端可保存提醒，当前仅网页打开时提示；没有后台推送。

密钥只在服务器环境变量中配置，不放进 HTML、GitHub 或前端持久化存储。模型和语音调用可能产生服务商费用；开源代码免费不等于云资源免费。

## 部署

GitHub Pages 只运行前端，不运行 Node 后端。后端使用带持久磁盘的 Node/Docker 主机；当前未部署公网后端。

```bash
docker compose up -d --build
```

Compose 默认仅绑定主机回环地址。公网使用反向代理提供 HTTPS，设置正确的 `ALLOWED_ORIGINS`，保留 Docker 数据卷。不要把 SQLite 放在无持久磁盘的临时函数文件系统中。

## 验证与逆向来源

```bash
npm run check
npm test
```

浏览器验收脚本位于 `scripts/`，通过 Playwright CLI 执行；`browser-check.js` 会清理专用 QA 来源 `http://localhost:4187` 的本工具测试存储，请勿改成含真实笔记的网址。测试结果见 [验收记录](docs/verification.md)。

使用 ERA 0.2.0 / REA 6.4.0 静态分析 flomo 公开网页脚本，未登录、未执行原脚本、未解锁其会员功能、未分析其私有后端。原脚本只留在本机忽略目录；公开证据摘要见 [分析说明](docs/reverse-engineering.md) 和 [机器可读摘要](docs/rea-evidence-summary.json)。

MIT License。依赖的许可证和商标仍分别属于其权利人。
