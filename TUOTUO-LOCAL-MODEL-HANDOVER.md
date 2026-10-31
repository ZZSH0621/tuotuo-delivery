# 妥妥 TUOTUO 本地模型接手手册

更新日期：2026-10-31 UTC，适用主版本 **v22**。对象：没有本项目聊天历史、需要在本地理解、运行、修改和验证项目的开发者或模型。本文件沿用原有同名交接文档身份，新版内容取代旧v20接口说明；旧ZIP保留历史，不覆盖。

这是**只允许虚构资料的照护工作原型**，不是医疗器械、电子病历、医嘱或可靠护理闹钟。现有模块包括任务人工核对、提醒/知悉/完成留痕、总结、备忘、26条候选知识、TUOTUO角色/开场/睡脸屏保、六音效/音量、390px布局，以及**单一百炼个人key语音入口**。生产已启用受认证保护的API，但**没有完成真实本人key、音频、费用和识别结果验收**。

本文源码路径均相对于新版ZIP的解压项目根。推荐自行新建 `tuotuo-public-source/`作为解压目录；**v22 ZIP内容直接在归档根，和旧v20有外层目录不同**。不要把只含交付文件的GitHub根当应用根运行npm。

快速定位：安装和架构第3节，工作台第4节，存储第5节，当前语音/历史代码第6节，API第7节，知识素材第8节，证据第9节，问题与验收第10–11节，回滚与接手提示词第12–13节；完整文件索引、20来源表在附录。

## 1 交付物和版本状态

### 1.1 当前主线与历史分支

| 对象 | 状态 | 不可推导 |
| --- | --- | --- |
| [GitHub交付仓库](https://github.com/ZZSH0621/tuotuo-delivery) | 新版v22 ZIP及三份配套文件已上传并下载回验；本同名手册随本轮更新 | 仓库公开不自动配置独立部署；交付包根不是直接npm工程 |
| v22功能源 | 提交 `7acc3f2e5535647e61864bf29514d72570274225`，已核对HEAD；继承公开根修复、加入390px和新百炼UI | 公开候选另外脱敏/可移植化，不是原提交逐字节归档 |
| [生产演示](https://nurse-notes-demo.wiggly-char-1989.chatgpt.site) | v22已于2026-10-31 04:45:56 UTC部署，public；API经明确配置启用，表存在 | 不等于登录账户和真实收费ASR成功；当前包不携带生产secret/私有ID |
| 历史v21 | 提交 `0539ced58ad138c19e118bf6ee2059727664e068`，基于v18仅修公开根入口 | 不是当前完整功能；v22已包含其修复，无需再套旧补丁 |
| 历史v20公开包 | 源基线 `aa61b5dc3a4f4944ac30105b121794a04bc4eb7c`，旧OpenAI-only/双语音UI候选 | 不是当前API契约；不要拿旧默认模型/字段/超时继续接手 |

新包的默认配置**关闭API**，生产现状**已启用API**，这是有意的环境隔离，不是文档矛盾。开发/托管记录里“API未配置”“98测试待最终重跑”等早期状态，均须结合其时间；本手册以当前代码、新公开候选99测试及最终部署证据为准。

### 1.2 新版交付文件与完整性

| 交付仓库根文件 | 用途 |
| --- | --- |
| `tuotuo-v22-public-source.zip` | 新版公开源码，归档根直接有package.json等项目文件 |
| `TUOTUO-v22-PUBLIC-HANDOFF.md` | 新版简要状态/运行说明；包内同内容为PUBLIC-CANDIDATE.md |
| `TUOTUO-v22-PUBLIC-FILE-MANIFEST.json` | 新版相对源提交差异及逐文件SHA-256；包内PUBLIC-FILE-MANIFEST.json不自哈希 |
| `TUOTUO-v22-PUBLIC-ARCHIVE-CHECK.json` | 新版ZIP大小、SHA、CRC、文件数 |
| `TUOTUO-LOCAL-MODEL-HANDOVER.md` | 本同名完整接手手册，不在固定ZIP的自校验范围 |

新版ZIP：**9,708,347字节**，SHA-256：

```text
8b17ee6f287abcd267cc8c6f1d9835e2f46f1cc9b448bd2696dc98f9a908c3b2
```

新版共207文件，manifest列206项不自哈希。哈希说明同一性与完整性，不证明医学有效、许可完备或没有任意安全漏洞。包内说明中的“本次打包未上传”只陈述打包动作范围，最终是否已在GitHub发布应看仓库实际记录，不把生产部署/打包/文件上传混为一谈。

历史 `tuotuo-latest-public-source.zip` 仍为9,699,203字节、SHA `82a2b4dd2a843ee0e578ce54061aba4049288eef020ed381eeaeef74ab354bb1`，195文件、外层 `tuotuo-public-source/`，它不覆盖也不升级为新版。旧 `TUOTUO-LATEST-*` 文件描述该历史归档，主线接手用上表明确的v22文件名。

用户原上传包、`.env.local`、个人key、原私有部署状态、旧独立回滚备份、转换权重、FLEURS示例均不加入新版公开交付。不得因“完善交付”从原始包恢复敏感文件。

## 2 产品目标和必须保持的约束

TUOTUO用深色角色工作台辅助记事和核对；不代替医嘱/临床判断。语音只辅助输入，提醒到时、已知悉、真实工作完成分开。

1. 仅虚构资料；床号/姓名/项目/起点/时间缺失就追问或留空，不推断皮试、禁食、观察等医学时长。
2. 知悉只设ack并停当前提醒，完成必须经完成表单设done；语音采用、音轨结束、关闭屏保都不是完成。
3. 当前只有一个百炼语音入口；旧本地/browser/OpenAI UI不加载。服务端保留OpenAI协议兼容，不等于UI仍提供它。
4. 录音和导入只生成本机预览；只有用户确认本轮目标/个人费用并手动发送才上传。没有自动发送、自动重试或地域fallback。
5. 本人key手填且不持久化，设置变更撤销同意，地域/workspace变化清key；不读环境文件取key、不用拥有者共享key兜底、不允许任意URL。
6. 采用结果只追加任务输入或备忘草稿，不自动创建/保存；知识条目全部research_only，不自动计时。
7. 展示层保持原任务/提醒；390px切换不重建工作台，语音是同源iframe覆盖层，关闭/告警能回原工作台。
8. 六段音效不等于真实震动，Web提醒不保证后台/锁屏可靠；电量不可用就明确未知。
9. 公开包缺旧模型不是训练成功/完整离线功能；不擅自补权重、患者资料、密钥、用户邮箱、私有标识或未核实授权素材。
10. 真实计费调用、独立生产部署、远程数据库改动和新增公开范围需要另外明确授权；本手册不是自动执行授权。

## 3 从源码理解运行结构

### 从公开交付包开始

以下命令对应**v22公开候选**。新版ZIP源码直接在归档根，解压到自己新建的tuotuo-public-source目录即可；生产已启用API，但此独立包默认关闭，不能照搬生产运行状态。

当前 GitHub 仓库根目录是交付文件层，不是应用项目根目录；根目录没有可直接运行的 `package.json`。先下载或克隆仓库，再解压 `tuotuo-v22-public-source.zip`。本次已核查ZIP没有共同外层目录，归档根直接包含项目文件；应用根目录应同时包含 `package.json`、`package-lock.json`、`app/` 和 `public/`。未来若交付包变化，以 `tar -tf` 的实际列表为准，不要猜目录层级。

#### 环境和依赖版本

- `package.json` 声明 Node.js **`>=22.13.0`**；本次核查环境实际为 **Node.js `v24.22.1`、npm `11.9.0`**。这不是 Windows、macOS 和所有 Node 版本均已实测的声明。
- 使用 npm 和现有 `package-lock.json` 复现依赖。`npm run install:ci` 内部运行 `npm ci`，包含开发和可选依赖；不要同时启动多个安装进程，不要先删除锁文件、运行全量升级或改用另一包管理器。
- 锁定的主要版本包括 React `19.2.6`、Next `16.3.4`、Vinext `1.0.0-beta.5`、Vite `8.0.13`、Wrangler `4.92.0`、Cloudflare Vite 插件 `1.37.1`、TypeScript `5.9.3`、Drizzle ORM `0.45.2`。最终解析版本以锁文件为准，而非自行重新选择“最新版本”。
- 全新解压没有 `.sites-runtime/execution-profile.json` 时，`scripts/execution-profile.mjs` **默认选择 `portable`**。Windows、macOS、普通 Linux 都使用这条路径，不需要 Bash，也无需手写 profile。不要把托管平台的 `managed-linux` 路径当作所有 Linux 的默认设置。
- 从 [Node.js 官方下载页](https://nodejs.org/en/download)按系统与架构安装满足最低要求的版本，并保留实际版本记录；不要把官网最新版本当作此项目已验版本。先备好 npm、Git 和解压工具，再执行下面命令。出现网络或证书问题时先记录错误和现有配置；**不要擅自修改系统代理、关闭 TLS 校验、放宽系统安全策略或切换不可信镜像**。

#### Windows PowerShell

在一个用于存放项目的新目录中执行。PowerShell 使用 `npm.cmd`，避免把 `npm.ps1` 执行策略问题误当作必须修改系统策略。

```powershell
node --version
npm.cmd --version
git --version

git clone https://github.com/ZZSH0621/tuotuo-delivery.git
Set-Location tuotuo-delivery

# 先查看，应在归档根看到 package.json、public/、app/
tar.exe -tf .\tuotuo-v22-public-source.zip | Select-Object -First 20

# 使用新建目录，避免覆盖既有工作
Expand-Archive -LiteralPath .\tuotuo-v22-public-source.zip -DestinationPath .\tuotuo-public-source
Set-Location .\tuotuo-public-source
Get-Item .\package.json, .\package-lock.json

npm.cmd run install:ci
# 等安装成功结束，再启动；停止服务器使用 Ctrl+C
npm.cmd run dev
```

若没有 Git，可以从公开仓库网页下载 `tuotuo-v22-public-source.zip`，在其所在目录从 `tar.exe -tf` 一行继续；不要把 GitHub 的“Download ZIP”外层仓库包误认为应用源码内层 ZIP。任何一步报错，应先处理该步，不能继续把后续失败解释成应用故障。

#### macOS 和 Linux

```sh
node --version
npm --version
git --version

git clone https://github.com/ZZSH0621/tuotuo-delivery.git
cd tuotuo-delivery

# 先核实 ZIP 顶层结构
tar -tf tuotuo-v22-public-source.zip | head -20

# tuotuo-public-source 应为新目录；已存在则另选，不覆盖已有修改
mkdir tuotuo-public-source
unzip tuotuo-v22-public-source.zip -d tuotuo-public-source
cd tuotuo-public-source
ls package.json package-lock.json

npm run install:ci
# 等安装成功结束，再启动；停止服务器使用 Ctrl+C
npm run dev
```

部分 Linux 系统的 GNU `tar` 不能读取 ZIP；如果 `tar -tf` 报格式错误，用 `unzip -l tuotuo-v22-public-source.zip | head -25` 查看同一包的目录，不要据此认定 ZIP 已损坏。macOS 通常自带 ZIP 解压工具；缺少 `unzip` 时，先通过该系统认可的软件安装方式补齐，或使用系统图形解压器，然后进入真实应用根目录。

#### 解压前后核验

在交付仓库根检查ZIP，输出应等于1.2节固定SHA-256：

```powershell
# Windows PowerShell
Get-FileHash .\tuotuo-v22-public-source.zip -Algorithm SHA256
```

```sh
# macOS
shasum -a 256 tuotuo-v22-public-source.zip
# Linux
sha256sum tuotuo-v22-public-source.zip
```

进入解压应用根后，可用已经安装的Node逐一检查包内manifest，不依赖npm包、不修改文件：

```sh
node --input-type=module -e "import fs from 'node:fs';import {createHash} from 'node:crypto';const m=JSON.parse(fs.readFileSync('PUBLIC-FILE-MANIFEST.json','utf8'));const bad=Object.entries(m.files).filter(([p,h])=>!fs.existsSync(p)||createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==h).map(([p])=>p);console.log({checked:Object.keys(m.files).length,bad});process.exitCode=bad.length?1:0"
```

期望 `checked:206`、`bad:[]`。后续有意修改代码后出现相应哈希差异是正常现象，应记录新变更，不篡改基线清单来冒充原包。

#### 开发预览与构建预览

`npm run dev` 在 portable 模式使用 Vinext 开发服务器，默认从 **5173** 端口启动。以终端实际打印的地址为准，通常是 `http://localhost:5173`；保持仅本机回环访问，不为省事绑定到公开网卡。需要另一个端口时使用 `npm run dev -- --port 5174`（PowerShell 用 `npm.cmd`）。

- 访问 `/`：`app/page.tsx`直接跳转到 `/legacy/index.html`，浏览演示无需登录。API身份仍独立；portable dev在回环请求提供模拟登录，可在浏览器打开 `/signin-with-chatgpt?return_to=/asr/`。它不是真实ChatGPT认证，不能用于生产。
- 访问 `/legacy/index.html`：直接查看静态工作台。**公开静态工作台不受API认证保护**，因此不要在页面、图片或 JavaScript 中放置秘密或真实患者资料。
- 此独立公开包API默认关闭，当前界面是百炼语音而非旧本地模型入口。安装不会配置托管身份/数据库/计费；页面可录音预览不代表已经可以发送。旧模型权重仍不附带。

停止开发服务器后，在同一应用根目录构建并运行本地构建预览：

```sh
npm run build
npm start
```

PowerShell 对应为：

```powershell
npm.cmd run build
npm.cmd start
```

`npm start` 使用 `dist/server/wrangler.json`，以 Wrangler `dev --local` 在 `127.0.0.1` 运行构建后的 Worker，状态保存在 `.wrangler/state`。**它不是生产发布命令，也不提供开发模式的模拟登录**；按终端输出地址访问 `/legacy/index.html` 可检查静态界面，不要把构建预览上的登录路径不可用误判为已部署认证失败。可用 `npm start -- --port 8788` 改本地端口。不要假设运行 `npm start` 会自动 build。

#### 测试和类型检查

在应用根目录执行；测试脚本不是 `npm test`，因为 `package.json` 没有定义该命令。

macOS 和 Linux：

```sh
node --test tests/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

Windows PowerShell 使用显式文件数组，避免依赖 shell 通配符展开行为：

```powershell
$TestFiles = @(Get-ChildItem .\tests\*.test.mjs | ForEach-Object { $_.FullName })
node --test $TestFiles
node .\node_modules\typescript\bin\tsc --noEmit
npm.cmd run build
```

每一条都应单独检查退出码和输出；不要因为最后一条成功就声称整个检查通过。`tests/sqlite-d1.mjs` 用 `node:sqlite` 模拟 D1，单元测试不连接远程数据库。模拟传输测试通过不证明真实认证、收费 API、麦克风、手机硬件或生产环境已经验收。仓库另有 `npm run lint`，但不能在未运行时把它写入“已通过”；也不应为消除旧 starter 的 lint 问题而无关地重构大量 UI 文件。

### 实际架构和维护入口

本项目不是传统的“`next dev` 加 React 页面承载全部业务”。它保留 Next App Router 风格文件和 React 依赖，由 **Vinext + Vite + Cloudflare Worker** 执行框架层；当前工作台主体仍是 `public/` 中的 HTML、CSS、普通 JavaScript 和浏览器模块。

```text
开发命令 npm run dev
  → scripts/run-framework.mjs
  → portable 默认：Vinext CLI → vite.config.ts

HTTP 请求
  → worker/index.ts → vinext/server/fetch-handler
      ├─ / → app/page.tsx → 公开重定向 → /legacy/index.html
      ├─ /api/session → app/api/session/route.ts
      ├─ /api/transcriptions → app/api/transcriptions/route.ts
      └─ 静态工作台与资源 → public/

工作台 public/legacy/index.html
  → public/app.js 等本地任务与提醒逻辑
  → public/asr-integration.mjs → 同源 /asr/ iframe
  → public/asr/app.js → api-request.mjs → /api/session 与 /api/transcriptions
```

`public/legacy/index.html` 设置了 `<base href="/">`，所以其中 `app.js`、`style.css` 等相对 URL 实际从站点根路径加载。不要直接双击 HTML、随意移动它，或部署到子路径后仍假定所有资源路径正确；这需要 HTTP 服务和对应路径验证。页面业务改动通常从 `public/` 入手，而不是另写一套 React 工作台后假称已替换现有页面。

#### 重点目录职责

| 路径 | 当前职责与修改注意事项 |
| --- | --- |
| `app/page.tsx`、`app/layout.tsx` | 公开首页、静态工作台跳转、页面元信息；不是主要工作台组件树。 |
| `app/chatgpt-auth.ts` | 读取托管层注入的可信身份头并构造登录/退出路径。不能把该 helper 当成独立身份验证服务。 |
| `app/api/session/route.ts` | 返回认证、后端就绪和拥有者标记；就绪状态检查运行时配置及两张配额表。 |
| `app/api/transcriptions/route.ts` | 按独立运行配置决定启用的转写入口；组合认证、运行时配置、D1 配额、音频校验与上游传输。 |
| `public/legacy/index.html`、`public/app.js`、`public/style.css` | 现有工作台 DOM、主业务和基础外观。 |
| `public/tuotuo*`、`public/sounds.js`、`public/memos.js`、`public/knowledge.js` | 品牌角色与开场、屏保、竖屏预览、音效、备忘和知识展示。更改原样式后注意竖屏派生样式同步。 |
| `public/asr/`、`public/asr-integration.*` | 当前单一百炼语音UI、任务/备忘草稿回传和iframe生命周期。 |
| `public/api-models.mjs`、`api-recorder.mjs`、`api-request.mjs`、`speech-endpoint.mjs` | 当前provider约束、本机采集/VAD和手动请求。`api-voice-ui.mjs`是未加载的旧面板。 |
| `public/local-asr/`、`public/local-asr-ui.mjs` | 未启用的历史本地识别代码，缺模型/示例；当前仍复用local-asr/pcm-worklet.mjs采集PCM，不能整目录删除。 |
| `server/` | API 运行时开关和站点 ID、配额规则、音频内容校验、转写处理；重要安全和成本边界在这里。 |
| `db/`、`drizzle/` | D1/Drizzle 入口、真实两张配额表、生成的 SQL 迁移及元数据。这里不是护理任务云端数据库。 |
| `migrations/0001_quota.sql` | 同类配额表的另一份重建 SQL；不要和 Drizzle 迁移重复执行，也不要把它自动推断为当前托管发布迁移入口。 |
| `worker/index.ts` | Worker 入口，委托 Vinext 请求处理，并保留请求级 connector capability。 |
| `components/ui/`、`hooks/`、`lib/utils.ts` | starter 的 UI 组件、通用 hook 和工具。存在组件文件不代表静态工作台正在使用它。 |
| `lib/connector-*`、`lib/connectors.ts`、`components/connector-error.tsx` | starter 的 connector 契约、请求上下文和错误展示。当前 app 路由未调用 `connectorsForRequest()`；**不能据此声称已接入任何业务外部系统**。 |
| `scripts/vite/`、`scripts/connector-preview/` | 本地登录模拟、构建附加文件和 connector 预览基础设施；不代表正式 OAuth 或真实 connector 已配置。 |
| `scripts/run-framework.mjs`、`scripts/install-ci.mjs` 等 | profile 选择、锁定安装和启动构建封装。普通本地开发先用这些入口，不要跳过后再报告可复现。 |
| `.openai/hosting.json`、`vite.config.ts` | 托管声明与本地 Cloudflare 绑定模拟。当前声明 `DB`，R2 未启用；Vite 内本地数据库 ID 是占位值，不是可发布的生产资源配置。 |
| `tests/` | 单元、规则、安全边界与资源保持检查；不能替代浏览器、真机和生产联调。 |
| `examples/d1/` | 可选starter示例：`db/schema.ts`定义notes，`examples/d1/app/api/notes/route.ts`示例GET/POST；不在当前根app路由树中，不能声称已部署`/api/notes`或已同步备忘。 |

`dist/`、`node_modules/`、`.vinext/`、`.wrangler/`、`.sites-runtime/`是构建、依赖或运行状态，不在本包。新包另有轻量生成类型声明 `.next/types/routes.d.ts` 和 `next-env.d.ts`，已列入manifest；因此不应泛称完全没有任何生成文件。这两项不是可运行构建产物。不要将本机 cookie、数据库状态、安装缓存或 `.env*` 一起打进公开 ZIP。

#### 数据库与过时模板说明

旧 `README.md` 所称“`db/schema.ts` 故意为空”已过时；实际 schema 定义 `api_attempt_windows` 和 `api_cost_reservations`，只服务于 API 尝试次数与费用额度预留。旧 README 示例 `drizzle/0000_example.sql` 也不存在；实际首个 Drizzle 迁移是 **`drizzle/0000_robust_richard_fisk.sql`**。

仅浏览默认关闭 API 的静态原型不需要先开启数据库业务。若确实要检查本地 D1，应先成功构建生成配置，再在**尚未应用该迁移的新本地数据库**上运行以下一条完整命令；Windows PowerShell、macOS 和 Linux 都可使用：

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_robust_richard_fisk.sql
```

此命令只修改本机 `.wrangler/state`，不是生产迁移。不要改成 `.wrangler/state/v3`，不要对已应用的数据库重复执行。`npm run db:generate` 是 schema 变更后生成迁移的命令，不是应用迁移，也不是首次浏览 UI 的必需步骤。`scripts/vite/sites-vite-plugin.ts` 构建时复制的是 `drizzle/`，因此不能只修改 `migrations/` 就声称托管迁移已同步。

### 配置和独立部署边界

#### 不要假设复制 env 文件即完成绑定

`.env.example` 只是变量清单，默认 `API_TRANSCRIPTION_ENABLED=false`；没有共享 `OPENAI_API_KEY`，也不应新增共享密钥兜底。源码的真实读取链是：

1. API 路由从 `cloudflare:workers` 导入 `env`。
2. `runtimeConfig(env)` 读取 `API_TRANSCRIPTION_ENABLED`、`API_EXPECTED_ORIGIN`、两个预算值和 `env.DB`。
3. `/api/session` 另外读取 `SITE_OWNER_USER_ID`。

当前自编 `scripts/sites-env.mjs` 是工具日志和状态路径初始化器，**不是业务 dotenv 加载器**；`vite.config.ts` 也没有把这些业务值显式映射到 `vars`。不能仅凭 `.env` 文件存在，便宣称它已进入 Cloudflare Worker 的运行时绑定。独立部署或增加本地 API 测试时，先按实际使用的 Cloudflare/Vite/Wrangler 启动链验证变量加载方式和生成配置，再验证 `/api/session`；不能把客户端 `VITE_*` 变量作为秘密存储。普通静态预览无需填这些生产配置；当前生产已批准的非秘密值另见7.8，不等于允许复制生产身份或key。

#### 启用服务前必须落实的事项

- `.openai/hosting.json` 的 `project_id` 当前为空；Vite 里的 D1 数据库 ID 是本地模拟占位。部署者必须使用自己有权管理的项目与真实 D1 绑定，并执行正确迁移。不要复制历史环境标识或占位 ID 当作生产配置。
- `server/runtime-config.mjs` 中的 `SITE_ID` 是独立部署占位字符串，必须改为该部署唯一且非秘密的站点标识。**代码没有自动拒绝此占位字符串**，人工检查是启用门槛之一。
- `API_EXPECTED_ORIGIN` 必须是精确 HTTPS origin，不能带路径或末尾斜杠；预算值必须为正的安全整数，且每请求最大预留额不大于每日预算。有效配置和存在 `DB.prepare` 只是开关条件，不等于真实上游、鉴权和数据库均已验收。
- `SITE_OWNER_USER_ID` 是拥有者 UI 标记的比较值，不可替代身份验证或数据库授权策略；不要为演示伪造真实拥有者身份。
- 托管平台负责 `/signin-with-chatgpt`、`/signout-with-chatgpt`、`/callback` 及身份头注入。普通静态托管或自行启动 Worker 不会自动获得这些能力。必须先有可信的认证入口，剥离客户端可伪造的 `oai-authenticated-user-*` 头，再由服务端认证层注入可信身份，或另行设计并验收完整认证方案。
- **严禁把手工添加身份头、硬编码用户 ID、portable 模拟 cookie 或关闭认证当作生产登录方案。** 根页面公开也不意味着API可匿名调用；静态资源里不能放秘密。
- 生产发布、开启 API、调用可能计费的服务、迁移远程数据库、恢复并再分发模型素材均应单独取得授权，并设置回退方案；这份公开源码交付本身没有授权自动执行这些动作。

对新的独立部署先保留API关闭，只完成本地代码和界面验证；只有上述边界落实并按验收计划逐项验证后，才讨论启用服务。不要在公开手册、提交、构建日志或截图中留下真实密钥、真实用户资料、私有服务标识或真实患者内容。

## 4 工作台各模块的真实行为

### 4.1 文字提取与核对建卡

`public/app.js` 是经典脚本，不是 React 业务组件。顶层 `tasks`、`alarmQueue`、`render()`、`paintSaver()` 等由后续同页面脚本共同使用。修改全局变量、脚本顺序或把它们随意改成 ES module，可能让后面的展示包装与语音模块失效。

`parseInput()` 只做窄规则提取：阿拉伯数字床号、`数字分钟后`、`示例患者甲/乙/丙/丁`、`测血压` 或 `皮试`。它不是通用 NLP，也不会自动识别人名、全部知识条目或临床语义。结果进入 `openConfirm()`：床号最长12、姓名30、事项80字符，时间输入的 HTML 范围1–10080分钟，必须勾人工核对。普通任务以**点击创建时的本机时间**起算。

`testTask()` 是10秒前台提醒测试，床号 `TEST`，不是一分钟震动测试。源码仍保留 `voiceDemo()` 模拟填充函数，当前新百炼入口不调用它；它本身没有录音或调用识别。主表单逻辑在 JavaScript 中检查时间有效且大于0；七天上界主要来自 HTML 约束，不能把浏览器表单约束误说成可信服务端业务校验。

### 4.2 任务状态与留痕

状态由 `status(t)` 动态算出：`done === true` 优先为完成；否则 `due <= Date.now()` 为到时；否则待处理。没有持久化独立 `status` 字段。`ack` 不参与完成判断，到时且已知悉仍是未完成任务。

任务列表支持全部/待处理/到时/完成过滤，以及床号、姓名、事项合并的子串搜索；未完成排前，再按计划到时排序。详情展示完整 `log`。`event()` 追加 `{at,label,detail,actor}` 后写 localStorage；`actor` 固定为代码内的演示护士标签，并非当前登录身份或可信电子签名。

- “任务创建”：核对后建卡并记录计划时间。
- “到时提醒”：前台轮询发现到时，且该任务没有此标签时才追加；不是操作完成或消息送达凭证。
- “已知悉提醒”：仍待实际操作完成。
- “工作完成”：完成表单勾选后写 `done=true`、`doneAt=Date.now()`；可选备注最多1000字符。
- “追加更正”：只追加说明，不覆盖旧记录，不改计划时间或完成状态。

本地数据可被浏览器用户修改/删除，无签名、不可篡改账本、服务器时间或医院身份审核；“留痕”是产品原型行为，不是合规审计保证。

### 4.3 到时提醒与告警队列

`app.js` 每1000ms检查一次，找一个未完成、到时、尚未入本轮 `noticed` 集合且未知悉的任务，送入 `enqueueAlarm()`。`noticed` 和队列只存在内存；刷新后未知悉的逾期任务可能重新提醒。

入队按 ID 去重；**入队时选一次音效**，同一事件以后重复不重新随机。多个提醒依次排队。入队会暂停打开的模态框、展示屏保，第一项启动循环。循环先请求声音/硬件震动，若播放音轨则**等待整条音轨结束，再等4/8/12秒**（默认4秒），不是每4秒强行叠播30秒音轨。界面设置改变间隔会重启当前循环。

- 圆形“知悉并停止当前提醒”按钮：移出队首、停止当前声音/震动，任务记 `ack`，如有下一项继续提醒。
- “返回工作台”：隐藏告警屏保但提醒继续，工作台可再次返回告警。
- “完成留痕”：与知悉是另一条路径。当前实现没有顺便从活动告警队列删除该任务，见已知问题。
- 一分钟震动测试：独立60秒倒计时，开始时不立即震动；结束后入测试告警队列，不创建护理任务，不增加完成数量。取消只取消这次测试倒计时/播放，不等于所有告警皆取消。

### 4.4 每日记录和总结

默认视图 `history` 显示**本机今天**发生的日志，任务详情仍可看该任务全部日志。总结由 `renderDailySummary()` 生成，不调用大模型：今日创建任务数、今日至少有一次到时提醒的任务数、今日完成任务数、今日新增中尚未完成数；另报全部未完成数。按任务去重而非音效轮数计数，且受当前搜索条件影响。日期来自本机时区，不是服务器班次、医院时间或跨日交班定义。

### 4.5 备忘录

`public/memos.js` 按本地日期展示备忘；文本只存本浏览器。支持新增、编辑、软删除、恢复，**不建提醒，不计入完成数量**。编辑把旧文本写入 `history`；旧日期没有同样保存在历史里，不能说具备完整版本审计。软删除不是物理擦除，删除内容仍在 localStorage 中。

备忘语音按钮现调用 `showAPIRecognition('memo')`，使用同一个新百炼语音页面；真实文本经人工核对、采用、确认回传后只追加到备忘编辑框，不自动保存。任务目标则只追加主输入框，两个目标不相互替换。详情见第6节。

### 4.6 六条音效和音量

`public/sounds.js` 管理 `public/assets/sounds/motor-1.mp3` 至 `motor-6.mp3`，六文件均保留且各721649字节；本次 `ffprobe` 核查每条约30.040816秒，界面“30秒”是近似描述。由于 HTML 的 `<base href="/">`，`assets/sounds/...` 相对引用指向站点根素材，不能在检查磁盘时漏掉 `public/` 层后误判缺失。

按项目 `测血压 / 皮试 / B超 / 测血糖 / 测体温 / 其他` 配置固定1–6或随机；事项含“超声”归 B超。当前告警保持入队时选曲，修改映射不换当前曲。试听不能覆盖活动告警；停止试听入口也不能替代知悉告警。

音量控件是0–200%，内部增益0–2，默认0.7（70%），用 Web Audio Gain 加压缩器播放。200%是数字增益，不保证感知响度翻倍、不提升系统硬件音量，也不是硬件震动强度；高音量须人工判断。加载/解码失败时回退约0.6秒合成低沉双脉冲；音频上下文必须先在用户交互中解锁。关闭网页音效不保证系统静音、通知策略或硬件震动行为。

### 4.7 十秒屏保、睡脸和真实电量

`app.js` 记录可信的 `pointerdown / keydown / input / wheel` 活动，空闲达到10000ms且无打开的模态框时可进入屏保；展示包装还防止覆盖正在编辑的控件和 `isLocalVoiceListening()` 表示的语音工作。500ms轮询意味着不是精确到毫秒的操作系统锁屏。

`tuotuo.js` 只包裹渲染/反馈；普通待机用睡眠角色，告警用唤醒角色。`tuotuo-saver.js` 展示至多三条最早的、未完成且尚未到时任务倒计时，卡片不显示姓名、床号、事项；告警卡也遮蔽这些内容。它并没有实现安全锁屏、重新认证或防肩窥的完整系统，任务详情仍能在工作台看到。

电量只在安全上下文且 `navigator.getBattery` 可用时读取真值，监听电量和充电变化；否则显示“电量不可用”，不虚构百分比。这个支持情况、移动浏览器功耗和硬件提醒尚未经真机验收。

### 4.8 TUOTUO 开场动画

`tuotuo-intro.js` 将 `TUOTUO妥妥` 拆为8个字符展示；1250ms开始收拢，2050ms锁定组合，3950ms结束主体，另有620ms离场。首次标签页会话播放，使用 sessionStorage 标记，可显式重播；支持跳过、Escape，尊重 `prefers-reduced-motion`。已有未知悉到时任务、屏保、模态框或活动语音时不开始；页面隐藏或屏保出现时退出。仅展示动画，不录音、不播音、不联网、不改变任务。v22已真实派发告警事件并加入屏保观察兜底；合成事件测试仍不代表真实麦克风/上游取消已验。

### 4.9 桌面和390px竖屏切换

`tuotuo-portrait.js` 在视口至少761px时允许把**同一文档**切到390px居中布局，保存非敏感布局偏好；≤760px隐藏工具栏并采用实际响应式布局，重新变宽后恢复偏好。没有 iframe、重新加载或第二份 tasks 状态。主体和屏保390px、内容/弹窗在既有桌面测试中测得358px。

基础样式来自 `style.css`、`tuotuo.css`、`tuotuo-intro.css`、`tuotuo-saver.css`；`scripts/generate-portrait-css.mjs` 将390px下适用规则作用域化为 `html.phonePreview`，把 vw 按390px折算。改基础样式后运行生成器再审查 diff，不要只手工改生成的 `tuotuo-portrait-responsive.css`。真实窄屏仍需独立验收；390px桌面预览不模拟 iOS、设备权限、触屏键盘、DPR、安全区或后台行为。

## 5 前后端数据流和持久化

### 5.1 四条业务数据流

```text
文字输入 → 窄规则提取 → 人工核对 → Task[] / localStorage
     → 前台轮询 → 告警队列 → 知悉ack（未完成）→ 完成表单 → done/日志/总结

百炼语音页：本机录音或导入转换 → 本机预览（不上传）
     → 本次设置/个人key/目的地费用同意 → 手动发送
     → 认证/D1预留 → 指定官方百炼endpoint → 待核对真实文本
     → 人工采用草稿 → 任务输入或备忘编辑框（不自动创建或保存）

知识JSON → 名称/别名候选 → 待补充研究草稿（不计时）
```


工作台任务、备忘、知识草稿**不会写入 D1**。D1只存 API 额度与请求幂等元数据。API 音频/密钥/结果没有本应用设计的服务器持久化；这不等于浏览器扩展、代理、宿主平台或第三方提供商绝无自身处理/日志，部署前须另审。

### 5.2 浏览器存储键

| 介质和键 | 值 | 边界 |
| --- | --- | --- |
| localStorage `care-notes-demo-v1` | `Task[]` | 任务、日志、原始文本，可能含用户输入；未加密、未按登录用户命名空间隔离 |
| localStorage `care-daily-memos-v1` | `Memo[]` | 含软删除及历史文本，非云同步 |
| localStorage `care-research-drafts-v1` | `ResearchDraft[]` | 未计时、待审核草稿 |
| localStorage `care-sound-map` | 项目名到 `'random'` 或 `'1'..'6'` 的对象 | 缺映射默认随机 |
| localStorage `care-motor-volume` | 字符串形式增益0–2 | 默认0.7，非0–200的原始滑条值 |
| localStorage `tuotuo-layout-preview-v1` | `'portrait'` 或 `'desktop'` | 非敏感布局偏好 |
| sessionStorage `tuotuo-intro-seen-v1` | `'1'` | 每标签页会话的开场已看标记 |
| sessionStorage `tuotuo-asr-handoff` | `{text,destination,createdAt}` | 独立/asr页人工采用草稿回传；读取即删除、仅接收小于5分钟、≤12000字符；不是key/音频 |
| 历史CacheStorage `nurse-asr-pinned-decoder-<sha256>` | 历史本地ASR模型缓存 | 当前UI不启用，不代表新包附模型或缓存可用 |

现有“清除本机演示数据”只清任务与知识草稿，**不清备忘、备忘历史、音量、音效映射、布局、开场标记、ASR草稿handoff或历史模型缓存**，也不是账户注销清理。想做全量擦除应先设计确认/导出及精确范围，不能在接手时无授权调用 `localStorage.clear()`。

### 5.3 实际记录结构

以下 TypeScript 只是说明现有运行对象，仓库并没有这些完整持久化类型与迁移器：

```ts
type Task = {
  id: string; bed: string; name: string; title: string;
  due: number; created: number; // epoch milliseconds，本机时间
  done: boolean; ack: boolean; raw: string; test: boolean;
  doneAt?: number;
  log: Array<{ at: number; label: string; detail: string; actor: string }>;
};
type Memo = {
  id: string; date: string; // YYYY-MM-DD，本地日期
  text: string; created: number; updated: number; deleted: boolean;
  history: Array<{ at: number; text: string }>;
};
type ResearchDraft = {
  id: string; entryId: string | null; title: string; bed: string; name: string;
  stage: string; anchor: string; explicitTime: string; orderNote: string;
  approval_status: 'research_only'; auto_start_allowed: false;
  created: number; updated: number;
};
```

加载任务/备忘/草稿时只有 JSON 解析和顶层数组判断，缺少逐字段强校验/版本迁移。手改、损坏或老版本数据可能使 `log`、`due` 等访问失败。`alarmQueue`、`noticed`、当前过滤/视图、录音PCM、普通转写预览、API设置/key/同意只在内存或DOM；独立页面人工采用文本另有上述sessionStorage交接例外。

### 5.4 跨用户边界是两套不同机制

服务器配额用托管平台稳定用户 ID 与站点 ID 隔离；请求体不允许提交 `userId`。但是浏览器工作数据按**origin + 浏览器配置文件**共享 localStorage，并非按登录身份隔离；同一电脑同一浏览器换登录账户可能看到上一个账户的演示数据，另一设备又不会自动得到这些数据。屏保遮蔽不是用户权限。若将来需要多人使用或真实资料，必须先设计身份绑定、命名空间、授权、加密、迁移、删除和审计，不能只加一个登录页面便声称安全。

## 6 当前单一百炼语音界面和历史语音代码

### 6.1 当前入口与实际页面结构

v22把旧本地/browser/OpenAI三套面板从 `public/legacy/index.html` 移除，当前工作台只显示一个“百炼语音”入口。页面只加载新 `asr-integration.mjs`，不加载旧 `voice-ui.mjs`、`local-asr-ui.mjs`、`api-voice-ui.mjs`。这些历史文件部分仍在公开源码中，**存在不等于当前运行**，不应据旧文件推导当前UI字段或发送策略。

`public/asr-integration.mjs` 打开同源iframe覆盖层：`/asr/?embedded=1&destination=task` 或 `destination=memo`。这是语音子页面，不是第二套工作台；原工作台和任务/提醒定时器留在原文档继续运行。iframe明确允许麦克风，但仍须用户操作和浏览器权限，打开面板本身不申请录音或上传。390px布局切换本身仍只修改同一工作台的CSS状态，不产生iframe；不要把两种机制混淆。

| 文件 | 当前职责 |
| --- | --- |
| `public/asr/index.html` | 语音、待核对、个人API设置、已核对工作草稿四视图DOM；只提供百炼北京/新加坡选项 |
| `public/asr/app.js` | 录音/暂停/结束、导入转WAV、本次设置与key、同意、手动发送、核对与草稿回传 |
| `public/asr/styles.css` | 独立语音页面样式，最大壳宽440px、窄屏/嵌入模式/降低动画支持 |
| `public/asr-integration.mjs` | 覆盖层、同源message、task/memo目的地、焦点/inert、告警关闭、独立页面草稿接收 |
| `public/asr-integration.css` | 覆盖层及390px模式布局 |
| `public/api-recorder.mjs` | AudioWorklet采集、暂停恢复、30秒上限、WAV编码、释放/取消 |
| `public/speech-endpoint.mjs` | 纯本地能量端点检测，不识词、不联网、不上传 |
| `public/local-asr/pcm-worklet.mjs` | 当前录音仍复用的PCM采集worklet；不要因“旧本地识别停用”就删除它 |
| `public/api-models.mjs`、`api-request.mjs` | 官方provider/model约束、session状态、请求和安全错误提示 |
| `server/provider-transport.mjs` | 百炼JSON/base64上游与历史OpenAI multipart兼容；提取真实返回文本 |

### 6.2 本次设置和录音行为

新UI默认设置仅在内存：

```js
{ provider: 'bailian-cn', workspace: '', model: 'qwen-audio-3.1-asr-flash' }
```

用户手动填本人的百炼key，选北京/新加坡，必要时填业务空间ID，点击“保存本次设置”。这不是保存到账户或磁盘：没有settings/key的localStorage、服务器secret或共享key读取。表单与已保存设置不一致、key更改后未保存，都不能发送。地域/provider或workspace变更会清key；模型、地域、workspace、key、音频变化均撤销先前发送同意。

`createRecorder()`要求安全上下文、AudioContext、AudioWorklet、`getUserMedia`；开始按钮触发后才申请麦克风。录音本机采集，混为单声道，输出16000Hz、PCM16 WAV；暂停使用AudioContext suspend并保留剩余录音时长，恢复继续，停止后释放输入轨道/音频图并等待flush最多300ms。尾段确认失败不会悄悄把部分数据发上游。

新UI启用纯本地能量检测：默认持续语音判定最低220ms；已检测到语音后约1800ms低能量停顿停止，初始约8000ms未形成语音停止，活动录音总上限30秒。阈值随噪声估计调整，依据PCM块而非准确词句结束；噪声/弱声可能误判，**不是医学级VAD或实时ASR**。暂停段不计入采集音频，30秒是本轮活动录音上限，不应描述为从打开页面起30秒。

**手动停止、静音停止、达到时长上限都只产生本机预览，不上传。** 未检测到明显语音会提示但仍可试听，不能保证自动检测排除所有无语音。页面波形使用预设条形与动画，不是实际音量计，也不能作为麦克风检测成功的证据。

### 6.3 文件导入与发送门槛

文件选择先在本机处理：输入最多10MiB；浏览器 `decodeAudioData` 必须支持它、解码时长>0且≤30秒；混为单声道再用 `encodeWAV` 转成16k PCM16，作为本轮预览。支持哪些压缩格式取决于浏览器，不能承诺所有MP3/WebM均可；服务器依然只接受经过校验的PCM16 WAV，不直接接收任意原始文件或外部音频URL。

试听后，用户须勾选**本轮音频与key发到所显示的具体地域/模型/endpoint并承担个人费用**，再点“手动发送这段音频”。后台状态、未连接会话、无文件、未勾同意、不匹配设置均不能发送。保存设置、导入、停顿、预览、切页都不是上传授权。

发送前清掉旧结果/核对状态；启动请求后清key输入与已保存key绑定，finally撤销发送同意。没有自动重试或地域fallback。下一次发送需要重新提供/保存本人key并重新同意。取消已经到达上游的请求不能保证未计费。

### 6.4 核对后只回传草稿

上游成功文本进入“待核对”视图，可以回听本轮音频；编辑会撤销核对。勾“我已核对转写内容”后采用到可编辑的工作草稿，再由用户点回工作台：

- `destination=task`：追加到 `#input`，不调用 `parseInput()`，不建卡、不修改deadline、不标完成；后续仍走主工作台人工核对。
- `destination=memo`：追加到 `#memoText`，不自动保存、不新建提醒、不计完成数量；原有编辑内容保留，中间加换行。
- iframe回传只接受 `e.origin===location.origin` 且 `e.source===当前frame.contentWindow`，文本字符串≤12000字符。
- 独立 `/asr/` 页面返回工作台时，暂存 `sessionStorage['tuotuo-asr-handoff']={text,destination,createdAt}`；主页面读取即删除，接受年龄0≤age<300000ms和≤12000字符的草稿，只使用一次。**所以不能说“任何转写文本从不进入浏览器存储”**；key/音频不持久化，但已人工采用草稿有这一短时传递例外。

草稿可复制到剪贴板；这是用户主动动作，不是自动保存或云同步。sessionStorage未加密，5分钟是应用接收有效期，不是浏览器自动定时擦除承诺；如果未返回工作台，数据可能留到会话结束。共享设备仍只应使用虚构资料。

### 6.5 关闭、后台和提醒抢占

v22已修复旧告警事件缺线：`enqueueAlarm()`现在真实派发 `care-alarm-start`，新整合层监听后向frame发送同源 `tuotuo-asr-interrupt`，移除overlay并恢复工作台；另有屏保hidden变化的MutationObserver兜底。因此旧手册“监听但不派发”的缺陷不再适用于v22。

关闭/返回、Escape、pagehide、页面后台会停止录音或取消请求、清key、撤销同意，代际标记忽略晚到结果；pagehide清音频/结果，overlay移除使子页面卸载。返回工作台派发 `tuotuo-asr-return` 更新空闲时钟，避免刚回来马上误入屏保。告警抢占不知悉、不完成任何任务，不应解除正在显示的屏保对背景的inert。

后台 `suspend()` 并不无条件抹掉所有已有音频/核对草稿，主要清key/取消活动处理与暂停播放；这是当前行为，不能夸大成安全内存擦除。JS字符串、网络层与浏览器扩展行为仍不在密码学擦除保证内。实际手机来电/权限弹窗/音频设备切换与后台行为未做真机验证。

### 6.6 保留但不启用的旧本地识别代码

历史 `voice-intake.mjs / voice-ui.mjs` 是浏览器SpeechRecognition本地语言包方案；历史 `local-asr-ui.mjs / local-asr/*.mjs` 是Transformers.js+Whisper WASM方案；历史 `api-voice-ui.mjs` 是旧API面板绑定。**当前工作台不加载这些UI，也不提供旧本地识别入口。** 其中函数/旧提示仍可能提“本地识别”或“本机已配置key”，不应误当已实现新功能；新活跃发送没有本机/服务端key resolver。

公开版仍排除 `public/local-asr/models/whisper-tiny/` 的配置、词表、encoder与decoder二进制，以及 `public/local-asr/example/fixture.f32` 和 `provenance.json`。保留加载器和运行库仅供历史参考；没有训练脚本、训练数据交付、微调成果或医学准确率证明，不是可用离线语音包，不是为本项目训练的模型。若恢复旧路线，须重新审许可、来源、文件完整性、UI接线、取消生命周期和整个新provider契约，不能把旧脚本直接挂回页面。

历史decoder元数据仍在 `split-decoder-manifest.mjs`：合并30719241字节、SHA-256 `25e807a962b6349356d0ea5d0dfe530b7e5bf0e2a484aeca0359d03143faddd3`；part1为16777216字节、`48573a654213b2dec0acbadcd07f1cb6d66d824b10ff172b8686415e2eed71de`，part2为13942025字节、`238b2c2cb5bff6df5971fa326fd82591d857b139b458b973ebf7c7ac4db8f05b`。这些数值不代表资源在当前包内。历史来源与权利限制看 `public/local-asr/LICENSES.txt` 和根notices；不得从未审原包补回。

## 7 v22 转写接口与独立部署契约

### 7.1 当前UI与服务端兼容范围

当前公开UI**只提供百炼北京和新加坡、一个模型 `qwen-audio-3.1-asr-flash`**。`public/api-models.mjs` 还保留OpenAI服务端兼容，因此不能写成“整个后端只接受百炼”。准确映射：

| `provider` | 允许模型 | 无workspace时基础域名 | 当前UI |
| --- | --- | --- | --- |
| `bailian-cn` | `qwen-audio-3.1-asr-flash` | `https://dashscope.aliyuncs.com` | 北京，默认 |
| `bailian-intl` | `qwen-audio-3.1-asr-flash` | `https://dashscope-intl.aliyuncs.com` | 新加坡 |
| `openai` | `gpt-transcribe`、`gpt-4o-transcribe`、`gpt-4o-mini-transcribe`、`gpt-4o-mini-transcribe-2025-12-15`、`whisper-1` | `https://api.openai.com` | 不展示，历史协议兼容 |

`DEFAULT_ASR_MODEL` 已变为Qwen；`defaultProvider(model)`对Qwen返回`bailian-cn`，其他允许模型返回`openai`。Qwen不能搭OpenAI、OpenAI模型不能搭百炼；拒绝不在精确名单的provider/model，不尝试其他地域或模型。

百炼路径固定 `/api/v1/services/aigc/multimodal-generation/generation`。workspace可选，若有，须为1–63字符ASCII DNS label：首尾字母或数字，中间可含连字符；拒绝点、斜杠、协议、账号、换行、中文和首尾连字符。北京域名固定组合为 `https://<workspace>.cn-beijing.maas.aliyuncs.com`，新加坡为 `https://<workspace>.ap-southeast-1.maas.aliyuncs.com`；**不是让用户填任意URL**。OpenAI不允许workspace，固定路径 `/v1/audio/transcriptions`。

上游契约依据为 [阿里云百炼非实时ASR HTTP文档](https://help.aliyun.com/zh/model-studio/qwen-audio-asr-http-api)。官方提供两地域专属workspace域名；本站同时保留上述基础域名。key必须与用户账户、地域、业务空间、模型权限相符；本次未用真实key证明可调用。不要把HTTP规范查阅等同于真实账户验收。

### 7.2 数据和费用边界

浏览器把音频+本人当次key发到**同源本站认证后端**，后端再去所选官方provider；不是浏览器直连，不是拥有者付费代理。key仅在页面/请求内存短暂使用，不写localStorage/sessionStorage/D1、不读取上传包 `.env.local`、没有server-key resolver或共享兜底。原上传包里的本地服务器、环境文件和安装器没有作为隐式key来源搬进这套安全部署。

录音、本机静音端点检测、设置保存不收费；明确手动发送后可能产生**用户本人百炼账户费用**。站内D1预留只限制获准请求次数/保守单位，不查询余额、不保证provider账单硬上限。取消、超时或失败可能已收费且不自动重试。

### 7.3 GET 会话检查

```http
GET /api/session
```

返回四个布尔：

```json
{"authenticated":false,"backendReady":true,"connected":false,"owner":false}
```

这是形状示例，不是固定生产响应。`backendReady`独立于登录：运行配置enabled且DB两表 `SELECT site_id ... LIMIT 1`可读就为true；`authenticated`由可信身份helper决定；`connected=authenticated && backendReady`；`owner`为可选拥有者ID比较，仅展示用途。

因此匿名用户可以看到“后端已就绪、请先登录”，而不是错误认为后端坏了。GET无上游调用；表可读仍不证明可写/索引约束/余额/模型权限/真实网络。响应 `Cache-Control:no-store`。`readAPIStatus()`保留backendReady并严格归一化authenticated/connected，不把ready当授权。

### 7.4 POST 请求字段

```http
POST /api/transcriptions
Origin: <精确配置的 HTTPS origin>
Idempotency-Key: <16至80位 A-Z a-z 0-9 _ ->
Content-Type: multipart/form-data; boundary=<FormData自动生成>
```

浏览器同源credentials、no-store、redirect:error。服务端检查Origin头和请求URL的origin都精确等于配置值。有界读取整个multipart最多2097152字节。

| 字段 | v22要求 |
| --- | --- |
| `file` | 必须一次，非空Blob≤1945600字节，真实PCM16 WAV格式/时长检查 |
| `api_key` | 必须一次，字符串8–256字符，不含空白；只是格式检查 |
| `model` | 必须一次，严格模型/provider匹配 |
| `consent` | 必须一次，新客户端精确发送 `send-to-provider-paid` |
| `provider` | 新客户端总发送一次；服务端兼容省略或空值时按model推导；重复拒绝 |
| `workspace` | 新客户端总发送一次，可空；服务端可省略，重复拒绝，非空须DNS label验证 |

只允许这些六种字段。前四项各恰好一次；后两项至多一次。不要将旧v20“四字段契约”当作当前全契约。为了旧OpenAI客户端，只有provider为openai时才兼容旧consent `send-to-openai-paid`；百炼绝不接受这个旧同意值。workspace格式错误当前映射400 `ASR_MODEL_NOT_SUPPORTED`，不是单独WORKSPACE_INVALID HTTP响应。

身份来自可信入口，不允许body `userId`；也不接受 `base_url`、外部音频URL、language、热词、说话人分离等额外参数。两地域选择不是任意代理配置。

### 7.5 实际上游请求和响应提取

百炼请求由 `server/provider-transport.mjs` 组装，header为本人Bearer key、`Content-Type:application/json`、`X-DashScope-SSE:disable`，`redirect:error`，不启用streaming：

```json
{
  "model": "qwen-audio-3.1-asr-flash",
  "input": {"messages": [{"role": "user", "content": [
    {"type": "input_audio", "input_audio": {"data": "data:audio/wav;base64,<本次已校验WAV>"}}
  ]}]},
  "parameters": {"format": "wav", "sample_rate": "16000"}
}
```

`sample_rate`取服务端WAV校验得到的实际采样率并转字符串；UI通常输出16000，但服务端允许8–48k范围，不能写死所有请求都16000。编码字节缓冲finally清零，key变量清空；JSON字符串和网络栈仍不保证物理擦除。后端从返回依次尝试 `output.text`、`output.output.sentence.text`、`output.sentence.text`、`output.sentences[].text`拼接；这不表示本UI支持说话人分离配置。

历史OpenAI兼容发送multipart `file,model,response_format=json`，提取顶层text。所有provider均只调用一次，不重定向、不自动重试。

成功返回：

```json
{"code":"TRANSCRIBED_REVIEW_REQUIRED","text":"待人工核对的真实转写","requestId":"可选服务商请求标识"}
```

`requestId`仅当上游 `request_id` 为1–100位字母数字下划线连字符时返回；没有时省略，**不是客户端Idempotency-Key的回显**。上游body限制262144字节；text须字符串≤12000字符，空白text返回422 `NO_SPEECH`。顶层data.code为真值则视为provider失败。客户端当前`submitAPIFile`成功只返回text，错误可带providerStatus/requestId供上层使用；不显示或透传原始provider错误body。

### 7.6 校验顺序、超时和错误码

顺序：必要配置 → POST → origin →5秒准备deadline →可信身份 →尝试计数 →幂等key →multipart/有界读取 →字段集合与前四项唯一性 →model/provider/workspace →provider/workspace重复检查 →consent →本人key →file/WAV →原子预留 →**60秒**provider deadline →一次调用 →最多256KiB结果解析。

| HTTP | code | 条件 |
| ---: | --- | --- |
| 503 | `BACKEND_NOT_CONNECTED` | 关闭或缺配置/依赖 |
| 405 | `POST_REQUIRED` | 底层handler非POST；route仅导出POST，框架可先处理其他方法 |
| 403 | `ORIGIN_REQUIRED` | 来源不符 |
| 401 | `AUTH_REQUIRED` | 没有可信身份；这是本地handler测试结论，非本次直接测得生产401 |
| 429 | `USER_LIMIT_OR_DUPLICATE` | 尝试超限、预算不足或重复幂等key |
| 400 | `REQUEST_ID_REQUIRED` | 幂等key不符 |
| 415 | `MULTIPART_REQUIRED` | multipart类型不符 |
| 400 | `INVALID_FIELDS` | 额外字段/前四缺失或重复/后两重复 |
| 400 | `ASR_MODEL_NOT_SUPPORTED` | 模型/provider不匹配或workspace/endpoint约束失败 |
| 400 | `CONSENT_REQUIRED` | 新同意值错误，或百炼用了旧OpenAI同意值 |
| 400 | `OWN_KEY_REQUIRED` | key格式不符 |
| 415 | `WAV_REQUIRED` / `AUDIO_INVALID` | 文件对象/大小或真实格式不符 |
| 408 | `REQUEST_TIMEOUT` | 显式超时/取消检查分支 |
| 502 | `PROVIDER_UNAUTHORIZED` | provider HTTP401/403，附`providerStatus` |
| 502 | `PROVIDER_RATE_LIMITED` | provider HTTP402/429，附`providerStatus` |
| 502 | `PROVIDER_BAD_REQUEST` | provider HTTP400/404/422，附`providerStatus` |
| 502 | `PROVIDER_FAILED_NO_RETRY` | 其他上游非2xx或返回业务error code |
| 502 | `INVALID_TRANSCRIPT` | 提取不到字符串或超过12000字符 |
| 422 | `NO_SPEECH` | 字符串为空/全空白 |
| 408或502 | `FAILED_NO_RETRY` | 其余异常；abort为408，否则502 |

multipart总流过大并非保证返回413，仍可能进入502 FAILED_NO_RETRY。异常处理不退额度、不自动重试。响应通常no-store/nosniff，route早期关闭分支仅明确no-store。客户端新版会解析错误JSON并由 `API_ERRORS`给出安全提示；不再像v20把所有非2xx一概改成TRANSCRIPTION_FAILED_NO_RETRY。`API_ERRORS`残留“本机已配置key”文案不是可用功能，当前根本没有此resolver。

### 7.7 音频校验和D1结构

WAV校验仍在 `server/audio-validator.mjs`：RIFF/WAVE、声明长度一致、PCM tag1、16bit little endian、1或2声道、8000–48000Hz、>0且≤30秒、单文件≤1945600字节；一个fmt一个非空data，fmt16或18字节且扩展长度为0；校验chunk边界/padding/byteRate/blockAlign/整帧，最多1024chunks，可含结构合法其他chunk。拒绝float、RF64、压缩音频伪装，格式通过不代表可懂语音或医疗正确。

实际SQL `drizzle/0000_robust_richard_fisk.sql`：

```text
api_attempt_windows:
  site_id TEXT, user_id TEXT, window_start_ms INTEGER, attempts INTEGER
  PRIMARY KEY(site_id,user_id,window_start_ms)
  全部NOT NULL；attempts>0；window_start_ms>=0
api_cost_reservations:
  site_id TEXT, user_id TEXT, request_id TEXT,
  budget_period_start_ms INTEGER, max_cost_micros INTEGER, created_at_ms INTEGER
  PRIMARY KEY(site_id,user_id,request_id)
  全部NOT NULL；max_cost_micros>0；两个时间列>=0
INDEX api_cost_reservations_period(site_id,user_id,budget_period_start_ms)
```

Drizzle TS键：attempts的 `siteId,userId,window,attempts`；reservations的 `siteId,userId,requestId,period,cost,created`。D1不存音频/key/转写/临床任务，任务和备忘仍在localStorage。

默认固定分钟窗60000ms最多3次，固定日窗86400000ms，按Unix epoch对齐，不是滚动窗口或本机日期。尝试检查早于body验证，非法body也可能耗一次尝试；音频通过后才做原子预算预留。单条upsert/INSERT SELECT保护并发和唯一性；幂等主键跨天保留，重复返回429而非重放第一次text。失败/取消/超时不退预留。

### 7.8 当前生产启用值与公开包默认值

**两个环境不能混写：**生产v22已在明确授权下配置并启用；新公开源码为了独立部署安全仍保持关闭样例和独立占位，不携带生产账户/数据库/站点私有ID。

| 配置 | 当前生产已设的非秘密值 | 独立公开包起点 |
| --- | --- | --- |
| `API_TRANSCRIPTION_ENABLED` | 精确字符串`true` | `.env.example`为`false` |
| `API_EXPECTED_ORIGIN` | `https://nurse-notes-demo.wiggly-char-1989.chatgpt.site` | 空；需替换为自己的精确HTTPS origin，无尾斜杠/路径/账号密码 |
| `API_MAX_COST_MICROS_PER_REQUEST` | `100000` | 空；部署者批准的正safe integer |
| `API_USER_DAILY_BUDGET_MICROS` | `1000000` | 空；正safe integer且≥单次值 |
| `SITE_OWNER_USER_ID` | 不需要用于启用转写 | 可选，仅owner展示，不当授权 |
| `SITE_ID` | 生产使用自己的稳定站点ID，不公开其值 | `server/runtime-config.mjs`公开占位；必须主动替换，不是现有env变量 |
| D1 `DB` | 两张配额表存在 | 自己的真实绑定+迁移；本地模拟不是生产数据库 |

当前生产每成功预留一次消耗100000单位，日预算1000000，因此**每个真实登录身份每固定日最多10次获准预留**，每分钟尝试最多3次。失败也占已预留的一次；并不是十次都能成功转写，更不是个人百炼真实账单最多某个金额。不要把单位名micros直接换算成经核实的provider计费保证。

公开 `SITE_ID`非空占位仍会通过现有非空检查，不能当自动安全闸门；启用前必须检查替换、可信认证、D1正确约束、精确origin和预算。不要设共享OpenAI/DashScope key，用户key必须每次手动提供。生产已启用不授权复制其身份、改公开包默认开关或自动发付费请求。

### 7.9 认证与生产检查边界

根页面公开直达 `/legacy/index.html`；API仍从可信托管入口取得 `oai-authenticated-user-id` 与 `oai-authenticated-user-email`，二者都需要，D1按稳定userId隔离。应用自身不验签身份头，独立部署必须剥离外来伪造头并由可信认证层注入；**不能把测试手构头用于生产登录**。登录不等于医院/组织成员授权，仍需另外访问策略。

`/signin-with-chatgpt`、`/signout-with-chatgpt`、`/callback`由托管层负责。v22已用支持的云浏览器打开正式登录链接，到达OpenAI欢迎登录页，**未输入账号、未完成用户登录**；不能据此声称真实会话与付费识别验收完毕。

普通Python HTTP请求遇到边缘403/1010而被阻止，没有绕过；因此没有直接实测生产匿名转写401。本地handler认证拒绝测试通过，只说明该代码条件，不替代生产链路证据。生产 `backendReady`、管理面配置和表存在也不证明真实提供商接受key/音频或计费成功。
## 8 知识库和所有保留素材

### 8.1 知识库的实际覆盖和 schema

`public/assets/nursing-knowledge.json` 本次本地解析结果：**26条、20个不同的 `source.url`、8个原始category**。`knowledgeGroup()`把心功能、心脏超声、呼吸功能、神经功能合并为“功能检查”，因此界面为5组；不是26个独立来源，也不是医院所有检查/护理项目全覆盖。

根元数据：`schema_version:"0.1"`、`created_on:"2026-10-30"`、`purpose:"voice_intent_and_draft_only"`、`clinical_execution_enabled:false`、`coverage_claim:"selected_common_projects_not_hospital_complete"`。

每条的键为：`id,name,aliases,category,scope,clarifying_questions,time_semantics,anchor_event,source,approval_status,default_delay_minutes,requires_order,requires_local_approval,auto_start_allowed,ui_hint,required_before_activation`。`source`含`title,url,verified_on,published_or_reviewed_on,scope_note`。所有条目 `approval_status='research_only'`、`default_delay_minutes=null`、`auto_start_allowed=false`，并要求医嘱和本地批准；客户端也按这三项安全状态过滤。

`required_before_activation` 记录 `patient_reference,specific_test,workflow_stage,confirmed_anchor,approved_order_or_protocol,explicit_timing,nurse_confirmation`；**这是资料要求清单，不是已经实现的临床授权状态机**。`knowledge.js` 没有把研究草稿升级成医嘱或自动执行的入口。

检索是名称与 aliases 的大小写不敏感包含匹配；多候选应交给用户选，不能从“皮试”“B超”等词擅自锁定具体操作/判读阶段。所有来源的 `verified_on` 是JSON原有的2026-10-30记录，不是本次重新浏览核验每个页面；来源是否仍可访问、是否更新、院内是否批准都须另外审核。来源国家/机构的流程不能直接照搬为本院默认倒计时。

| ID | 名称 | 原始分类 |
| --- | --- | --- |
| `beta_lactam_skin` | β内酰胺类药物皮内试验 | 护理与监测 |
| `tuberculin_skin` | 结核菌素皮肤试验 | 护理与监测 |
| `blood_pressure` | 血压测量与复测 | 护理与监测 |
| `pulse_oximetry` | 脉搏血氧测量 | 护理与监测 |
| `wound_dressing` | 术后伤口敷料护理 | 护理与监测 |
| `abdominal_ultrasound` | 腹部超声 | 影像检查 |
| `pelvic_ultrasound` | 经腹盆腔超声 | 影像检查 |
| `transvaginal_ultrasound` | 经阴道超声 | 影像检查 |
| `bladder_ultrasound` | 膀胱超声 | 影像检查 |
| `thyroid_ultrasound` | 甲状腺超声 | 影像检查 |
| `imaging_ct` | CT检查 | 影像检查 |
| `imaging_mri` | 磁共振检查 | 影像检查 |
| `imaging_xray` | 普通X线摄影 | 影像检查 |
| `functional_resting_ecg` | 静息心电图 | 心功能检查 |
| `functional_ambulatory_ecg` | 动态心电图 | 心功能检查 |
| `imaging_echo` | 超声心动图 | 心脏超声检查 |
| `functional_spirometry` | 肺通气功能检查 | 呼吸功能检查 |
| `functional_eeg` | 脑电图 | 神经功能检查 |
| `venous-blood-sampling` | 静脉血标本采集 | 标本采集 |
| `blood-glucose-specimen` | 血糖标本采集 | 标本采集 |
| `midstream-urine` | 中段尿标本采集 | 标本采集 |
| `timed-urine-24h` | 24小时尿液收集 | 标本采集 |
| `stool-specimen` | 粪便标本采集 | 标本采集 |
| `gastroscopy` | 胃镜检查 | 内镜检查 |
| `colonoscopy` | 结肠镜检查 | 内镜检查 |
| `bronchoscopy` | 支气管镜检查 | 内镜检查 |

### 8.2 保留素材清单

| 路径 | 内容与边界 |
| --- | --- |
| `public/assets/tuotuo/tuotuo-four-states.png` | TUOTUO四态图；生成和参考归属记录见相邻ATTRIBUTION，不代表角色自由许可 |
| `public/assets/tuotuo/tuotuo-sleepy-yawn.png` | 睡眠/打哈欠二态图；最终睡脸样式使用专用图，非真正连续睡醒动画 |
| `public/assets/tuotuo/ATTRIBUTION.md` | 保留图片来源说明，已去私有文件标识 |
| `public/assets/sounds/motor-1.mp3` 至 `motor-6.mp3` | 六条原音效，未编造作者或许可证，支持项目映射 |
| `public/assets/nursing-knowledge.json` | 26条研究候选资料，不作临床批准声明 |
| `public/assets/paper.svg`、`botanical-note.svg` | 原型装饰SVG素材 |
| `public/favicon.svg` | 网站图标 |
| `public/local-asr/vendor/transformers.min.js` | Transformers.js 3.8.1浏览器bundle；不是模型权重 |
| `public/local-asr/vendor/ort-wasm-simd-threaded.jsep.mjs`、`.wasm` | ONNX Runtime Web运行库；历史本地worker显式单线程，当前百炼UI不加载该推理库 |
| `vendor/shadcn-tailwind-4.13.0.css` | starter vendored样式，不等于工作台由全部shadcn组件构建 |

### 8.3 许可和 notices

本项目**没有新增统一 MIT/Apache 等根许可证**；GitHub公开不自动给予所有素材自由再分发权。具体看 `ASSET-RIGHTS-PENDING.md`、`THIRD-PARTY-NOTICES.md`、角色 `ATTRIBUTION.md` 与本地ASR `LICENSES.txt`。

| 材料 | 记录版本/许可 | 包内文字 |
| --- | --- | --- |
| Transformers.js | 3.8.1，Apache-2.0 | `public/local-asr/vendor/TRANSFORMERS-LICENSE` |
| ONNX Runtime Web | 1.22.0-dev.20250409-89f8206ba4，MIT及第三方声明 | `ONNXRUNTIME-LICENSE`、`ONNXRUNTIME-ThirdPartyNotices.txt` |
| Jinja bundle依赖 | 0.5.11，MIT | `public/local-asr/vendor/JINJA-LICENSE` |
| Sites Vite集成 | 保留源码，MIT | `scripts/vite/sites-vite-plugin.LICENSE` |
| shadcn vendored CSS | 文件名标4.13.0，MIT | `vendor/shadcn-tailwind-4.13.0.LICENSE.md` |

npm依赖由 `package-lock.json` 锁定，未把整个node_modules打包；各自许可仍适用。现有notices不是完整法律审计。转换权重、词表、示例音频已排除，图片、音效和知识的可再授权范围仍不能由接手模型擅自扩大。

## 9 验证证据和未验范围

### 9.1 v22代码及公开候选

功能源HEAD已核实为 `7acc3f2e5535647e61864bf29514d72570274225`。本手册更新时对该源代码实际重跑 `node --test tests/*.test.mjs`：**99/99通过**。公开脱敏候选另外已完成99/99、TypeScript `--noEmit`、`npm run build`，后两项是本次打包验证记录，不是假称本手册编辑过程又执行了一遍。

候选复用已安装锁定依赖，未做从零联网安装。测试音频是合成PCM、上游是mock，无真实key、真实患者音频或费用。公开candidate将preservation的内部认证模板绝对路径改成固定公开哈希，并按明确排除模型更新资源检查；原角色两张PNG和六段MP3未改。

| 测试文件 | 数量 | 范围 |
| --- | ---: | --- |
| `tests/api-request.test.mjs` | 4 | 新provider字段/错误提示、本人key清理、无重试 |
| `tests/asr-integration.test.mjs` | 8 | 同源iframe、task/memo只填草稿、焦点/inert、告警与屏保关闭、一次性handoff |
| `tests/asr-provider-safe.test.mjs` | 8 | 官方endpoint/workspace约束、Qwen JSON、返回提取、能量检测、独立发送同意、无本机key resolver、匿名ready与登录 |
| `tests/audio-validator.test.mjs` | 11 | PCM16 WAV结构、时长/大小/边界、中断 |
| `tests/handler.test.mjs` | 18 | 同源/身份/字段/配额/幂等、上游60秒deadline、响应和错误、无重试 |
| `tests/quota.test.mjs` | 10 | SQLite D1 shim的隔离、跨日幂等、12连接并发预算/次数争抢 |
| `tests/recorder.test.mjs` | 12 | 本机录音/flush/30秒/晚到轨道/编码/取消；部分UI测试仍针对旧面板，非新页面E2E |
| `tests/public-entry.test.mjs` | 1 | 根公开重定向且API认证保留 |
| `tests/preservation.test.mjs` | 3 | 核心保留资源/3处ASR挂钩的限定差异、认证helper、单一语音入口 |
| `tests/tuotuo.test.mjs` | 5 | 展示包装不改任务、编辑保护、当前单入口 |
| `tests/tuotuo-intro.test.mjs` | 7 | 伪DOM开场/跳过/焦点/reduced-motion/抢占 |
| `tests/tuotuo-saver.test.mjs` | 8 | 电量未知/更新、隐藏详情、3项倒计时/复用排序 |
| `tests/tuotuo-portrait.test.mjs` | 4 | 同文档390px、偏好/窄屏恢复、CSS断言 |
| 合计 | 99 | 不等于真实浏览器/设备/付费ASR验收 |

### 9.2 云端UI和部署事实

v22在2026-10-31 **04:45:56 UTC**部署成功，public，包含根入口修复、390px切换和单一百炼语音。已完成独立安全代码审查与支持的云Chromium UI检查：根工作台、单一语音导航、390px语音页/设置、任务和备忘草稿目标、原提醒栏等检查通过。独立审查不是形式化安全证明，云浏览器不是实体手机。

生产四项非secret变量已设置并启用，D1两表存在，数值见7.8。官方登录链接已从云浏览器到达OpenAI欢迎登录页，未填账号或完成登录。普通Python HTTP探测被边缘403/1010阻断，没有绕过；不能把这个结果改写成应用层401已测或推断API不工作。

### 9.3 明确未验证

- 本人百炼key有效性、地域/业务空间/模型权限、真实上游识别、provider账单/余额；没有真实付费转写验收。
- 已完成认证的真实用户端到端、两个真实账户的生产D1隔离与预算行为；代码测试通过不等于生产身份链已验。
- 实体iPhone/iOS/Android、真实麦克风、暂停/恢复权限、噪声/轻声/长停顿、后台锁屏/来电、硬件震动。
- 语音iframe真实音频资源释放、postMessage与frame卸载时序、录音中布局反复切换的设备矩阵。
- 新页面所有设置/文件转换/取消边界的完整浏览器自动化；部分recorder UI单测仍使用旧脚本，必须补当前页面测试。
- 从零Windows/macOS/Linux依赖安装、依赖漏洞/许可完整审计、完整辅助技术可访问性。`lint`没有被记录为已通过。
- 旧离线ASR恢复、缓存持久性、模型医疗准确率/专名与数字错误率。当前产品不启用旧本地路线。

### 9.4 已解决的历史问题

- v18公开根无条件登录并遇signin404：v21已修，v22已包含，**新版不需要再手动补入口diff**。
- v20告警监听但没有实际dispatch：v22 `enqueueAlarm()`真实派发，另有屏保观察兜底；旧缺陷不再列未修。
- 多套语音UI混杂：v22只加载新百炼语音页面，旧文件仅参考，不是需要恢复的功能缺失。
- 匿名把未登录误解为后端未配置：session新增backendReady分离身份；不能因此跳过登录。
- 上游错误过度统一：新provider错误码与中文提示已分类，原“统一TRANSCRIPTION_FAILED_NO_RETRY”描述失效。

## 10 仍需处理的问题和优先级

本手册只更新公开交接信息，没有改动源码。已修问题见9.4，以下是仍存在的代码边界/推断风险或未验工作。

| 优先级 | 问题 | 下一步和完成条件 |
| --- | --- | --- |
| P0 真实使用前 | 无真实认证+本人百炼key+合成/虚构音频付费验收 | 用户明确允许一次可能计费测试后才执行；记录结果/费用风险，不自动重试，不使用共享key |
| P0 独立部署前 | 公开SITE_ID占位非空会通过现有检查；身份头依赖可信入口 | 替换独立ID并增加占位fail-closed；伪造头必须被可信网关剥离，真实DB/HTTPS配置核验 |
| P1 | VAD按能量猜结束，噪声/轻声/长停顿可能误判 | 真实设备和噪声场景测停止率/截断，始终保留试听和手动发送，不宣传实时词识别 |
| P1 | 暂停只suspend音频图，未立即停止麦克风track | 文案明确暂停≠释放设备；验证平台麦克风指示，若需完全释放须重设计恢复流程 |
| P1 | 新页面录音/文件转换/暂停/iframe关闭缺完整真浏览器矩阵 | 为当前asr/app.js补集成测试，勿把旧API面板单测冒充新UI E2E |
| P1 | 已核对≤12000字符可经JS追加到maxlength5000的备忘框，追加长度缺统一上限 | 统一目的地长度/截断/提示策略，不静默丢内容；多次追加也需验证 |
| P1 | 独立/asr回传sessionStorage写入无catch；返回memo未主动展开memoPanel | 失败提供复制/保留草稿回退；正确展开目的地，别让用户以为结果丢失 |
| P1 | 本地任务/备忘/草稿未按登录用户隔离，多个标签无冲突处理 | 设计身份命名空间、迁移/删除/恢复和storage同步；未经批准不上传已有本地数据 |
| P1 | `doClear()`只清任务+研究草稿，不清活动队列/定时器、备忘/偏好 | 定义清除范围与确认文案；清任务后无悬挂告警；不能无授权全清浏览器数据 |
| P1 | 完成正在提醒的任务不自动移除其队列项 | 明确产品规则并测多项队列；ack不能变done，完成与停止是否联动须设计 |
| P1 | localStorage仅顶层数组检查，坏字段可使渲染失败 | 增加schema/版本迁移/坏数据隔离，不静默覆盖记录 |
| P2 | 设置“前台提示音”只改sound，实际告警读vibSound | 合并或澄清开关，真实试听验证 |
| P2 | 备忘换日期清editingMemo但保留文本，可能另存；软删/恢复无完整历史 | 明确编辑会话与历史策略、补取消编辑/跨日期用例 |
| P2 | 旧文件/不可达分支仍提本地识别或本机key，备忘placeholder过时 | 清理文案和死代码前确认当前依赖；保留pcm-worklet，不恢复未审resolver |
| P2 | 日期头跨午夜不主动更新、统计依赖重渲染 | 加跨日刷新；保持本机日和医院班次区分 |
| P2 | multipart总body超限可落502，ledger无归档/查询/退款 | 改安全结构化错误；保留跨日幂等，不定时删表冒充释放额度 |
| 持续 | 真实设备可访问性/后台提醒/语音质量未验 | 明确支持或不支持的设备/场景；不拿Web演示作护理可靠闹钟 |

## 11 接手验收矩阵

下面是继续开发的验收计划，不是声称每行已通过。所有数据用虚构资料；有费用、部署或远程数据库动作先授权。

| 项目 | 操作和通过证据 | 禁止误判 |
| --- | --- | --- |
| 新包完整性 | 校验新版ZIP SHA和manifest；确认归档根直接有package.json | 不用旧v20嵌套解压命令或旧哈希 |
| 干净安装 | 各平台新目录install:ci，记录OS/Node/npm/退出码 | 不擅自升级锁、关TLS或改代理来硬过 |
| 根和页面 | `/`直达legacy；`/asr/`和嵌入页面样式/脚本无404 | API认证不能因公开根被删除 |
| 原任务 | 缺字段阻止、人工核对才创建；ack后仍未done | 到时/录音停止/采用不能自动完成 |
| 留痕与总结 | 更正追加、按本机日期/任务去重、搜索范围一致 | 非医疗签名、非不可篡改日志 |
| 音效/屏保 | 六音效、整曲后间隔、0–200%、三项隐藏倒计时/电量未知 | 音效不等于震动，网页屏保不等于系统锁屏 |
| 开场/390px | 跳过/Escape/reduced-motion、桌面和≤760切换、草稿/计时不变 | 390px不是iOS模拟 |
| 单一入口 | 只有百炼语音，旧3面板/脚本不加载 | 保留历史文件不算启用 |
| 设置边界 | 北京/新加坡、workspace合法/非法、模型配对、改设置撤同意/清key | 不接受任意URL、共享key或自动地域fallback |
| 本机录音 | 真设备录/暂停/恢复/手停/1.8秒静音/8秒无声/30秒/flush | 所有停止都只能预览，暂停非立即释放track |
| 文件转换 | ≤10MiB和≤30秒、浏览器可解码/失败、取消转换、重选 | 原格式导入不是上游任意格式支持 |
| 发送授权 | 未保存设置/未登录/无key/无同意/后台都不上传 | 录完不能自动调用API |
| 草稿目标 | task/memo追加保留原文、不建卡/不保存、超长/多次追加 | 草稿不等于已批准记录 |
| message安全 | 他源、旧frame、错误类型、超长被拒绝；关闭恢复焦点 | same-origin检查不代表整站XSS审计完成 |
| 独立handoff | 5分钟内一次性、过期/未来时间拒绝、存储禁用回退 | 5分钟不是自动擦除保证 |
| 告警抢占 | 录音/上传时实际到时或返回屏保，释放/中止/不ack/done | 单测手工dispatch不替代真实调度/设备 |
| 匿名状态 | backendReady与authenticated分离，有真实平台登录链接 | ready不等于认证或provider已连通 |
| 后端拒绝 | 6字段/consent/WAV/同源/幂等/分钟限额/日预留/超时 | 本地401测试不写成生产直接测得401 |
| 真实单次验收 | 用户授权后本人key、虚构音频、同意、单次请求、待核对文本 | 失败仍可能收费；禁止自动重试 |
| 回归 | 99tests、TS、build分别记退出码；lint单独记 | mock/云Chromium不替代真机/临床准确率 |

## 12 修改、独立部署与回滚

1. 从新版ZIP解压到新目录，保留原哈希；不要覆盖旧v20 ZIP。公开包是脱敏可移植候选，不是生产原提交逐字节档案；解压目录没有原git历史，源提交号不保证能在交付仓库checkout。
2. 新源码已有公开根修复，不再按旧手册反复应用v21入口patch。生产v22也不是只修入口：已包含新百炼UI与390px；回滚到v21会失去这些新能力。
3. API生产当前启用与独立包默认关闭分开管理。新增独立部署先配自己的稳定SITE_ID、可信身份网关、D1表与约束、精确HTTPS origin和预算，再有意识地开关；不要复制原私有部署标识或启用共享key。
4. 先限定改动并补失败测试。当前前端经典全局脚本、ES module和同源iframe共同工作，勿大规模重构加载顺序而不测提醒/编辑状态。改样式后重生成portrait-responsive并看主页面和asr iframe。
5. `rollback-assets.json`是限定资产保持基线，不是自动回滚脚本。新的3处ASR生命周期挂钩在preservation里按明确规则归一化检查，不意味着所有新逻辑已被回归覆盖。回退用独立分支或新目录比较，不覆盖用户未提交修改。
6. 数据回滚和代码回滚分开；D1当前无向下迁移。不得删除预留ledger来绕过日额度或跨日幂等；远程迁移/备份需授权。任务localStorage schema改动必须有兼容和恢复计划。
7. 出现provider异常时可按授权关闭新请求并保留证据；已发请求仍可能收费。不能偷偷切地域/服务商、共享key或关闭认证。暂停付费能力不等于删除用户本机记录。
8. 生产发布/回滚/远程变量变更需单独授权及验收；源码ZIP不是一键生产恢复包。旧v21入口修复可作历史回退基线，但旧语音备份不在公开包，不能从私有备份自动公开。
9. 新发布包任何变化都重算manifest和archive-check，保留旧包。本文同名更新保留文档身份/版本记录；它不是ZIP自哈希的一部分。用户上传环境文件、key、模型许可未核实内容始终不发布。

## 13 可复制给本地模型的接手提示词

```text
你接手的是 TUOTUO v22 非临床照护工作原型，只用虚构资料。
先读 TUOTUO-LOCAL-MODEL-HANDOVER.md 与新版PUBLIC-CANDIDATE.md、SAFE-ASR-HANDOFF.md。
主交付是tuotuo-v22-public-source.zip；归档根直接有package.json，无旧v20外层目录。
先核对SHA/manifest，解压到新工作目录再运行npm。旧tuotuo-latest-public-source.zip只是v20历史。

当前功能源commit 7acc3f2e5535647e61864bf29514d72570274225，生产v22已部署，包含公开根入口、
390px和单一百炼语音。独立公开包仍关闭API并用独立配置占位；不能把生产启用值当你的部署授权。
根公开不等于API匿名。认证依靠可信托管入口，严禁手工伪造身份头绕过生产。

当前工作台只加载asr-integration.mjs，打开同源/asr/ iframe；旧本地/browser/OpenAI UI不加载。
当前设置只显示百炼北京/新加坡、qwen-audio-3.1-asr-flash；后端保留OpenAI五模型兼容但不显示。
不要照抄旧v20的四字段、OpenAI-only、20秒超时或旧consent说明。实际API看手册第7节。

录音、静音端点、30秒上限、文件导入只做本机预览。用户保存本次设置，勾本轮明确目的地和费用
同意，再手动发送才上传。只用本人手填key，不持久化、不读.env.local、不用共享key或本机resolver，
无自动重试/地域fallback。改音频/模型/provider、workspace、key须撤销同意；取消不保证未计费。
backendReady只是配置/表可读；authenticated是身份；connected需要两者，不代表provider账单/权限已验。

转写必须人工核对，采用只追加到任务输入或备忘草稿，不自动解析、建卡、计时、保存或完成。
ack不等于done。任务/备忘/知识草稿仍是同origin localStorage，未按登录用户分区。
独立/asr/返回会短暂用sessionStorage tuotuo-asr-handoff传已核对草稿，key/音频不进入该存储。
本地Whisper权重/FLEURS仍不在公开包；保留旧代码不是当前离线功能或训练成功证明。

先报告实际版本、文件、运行路径、已验和未验、计划改动及不变量。先做最小授权变更和测试，
不要全站重构、升级依赖、改代理/TLS/系统安全策略或自动部署/开启付费测试。
有费用、远程数据库、部署、数据公开、模型素材恢复时先获得明确授权。
改后跑99tests、类型检查、build，UI另外真浏览器验证；mock不代替实体手机/麦克风或临床准确性。
不读/公开上传.env.local、实际key、用户邮箱、患者资料、OTP、私有服务ID或内部路径。
最终交付变更文件、证据、剩余风险和回滚；失败如实说，不伪造生产401、真实登录或转写成功。
```

### 建议读取顺序

1. 本手册版本矩阵、新版manifest/archive-check、`PUBLIC-CANDIDATE.md`、`SAFE-ASR-HANDOFF.md`。
2. `package.json/lock`、profile/安装/运行脚本、vite/hosting、根page、认证helper和worker。
3. `public/legacy/index.html`及其实际脚本顺序；`app.js/sounds.js/memos.js/knowledge.js`与TUOTUO展示模块。
4. `public/asr-integration.mjs`、`asr/index.html/app.js/styles.css`、`api-recorder.mjs`、`speech-endpoint.mjs`、当前复用的pcm-worklet。
5. `api-models.mjs/api-request.mjs`、`app/api/`、`server/transcription-handler.mjs`、`server/provider-transport.mjs`、`server/audio-validator.mjs`、`server/quota.mjs`、`server/runtime-config.mjs`。
6. schema与迁移、99tests，对照测试是否实际加载当前UI，不把旧脚本测试当新页面验收。
7. 知识26条、素材归属和notices、完整文件索引；最后才研究未启用的旧本地ASR和starter组件。

### 不可混淆的结论

- 生产v22已部署 ≠ 独立公开包已配置可用 ≠ 本人真实付费ASR已验。
- 一个百炼UI入口 ≠ 后端删除OpenAI兼容；旧文件存在 ≠ 当前加载或有旧功能入口。
- 录音停止/端点检测 ≠ 上传同意；波形动画 ≠ 实时音量；暂停 ≠ 已释放麦克风track。
- 已核对草稿回传 ≠ 自动保存/创建任务；ack ≠ done；原型留痕 ≠ 可信医疗审计。
- backendReady ≠ authenticated ≠ 真实provider成功；10次日预留 ≠ provider费用硬上限。
- key/音频不持久化 ≠ 所有已采用文本从不存储；sessionStorage短时handoff要单独说明。
- 云浏览器登录欢迎页 ≠ 已登录；边缘403/1010 ≠ 应用401；mock99通过 ≠ 真机/医疗验证。
- 26条资料 ≠ 26个独立来源 ≠ 院内批准；缺模型不能靠猜测/未审旧包补齐。
- 公开可见 ≠ 所有素材自由授权；保留运行库许可不等于转换权重已获再分发许可。
## 附录 A 完整源码文件索引

以下索引由本次公开候选实际文件树生成，共207个文件；这是解压项目的索引，不包含交付根额外的本手册。精确SHA-256看 `PUBLIC-FILE-MANIFEST.json`（206项，不自哈希），不要将下方简化职责表替代清单。

```text
.env.example
.gitignore
.next/types/routes.d.ts
.npmrc
.openai/hosting.json
ASSET-RIGHTS-PENDING.md
PUBLIC-CANDIDATE.md
PUBLIC-FILE-MANIFEST.json
README.md
SAFE-ASR-HANDOFF.md
THIRD-PARTY-NOTICES.md
app/api/session/route.ts
app/api/transcriptions/route.ts
app/chatgpt-auth.ts
app/globals.css
app/layout.tsx
app/page.tsx
cloudflare-env.d.ts
components.json
components/connector-error.tsx
components/ui/accordion.tsx
components/ui/alert-dialog.tsx
components/ui/alert.tsx
components/ui/aspect-ratio.tsx
components/ui/attachment.tsx
components/ui/avatar.tsx
components/ui/badge.tsx
components/ui/breadcrumb.tsx
components/ui/bubble.tsx
components/ui/button-group.tsx
components/ui/button.tsx
components/ui/calendar.tsx
components/ui/card.tsx
components/ui/carousel.tsx
components/ui/chart.tsx
components/ui/checkbox.tsx
components/ui/collapsible.tsx
components/ui/combobox.tsx
components/ui/command.tsx
components/ui/context-menu.tsx
components/ui/dialog.tsx
components/ui/direction.tsx
components/ui/drawer.tsx
components/ui/dropdown-menu.tsx
components/ui/empty.tsx
components/ui/field.tsx
components/ui/form.tsx
components/ui/hover-card.tsx
components/ui/input-group.tsx
components/ui/input-otp.tsx
components/ui/input.tsx
components/ui/item.tsx
components/ui/kbd.tsx
components/ui/label.tsx
components/ui/marker.tsx
components/ui/menubar.tsx
components/ui/message-scroller.tsx
components/ui/message.tsx
components/ui/native-select.tsx
components/ui/navigation-menu.tsx
components/ui/pagination.tsx
components/ui/popover.tsx
components/ui/progress.tsx
components/ui/radio-group.tsx
components/ui/resizable.tsx
components/ui/scroll-area.tsx
components/ui/select.tsx
components/ui/separator.tsx
components/ui/sheet.tsx
components/ui/sidebar.tsx
components/ui/skeleton.tsx
components/ui/slider.tsx
components/ui/sonner.tsx
components/ui/spinner.tsx
components/ui/switch.tsx
components/ui/table.tsx
components/ui/tabs.tsx
components/ui/textarea.tsx
components/ui/toggle-group.tsx
components/ui/toggle.tsx
components/ui/tooltip.tsx
db/index.ts
db/schema.ts
drizzle.config.ts
drizzle/0000_robust_richard_fisk.sql
drizzle/meta/0000_snapshot.json
drizzle/meta/_journal.json
eslint.config.mjs
examples/d1/app/api/notes/route.ts
examples/d1/db/schema.ts
hooks/use-mobile.ts
lib/connector-context.ts
lib/connector-contract.mts
lib/connector-errors.mts
lib/connector-preview.d.ts
lib/connectors.ts
lib/utils.ts
migrations/0001_quota.sql
next-env.d.ts
next.config.ts
package-lock.json
package.json
postcss.config.mjs
public/api-models.mjs
public/api-recorder.mjs
public/api-request.mjs
public/api-voice-ui.mjs
public/app.js
public/asr-integration.css
public/asr-integration.mjs
public/asr/app.js
public/asr/index.html
public/asr/styles.css
public/assets/botanical-note.svg
public/assets/nursing-knowledge.json
public/assets/paper.svg
public/assets/sounds/motor-1.mp3
public/assets/sounds/motor-2.mp3
public/assets/sounds/motor-3.mp3
public/assets/sounds/motor-4.mp3
public/assets/sounds/motor-5.mp3
public/assets/sounds/motor-6.mp3
public/assets/tuotuo/ATTRIBUTION.md
public/assets/tuotuo/tuotuo-four-states.png
public/assets/tuotuo/tuotuo-sleepy-yawn.png
public/favicon.svg
public/knowledge.js
public/legacy/index.html
public/local-asr-ui.mjs
public/local-asr/LICENSES.txt
public/local-asr/asr-worker.mjs
public/local-asr/local-asr.mjs
public/local-asr/local-capture.mjs
public/local-asr/near-realtime.mjs
public/local-asr/pcm-capture.mjs
public/local-asr/pcm-worklet.mjs
public/local-asr/split-decoder-cache.mjs
public/local-asr/split-decoder-manifest.mjs
public/local-asr/vendor/JINJA-LICENSE
public/local-asr/vendor/ONNXRUNTIME-LICENSE
public/local-asr/vendor/ONNXRUNTIME-ThirdPartyNotices.txt
public/local-asr/vendor/TRANSFORMERS-LICENSE
public/local-asr/vendor/ort-wasm-simd-threaded.jsep.mjs
public/local-asr/vendor/ort-wasm-simd-threaded.jsep.wasm
public/local-asr/vendor/transformers.min.js
public/memos.js
public/sounds.js
public/speech-endpoint.mjs
public/style.css
public/tuotuo-intro.css
public/tuotuo-intro.js
public/tuotuo-portrait-responsive.css
public/tuotuo-portrait.css
public/tuotuo-portrait.js
public/tuotuo-saver.css
public/tuotuo-saver.js
public/tuotuo.css
public/tuotuo.js
public/voice-intake.mjs
public/voice-ui.mjs
rollback-assets.json
scripts/build-verified.sh
scripts/connector-preview/connector-preview-session.mjs
scripts/connector-preview/host-binding.mjs
scripts/connector-preview/protocol.mjs
scripts/connector-preview/worker.mjs
scripts/execution-profile.mjs
scripts/generate-portrait-css.mjs
scripts/install-ci.mjs
scripts/install-ci.sh
scripts/install-pnpm.sh
scripts/npm-install.mjs
scripts/pnpm-install.mjs
scripts/run-framework.mjs
scripts/sites-env.mjs
scripts/sites-env.sh
scripts/tool-environment.mjs
scripts/vite/connector-preview-plugin.mjs
scripts/vite/sites-vite-plugin.LICENSE
scripts/vite/sites-vite-plugin.ts
server/audio-validator.mjs
server/provider-transport.mjs
server/quota.d.mts
server/quota.mjs
server/runtime-config.d.mts
server/runtime-config.mjs
server/transcription-handler.d.mts
server/transcription-handler.mjs
tests/api-request.test.mjs
tests/asr-integration.test.mjs
tests/asr-provider-safe.test.mjs
tests/audio-validator.test.mjs
tests/handler.test.mjs
tests/preservation.test.mjs
tests/public-entry.test.mjs
tests/quota.test.mjs
tests/recorder.test.mjs
tests/sqlite-d1.mjs
tests/tuotuo-intro.test.mjs
tests/tuotuo-portrait.test.mjs
tests/tuotuo-saver.test.mjs
tests/tuotuo.test.mjs
tsconfig.json
vendor/shadcn-tailwind-4.13.0.LICENSE.md
vendor/shadcn-tailwind-4.13.0.css
vite.config.ts
worker/index.ts
```

## 附录 B 知识库记录的20个来源

以下按JSON中URL去重，保留来源标题、链接及覆盖条目。它是**库内来源清单**，不是本次重新审核过的临床建议；所有条目仍research_only、禁止自动计时，链接内容和院内适用性须接手者另行复核。

| 序号 | 来源标题和链接 | 条目ID |
| ---: | --- | --- |
| 1 | [β内酰胺类抗菌药物皮肤试验指导原则（2021年版）医院官网转载](https://cdfy120.cdu.edu.cn/info/1293/7947.htm) | `beta_lactam_skin` |
| 2 | [CDC Clinical Testing Guidance: Tuberculin Skin Test](https://www.cdc.gov/tb/hcp/testing-diagnosis/tuberculin-skin-test.html) | `tuberculin_skin` |
| 3 | [AHA Home Blood Pressure Monitoring](https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home) | `blood_pressure` |
| 4 | [MHRA The use and regulation of pulse oximeters](https://www.gov.uk/guidance/the-use-and-regulation-of-pulse-oximeters-information-for-healthcare-professionals) | `pulse_oximetry` |
| 5 | [CUH Caring for your surgical wound](https://www.cuh.nhs.uk/patient-information/caring-for-your-surgical-wound/) | `wound_dressing` |
| 6 | [MSK About Your Ultrasound](https://www.mskcc.org/cancer-care/patient-education/ultrasound) | `abdominal_ultrasound`、`pelvic_ultrasound`、`transvaginal_ultrasound`、`bladder_ultrasound`、`thyroid_ultrasound` |
| 7 | [NHS — CT scan](https://www.nhs.uk/tests-and-treatments/ct-scan/) | `imaging_ct` |
| 8 | [NHS — MRI scan](https://www.nhs.uk/tests-and-treatments/mri-scan/) | `imaging_mri` |
| 9 | [NHS — X-ray](https://www.nhs.uk/tests-and-treatments/x-ray/) | `imaging_xray` |
| 10 | [NHS — Electrocardiogram (ECG)](https://www.nhs.uk/tests-and-treatments/electrocardiogram/) | `functional_resting_ecg`、`functional_ambulatory_ecg` |
| 11 | [NHS — Echocardiogram](https://www.nhs.uk/tests-and-treatments/echocardiogram/) | `imaging_echo` |
| 12 | [NHS — Spirometry test](https://www.nhs.uk/tests-and-treatments/spirometry/) | `functional_spirometry` |
| 13 | [NHS — EEG (electroencephalogram)](https://www.nhs.uk/tests-and-treatments/electroencephalogram/) | `functional_eeg` |
| 14 | [Blood tests - NHS](https://www.nhs.uk/tests-and-treatments/blood-tests/) | `venous-blood-sampling`、`blood-glucose-specimen` |
| 15 | [Collection of Mid-Stream Sample of Urine (MSSU) for adults](https://www.gloshospitals.nhs.uk/your-visit/patient-information-leaflets/collection-of-mid-stream-sample-of-urine-mssu-for-adults/) | `midstream-urine` |
| 16 | [How to collect a 24 hour urine sample \| CUH](https://www.cuh.nhs.uk/patient-information/how-to-collect-a-24-hour-urine-sample/) | `timed-urine-24h` |
| 17 | [How to collect a sample of poo (stool sample) - NHS](https://www.nhs.uk/tests-and-treatments/how-to-collect-a-sample-of-poo-stool-sample/) | `stool-specimen` |
| 18 | [Gastroscopy - NHS](https://www.nhs.uk/tests-and-treatments/gastroscopy/) | `gastroscopy` |
| 19 | [Colonoscopy - NHS](https://www.nhs.uk/tests-and-treatments/colonoscopy/) | `colonoscopy` |
| 20 | [Bronchoscopy \| CUH](https://www.cuh.nhs.uk/patient-information/bronchoscopy/) | `bronchoscopy` |
