# 免费录音转写

使用在线版本，打开笔记输入框里的麦克风，选择开始录音或导入音频，完成后点「免费转写」。首次需要下载约68MB模型及运行时，推荐Wi-Fi。录音由本设备内的Whisper tiny量化模型识别，不调用DeepSeek或付费语音API，无需登录。

转写完成后保留音频播放器，文字标为「自动转写 · 待听校」，可编辑后加入笔记草稿。原有草稿文字会保留。最近一段音频及听校文字暂存在当前浏览器的当前笔记空间，刷新后可从麦克风入口恢复；替换前可下载留存。音频目前不随笔记云同步、JSON或HTML备份，清除网站数据会删除本机暂存。

支持浏览器可解码的M4A、MP3、WAV、WebM等；单段最多10分钟/25MB。手机速度与可用内存影响处理耗时，较长录音建议拆段，保持网页在前台。静音、损坏文件、取消或模型下载失败会明确提示，原录音保留。模型可能输出简体或繁体，也会漏标点或识别错字，不能替代听校。

模型和运行时与网页同源，浏览器不必访问Hugging Face或其他CDN。模型缓存和Service Worker运行时缓存就绪后，支持断网重开并转写；浏览器可能因存储压力清理缓存，届时需要重新联网下载。设置中可移除语音模型缓存，不影响笔记与暂存录音。

普通笔记依然可单独使用index.html。语音依赖public/speech/v1/静态文件和HTTP(S)来源；单个file:// HTML不能启动此模块。GitHub Pages、Vercel和Node/Docker版本均提供这些文件，HTTPS支持真实麦克风授权。

## 实现与来源

- [Transformers.js浏览器WASM](https://huggingface.co/docs/transformers.js/guides/webgpu)，版本3.8.1；使用单线程WASM，不依赖WebGPU或SharedArrayBuffer。
- [onnx-community/whisper-tiny](https://huggingface.co/onnx-community/whisper-tiny)，固定revision `ff4177021cc41f7db950912b73ea4fdf7d01d8e7`，q8多语言模型，中文/自动语言选项。
- 完整资源尺寸与SHA-256见 `public/speech/v1/manifest.json`，`npm run check`核验。模型与推理约67,762,327字节，另有小型worker和许可证。
- 重建依赖资源：`npm ci --ignore-scripts`，`npm run prepare:speech`；模型下载仅发生在此准备脚本，不在网页运行时跨站请求。
- Transformers.js采用Apache-2.0，Whisper及ONNX Runtime采用MIT，许可证保留在 `public/speech/v1/licenses/`。本项目MIT不替代第三方许可证。

设备内转写不产生按次推理费，下载会占用网络流量和设备资源；静态托管仍受免费平台的带宽、容量及服务条款限制，不承诺无限公网用量。

## 测试音频

浏览器验收脚本使用macOS Tingting合成音源，不包含用户录音。可在macOS准备忽略目录中的测试文件，然后运行`scripts/speech-browser-check.js`、`scripts/speech-recorder-check.js`或`scripts/speech-public-check.js`。测试会使用独立浏览器空间，后端脚本默认QA端口4194。

```bash
mkdir -p .data
say -v Tingting -o .data/speech-qa.aiff '今天是一个新的开始。我想记录三个重要的想法。第一个是坚持阅读，第二个是每天运动，第三个是早点休息。'
afconvert -f WAVE -d LEI16@16000 -c 1 .data/speech-qa.aiff .data/speech-qa.wav
afconvert -f m4af -d aac -b 64000 .data/speech-qa.aiff .data/speech-qa.m4a
```
