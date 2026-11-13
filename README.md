# VCG 视觉控制生成器 · Visual Control Generator

> DeepSeek Harness Web GUI 插件：仿 ComfyUI 的**节点式图像 / 视频生成工作流画布**，把线下重运算换成**云端 DeepSeek Harness 模型 API 调用**（默认），也支持本地 ComfyUI 运算。聊天界面新增 **VCG 画布模式**替代传统对话消息区，并可创建 **VCG 项目工作区**（其中所有对话都以 VCG 画布打开）。画布工具栏内置 **AI 建流** 入口（弹窗输入自然语言即可生成/改写节点连线），并支持 **画布分区（Zone）** 为大型工作流做可视化分组。

- 节点与工作流仓库：[DSH_VCG_repo](https://github.com/Zymjason/DSH_VCG_repo)　|　镜像：https://gitea.com/ZymJason_DSH/DSH_VCG_repo
- 插件本仓库同时发布在：GitHub `Zymjason/DSH_VCG`　|　Gitea `ZymJason_DSH/DSH_VCG`
- 版本与变更记录：[CHANGELOG.md](CHANGELOG.md)（当前 v1.3.0）

---

## 功能

| 能力 | 说明 |
|---|---|
| VCG 画布模式 | 会话顶部出现「Chat / VCG 画布」页签；VCG 画布替换传统消息区，消息输入框保留用于与 AI 对话、让 AI 改工作流 |
| 新建聊天选择 | 空白会话的 New Session 行提供「VCG 模式」选择；VCG 工作台的「新建 VCG 对话」会预先写入视图偏好，创建即进入画布 |
| VCG 项目工作区 | 创建工作区目录并注册为 Harness Workspace；从 VCG 面板创建的会话默认 VCG 画布 |
| AI 自动组建工作流 | 画布工具栏「AI 建流」按钮打开弹窗，输入自然语言 → 调用宿主 LLM，产出通过校验的节点/连线 JSON，直接替换/改写当前画布 |
| 节点式交互 | 节点实时拖动、端口拖线（类型校验）、连线选中/删除、Delete 删除、滚轮缩放、空白平移、适应画布；**不提供任何右键菜单** |
| 画布全屏 | 会话 VCG 画布与工作台画布均有「全屏画布」按钮：画布固定铺满整个窗口，`Esc` 退出 |
| 运行 / Debug 运行 | 画布顶部工具栏统一提供「运行全部」与「Debug 运行」（两个视图位置一致）；Debug 只校验模型能否加载、工作流/节点完整性与安全性，**不生成内容、不写输出文件** |
| 实时运行状态 | 运行中每 500ms 读取 Host 运行记录：节点实时显示等待中 / 运行中 / 已完成（耗时）/ 失败，完成结果即时出现，工具栏显示进度与当前节点 |
| 拖线即建节点 | 从端口拖线在空白画布松开 → 呼出「添加节点并连接」菜单，按端口类型过滤兼容节点，自动创建节点并连线 |
| 画布分区（Zone） | 一键框选/创建半透明分区，可命名（标题栏铅笔按钮或双击）、改色、拖拽与缩放；拖动节点进入分区会高亮提示、松开即加入分区，拖动分区标题栏会带着分区内节点一起移动；分区随工作流 JSON 保存 |
| 节点工作流仓库侧边栏 | 左侧栏新增「VCG 节点工作流仓库」页：按分类/搜索浏览 DSH_VCG_repo 的节点与工作流，卡片式勾选、批量导入；默认只显示人工审核通过的 `main`，开启开发者模式后可查看 `dev/bug/recheck` 未审核分支（危险确认 + 「未审核」徽标）；仓库地址仍在设置中配置 |
| 云端生成 | 自动检测全局 API（Alibaba Token Plan / `wan2.7-image`、`qwen-image-3.0-pro`、`qwen3.8-max` 等），也支持自定义 provider（bailian-chat-image / openai-images / openai-video / custom-http） |
| 界面主次 | 画布占满可用空间：节点库默认收起、低频控制收进画布工具栏「更多」、运行/Debug 按钮放大、AI 建流收进弹窗、页面头部压缩为单行 |
| API 全量检测 | 「自动检测」除宿主 LLM 配置外，还会读取每个 provider 的 `GET {baseUrl}/models` 全量模型（含 `audio` 等非生成类，写入 `models.all` / `models.audio`），不再局限于配置子集 |
| 本地运算（可选） | 设置中开启后，工作流翻译为 ComfyUI API prompt 提交本地 `/prompt` 并轮询 `/history`，取回 `/view` 图片 |
| 专业模式 | 设置页开关，开启后才允许导入声明式 HTTP 自定义节点（`executor.kind="http"`）与本地工具 |
| 本地工具与模型 | 专业模式下可检测/一键安装本地 PyTorch（CPU 版）与 safetensors；模型目录管理、按节点/工作流 `models[]` 声明下载、下载前比对仓库可信源 `trusted-sources.json`，不可信源弹窗警告并二次确认 |
| 本地权重检查节点 | 内置 `local-safetensors-inspect`：用本地 Python 读取 `.safetensors/.ckpt/.pt` 张量元数据，不联网、不消耗 token；未装工具时给出安装指引 |
| Token 实时统计 | 画布工具栏下方统计条实时汇总本次运行的输入/输出/合计 token、节点数/耗时；随运行轮询更新 |
| 仓库自动审计与分支治理 | DSH_VCG_repo 所有上传只能走 PR，自动审计类型声明/文件规范/重复提交/模型来源安全；未审核进 `dev`、打回进 `bug`、issue 复核进 `recheck`，人工审核通过才并入 `main`；每天 22:00（北京）双向镜像全部分支 |
| 输出管理 | 每次生成落到「工作区（或项目目录）/ vcg-output」，输出画廊可预览、复制路径 |
| Agent 工具 | 向模型暴露 `vcg` 工具：AI 可自行建流、跑流、Debug 校验（`debug_workflow`）、浏览/导入节点仓库（`list_repo_nodes` / `install_repo_node`）、看状态、同步节点仓库 |

## 安装

插件以 bundle 目录形式安装（Live profile）：

```text
插件目录：<workspace>/DSH_VCG
安装：Harness Web GUI → 设置 → 插件 → 从目录安装 bundle，选择该目录
```

安装后：

1. 左侧栏出现两个图标：**VCG 工作台** 与 **VCG 节点工作流仓库**；
2. 设置 → **VCG 视觉控制生成器**：确认已自动检测到云端生图 API（默认使用全局 `BAILIAN_TPP_API_KEY`）；
3. 任一会话顶部出现 **VCG 画布** 页签；
4. 新建会话时可选 **VCG 模式**，或从工作台创建 **VCG 项目工作区**。

### 依赖

- 宿主已登录可用的生图模型 API（推荐全局 Alibaba Token Plan：`wan2.7-image` / `qwen-image-3.0-pro`）；没有该 key 时可在设置页添加其他 provider。
- 本地模式需要另装 ComfyUI 并开放 HTTP 服务（例如 `http://127.0.0.1:8188`）。

## 快速开始（文生图）

1. 打开 VCG 画布页签，默认已放置 `prompt-input → model-loader / empty-latent-image → ksampler → vae-decode → image-output` 六节点示例；
2. 在 **提示词输入器** 填写正向 / 负面提示词，在 **图片属性定义器 / 空潜空间** 设定尺寸（如 1280×720）；
3. 先点「Debug 运行」确认模型可加载、连线/参数/安全校验通过（不生成内容）；
4. 点顶部 **运行工作流**（画布内为「运行全部」）；
5. 云端 `wan2.7-image` 返回图片，`vae-decode` 直通、`image-output` 落盘到工作区 `vcg-output/`，节点上直接显示缩略图。

或点击画布工具栏的「AI 建流」，在弹窗中输入：`生成 16:9 赛博朋克城市夜景，1280x720，负面排除水印` → **自动组建**（生成期间画布在弹窗后即时更新，AI 回复/建议在同一弹窗内展示）。

## 节点

内置节点（同时是 DSH_VCG_repo 的标准实现）：

`Checkpoint Loader`（主模型加载器）、`CLIP Text Encoder`（提示词编码器）、`Empty Latent Image`（空潜空间）、`KSampler`（采样器）、`VAE Decode`（解码器）、`Model Loader`、`Prompt Input`（正向/负面提示词）、`Image Props`（尺寸/像素）、`Image Output`（输出目录=工作区）、`Video Sampler`、`Video Output`、`Text Input/Output`、`Note`、`Example Node`（自定义 HTTP API 节点示例）。

节点定义 JSON 规范见 [DSH_VCG_repo/docs/node-spec.md](https://github.com/Zymjason/DSH_VCG_repo/blob/main/docs/node-spec.md)；工作流规范见 `docs/workflow-spec.md`。

## 云端 API 说明（默认路径）

- OpenAI 兼容端点：`POST {baseUrl}/chat/completions`；
- 生图 body：

```json
{
  "model": "wan2.7-image",
  "messages": [{ "role": "user", "content": [{ "type": "text", "text": "提示词" }] }],
  "parameters": { "size": "1280*720", "n": 1 }
}
```

- 响应图片位于 `output.choices[*].message.content[*].image`（URL），插件下载后落盘；
- 尺寸必须为 `"W*H"`；网络/429/5xx 自动重试 2 次；4xx 直接返回可读错误；
- 视频模型（如 `wan3.0-video`）在 chat 端点通常返回 400，插件会提示改配 `openai-video` 类 provider；
- **全量模型检测**：设置页「自动检测」及 Agent 工具 `vcg detect_providers` 会读取每个 provider 的 `/models`（8s 超时、并行、失败不影响其他 provider），把返回的全部模型 id 写入 `models.all`，并把生成类模型分到 `image` / `video` / `text`、语音类分到 `audio`；返回的 `allModels` 与 `discovered` 可查看每个 provider 实际读取到的模型与状态。

## 本地 ComfyUI（可选）

设置 → VCG → 开启「本地运算模式」，填写 ComfyUI 地址与超时。插件按每个节点的 `local.comfyui.class_type/map` 把画布翻译成 ComfyUI API prompt；未配置地址时会给出明确错误而不是静默失败。

> 开启本地运算后**所有运算都在本机运行**，请注意硬件性能（显存/内存/耗时）。

## 专业模式与自定义节点

专业模式（设置页）→ 粘贴节点 JSON → 导入。自定义节点必须声明：

- `executor.kind = "http"`，含 `request`（url/method/headers/body/timeoutMs）与 `response`（JSONPath 取值）;
- 所需 API 在节点 `params` / `cloud` 中声明（插件设置里按需配置对应 provider）。

> 仅建议具备专业视觉生成经验者使用；导入节点会按其声明发起 API 调用，不保证工作流正常运行。

仓库中 `executor.kind="http"` 的自定义节点需要专业模式才能导入；在「VCG 节点工作流仓库」页会显示「需专业模式」徽标并给出设置入口。

## 画布全屏 / 运行 / Debug 运行

- **全屏画布**：工具栏最右侧的画布图标按钮（`fit` / `close`），进入后画布 `position:fixed` 铺满窗口，`Esc` 退出；会话 VCG 画布与工作台画布行为一致。
- **运行 / Debug 运行统一在画布工具栏**：会话 VCG 画布与工作台画布的**画布顶部工具栏**都只有一组「运行全部」+「Debug 运行」，位置一致；页面顶部不再重复放按钮。运行中「运行全部」变为「停止」（会话画布）或禁用的「运行中…」（工作台），Debug 按钮在运行/校验期间禁用并显示「校验中…」。
- **实时运行状态**：运行期间前端每 500ms 读取 Host 的运行记录，节点卡片实时切换「运行中 / 完成（耗时）/ 失败」，已完成的图片/视频结果立即出现在对应节点里，不必等整条工作流结束；停止或结束后以最终运行结果为准。
- **Debug 运行**：不填任何内容、不调用生图/生视频 API、不写输出文件，只做校验并在弹窗中分组展示：
  - `结构完整性` 节点/连线 schema、节点类型是否存在；
  - `连线与拓扑` 端口存在性、类型兼容、必需输入、重复连线、环路、孤立节点；
  - `参数` 下拉合法值、数字范围、模型留空、文本长度；
  - `运行引擎 / 模型加载` 云端/本地引擎可用性、本地 ComfyUI 地址；
  - `模型加载` 执行器/模型路由、API Key 是否配置、`/models` 探测（可关闭网络探测，仅离线静态校验）；
  - `安全性` 输出目录与文件名越界、危险 id、自定义 HTTP 节点的 URL/超时与专业模式。
  - 报告底部在全部通过时提供「正式运行」按钮；未通过会列出失败项，修正后再运行。

## 画布分区（Zone）

画布工具栏的「分区」按钮可为大型工作流建立可视化分区：

- **创建**：有选中节点时按选中节点包围盒 + 36px 内边距创建分区；未选中时在视口中心创建 520×340 分区。分区自动命名「分区 N」并选中。
- **改名 / 改色**：标题栏 hover/选中时显示铅笔按钮，点击即可内联改名（也可直接双击标题）；`Enter` 提交、`Esc`/失焦取消、空值回退「分区 N」；点击标题栏左侧色点循环 5 种预设颜色。
- **把节点放进分区**：拖动节点时，节点中心所在的分区会高亮并提示「松开加入分区」；松开后节点自动成为该分区成员（并从其它分区移出），拖到分区外则移出所有分区。拖动分区标题栏时，**分区成员节点 + 拖动开始时中心在分区内的节点**会一起移动；标题栏显示「N 节点」成员数。
- **连线跟随**：节点/分区拖动时连线与节点在同一坐标系下实时跟随（任意缩放比例一致），释放后按最终坐标立即校准，不再出现连线错位或滞后。
- **缩放**：拖动右下角手柄调整大小（最小 160×100）。
- **删除**：选中分区后按 `Delete`，或点击标题栏的删除按钮（只删分区，不删节点）。
- **持久化**：分区保存在工作流 JSON 的顶层 `zones` 数组中（`id/label/x/y/w/h/color/nodes`），随工作流一起保存、复制与运行；运行与 Debug 校验会忽略分区，不影响图校验和执行。
- 分区主体不拦截鼠标事件：平移画布、拖节点、拖线在分区内部照常工作；缩放比例很低时标题栏/手柄的命中区域也会变小，可先放大画布再精细操作。

> 界面布局：节点库面板默认收起（点工具栏左侧图标展开）；引擎模式、小地图、节点/连线数量与输出目录收进工具栏「更多 ▾」；工作台与聊天 VCG 画布的头部压缩为单行，画布占满剩余高度。

## 节点工作流仓库侧边栏（仅专业模式）

左侧栏第二个 VCG 图标打开「VCG 节点工作流仓库」（主面板 key `dsh-vcg-repo`）。**该入口只在「专业模式」开启时出现**：未开启时侧栏与面板都不注册；在「设置 → VCG 视觉控制生成器」打开专业模式后立即出现，关闭后立即隐藏，无需刷新页面。仓库页能力：

- 顶部切换仓库来源（自动 / GitHub / Gitea）并显示当前拉取地址、版本、拉取时间；仓库地址只读，修改请到「设置 → VCG 视觉控制生成器 → 节点仓库」；
- 节点按分类 + 搜索过滤，卡片展示名称/引擎/能力/参数，点击卡片打开详情（端口、参数、ComfyUI 映射、执行器说明）；
- 勾选未安装的节点后批量「导入」，或对单个节点「导入」；已安装节点显示「已安装」徽标；需要专业模式的 HTTP 节点会提示先开启专业模式；
- 「仓库工作流」区展示仓库内置工作流与安装状态，「已安装自定义节点」区列出可删除的导入节点（仓库/内置节点受保护，不可在此删除）。

## 仓库分支与开发者模式

- 客户端默认只读取人工审核通过的 `main` 分支；节点库/仓库页对非 main 来源显示「未审核」徽标。
- 设置 → VCG → **开发者模式**：开启前弹出危险确认（未审核节点/工作流可能包含恶意代码或不可信模型下载），确认后可切换 `dev`（未审核）、`bug`（打回）、`recheck`（issue 复核）分支查看与下载；关闭立即回 `main`。
- 开发版仅用于参与仓库审核流程；普通使用请保持关闭。

## 仓库上传与审计（DSH_VCG_repo）

- 所有上传只能通过 Pull Request，PR 模板必须声明 `type: node|workflow`、`files`、`submitter`，重新提交需 `supersedes: #旧PR`。
- CI 自动审计：文件类型/路径、节点或工作流规范、跨分支重复（id/文件名/内容 sha256，重复即打回）、模型声明安全（不可信源/缺 sha256/非 https 仅警告）。
- 未审核内容进入 `dev`；审计/人工审查不通过复制到 `bug`（PR 保持打开）；issue 中报告的问题节点/工作流移入 `recheck` 复核。人工审核通过后才并入 `main`。
- 每天北京时间 22:00 自动同步 GitHub 与 Gitea 的全部分支与 tag。流程、标签与权限配置见仓库 [docs/review-policy.md](https://github.com/Zymjason/DSH_VCG_repo/blob/main/docs/review-policy.md)。

## 本地工具与模型（专业模式）

- 打开「专业模式」后，设置页出现「本地工具与模型」：检测 `python3/pip/torch/safetensors/CUDA`、显示磁盘余量，并可一键安装 PyTorch CPU 版（约 200MB）与 safetensors。
- 模型目录默认 `~/.dsh/dsh-vcg/models`，支持 `.safetensors/.ckpt/.pt/.pth/.bin`。
- 节点/工作流可通过 `models[]` 声明推荐权重（名称、文件名、URL、大小、sha256、许可证）。下载前比对仓库可信源清单；非权威来源会弹窗列出风险并要求二次确认。
- 节点参数类型 `model` 会渲染为已下载模型下拉；可在参数内直接下载声明中的权重。
- 本地权重检查示例：同步节点仓库后使用「本地权重检查器」节点，或直接打开示例工作流「本地权重检查示例」。

## Token 统计

画布工具栏与画布之间新增 token 统计条：运行中实时汇总本次运行的输入/输出/合计 token 与节点数/耗时；模型未返回用量时显示「本次运行未返回用量」。

## 拖动连线呼出节点菜单

- 从任意节点端口的圆点按住拖出连线，**在空白画布上松开**：不取消连线，而是在落点弹出「添加节点并连接」菜单，连线保持悬停状态；
- 菜单只列出与拖拽端口**类型兼容**的节点：从输出端口拖出时列出含兼容输入端口的节点，从输入端口拖出时列出含兼容输出端口的节点；支持搜索框过滤，`Enter` 直接选中第一项，`Esc` 关闭；
- 选中候选后：在落点附近创建该节点（自动避开已有节点）、自动选用第一个兼容端口建立连线（从输入端口拖出时若该输入已有连线则替换），并选中新节点；
- 释放点落在节点主体、端口、缩略图或工具栏上时不弹菜单（仍按普通点击/取消处理）。

## 架构

```text
浏览器 (client.js)                         Host (index.js + lib/)
┌──────────────────────────────┐          ┌──────────────────────────────┐
│ conversation.view  → ChatCanvasView     │ RPC  POST api/dsh-vcg/rpc     │
│ main (key dsh-vcg) → StudioPage         │  state / saveSettings / ...   │
│ main (key dsh-vcg-repo)*→ NodeRepoPage  │  debugWorkflow（只校验）       │
│ * 仅专业模式注册                        │  runStatus（实时运行记录）     │
│ settings.section   → SettingsPage       │  listRepoNodes / installRepoNode│
│ sidebar.panellist  → PanelIcon / RepoPanelIcon │ ┌─ providers（检测/云端调用） │
│ conversation.view  → ChatCanvasView     │  ├─ engine（拓扑执行/落盘）    │
│ parts/core.js 共享 V API（rpc/ui/store）│  ├─ comfyui（本地翻译/轮询）   │
└──────────────────────────────┘          │  ├─ builder（AI 建流）         │
                                          │  ├─ nodes（内置+仓库同步）     │
                                          │  ├─ projects（工作区注册）     │
                                          │  └─ tool `vcg` + 系统提示      │
                                          └──────────────────────────────┘
```

- 状态持久化：`$DSH_PROFILE_DIR/data/dsh-vcg/state.json`（权限 0600，API key 只在 Host 内使用、RPC 只回掩码）；
- 画布存储：按会话 `session:<id>` 或项目 `project:<id>` 保存于 state 的 `canvases`；
- 节点/工作流：内置 `DSH_VCG/nodes|workflows`，可从 DSH_VCG_repo 的 raw 地址同步；
- 生成输出：`<工作区/项目目录>/vcg-output/`。

## 安全与边界

- API key 不进入浏览器：Client 只看到 `hasKey` 掩码；
- 所有文件写入限制在会话工作区/项目目录与插件数据目录内（拒绝 `..` 逃逸）；
- 云端调用只发往用户配置的 provider；本地模式只访问用户填写的 ComfyUI 地址；
- 删除工作流/项目只删除插件记录，不物理删除用户代码目录。

## 常见问题

- **节点仓库同步失败 / GitHub raw 不可达**：设置 → VCG → 节点仓库，把同步来源切到 **Gitea**（`https://gitea.com/ZymJason_DSH/DSH_VCG_repo`）后重试；同步失败会回退内置节点，不会破坏现有画布。
- **没有检测到生图 API**：确认宿主已配置全局 API（本部署为 `BAILIAN_TPP_API_KEY`，模型含 `wan2.7-image`），或在设置页添加自定义 provider 并测试连接。
- **本地模式报错**：需要本机 ComfyUI 服务（默认 `http://127.0.0.1:8188`）；未配置地址时会明确报错，不会静默回退云端。
- **Debug 运行提示「自定义节点需要专业模式」**：该节点 `executor.kind="http"`，到「设置 → VCG → 专业模式」开启后重试（Debug 只校验，不会发起生成）。
- **节点工作流仓库页显示「未就绪」**：客户端构建缺少 `parts/repo.js`，在插件目录执行 `node build.mjs` 生成 `client.js` 后刷新页面。
- **AI 组建的工作流连线不完整**：插件会自动按类型补线并把修正写入提示；仍缺连线时画布上对应输入端口会显示黄色警告，可手动连接。

## 开发

```bash
cd DSH_VCG
node build.mjs            # parts/*.js → client.js
node --check index.js && node --check lib/*.js
node scripts/self-test.mjs
```

节点/工作流规范与示例见 [DSH_VCG_repo](https://github.com/Zymjason/DSH_VCG_repo)。

## License

MIT
