# TUOTUO 妥妥 · 网页源码交付

## 当前版本：v50

- [在线演示](https://nurse-notes-demo.wiggly-char-1989.chatgpt.site/legacy/?v=49)
- [查看最新源码](./source/)
- [下载最新公共源码 ZIP](./tuotuo-latest-public-source.zip)
- [v50 公共交付说明](./TUOTUO-v50-PUBLIC-HANDOFF.md)
- [逐文件清单](./TUOTUO-LATEST-PUBLIC-FILE-MANIFEST.json)
- [ZIP SHA-256 与归档校验](./TUOTUO-LATEST-PUBLIC-ARCHIVE-CHECK.json)

最新网页源码已同步，包含手机界面、两种录音入口、分区留痕、定时提醒、左滑删除、知识库搜索代码和固定位置的录音按钮。

公共版不含实际 API 密钥、教材全文/扫描页或可选本地模型资源。密钥使用服务端 Secret 配置；公共版本与本地完整交付包的资源范围不同。部署、配置和已知边界请阅读公共交付说明。

## 历史交付

v22 ZIP、v22 说明和旧本地模型接手手册保留供追溯，以 v50 说明作为当前入口。`tuotuo-latest-public-source.zip` 与 `TUOTUO-LATEST-*` 现已统一更新为 v50。

第三方许可声明保留在源码中；未额外授予整项目或用户素材统一开源许可。


## 预先整理的知识小结卡

搜索栏下方提供血压测量、无菌技术、标本采集、护理记录四个主题。小结预先整理，不在展示或点击快捷主题时调用模型；自由输入搜索仍保留现有模型解析。

每个主题关联三张真实教材内容卡，附教材页码；点击可打开原页与 OCR 文字。十二个引用均已核对正文和本地扫描页存在。仅在索引包含该主题全部引用页时显示相应快捷选项；公共源码不含教材数据，恢复授权索引与原页后才显示这些选项。

代码：`public/textbook/topic-summaries.mjs`，以 PDF 页码关联现有教材数据。缺少匹配内容时不会使用虚构页码或空卡片占位。
