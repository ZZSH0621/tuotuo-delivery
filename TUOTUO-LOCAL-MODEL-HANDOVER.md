# 妥妥 TUOTUO 本地模型接手手册

更新日期：2026-10-31 UTC。对象：没有本项目聊天历史、需要在自己电脑上阅读、运行、修改和验证项目的开发者或本地模型。

本手册交接的是一个**只允许虚构资料的照护工作原型**，不是医疗器械、电子病历、医嘱系统或可靠临床闹钟。已有内容包括工作台、人工核对后建任务、提醒与完成留痕、每日总结、备忘、候选知识、角色与音效、桌面及390px布局预览、本地语音加载代码，以及默认关闭的 OpenAI 个人密钥转写接口。**公开包没有本地识别模型权重；没有完成真实 OpenAI 调用验收；没有训练出本项目专属模型。**

本文中的源码路径，除专门标注“交付仓库根目录”外，均相对于 ZIP 解压后的 `tuotuo-public-source/`。本文只说明现状、证据与接手步骤，不授权自动开启计费服务、公开额外数据、部署或更改系统安全设置。

快速定位：运行安装看第3节，工作台行为看第4节，数据结构看第5节，本地语音看第6节，BYOK接口看第7节，知识与素材看第8节，测试/入口补丁看第9节，问题和验收看第10–11节，回滚/模型接手提示词看第12–13节。完整文件索引和来源表在附录。

## 1 先认清交付物和版本

### 1.1 三种状态必须分开

| 对象 | 截至本次交接的状态 | 不能推导的结论 |
| --- | --- | --- |
| [GitHub 交付仓库](https://github.com/ZZSH0621/tuotuo-delivery) | 已创建并公开交付 ZIP、短说明、manifest、归档核验文件；完整源文件目前主要在 ZIP 内 | 不是“仓库根已有可直接 npm 运行的源码”；不是已经部署 |
| 源码基线 | v20 已在原托管流程保存，源提交 `aa61b5dc3a4f4944ac30105b121794a04bc4eb7c`；公开候选另外做脱敏与排除 | 公开候选不是原提交逐字节副本；该提交也不必存在于新 GitHub 仓库历史 |
| [现有生产演示](https://nurse-notes-demo.wiggly-char-1989.chatgpt.site) | 已从v18单独部署v21入口修复，公开工作台可打开；v20功能未部署，API仍关闭 | v21是v18加根入口修复，不是v20完整功能上线；详见9.3 |

生产入口修复在2026-10-31 04:21:51 UTC完成，修复提交 `0539ced58ad138c19e118bf6ee2059727664e068`；保留的源码ZIP仍是此前的v20公开候选。**生产分支与交付源码分支已分叉，接手第一步是明确目标分支。**

GitHub 根目录短说明及外部 manifest 已在发布后更新发布状态；ZIP 内的 `README.md`、`PUBLIC-CANDIDATE.md`、`PUBLIC-FILE-MANIFEST.json` 和部分许可证说明仍保留**打包时未发布的历史快照**。遇到“unpublished”或 `github_published:false`，先判断文件属于哪个快照，不要据此把已公开仓库说成尚未公开。不要为了只改状态文案而偷偷重打并覆盖已核验 ZIP。

### 1.2 交付仓库根目录文件

| 文件 | 用途 |
| --- | --- |
| `tuotuo-latest-public-source.zip` | 当前公开源码和允许保留的素材；解压根为 `tuotuo-public-source/` |
| `TUOTUO-LATEST-PUBLIC-HANDOFF.md` | 短交接、版本与已验边界 |
| `TUOTUO-LATEST-PUBLIC-FILE-MANIFEST.json` | 对外逐文件 SHA-256 与公开化差异；代码文件哈希与包内清单对应 |
| `TUOTUO-LATEST-PUBLIC-ARCHIVE-CHECK.json` | ZIP 大小、SHA-256、CRC 核验信息 |
| `TUOTUO-LOCAL-MODEL-HANDOVER.md` | 本完整接手手册；不在先前已固定的 ZIP 哈希范围内 |

当前 ZIP：**9,699,203 字节**；SHA-256：

```text
82a2b4dd2a843ee0e578ce54061aba4049288eef020ed381eeaeef74ab354bb1
```

ZIP 共195个文件条目；包内 manifest 列出194个文件，不自哈希。编写本文时已逐个复算公开候选的194个哈希，全部一致；交付过程还已下载 GitHub 实际 ZIP 回验。**哈希说明完整性与同一性，不说明医学有效性、许可完备性或没有所有可能的漏洞。**

原始 v18 私有三份分包与含权重的完整包不属于公共仓库附件。本公开版没有恢复内部部署 ID、私有文档或 Space 引用、工作机路径、转换权重、词表或 FLEURS 音频；后续模型不得从其他历史包自行补回。

## 2 产品目标和不得破坏的约束

用户要的是有 TUOTUO 角色陪伴感的深色照护工作台：把描述变成可核对的工作草稿，把“到时间”“已知悉”“真的完成了工作”分开，并保留浏览器内的操作记录。语音是输入辅助，不是临床决策者。

1. **虚构资料与人工核对**：床号、姓名、事项、提醒时间必须核对。不能推断药物皮试判读时间、禁食时间、观察时间、医嘱或诊疗结论；没有就保持空白或追问。
2. **确认不等于完成**：点“知悉并停止当前提醒”只停止当前告警并记 `ack`；只有完成表单才记 `done`。不要把屏保退出、音效结束、语音确认或收到 API 文本计为已完成。
3. **两条主要语音入口**：页面导航展示独立本地识别与 API 识别；旧浏览器本地语音对话代码还在，不等于主导航增加第三个入口。
4. **本地优先但不能冒称完整离线**：浏览器本地能力不足或缺模型时应明确失败并保留文字输入，不悄悄使用浏览器云端识别或付费服务。
5. **BYOK 只用本人 key**：用户手动输入个人 OpenAI API key、明确目的地与模型、同意可能收费后才发送；不内置共享 key，不用站点拥有者 key 兜底，不开放任意代理/URL。
6. **展示增强不改业务**：开场、睡脸屏保、电量、390px切换均应保持已有任务、输入、提醒和完成数量；切换不是刷新、iframe 或第二套应用。
7. **声音与硬件分开**：六条 motor MP3 是模拟震动的音效；`navigator.vibrate` 才是设备震动请求。网页不能保证后台、锁屏、关闭浏览器后可靠提醒。
8. **不扩大公开范围**：公开可见不是整项目统一自由授权。保留第三方 notices，不添未经批准的许可证，不发布真实患者资料、密钥、OTP、用户邮箱或私有对话。

## 3 从源码理解运行结构

### 从公开交付包开始

以下命令对应**当前ZIP中的v20公开候选**。生产已单独部署v18基础上的v21入口补丁，见1.1和9.3；该补丁未写入此ZIP，API仍关闭。包内旧“尚未发布GitHub”文字是打包快照，不代表现在的仓库状态。

当前 GitHub 仓库根目录是交付文件层，不是应用项目根目录；根目录没有可直接运行的 `package.json`。先下载或克隆仓库，再解压 `tuotuo-latest-public-source.zip`。本次已核查 ZIP 内共同顶层为 `tuotuo-public-source/`；应用根目录应同时包含 `package.json`、`package-lock.json`、`app/` 和 `public/`。未来若交付包变化，以 `tar -tf` 的实际列表为准，不要猜目录层级。

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

# 先查看，确认列表以 tuotuo-public-source/ 开头
tar.exe -tf .\tuotuo-latest-public-source.zip | Select-Object -First 20

# 使用新建目录，避免覆盖既有工作
Expand-Archive -LiteralPath .\tuotuo-latest-public-source.zip -DestinationPath .\source-work
Set-Location .\source-work\tuotuo-public-source
Get-Item .\package.json, .\package-lock.json

npm.cmd run install:ci
# 等安装成功结束，再启动；停止服务器使用 Ctrl+C
npm.cmd run dev
```

若没有 Git，可以从公开仓库网页下载 `tuotuo-latest-public-source.zip`，在其所在目录从 `tar.exe -tf` 一行继续；不要把 GitHub 的“Download ZIP”外层仓库包误认为应用源码内层 ZIP。任何一步报错，应先处理该步，不能继续把后续失败解释成应用故障。

#### macOS 和 Linux

```sh
node --version
npm --version
git --version

git clone https://github.com/ZZSH0621/tuotuo-delivery.git
cd tuotuo-delivery

# 先核实 ZIP 顶层结构
tar -tf tuotuo-latest-public-source.zip | head -20

# source-work 应为新目录；若已存在，另选目录，不覆盖已有修改
mkdir source-work
unzip tuotuo-latest-public-source.zip -d source-work
cd source-work/tuotuo-public-source
ls package.json package-lock.json

npm run install:ci
# 等安装成功结束，再启动；停止服务器使用 Ctrl+C
npm run dev
```

部分 Linux 系统的 GNU `tar` 不能读取 ZIP；如果 `tar -tf` 报格式错误，用 `unzip -l tuotuo-latest-public-source.zip | head -25` 查看同一包的目录，不要据此认定 ZIP 已损坏。macOS 通常自带 ZIP 解压工具；缺少 `unzip` 时，先通过该系统认可的软件安装方式补齐，或使用系统图形解压器，然后进入真实应用根目录。

#### 解压前后核验

在交付仓库根检查ZIP，输出应等于1.2节固定SHA-256：

```powershell
# Windows PowerShell
Get-FileHash .\tuotuo-latest-public-source.zip -Algorithm SHA256
```

```sh
# macOS
shasum -a 256 tuotuo-latest-public-source.zip
# Linux
sha256sum tuotuo-latest-public-source.zip
```

进入解压应用根后，可用已经安装的Node逐一检查包内manifest，不依赖npm包、不修改文件：

```sh
node --input-type=module -e "import fs from 'node:fs';import {createHash} from 'node:crypto';const m=JSON.parse(fs.readFileSync('PUBLIC-FILE-MANIFEST.json','utf8'));const bad=Object.entries(m.files).filter(([p,h])=>!fs.existsSync(p)||createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==h).map(([p])=>p);console.log({checked:Object.keys(m.files).length,bad});process.exitCode=bad.length?1:0"
```

期望 `checked:194`、`bad:[]`。后续应用入口补丁或有意修改代码后出现相应哈希差异是正常现象，应记录新变更，不篡改基线清单来冒充原包。

#### 开发预览与构建预览

`npm run dev` 在 portable 模式使用 Vinext 开发服务器，默认从 **5173** 端口启动。以终端实际打印的地址为准，通常是 `http://localhost:5173`；保持仅本机回环访问，不为省事绑定到公开网卡。需要另一个端口时使用 `npm run dev -- --port 5174`（PowerShell 用 `npm.cmd`）。

- 访问 `/`：`app/page.tsx` 先要求登录，再跳转到 `/legacy/index.html`。portable 开发模式提供**仅回环请求有效的模拟登录**，可在浏览器直接打开 `/signin-with-chatgpt?return_to=/`。这是开发身份，不是真实 ChatGPT 账户认证。
- 访问 `/legacy/index.html`：直接查看静态工作台。**首页的登录跳转不等于所有静态资源都受认证保护**，因此不要在页面、图片或 JavaScript 中放置秘密或真实患者资料。
- API 默认关闭、缺少本地模型文件，都是交付边界，不是执行安装命令就会自动修好的故障。界面能打开不代表云端转写已连接或本地语音识别可运行。

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
      ├─ / → app/page.tsx → 登录检查 → /legacy/index.html
      ├─ /api/session → app/api/session/route.ts
      ├─ /api/transcriptions → app/api/transcriptions/route.ts
      └─ 静态工作台与资源 → public/

工作台 public/legacy/index.html
  → public/app.js 等本地任务与提醒逻辑
  → public/local-asr-ui.mjs → 浏览器本地识别实验代码
  → public/api-voice-ui.mjs → /api/session 与 /api/transcriptions
```

`public/legacy/index.html` 设置了 `<base href="/">`，所以其中 `app.js`、`style.css` 等相对 URL 实际从站点根路径加载。不要直接双击 HTML、随意移动它，或部署到子路径后仍假定所有资源路径正确；这需要 HTTP 服务和对应路径验证。页面业务改动通常从 `public/` 入手，而不是另写一套 React 工作台后假称已替换现有页面。

#### 重点目录职责

| 路径 | 当前职责与修改注意事项 |
| --- | --- |
| `app/page.tsx`、`app/layout.tsx` | 首页认证入口、静态工作台跳转、页面元信息；不是主要工作台组件树。 |
| `app/chatgpt-auth.ts` | 读取托管层注入的可信身份头并构造登录/退出路径。不能把该 helper 当成独立身份验证服务。 |
| `app/api/session/route.ts` | 返回认证、后端就绪和拥有者标记；就绪状态检查运行时配置及两张配额表。 |
| `app/api/transcriptions/route.ts` | 默认关闭的转写入口；组合认证、运行时配置、D1 配额、音频校验与上游传输。 |
| `public/legacy/index.html`、`public/app.js`、`public/style.css` | 现有工作台 DOM、主业务和基础外观。 |
| `public/tuotuo*`、`public/sounds.js`、`public/memos.js`、`public/knowledge.js` | 品牌角色与开场、屏保、竖屏预览、音效、备忘和知识展示。更改原样式后注意竖屏派生样式同步。 |
| `public/api-*.mjs` | API 模型白名单、录音、请求及 BYOK UI；不能仅凭 UI 中有选项就声称某模型账户可用。 |
| `public/local-asr/`、`public/local-asr-ui.mjs` | 本地识别实验的加载、录音和推理代码。公开包缺少模型与示例素材；保留加载器不等于附带可用离线语音包。 |
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
| `examples/d1/` | 可选starter示例：`db/schema.ts`定义notes，`app/api/notes/route.ts`示例GET/POST；不在当前根app路由树中，不能声称已部署`/api/notes`或已同步备忘。 |

`dist/`、`node_modules/`、`.vinext/`、`.wrangler/`、`.sites-runtime/` 是构建、依赖或本机运行状态，不是要提交的源代码。不要将本机 cookie、数据库状态、安装缓存或 `.env*` 一起打进公开 ZIP。

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

当前自编 `scripts/sites-env.mjs` 是工具日志和状态路径初始化器，**不是业务 dotenv 加载器**；`vite.config.ts` 也没有把这些业务值显式映射到 `vars`。不能仅凭 `.env` 文件存在，便宣称它已进入 Cloudflare Worker 的运行时绑定。独立部署或增加本地 API 测试时，先按实际使用的 Cloudflare/Vite/Wrangler 启动链验证变量加载方式和生成配置，再验证 `/api/session`；不能把客户端 `VITE_*` 变量作为秘密存储。普通静态预览无需填入这些生产配置。

#### 启用服务前必须落实的事项

- `.openai/hosting.json` 的 `project_id` 当前为空；Vite 里的 D1 数据库 ID 是本地模拟占位。部署者必须使用自己有权管理的项目与真实 D1 绑定，并执行正确迁移。不要复制历史环境标识或占位 ID 当作生产配置。
- `server/runtime-config.mjs` 中的 `SITE_ID` 是独立部署占位字符串，必须改为该部署唯一且非秘密的站点标识。**代码没有自动拒绝此占位字符串**，人工检查是启用门槛之一。
- `API_EXPECTED_ORIGIN` 必须是精确 HTTPS origin，不能带路径或末尾斜杠；预算值必须为正的安全整数，且每请求最大预留额不大于每日预算。有效配置和存在 `DB.prepare` 只是开关条件，不等于真实上游、鉴权和数据库均已验收。
- `SITE_OWNER_USER_ID` 是拥有者 UI 标记的比较值，不可替代身份验证或数据库授权策略；不要为演示伪造真实拥有者身份。
- 托管平台负责 `/signin-with-chatgpt`、`/signout-with-chatgpt`、`/callback` 及身份头注入。普通静态托管或自行启动 Worker 不会自动获得这些能力。必须先有可信的认证入口，剥离客户端可伪造的 `oai-authenticated-user-*` 头，再由服务端认证层注入可信身份，或另行设计并验收完整认证方案。
- **严禁把手工添加身份头、硬编码用户 ID、portable 模拟 cookie 或关闭认证当作生产登录方案。** 根页面有登录检查也不能推出所有 API 和资源都受保护。
- 生产发布、开启 API、调用可能计费的服务、迁移远程数据库、恢复并再分发模型素材均应单独取得授权，并设置回退方案；这份公开源码交付本身没有授权自动执行这些动作。

先保留 API 关闭，只完成本地代码和界面验证；只有上述边界落实并按验收计划逐项验证后，才讨论启用服务。不要在公开手册、提交、构建日志或截图中留下真实密钥、真实用户资料、私有服务标识或真实患者内容。

## 4 工作台各模块的真实行为

### 4.1 文字提取与核对建卡

`public/app.js` 是经典脚本，不是 React 业务组件。顶层 `tasks`、`alarmQueue`、`render()`、`paintSaver()` 等由后续同页面脚本共同使用。修改全局变量、脚本顺序或把它们随意改成 ES module，可能让后面的展示包装与语音模块失效。

`parseInput()` 只做窄规则提取：阿拉伯数字床号、`数字分钟后`、`示例患者甲/乙/丙/丁`、`测血压` 或 `皮试`。它不是通用 NLP，也不会自动识别人名、全部知识条目或临床语义。结果进入 `openConfirm()`：床号最长12、姓名30、事项80字符，时间输入的 HTML 范围1–10080分钟，必须勾人工核对。普通任务以**点击创建时的本机时间**起算。

`testTask()` 是10秒前台提醒测试，床号 `TEST`，不是一分钟震动测试。界面还保留 `voiceDemo()` 的模拟文本填充逻辑，它没有录音或调用识别服务。主表单逻辑在 JavaScript 中检查时间有效且大于0；七天上界主要来自 HTML 约束，不能把浏览器表单约束误说成可信服务端业务校验。

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

备忘语音按钮将独立本地识别的目的地切到 `memo`；识别结果需要采用、编辑、勾核对后才能放入备忘编辑框，最后还须点击保存。API路线的现有“采用”只通向普通任务输入框，没有独立的API到备忘自动路由；用户若手工复制到备忘框，仍须另行保存。

### 4.6 六条音效和音量

`public/sounds.js` 管理 `public/assets/sounds/motor-1.mp3` 至 `motor-6.mp3`，六文件均保留且各721649字节；本次 `ffprobe` 核查每条约30.040816秒，界面“30秒”是近似描述。由于 HTML 的 `<base href="/">`，`assets/sounds/...` 相对引用指向站点根素材，不能在检查磁盘时漏掉 `public/` 层后误判缺失。

按项目 `测血压 / 皮试 / B超 / 测血糖 / 测体温 / 其他` 配置固定1–6或随机；事项含“超声”归 B超。当前告警保持入队时选曲，修改映射不换当前曲。试听不能覆盖活动告警；停止试听入口也不能替代知悉告警。

音量控件是0–200%，内部增益0–2，默认0.7（70%），用 Web Audio Gain 加压缩器播放。200%是数字增益，不保证感知响度翻倍、不提升系统硬件音量，也不是硬件震动强度；高音量须人工判断。加载/解码失败时回退约0.6秒合成低沉双脉冲；音频上下文必须先在用户交互中解锁。关闭网页音效不保证系统静音、通知策略或硬件震动行为。

### 4.7 十秒屏保、睡脸和真实电量

`app.js` 记录可信的 `pointerdown / keydown / input / wheel` 活动，空闲达到10000ms且无打开的模态框时可进入屏保；展示包装还防止覆盖正在编辑的控件和 `isLocalVoiceListening()` 表示的语音工作。500ms轮询意味着不是精确到毫秒的操作系统锁屏。

`tuotuo.js` 只包裹渲染/反馈；普通待机用睡眠角色，告警用唤醒角色。`tuotuo-saver.js` 展示至多三条最早的、未完成且尚未到时任务倒计时，卡片不显示姓名、床号、事项；告警卡也遮蔽这些内容。它并没有实现安全锁屏、重新认证或防肩窥的完整系统，任务详情仍能在工作台看到。

电量只在安全上下文且 `navigator.getBattery` 可用时读取真值，监听电量和充电变化；否则显示“电量不可用”，不虚构百分比。这个支持情况、移动浏览器功耗和硬件提醒尚未经真机验收。

### 4.8 TUOTUO 开场动画

`tuotuo-intro.js` 将 `TUOTUO妥妥` 拆为8个字符展示；1250ms开始收拢，2050ms锁定组合，3950ms结束主体，另有620ms离场。首次标签页会话播放，使用 sessionStorage 标记，可显式重播；支持跳过、Escape，尊重 `prefers-reduced-motion`。已有未知悉到时任务、屏保、模态框或活动语音时不开始；页面隐藏或屏保出现时退出。仅展示动画，不录音、不播音、不联网、不改变任务。不要把动画测试中的合成事件视为真实业务告警必然已接通。

### 4.9 桌面和390px竖屏切换

`tuotuo-portrait.js` 在视口至少761px时允许把**同一文档**切到390px居中布局，保存非敏感布局偏好；≤760px隐藏工具栏并采用实际响应式布局，重新变宽后恢复偏好。没有 iframe、重新加载或第二份 tasks 状态。主体和屏保390px、内容/弹窗在既有桌面测试中测得358px。

基础样式来自 `style.css`、`tuotuo.css`、`tuotuo-intro.css`、`tuotuo-saver.css`；`scripts/generate-portrait-css.mjs` 将390px下适用规则作用域化为 `html.phonePreview`，把 vw 按390px折算。改基础样式后运行生成器再审查 diff，不要只手工改生成的 `tuotuo-portrait-responsive.css`。真实窄屏仍需独立验收；390px桌面预览不模拟 iOS、设备权限、触屏键盘、DPR、安全区或后台行为。

## 5 前后端数据流和持久化

### 5.1 四条业务数据流

```text
文字输入 → 窄规则提取 → 人工核对表单 → Task[] / localStorage
     → 前台轮询 → 内存告警队列 → 知悉 ack（未完成）
     → 完成表单 → done / doneAt / 追加日志 → 今日总结

本地音频 → 浏览器本地引擎或 WASM Worker → 暂定/最终文本
     → 人工采用与核对 → 候选知识研究草稿或备忘编辑框
     → 默认不计时；备忘需另行保存

API 音频 + 本人 key + 白名单模型 + 本次同意
     → 同源 /api/transcriptions → 可信登录身份 + D1配额
     → 固定 OpenAI 地址 → 待核对文本 → 手工转入编辑区

知识 JSON → 客户端候选检索 → 待补充研究草稿
     → 不授予临床批准，不启动闹钟
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
| CacheStorage `nurse-asr-pinned-decoder-<sha256>` | 校验后的模型资源 Response | 非用户音频缓存；浏览器可能回收，不保证永久离线 |

现有“清除本机演示数据”只清任务与知识草稿，**不清备忘、备忘历史、音量、音效映射、布局、开场标记或模型缓存**，也不是账户注销清理。想做全量擦除应先设计确认/导出及精确范围，不能在接手时无授权调用 `localStorage.clear()`。

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

加载任务/备忘/草稿时只有 JSON 解析和顶层数组判断，缺少逐字段强校验/版本迁移。手改、损坏或老版本数据可能使 `log`、`due` 等访问失败。暂存 `alarmQueue`、`noticed`、当前过滤/视图、录音 PCM、转写预览、API key、同意勾选等不在上述持久化对象里。

### 5.4 跨用户边界是两套不同机制

服务器配额用托管平台稳定用户 ID 与站点 ID 隔离；请求体不允许提交 `userId`。但是浏览器工作数据按**origin + 浏览器配置文件**共享 localStorage，并非按登录身份隔离；同一电脑同一浏览器换登录账户可能看到上一个账户的演示数据，另一设备又不会自动得到这些数据。屏保遮蔽不是用户权限。若将来需要多人使用或真实资料，必须先设计身份绑定、命名空间、授权、加密、迁移、删除和审计，不能只加一个登录页面便声称安全。

## 6 三条语音路线不能混为一谈

### 6.1 浏览器自带本地语言包路线

`voice-intake.mjs` 中的 `LocalVoice` 只接受无前缀 `SpeechRecognition`，要求安全上下文、`available({langs:['zh-CN'],processLocally:true})` 可用、实例能够明确设置 `processLocally=true`；不用 `webkitSpeechRecognition` 或云端兜底。语言包可下载时必须用户点击调用浏览器 `install()`，安装返回 true 后还要重新检测能力。

浏览器安装 promise 没有本项目可用的真正取消接口，关闭面板只是停止等待/忽略后续结果，不能保证浏览器语言包下载停止。开始识别也须真实点击；15秒收不到音频开始事件会 abort，保留错误码；麦克风诊断只打开输入轨道后立即释放，不证明捕捉到声音或中文转写成功。朗读提示只选 `localService===true` 的中文声音，并先停识别，避免提示被当作用户回答。

`Intake` 逐项补 `bed / name / task / minutes / anchor`，只接最终识别并按 eventId 去重；没有完整中文数词解析、否定/更正意图理解或医学语义能力。分钟要求大于0、不超过10080；起点需明确“从现在”或“从几分钟前”。只有明确“确认创建/确认建立”且字段完整才进入终态，防重复创建。`voice-ui.mjs` 默认把这个确认转成**不计时研究草稿**；额外勾选 `voiceDemoTimer` 后才建非临床测试任务。不要把普通句子里的“确认”宽松当作授权。

### 6.2 独立 Whisper 浏览器 WASM 路线

| 文件 | 作用 |
| --- | --- |
| `public/local-asr-ui.mjs` | 加载、停止后识别/快照模式选择、录音状态、最终文本采用、人工核对、去知识或备忘 |
| `public/local-asr/local-asr.mjs` | `LocalASR` Worker 生命周期、Promise请求、16k重采样、静音/有限数校验、取消代际 |
| `public/local-asr/asr-worker.mjs` | Transformers.js pipeline；WASM、q8、中文转写、单线程、最多128新token |
| `public/local-asr/local-capture.mjs` | MediaRecorder录制后由 AudioContext 本机解码，混为单声道 |
| `public/local-asr/pcm-capture.mjs` | AudioWorklet PCM采集、30秒上限、停止flush、2秒尾段确认超时 |
| `public/local-asr/pcm-worklet.mjs` | 4096采样缓冲、声道平均、转移PCM buffer，响应flush |
| `public/local-asr/near-realtime.mjs` | 每约4秒对累计音频做批量快照，最后整段再识别 |
| `public/local-asr/split-decoder-manifest.mjs` | 固定decoder文件大小和分片/合并SHA-256 |
| `public/local-asr/split-decoder-cache.mjs` | 同源分片读取、逐片及合并完整性校验、验证缓存、阻止越界路径 |
| `public/local-asr/vendor/` | 本地 Transformers.js、ONNX Runtime JS/WASM及许可证 |

Worker 使用 `env.allowRemoteModels=false`、`allowLocalModels=true`、本目录 `models/` 路径；不会遇到缺权重时转去 Hugging Face 自动取模型。所谓“下载模型”是从部署者放在**本站**的资源路径加载，不是本包自带官方自动下载器。

`LocalASR.transcribe()` 接 Float32Array、真实采样率8000–192000Hz、最长30秒，必要时 OfflineAudioContext 转到16000Hz；拒绝非有限采样和 RMS<0.0001的近静音。Worker再要求16k单声道1600–480000采样，即0.1–30秒。这个规则只防某些无效输入，不保证语音内容正确。

“近实时”不是流式模型：每约4秒对累计PCM重跑一次，已有推理没结束就跳过快照，不堆请求；单次慢于6000ms或失败时降为停止后整段识别。暂定结果不存记录；停止时等当前快照结束再做最终整段识别；取消通过代际与终止Worker避免晚到结果覆盖。取消后模型需重新加载，缓存可能复用。WASM内存、加载时间、耗电、长句截断、中文专名/数字/床号准确性均需设备评估。

### 6.3 公开包缺什么

以下目录/文件被有意移除，不应以空文件、随机模型或未经授权的旧包静默补齐：

```text
public/local-asr/models/whisper-tiny/config.json
public/local-asr/models/whisper-tiny/generation_config.json
public/local-asr/models/whisper-tiny/preprocessor_config.json
public/local-asr/models/whisper-tiny/tokenizer.json
public/local-asr/models/whisper-tiny/tokenizer_config.json
public/local-asr/models/whisper-tiny/onnx/encoder_model_quantized.onnx
public/local-asr/models/whisper-tiny/onnx/decoder_model_merged_quantized.part1.bin
public/local-asr/models/whisper-tiny/onnx/decoder_model_merged_quantized.part2.bin
public/local-asr/example/fixture.f32
public/local-asr/example/provenance.json
```

现有加载清单预期的 decoder：

| 资源 | 字节 | SHA-256 |
| --- | ---: | --- |
| 合并 `decoder_model_merged_quantized.onnx` | 30719241 | `25e807a962b6349356d0ea5d0dfe530b7e5bf0e2a484aeca0359d03143faddd3` |
| `decoder_model_merged_quantized.part1.bin` | 16777216 | `48573a654213b2dec0acbadcd07f1cb6d66d824b10ff172b8686415e2eed71de` |
| `decoder_model_merged_quantized.part2.bin` | 13942025 | `238b2c2cb5bff6df5971fa326fd82591d857b139b458b973ebf7c7ac4db8f05b` |

这些只是保留的代码元数据，不意味着对应二进制存在。源码许可说明记录来源 [onnx-community/whisper-tiny](https://huggingface.co/onnx-community/whisper-tiny)，revision `ff4177021cc41f7db950912b73ea4fdf7d01d8e7`，上游 [openai/whisper-tiny](https://huggingface.co/openai/whisper-tiny)。独立恢复前须取得授权和转换来源证据、准确模型/分片、每个实际文件的完整性记录。不得把 Transformers.js 的 Apache 许可直接当作所有转换权重都已核实的再分发许可。

示例原来源记录为 [google/fleurs](https://huggingface.co/datasets/google/fleurs)；若恢复，应为实际 `fixture.f32` 留下样本归属、许可、采样率、转换流程及该 Float32 文件自己的哈希，不能拿无关 WAV 哈希顶替。此处仅转述包内来源记录，不声称本次完成模型或数据集法律审计。

原HTML还保留历史FLEURS示例约10.38秒和“篇章”曾识别为“偏长”的记录；这是既有单样本错误说明，不是本次可复现测试、整体准确率或医学验证。界面会显示单次elapsedMs，不提供跨设备性能保证。

当前 UI 仍有首次约65/66MB加载和公开示例按钮文案，按本公开包点击会因资源缺失失败；这是要修的可用性提示，不是“模型已下载”。**没有训练脚本、训练数据交付、训练日志、微调权重、医学WER/CER基准或临床准确率证明**。可明确说“保留通用模型的浏览器推理接入代码”，不能说“本应用训练成功”“护理专用模型”或“已经离线可用”。

### 6.4 本地结果进入业务的门槛

独立本地识别先放 `pendingFinal` 与预览区域。点击“采用”才进入可编辑转写框并清除核对勾选；修改文本再次清除核对。选择知识目的地时，人工核对后才按名称/别名子串匹配候选，用户再点击候选生成不计时草稿；不会推断患者、起算事件或提醒间隔。选择备忘目的地只放入编辑框，未保存。

本地与 API 的采集是不同类：本地 PCM停止尾段等待2秒，API录音等待300ms；不要把一条路线的测试结论套到另一条。安全上下文、HTTPS/localhost权限、AudioWorklet支持、浏览器本地语言包与 WASM 模型资源也是不同前置条件，诊断时逐一分层。

## 7 OpenAI BYOK 接口和安全边界

### 7.1 谁接收数据和承担费用

发送路径为浏览器 → **本站后端** → `https://api.openai.com/v1/audio/transcriptions`，不是浏览器直接绕过本站。key 与音频在本站请求内存中处理，只有这次用户自带 key 被用于上游 Bearer。没有服务器共享 key、拥有者兜底或任意 URL；`OPENAI_API_KEY` 不是本实现所需配置。

`public/api-models.mjs` 是前后端共同的唯一白名单：

```text
gpt-transcribe                         默认
gpt-4o-transcribe
gpt-4o-mini-transcribe
gpt-4o-mini-transcribe-2025-12-15
whisper-1
```

这是**代码允许列表**，不是每个账户的可调用保证；聊天模型、Realtime、说话人分离、第三方兼容代理都不在范围。接手时若要改模型，须一起复核 API契约、账户权限、成本预留和测试，不能仅改界面候选列表。

已查阅的官方入口为 [音频文件转写指南](https://developers.openai.com/api/docs/guides/speech-to-text) 与 [创建转写接口](https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create)。模型可用性、计费、上游数据处理政策会变化，应在经授权真实测试前复核官方说明；不要从本站 `connected` 或静态白名单推导已验证余额/价格。

### 7.2 前端录音和同意生命周期

`api-recorder.mjs` 要求安全上下文、`getUserMedia`、AudioContext、AudioWorklet，用户真实点击才申请麦克风；最长30秒，停止后本机编码16kHz、单声道PCM16 WAV，并释放轨道/音频图。停止录音只形成可试听的本机文件，不上传。

`api-voice-ui.mjs` 管理模型、选文件或录音、个人 key、发送同意。变更音频、模型、key会撤销原同意；点击发送后清空可见 key，成功/失败 finally 从 FormData删除 key。关闭面板、切到别的导航、取消、页面后台、pagehide等会取消录音/请求并清理 key/音频；恢复BFCache时取消并重查会话。代码也监听 `care-alarm-start`，但当前告警未派发此事件，不能承诺这一触发链有效。

结果进入 `#apiTranscript`，需要人工核对后才采用到普通输入框；不会自动解析建卡、自动完成任务。**关闭/取消尚未清空当前 DOM 内的转写文本与人工核对状态**，虽然不持久化，仍是共享设备上的待修隐私体验。

清理不等于密码学擦除 JavaScript字符串或浏览器底层内存，不能约束扩展和密码管理器。取消只发 abort、释放本地资源并忽略晚到结果，**已到上游的请求仍可能收费**；没有自动重试。失败后再手动提交是另一可能计费请求，不能无提示重试来“修复”。

### 7.3 GET 会话检查

```http
GET /api/session
```

正常 JSON 形状如下，三个字段均为布尔：

```json
{"authenticated":false,"connected":false,"owner":false}
```

- `authenticated`：认证 helper 获得稳定 userId 与 email。
- `connected`：有认证、运行配置启用、DB存在、两张额度表各一次 `SELECT site_id ... LIMIT 1` 成功。
- `owner`：userId等于可选 `SITE_OWNER_USER_ID`；不决定是否允许普通登录用户转写。浏览器 `readAPIStatus()` 不使用 owner。

响应 `Cache-Control:no-store`。`connected=true` **不检查表可写、唯一约束、预算余额、OpenAI网络、账户模型权限或真实结果**；它是弱健康检查，不是服务验收。该GET本身不调用OpenAI。

### 7.4 POST 请求契约

```http
POST /api/transcriptions
Origin: <与运行配置完全一致的 HTTPS origin>
Idempotency-Key: <16至80位 A-Z a-z 0-9 _ ->
Content-Type: multipart/form-data; boundary=<浏览器自动生成>
```

浏览器使用 `credentials:'same-origin'`、`cache:'no-store'`、`redirect:'error'`。不要手工覆盖 FormData 的 Content-Type而丢失boundary。请求体**只能**有以下四项，每项恰好一次：

| 字段 | 类型和约束 |
| --- | --- |
| `file` | 非空 Blob，最多 `1900*1024` 即1945600字节；真实结构须通过PCM16 WAV校验 |
| `api_key` | 字符串，8–256字符，不含任何空白；不是有效key证明 |
| `model` | 精确匹配上述五模型白名单 |
| `consent` | 精确字符串 `send-to-openai-paid` |

整份 multipart流最多2097152字节；服务端有界读取而非只信 Content-Length。Origin请求头与实际请求URL的origin都必须等于配置的HTTPS origin。禁止额外 `userId`、`base_url`、`language` 或任意其他字段；也不能重复字段欺骗解析。

上游固定发送 `file`（名 `voice.wav`）、`model`、`response_format=json`，不传自定义provider、重定向、共享凭据、`prompt` 或其他转写参数。成功返回：

```json
{"code":"TRANSCRIBED_REVIEW_REQUIRED","text":"这里是需要人工核对的转写"}
```

上游响应体最多65536字节，`text` 必须字符串且最多12000字符；底层接受空字符串，但UI不能采用空文本。不存在置信度、时间戳、说话人、自动医学纠错、收费明细或任务对象返回。

### 7.5 实际拒绝规则和错误码

验证顺序：可用配置 → 方法 → origin → 启动5秒准备超时 → 可信认证 → 尝试次数 → 幂等key → multipart → 有界读体 → 字段唯一性 → 模型 → 同意 → key → 文件 → WAV → 原子额度预留 → 切20秒上游超时 → 单次上游 → 有界结果检查。

| HTTP | `code` | 含义 |
| ---: | --- | --- |
| 503 | `BACKEND_NOT_CONNECTED` | 关闭或缺必要配置/依赖 |
| 405 | `POST_REQUIRED` | 底层handler非POST；框架只导出POST，其他方法可先由框架处理 |
| 403 | `ORIGIN_REQUIRED` | Origin或请求URL origin不符 |
| 401 | `AUTH_REQUIRED` | 缺可信用户 |
| 429 | `USER_LIMIT_OR_DUPLICATE` | 尝试超限、预算不足、重复幂等key统一错误 |
| 400 | `REQUEST_ID_REQUIRED` | 幂等key格式错误 |
| 415 | `MULTIPART_REQUIRED` | 不是合法入口要求的multipart类型 |
| 400 | `INVALID_FIELDS` | 多余/缺失/重复字段 |
| 400 | `ASR_MODEL_NOT_SUPPORTED` | 不在白名单 |
| 400 | `CONSENT_REQUIRED` | 同意标记不符 |
| 400 | `OWN_KEY_REQUIRED` | key类型、长度或空白检查失败 |
| 415 | `WAV_REQUIRED` | 非Blob、空文件或超过单文件限制 |
| 415 | `AUDIO_INVALID` | WAV内容结构不符合 |
| 408 | `REQUEST_TIMEOUT` | 显式取消/超时检查分支 |
| 502 | `PROVIDER_FAILED_NO_RETRY` | 上游非成功状态 |
| 502 | `INVALID_TRANSCRIPT` | text类型或长度不符 |
| 408或502 | `FAILED_NO_RETRY` | 其他异常；abort后408，其余502 |

不是所有超大请求都返回413：multipart总流超限等异常当前进入502 `FAILED_NO_RETRY`。取消/超时也不总是 `REQUEST_TIMEOUT`，catch可为408 `FAILED_NO_RETRY`。handler通常加 `Cache-Control:no-store` 与 `X-Content-Type-Options:nosniff`；route提前关闭分支只明确加no-store。前端把所有非2xx统一为 `TRANSCRIPTION_FAILED_NO_RETRY`，不会透传上游详细错误/密钥。诊断不能要求用户把key或完整敏感网络记录发到公共issue。

### 7.6 音频校验细则

`server/audio-validator.mjs` 校验 RIFF/WAVE实际二进制，不信扩展名或MIME：PCM tag 1、16-bit little endian、1或2声道、8000–48000Hz、真实时长大于0且≤30秒；RIFF总长、chunk边界、奇数padding、byteRate、blockAlign、PCM整帧均须一致。只接受一个fmt和一个非空data，fmt大小16或18且18时扩展长度为0，最多1024 chunks；其他结构有效的非fmt/data chunks可存在。拒绝MP3、WebM、float WAV、RF64及改名伪装。

它不证明音频有可懂语音、符合患者授权或能得到正确临床转写。浏览器录音输出16k单声道只是本应用输出选择，服务端合法输入范围略宽。

### 7.7 D1 表和额度语义

```sql
-- 概念结构；真正执行文件见 drizzle/0000_robust_richard_fisk.sql
api_attempt_windows(
  site_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  window_start_ms INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  PRIMARY KEY(site_id,user_id,window_start_ms)
)
api_cost_reservations(
  site_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  budget_period_start_ms INTEGER NOT NULL,
  max_cost_micros INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL,
  PRIMARY KEY(site_id,user_id,request_id)
)
-- 索引 api_cost_reservations_period(site_id,user_id,budget_period_start_ms)
-- attempts/cost须正，窗口/预算期/创建时间须非负，详见SQL CHECK
```

`db/schema.ts` 导出 `attempts` 的TypeScript键 `siteId,userId,window,attempts`，`reservations` 的键 `siteId,userId,requestId,period,cost,created`。SQL列名与TS属性名不同，写查询或迁移时不要混用。

`createD1Quota()` 默认每固定60000ms窗口最多3次，预算期86400000ms，按 Unix epoch对齐；不是滚动窗口，不是用户本地午夜。每个 `(site_id,user_id)` 独立，换模型仍共用该用户预算。无效body也可能已消耗一次尝试，只有WAV验过后才预留预算。

尝试用单条upsert原子增加；预留用单条INSERT SELECT同时检查预算和唯一key，避免竞争超支。幂等主键跨所有日期，重复请求返回429，**不缓存重放首次结果**。一次成功预留只允许一次上游尝试；失败、超时和取消均不退预留。测试用12连接SQLite模拟并发，不是云端D1实测。

`max_cost_micros` 是部署者配置的保守计量单位，不是API实测账单，也不查询余额；单次配置必须足够覆盖全部允许模型与最长音频的最坏成本。不能宣传真实OpenAI账户绝不超支。现无退款、账单查询、请求查询或安全ledger归档/删除接口；直接删历史预留会破坏跨日幂等，不可随便加定时清表。

### 7.8 配置和必须替换的占位

| 位置/键 | 当前要求 |
| --- | --- |
| `API_TRANSCRIPTION_ENABLED` | `.env.example` 为 `false`；只有精确字符串 `true` 才尝试启用 |
| `API_EXPECTED_ORIGIN` | 纯HTTPS origin，不能带路径、尾斜杠、账号密码；不能用HTTP localhost冒充已验生产 |
| `API_USER_DAILY_BUDGET_MICROS` | 十进制正安全整数，部署者经成本审查后设置 |
| `API_MAX_COST_MICROS_PER_REQUEST` | 十进制正安全整数且≤日预算，不是客户端可指定 |
| `SITE_OWNER_USER_ID` | 可选，只影响owner展示，不是转写准入限制 |
| `server/runtime-config.mjs` 的 `SITE_ID` | 当前硬编码 `configure-unique-site-id-before-api-use`，**不是现有env变量**；启用前须改成独立部署的稳定唯一ID |
| `.openai/hosting.json` | `project_id:null`、`d1:"DB"`、`r2:null`，不要补回原私有ID |
| `vite.config.ts` D1占位 | 本地模拟数据库配置，不是真实生产数据库 |

`runtimeConfig` 还要求 `env.DB.prepare` 为函数。**SITE_ID占位本身非空，所以现代码不会因它仍是占位而自动阻止启用**；必须把这项列为部署闸门。没有满足全部条件则关闭；配置存在也不证明数据库schema、可信登录或服务商有效。

### 7.9 认证和独立部署底线

`app/chatgpt-auth.ts` 读取可信平台注入的 `oai-authenticated-user-id` 和 `oai-authenticated-user-email`，二者须同时存在；可选姓名按指定UTF-8百分号编码解码。D1身份使用userId，不用email作永久主键。

应用自己不验签这两个头。正式入口必须剥离外部伪造头、完成可信认证、再注入身份；直接把裸Worker暴露公网并相信客户端头会破坏隔离。**不要把测试里构造的认证头抄到生产请求里绕过认证。** 登录身份也不证明医院/组织成员资格；如需限制成员，必须另外实现托管访问策略或服务器端会员白名单。

`/signin-with-chatgpt`、`/signout-with-chatgpt`、`/callback` 属于托管入口保留路径；不要随意在app路由覆盖。portable dev可用loopback mock，它不是真实OAuth，不能带到生产；`npm start`也不模拟登录。GET session、建表和build通过不能替代真实认证链验证。

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
| `public/local-asr/vendor/ort-wasm-simd-threaded.jsep.mjs`、`.wasm` | ONNX Runtime Web运行库；当前worker显式单线程 |
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

## 9 验证证据和不能冒称通过的范围

### 9.1 当前公开候选

编写本文时在未改源码的公开候选上再次执行 `node --test tests/*.test.mjs`：**86 tests，86 pass，0 fail，0 skip**；Node `v24.22.1`。同时复算194个manifest文件SHA-256全部匹配。原公开候选准备阶段还已执行TypeScript `--noEmit` 和 `npm run build`通过；那两项不是本次写文档时新重跑，不应伪造同一轮记录。

此前构建复用已装的锁定依赖，**没有做干净联网安装验收**。ZIP不含node_modules、dist、运行cookie或数据库状态。没有本项目 `npm test` 脚本，正式命令见第3节。

| 测试文件 | 数量 | 真正覆盖 |
| --- | ---: | --- |
| `tests/api-request.test.mjs` | 4 | 前端请求字段、本人key、白名单、拒绝无同意/未连接、finally清理、不重试 |
| `tests/audio-validator.test.mjs` | 11 | WAV结构、声道采样率、边界/截断/填充、30秒/大小、中断 |
| `tests/handler.test.mjs` | 18 | 同源/身份/配置、请求契约、固定上游、预算集成、异常清理、超时、无重试 |
| `tests/quota.test.mjs` | 10 | 本地SQLite+D1 shim的用户/站点隔离、跨日幂等、预算/并发争抢、失败拒绝 |
| `tests/recorder.test.mjs` | 16 | 假浏览器音频环境下采集/flush/30秒/中断/晚到轨道，UI同意撤销与key清理 |
| `tests/preservation.test.mjs` | 3 | 保留资源哈希、可移植认证helper哈希、两主入口及声明 |
| `tests/tuotuo.test.mjs` | 5 | 展示包装委托、不改ack/done、编辑保护和页面元素 |
| `tests/tuotuo-intro.test.mjs` | 7 | 伪DOM中开场阶段、跳过、reduced motion、焦点及抢占 |
| `tests/tuotuo-saver.test.mjs` | 8 | 假电量、隐藏详情、三条未来倒计时、节点复用/排序 |
| `tests/tuotuo-portrait.test.mjs` | 4 | 同文档切换、存储偏好、窄屏恢复、390px静态CSS断言 |
| 合计 | 86 | 不含真实付费上游或真机验证 |

`tests/sqlite-d1.mjs` 是测试辅助，不是另一个测试套件。preservation对已明确移除的模型不假装做存在验证，且部分历史路径被跳过；它不是整个ZIP所有文件校验的替代，因此另做manifest检查。

### 9.2 浏览器和设备证据

已有源码工作台桌面浏览器实测：键盘/重复切换、390px预览、输入草稿保留、已有提醒继续、完成数不变，主体/屏保390px与内容/弹窗358px。它证明的是该测试范围，不是全部工作流。展示相关27项Node测试使用VM/伪DOM/静态断言，不能当Chrome/iOS实际交互记录。

尚未验证：

- 真实麦克风权限弹窗、设备音频解码、后台/锁屏连续提醒、真实硬件震动。
- iPhone/iOS、Android、多种桌面浏览器、辅助技术完整可访问性。
- 录音进行中反复切换390px布局，所有提醒/弹窗/录音竞态。
- BYOK真实浏览器端到端、生产 `/api/session` 与真实认证隔离、生产D1写入/索引/并发。
- 真实OpenAI请求、模型账户可用性、个人余额与实际账单；所有测试上游均模拟，无真实患者音频或计费。
- 缺模型状态之外的独立ASR加载、速度/内存、离线缓存持久性、识别准确性；没有医学基准。
- 全新Windows/macOS/Linux安装矩阵，依赖安全/许可证完整审计；`lint`未记录为已通过。

### 9.3 生产入口紧急修复与本包不同

2026-10-31交接过程中发现：公开v18首页仍无条件调用 `requireChatGPTUser('/')`，实际转到 `signin-with-chatgpt?return_to=%2F` 时出现404，导致用户从根地址不能打开工作台。

已单独部署 **v21入口修复**，提交 `0539ced58ad138c19e118bf6ee2059727664e068`，2026-10-31 04:21:51 UTC部署成功。它基于**v18**，只把公开首页直达静态工作台；API鉴权不变、API仍关闭。修复分支73 tests、类型检查、build通过；云端浏览器从生产根地址实际进入工作台并看到完整界面。此事实不等于所有用户网络/设备均已验证。

**v21不是v20全部功能的部署**：生产分支是v18+入口修复；390px与新版BYOK候选仍以交付v20代码为准，未因此全部上线。不要用版本数字大小替代代码谱系。

既定ZIP和SHA-256没有改，ZIP中的 `app/page.tsx` **仍含旧登录入口**。接手者如要让公开候选首页也直接打开，应在自己分支应用以下精确改动，之后重跑验证，不要宣称原ZIP已经包含：

```diff
-import {requireChatGPTUser} from './chatgpt-auth';
 import {redirect} from 'next/navigation';
 export const dynamic='force-dynamic';
-export default async function Page(){await requireChatGPTUser('/');redirect('/legacy/index.html');}
+// The public demo is browser-local. Protected API routes enforce their own identity.
+export default function Page(){redirect('/legacy/index.html');}
```

这个补丁只释放公开演示首页，不移除 `app/api/` 的认证，不改认证helper，不打开 API，不补密钥。若接手目标是私有站点而非公开演示，先确认访问策略，再决定首页路径，不能把补丁机械当作所有部署都必须匿名的授权。

## 10 已知问题和优先级

以下区分直接代码事实、风险推断与未验事项；本手册未改公开ZIP源码；生产独立入口补丁见9.3。

| 优先级 | 问题和证据 | 建议修复与完成条件 |
| --- | --- | --- |
| P0 接手先做 | ZIP仍保留依赖托管登录的根入口，原生产曾因此404；生产已单独hotfix，见9.3 | 对需要公开入口的新分支应用精确根补丁；根/legacy都可打开，API匿名仍被拒绝或关闭，禁止顺带部署v20 |
| P0 启用前 | `SITE_ID`占位不会自动被拒绝；认证helper依赖可信入口 | 增加占位fail-closed和真实网关检查；恶意外来身份头不生效，独立site/user额度隔离 |
| P0 启用前 | API默认关闭、真实身份/生产D1/付费上游未验 | 维持关闭直到授权测试；先GET无费用检查，再由用户确认本人key和虚构音频的一次可计费测试 |
| P1 | `care-alarm-start`被API/intro监听，但`enqueueAlarm()`未派发 | 加真实入队到API取消的集成测试，再补事件或明确协调器；不能只测试手工dispatch |
| P1 | `doClear()`不清活动告警队列/定时器，文案似全量但只清任务+研究草稿 | 先定义清除范围和保留项；清任务后无悬挂提醒，备忘若保留需明确展示；破坏性清除须用户确认 |
| P1 | 完成队列中的任务未主动去掉告警 | 由产品明确完成是否也停止该项提醒；无论何种策略，保持知悉≠完成并补多队列测试 |
| P1 | 同一浏览器换账户仍共享任务/备忘/草稿 | 先设计身份命名空间和迁移/清理，不能擅自上传历史本地数据；所有测试用虚构资料 |
| P1 | 缺模型与示例却仍显示加载65/66MB/示例按钮 | 先给公开版明确禁用/缺资源说明；授权恢复前不能假造权重、准确率或训练成功 |
| P1 | API关闭/取消保留DOM转写及核对状态 | 定义关闭清理策略、清空文本与核对状态的边界并补测试，保留用户必要草稿时需明确提示 |
| P1 | localStorage仅检查顶层数组；字段损坏可致崩溃 | 增加schema校验、版本迁移、坏数据隔离与可恢复备份，避免静默覆盖或全清 |
| P2 | 设置“前台提示音”仅改`sound`并试听，告警实际读`vibSound` | 合并/澄清真正音效开关并测试，避免开关名与实际行为冲突 |
| P2 | 备忘换日期会清`editingMemo`但保留textarea，可能另存副本；删除/恢复没历史事件 | 明确编辑会话/日期变化行为，补取消编辑、历史查看/完整历史策略 |
| P2 | 页面日期头只初始化一次、跨午夜可能陈旧；统计依赖重渲染 | 增加跨日刷新测试，明确本机日期与班次不是同一概念 |
| P2 | 无跨标签storage同步，多个标签写localStorage可覆盖 | 设计冲突检测和同步，不把单机多标签误说成协作后端 |
| P2 | 异常API请求的前端提示过于统一；超大body落502而非413 | 在不泄露key/上游细节前提下改结构化错误与可操作提示；不新增自动重试 |
| P2 | D1 ledger无安全保留/归档机制，健康检查仅可读 | 先定跨日幂等保存规则，再加健康检查/可观测性；绝不把删表当释放余额 |
| P2 | README模板过时、基础CSS有依赖浏览器恢复的EOF闭合情况 | 清理文档状态与正确路径；改变CSS前做视觉回归和390px重生成，不扩大无关重构 |
| 持续未验 | 真机/后台提醒/语音识别/ASR性能/可访问性 | 建立具体设备与场景测试矩阵，记录失败也可验收为明确不支持，不伪造通过 |

## 11 接手后的验收矩阵

先在独立副本/分支上工作，只用虚构资料。下面是待执行的验收计划，不是本轮全部已经通过。

| 验收项 | 操作 | 通过证据 | 需要的边界 |
| --- | --- | --- | --- |
| 包完整性 | 校验ZIP SHA和194文件manifest | 无缺失/哈希不符，记录工具和时间 | 不改原ZIP冒充旧哈希 |
| 干净安装 | 新目录各平台安装锁定依赖 | 命令退出0、记录OS/Node/npm | 不升级锁、不改代理/TLS来硬过 |
| 静态工作台 | dev和build preview访问legacy | CSS/JS/图像/6音效无错误路径 | 首页认证按所选公开/私有策略另测 |
| 入口补丁 | 根地址直接打开公开演示 | 无signin404，API仍关闭/鉴权 | 只应用9.3补丁，不移除API认证 |
| 人工建卡 | 输入缺字段/完整字段，分别提交 | 缺字段阻止、确认才创建、due符合起点 | 不填临床默认时间 |
| 知悉/完成 | 到时→知悉→查看→完成 | ack时done仍false；完成表单后才true | 多任务队列逐项确认 |
| 更正/总结 | 追加更正、跨日与搜索统计 | 原日志保留、按本机日与任务去重 | 不称不可篡改审计 |
| 提醒不中断 | 返回工作台、打开弹窗、重复切换布局 | 提醒按选定规则继续/停止，数量不改 | 用实际耳听/计时，不能只看DOM |
| 清除/完成竞态 | 有活动队列时清任务/完成 | 无悬挂告警，清理范围明确 | 待先修已知bug |
| 音效映射 | 六首试听、固定/随机、0/70/200% | 路径有效，整曲完后间隔，当前不换曲 | 200%不是硬件能力保证 |
| 屏保 | 空闲10秒、编辑、模态框、录音 | 安全遮蔽、交互保护、无伪造电量 | 真锁屏与后台另测 |
| 开场 | 首次、重播、跳过、Escape、降动态 | 焦点恢复、不挡已有到时提醒 | 不改任务/音频生命周期 |
| 390px布局 | 桌面反复切换、≤760再变宽 | 同文档、草稿/计时/录音实例不重建 | 真机验收单列 |
| 研究知识 | 搜索/多候选/生成/编辑草稿 | 26候选可看，default时间仍null，不计时 | 不自动clinical approve |
| 备忘 | 保存/编辑/软删/恢复/日期变更 | 不新增任务，不增完成数，历史范围如实 | 避免真实资料 |
| 本地ASR缺项 | 点击加载/示例 | 明确缺资源，不云端兜底 | 缺权重不应伪装ready |
| 本地ASR恢复后 | 经许可的合成/公开音频、各设备 | 加载完整性、延迟/内存、错误率可重复 | 先完成许可；不等于临床批准 |
| BYOK无费用 | 默认关闭；改无效模型/无同意/假文件 | 没有上游请求、无共享key、清理正确 | 只用模拟transport |
| 可信会话 | HTTPS staging两用户与匿名 | 匿名拒绝、身份不可伪造、额度隔离 | 需要实际授权部署环境 |
| 上游单次测试 | 本人key+虚构音频+明确付费同意 | 单请求、待核对文本、无自动重试 | 先确认费用，失败仍可能收费 |
| 取消/告警抢占 | 权限待定、录音、flush、发送时取消/入队 | 释放轨道、清key、忽略晚到结果 | 修事件链后做真浏览器测试 |
| 回归 | 86tests、TS、build，另记lint结果 | 每条独立退出码、无敏感日志 | 模拟成功不升级为生产成功 |

## 12 安全修改和回滚

1. 保留原ZIP及校验值，在独立工作副本建分支。解压目录本身没有原v20的 `.git` 历史；GitHub交付仓库的提交和原托管源码提交也不是同一个git谱系。不要直接 `git reset --hard aa61...` 幻想恢复不存在的历史。
2. 改动前记录范围、要保持的不变量、当前测试和可见缺陷。优先补针对问题的失败测试，再做最小修复；不得把本地安装/格式化造成的大量变化混入业务补丁。
3. `rollback-assets.json` 是保留资产基线，**不是自动回滚脚本**。全量恢复可从已验ZIP解压到新目录比较，或在自己初始化后的分支使用明确提交回退；不要覆盖用户未提交改动。
4. 改CSS后重生成竖屏样式，实测桌面/390px/真窄屏。改任务/存储schema要先有兼容/迁移与回退计划；不要让旧localStorage自动毁坏。
5. 数据库回滚与代码回滚分开。当前没有向下迁移；已经预留的ledger代表防重/额度事实，不可为了“回滚API”删除。新schema应兼容原表，远程迁移前做有权的备份及恢复验证。
6. 发现API问题时先恢复关闭开关、停止新上游调用；已发出的请求可能仍收费。不要紧急换成拥有者共享key、不可信代理或关闭鉴权。
7. 生产回滚需要另外授权，并选实际保存/验收过的部署版本；公开ZIP含配置占位，不能当生产一键回滚包。当前生产v21仅入口修复，若回退v18会重新引入根登录404，需明确权衡。
8. 新交付包改任何文件都须重算SHA、更新manifest、归档说明、验证差异与许可范围，保留旧版本可追溯。只更新本手册不会改变先前ZIP哈希；不要给新文档伪造包内自校验。

## 13 可直接交给本地模型的接手提示词

```text
你接手的是 TUOTUO 照护工作原型，目标是在自己的本地环境安全理解和维护代码。
先读 TUOTUO-LOCAL-MODEL-HANDOVER.md 的版本矩阵与验收边界，再定位解压后的
package.json、public/legacy/index.html 和 PUBLIC-FILE-MANIFEST.json；不要在只有ZIP
的交付仓库根运行npm。先核实实际文件和哈希，不假设聊天历史、私有环境或原git历史存在。

当前公开源码基于v20并做公开化清理；生产是v18基础上的v21入口修复，v20的全部功能
尚未部署。ZIP不含v21根入口补丁。不要以版本数字大推导已合并全部功能。
若目标是继续公开演示，先在新分支按手册9.3审查并应用公开根入口补丁；API鉴权不变。

本原型只用虚构资料。不要推断医嘱、医学时间、患者身份或临床结论；缺字段先追问。
提醒到时、已知悉和工作完成是三件不同的事，ack不能设置done。研究知识草稿默认不计时。
任务/备忘/草稿在localStorage，不按登录用户隔离；D1只存API配额元数据。
本地模型权重和FLEURS示例被明确排除，不能声称完整离线/训练成功，也不能擅自补回。

BYOK只用用户本人当次输入的key，经本站后端到固定OpenAI官方转写地址，严格五模型
allowlist；变更key/模型/音频撤销同意，不存key、无共享兜底、不自动重试。
API默认关闭。不要使用假身份头绕过生产认证、不要自动开启付费测试或生产部署。
取消不保证未计费；SITE_ID占位必须主动替换；connected不证明上游可用。

先向我报告：实际文件/版本，如何运行，已经验证什么、未验证什么，你计划改哪几个文件，
需保持哪些行为。不要先进行整站重构、依赖升级、格式化全库或修改系统代理/TLS安全策略。
只执行我授权的范围；涉及部署、远程数据库、费用、数据公开或许可证恢复时先取得明确授权。
任何源码改动后跑node测试、类型检查、构建；UI改动还需实际浏览器验证，不用伪DOM代替真机。
最终交付应列出变更文件、证据、剩余风险、回滚办法；严禁把真实key、患者资料、邮箱、OTP、
私有服务ID或内部路径写入GitHub、日志和截图。
```

### 建议读文件顺序

1. 本手册、交付根短说明与外部manifest；再看包内 `PUBLIC-CANDIDATE.md` 的打包快照边界。
2. `package.json`、`package-lock.json`、`scripts/execution-profile.mjs`、`scripts/run-framework.mjs`、`vite.config.ts`、`.openai/hosting.json`。
3. `app/page.tsx`、`app/layout.tsx`、`app/chatgpt-auth.ts`、`worker/index.ts`，理解公开入口与认证边界不是同一层。
4. `public/legacy/index.html`，按脚本和CSS加载顺序看 `app.js` → `sounds.js` → `knowledge.js` → `memos.js` →各语音模块 → TUOTUO展示包装。
5. `public/voice-intake.mjs`、`local-asr-ui.mjs`、`local-asr/`全套、`LICENSES.txt`，区分浏览器语言包与Whisper权重。
6. `public/api-models.mjs`、`api-recorder.mjs`、`api-request.mjs`、`api-voice-ui.mjs`，再看 `app/api/`、`server/`、`db/schema.ts`、实际Drizzle迁移。
7. `tests/`逐项对照实现，重点检查真实事件接线而不只是测试手动调用。
8. 知识JSON、素材归属/notices、manifest与下方完整文件索引；最后才查未被业务使用的starter组件和connector基础设施。

### 绝对不能混淆的结论

- GitHub已公开 ≠ v20已部署；生产v21入口补丁 ≠ v20功能全部上线。
- build通过 ≠ fresh install通过；86个模拟测试 ≠ 真实API/真机/临床验收。
- 本地JS/WASM运行库存在 ≠ 模型权重存在；推理代码 ≠ 实际训练。
- 26条知识 ≠ 26个独立来源 ≠ 院内批准 ≠ 可自动计时。
- 录音停止 ≠ 上传同意；转写返回 ≠ 已核对；采用文本 ≠ 创建/完成任务。
- 知悉 ≠ 完成；音效 ≠ 硬件震动；浏览器屏保 ≠ 安全锁屏/可靠后台闹钟。
- 登录 ≠ 组织成员授权；服务器额度隔离 ≠ 浏览器localStorage跨用户隔离。
- `connected:true` ≠ 模型权限/余额/费用上限保证；取消 ≠ 不收费。
- 公开源码 ≠ 全材料自由授权；权限/来源未核实的缺项不能靠模型猜测补齐。

## 附录 A 完整源码文件索引

以下索引由本次公开候选实际文件树生成，共195个文件；这是解压项目的索引，不包含交付根额外的本手册。精确SHA-256看 `PUBLIC-FILE-MANIFEST.json`（194项，不自哈希），不要将下方简化职责表替代清单。

```text
.env.example
.gitignore
.npmrc
.openai/hosting.json
ASSET-RIGHTS-PENDING.md
BYOK-ASR-HANDOFF.md
PUBLIC-CANDIDATE.md
PUBLIC-FILE-MANIFEST.json
README.md
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
next.config.ts
package-lock.json
package.json
postcss.config.mjs
public/api-models.mjs
public/api-recorder.mjs
public/api-request.mjs
public/api-voice-ui.mjs
public/app.js
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
server/quota.d.mts
server/quota.mjs
server/runtime-config.d.mts
server/runtime-config.mjs
server/transcription-handler.d.mts
server/transcription-handler.mjs
tests/api-request.test.mjs
tests/audio-validator.test.mjs
tests/handler.test.mjs
tests/preservation.test.mjs
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
