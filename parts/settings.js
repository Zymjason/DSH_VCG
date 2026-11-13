/* ============================================================================
 * VCG 视觉控制生成器 — 设置页（设置 → VCG 视觉控制生成器）
 * Visual Control Generator — settings page (V.SettingsPage).
 *
 * 云端 provider 自动检测 / 默认模型 / 自定义 provider / 本地 ComfyUI 模式 /
 * 专业模式节点导入 / 节点仓库同步 / 输出目录。所有数据走 V.rpc，
 * 纯 React.createElement，无 JSX，无模块 import。
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { React, h } = V
  const {
    Button,
    Field,
    TextInput,
    TextArea,
    NumberInput,
    Select,
    Toggle,
    Banner,
    Spinner,
    Glyph,
    Badge,
    Section,
    StyleTag,
  } = V.ui

  /* ------------------------------------------------------------- locales */

  V.addDict(
    {
      setTitle: 'VCG 视觉控制生成器',
      setDesc: '节点式图像/视频生成工作流画布。所有设置保存后立即生效；云 API 与本地 ComfyUI 运算可随时切换。',
      setStatusTitle: '运行状态',
      setGlobalApi: '全局 API',
      setDetected: '已检测到云端 API',
      setDetectedEmpty: '未检测到云端生图 API，请点击「自动检测」或手动添加 provider。',
      setStatusProvider: '默认 provider',
      setStatusModel: '默认模型',
      setStatusOutputDir: '输出目录',
      setStatusLocal: '运算方式',
      setCloudMode: '云端',
      setLocalModeOn: '本地（ComfyUI）',
      setCloudApi: '云端 API',
      setCloudApiDesc: '自动检测全局已配置的 API（如 Alibaba Token Plan / bailian-chat-image），并选择默认图像 / 视频 / 文本模型。',
      setDetect: '自动检测',
      setDetecting: '检测中…',
      setDetectResult: '检测结果',
      setDetectGlobalKey: '全局 API 凭据可用',
      setDetectNoGlobalKey: '全局 API 凭据不可用，需要自填 API Key',
      setDetectNone: '没有检测到候选 API。可在下方手动添加 provider。',
      setGlobalModels: '全局可用模型',
      setApplyDetected: '使用检测结果',
      setDefaultProvider: '默认 provider',
      setDefaultImage: '默认图像模型',
      setDefaultVideo: '默认视频模型',
      setDefaultText: '默认文本模型',
      setNoneOption: '（未设置）',
      setNoProviderOption: '（无 provider）',
      setTestConn: '测试连接',
      setTesting: '测试中…',
      setTestOk: '连接成功',
      setTestFail: '连接失败',
      setTestNoProvider: '请先选择默认 provider',
      setLatency: '延迟',
      setModels: '模型',
      setTestMode: '模式',
      setProviders: 'Provider 列表',
      setProvidersDesc: '自动检测到的 provider 会列在最前；可编辑、测试或删除，也可手动新增自定义 HTTP provider。',
      setAddProvider: '添加 provider',
      setProviderLabel: '显示名称',
      setProviderKind: '类型',
      setBaseUrl: 'Base URL',
      setApiKey: 'API Key',
      setApiKeyConfigured: '已配置',
      setApiKeyMissing: '未配置',
      setApiKeyKeepPh: '已配置（留空保持不变）',
      setApiKeyEmptyPh: '粘贴 API Key',
      setApiKeyHint: '保存后不回显明文；留空表示保持原值',
      setImageModels: '图像模型',
      setVideoModels: '视频模型',
      setTextModels: '文本模型',
      setModelsHint: '多个模型用逗号分隔',
      setRemoveProvider: '删除 provider',
      setConfirmRemove: '确认删除？',
      setDetectedBadge: '自动检测',
      setEnableProvider: '启用',
      setLocalSection: '本地运算',
      setLocalSectionDesc: '通过本机 ComfyUI 服务执行工作流。开启后所有运算都在本地进行，云端 API 不再参与。',
      setLocalWarnTitle: '本地运算已开启',
      setLocalWarn: '开启后所有运算将在本地运行，请注意硬件性能；需要本机 ComfyUI 服务。',
      setComfyUrl: 'ComfyUI 服务地址',
      setComfyUrlHint: '例如 http://127.0.0.1:8188（需已启动 ComfyUI 并开启 API）',
      setLocalTimeout: '请求超时（毫秒）',
      setLocalTimeoutHint: '默认 600000 毫秒（10 分钟），大工作流可适当增加',
      setLocalMissingTitle: '本地运算尚未配置完成',
      setLocalMissing: '已开启本地运算，但未填写 ComfyUI 服务地址。运行工作流会失败；请先启动本机 ComfyUI 并填写地址。',
      setLocalOffHint: '当前使用云端 API 运算。如需本地 GPU 运算，请开启本地模式并配置 ComfyUI。',
      setProSection: '专业模式',
      setProSectionDesc: '导入自定义 HTTP 节点，声明其所需 API 调用，扩展工作流能力。',
      setProToggle: '开启专业模式',
      setProWarnTitle: '专业模式提示',
      setProWarn: '仅建议具备专业视觉生成经验者使用；导入自定义节点会声明其所需 API 调用，不保证工作流正常运行。',
      setProOffHint: '专业模式未开启，自定义节点导入已禁用。开启后可导入 JSON 节点定义。',
      setImportJson: '自定义节点 JSON',
      setImportPlaceholder: '粘贴节点定义 JSON（executor.kind 必须为 "http"）',
      setImportBtn: '导入节点',
      setImporting: '导入中…',
      setImportNeedPro: '请先开启专业模式',
      setImportEmpty: '请先粘贴节点 JSON',
      setImportOk: '节点已导入',
      setCustomNodes: '自定义节点',
      setCustomNodesEmpty: '还没有导入自定义节点。',
      setNodeSource: '来源',
      setNodeRepoSection: '节点仓库',
      setNodeRepoSectionDesc: '从 GitHub / Gitea raw 源同步节点与工作流定义到本地缓存；同步失败时自动回退内置节点。',
      setGithubBase: 'GitHub raw 源',
      setGiteaBase: 'Gitea raw 源',
      setSyncNow: '同步节点仓库',
      setSyncing: '同步中…',
      setSyncSource: '同步来源',
      setSyncAuto: '自动（优先 GitHub）',
      setSyncGithub: 'GitHub',
      setSyncGitea: 'Gitea',
      setSyncResult: '同步结果',
      setSyncOk: '同步完成',
      setSyncNodes: '节点',
      setSyncWorkflows: '工作流',
      setSyncAt: '同步时间',
      setSyncWarnings: '警告',
      setNodeTotal: '节点总数',
      setBuiltin: '内置',
      setCustomCount: '自定义',
      setWorkflowTotal: '工作流',
      setLastSync: '上次同步',
      setNeverSynced: '尚未同步',
      setNodeLoadError: '节点列表加载失败',
      setOutputSection: '输出',
      setOutputDirName: '输出目录名',
      setOutputDirHint: '输出根目录为工作区 / 项目目录；文件写入 <根目录>/<输出目录名>，例如 项目/vcg-output。',
      setSaveOk: '设置已保存并生效',
      setSaveFail: '保存设置失败',
      setReset: '重置修改',
      setUnsaved: '有未保存的修改',
      setSavedState: '没有未保存的修改',
      setReload: '重新加载',
      setLoadFailed: '设置加载失败',
      setProviderEmpty: '还没有 provider。点击「自动检测」或手动添加。',
      setStorageKey: 'API Key 仅保存在本机插件数据目录中。',
      setCapImage: '图像',
      setCapVideo: '视频',
      setCapText: '文本',
      setDetectingTip: '正在调用宿主 LLM 服务检测可用 API…',
      setNoModels: '没有可用模型',
      setAvailableModels: '可用模型 {count} 个',
      setDetectModelsOk: '已从 /models 读取 {count} 个模型',
      setDetectModelsFail: '未读取到模型',
      setDetectSource: '来源：{source}',
      setDetectSourceModels: '/models 接口',
      setDetectSourceHost: '宿主 LLM 配置',
      setDetectSourceStored: '上次检测结果',
      setModelsExpand: '展开全部模型',
      setModelsCollapse: '收起模型列表',
      setAutoModels: '自动读取的可用模型',
      setAutoModelsEmpty: '尚未自动读取到模型：请确认 Provider 的 /models 接口可用且已填写 API Key，然后点击「自动检测」。',
      setAutoModelsHint: '只读：包含语音等非生成类模型，仅用于查看，不会改动上方可编辑的模型列表。',
      setProviderDisabled: '默认 provider 已被禁用；运行工作流前请启用它或切换到其他默认 provider。',
    },
    {
      setTitle: 'VCG Visual Control Generator',
      setDesc: 'Node-based image/video generation workflow canvas. Settings apply immediately; switch between cloud APIs and local ComfyUI at any time.',
      setStatusTitle: 'Status',
      setGlobalApi: 'Global API',
      setDetected: 'Cloud API detected',
      setDetectedEmpty: 'No cloud image API detected yet. Run auto-detect or add a provider manually.',
      setStatusProvider: 'Default provider',
      setStatusModel: 'Default model',
      setStatusOutputDir: 'Output folder',
      setStatusLocal: 'Compute',
      setCloudMode: 'Cloud',
      setLocalModeOn: 'Local (ComfyUI)',
      setCloudApi: 'Cloud API',
      setCloudApiDesc: 'Auto-detect the globally configured API (e.g. Alibaba Token Plan / bailian-chat-image) and choose default image / video / text models.',
      setDetect: 'Auto-detect',
      setDetecting: 'Detecting…',
      setDetectResult: 'Detection result',
      setDetectGlobalKey: 'Global API credentials available',
      setDetectNoGlobalKey: 'Global API credentials unavailable; provide an API key',
      setDetectNone: 'No candidate API detected. Add a provider manually below.',
      setGlobalModels: 'Global models',
      setApplyDetected: 'Use detected setup',
      setDefaultProvider: 'Default provider',
      setDefaultImage: 'Default image model',
      setDefaultVideo: 'Default video model',
      setDefaultText: 'Default text model',
      setNoneOption: '(not set)',
      setNoProviderOption: '(no provider)',
      setTestConn: 'Test connection',
      setTesting: 'Testing…',
      setTestOk: 'Connected',
      setTestFail: 'Connection failed',
      setTestNoProvider: 'Pick a default provider first',
      setLatency: 'Latency',
      setModels: 'Models',
      setTestMode: 'Mode',
      setProviders: 'Providers',
      setProvidersDesc: 'Auto-detected providers are listed first; edit, test or remove them, or add a custom HTTP provider.',
      setAddProvider: 'Add provider',
      setProviderLabel: 'Display name',
      setProviderKind: 'Kind',
      setBaseUrl: 'Base URL',
      setApiKey: 'API key',
      setApiKeyConfigured: 'Configured',
      setApiKeyMissing: 'Not configured',
      setApiKeyKeepPh: 'Configured (leave empty to keep)',
      setApiKeyEmptyPh: 'Paste the API key',
      setApiKeyHint: 'Never displayed after saving; leave empty to keep the current value',
      setImageModels: 'Image models',
      setVideoModels: 'Video models',
      setTextModels: 'Text models',
      setModelsHint: 'Separate multiple models with commas',
      setRemoveProvider: 'Remove provider',
      setConfirmRemove: 'Confirm removal?',
      setDetectedBadge: 'Auto-detected',
      setEnableProvider: 'Enabled',
      setLocalSection: 'Local compute',
      setLocalSectionDesc: 'Run workflows on a local ComfyUI service. When enabled, all compute is local and cloud APIs are not used.',
      setLocalWarnTitle: 'Local compute enabled',
      setLocalWarn: 'All computation runs locally; watch your hardware performance. A local ComfyUI service is required.',
      setComfyUrl: 'ComfyUI service URL',
      setComfyUrlHint: 'e.g. http://127.0.0.1:8188 (ComfyUI must be running with its API enabled)',
      setLocalTimeout: 'Request timeout (ms)',
      setLocalTimeoutHint: 'Defaults to 600000 ms (10 minutes); increase for big workflows',
      setLocalMissingTitle: 'Local compute is not fully configured',
      setLocalMissing: 'Local compute is enabled but the ComfyUI URL is missing. Running a workflow will fail; start ComfyUI locally and fill in the URL.',
      setLocalOffHint: 'Cloud APIs are used now. Enable local mode and configure ComfyUI to use local GPU compute.',
      setProSection: 'Pro mode',
      setProSectionDesc: 'Import custom HTTP nodes that declare the API calls they need to extend workflows.',
      setProToggle: 'Enable pro mode',
      setProWarnTitle: 'Pro mode notice',
      setProWarn: 'Recommended only for users with professional visual-generation experience. Imported custom nodes declare their API calls; workflows are not guaranteed to run correctly.',
      setProOffHint: 'Pro mode is off and custom node import is disabled. Enable it to import JSON node definitions.',
      setImportJson: 'Custom node JSON',
      setImportPlaceholder: 'Paste a node definition JSON (executor.kind must be "http")',
      setImportBtn: 'Import node',
      setImporting: 'Importing…',
      setImportNeedPro: 'Enable pro mode first',
      setImportEmpty: 'Paste node JSON first',
      setImportOk: 'Node imported',
      setCustomNodes: 'Custom nodes',
      setCustomNodesEmpty: 'No custom nodes imported yet.',
      setNodeSource: 'Source',
      setNodeRepoSection: 'Node repository',
      setNodeRepoSectionDesc: 'Sync node and workflow definitions from a GitHub / Gitea raw source into the local cache; built-in nodes are used as fallback when syncing fails.',
      setGithubBase: 'GitHub raw source',
      setGiteaBase: 'Gitea raw source',
      setSyncNow: 'Sync node repo',
      setSyncing: 'Syncing…',
      setSyncSource: 'Sync source',
      setSyncAuto: 'Auto (prefer GitHub)',
      setSyncGithub: 'GitHub',
      setSyncGitea: 'Gitea',
      setSyncResult: 'Sync result',
      setSyncOk: 'Sync complete',
      setSyncNodes: 'Nodes',
      setSyncWorkflows: 'Workflows',
      setSyncAt: 'Synced at',
      setSyncWarnings: 'Warnings',
      setNodeTotal: 'Total nodes',
      setBuiltin: 'Built-in',
      setCustomCount: 'Custom',
      setWorkflowTotal: 'Workflows',
      setLastSync: 'Last sync',
      setNeverSynced: 'Never synced',
      setNodeLoadError: 'Failed to load node list',
      setOutputSection: 'Output',
      setOutputDirName: 'Output folder name',
      setOutputDirHint: 'The output root is the workspace / project folder; files go to <root>/<output folder>, e.g. project/vcg-output.',
      setSaveOk: 'Settings saved and applied',
      setSaveFail: 'Failed to save settings',
      setReset: 'Reset changes',
      setUnsaved: 'Unsaved changes',
      setSavedState: 'No unsaved changes',
      setReload: 'Reload',
      setLoadFailed: 'Failed to load settings',
      setProviderEmpty: 'No providers yet. Use auto-detect or add one manually.',
      setStorageKey: 'API keys are stored only in the local plugin data folder.',
      setCapImage: 'Image',
      setCapVideo: 'Video',
      setCapText: 'Text',
      setDetectingTip: 'Asking the Host LLM service for available APIs…',
      setNoModels: 'No models available',
      setAvailableModels: 'Available models: {count}',
      setDetectModelsOk: 'Read {count} models from /models',
      setDetectModelsFail: 'No models read',
      setDetectSource: 'Source: {source}',
      setDetectSourceModels: '/models endpoint',
      setDetectSourceHost: 'Host LLM config',
      setDetectSourceStored: 'Last detection',
      setModelsExpand: 'Show all models',
      setModelsCollapse: 'Hide model list',
      setAutoModels: 'Auto-read available models',
      setAutoModelsEmpty: 'No models read yet: check the provider /models endpoint and API key, then run auto-detect.',
      setAutoModelsHint: 'Read-only: includes non-generation models (e.g. audio); viewing only, the editable model lists above are unchanged.',
      setProviderDisabled: 'The default provider is disabled; enable it or pick another default provider before running workflows.',
    },
  )

  const t = (key, vars) => V.t(key, vars)
  const msgOf = (error) => V.messageOf(error)

  /* ------------------------------------------------------------- constants */

  const CAPS = ['image', 'video', 'text']
  const CAP_LABELS = { image: 'setCapImage', video: 'setCapVideo', text: 'setCapText' }
  const CAP_MODEL_KEYS = { image: 'imageModel', video: 'videoModel', text: 'textModel' }
  const KIND_OPTIONS = [
    { value: 'bailian-chat-image', label: 'bailian-chat-image（Alibaba Token Plan）' },
    { value: 'openai-images', label: 'openai-images' },
    { value: 'openai-video', label: 'openai-video' },
    { value: 'custom-http', label: 'custom-http（自定义）' },
  ]

  const capLabel = (cap) => t(CAP_LABELS[cap] || cap)
  const asArray = (value) => (Array.isArray(value) ? value : [])
  const splitList = (text) =>
    String(text == null ? '' : text)
      .split(/[,，\n]/)
      .map((part) => part.trim())
      .filter(Boolean)
  const unique = (list) => Array.from(new Set(list.filter((item) => item !== undefined && item !== null && String(item) !== '')))
  const numOr = (value, fallback) => {
    const number = Number(value)
    return Number.isFinite(number) ? number : fallback
  }

  function normalizeModels(models) {
    const out = { image: [], video: [], text: [], audio: [], all: [] }
    if (Array.isArray(models)) {
      out.image = models.map(String)
      out.all = unique(out.image)
      return out
    }
    if (models && typeof models === 'object') {
      for (const cap of CAPS) out[cap] = asArray(models[cap]).map(String)
      out.audio = asArray(models.audio).map(String)
      out.all = unique(asArray(models.all).map(String))
      if (out.all.length === 0) out.all = unique([].concat(out.image, out.video, out.text, out.audio))
      else out.all = unique(out.all.concat(out.audio))
    }
    return out
  }

  /** Flatten a `test.models` value (array or `{image,video,text,audio,all}` object). */
  function flattenModelIds(value) {
    const collect = (list) =>
      asArray(list)
        .map((model) => (typeof model === 'string' ? model : model && (model.id || model.name)))
        .filter(Boolean)
        .map(String)
    if (Array.isArray(value)) return unique(collect(value))
    if (!value || typeof value !== 'object') return []
    const order = ['image', 'video', 'text', 'audio', 'all']
    const out = []
    for (const key of order) out.push(...collect(value[key]))
    for (const [key, item] of Object.entries(value)) {
      if (order.indexOf(key) === -1) out.push(...collect(item))
    }
    return unique(out)
  }

  function kindOptions(current) {
    const list = KIND_OPTIONS.slice()
    if (current && !list.some((option) => option.value === current)) list.push({ value: current, label: String(current) })
    return list
  }

  function isCustomNode(node) {
    if (!node || typeof node !== 'object') return false
    if (node.custom === true) return true
    if (node.builtin === false) return true
    return node.source === 'imported' || node.source === 'custom'
  }

  /* ------------------------------------------------------ state / form map */

  function providerFromState(provider) {
    const models = normalizeModels(provider.models)
    const configured =
      provider.apiKeyConfigured !== undefined
        ? Boolean(provider.apiKeyConfigured)
        : Boolean(provider.hasKey || provider.apiKey)
    return {
      id: provider.id || V.uid('prov'),
      label: provider.label || provider.id || 'Provider',
      kind: provider.kind || 'bailian-chat-image',
      baseUrl: provider.baseUrl || '',
      apiKeyRef: provider.apiKeyRef || '',
      apiKey: '',
      apiKeyConfigured: configured,
      enabled: provider.enabled !== false,
      detectedFrom: provider.detectedFrom || '',
      modelText: { image: models.image.join(', '), video: models.video.join(', '), text: models.text.join(', ') },
      /* Read-only list auto-read from the provider `/models` endpoint (§14.3). */
      autoModels: models.all,
    }
  }

  function providerFromCandidate(candidate) {
    const mapped = providerFromState(candidate)
    return {
      ...mapped,
      id: candidate.id || V.uid('prov'),
      detectedFrom: candidate.detectedFrom || 'global',
    }
  }

  function defaultProviderId(providers) {
    const first = providers.find((provider) => provider.enabled && provider.modelText.image.trim() !== '')
    return (first || providers[0] || {}).id || ''
  }

  function formFromState(state) {
    const snapshot = state && typeof state === 'object' ? state : {}
    const providers = asArray(snapshot.providers).map(providerFromState)
    const defaults = snapshot.defaults && typeof snapshot.defaults === 'object' ? snapshot.defaults : {}
    const local = snapshot.local && typeof snapshot.local === 'object' ? snapshot.local : {}
    const nodeRepo = snapshot.nodeRepo && typeof snapshot.nodeRepo === 'object' ? snapshot.nodeRepo : {}
    return {
      providers,
      defaults: {
        providerId: defaults.providerId || defaultProviderId(providers),
        imageModel: defaults.imageModel || '',
        videoModel: defaults.videoModel || '',
        textModel: defaults.textModel || '',
      },
      local: {
        enabled: Boolean(local.enabled),
        comfyuiUrl: local.comfyuiUrl || '',
        timeoutMs: numOr(local.timeoutMs, 600000),
      },
      proMode: Boolean(snapshot.proMode),
      nodeRepo: {
        githubBase: nodeRepo.githubBase || '',
        giteaBase: nodeRepo.giteaBase || '',
        lastSyncAt: nodeRepo.lastSyncAt || '',
        source: nodeRepo.source || '',
      },
      outputDir: snapshot.outputDir || 'vcg-output',
    }
  }

  function serializeForm(form) {
    try {
      return JSON.stringify(form)
    } catch {
      return ''
    }
  }

  function buildPatch(form) {
    return {
      providers: form.providers.map((provider) => {
        const models = {}
        for (const cap of CAPS) models[cap] = splitList(provider.modelText[cap])
        // Keep the auto-read catalogue across page saves; the three editable
        // capability lists above are still replaced verbatim.
        const autoModels = unique(asArray(provider.autoModels).map(String))
        if (autoModels.length > 0) models.all = autoModels
        const item = {
          id: provider.id,
          label: String(provider.label || '').trim() || provider.id,
          kind: provider.kind,
          baseUrl: String(provider.baseUrl || '').trim(),
          apiKeyRef: provider.apiKeyRef || undefined,
          models,
          enabled: provider.enabled !== false,
        }
        if (provider.detectedFrom) item.detectedFrom = provider.detectedFrom
        const apiKey = String(provider.apiKey || '').trim()
        if (apiKey !== '') item.apiKey = apiKey
        return item
      }),
      defaults: {
        providerId: form.defaults.providerId || '',
        imageModel: form.defaults.imageModel || '',
        videoModel: form.defaults.videoModel || '',
        textModel: form.defaults.textModel || '',
      },
      local: {
        enabled: Boolean(form.local.enabled),
        comfyuiUrl: String(form.local.comfyuiUrl || '').trim(),
        timeoutMs: Math.max(1000, numOr(form.local.timeoutMs, 600000)),
      },
      proMode: Boolean(form.proMode),
      nodeRepo: {
        githubBase: String(form.nodeRepo.githubBase || '').trim(),
        giteaBase: String(form.nodeRepo.giteaBase || '').trim(),
        source: form.nodeRepo.source || '',
        lastSyncAt: form.nodeRepo.lastSyncAt || '',
      },
      outputDir: String(form.outputDir || '').trim() || 'vcg-output',
    }
  }

  /* ---------------------------------------------------------- small pieces */

  function RemoveButton({ label, confirmLabel, onConfirm, disabled }) {
    const [armed, setArmed] = React.useState(false)
    React.useEffect(() => {
      if (!armed) return undefined
      const timer = setTimeout(() => setArmed(false), 3500)
      return () => clearTimeout(timer)
    }, [armed])
    return h(
      Button,
      {
        variant: 'danger',
        size: 'sm',
        disabled: Boolean(disabled),
        onClick: () => {
          if (armed) {
            setArmed(false)
            if (onConfirm) onConfirm()
          } else {
            setArmed(true)
          }
        },
      },
      armed ? confirmLabel || t('confirm') : label || t('remove'),
    )
  }

  function Stat({ label, value, title }) {
    return h(
      'div',
      { className: 'vcg-set-stat', title: title || (typeof value === 'string' ? value : '') },
      h('div', { className: 'vcg-set-stat-label' }, label),
      h('div', { className: 'vcg-set-stat-value' }, value == null || value === '' ? '—' : value),
    )
  }

  function StatusBanner({ form, detect }) {
    const providers = form ? form.providers : []
    const enabled = providers.filter((provider) => provider.enabled !== false)
    const imageReady = enabled.some((provider) => splitList(provider.modelText.image).length > 0)
    const globalImage = asArray(detect && detect.globalModels && detect.globalModels.image)
    const ready = imageReady || globalImage.length > 0
    const provider = enabled.find((item) => item.id === (form && form.defaults.providerId)) || enabled[0]
    const providerText = provider ? provider.label || provider.id : t('notConfigured')
    const modelText = form && (form.defaults.imageModel || form.defaults.videoModel || form.defaults.textModel)
    const localOn = Boolean(form && form.local.enabled)
    const globalProviders = providers.filter((item) => item.detectedFrom === 'global' || item.apiKeyRef)
    return h(
      Banner,
      {
        kind: ready ? 'success' : 'warn',
        title: ready ? t('setDetected') : t('setDetectedEmpty'),
      },
      h(
        'div',
        { className: 'vcg-set-status' },
        h(Stat, { label: t('setStatusProvider'), value: providerText, title: provider ? provider.label + ' · ' + provider.kind : '' }),
        h(Stat, { label: t('setStatusModel'), value: modelText || t('notConfigured') }),
        h(Stat, { label: t('setStatusOutputDir'), value: (form && form.outputDir) || 'vcg-output' }),
        h(Stat, {
          label: t('setStatusLocal'),
          value: localOn ? t('setLocalModeOn') : t('setCloudMode'),
          title: localOn ? form.local.comfyuiUrl || t('setLocalMissing') : '',
        }),
      ),
      globalProviders.length
        ? h(
            'div',
            { className: 'vcg-row', style: { flexWrap: 'wrap', marginTop: 8 } },
            h('span', { className: 'vcg-hint' }, t('setGlobalApi') + '：'),
            globalProviders.map((item) =>
              h(Badge, { key: item.id, color: 'var(--dsw-alias-brand-primary)' }, (item.label || item.id) + ' · ' + item.kind),
            ),
          )
        : null,
    )
  }

  function ProviderCard({ provider, onChange, onModelText, onRemove, discoveredModels, discovery }) {
    const configured = provider.apiKeyConfigured
    // Read-only "auto-read" catalogue: persisted `models.all` plus the latest
    // `/models` detection result (§14.3).
    const autoRead = unique(asArray(provider.autoModels).concat(asArray(discoveredModels)).map(String))
    const discoveryOk = Boolean(discovery && discovery.ok)
    // Entries outside the three editable lists can only come from `/models`.
    const editable = unique(
      []
        .concat(splitList(provider.modelText.image), splitList(provider.modelText.video), splitList(provider.modelText.text)),
    )
    const autoOnly = autoRead.filter((model) => editable.indexOf(model) === -1)
    const sourceLabel = discoveryOk
      ? t('setDetectSourceModels')
      : provider.detectedFrom === 'global'
        ? t('setDetectSourceHost')
        : autoOnly.length > 0
          ? t('setDetectSourceStored')
          : ''
    const showAuto = autoOnly.length > 0 || discoveryOk || provider.detectedFrom === 'global' || Boolean(discovery)
    return h(
      'div',
      { className: 'vcg-set-provider' },
      h(
        'div',
        { className: 'vcg-set-provider-head' },
        h(
          'div',
          { className: 'vcg-row', style: { flexWrap: 'wrap' } },
          h('span', { className: 'vcg-set-provider-title' }, provider.label || provider.id),
          h(Badge, { color: 'var(--dsw-alias-brand-primary)' }, provider.kind || 'custom-http'),
          provider.detectedFrom ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('setDetectedBadge')) : null,
          h(
            Badge,
            { color: configured ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-state-warn-primary)' },
            configured ? t('setApiKeyConfigured') : t('setApiKeyMissing'),
          ),
        ),
        h(
          'div',
          { className: 'vcg-row' },
          h(
            Toggle,
            {
              checked: provider.enabled !== false,
              onChange: (value) => onChange({ enabled: value }),
              label: t('setEnableProvider'),
            },
          ),
          h(RemoveButton, { label: t('setRemoveProvider'), confirmLabel: t('setConfirmRemove'), onConfirm: onRemove }),
        ),
      ),
      h(
        'div',
        { className: 'vcg-set-grid2' },
        h(
          Field,
          { label: t('setProviderLabel') },
          h(TextInput, { value: provider.label, onChange: (value) => onChange({ label: value }) }),
        ),
        h(
          Field,
          { label: t('setProviderKind') },
          h(Select, {
            value: provider.kind,
            options: kindOptions(provider.kind),
            onChange: (value) => onChange({ kind: value }),
          }),
        ),
      ),
      h(
        Field,
        { label: t('setBaseUrl'), hint: provider.detectedFrom ? t('setDetectGlobalKey') : undefined },
        h(TextInput, {
          value: provider.baseUrl,
          placeholder: 'https://api.example.com/v1',
          onChange: (value) => onChange({ baseUrl: value }),
        }),
      ),
      h(
        Field,
        {
          label: h(
            'span',
            { className: 'vcg-row' },
            t('setApiKey'),
            h(Badge, null, configured ? t('setApiKeyConfigured') : t('setApiKeyMissing')),
          ),
          hint: t('setApiKeyHint'),
        },
        h(TextInput, {
          type: 'password',
          value: provider.apiKey,
          placeholder: configured ? t('setApiKeyKeepPh') : t('setApiKeyEmptyPh'),
          onChange: (value) => onChange({ apiKey: value }),
        }),
      ),
      h(
        'div',
        { className: 'vcg-set-grid3' },
        CAPS.map((cap) =>
          h(
            Field,
            { key: 'models-' + cap, label: capLabel(cap) + ' ' + t('setModels'), hint: t('setModelsHint') },
            h(TextInput, {
              value: provider.modelText[cap],
              placeholder: cap === 'image' ? 'wan2.7-image' : '',
              onChange: (value) => onModelText(cap, value),
            }),
          ),
        ),
      ),
      showAuto
        ? h(
            'div',
            { className: 'vcg-set-auto-models' },
            h(
              'div',
              { className: 'vcg-row', style: { flexWrap: 'wrap', justifyContent: 'space-between' } },
              h('span', { className: 'vcg-label' }, t('setAutoModels')),
              sourceLabel !== '' ? h(Badge, null, t('setDetectSource', { source: sourceLabel })) : null,
            ),
            autoRead.length > 0
              ? h('div', { className: 'vcg-set-model-list vcg-set-mono' }, autoRead.join(' · '))
              : h('div', { className: 'vcg-hint' }, t('setAutoModelsEmpty')),
            h('div', { className: 'vcg-hint' }, t('setAutoModelsHint')),
          )
        : null,
    )
  }

  function DetectPanel({ detect, detecting, error, onApply, onDetect }) {
    const data = detect || {}
    const candidates = asArray(data.candidates)
    const globalModels = data.globalModels && typeof data.globalModels === 'object' ? data.globalModels : {}
    const allModels = data.allModels && typeof data.allModels === 'object' ? data.allModels : {}
    const discoveredMap = data.discovered && typeof data.discovered === 'object' ? data.discovered : {}
    const [expanded, setExpanded] = React.useState({})
    const toggleAll = (id) =>
      setExpanded((previous) => ({ ...previous, [id]: !previous[id] }))
    return h(
      'div',
      { className: 'vcg-set-detect' },
      h(
        'div',
        { className: 'vcg-row', style: { justifyContent: 'space-between', flexWrap: 'wrap' } },
        h('div', { className: 'vcg-row' }, h(Glyph, { name: 'sparkles', size: 15 }), h('span', { className: 'vcg-set-detect-title' }, t('setDetectResult'))),
        h(
          'div',
          { className: 'vcg-row' },
          candidates.length > 0 ? h(Button, { size: 'sm', variant: 'primary', onClick: onApply }, t('setApplyDetected')) : null,
          h(Button, { size: 'sm', onClick: onDetect, disabled: detecting }, detecting ? t('setDetecting') : t('setDetect')),
        ),
      ),
      error ? h(Banner, { kind: 'error' }, error) : null,
      detecting ? h('div', { className: 'vcg-row' }, h(Spinner, { size: 14, label: t('setDetectingTip') })) : null,
      !detecting && !error && candidates.length === 0
        ? h('div', { className: 'vcg-subtitle' }, t('setDetectNone'))
        : null,
      candidates.length > 0
        ? h(
            'div',
            { className: 'vcg-col' },
            candidates.map((candidate, index) => {
              const candidateId = candidate && candidate.id ? String(candidate.id) : ''
              const discovered = candidateId !== '' ? discoveredMap[candidateId] : undefined
              const available = unique(
                asArray(candidateId !== '' ? allModels[candidateId] : [])
                  .concat(asArray(candidate && candidate.models && candidate.models.all))
                  .map(String),
              )
              const expandedNow = candidateId !== '' && Boolean(expanded[candidateId])
              const sourceLabel =
                discovered && discovered.ok
                  ? t('setDetectSourceModels')
                  : candidate && candidate.detectedFrom === 'global'
                    ? t('setDetectSourceHost')
                    : ''
              return h(
                'div',
                { key: candidateId || index, className: 'vcg-set-candidate' },
                h(
                  'div',
                  { className: 'vcg-row', style: { flexWrap: 'wrap' } },
                  h('span', { className: 'vcg-set-candidate-name' }, (candidate && (candidate.label || candidate.id)) || 'provider'),
                  h(Badge, null, (candidate && candidate.kind) || 'bailian-chat-image'),
                  candidate && candidate.detectedFrom === 'global'
                    ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('setDetectedBadge'))
                    : null,
                ),
                h(
                  'div',
                  { className: 'vcg-set-mono' },
                  (candidate && candidate.baseUrl) || '',
                  candidate && candidate.apiKeyRef ? ' · ' + candidate.apiKeyRef : '',
                ),
                candidate && candidate.models
                  ? h(
                      'div',
                      { className: 'vcg-row', style: { flexWrap: 'wrap' } },
                      CAPS.map((cap) => {
                        const list = asArray(candidate.models[cap])
                        return list.length
                          ? h(Badge, { key: cap }, capLabel(cap) + ' · ' + list.length)
                          : null
                      }),
                    )
                  : null,
                available.length > 0 || discovered
                  ? h(
                      'div',
                      { className: 'vcg-set-candidate-extra' },
                      h(
                        'div',
                        { className: 'vcg-row', style: { flexWrap: 'wrap' } },
                        available.length > 0
                          ? h(
                              'span',
                              { className: 'vcg-set-model-count' },
                              t('setAvailableModels', { count: available.length }),
                            )
                          : null,
                        discovered
                          ? h(
                              Badge,
                              {
                                color: discovered.ok
                                  ? 'var(--dsw-alias-state-success-primary)'
                                  : 'var(--dsw-alias-state-warn-primary)',
                              },
                              discovered.ok ? t('setDetectModelsOk', { count: discovered.count }) : t('setDetectModelsFail'),
                            )
                          : null,
                        sourceLabel !== '' ? h(Badge, null, t('setDetectSource', { source: sourceLabel })) : null,
                        available.length > 0 && candidateId !== ''
                          ? h(
                              Button,
                              { size: 'sm', variant: 'ghost', onClick: () => toggleAll(candidateId) },
                              expandedNow ? t('setModelsCollapse') : t('setModelsExpand'),
                            )
                          : null,
                      ),
                      expandedNow && available.length > 0
                        ? h('div', { className: 'vcg-set-model-list vcg-set-mono' }, available.join(' · '))
                        : null,
                    )
                  : null,
              )
            }),
          )
        : null,
      Object.keys(globalModels).length > 0
        ? h(
            'div',
            { className: 'vcg-set-global-models' },
            h('div', { className: 'vcg-label' }, t('setGlobalModels')),
            h(
              'div',
              { className: 'vcg-row', style: { flexWrap: 'wrap' } },
              CAPS.map((cap) => {
                const list = asArray(globalModels[cap])
                return list.length
                  ? h(Badge, { key: cap, color: V.consts.PORT_COLORS[cap === 'image' ? 'image' : cap === 'video' ? 'video' : 'text'] }, capLabel(cap) + '：' + list.join(' / '))
                  : null
              }),
              data.globalKey === true
                ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('setDetectGlobalKey'))
                : data.globalKey === false
                  ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('setDetectNoGlobalKey'))
                  : null,
            ),
          )
        : null,
    )
  }

  function TestResult({ test }) {
    if (!test) return null
    if (test.loading) return h('div', { className: 'vcg-row' }, h(Spinner, { size: 14, label: t('setTesting') }))
    if (test.ok) {
      // `test.models` is an object `{image,video,text,audio,all}`; flatten it so
      // every discovered model id is visible instead of silently empty (§14.3).
      const models = flattenModelIds(test.models)
      const shown = models.slice(0, 60)
      return h(
        Banner,
        { kind: 'success', title: t('setTestOk') },
        h(
          'div',
          { className: 'vcg-row', style: { flexWrap: 'wrap' } },
          test.latencyMs !== undefined ? h(Badge, null, t('setLatency') + ' ' + test.latencyMs + 'ms') : null,
          test.mode ? h(Badge, null, t('setTestMode') + ' ' + test.mode) : null,
          models.length ? h(Badge, null, t('setAvailableModels', { count: models.length })) : null,
        ),
        models.length
          ? h(
              'div',
              { className: 'vcg-set-model-list vcg-set-mono', style: { marginTop: 6 } },
              shown.join(' / ') + (models.length > shown.length ? ' … +' + (models.length - shown.length) : ''),
            )
          : null,
      )
    }
    return h(Banner, { kind: 'error', title: t('setTestFail') }, test.error || t('error'))
  }

  /* ------------------------------------------------------------- main page */

  function SettingsPage() {
    const store = V.useStore()
    const [form, setForm] = React.useState(null)
    const [baseline, setBaseline] = React.useState('')
    const [loadError, setLoadError] = React.useState('')
    const [pageError, setPageError] = React.useState('')
    const [okMsg, setOkMsg] = React.useState('')
    const [saving, setSaving] = React.useState(false)
    const [nodesData, setNodesData] = React.useState(null)
    const [nodesError, setNodesError] = React.useState('')
    const [detect, setDetect] = React.useState(null)
    const [detecting, setDetecting] = React.useState(false)
    const [detectError, setDetectError] = React.useState('')
    const [test, setTest] = React.useState(null)
    const [importText, setImportText] = React.useState('')
    const [importBusy, setImportBusy] = React.useState(false)
    const [importError, setImportError] = React.useState('')
    const [syncSource, setSyncSource] = React.useState('auto')
    const [syncing, setSyncing] = React.useState(false)
    const [syncResult, setSyncResult] = React.useState(null)
    const [syncError, setSyncError] = React.useState('')
    const okTimer = React.useRef(null)

    const showOk = (text) => {
      setOkMsg(text)
      if (okTimer.current) clearTimeout(okTimer.current)
      okTimer.current = setTimeout(() => setOkMsg(''), 4500)
    }

    React.useEffect(
      () => () => {
        if (okTimer.current) clearTimeout(okTimer.current)
      },
      [],
    )

    async function loadNodes() {
      try {
        const data = await V.rpc('listNodes')
        setNodesData(data)
        setNodesError('')
        return data
      } catch (error) {
        setNodesError(msgOf(error))
        return null
      }
    }

    React.useEffect(() => {
      let alive = true
      ;(async () => {
        try {
          const state = store.state || (await V.refresh())
          if (!alive) return
          const next = formFromState(state)
          setForm(next)
          setBaseline(serializeForm(next))
          setLoadError('')
        } catch (error) {
          if (alive) setLoadError(msgOf(error))
          return
        }
        if (alive) await loadNodes()
      })()
      return () => {
        alive = false
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const dirty = Boolean(form && baseline && serializeForm(form) !== baseline)

    function patchForm(updater) {
      setForm((previous) => (previous ? updater(previous) : previous))
    }

    function setRoot(key, value) {
      patchForm((previous) => ({ ...previous, [key]: value }))
    }

    function setDefaults(key, value) {
      patchForm((previous) => ({ ...previous, defaults: { ...previous.defaults, [key]: value } }))
    }

    function setLocal(key, value) {
      patchForm((previous) => ({ ...previous, local: { ...previous.local, [key]: value } }))
    }

    function setNodeRepo(key, value) {
      patchForm((previous) => ({ ...previous, nodeRepo: { ...previous.nodeRepo, [key]: value } }))
    }

    function updateProvider(index, patch) {
      patchForm((previous) => ({
        ...previous,
        providers: previous.providers.map((provider, itemIndex) =>
          itemIndex === index ? { ...provider, ...patch } : provider,
        ),
      }))
    }

    function updateProviderModelText(index, cap, text) {
      patchForm((previous) => ({
        ...previous,
        providers: previous.providers.map((provider, itemIndex) =>
          itemIndex === index
            ? { ...provider, modelText: { ...provider.modelText, [cap]: text } }
            : provider,
        ),
      }))
    }

    function addProvider() {
      patchForm((previous) => {
        const provider = {
          id: V.uid('prov'),
          label: '自定义 provider',
          kind: 'custom-http',
          baseUrl: '',
          apiKeyRef: '',
          apiKey: '',
          apiKeyConfigured: false,
          enabled: true,
          detectedFrom: 'custom',
          modelText: { image: '', video: '', text: '' },
          autoModels: [],
        }
        return { ...previous, providers: previous.providers.concat([provider]) }
      })
    }

    function removeProvider(index) {
      patchForm((previous) => {
        const providers = previous.providers.filter((provider, itemIndex) => itemIndex !== index)
        let defaults = previous.defaults
        if (!providers.some((provider) => provider.id === defaults.providerId)) {
          defaults = { ...defaults, providerId: defaultProviderId(providers) }
        }
        return { ...previous, providers, defaults }
      })
    }

    function chooseProvider(providerId) {
      patchForm((previous) => {
        const provider = previous.providers.find((item) => item.id === providerId)
        const defaults = { ...previous.defaults, providerId }
        if (provider) {
          for (const cap of CAPS) {
            const key = CAP_MODEL_KEYS[cap]
            const list = splitList(provider.modelText[cap])
            if (!defaults[key] || list.indexOf(defaults[key]) === -1) defaults[key] = list[0] || ''
          }
        }
        return { ...previous, defaults }
      })
    }

    function modelOptionsFor(cap) {
      if (!form) return [{ value: '', label: t('setNoneOption') }]
      const provider = form.providers.find((item) => item.id === form.defaults.providerId)
      const own = provider ? splitList(provider.modelText[cap]) : []
      const global = asArray(detect && detect.globalModels && detect.globalModels[cap])
      const current = form.defaults[CAP_MODEL_KEYS[cap]]
      const values = unique(own.concat(global).concat(current ? [current] : []))
      return [{ value: '', label: t('setNoneOption') }].concat(values.map((value) => ({ value, label: value })))
    }

    async function runDetect() {
      setDetecting(true)
      setDetectError('')
      try {
        const result = await V.rpc('detectProviders')
        setDetect(result || { candidates: [], globalModels: {} })
        // Refresh the read-only auto-read lists on provider cards with the
        // fresh `/models` catalog so a later save keeps them (§14.3).
        const allModels = result && result.allModels && typeof result.allModels === 'object' ? result.allModels : {}
        if (Object.keys(allModels).length > 0) {
          patchForm((previous) => ({
            ...previous,
            providers: previous.providers.map((provider) => {
              const next = asArray(allModels[provider.id]).map(String)
              return next.length > 0 ? { ...provider, autoModels: unique(next) } : provider
            }),
          }))
        }
      } catch (error) {
        setDetectError(msgOf(error))
      } finally {
        setDetecting(false)
      }
    }

    function applyDetected() {
      const candidates = asArray(detect && detect.candidates)
      if (candidates.length === 0) return
      patchForm((previous) => {
        const providers = previous.providers.slice()
        for (const candidate of candidates) {
          const mapped = providerFromCandidate(candidate)
          const detectedAll = asArray(detect && detect.allModels && detect.allModels[candidate.id]).map(String)
          if (detectedAll.length > 0) mapped.autoModels = unique(asArray(mapped.autoModels).concat(detectedAll))
          const existing = providers.findIndex(
            (provider) =>
              (candidate.id && provider.id === candidate.id) ||
              (!candidate.id && provider.kind === mapped.kind && provider.baseUrl === mapped.baseUrl),
          )
          if (existing >= 0) {
            providers[existing] = {
              ...providers[existing],
              ...mapped,
              apiKey: providers[existing].apiKey,
              apiKeyConfigured: providers[existing].apiKeyConfigured || mapped.apiKeyConfigured,
              autoModels: unique(asArray(providers[existing].autoModels).concat(asArray(mapped.autoModels))),
            }
          } else {
            providers.push(mapped)
          }
        }
        let defaults = { ...previous.defaults }
        if (!providers.some((provider) => provider.id === defaults.providerId)) {
          defaults.providerId = defaultProviderId(providers)
        }
        const active = providers.find((provider) => provider.id === defaults.providerId)
        if (active) {
          for (const cap of CAPS) {
            const key = CAP_MODEL_KEYS[cap]
            const list = splitList(active.modelText[cap])
            if (!defaults[key] || list.indexOf(defaults[key]) === -1) defaults[key] = list[0] || defaults[key] || ''
          }
        }
        return { ...previous, providers, defaults }
      })
      showOk(t('setApplyDetected'))
    }

    async function runTest() {
      const providerId = form && form.defaults.providerId
      if (!providerId) {
        setTest({ loading: false, ok: false, error: t('setTestNoProvider') })
        return
      }
      setTest({ loading: true, providerId })
      try {
        const result = await V.rpc('testProvider', { providerId })
        setTest({ loading: false, providerId, ...(result && typeof result === 'object' ? result : { ok: true }) })
      } catch (error) {
        setTest({ loading: false, providerId, ok: false, error: msgOf(error) })
      }
    }

    async function save() {
      if (!form) return
      setSaving(true)
      setPageError('')
      try {
        const result = await V.rpc('saveSettings', { patch: buildPatch(form) })
        const state = (result && result.state) || (await V.refresh())
        if (state) V.setStore({ state, loaded: true, loading: false, error: '' })
        const next = formFromState(state)
        setForm(next)
        setBaseline(serializeForm(next))
        showOk(t('setSaveOk'))
        await loadNodes()
      } catch (error) {
        setPageError(msgOf(error))
      } finally {
        setSaving(false)
      }
    }

    function resetForm() {
      const state = store.state
      const next = formFromState(state)
      setForm(next)
      setBaseline(serializeForm(next))
      setPageError('')
      showOk(t('setSavedState'))
    }

    async function runImport() {
      if (!form || !form.proMode) {
        setImportError(t('setImportNeedPro'))
        return
      }
      const json = importText.trim()
      if (json === '') {
        setImportError(t('setImportEmpty'))
        return
      }
      setImportBusy(true)
      setImportError('')
      try {
        const result = await V.rpc('importNode', { json })
        const node = result && result.node ? result.node : result
        setImportText('')
        showOk(t('setImportOk') + (node && node.id ? '：' + (node.nameZh || node.name || node.id) : ''))
        await loadNodes()
      } catch (error) {
        setImportError(msgOf(error))
      } finally {
        setImportBusy(false)
      }
    }

    async function removeCustomNode(id) {
      setPageError('')
      try {
        await V.rpc('removeNode', { id })
        showOk(t('delete') + '：' + id)
        await loadNodes()
      } catch (error) {
        setPageError(msgOf(error))
      }
    }

    async function syncRepo() {
      setSyncing(true)
      setSyncError('')
      try {
        const args = {}
        if (syncSource !== 'auto') args.source = syncSource
        const result = await V.rpc('syncNodeRepo', args)
        setSyncResult(result || {})
        const syncedAt = (result && result.syncedAt) || new Date().toISOString()
        setNodeRepo('lastSyncAt', syncedAt)
        setNodeRepo('source', (result && result.source) || syncSource || '')
        showOk(t('setSyncOk'))
        await loadNodes()
      } catch (error) {
        setSyncError(msgOf(error))
      } finally {
        setSyncing(false)
      }
    }

    /* ------------------------------------------------------------ render */

    const nodeInfo = (function () {
      const data = nodesData || {}
      const rawNodes = data.nodes
      const list = Array.isArray(rawNodes) ? rawNodes : []
      const total = Array.isArray(rawNodes) ? rawNodes.length : numOr(rawNodes, 0)
      const builtin = numOr(data.builtinCount, list.filter((node) => node && (node.builtin === true || node.source === 'builtin')).length)
      const customNodes = Array.isArray(data.customNodes) ? data.customNodes : list.filter(isCustomNode)
      const custom = numOr(data.customCount, customNodes.length)
      return { total, builtin, custom, customNodes }
    })()

    const syncNodes = syncResult ? (Array.isArray(syncResult.nodes) ? syncResult.nodes.length : numOr(syncResult.nodes, 0)) : 0
    const syncWorkflows = syncResult ? (Array.isArray(syncResult.workflows) ? syncResult.workflows.length : numOr(syncResult.workflows, 0)) : 0
    const syncWarnings = asArray(syncResult && syncResult.warnings)

    const header = h(
      'div',
      { className: 'vcg-set-header' },
      h('div', { className: 'vcg-set-header-mark' }, h(Glyph, { name: 'node', size: 20 })),
      h(
        'div',
        { style: { minWidth: 0 } },
        h('div', { className: 'vcg-title' }, t('setTitle')),
        h('div', { className: 'vcg-subtitle' }, t('setDesc')),
      ),
    )

    const statusBanner = form ? h(StatusBanner, { form, detect }) : null

    let body
    if (!form) {
      if (loadError) {
        body = h(
          Banner,
          {
            kind: 'error',
            title: t('setLoadFailed'),
            action: h(Button, { size: 'sm', onClick: () => window.location.reload() }, t('setReload')),
          },
          loadError,
        )
      } else {
        body = h('div', { className: 'vcg-set-loading' }, h(Spinner, { label: t('loading') }))
      }
    } else {
      const providerIndex = form.providers.findIndex((provider) => provider.id === form.defaults.providerId)
      body = h(
        'div',
        { className: 'vcg-set-stack' },
        statusBanner,

        /* ----------------------------------------------------- cloud api */
        h(
          Section,
          {
            title: t('setCloudApi'),
            extra: h(
              Button,
              { size: 'sm', onClick: runDetect, disabled: detecting, icon: 'sparkles' },
              detecting ? t('setDetecting') : t('setDetect'),
            ),
          },
          h('div', { className: 'vcg-hint' }, t('setCloudApiDesc')),
          h(DetectPanel, {
            detect,
            detecting,
            error: detectError,
            onApply: applyDetected,
            onDetect: runDetect,
          }),
          h(
            'div',
            { className: 'vcg-set-grid3' },
            h(
              Field,
              { label: t('setDefaultProvider') },
              h(Select, {
                value: form.defaults.providerId || '',
                options: [{ value: '', label: t('setNoProviderOption') }].concat(
                  form.providers.map((provider) => ({
                    value: provider.id,
                    label: (provider.enabled === false ? '⏸ ' : '') + (provider.label || provider.id),
                  })),
                ),
                onChange: chooseProvider,
              }),
            ),
            h(
              Field,
              { label: t('setDefaultImage') },
              h(Select, {
                value: form.defaults.imageModel || '',
                options: modelOptionsFor('image'),
                onChange: (value) => setDefaults('imageModel', value),
              }),
            ),
            h(
              Field,
              { label: t('setDefaultVideo') },
              h(Select, {
                value: form.defaults.videoModel || '',
                options: modelOptionsFor('video'),
                onChange: (value) => setDefaults('videoModel', value),
              }),
            ),
          ),
          h(
            'div',
            { className: 'vcg-row', style: { flexWrap: 'wrap' } },
            h(
              Field,
              { label: t('setDefaultText'), style: { flex: '1 1 220px' } },
              h(Select, {
                value: form.defaults.textModel || '',
                options: modelOptionsFor('text'),
                onChange: (value) => setDefaults('textModel', value),
              }),
            ),
            h(
              'div',
              { className: 'vcg-row', style: { alignSelf: 'flex-end' } },
              h(
                Button,
                { onClick: runTest, disabled: !form.defaults.providerId || (test && test.loading), icon: 'bolt' },
                test && test.loading ? t('setTesting') : t('setTestConn'),
              ),
            ),
          ),
          h(TestResult, { test }),
          h('div', { className: 'vcg-divider' }),
          h(
            'div',
            { className: 'vcg-row', style: { justifyContent: 'space-between', flexWrap: 'wrap' } },
            h(
              'div',
              null,
              h('div', { className: 'vcg-label' }, t('setProviders')),
              h('div', { className: 'vcg-hint' }, t('setProvidersDesc')),
            ),
            h(Button, { size: 'sm', onClick: addProvider, icon: 'plus' }, t('setAddProvider')),
          ),
          form.providers.length === 0
            ? h('div', { className: 'vcg-set-provider-empty' }, t('setProviderEmpty'))
            : h(
                'div',
                { className: 'vcg-col' },
                form.providers.map((provider, index) =>
                  h(ProviderCard, {
                    key: provider.id || index,
                    provider,
                    discoveredModels: (detect && detect.allModels && detect.allModels[provider.id]) || [],
                    discovery: (detect && detect.discovered && detect.discovered[provider.id]) || undefined,
                    onChange: (patch) => updateProvider(index, patch),
                    onModelText: (cap, text) => updateProviderModelText(index, cap, text),
                    onRemove: () => removeProvider(index),
                  }),
                ),
              ),
          h('div', { className: 'vcg-hint' }, t('setStorageKey')),
          providerIndex >= 0 && form.providers[providerIndex] && form.providers[providerIndex].enabled === false
            ? h(Banner, { kind: 'warn' }, t('setProviderDisabled'))
            : null,
        ),

        /* ------------------------------------------------------ local */
        h(
          Section,
          { title: t('setLocalSection'), extra: form.local.enabled ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('setLocalWarnTitle')) : null },
          h('div', { className: 'vcg-hint' }, t('setLocalSectionDesc')),
          h(Toggle, {
            checked: Boolean(form.local.enabled),
            onChange: (value) => setLocal('enabled', value),
            label: t('setLocalWarnTitle'),
            hint: form.local.enabled ? t('setLocalWarn') : t('setLocalOffHint'),
          }),
          form.local.enabled ? h(Banner, { kind: 'warn', title: t('setLocalWarnTitle') }, t('setLocalWarn')) : null,
          h(
            'div',
            { className: 'vcg-set-grid2' },
            h(
              Field,
              { label: t('setComfyUrl'), hint: t('setComfyUrlHint') },
              h(TextInput, {
                value: form.local.comfyuiUrl,
                placeholder: 'http://127.0.0.1:8188',
                onChange: (value) => setLocal('comfyuiUrl', value),
              }),
            ),
            h(
              Field,
              { label: t('setLocalTimeout'), hint: t('setLocalTimeoutHint') },
              h(NumberInput, {
                value: form.local.timeoutMs,
                min: 1000,
                max: 3600000,
                step: 1000,
                onChange: (value) => setLocal('timeoutMs', value === '' ? 600000 : value),
              }),
            ),
          ),
          form.local.enabled && String(form.local.comfyuiUrl || '').trim() === ''
            ? h(Banner, { kind: 'error', title: t('setLocalMissingTitle') }, t('setLocalMissing'))
            : null,
        ),

        /* --------------------------------------------------- pro mode */
        h(
          Section,
          {
            title: t('setProSection'),
            extra: form.proMode ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('setProToggle')) : null,
          },
          h('div', { className: 'vcg-hint' }, t('setProSectionDesc')),
          h(Toggle, {
            checked: Boolean(form.proMode),
            onChange: (value) => setRoot('proMode', value),
            label: t('setProToggle'),
          }),
          h(Banner, { kind: 'warn', title: t('setProWarnTitle') }, t('setProWarn')),
          form.proMode
            ? h(
                'div',
                { className: 'vcg-col' },
                h(
                  Field,
                  { label: t('setImportJson'), hint: t('setImportPlaceholder') },
                  h(TextArea, {
                    value: importText,
                    rows: 8,
                    monospace: true,
                    placeholder: t('setImportPlaceholder'),
                    onChange: setImportText,
                  }),
                ),
                h(
                  'div',
                  { className: 'vcg-row' },
                  h(
                    Button,
                    { variant: 'primary', onClick: runImport, disabled: importBusy || importText.trim() === '' },
                    importBusy ? t('setImporting') : t('setImportBtn'),
                  ),
                  h(Button, { onClick: () => { setImportText(''); setImportError('') }, disabled: importBusy }, t('cancel')),
                ),
                importError ? h(Banner, { kind: 'error' }, importError) : null,
              )
            : h(
                Banner,
                {
                  kind: 'info',
                  action: h(Button, { size: 'sm', onClick: () => setRoot('proMode', true) }, t('setProToggle')),
                },
                t('setProOffHint'),
              ),
          h('div', { className: 'vcg-divider' }),
          h(
            'div',
            { className: 'vcg-row', style: { justifyContent: 'space-between' } },
            h('div', { className: 'vcg-label' }, t('setCustomNodes')),
            h(
              'div',
              { className: 'vcg-row' },
              nodesError ? h(Badge, { color: 'var(--dsw-alias-state-error-primary)' }, nodesError) : null,
              h(Badge, null, t('setCustomCount') + ' ' + nodeInfo.custom),
            ),
          ),
          nodeInfo.customNodes.length === 0
            ? h('div', { className: 'vcg-set-provider-empty' }, t('setCustomNodesEmpty'))
            : h(
                'div',
                { className: 'vcg-col' },
                nodeInfo.customNodes.map((node) =>
                  h(
                    'div',
                    { key: node.id, className: 'vcg-set-node-row' },
                    h(
                      'div',
                      { style: { minWidth: 0 } },
                      h('div', { className: 'vcg-set-node-name' }, node.nameZh || node.name || node.id),
                      h(
                        'div',
                        { className: 'vcg-set-mono' },
                        node.id + ' · ' + (node.category || 'custom') + ' · ' + t('setNodeSource') + '：' + (node.source || 'imported'),
                      ),
                    ),
                    h(RemoveButton, {
                      label: t('remove'),
                      confirmLabel: t('setConfirmRemove'),
                      disabled: !form.proMode,
                      onConfirm: () => removeCustomNode(node.id),
                    }),
                  ),
                ),
              ),
        ),

        /* ------------------------------------------------ node repo */
        h(
          Section,
          {
            title: t('setNodeRepoSection'),
            extra: h(
              Button,
              { size: 'sm', onClick: syncRepo, disabled: syncing, icon: 'refresh' },
              syncing ? t('setSyncing') : t('setSyncNow'),
            ),
          },
          h('div', { className: 'vcg-hint' }, t('setNodeRepoSectionDesc')),
          h(
            'div',
            { className: 'vcg-set-grid2' },
            h(
              Field,
              { label: t('setGithubBase') },
              h(TextInput, {
                value: form.nodeRepo.githubBase,
                placeholder: 'https://raw.githubusercontent.com/<owner>/DSH_VCG_repo/main',
                onChange: (value) => setNodeRepo('githubBase', value),
              }),
            ),
            h(
              Field,
              { label: t('setGiteaBase') },
              h(TextInput, {
                value: form.nodeRepo.giteaBase,
                placeholder: 'https://gitea.com/<owner>/DSH_VCG_repo/raw/branch/main',
                onChange: (value) => setNodeRepo('giteaBase', value),
              }),
            ),
          ),
          h(
            Field,
            { label: t('setSyncSource') },
            h(Select, {
              value: syncSource,
              options: [
                { value: 'auto', label: t('setSyncAuto') },
                { value: 'github', label: t('setSyncGithub') },
                { value: 'gitea', label: t('setSyncGitea') },
              ],
              onChange: setSyncSource,
            }),
          ),
          h(
            'div',
            { className: 'vcg-set-status' },
            h(Stat, { label: t('setNodeTotal'), value: nodeInfo.total }),
            h(Stat, { label: t('setBuiltin'), value: nodeInfo.builtin }),
            h(Stat, { label: t('setCustomCount'), value: nodeInfo.custom }),
            h(Stat, { label: t('setLastSync'), value: form.nodeRepo.lastSyncAt ? V.formatTime(form.nodeRepo.lastSyncAt) : t('setNeverSynced') }),
          ),
          syncError ? h(Banner, { kind: 'error' }, syncError) : null,
          syncResult
            ? h(
                Banner,
                {
                  kind: syncWarnings.length ? 'warn' : 'success',
                  title: t('setSyncResult'),
                },
                h(
                  'div',
                  { className: 'vcg-row', style: { flexWrap: 'wrap' } },
                  h(Badge, null, t('setSyncNodes') + ' ' + syncNodes),
                  h(Badge, null, t('setSyncWorkflows') + ' ' + syncWorkflows),
                  syncResult.syncedAt ? h(Badge, null, t('setSyncAt') + ' ' + V.formatTime(syncResult.syncedAt)) : null,
                  syncResult.source ? h(Badge, null, String(syncResult.source)) : null,
                ),
                syncWarnings.length
                  ? h(
                      'div',
                      { className: 'vcg-col', style: { marginTop: 6 } },
                      syncWarnings.map((warning, index) => h('div', { key: index, className: 'vcg-set-mono' }, '· ' + String(warning))),
                    )
                  : null,
              )
            : null,
          nodesError ? h(Banner, { kind: 'error', title: t('setNodeLoadError') }, nodesError) : null,
        ),

        /* ------------------------------------------------------ output */
        h(
          Section,
          { title: t('setOutputSection') },
          h(
            Field,
            { label: t('setOutputDirName'), hint: t('setOutputDirHint') },
            h(TextInput, {
              value: form.outputDir,
              placeholder: 'vcg-output',
              onChange: (value) => setRoot('outputDir', value),
            }),
          ),
        ),
      )
    }

    const actionBar = form
      ? h(
          'div',
          { className: 'vcg-set-actions' },
          h(
            'div',
            { className: 'vcg-set-actions-info' },
            h(
              'span',
              { className: 'vcg-set-action-state ' + (dirty ? 'vcg-set-action-dirty' : '') },
              dirty ? t('setUnsaved') : t('setSavedState'),
            ),
          ),
          h(
            'div',
            { className: 'vcg-row' },
            h(Button, { onClick: resetForm, disabled: saving || !dirty }, t('setReset')),
            h(
              Button,
              {
                variant: 'primary',
                onClick: save,
                disabled: saving,
                icon: saving ? undefined : 'save',
              },
              saving ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('saving')) : t('save'),
            ),
          ),
        )
      : null

    return h(
      'div',
      { className: 'vcg-set-root vcg-scroll' },
      h(StyleTag),
      V.styleTag(CSS),
      h(
        'div',
        { className: 'vcg-set-page' },
        header,
        pageError ? h(Banner, { kind: 'error', title: t('error') }, pageError) : null,
        okMsg ? h(Banner, { kind: 'success' }, okMsg) : null,
        body,
        actionBar,
      ),
    )
  }

  /* ------------------------------------------------------------------ css */

  const CSS = `
.vcg-set-root{height:100%;overflow:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.vcg-set-root *{box-sizing:border-box}
.vcg-set-page{max-width:880px;margin:0 auto;padding:20px 24px 88px;display:flex;flex-direction:column;gap:14px}
.vcg-set-header{display:flex;align-items:flex-start;gap:12px}
.vcg-set-header-mark{width:38px;height:38px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;flex:none;color:#fff;background:linear-gradient(135deg,var(--dsw-alias-brand-primary),color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,var(--dsw-alias-bg-base)));box-shadow:0 2px 12px color-mix(in srgb,var(--dsw-alias-brand-primary) 30%,transparent)}
.vcg-set-stack{display:flex;flex-direction:column;gap:0;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.vcg-set-stack > .vcg-banner{margin:14px 14px 0}
.vcg-set-stack .vcg-section{padding:16px}
.vcg-set-status{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:8px}
.vcg-set-stat{min-width:0;background:color-mix(in srgb,var(--dsw-alias-bg-base) 45%,transparent);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:7px 9px}
.vcg-set-stat-label{font-size:11px;color:var(--dsw-alias-label-secondary)}
.vcg-set-stat-value{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-set-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.vcg-set-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.vcg-set-provider{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:12px;display:flex;flex-direction:column;gap:10px}
.vcg-set-provider-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.vcg-set-provider-title{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px}
.vcg-set-provider-empty{font-size:12px;color:var(--dsw-alias-label-secondary);padding:12px;border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;text-align:center}
.vcg-set-detect{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-2);padding:12px;display:flex;flex-direction:column;gap:10px}
.vcg-set-detect-title{font-size:13px;font-weight:600}
.vcg-set-candidate{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);padding:8px 10px;display:flex;flex-direction:column;gap:4px}
.vcg-set-candidate-name{font-weight:600;font-size:12.5px}
.vcg-set-global-models{display:flex;flex-direction:column;gap:5px;border-top:1px dashed var(--dsw-alias-border-l1);padding-top:8px}
.vcg-set-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:var(--dsw-alias-label-secondary);word-break:break-all}
.vcg-set-candidate-extra{display:flex;flex-direction:column;gap:5px;margin-top:2px}
.vcg-set-model-count{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.vcg-set-model-list{max-height:150px;overflow:auto;line-height:1.65;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:6px 8px}
.vcg-set-auto-models{display:flex;flex-direction:column;gap:5px;border:1px dashed var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 40%,transparent)}
.vcg-set-node-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);padding:8px 10px}
.vcg-set-node-name{font-size:12.5px;font-weight:600}
.vcg-set-actions{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;margin-top:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1));backdrop-filter:blur(8px);box-shadow:0 -4px 18px rgba(0,0,0,.08)}
.vcg-set-actions-info{font-size:12px;color:var(--dsw-alias-label-secondary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-set-action-dirty{color:var(--dsw-alias-state-warn-primary);font-weight:600}
.vcg-set-loading{display:flex;align-items:center;justify-content:center;padding:60px 0}
@media (max-width:720px){
  .vcg-set-page{padding:14px 12px 80px}
  .vcg-set-grid2,.vcg-set-grid3{grid-template-columns:minmax(0,1fr)}
  .vcg-set-provider-head{align-items:flex-start}
  .vcg-set-actions{flex-wrap:wrap}
}
`

  V.SettingsPage = SettingsPage
})(V)
