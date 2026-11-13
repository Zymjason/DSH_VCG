/* ============================================================================
 * VCG 视觉控制生成器 — 主工作台（左侧栏图标打开）
 * Visual Control Generator — studio page (V.StudioPage).
 *
 * 工作流库 / 内嵌节点画布 / AI 自动组建工作流 / VCG 项目工作区 / 输出画廊 /
 * 设置快捷入口。所有数据走 V.rpc，纯 React.createElement，无 JSX，无 import。
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { React, h } = V
  const {
    Button,
    Field,
    TextInput,
    TextArea,
    Select,
    Tabs,
    Banner,
    Empty,
    Spinner,
    Glyph,
    Badge,
    StyleTag,
  } = V.ui

  /* ------------------------------------------------------------- locales */

  V.addDict(
    {
      stuTitle: 'VCG 视觉控制生成器',
      stuDesc: 'AI 自动组建节点工作流，云端 / 本地 ComfyUI 运算生成图像与视频。',
      stuProvider: 'Provider',
      stuEngine: '引擎',
      stuEngineCloud: '云端',
      stuEngineLocal: '本地',
      stuOutputDir: '输出目录',
      stuProviderMissing: '尚未配置生图 API',
      stuTabWorkflows: '工作流',
      stuTabProjects: '项目',
      stuTabOutputs: '输出',
      stuTabSettings: '设置',
      stuAiTitle: 'AI 自动组建工作流',
      stuAiDesc: '用一句话描述画面，AI 会自动生成节点与连线并载入画布。',
      stuAiPlaceholder: '例如：一只戴着墨镜的柯基在赛博朋克雨夜街头，霓虹灯反射，电影感，1280x720',
      stuAiGenerate: '生成工作流',
      stuAiGenerating: '正在组建…',
      stuAiEmptyPrompt: '请先输入工作流描述',
      stuAiNoWorkflow: 'AI 没有返回可用的工作流结构，请换个描述重试',
      stuAiApplied: 'AI 工作流已载入画布',
      stuAiReply: 'AI 回复',
      stuAiNotes: '建议',
      stuAiUsedModel: '模型',
      stuWorkflowLibrary: '工作流库',
      stuNewWorkflow: '新建空工作流',
      stuNewWorkflowDesc: '默认 4 个基础节点：提示词 → 模型 → 采样器 → 输出',
      stuNoWorkflows: '暂无内置工作流',
      stuNoWorkflowsHint: '同步节点仓库后可获得示例工作流；也可以直接新建空工作流。',
      stuCanvas: '画布',
      stuScope: '画布作用域',
      stuScopeStudio: '工作台（studio:main）',
      stuSaveCanvas: '保存画布',
      stuSavedAt: '保存于 {time}',
      stuNotSaved: '尚未保存',
      stuBackLibrary: '工作流库',
      stuRunning: '运行中…',
      stuRunDone: '运行完成',
      stuRunFail: '运行失败',
      stuRunNodeFail: '节点运行失败',
      stuCanvasLoading: '画布加载中…',
      stuCanvasMissing: '画布组件加载中…',
      stuCanvasMissingHint: '画布组件由 parts/canvas.js 提供；构建后刷新页面即可显示节点画布。',
      stuNodeCount: '{n} 个节点',
      stuLoadFailed: '加载失败',
      stuProjectsTitle: 'VCG 项目工作区',
      stuProjectsDesc: '创建 VCG 项目工作区：该项目下的所有对话都会以 VCG 画布打开。',
      stuProjectName: '项目名称',
      stuProjectNamePh: '例如：电商产品图',
      stuProjectPath: '项目目录（可选）',
      stuProjectPathHint: '留空则在插件数据目录下创建；可填写绝对路径',
      stuCreateProject: '创建 VCG 项目',
      stuCreating: '创建中…',
      stuProjectCreated: '项目已创建',
      stuProjectCreatedHint: '该项目工作区的所有对话都会以 VCG 画布打开。',
      stuOpenInNewSession: '在新会话打开',
      stuOpenProject: '打开工作区',
      stuCopyPath: '复制路径',
      stuPath: '路径',
      stuCreatedAt: '创建时间',
      stuNoProjects: '还没有 VCG 项目',
      stuNoProjectsHint: '创建项目后，在项目工作区里开启的对话都会默认显示 VCG 画布。',
      stuWorkspaceMissing: '该项目尚未注册为工作区，请在设置中重建项目。',
      stuNavMissing: '宿主工作区导航服务不可用，请手动打开该目录的会话。',
      stuDeleteProject: '删除项目',
      stuProjectDeleteConfirm: '确认删除项目？（不会删除目录里的文件）',
      stuProjectDeleted: '项目已删除',
      stuOpenFail: '打开项目失败',
      stuOutputsTitle: '输出画廊',
      stuOutputsDesc: '工作流生成的图像与视频保存在输出目录中。',
      stuOutputEmpty: '暂无输出',
      stuOutputEmptyHint: '运行工作流并保存输出节点后，结果会显示在这里。',
      stuOpenOutputDir: '打开输出目录',
      stuOutputDirFail: '打开输出目录失败',
      stuOutputLoadFail: '缩略图加载失败',
      stuClickCopy: '点击卡片复制路径',
      stuCopiedPath: '已复制路径',
      stuCopyFail: '复制失败',
      stuSettingsTitle: '设置',
      stuSettingsDesc: 'VCG 设置位于 设置 → VCG 视觉控制生成器：云端 API / 本地 ComfyUI / 专业模式 / 节点仓库 / 输出目录。',
      stuOpenSettings: '打开设置页',
      stuSettingsNavMissing: '宿主未提供设置页导航，请从左侧「设置」进入 → VCG 视觉控制生成器。',
      stuConversationHint: '会话内画布：在对话顶部的视图切换中选择「VCG 画布」即可打开当前会话的画布。',
      stuProjectScopeHint: '项目工作区内的对话默认以 VCG 画布打开。',
      stuBaseDir: '输出根目录',
      stuRunError: '运行错误',
      stuNoNodes: '该工作流没有节点。',
      stuOutputCount: '{n} 个输出',
      stuScopeProject: '项目：{name}',
      stuProjectWorkspace: '工作区',
      stuNoWorkspaces: '没有项目',
      stuRefresh: '刷新',
      stuNodeDefsError: '节点定义加载失败：缺少节点定义时画布可能无法编辑。',
      stuOpenSettingsHint: '修改云端 API、本地运算、专业模式与节点仓库',
      stuOutputDirHint: '输出根目录：{path}',
      stuProjectOutputRoot: '项目目录',
      stuWorkbenchRoot: '插件数据目录 / 默认工作区',
      stuAiCurrent: '基于当前画布修改',
      stuAiFromScratch: '从零生成',
      stuRunWarnings: '运行警告',
      stuSaveFirst: '建议先保存画布再运行（运行不依赖保存）',
      stuProjectOptionalPath: '（可选）',
      stuNoOutputPath: '没有路径',
      stuKindImage: '图像',
      stuKindVideo: '视频',
      stuLoadingOutputs: '正在加载输出…',
      stuVideoNoPreview: '视频文件（不在画廊内预览）',
      stuOpenFile: '打开文件所在目录',
      stuLocalWarnTitle: '本地运算已开启',
      stuLocalWarn: '开启后所有运算将在本地运行，请注意硬件性能；需要本机 ComfyUI 服务。',
    },
    {
      stuTitle: 'VCG Visual Control Generator',
      stuDesc: 'Build node workflows with AI, generate images and videos with cloud APIs or a local ComfyUI service.',
      stuProvider: 'Provider',
      stuEngine: 'Engine',
      stuEngineCloud: 'Cloud',
      stuEngineLocal: 'Local',
      stuOutputDir: 'Output folder',
      stuProviderMissing: 'No image API configured',
      stuTabWorkflows: 'Workflows',
      stuTabProjects: 'Projects',
      stuTabOutputs: 'Outputs',
      stuTabSettings: 'Settings',
      stuAiTitle: 'AI workflow builder',
      stuAiDesc: 'Describe the picture in one sentence; the AI builds nodes and edges onto the canvas.',
      stuAiPlaceholder: 'e.g. a corgi wearing sunglasses on a cyberpunk rainy street, neon reflections, cinematic, 1280x720',
      stuAiGenerate: 'Build workflow',
      stuAiGenerating: 'Building…',
      stuAiEmptyPrompt: 'Describe the workflow first',
      stuAiNoWorkflow: 'The AI returned no usable workflow; try another description',
      stuAiApplied: 'AI workflow loaded onto the canvas',
      stuAiReply: 'AI reply',
      stuAiNotes: 'Notes',
      stuAiUsedModel: 'Model',
      stuWorkflowLibrary: 'Workflow library',
      stuNewWorkflow: 'New empty workflow',
      stuNewWorkflowDesc: 'Four base nodes: prompt → model → sampler → output',
      stuNoWorkflows: 'No built-in workflows',
      stuNoWorkflowsHint: 'Sync the node repository for example workflows, or create an empty workflow.',
      stuCanvas: 'Canvas',
      stuScope: 'Canvas scope',
      stuScopeStudio: 'Workbench (studio:main)',
      stuSaveCanvas: 'Save canvas',
      stuSavedAt: 'Saved at {time}',
      stuNotSaved: 'Not saved yet',
      stuBackLibrary: 'Library',
      stuRunning: 'Running…',
      stuRunDone: 'Run finished',
      stuRunFail: 'Run failed',
      stuRunNodeFail: 'Node run failed',
      stuCanvasLoading: 'Loading canvas…',
      stuCanvasMissing: 'Canvas component is loading…',
      stuCanvasMissingHint: 'The canvas is provided by parts/canvas.js; refresh after building to see it.',
      stuNodeCount: '{n} nodes',
      stuLoadFailed: 'Load failed',
      stuProjectsTitle: 'VCG project workspaces',
      stuProjectsDesc: 'Create a VCG project workspace: every conversation in it opens as a VCG canvas.',
      stuProjectName: 'Project name',
      stuProjectNamePh: 'e.g. e-commerce product shots',
      stuProjectPath: 'Project folder (optional)',
      stuProjectPathHint: 'Defaults to the plugin data folder; an absolute path is allowed',
      stuCreateProject: 'Create VCG project',
      stuCreating: 'Creating…',
      stuProjectCreated: 'Project created',
      stuProjectCreatedHint: 'Every conversation in this project workspace opens as a VCG canvas.',
      stuOpenInNewSession: 'Open in a new session',
      stuOpenProject: 'Open workspace',
      stuCopyPath: 'Copy path',
      stuPath: 'Path',
      stuCreatedAt: 'Created',
      stuNoProjects: 'No VCG projects yet',
      stuNoProjectsHint: 'After creating a project, conversations in that workspace default to the VCG canvas.',
      stuWorkspaceMissing: 'This project is not registered as a workspace; recreate it in Settings.',
      stuNavMissing: 'Host workspace navigation is unavailable; open a session in that folder manually.',
      stuDeleteProject: 'Delete project',
      stuProjectDeleteConfirm: 'Delete this project? (files in the folder are kept)',
      stuProjectDeleted: 'Project deleted',
      stuOpenFail: 'Failed to open project',
      stuOutputsTitle: 'Output gallery',
      stuOutputsDesc: 'Images and videos generated by workflows live in the output folder.',
      stuOutputEmpty: 'No outputs yet',
      stuOutputEmptyHint: 'Run a workflow with an output node and results will appear here.',
      stuOpenOutputDir: 'Open output folder',
      stuOutputDirFail: 'Failed to open the output folder',
      stuOutputLoadFail: 'Failed to load thumbnail',
      stuClickCopy: 'Click a card to copy its path',
      stuCopiedPath: 'Path copied',
      stuCopyFail: 'Copy failed',
      stuSettingsTitle: 'Settings',
      stuSettingsDesc: 'VCG settings live in Settings → VCG Visual Control Generator: cloud API / local ComfyUI / pro mode / node repository / output folder.',
      stuOpenSettings: 'Open settings',
      stuSettingsNavMissing: 'The host provides no settings navigation; open Settings from the left sidebar → VCG Visual Control Generator.',
      stuConversationHint: 'In-conversation canvas: pick “VCG Canvas” in the view switcher at the top of a conversation.',
      stuProjectScopeHint: 'Conversations in a project workspace open as the VCG canvas by default.',
      stuBaseDir: 'Output root',
      stuRunError: 'Run error',
      stuNoNodes: 'This workflow has no nodes.',
      stuOutputCount: '{n} outputs',
      stuScopeProject: 'Project: {name}',
      stuProjectWorkspace: 'Workspace',
      stuNoWorkspaces: 'No projects',
      stuRefresh: 'Refresh',
      stuNodeDefsError: 'Failed to load node definitions; the canvas may not be editable.',
      stuOpenSettingsHint: 'Edit cloud API, local compute, pro mode and node repository',
      stuOutputDirHint: 'Output root: {path}',
      stuProjectOutputRoot: 'project folder',
      stuWorkbenchRoot: 'plugin data folder / default workspace',
      stuAiCurrent: 'Modify the current canvas',
      stuAiFromScratch: 'Build from scratch',
      stuRunWarnings: 'Run warnings',
      stuSaveFirst: 'Consider saving the canvas before running (running does not require a save)',
      stuProjectOptionalPath: '(optional)',
      stuNoOutputPath: 'No path',
      stuKindImage: 'Image',
      stuKindVideo: 'Video',
      stuLoadingOutputs: 'Loading outputs…',
      stuVideoNoPreview: 'Video file (no in-gallery preview)',
      stuOpenFile: 'Open the containing folder',
      stuLocalWarnTitle: 'Local compute enabled',
      stuLocalWarn: 'All computation runs locally; watch your hardware performance. A local ComfyUI service is required.',
    },
  )

  const t = (key, vars) => V.t(key, vars)
  const msgOf = (error) => V.messageOf(error)
  const asArray = (value) => (Array.isArray(value) ? value : [])
  const STUDIO_SCOPE = 'studio:main'

  /* -------------------------------------------------------------- helpers */

  function defaultWorkflow() {
    const now = new Date().toISOString()
    return {
      version: 1,
      id: V.uid('wf-new'),
      name: '未命名工作流',
      description: t('stuNewWorkflowDesc'),
      createdAt: now,
      updatedAt: now,
      viewport: { x: 0, y: 0, scale: 1 },
      nodes: [
        {
          id: 'n1',
          type: 'prompt-input',
          x: 80,
          y: 140,
          params: { positive: 'a cyberpunk corgi, neon rain, cinematic', negative: 'lowres, watermark' },
        },
        { id: 'n2', type: 'model-loader', x: 80, y: 420, params: {} },
        { id: 'n3', type: 'ksampler', x: 420, y: 240, params: {} },
        { id: 'n4', type: 'image-output', x: 780, y: 260, params: {} },
      ],
      edges: [
        { id: 'e1', from: { node: 'n1', port: 'positive' }, to: { node: 'n3', port: 'positive' } },
        { id: 'e2', from: { node: 'n2', port: 'model' }, to: { node: 'n3', port: 'model' } },
        { id: 'e3', from: { node: 'n3', port: 'image' }, to: { node: 'n4', port: 'image' } },
      ],
    }
  }

  function cloneWorkflow(workflow) {
    try {
      return JSON.parse(JSON.stringify(workflow))
    } catch {
      return workflow
    }
  }

  function normalizeRunResult(raw) {
    if (!raw || typeof raw !== 'object') return { status: 'done' }
    return {
      status: raw.status === 'error' || raw.status === 'running' || raw.status === 'idle' ? raw.status : raw.error ? 'error' : 'done',
      images: asArray(raw.images),
      text: raw.text,
      video: raw.video,
      error: raw.error,
      ms: raw.ms,
    }
  }

  function normalizeRunResults(results) {
    const out = {}
    if (results && typeof results === 'object') {
      for (const nodeId of Object.keys(results)) out[nodeId] = normalizeRunResult(results[nodeId])
    }
    return out
  }

  function projectForScope(projects, scopeKey) {
    if (!scopeKey || scopeKey.indexOf('project:') !== 0) return null
    const id = scopeKey.slice('project:'.length)
    return projects.find((project) => project.id === id) || null
  }

  function providerLabelOf(state) {
    if (!state) return ''
    const providers = asArray(state.providers)
    const defaults = state.defaults || {}
    const provider = providers.find((item) => item.id === defaults.providerId)
    if (!provider) return ''
    return provider.label || provider.id || ''
  }

  /* -------------------------------------------------- AI builder (top card) */

  function AiBuilder({ prompt, onPrompt, busy, result, error, onGenerate, hasCanvas }) {
    return h(
      'div',
      { className: 'vcg-studio-ai' },
      h(
        'div',
        { className: 'vcg-studio-ai-head' },
        h(
          'div',
          { className: 'vcg-row' },
          h('span', { className: 'vcg-studio-ai-mark' }, h(Glyph, { name: 'sparkles', size: 16 })),
          h(
            'div',
            null,
            h('div', { className: 'vcg-studio-ai-title' }, t('stuAiTitle')),
            h('div', { className: 'vcg-hint' }, t('stuAiDesc')),
          ),
        ),
        h(Badge, null, hasCanvas ? t('stuAiCurrent') : t('stuAiFromScratch')),
      ),
      h(
        'div',
        { className: 'vcg-studio-ai-row' },
        h(TextArea, {
          value: prompt,
          rows: 2,
          placeholder: t('stuAiPlaceholder'),
          onChange: onPrompt,
          onKeyDown: (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault()
              if (!busy && prompt.trim() !== '') onGenerate()
            }
          },
        }),
        h(
          Button,
          {
            variant: 'primary',
            onClick: onGenerate,
            disabled: busy || prompt.trim() === '',
            icon: busy ? undefined : 'sparkles',
          },
          busy ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('stuAiGenerating')) : t('stuAiGenerate'),
        ),
      ),
      error ? h(Banner, { kind: 'error' }, error) : null,
      result
        ? h(
            'div',
            { className: 'vcg-studio-ai-result' },
            h(
              'div',
              { className: 'vcg-row', style: { flexWrap: 'wrap' } },
              h('span', { className: 'vcg-label' }, t('stuAiReply')),
              result.usedModel ? h(Badge, { color: 'var(--dsw-alias-brand-primary)' }, t('stuAiUsedModel') + '：' + result.usedModel) : null,
            ),
            h('div', { className: 'vcg-studio-ai-reply' }, result.reply || '—'),
            result.notes.length
              ? h(
                  'div',
                  { className: 'vcg-col', style: { gap: 3 } },
                  h('span', { className: 'vcg-label' }, t('stuAiNotes')),
                  result.notes.map((note, index) => h('div', { key: index, className: 'vcg-hint' }, '· ' + String(note))),
                )
              : null,
          )
        : null,
    )
  }

  /* -------------------------------------------------- workflow library */

  function WorkflowCard({ workflow, nodeCount, onOpen }) {
    return h(
      'div',
      { className: 'vcg-studio-wf-card', role: 'button', tabIndex: 0, onClick: () => onOpen(workflow), onKeyDown: (event) => { if (event.key === 'Enter') onOpen(workflow) } },
      h(
        'div',
        { className: 'vcg-studio-wf-card-head' },
        h('span', { className: 'vcg-studio-wf-name' }, workflow.name || workflow.id || 'workflow'),
        h(Badge, null, t('stuNodeCount', { n: nodeCount })),
      ),
      h('div', { className: 'vcg-studio-wf-desc' }, workflow.description || ''),
      h(
        'div',
        { className: 'vcg-studio-wf-foot' },
        h('span', { className: 'vcg-hint' }, workflow.id || ''),
        h(Button, { size: 'sm', variant: 'primary', onClick: (event) => { if (event && event.stopPropagation) event.stopPropagation(); onOpen(workflow) } }, t('open')),
      ),
    )
  }

  function WorkflowLibrary({ workflows, loading, error, nodeDefs, onOpen, onNew, onReload }) {
    return h(
      'div',
      { className: 'vcg-studio-panel' },
      h(
        'div',
        { className: 'vcg-studio-section-head' },
        h(
          'div',
          { className: 'vcg-row' },
          h('span', { className: 'vcg-studio-section-title' }, t('stuWorkflowLibrary')),
          workflows.length ? h(Badge, null, String(workflows.length)) : null,
        ),
        h(Button, { size: 'sm', onClick: onReload, disabled: loading, icon: 'refresh' }, loading ? t('loading') : t('refresh')),
      ),
      error ? h(Banner, { kind: 'error', title: t('stuLoadFailed'), action: h(Button, { size: 'sm', onClick: onReload }, t('retry')) }, error) : null,
      loading && workflows.length === 0
        ? h('div', { className: 'vcg-studio-loading' }, h(Spinner, { label: t('loading') }))
        : h(
            'div',
            { className: 'vcg-studio-wf-grid' },
            h(
              'div',
              { className: 'vcg-studio-wf-card vcg-studio-wf-new', role: 'button', tabIndex: 0, onClick: onNew, onKeyDown: (event) => { if (event.key === 'Enter') onNew() } },
              h('div', { className: 'vcg-studio-wf-card-head' }, h(Glyph, { name: 'plus', size: 16 }), h('span', { className: 'vcg-studio-wf-name' }, t('stuNewWorkflow'))),
              h('div', { className: 'vcg-studio-wf-desc' }, t('stuNewWorkflowDesc')),
              h('div', { className: 'vcg-studio-wf-foot' }, h('span', { className: 'vcg-hint' }, 'prompt-input / model-loader / ksampler / image-output')),
            ),
            workflows.map((workflow) =>
              h(WorkflowCard, {
                key: (workflow && (workflow.id || workflow.name)) || V.uid('wf'),
                workflow,
                nodeCount: asArray(workflow && workflow.nodes).length,
                onOpen,
              }),
            ),
          ),
      workflows.length === 0 && !loading && !error
        ? h(Empty, { title: t('stuNoWorkflows'), hint: t('stuNoWorkflowsHint'), icon: 'layers', action: h(Button, { onClick: onNew }, t('stuNewWorkflow')) })
        : null,
    )
  }

  /* --------------------------------------------------------- canvas view */

  function CanvasView({
    workflow,
    nodeDefs,
    results,
    selectedId,
    onSelect,
    onChange,
    onRunAll,
    onRunNode,
    running,
    savedAt,
    saving,
    onSave,
    onBack,
    scopeKey,
    scopeOptions,
    onScopeChange,
    outputDirHint,
    loading,
  }) {
    const Canvas = V.Canvas
    const nodeCount = asArray(workflow && workflow.nodes).length
    return h(
      'div',
      { className: 'vcg-studio-canvas-panel' },
      h(
        'div',
        { className: 'vcg-studio-canvas-toolbar' },
        h(
          'div',
          { className: 'vcg-row', style: { flexWrap: 'wrap', minWidth: 0 } },
          h(Button, { size: 'sm', onClick: onBack, icon: 'back' }, t('stuBackLibrary')),
          h('span', { className: 'vcg-studio-canvas-name' }, (workflow && workflow.name) || t('stuCanvas')),
          h(Badge, null, t('stuNodeCount', { n: nodeCount })),
          h(Badge, { color: savedAt ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-state-warn-primary)' }, savedAt ? t('stuSavedAt', { time: V.formatTime(savedAt) }) : t('stuNotSaved')),
        ),
        h(
          'div',
          { className: 'vcg-row', style: { flexWrap: 'wrap' } },
          h(
            Field,
            { label: t('stuScope'), style: { minWidth: 190 } },
            h(Select, { value: scopeKey, options: scopeOptions, onChange: onScopeChange }),
          ),
          h(
            Button,
            { variant: 'primary', size: 'sm', onClick: onSave, disabled: saving, icon: saving ? undefined : 'save' },
            saving ? t('saving') : t('stuSaveCanvas'),
          ),
        ),
      ),
      outputDirHint ? h('div', { className: 'vcg-studio-canvas-hint' }, outputDirHint) : null,
      loading
        ? h('div', { className: 'vcg-studio-loading' }, h(Spinner, { label: t('stuCanvasLoading') }))
        : h(
            'div',
            { className: 'vcg-studio-canvas' },
            Canvas
              ? h(Canvas, {
                  workflow,
                  nodeDefs,
                  results,
                  selectedId,
                  onSelect,
                  onChange,
                  onRunNode,
                  onRunAll,
                  running,
                  readOnly: false,
                  outputDirHint: outputDirHint || '',
                })
              : h(Empty, {
                  title: t('stuCanvasMissing'),
                  hint: t('stuCanvasMissingHint'),
                  icon: 'node',
                }),
          ),
    )
  }

  /* ------------------------------------------------------------- projects */

  function ProjectRow({ project, openingId, onOpen, onDelete, onCopyPath, copied, deleteArmed, onArmDelete }) {
    const path = project.path || ''
    return h(
      'div',
      { className: 'vcg-studio-project' },
      h(
        'div',
        { className: 'vcg-studio-project-main' },
        h(
          'div',
          { className: 'vcg-row', style: { flexWrap: 'wrap' } },
          h('span', { className: 'vcg-studio-project-name' }, project.name || project.id),
          project.workspaceId
            ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('stuProjectWorkspace'))
            : h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('stuWorkspaceMissing')),
          project.createdAt ? h(Badge, null, t('stuCreatedAt') + ' ' + V.formatTime(project.createdAt)) : null,
        ),
        h('div', { className: 'vcg-studio-mono' }, path || t('stuNoOutputPath')),
        project.workspaceId ? h('div', { className: 'vcg-hint' }, project.workspaceId) : null,
      ),
      h(
        'div',
        { className: 'vcg-row', style: { flexWrap: 'wrap' } },
        h(
          Button,
          {
            size: 'sm',
            variant: 'primary',
            disabled: !project.workspaceId || openingId === project.id,
            title: project.workspaceId ? t('stuOpenProject') : t('stuWorkspaceMissing'),
            onClick: () => onOpen(project),
          },
          openingId === project.id ? t('working') : t('stuOpenProject'),
        ),
        h(Button, { size: 'sm', onClick: () => onCopyPath(project) }, copied === project.id ? t('copied') : t('copyPath')),
        h(
          Button,
          { size: 'sm', variant: 'danger', onClick: () => (deleteArmed === project.id ? onDelete(project) : onArmDelete(project.id)) },
          deleteArmed === project.id ? t('confirm') : t('delete'),
        ),
      ),
    )
  }

  function ProjectsTab({ projects, loading, error, onReload, onOpenProject }) {
    const [name, setName] = React.useState('')
    const [path, setPath] = React.useState('')
    const [creating, setCreating] = React.useState(false)
    const [createError, setCreateError] = React.useState('')
    const [created, setCreated] = React.useState(null)
    const [openError, setOpenError] = React.useState('')
    const [opening, setOpening] = React.useState('')
    const [copied, setCopied] = React.useState('')
    const [deleteArmed, setDeleteArmed] = React.useState('')
    const copyTimer = React.useRef(null)

    React.useEffect(
      () => () => {
        if (copyTimer.current) clearTimeout(copyTimer.current)
      },
      [],
    )

    async function createProject() {
      const trimmed = name.trim()
      if (trimmed === '') return
      setCreating(true)
      setCreateError('')
      setOpenError('')
      try {
        const result = await V.rpc('createProject', { name: trimmed, path: path.trim() || undefined })
        const project = result && result.project ? result.project : result
        setCreated(project || null)
        setName('')
        setPath('')
        await onReload()
      } catch (error) {
        setCreateError(msgOf(error))
      } finally {
        setCreating(false)
      }
    }

    async function removeProject(project) {
      setOpenError('')
      try {
        await V.rpc('deleteProject', { id: project.id })
        setCreated(null)
        await onReload()
      } catch (error) {
        setOpenError(msgOf(error))
      }
    }

    async function openProject(project) {
      setOpening(project.id)
      setOpenError('')
      try {
        await onOpenProject(project)
      } catch (error) {
        setOpenError(msgOf(error))
      } finally {
        setOpening('')
      }
    }

    async function copyPath(project) {
      const ok = await V.copyText(project.path || '')
      if (!ok) {
        setOpenError(t('stuCopyFail'))
        return
      }
      setCopied(project.id)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(''), 2000)
    }

    return h(
      'div',
      { className: 'vcg-studio-panel vcg-scroll' },
      h(
        'div',
        { className: 'vcg-studio-section-head' },
        h('span', { className: 'vcg-studio-section-title' }, t('stuProjectsTitle')),
        h(Button, { size: 'sm', onClick: onReload, disabled: loading, icon: 'refresh' }, loading ? t('loading') : t('refresh')),
      ),
      h('div', { className: 'vcg-hint' }, t('stuProjectsDesc')),
      h(
        'div',
        { className: 'vcg-studio-create' },
        h(
          'div',
          { className: 'vcg-studio-grid2' },
          h(
            Field,
            { label: t('stuProjectName') },
            h(TextInput, { value: name, placeholder: t('stuProjectNamePh'), onChange: setName }),
          ),
          h(
            Field,
            { label: t('stuProjectPath'), hint: t('stuProjectPathHint') },
            h(TextInput, { value: path, placeholder: '/home/user/projects/vcg', onChange: setPath }),
          ),
        ),
        h(
          'div',
          { className: 'vcg-row' },
          h(Button, { variant: 'primary', onClick: createProject, disabled: creating || name.trim() === '', icon: 'plus' }, creating ? t('stuCreating') : t('stuCreateProject')),
          created && created.workspaceId
            ? h(Button, { onClick: () => openProject(created), disabled: opening === created.id, icon: 'external' }, t('stuOpenInNewSession'))
            : null,
        ),
        createError ? h(Banner, { kind: 'error' }, createError) : null,
        created
          ? h(
              Banner,
              {
                kind: 'success',
                title: t('stuProjectCreated'),
                action: created.workspaceId
                  ? h(Button, { size: 'sm', onClick: () => openProject(created) }, t('stuOpenInNewSession'))
                  : null,
              },
              h('div', { className: 'vcg-col', style: { gap: 2 } },
                h('div', null, t('stuProjectCreatedHint')),
                h('div', { className: 'vcg-studio-mono' }, (created.name || '') + ' · ' + (created.path || '')),
                created.workspaceId ? null : h('div', { className: 'vcg-hint' }, t('stuWorkspaceMissing')),
              ),
            )
          : null,
        openError ? h(Banner, { kind: 'error', title: t('stuOpenFail') }, openError) : null,
      ),
      error ? h(Banner, { kind: 'error', title: t('stuLoadFailed'), action: h(Button, { size: 'sm', onClick: onReload }, t('retry')) }, error) : null,
      loading && projects.length === 0
        ? h('div', { className: 'vcg-studio-loading' }, h(Spinner, { label: t('loading') }))
        : projects.length === 0
          ? h(Empty, { title: t('stuNoProjects'), hint: t('stuNoProjectsHint'), icon: 'folder' })
          : h(
              'div',
              { className: 'vcg-col' },
              projects.map((project) =>
                h(ProjectRow, {
                  key: project.id,
                  project,
                  openingId: opening,
                  copied,
                  deleteArmed,
                  onOpen: openProject,
                  onDelete: removeProject,
                  onCopyPath: copyPath,
                  onArmDelete: setDeleteArmed,
                }),
              ),
            ),
    )
  }

  /* -------------------------------------------------------------- outputs */

  function OutputCard({ output }) {
    const [thumb, setThumb] = React.useState(null)
    const [failed, setFailed] = React.useState(false)
    const [copied, setCopied] = React.useState(false)
    const copyTimer = React.useRef(null)
    const path = (output && output.path) || ''
    const kind = (output && output.kind) || 'image'
    React.useEffect(
      () => () => {
        if (copyTimer.current) clearTimeout(copyTimer.current)
      },
      [],
    )
    async function copyPath() {
      if (!path) return
      const ok = await V.copyText(path)
      if (!ok) return
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 1800)
    }
    React.useEffect(() => {
      let alive = true
      if (!path || kind === 'video') return undefined
      V.rpc('readOutput', { path })
        .then((result) => {
          if (alive && result && result.dataUrl) setThumb({ url: result.dataUrl, mime: result.mime || 'image/png' })
        })
        .catch(() => {
          if (alive) setFailed(true)
        })
      return () => {
        alive = false
      }
    }, [path, kind])
    return h(
      'div',
      {
        className: 'vcg-studio-out',
        title: path ? path + '\n' + t('stuClickCopy') : t('stuNoOutputPath'),
        role: 'button',
        tabIndex: 0,
        onClick: copyPath,
        onKeyDown: (event) => {
          if (event.key === 'Enter') copyPath()
        },
      },
      h(
        'div',
        { className: 'vcg-studio-out-thumb' },
        thumb
          ? h('img', { className: 'vcg-thumb', src: thumb.url, alt: (output && output.prompt) || 'output' })
          : kind === 'video'
            ? h('div', { className: 'vcg-studio-out-placeholder' }, h(Glyph, { name: 'video', size: 24 }), h('span', { className: 'vcg-hint' }, t('stuVideoNoPreview')))
            : failed
              ? h('div', { className: 'vcg-studio-out-placeholder' }, h(Glyph, { name: 'warning', size: 22 }), h('span', { className: 'vcg-hint' }, t('stuOutputLoadFail')))
              : h('div', { className: 'vcg-studio-out-placeholder' }, h(Spinner, { size: 16 })),
      ),
      h('div', { className: 'vcg-studio-out-prompt' }, (output && output.prompt) || '—'),
      h('div', { className: 'vcg-studio-out-path', title: path || t('stuNoOutputPath') }, path || t('stuNoOutputPath')),
      h(
        'div',
        { className: 'vcg-studio-out-meta' },
        copied ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('copied')) : null,
        kind === 'video' ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('stuKindVideo')) : null,
        output && output.model ? h(Badge, { color: 'var(--dsw-alias-brand-primary)' }, output.model) : null,
        output && output.providerId ? h(Badge, null, output.providerId) : null,
        output && output.ts ? h('span', { className: 'vcg-hint' }, V.formatTime(output.ts)) : null,
      ),
    )
  }

  function OutputsTab({ refreshKey, outputDir, projectId, rootPath }) {
    const [dirInfo, setDirInfo] = React.useState('')
    const [dirError, setDirError] = React.useState('')
    const [openingDir, setOpeningDir] = React.useState(false)
    const [copied, setCopied] = React.useState(false)
    const asyncData = V.useAsync(
      () =>
        V.rpc('listOutputs', { limit: 60 }).then((result) => {
          const outputs = asArray(result && result.outputs)
          return outputs
        }),
      [refreshKey],
    )
    const outputs = asArray(asyncData.data)
    async function openDir() {
      setOpeningDir(true)
      setDirError('')
      try {
        const args = projectId ? { projectId } : {}
        const result = await V.rpc('openOutputDir', args)
        setDirInfo((result && result.path) || '')
      } catch (error) {
        setDirError(msgOf(error))
      } finally {
        setOpeningDir(false)
      }
    }
    async function copyDir() {
      const ok = await V.copyText(dirInfo)
      if (!ok) {
        setDirError(t('stuCopyFail'))
        return
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    return h(
      'div',
      { className: 'vcg-studio-panel vcg-scroll' },
      h(
        'div',
        { className: 'vcg-studio-section-head' },
        h(
          'div',
          { className: 'vcg-row', style: { flexWrap: 'wrap' } },
          h('span', { className: 'vcg-studio-section-title' }, t('stuOutputsTitle')),
          h(Badge, null, t('stuOutputCount', { n: outputs.length })),
          h(Badge, null, t('stuOutputDir') + '：' + (outputDir || 'vcg-output')),
        ),
        h(
          'div',
          { className: 'vcg-row' },
          h(Button, { size: 'sm', onClick: openDir, disabled: openingDir, icon: 'folder' }, openingDir ? t('working') : t('stuOpenOutputDir')),
          h(Button, { size: 'sm', onClick: asyncData.reload, disabled: asyncData.loading, icon: 'refresh' }, asyncData.loading ? t('loading') : t('refresh')),
        ),
      ),
      h('div', { className: 'vcg-hint' }, t('stuOutputsDesc') + (rootPath ? ' · ' + t('stuOutputDirHint', { path: rootPath }) : '')),
      asyncData.error
        ? h(Banner, { kind: 'error', title: t('stuLoadFailed'), action: h(Button, { size: 'sm', onClick: asyncData.reload }, t('retry')) }, asyncData.error)
        : null,
      dirError ? h(Banner, { kind: 'error', title: t('stuOutputDirFail') }, dirError) : null,
      dirInfo
        ? h(
            Banner,
            { kind: 'success', title: t('stuOpenOutputDir') },
            h(
              'div',
              { className: 'vcg-row', style: { flexWrap: 'wrap' } },
              h('span', { className: 'vcg-studio-mono' }, dirInfo),
              h(Button, { size: 'sm', onClick: copyDir }, copied ? t('copied') : t('copy')),
            ),
          )
        : null,
      asyncData.loading && outputs.length === 0
        ? h('div', { className: 'vcg-studio-loading' }, h(Spinner, { label: t('stuLoadingOutputs') }))
        : outputs.length === 0
          ? h(Empty, { title: t('stuOutputEmpty'), hint: t('stuOutputEmptyHint'), icon: 'image', action: h(Button, { onClick: openDir }, t('stuOpenOutputDir')) })
          : h(
              'div',
              { className: 'vcg-studio-out-grid' },
              outputs.map((output) => h(OutputCard, { key: (output && output.id) || (output && output.path) || V.uid('out'), output })),
            ),
    )
  }

  /* ------------------------------------------------------ settings shortcut */

  function SettingsShortcut({ onOpenSettings, settingsAvailable, state }) {
    const providerMissing = !state || !(state.providers || []).some((provider) => provider.enabled !== false && splitHasImage(provider))
    return h(
      'div',
      { className: 'vcg-studio-panel vcg-scroll' },
      h('div', { className: 'vcg-studio-section-head' }, h('span', { className: 'vcg-studio-section-title' }, t('stuSettingsTitle'))),
      h(Banner, { kind: 'info', title: t('settings') }, t('stuSettingsDesc')),
      providerMissing
        ? h(Banner, { kind: 'warn', title: t('stuProviderMissing'), action: settingsAvailable ? h(Button, { size: 'sm', onClick: onOpenSettings }, t('stuOpenSettings')) : null }, h('div', null, t('stuOpenSettingsHint')))
        : null,
      settingsAvailable
        ? h('div', { className: 'vcg-row' }, h(Button, { variant: 'primary', onClick: onOpenSettings, icon: 'settings' }, t('stuOpenSettings')))
        : h(Banner, { kind: 'info' }, t('stuSettingsNavMissing')),
      h('div', { className: 'vcg-divider' }),
      h(Banner, { kind: 'info' }, t('stuConversationHint')),
      h(Banner, { kind: 'info' }, t('stuProjectScopeHint')),
      state && state.local && state.local.enabled
        ? h(Banner, { kind: 'warn', title: t('stuLocalWarnTitle') }, t('stuLocalWarn'))
        : null,
    )
  }

  function splitHasImage(provider) {
    const models = provider && provider.models
    if (!models) return false
    if (Array.isArray(models)) return models.length > 0
    return Array.isArray(models.image) && models.image.length > 0
  }

  /* --------------------------------------------------------- main studio */

  function StudioPage() {
    const store = V.useStore()
    const [tab, setTab] = React.useState('workflows')
    const [headerError, setHeaderError] = React.useState('')
    const [workflowError, setWorkflowError] = React.useState('')
    const [workflowOk, setWorkflowOk] = React.useState('')
    const [canvas, setCanvas] = React.useState(null)
    const [canvasLoading, setCanvasLoading] = React.useState(false)
    const [results, setResults] = React.useState({})
    const [selectedId, setSelectedId] = React.useState(null)
    const [running, setRunning] = React.useState(false)
    const [runError, setRunError] = React.useState('')
    const [saving, setSaving] = React.useState(false)
    const [savedAt, setSavedAt] = React.useState('')
    const [scopeKey, setScopeKey] = React.useState(STUDIO_SCOPE)
    const [aiPrompt, setAiPrompt] = React.useState('')
    const [aiBusy, setAiBusy] = React.useState(false)
    const [aiResult, setAiResult] = React.useState(null)
    const [aiError, setAiError] = React.useState('')
    const [outputsTick, setOutputsTick] = React.useState(0)
    const okTimer = React.useRef(null)

    const workflowsAsync = V.useAsync(
      () => V.rpc('listWorkflows').then((result) => asArray(result && result.workflows)),
      [],
    )
    const nodesAsync = V.useAsync(
      () => V.rpc('listNodes').then((result) => asArray(result && result.nodes)),
      [],
    )
    const projectsAsync = V.useAsync(
      () => V.rpc('listProjects').then((result) => asArray(result && result.projects)),
      [],
    )

    const state = store.state
    const projects = asArray(projectsAsync.data)
    const nodeDefs = asArray(nodesAsync.data)
    const workflows = asArray(workflowsAsync.data)

    const showOk = (text) => {
      setWorkflowOk(text)
      if (okTimer.current) clearTimeout(okTimer.current)
      okTimer.current = setTimeout(() => setWorkflowOk(''), 4500)
    }

    React.useEffect(
      () => () => {
        if (okTimer.current) clearTimeout(okTimer.current)
      },
      [],
    )

    React.useEffect(() => {
      let alive = true
      V.refresh().catch((error) => {
        if (alive) setHeaderError(msgOf(error))
      })
      ;(async () => {
        setCanvasLoading(true)
        try {
          const result = await V.rpc('getCanvas', { key: STUDIO_SCOPE })
          if (!alive) return
          const workflow = result && result.workflow
          if (workflow) {
            setCanvas(workflow)
            setSavedAt((result && result.updatedAt) || '')
          }
        } catch (error) {
          if (alive) setWorkflowError(msgOf(error))
        } finally {
          if (alive) setCanvasLoading(false)
        }
      })()
      return () => {
        alive = false
      }
    }, [])

    React.useEffect(() => {
      if (!projectsAsync.loading && projectsAsync.data && scopeKey.startsWith('project:')) {
        const exists = projects.some((project) => 'project:' + project.id === scopeKey)
        if (!exists) {
          setScopeKey(STUDIO_SCOPE)
          setCanvas(null)
          setSavedAt('')
          setResults({})
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectsAsync.loading, projectsAsync.data])

    const scopeOptions = [{ value: STUDIO_SCOPE, label: t('stuScopeStudio') }].concat(
      projects.map((project) => ({
        value: 'project:' + project.id,
        label: t('stuScopeProject', { name: project.name || project.id }),
      })),
    )

    const scopeProject = projectForScope(projects, scopeKey)
    const baseDir = scopeProject && scopeProject.path ? scopeProject.path : undefined
    const rootPath = scopeProject && scopeProject.path ? scopeProject.path : ''
    const outputDir = (state && state.outputDir) || 'vcg-output'
    const outputDirHint = rootPath
      ? t('stuOutputDirHint', { path: rootPath + '/' + outputDir })
      : t('stuOutputDirHint', { path: t('stuWorkbenchRoot') + '/' + outputDir })

    function refreshAll() {
      setHeaderError('')
      V.refresh().catch((error) => setHeaderError(msgOf(error)))
      workflowsAsync.reload()
      nodesAsync.reload()
      projectsAsync.reload()
      setOutputsTick((tick) => tick + 1)
    }

    async function changeScope(nextKey) {
      setScopeKey(nextKey)
      setCanvas(null)
      setSavedAt('')
      setResults({})
      setSelectedId(null)
      setRunError('')
      setCanvasLoading(true)
      setWorkflowError('')
      try {
        const result = await V.rpc('getCanvas', { key: nextKey })
        if (result && result.workflow) {
          setCanvas(result.workflow)
          setSavedAt(result.updatedAt || '')
        }
      } catch (error) {
        setWorkflowError(msgOf(error))
      } finally {
        setCanvasLoading(false)
      }
    }

    async function openBuiltin(workflow) {
      setWorkflowError('')
      setWorkflowOk('')
      setCanvasLoading(true)
      try {
        const saved = await V.rpc('getCanvas', { key: scopeKey })
        const savedWorkflow = saved && saved.workflow
        const same = Boolean(savedWorkflow && workflow) && (String(savedWorkflow.id || '') === String(workflow.id || '') || savedWorkflow.name === workflow.name)
        setCanvas(same ? savedWorkflow : cloneWorkflow(workflow))
        setSavedAt(same ? saved.updatedAt || '' : '')
        setResults({})
        setSelectedId(null)
      } catch (error) {
        setWorkflowError(msgOf(error))
      } finally {
        setCanvasLoading(false)
      }
    }

    function createEmptyWorkflow() {
      setWorkflowError('')
      setWorkflowOk('')
      const workflow = defaultWorkflow()
      setCanvas(workflow)
      setSavedAt('')
      setResults({})
      setSelectedId(null)
      showOk(t('stuNewWorkflowDesc'))
    }

    async function saveCanvas() {
      if (!canvas) return
      setSaving(true)
      setWorkflowError('')
      try {
        const result = await V.rpc('saveCanvas', { key: scopeKey, workflow: canvas })
        setSavedAt((result && result.updatedAt) || new Date().toISOString())
        showOk(t('saved'))
      } catch (error) {
        setWorkflowError(msgOf(error))
      } finally {
        setSaving(false)
      }
    }

    async function runAll() {
      if (!canvas || running) return
      setRunning(true)
      setWorkflowError('')
      setWorkflowOk('')
      setRunError('')
      try {
        const result = await V.rpc('runWorkflow', {
          key: scopeKey,
          workflow: canvas,
          ...(baseDir ? { baseDir } : {}),
        })
        setResults(normalizeRunResults(result && result.results))
        const warnings = asArray(result && result.warnings)
        if (result && result.error) setRunError(String(result.error))
        else if (warnings.length) setWorkflowOk(t('stuRunWarnings') + '：' + warnings.join('；'))
        else showOk(t('stuRunDone'))
        setOutputsTick((tick) => tick + 1)
      } catch (error) {
        setRunError(msgOf(error))
      } finally {
        setRunning(false)
      }
    }

    async function onRunNode(nodeId) {
      if (!canvas) return
      setWorkflowError('')
      try {
        const result = await V.rpc('runNode', {
          key: scopeKey,
          nodeId,
          workflow: canvas,
          ...(baseDir ? { baseDir } : {}),
        })
        const nodeResult = normalizeRunResult(result && result.result)
        setResults((previous) => ({ ...previous, [nodeId]: nodeResult }))
        setOutputsTick((tick) => tick + 1)
      } catch (error) {
        setRunError(msgOf(error))
      }
    }

    async function buildWorkflowWithAi() {
      const prompt = aiPrompt.trim()
      if (prompt === '') {
        setAiError(t('stuAiEmptyPrompt'))
        return
      }
      setAiBusy(true)
      setAiError('')
      setAiResult(null)
      try {
        const result = await V.rpc('buildWorkflow', { prompt, current: canvas || undefined })
        const workflow = result && result.workflow
        setAiResult({
          reply: (result && result.reply) || '',
          notes: asArray(result && result.notes),
          usedModel: (result && result.usedModel) || '',
        })
        if (workflow && Array.isArray(workflow.nodes) && workflow.nodes.length > 0) {
          setCanvas(workflow)
          setSavedAt('')
          setResults({})
          setSelectedId(null)
          setWorkflowError('')
          showOk(t('stuAiApplied'))
        } else {
          setAiError(t('stuAiNoWorkflow'))
        }
      } catch (error) {
        setAiError(msgOf(error))
      } finally {
        setAiBusy(false)
      }
    }

    async function openProjectWorkspace(project) {
      if (!project.workspaceId) {
        throw new Error(t('stuWorkspaceMissing'))
      }
      const nav = V.nav || {}
      if (typeof nav.openWorkspace === 'function') {
        await nav.openWorkspace(project.workspaceId, (sessionId) => {
          if (sessionId) V.setPreferredView(sessionId, 'vcg')
        })
        return
      }
      if (typeof nav.connectWorkspace === 'function') {
        const sessionId = await nav.connectWorkspace(project.workspaceId)
        if (sessionId) {
          V.setPreferredView(sessionId, 'vcg')
          if (typeof nav.openSession === 'function') nav.openSession(sessionId)
          return
        }
      }
      throw new Error(t('stuNavMissing'))
    }

    function openSettingsPage() {
      const nav = V.nav || {}
      if (typeof nav.openSettings === 'function') {
        try {
          const result = nav.openSettings('vcg')
          if (result && typeof result.catch === 'function') result.catch(() => {})
          return
        } catch {
          /* fall through to the hint */
        }
      }
      setTab('settings')
    }

    const settingsAvailable = Boolean(V.nav && typeof V.nav.openSettings === 'function')

    /* header chips */
    const providerText = providerLabelOf(state) || t('stuProviderMissing')
    const engineText = state && state.local && state.local.enabled ? t('stuEngineLocal') : t('stuEngineCloud')
    const chips = h(
      'div',
      { className: 'vcg-studio-chips' },
      h(
        'button',
        {
          type: 'button',
          className: 'vcg-chip ' + (providerText === t('stuProviderMissing') ? 'vcg-studio-chip-warn' : ''),
          onClick: () => setTab('settings'),
          title: t('stuOpenSettingsHint'),
        },
        h(Glyph, { name: 'cloud', size: 13 }),
        providerText,
      ),
      h(
        'button',
        {
          type: 'button',
          className: 'vcg-chip',
          onClick: () => setTab('settings'),
          title: t('stuOpenSettingsHint'),
        },
        h(Glyph, { name: engineText === t('stuEngineLocal') ? 'server' : 'bolt', size: 13 }),
        t('stuEngine') + '：' + engineText,
      ),
      h(
        'button',
        {
          type: 'button',
          className: 'vcg-chip',
          title: outputDirHint,
          onClick: () => setTab('outputs'),
        },
        h(Glyph, { name: 'folder', size: 13 }),
        t('stuOutputDir') + '：' + outputDir,
      ),
    )

    const header = h(
      'div',
      { className: 'vcg-studio-header' },
      h(
        'div',
        { className: 'vcg-row', style: { minWidth: 0, flexWrap: 'wrap' } },
        h('div', { className: 'vcg-studio-brand' }, h(Glyph, { name: 'sparkles', size: 20 })),
        h(
          'div',
          { style: { minWidth: 0 } },
          h('div', { className: 'vcg-studio-title' }, t('stuTitle')),
          h('div', { className: 'vcg-studio-subtitle' }, t('stuDesc')),
        ),
      ),
      chips,
      h(
        'div',
        { className: 'vcg-row' },
        h(Button, { size: 'sm', onClick: refreshAll, icon: 'refresh' }, t('stuRefresh')),
      ),
    )

    const tabBar = h(Tabs, {
      tabs: [
        { id: 'workflows', label: t('stuTabWorkflows') },
        { id: 'projects', label: t('stuTabProjects') },
        { id: 'outputs', label: t('stuTabOutputs') },
        { id: 'settings', label: t('stuTabSettings') },
      ],
      active: tab,
      onChange: setTab,
    })

    function renderWorkflowsTab() {
      const workflowsError = workflowsAsync.error ? msgOf(workflowsAsync.error) : ''
      return h(
        'div',
        { className: 'vcg-studio-panel' },
        h(AiBuilder, {
          prompt: aiPrompt,
          onPrompt: setAiPrompt,
          busy: aiBusy,
          result: aiResult,
          error: aiError,
          onGenerate: buildWorkflowWithAi,
          hasCanvas: Boolean(canvas),
        }),
        workflowError ? h(Banner, { kind: 'error', title: t('stuRunError'), action: h(Button, { size: 'sm', onClick: () => setWorkflowError('') }, t('close')) }, workflowError) : null,
        workflowOk ? h(Banner, { kind: 'success' }, workflowOk) : null,
        runError ? h(Banner, { kind: 'error', title: t('stuRunFail') }, runError) : null,
        nodesAsync.error ? h(Banner, { kind: 'warn', title: t('stuNodeDefsError') }, msgOf(nodesAsync.error)) : null,
        canvas
          ? h(CanvasView, {
              workflow: canvas,
              nodeDefs,
              results,
              selectedId,
              onSelect: setSelectedId,
              onChange: (next) => { if (next) setCanvas(next) },
              onRunAll: runAll,
              onRunNode: onRunNode,
              running,
              savedAt,
              saving,
              onSave: saveCanvas,
              onBack: () => {
                setCanvas(null)
                setSavedAt('')
                setResults({})
                setSelectedId(null)
                setRunError('')
              },
              scopeKey,
              scopeOptions,
              onScopeChange: changeScope,
              outputDirHint,
              loading: canvasLoading,
            })
          : h(WorkflowLibrary, {
              workflows,
              loading: workflowsAsync.loading,
              error: workflowsError,
              nodeDefs,
              onOpen: openBuiltin,
              onNew: createEmptyWorkflow,
              onReload: workflowsAsync.reload,
            }),
        running ? h('div', { className: 'vcg-studio-runbar' }, h(Spinner, { size: 14, label: t('stuRunning') })) : null,
      )
    }

    let body
    if (tab === 'workflows') {
      body = renderWorkflowsTab()
    } else if (tab === 'projects') {
      body = h(ProjectsTab, {
        projects,
        loading: projectsAsync.loading,
        error: projectsAsync.error ? msgOf(projectsAsync.error) : '',
        onReload: projectsAsync.reload,
        onOpenProject: openProjectWorkspace,
      })
    } else if (tab === 'outputs') {
      body = h(OutputsTab, {
        refreshKey: outputsTick,
        outputDir,
        projectId: scopeProject ? scopeProject.id : '',
        rootPath,
      })
    } else {
      body = h(SettingsShortcut, { onOpenSettings: openSettingsPage, settingsAvailable, state })
    }

    return h(
      'div',
      { className: 'vcg-studio-root' },
      h(StyleTag),
      V.styleTag(CSS),
      header,
      h('div', { className: 'vcg-studio-tabbar' }, tabBar),
      headerError ? h('div', { className: 'vcg-studio-headererror' }, h(Banner, { kind: 'error', action: h(Button, { size: 'sm', onClick: refreshAll }, t('retry')) }, headerError)) : null,
      h('div', { className: 'vcg-studio-body' }, body),
    )
  }

  /* ------------------------------------------------------------------ css */

  const CSS = `
.vcg-studio-root{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;overflow:hidden}
.vcg-studio-root *{box-sizing:border-box}
.vcg-studio-header{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 18px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;flex:none}
.vcg-studio-brand{width:38px;height:38px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;flex:none;color:#fff;background:linear-gradient(135deg,var(--dsw-alias-brand-primary),color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,var(--dsw-alias-bg-base)));box-shadow:0 2px 12px color-mix(in srgb,var(--dsw-alias-brand-primary) 30%,transparent)}
.vcg-studio-title{font-size:15px;font-weight:650;line-height:1.25}
.vcg-studio-subtitle{font-size:12px;color:var(--dsw-alias-label-secondary);max-width:560px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-studio-chips{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}
.vcg-studio-chip-warn{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 45%,var(--dsw-alias-border-l1))}
.vcg-studio-tabbar{padding:0 18px;flex:none;border-bottom:1px solid var(--dsw-alias-border-l1)}
.vcg-studio-headererror{padding:8px 18px 0;flex:none}
.vcg-studio-body{flex:1;min-height:0;display:flex;flex-direction:column;padding:12px 18px 0;overflow:hidden}
.vcg-studio-panel{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding-bottom:20px;overflow:auto}
.vcg-studio-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-top:2px}
.vcg-studio-section-title{font-size:14px;font-weight:650}
.vcg-studio-loading{display:flex;align-items:center;justify-content:center;padding:40px 0;flex:1}
.vcg-studio-ai{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:12px;display:flex;flex-direction:column;gap:10px;flex:none}
.vcg-studio-ai-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}
.vcg-studio-ai-mark{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex:none;color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,transparent)}
.vcg-studio-ai-title{font-size:13px;font-weight:650}
.vcg-studio-ai-row{display:flex;align-items:flex-start;gap:8px}
.vcg-studio-ai-row .vcg-textarea{flex:1;min-height:52px}
.vcg-studio-ai-result{border-top:1px dashed var(--dsw-alias-border-l1);padding-top:8px;display:flex;flex-direction:column;gap:6px}
.vcg-studio-ai-reply{font-size:12.5px;white-space:pre-wrap;word-break:break-word;max-height:120px;overflow:auto;color:var(--dsw-alias-label-primary)}
.vcg-studio-wf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.vcg-studio-wf-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:11px 12px;display:flex;flex-direction:column;gap:6px;cursor:pointer;transition:border-color 120ms ease,background 120ms ease;min-width:0}
.vcg-studio-wf-card:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.vcg-studio-wf-new{border-style:dashed;align-items:stretch}
.vcg-studio-wf-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0}
.vcg-studio-wf-name{font-size:13px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-studio-wf-desc{font-size:12px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:32px}
.vcg-studio-wf-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto}
.vcg-studio-canvas-panel{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding-bottom:20px}
.vcg-studio-canvas-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;flex-wrap:wrap;flex:none}
.vcg-studio-canvas-name{font-size:13px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px}
.vcg-studio-canvas-hint{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:-4px}
.vcg-studio-canvas{flex:1;min-height:380px;display:flex;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);position:relative}
.vcg-studio-canvas > *{flex:1;min-width:0;min-height:0}
.vcg-studio-runbar{display:flex;align-items:center;gap:8px;justify-content:center;padding:6px;flex:none}
.vcg-studio-create{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:12px;display:flex;flex-direction:column;gap:10px;flex:none}
.vcg-studio-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.vcg-studio-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:var(--dsw-alias-label-secondary);word-break:break-all}
.vcg-studio-project{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:10px 12px;flex-wrap:wrap}
.vcg-studio-project-main{min-width:0;display:flex;flex-direction:column;gap:3px;flex:1 1 320px}
.vcg-studio-project-name{font-size:13px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px}
.vcg-studio-out-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
.vcg-studio-out{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:8px;display:flex;flex-direction:column;gap:6px;cursor:pointer;min-width:0;transition:border-color 120ms ease}
.vcg-studio-out:hover{border-color:var(--dsw-alias-brand-primary)}
.vcg-studio-out-thumb{width:100%;aspect-ratio:1/1;border-radius:8px;overflow:hidden;background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center}
.vcg-studio-out-thumb .vcg-thumb{width:100%;height:100%;border:none;border-radius:8px;cursor:inherit}
.vcg-studio-out-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--dsw-alias-label-secondary);padding:10px;text-align:center}
.vcg-studio-out-prompt{font-size:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:30px;word-break:break-word}
.vcg-studio-out-path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:rtl;text-align:left}
.vcg-studio-out-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;font-size:11px}
@media (max-width:760px){
  .vcg-studio-header{padding:10px 12px}
  .vcg-studio-body{padding:10px 12px 0}
  .vcg-studio-tabbar{padding:0 12px}
  .vcg-studio-ai-row{flex-direction:column}
  .vcg-studio-ai-row .vcg-btn{width:100%}
  .vcg-studio-grid2{grid-template-columns:minmax(0,1fr)}
  .vcg-studio-subtitle{white-space:normal}
}
`

  V.StudioPage = StudioPage
})(V)
