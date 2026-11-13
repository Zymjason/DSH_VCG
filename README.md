# VCG 视觉控制生成器 · Visual Control Generator

> DeepSeek Harness Web GUI 插件：仿 ComfyUI 的**节点式图像 / 视频生成工作流画布**，把线下重运算换成**云端 DeepSeek Harness 模型 API 调用**（默认），也支持本地 ComfyUI 运算。聊天界面新增 **VCG 画布模式**替代传统对话消息区，并可创建 **VCG 项目工作区**（其中所有对话都以 VCG 画布打开）。画布上方内置 **AI 自动组建工作流**模块：用自然语言描述需求即可生成/改写节点连线。

- 节点与工作流仓库：[DSH_VCG_repo](https://github.com/Zymjason/DSH_VCG_repo)　|　镜像：https://gitea.com/ZymJason_DSH/DSH_VCG_repo
- 插件本仓库同时发布在：GitHub `Zymjason/DSH_VCG`　|　Gitea `ZymJason_DSH/DSH_VCG`

---

## 功能

| 能力 | 说明 |
|---|---|
| VCG 画布模式 | 会话顶部出现「Chat / VCG 画布」页签；VCG 画布替换传统消息区，消息输入框保留用于与 AI 对话、让 AI 改工作流 |
| 新建聊天选择 | 空白会话的 New Session 行提供「VCG 模式」选择；VCG 工作台的「新建 VCG 对话」会预先写入视图偏好，创建即进入画布 |
| VCG 项目工作区 | 创建工作区目录并注册为 Harness Workspace；从 VCG 面板创建的会话默认 VCG 画布 |
| AI 自动组建工作流 | 画布上方输入自然语言 → 调用宿主 LLM，产出通过校验的节点/连线 JSON，直接替换画布 |
| 节点式交互 | 节点实时拖动、端口拖线（类型校验）、连线选中/删除、Delete 删除、滚轮缩放、空白平移、适应画布；**不提供任何右键菜单** |
| 画布全屏 | 会话 VCG 画布与工作台画布均有「全屏画布」按钮：画布固定铺满整个窗口，`Esc` 退出 |
| 运行 / Debug 运行 | 画布顶部显著的主按钮「运行工作流」；旁边的「Debug 运行」只校验模型能否加载、工作流/节点完整性与安全性，**不生成内容、不写输出文件** |
| 节点工作流仓库侧边栏 | 左侧栏新增「VCG 节点工作流仓库」页：按分类/搜索浏览 DSH_VCG_repo 的节点与工作流，卡片式勾选、批量导入；仓库地址仍在设置中配置 |
| 云端生成 | 自动检测全局 API（Alibaba Token Plan / `wan2.7-image`、`qwen-image-3.0-pro`、`qwen3.8-max` 等），也支持自定义 provider（bailian-chat-image / openai-images / openai-video / custom-http） |
| 本地运算（可选） | 设置中开启后，工作流翻译为 ComfyUI API prompt 提交本地 `/prompt` 并轮询 `/history`，取回 `/view` 图片 |
| 专业模式 | 设置页开关，开启后才允许导入声明式 HTTP 自定义节点（`executor.kind="http"`） |
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

或直接在画布上方输入：`生成 16:9 赛博朋克城市夜景，1280x720，负面排除水印` → **自动组建**。

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
- 视频模型（如 `wan3.0-video`）在 chat 端点通常返回 400，插件会提示改配 `openai-video` 类 provider。

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
- **运行工作流**：主色按钮，运行整张工作流；运行中变为「运行中…」，画布内也保留运行全部 / 单节点运行。
- **Debug 运行**：不填任何内容、不调用生图/生视频 API、不写输出文件，只做校验并在弹窗中分组展示：
  - `结构完整性` 节点/连线 schema、节点类型是否存在；
  - `连线与拓扑` 端口存在性、类型兼容、必需输入、重复连线、环路、孤立节点；
  - `参数` 下拉合法值、数字范围、模型留空、文本长度；
  - `运行引擎 / 模型加载` 云端/本地引擎可用性、本地 ComfyUI 地址；
  - `模型加载` 执行器/模型路由、API Key 是否配置、`/models` 探测（可关闭网络探测，仅离线静态校验）；
  - `安全性` 输出目录与文件名越界、危险 id、自定义 HTTP 节点的 URL/超时与专业模式。
  - 报告底部在全部通过时提供「正式运行」按钮；未通过会列出失败项，修正后再运行。

## 节点工作流仓库侧边栏

左侧栏第二个 VCG 图标打开「VCG 节点工作流仓库」（主面板 key `dsh-vcg-repo`）：

- 顶部切换仓库来源（自动 / GitHub / Gitea）并显示当前拉取地址、版本、拉取时间；仓库地址只读，修改请到「设置 → VCG 视觉控制生成器 → 节点仓库」；
- 节点按分类 + 搜索过滤，卡片展示名称/引擎/能力/参数，点击卡片打开详情（端口、参数、ComfyUI 映射、执行器说明）；
- 勾选未安装的节点后批量「导入」，或对单个节点「导入」；已安装节点显示「已安装」徽标；需要专业模式的 HTTP 节点会提示先开启专业模式；
- 「仓库工作流」区展示仓库内置工作流与安装状态，「已安装自定义节点」区列出可删除的导入节点（仓库/内置节点受保护，不可在此删除）。

## 架构

```text
浏览器 (client.js)                         Host (index.js + lib/)
┌──────────────────────────────┐          ┌──────────────────────────────┐
│ conversation.view  → ChatCanvasView     │ RPC  POST api/dsh-vcg/rpc     │
│ main (key dsh-vcg) → StudioPage         │  state / saveSettings / ...   │
│ main (key dsh-vcg-repo) → NodeRepoPage  │  debugWorkflow（只校验）       │
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
