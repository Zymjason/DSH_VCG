# DSH_VCG 内部协作契约（Lead 维护，勿改）

本文件是并行开发的唯一接口契约。所有模块必须按此实现；改动契约必须先通知 Lead。

产品名：**VCG 视觉控制生成器 / Visual Control Generator**（DeepSeek Harness Web GUI 插件）。
两个仓库：

- `DSH_VCG` —— 本插件（Host + Client + 文档）。包名 `@local/dsh-vcg`，bundle id `dsh-vcg`。
- `DSH_VCG_repo` —— 节点 / 工作流仓库（JSON 定义 + 编写规范 + 示例）。

## 1. 节点定义 schema（nodes/*.json，DSH_VCG_repo 与插件内置副本完全一致）

```json
{
  "id": "ksampler",
  "name": "KSampler",
  "nameZh": "采样器",
  "category": "sampling",
  "order": 40,
  "description": "把条件与潜空间采样成图像（云端由生图 API 完成；本地由 ComfyUI KSampler 完成）",
  "engine": "cloud",              // "cloud" | "local" | "both"
  "inputs": [
    { "id": "model", "label": "MODEL", "type": "model" },
    { "id": "positive", "label": "POSITIVE", "type": "conditioning" },
    { "id": "negative", "label": "NEGATIVE", "type": "conditioning" },
    { "id": "latent", "label": "LATENT", "type": "latent" }
  ],
  "outputs": [
    { "id": "image", "label": "IMAGE", "type": "image" }
  ],
  "params": [
    { "id": "seed", "label": "种子", "type": "number", "default": 42, "min": 0, "max": 2147483647 },
    { "id": "steps", "label": "步数", "type": "number", "default": 20, "min": 1, "max": 150 },
    { "id": "cfg", "label": "CFG", "type": "number", "default": 7, "min": 1, "max": 30 },
    { "id": "sampler", "label": "采样器", "type": "select", "options": ["euler", "dpmpp_2m", "uni_pc"], "default": "euler" }
  ],
  "executor": { "kind": "builtin", "fn": "ksampler" },
  "cloud": { "capability": "image", "notes": "调用设置中默认生图模型" },
  "local": { "comfyui": { "class_type": "KSampler", "map": { "seed": "params.seed", "steps": "params.steps", "cfg": "params.cfg", "sampler_name": "params.sampler", "model": "inputs.model", "positive": "inputs.positive", "negative": "inputs.negative", "latent_image": "inputs.latent" } } },
  "ui": { "accent": "#7c5cff", "width": 264 }
}
```

规则：

- `id`：小写 kebab-case，全局唯一；文件名 `<id>.json`。
- `type`（端口/参数）：`model` `conditioning` `latent` `image` `video` `text` `number` `any`。
- `params[].type`：`text` `textarea` `number` `select` `toggle` `model`（模型下拉来自设置的模型映射）。
  - `select` 必须带 `options: string[]`；`number` 可带 `min`/`max`/`step`。
- `engine`：`cloud` 只能云端、`local` 只能本地、`both` 两种都行（默认 cloud 优先）。
- `executor.kind`：
  - `"builtin"` + `fn`：插件内置执行器（仅内置节点用，fn 见 §4）。
  - `"http"`：专业模式导入的自定义节点，声明式 HTTP 调用（见 §3）。**导入节点必须有 `executor.kind:"http"`，且 `params` 中声明所需 API（`api` 字段）**。
  - `"comfy"`：仅本地 ComfyUI 类节点。
- `cloud.capability`：`"image"` | `"video"` | `"text"` | `"none"`；`cloud.api` 可选（自定义节点所需 API 名称/模型）。
- `local.comfyui.class_type` + `map`：ComfyUI API prompt 字段映射，`map` 值形如 `params.seed` / `inputs.model` / 字面量 `{ "value": "..." }`。
- `ui.accent` 为节点强调色（十六进制），`ui.width` 节点默认宽度。

## 2. 工作流 schema（workflows/*.json，画布持久化同构）

```json
{
  "version": 1,
  "id": "wf-txt2img",
  "name": "基础文生图",
  "description": "正向/负向提示词 → 模型 → 空潜空间 → 采样 → 解码 → 输出",
  "createdAt": "2026-11-13T00:00:00.000Z",
  "updatedAt": "2026-11-13T00:00:00.000Z",
  "viewport": { "x": 0, "y": 0, "scale": 1 },
  "nodes": [
    { "id": "n1", "type": "prompt-input", "x": 80, "y": 160, "params": { "positive": "a cyberpunk corgi, neon rain", "negative": "lowres, watermark" }, "title": "" }
  ],
  "edges": [
    { "id": "e1", "from": { "node": "n1", "port": "positive" }, "to": { "node": "n3", "port": "positive" } }
  ]
}
```

- 节点实例：`id`（画布内唯一，`n1`/`n2`…）、`type`（= 节点定义 id）、`x`/`y`（画布坐标，数字）、`params`（覆盖定义默认值）、`title`（可选覆盖）、`engineOverride`（可选 `"cloud"|"local"`）。
- 连线：一条边只连一个 output port → 一个 input port；同类型或 `any` 才允许连接。
- 节点运行结果**不写入**工作流文件；由宿主返回 `results[nodeId]`，Client 只内存展示。

## 3. 自定义节点 executor.kind = "http"（专业模式导入）

```json
"executor": {
  "kind": "http",
  "request": {
    "url": "https://api.example.com/v1/generate",
    "method": "POST",
    "headers": { "Authorization": "Bearer ${settings.apiKey}" , "Content-Type": "application/json" },
    "body": { "prompt": "${inputs.text}", "width": "${params.width}" },
    "timeoutMs": 120000
  },
  "response": {
    "images": "$.data[*].url",
    "text": "$.text",
    "error": "$.error.message"
  }
}
```
- `${inputs.xxx}`、`${params.xxx}`、`${settings.apiKey}` 在请求时替换；`response` 用极简 JSONPath（`$.a.b`、`$.a[*].b`）取值。
- 导入节点在 Client 设置中「专业模式」打开后才允许；Host 侧校验 `executor.kind === "http"` 且 URL 为 http(s)。

## 4. 内置执行器（Host lib/engine.js 实现；fn 名固定）

| fn | 节点 type | 输入 | 输出 | 云端行为 |
|---|---|---|---|---|
| `promptInput` | prompt-input | — | positive/negative (text) | 直通 |
| `modelLoader` | model-loader, checkpoint-loader | — | model | 校验模型存在，返回 `{providerId, model}` |
| `clipTextEncode` | clip-text-encoder | positive/negative text 或 conditioning | conditioning | 直通；`params.rewrite=true` 时调文本模型润色 |
| `emptyLatent` | empty-latent-image | width?/height? (number) | latent | `{width,height,batch}` |
| `imageProps` | image-props | — | width, height (number) | 直通 |
| `ksampler` | ksampler | model, positive, negative, latent | image | 调生图 API（wan2.7-image 等），返回图片 URL + usage |
| `vaeDecode` | vae-decode | image(URL) | image | 直通/下载落盘（云端图片本身就是解码结果） |
| `imageOutput` | image-output | image | — | 保存到工作区输出目录，返回本地路径 |
| `videoSampler` | video-sampler | positive, image? | video | 调视频 API（设置中配置了才可用） |
| `videoOutput` | video-output | video | — | 保存视频 |
| `textInput` | text-input | — | text | 直通 |
| `textOutput` | text-output | text | — | 返回文本 |
| `note` | note | — | — | 画布注释，不参与运算 |

本地模式（`local.mode = true` 且配置 ComfyUI URL）时：整张工作流翻译为 ComfyUI API prompt（`local.comfyui` 映射）提交 `/prompt`，轮询 `/history/<id>`，取 `/view` 图片；无 ComfyUI 配置时给出明确错误（提示去设置配置 ComfyUI 服务端）。

## 5. 插件状态（`data/dsh-vcg/state.json`，Host）

```json
{
  "version": 2,
  "providers": [
    {
      "id": "bailian-tpp",
      "label": "Alibaba Token Plan（全局 API · 自动检测）",
      "kind": "bailian-chat-image",
      "baseUrl": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
      "apiKeyRef": "BAILIAN_TPP_API_KEY",
      "apiKey": "",
      "models": { "image": ["wan2.7-image"], "video": [], "text": ["qwen3.8-max"] },
      "detectedFrom": "global",
      "enabled": true
    }
  ],
  "defaults": { "providerId": "bailian-tpp", "imageModel": "wan2.7-image", "videoModel": "", "textModel": "qwen3.8-max" },
  "local": { "enabled": false, "comfyuiUrl": "", "timeoutMs": 600000 },
  "proMode": false,
  "nodeRepo": { "githubBase": "https://raw.githubusercontent.com/Zymjason/DSH_VCG_repo/main", "giteaBase": "https://gitea.com/ZymJason_DSH/DSH_VCG_repo/raw/branch/main", "lastSyncAt": "", "source": "" },
  "outputDir": "vcg-output",
  "projects": [ { "id": "prj_x", "name": "示例项目", "path": "/abs/path", "workspaceId": "ws_x", "createdAt": "", "updatedAt": "" } ],
  "canvases": { "session:session-x": { "workflow": { }, "updatedAt": "" } },
  "outputs": [ { "id": "out_x", "ts": "", "path": "/abs/x.png", "kind": "image", "providerId": "", "model": "", "prompt": "" } ]
}
```

## 6. Host RPC（`POST api/dsh-vcg/rpc`，body `{method, args}`，响应 `{ok, value|error}`）

| method | args | 返回 |
|---|---|---|
| `state` | — | 公开状态（apiKey 掩码） |
| `saveSettings` | `{patch}` | `{state}` |
| `detectProviders` | — | `{candidates:[provider], globalModels:{image:[],video:[],text:[]}}` |
| `testProvider` | `{providerId}` | `{ok, models?, latencyMs?, error?}` |
| `listNodes` | — | `{nodes:[def], syncedAt, source, builtinCount}` |
| `syncNodeRepo` | `{source?}` | `{nodes, workflows, syncedAt}` |
| `importNode` | `{json, overwrite?}` | `{node}` （要求 proMode） |
| `removeNode` | `{id}` | `{removed}` |
| `listWorkflows` | — | `{workflows:[wf]}` （节点仓库内置示例） |
| `getCanvas` | `{key}` | `{workflow, updatedAt}` |
| `saveCanvas` | `{key, workflow}` | `{updatedAt}` |
| `createProject` | `{name, path?}` | `{project}` （Host 建目录 + workspaceRegistry.create） |
| `deleteProject` | `{id}` | `{ok}` |
| `listProjects` | — | `{projects:[...]}` |
| `bindSession` | `{sessionId, projectId?}` | `{ok}` |
| `buildWorkflow` | `{prompt, current?, sessionId?}` | `{workflow, reply, notes:[], usedModel?}` |
| `runWorkflow` | `{key, workflow?, sessionId?, baseDir?}` | `{runId, results:{[nodeId]:{status,images,text,error,ms}}, order:[], error?}` |
| `runNode` | `{key, nodeId, workflow, sessionId?, baseDir?}` | `{result}` |
| `listOutputs` | `{limit?}` | `{outputs:[...]}` |
| `readOutput` | `{path}` | `{dataUrl, mime}` |
| `openOutputDir` | `{sessionId?, projectId?}` | `{path}` |

RPC 还应支持按需返回 `providers` 掩码、`proMode`、`local` 等。

## 7. Client 模块装配（build.mjs 拼接为单文件 client.js）

`client.js` 由 `parts/*.js` 顺序拼接进模板；每个 part 是 IIFE，唯一入参为共享对象 `V`：

```js
(function (V) {
  'use strict'
  function MyComponent(props) { /* 使用 V.h / V.React / V.rpc / V.ui / V.t */ }
  V.MyComponent = MyComponent
})(V)
```

`V` 由 `parts/core.js` 创建，契约字段：

- `V.React`、`V.h`、`V.Fragment`
- `V.NS = 'vcg'`；`V.t(key)` 本地化（apply 时绑定）
- `V.rpc(method, args) → Promise<value>`（自动 POST `api/dsh-vcg/rpc`，失败抛 Error）
- `V.useStore()` → 当前宿主状态快照；`V.setStore(patch)`/`V.refresh()`
- `V.ui`：`Button` `IconButton` `Field` `TextInput` `TextArea` `NumberInput` `Select` `Toggle` `Tabs` `Banner` `Modal` `Empty` `Spinner` `Glyph`（内置 SVG 图标集）
- `V.styleTag(css)` → React 元素（`<style>`）；`V.css` 各 part 自带前缀 `vcg-*`
- `V.uid(prefix)`、`V.clamp`、`V.downloadJSON(name, obj)`
- `V.consts`：`NODE_CATEGORIES`、`PORT_COLORS`
- 会话导航：`V.nav`（apply 时注入 `{ openSession, connectWorkspace, startSession, getSession, setPreferredView }`；`setPreferredView(sessionId, viewId)` 写 `localStorage['dsh.conversation.'+sessionId]` 的 `view` 字段，用于新建会话后默认显示 VCG 画布）

part 文件与导出（**文件名与导出名固定**）：

- `parts/core.js` → `V.*` 基础（Lead）
- `parts/canvas.js` → `V.Canvas`（画布组件，canvas-dev）
- `parts/settings.js` → `V.SettingsPage`（设置页，ui-dev）
- `parts/studio.js` → `V.StudioPage`（主面板：项目/画布/AI 组建器/输出，ui-dev）
- `parts/panel.js` → `V.PanelIcon`（侧栏图标，ui-dev）
- `parts/view.js` → `V.ChatCanvasView`（会话内 VCG 画布视图，Lead）
- `parts/apply.js` → `V.apply`（注册 slots，Lead）

### `V.Canvas` 组件 props（canvas-dev 唯一负责）

```js
V.Canvas({
  workflow,            // 工作流对象（受控；内部不直接改，一律 onChange 回写）
  nodeDefs,            // 节点定义数组
  results,             // { [nodeId]: { status:'idle'|'running'|'done'|'error', images:[{url,path,label}], text, error, ms } }
  selectedId, onSelect (id|null),
  onChange(workflow),  // 任何结构变化（拖动结束、连线、删除、参数修改）
  onRunNode(nodeId), onRunAll(), onStop?(),
  running, readOnly,
  outputDirHint,       // 输出目录提示文案
})
```
要求：
- 节点可实时拖动（pointer events + requestAnimationFrame 可选，拖动中直接改 DOM/transform，结束时 onChange 回写坐标）；
- 端口拖线（输出→输入，hover 高亮，类型不匹配禁止；已有输入端口被占用时替换），贝塞尔曲线 + 选中/删除；
- 删除：选中节点/连线后按 Delete/Backspace 或节点悬浮删除按钮；
- 画布平移（空白处左键/中键拖动、空格+拖动）与缩放（滚轮、按钮、fit）；
- 空白处右键 `onContextMenu preventDefault`，**任何地方不提供右键菜单**；
- 参数编辑按 §1 param 类型渲染；节点显示引擎徽章（云/本地）与运行状态、图片结果缩略图；
- 使用宿主主题 token（`--dsw-alias-*`），CSS 前缀 `vcg-canvas-*` 或 `vcg-*`；
- 空画布引导提示（从左侧节点库拖入/点击添加）。

## 8. 节点仓库 DSH_VCG_repo 目录

```
README.md                     节点/工作流编写规范总览（中文为主，含英文摘要）
manifest.json                 {version, nodes:[id...], workflows:[id...], minPluginVersion}
nodes/*.json                  §1 schema
workflows/*.json              §2 schema（至少 txt2img、txt2video、product-shot、example）
docs/node-spec.md             §1+§3 完整规范（自定义 API 节点、ComfyUI 兼容映射）
docs/workflow-spec.md         §2 规范 + 执行语义
docs/cloud-api.md             云端 API 适配说明（bailian-chat-image / openai-images / http 节点）
docs/comfyui-compat.md        本地 ComfyUI 映射与限制
sdk/loader.md                 如何从本仓库拉取节点包（raw URL / manifest 约定）
```

必须包含节点：`checkpoint-loader` `clip-text-encoder` `empty-latent-image` `ksampler` `vae-decode`（ComfyUI 同族），以及默认节点 `prompt-input` `model-loader` `image-props` `image-output`，视频 `video-sampler` `video-output`，示例 `example-node`（演示 http 自定义节点）。

## 9. 云 API 已知事实（用 curl 实测，Host provider 实现必须兼容）

- Base URL：`https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`（profile `cordis.patch.yml` 中 provider `bailian-tpp`，`apiKeyEnv: BAILIAN_TPP_API_KEY`，密钥在 `$DSH_HOME/.credentials.yaml`，Host 通过 `ctx.credentials.resolve('BAILIAN_TPP_API_KEY')` 读取）。
- 生图：`POST /chat/completions`，body：
  ```json
  { "model": "wan2.7-image", "messages": [{ "role": "user", "content": [{ "type": "text", "text": "提示词" }] }],
    "parameters": { "size": "1280*720", "n": 1 } }
  ```
  响应：`{ "output": { "choices": [ { "message": { "content": [ { "type": "image", "image": "https://...png" } ] } } ] }, "usage": { "image_count": 1, "size": "1280*720" } }`
- 尺寸：`parameters.size` 形如 `"W*H"`（实测生效）；可选模型：`wan2.7-image`、`wan2.7-image-pro`、`qwen-image-3.0-pro`。
- 文本：同 endpoint `/chat/completions` 标准 OpenAI 格式，模型如 `qwen3.8-max`（若不可用回退 `deepseek-official/deepseek-flash` via ctx.llm）。
- 视频 `wan3.0-video` 在该 endpoint 直连 chat 会 400；Host 需把错误翻译成可读提示，并支持设置中另配 `openai-video` 类 provider。
- 失败重试：网络/429/5xx 重试 2 次（指数退避）；4xx 直接抛可读错误。

## 10. 验证

- Host：`node --check index.js lib/*.js`；`node scripts/self-test.mjs`（provider 解析/工作流拓扑/节点校验，不发真实网络请求）。
- Client：`node build.mjs` 成功 + `node --check client.js`；浏览器里检查无报错。
- 安装：bundle 目录安装进 profile（Lead 负责）。

## 11. 契约澄清与增量扩展（Lead 裁定，2026-11-13，优先级等同正文）

### 11.1 可选输入端口 `"optional": true`
`inputs[]` 增量允许 `"optional": true`（只用于输入端口）。语义：
- `optional !== true` 的输入端口必须恰好有一条入边，否则校验失败（引擎报可读错误，画布显示警告徽章但不阻止编辑）。
- 可选输入未连线时，执行器回退到 `params` / `undefined`（如 `empty-latent-image` 的 width/height?、`video-sampler` 的 image?、`clip-text-encoder` 的 clip?）。
- 画布与引擎都必须接受悬空的可选输入。

### 11.2 类型兼容规则（画布连线 + 引擎校验共用）
允许连接当且仅当 `from.type === to.type`，或任一端为 `any`，或属于以下兼容对：
- `text` → `conditioning`（提示词文本直接进采样器：引擎把文本当提示词，等价于已编码）
- `model` → `any` 反向不允许；`image` → `image`、`video`/`text`/`number`/`latent` 仅同类。
其它组合一律禁止。

### 11.3 clip-text-encoder 形态（ComfyUI 同族，单条件下输出）
- inputs：`clip`(model, optional)、`text`(text, optional)
- params：`text`(textarea)、`rewrite`(toggle，默认 false)
- outputs：`conditioning`
- 语义：条件文本优先取 `inputs.text`（上游文本），回退 `params.text`；`rewrite=true` 时调文本模型润色；云端忽略 `clip` 输入；本地 `class_type="CLIPTextEncode"`，map `{clip:"inputs.clip", text:"inputs.text"}`。
- 一个工作流里正/负条件各用一个实例；`prompt-input` 的 positive/negative 文本分别接到两个实例的 text 输入。

### 11.4 checkpoint-loader 输出
- outputs：`model`、`clip`、`vae`，三者端口类型均为 `model`（§1 类型表无独立 clip/vae 类型）；本地 `class_type="CheckpointLoaderSimple"`，输出索引 0=MODEL/1=CLIP/2=VAE。
- 内置 `modelLoader` 执行器云端返回 `{providerId, model, clip, vae}`（clip/vae 为透传占位值）。

### 11.5 ksampler 参数补充
本地 ComfyUI 必需字段：`params.scheduler`（select：normal/karras/exponential/sgm_uniform，默认 normal）、`params.denoise`（number 0~1，默认 1）。映射进 `local.comfyui.map`。

### 11.6 默认 txt2img 工作流（内置示例与画布 fallback 统一用此形态）
节点：`prompt-input` → `model-loader`、`empty-latent-image`（params 含 width/height）、`ksampler`、`vae-decode`、`image-output`。
边：prompt positive→ksampler positive、prompt negative→ksampler negative、model-loader model→ksampler model、empty-latent latent→ksampler latent、ksampler image→vae-decode image、vae-decode image→image-output image。
（允许 text→conditioning 兼容，因此 prompt-input 可直连 ksampler。）

### 11.7 节点 category
严格取 core.js `NODE_CATEGORIES` 的 id：`input` `model` `latent` `sampling` `decode` `video` `utility` `custom`。

## 12. 增强功能（2026-11-13，第二轮迭代）

### 12.1 画布全屏
- 会话内 VCG 画布与工作台画布均支持全屏：根元素加 `vcg-view-full` / `vcg-studio-canvas-panel-full`（`position:fixed;inset:0;z-index:80`），Esc 退出；进入/退出按钮用 `Glyph fit/close`。

### 12.2 Debug 运行（只校验，不生成）
- Host RPC `debugWorkflow`，参数 `{ key?, workflow?, sessionId?, baseDir?, network? }`（network 默认 true；false 仅离线静态校验）。
- 返回 `{ ok, mode:'debug', key, baseDir, outputDir, network, provider, order, nodeCount, edgeCount, checks:[{group,level,label,detail}], summary:{passed,warned,failed,total}, startedAt, ms, note }`。
- 检查分组：`schema` 结构 / `graph` 连线与拓扑 / `params` 参数 / `engine` 引擎与本地配置 / `model` 模型路由、API Key、/models 探测（不生成内容）/ `security` 输出目录、文件名、HTTP 节点（专业模式、URL、超时）。
- 约束：绝不调用生图/生视频 API、绝不写输出文件；UI 为「Debug 运行」按钮 + 报告 Modal（`V.ui.DebugReport`）。
- agent 工具新增 action `debug_workflow`（`network` 参数控制是否探测）。

### 12.3 VCG 节点工作流仓库侧边栏
- 新增第二个侧边栏图标（id/key `dsh-vcg-repo`，order 24）与主面板页 `V.NodeRepoPage`。
- Host RPC：
  - `listRepoNodes { source?: 'github'|'gitea'|'auto'|httpUrl, force? }` → `{ source, base, version, fetchedAt, nodes:[{...def, installed, installedSource, requiresPro, canImport}], workflows:[{id,name,description,nodeCount,installed}], warnings }`（60s 缓存）。
  - `installRepoNode { id, source? }` → `{ node, installed, skipped?, source }`；`executor.kind="http"` 节点要求 proMode。
- agent 工具新增 action `list_repo_nodes`（紧凑摘要）/ `install_repo_node`。
- 仓库地址仍由设置页 `nodeRepo.githubBase/giteaBase` 配置；页面只读展示并提供 source 切换与刷新。
- 客户端 part：`parts/repo.js` → `V.NodeRepoPage`、`V.RepoPanelIcon`（build.mjs 顺序：core, canvas, settings, studio, panel, repo, view, apply）。
- `V.nav.openPanel(panelId)` 通过 `ctx.layout.selectPanel` 注入，供页面互跳。

## 13. 第三轮迭代（2026-11-13）：实时运行状态 / 统一运行控件 / 专业模式门控 / 空闲拖线呼出节点菜单

### 13.1 运行实时状态（Host）

- `Engine.run({ ..., runId?, onEvent? })`：新增可选 `runId` 与进度回调 `onEvent(event)`，事件：
  - `{ type:'run-start', runId, order }`
  - `{ type:'node-start', runId, nodeId }`
  - `{ type:'node-done', runId, nodeId, result }`（`result` 与 `results[nodeId]` 同构）
  - `{ type:'node-error', runId, nodeId, error, ms }`
  - `{ type:'run-done', runId, ok, error }`
- `index.js` 维护 `this.runs = Map<key, runRecord>`；`runRecord`：
  ```json
  {
    "runId": "run_x", "key": "session:...", "status": "running|done|error",
    "startedAt": "ISO", "finishedAt": "ISO", "order": ["n1"],
    "currentNodeId": "n1", "error": "",
    "nodes": { "n1": { "status": "pending|running|done|error", "ms": 0, "images": [], "text": "", "video": null, "error": "", "skipped": false } }
  }
  ```
- `runWorkflow` / `runNode` 开始前写入记录，事件更新；结束后 `status` 置 `done`/`error` 并写 `finishedAt`；返回值不变（`results` 仍为最终权威）。
- RPC `runStatus { key?, sessionId? }` → `{ run: runRecord | null }`，无副作用；保留最近一次运行记录供客户端轮询收尾。
- 单节点运行只登记被执行的节点（`nodeId` 及其上游），未执行节点不出现在记录里。

### 13.2 客户端轮询（view.js / studio.js）

- `running` 期间每 500ms 调用 `runStatus`，把 `run.nodes` 合并进 `results`：`running` → `{status:'running'}`，`done`/`error` → 完整 result；`pending` 跳过。
- 轮询在 `runToken` 变化、组件卸载、运行结束时停止；`runWorkflow` 返回后仍以返回值覆盖 results。
- `runNode` 同样轮询（只影响该节点及其上游）。

### 13.3 统一运行 / Debug 运行按钮位置

- 「运行」与「Debug 运行」只出现在 **Canvas 组件顶部工具栏**（`.vcg-cv-toolbar`），两个视图（聊天画布 / 工作台画布）位置一致；页面级工具栏不再放这两个按钮（全屏、保存、scope 等留在页面级）。
- Canvas 新增 props：`onDebugRun?: () => void`、`debugBusy?: boolean`。
- 运行中：有 `onStop` 时显示「停止」（danger），否则显示禁用「运行中…」；Debug 按钮在 `running` / `debugBusy` 时禁用，忙碌文案「校验中…」。
- `view.js` / `studio.js` 继续持有 `debugRun` 状态与 Debug 报告 Modal，通过 props 传给 Canvas；页面级 run/debug 按钮删除。
- `parts/canvas.js` 内新增 i18n key（zhExtra/enExtra）。

### 13.4 专业模式门控「节点工作流仓库」侧栏

- `proMode !== true` 时不注册 `sidebar.panellist#dsh-vcg-repo` 与 `main#dsh-vcg-repo`；`proMode` 切到 `true` 时动态注册，切回 `false` 时撤销。
- 实现限定在 `parts/apply.js`：监听 `V.store.listeners`（`V.setStore` 会通知），用 `slots.inject(...)` 返回的 disposer 注册/注销；不改变其它 Slot 注册。

### 13.5 空闲拖线呼出「节点添加并连接」菜单（canvas.js）

- 从端口开始拖线，指针释放处**没有**落在端口/节点上（空白画布）时：不取消连线，弹「添加节点并连接」菜单。
- 候选过滤：从输出端口拖出 → 只列含兼容输入端口的节点定义；从输入端口拖出 → 只列含兼容输出端口的节点定义；菜单带搜索框。
- 选中候选：在释放点附近创建节点（不重叠），建立一条边（端口自动取第一个兼容端口；目标输入已有边时替换），并选中新节点。
- 关闭：选中节点、`Esc`、点击空白处、开始新的拖动/连接。释放点落在节点主体但非端口上视为无效，不弹菜单。
- 菜单只使用 Canvas 既有 `emitWorkflow` / `validateConnection` / `nextNodeId` / `nextEdgeId` 等内部能力，不新增 Host RPC。
