/* ============================================================================
 * VCG 视觉控制生成器 — 客户端核心（共享基础层）
 * Visual Control Generator — client core shared by every part.
 *
 * 只依赖浏览器 React（由模块工厂注入，见 build.mjs），不 import 任何
 * Harness Client 包；视觉全部使用宿主主题 token（--dsw-alias-*）。
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { React, h, Fragment } = V

  /* ------------------------------------------------------------- locales */

  const dicts = {
    zh: {
      appName: 'VCG 视觉控制生成器',
      shortName: 'VCG',
      save: '保存',
      saved: '已保存',
      cancel: '取消',
      close: '关闭',
      confirm: '确认',
      delete: '删除',
      create: '创建',
      add: '添加',
      remove: '移除',
      retry: '重试',
      refresh: '刷新',
      loading: '加载中…',
      empty: '暂无数据',
      error: '出错了',
      copy: '复制',
      copied: '已复制',
      open: '打开',
      back: '返回',
      apply: '应用',
      test: '测试',
      edit: '编辑',
      run: '运行',
      runAll: '运行全部',
      runNode: '运行此节点',
      stop: '停止',
      saving: '保存中…',
      working: '处理中…',
      notConfigured: '未配置',
      configured: '已配置',
      settings: '设置',
      workspace: '工作区',
      project: '项目',
      projects: '项目',
      output: '输出',
      outputs: '输出',
      workflow: '工作流',
      workflows: '工作流',
      canvas: '画布',
      engine: '引擎',
      cloud: '云端',
      local: '本地',
      both: '云端/本地',
      provider: '服务提供方',
      model: '模型',
      nodes: '节点',
      nodeLibrary: '节点库',
      aiBuilder: 'AI 自动组建工作流',
      generate: '生成',
      deleteConfirm: '确认删除？',
      view: '视图',
      chatView: '对话',
      canvasView: 'VCG 画布',
      outputDir: '输出目录',
      copyPath: '复制路径',
      openDir: '打开目录',
      noProvider: '尚未检测到可用的生图 API，请到「设置 → VCG 视觉控制生成器」配置。',
      /* §16 仓库分支 / 开发者模式 / 本地工具与模型 */
      cvDevMode: '开发者模式',
      cvDevModeHint: '允许查看并导入未审核分支（dev / bug / recheck）的节点与工作流；与专业模式相互独立。',
      cvDevModeUnsupported: '当前宿主版本不支持开发者模式，请更新插件后再试。',
      cvDevModeDangerTitle: '开启开发者模式？',
      cvDevModeDangerLead: '开发者模式会允许使用未经人工审核的仓库内容。',
      cvDevModeRisk1: '未审核节点可能包含执行任意代码或访问网络的逻辑',
      cvDevModeRisk2: '工作流可能声明不可信的模型下载地址，下载的权重可能被篡改',
      cvDevModeRisk3: '审计与人工审查尚未通过，内容随时可能变化',
      cvDevModeDangerTail: '仅在你信任仓库来源（GitHub / Gitea）时开启；关闭后立即回到 main 分支。',
      cvDevModeConfirm: '我已了解风险，开启',
      cvDevModeOn: '开发者模式已开启',
      cvDevModeOff: '开发者模式已关闭，已回到 main 分支',
      cvDevModeBadge: '开发者模式',
      cvDevModeEnabled: '已开启',
      cvDevModeOnlyMain: '开发者模式关闭时只能使用 main 分支',
      cvBranch: '仓库分支',
      cvBranchShort: '分支',
      cvBranchMain: 'main（已审核）',
      cvBranchHint: '切换分支会重新拉取节点仓库；非 main 分支的内容未经审核。',
      cvBranchChanged: '已切换到分支 {branch}',
      cvBranchFailed: '切换分支失败',
      cvBranchLocked: '开启开发者模式后才能切换到未审核分支',
      cvBranchUnavailable: '不可用',
      cvBranchUnreviewed: '未审核内容，可能不安全',
      cvBranchUnreviewedDesc: '当前节点仓库分支为 {branch}：其中节点与工作流尚未通过人工审核，请仅在你信任来源时使用。',
      cvBranchCurrent: '当前分支',
      cvUnreviewed: '未审核',
      cvUnreviewedFrom: '来源分支 {branch}（未审核）',
      cvUnreviewedNodeHint: '该节点来自未审核分支，开启开发者模式后才能导入。',
      cvLocalTools: '本地工具与模型',
      cvLocalToolsDesc: '本地 PyTorch / safetensors 与权重模型（专业模式）。插件安装时不会自动下载大文件。',
      cvLocalToolsProOnly: '开启专业模式后可查看本地工具与模型。',
      cvLocalProSaveFirst: '请先保存设置以启用专业模式，保存后即可检测/安装本地工具与模型。',
      cvLocalDetect: '检测环境',
      cvLocalDetecting: '检测中…',
      cvLocalInstallTorch: '安装 PyTorch',
      cvLocalInstallSafetensors: '安装 safetensors',
      cvLocalInstallAll: '一键安装',
      cvLocalInstallSizes: 'CPU 版 PyTorch 约 200 MB、safetensors 约 10 MB，安装通常需要 3–10 分钟。',
      cvLocalPython: 'Python',
      cvLocalPip: 'pip',
      cvLocalTorch: 'PyTorch',
      cvLocalSafetensors: 'safetensors',
      cvLocalCuda: 'CUDA',
      cvLocalDisk: '磁盘剩余',
      cvLocalModelsDir: '模型目录',
      cvLocalInstalled: '已安装',
      cvLocalMissing: '未安装',
      cvLocalInstalling: '安装中',
      cvLocalInstallingActive: '正在安装 {component}，完成后会自动刷新。',
      cvLocalProgress: '安装进度',
      cvLocalLog: '安装日志',
      cvLocalNotDetected: '尚未检测，请点击「检测环境」。',
      cvLocalDetectFailed: '检测失败',
      cvLocalInstallFailed: '安装失败',
      cvLocalInstallStarted: '已开始安装 {component}。',
      cvLocalStatusUnknown: '未知',
      cvModels: '模型下载',
      cvModelsDesc: '下载到本地模型目录的权重文件；未下载的模型可在节点参数中直接下载。',
      cvModelsRefresh: '刷新列表',
      cvModelsEmpty: '暂无已下载模型。',
      cvModelsName: '名称',
      cvModelsSize: '大小',
      cvModelsFormat: '格式',
      cvModelsUpdated: '更新时间',
      cvModelsDownload: '下载模型',
      cvModelsUrl: '模型 URL',
      cvModelsUrlPh: 'https://huggingface.co/.../model.safetensors',
      cvModelsFilename: '文件名',
      cvModelsFilenamePh: 'model.safetensors',
      cvModelsSha: 'sha256（可选）',
      cvModelsSizeBytes: '大小（字节，可选）',
      cvModelsFormatField: '格式',
      cvModelsTrustTitle: '来源检查',
      cvModelsTrusted: '可信来源',
      cvModelsUntrusted: '不可信来源',
      cvModelsUntrustedWarn: '下载地址 {host} 不在可信模型源清单中：文件可能被篡改或包含恶意内容。',
      cvModelsRisks: '继续下载前请确认来源可信，并在下载后核对 sha256。',
      cvModelsContinue: '我已确认风险，继续下载',
      cvModelsDownloading: '下载中…',
      cvModelsDownloadOk: '模型下载完成',
      cvModelsDownloadFailed: '模型下载失败',
      cvModelsNeedUrl: '请填写有效的 https 模型 URL。',
      cvModelsNeedFilename: '请填写文件名。',
      cvModelsDeclared: '节点声明模型',
      cvModelsDownloaded: '已下载',
      cvModelsNotDownloaded: '未下载模型',
      cvModelsPick: '选择已下载模型',
      cvModelsSettingsHint: '没有可用模型？到「设置 → 本地工具与模型」下载。',
      cvModelsHost: '来源主机',
      cvModelsLicense: '许可',
      cvModelsTrustCheck: '检查来源',
      cvModelsNoDeclared: '该节点未声明模型。',
      cvModelsDialogTitle: '下载模型',
    },
    en: {
      appName: 'VCG Visual Control Generator',
      shortName: 'VCG',
      save: 'Save',
      saved: 'Saved',
      cancel: 'Cancel',
      close: 'Close',
      confirm: 'Confirm',
      delete: 'Delete',
      create: 'Create',
      add: 'Add',
      remove: 'Remove',
      retry: 'Retry',
      refresh: 'Refresh',
      loading: 'Loading…',
      empty: 'Nothing here yet',
      error: 'Something went wrong',
      copy: 'Copy',
      copied: 'Copied',
      open: 'Open',
      back: 'Back',
      apply: 'Apply',
      test: 'Test',
      edit: 'Edit',
      run: 'Run',
      runAll: 'Run all',
      runNode: 'Run node',
      stop: 'Stop',
      saving: 'Saving…',
      working: 'Working…',
      notConfigured: 'Not configured',
      configured: 'Configured',
      settings: 'Settings',
      workspace: 'Workspace',
      project: 'Project',
      projects: 'Projects',
      output: 'Output',
      outputs: 'Outputs',
      workflow: 'Workflow',
      workflows: 'Workflows',
      canvas: 'Canvas',
      engine: 'Engine',
      cloud: 'Cloud',
      local: 'Local',
      both: 'Cloud/Local',
      provider: 'Provider',
      model: 'Model',
      nodes: 'Nodes',
      nodeLibrary: 'Node library',
      aiBuilder: 'AI workflow builder',
      generate: 'Generate',
      deleteConfirm: 'Delete this item?',
      view: 'View',
      chatView: 'Chat',
      canvasView: 'VCG Canvas',
      outputDir: 'Output folder',
      copyPath: 'Copy path',
      openDir: 'Open folder',
      noProvider: 'No image API detected yet. Configure one in Settings → VCG Visual Control Generator.',
      /* §16 repo branch / developer mode / local tools & models */
      cvDevMode: 'Developer mode',
      cvDevModeHint: 'Allows browsing and importing nodes/workflows from unreviewed branches (dev / bug / recheck). Independent from pro mode.',
      cvDevModeUnsupported: 'This host version does not support developer mode; update the plugin and retry.',
      cvDevModeDangerTitle: 'Enable developer mode?',
      cvDevModeDangerLead: 'Developer mode allows content that has not passed human review.',
      cvDevModeRisk1: 'Unreviewed nodes may contain logic that runs arbitrary code or accesses the network',
      cvDevModeRisk2: 'Workflows may declare untrusted model download URLs whose weights could be tampered with',
      cvDevModeRisk3: 'Audit and human review have not passed; content can change at any time',
      cvDevModeDangerTail: 'Only enable this if you trust the repository source (GitHub / Gitea). Disabling returns to the main branch immediately.',
      cvDevModeConfirm: 'I understand the risks, enable',
      cvDevModeOn: 'Developer mode enabled',
      cvDevModeOff: 'Developer mode disabled, back on the main branch',
      cvDevModeBadge: 'Developer mode',
      cvDevModeEnabled: 'On',
      cvDevModeOnlyMain: 'Only the main branch is available while developer mode is off',
      cvBranch: 'Repository branch',
      cvBranchShort: 'Branch',
      cvBranchMain: 'main (reviewed)',
      cvBranchHint: 'Switching branches re-fetches the node repository; non-main branches are not reviewed.',
      cvBranchChanged: 'Switched to branch {branch}',
      cvBranchFailed: 'Branch switch failed',
      cvBranchLocked: 'Enable developer mode before switching to an unreviewed branch',
      cvBranchUnavailable: 'unavailable',
      cvBranchUnreviewed: 'Unreviewed content, may be unsafe',
      cvBranchUnreviewedDesc: 'The node repository is on branch {branch}: its nodes and workflows have not passed human review. Only use them if you trust the source.',
      cvBranchCurrent: 'Current branch',
      cvUnreviewed: 'Unreviewed',
      cvUnreviewedFrom: 'Source branch {branch} (unreviewed)',
      cvUnreviewedNodeHint: 'This node comes from an unreviewed branch; enable developer mode to import it.',
      cvLocalTools: 'Local tools & models',
      cvLocalToolsDesc: 'Local PyTorch / safetensors and weight models (pro mode). The plugin never downloads large files during install.',
      cvLocalToolsProOnly: 'Enable pro mode to view local tools and models.',
      cvLocalProSaveFirst: 'Save settings to enable pro mode first; local tools and models become available right after.',
      cvLocalDetect: 'Detect environment',
      cvLocalDetecting: 'Detecting…',
      cvLocalInstallTorch: 'Install PyTorch',
      cvLocalInstallSafetensors: 'Install safetensors',
      cvLocalInstallAll: 'Install both',
      cvLocalInstallSizes: 'CPU PyTorch is ~200 MB and safetensors ~10 MB; installation usually takes 3–10 minutes.',
      cvLocalPython: 'Python',
      cvLocalPip: 'pip',
      cvLocalTorch: 'PyTorch',
      cvLocalSafetensors: 'safetensors',
      cvLocalCuda: 'CUDA',
      cvLocalDisk: 'Disk free',
      cvLocalModelsDir: 'Models folder',
      cvLocalInstalled: 'Installed',
      cvLocalMissing: 'Not installed',
      cvLocalInstalling: 'Installing',
      cvLocalInstallingActive: 'Installing {component}; the status refreshes automatically.',
      cvLocalProgress: 'Install progress',
      cvLocalLog: 'Install log',
      cvLocalNotDetected: 'Not detected yet — click "Detect environment".',
      cvLocalDetectFailed: 'Detection failed',
      cvLocalInstallFailed: 'Installation failed',
      cvLocalInstallStarted: 'Started installing {component}.',
      cvLocalStatusUnknown: 'Unknown',
      cvModels: 'Model downloads',
      cvModelsDesc: 'Weights downloaded into the local models folder; declared models can also be downloaded from node parameters.',
      cvModelsRefresh: 'Refresh list',
      cvModelsEmpty: 'No models downloaded yet.',
      cvModelsName: 'Name',
      cvModelsSize: 'Size',
      cvModelsFormat: 'Format',
      cvModelsUpdated: 'Updated',
      cvModelsDownload: 'Download model',
      cvModelsUrl: 'Model URL',
      cvModelsUrlPh: 'https://huggingface.co/.../model.safetensors',
      cvModelsFilename: 'File name',
      cvModelsFilenamePh: 'model.safetensors',
      cvModelsSha: 'sha256 (optional)',
      cvModelsSizeBytes: 'Size in bytes (optional)',
      cvModelsFormatField: 'Format',
      cvModelsTrustTitle: 'Source check',
      cvModelsTrusted: 'Trusted source',
      cvModelsUntrusted: 'Untrusted source',
      cvModelsUntrustedWarn: '{host} is not in the trusted model source list: the file may be tampered with or malicious.',
      cvModelsRisks: 'Only continue if you trust the source, and verify sha256 after downloading.',
      cvModelsContinue: 'I understand the risk, download anyway',
      cvModelsDownloading: 'Downloading…',
      cvModelsDownloadOk: 'Model downloaded',
      cvModelsDownloadFailed: 'Model download failed',
      cvModelsNeedUrl: 'Enter a valid https model URL.',
      cvModelsNeedFilename: 'Enter a file name.',
      cvModelsDeclared: 'Declared models',
      cvModelsDownloaded: 'Downloaded',
      cvModelsNotDownloaded: 'No model downloaded',
      cvModelsPick: 'Pick a downloaded model',
      cvModelsSettingsHint: 'No models available? Download them in Settings → Local tools & models.',
      cvModelsHost: 'Source host',
      cvModelsLicense: 'License',
      cvModelsTrustCheck: 'Check source',
      cvModelsNoDeclared: 'This node declares no models.',
      cvModelsDialogTitle: 'Download model',
    },
  }

  let t = (key) => key
  let boundLocale = 'zh'

  /** Register the locale service binding and dictionaries (called by apply.js). */
  V.bindLocale = function bindLocale(ctx) {
    const locale = ctx && ctx.locale
    if (!locale) return
    try {
      locale.register(V.NS, dicts)
      t = locale.bind(V.NS)
      const snap = locale.getSnapshot ? locale.getSnapshot() : locale.getLocale && locale.getLocale()
      boundLocale = (snap && (snap.id || snap.locale)) || 'zh'
    } catch (error) {
      console.warn('[vcg] locale binding failed', error)
    }
  }
  /** Merge additional dictionaries contributed by a part before apply runs. */
  V.addDict = function addDict(zh, en) {
    Object.assign(dicts.zh, zh || {})
    Object.assign(dicts.en, en || {})
  }
  V.t = (key, vars) => {
    let value
    try {
      value = t(key)
    } catch {
      value = key
    }
    if (typeof value !== 'string' || value === key) value = dicts.zh[key] || dicts.en[key] || key
    if (vars && typeof value === 'string') {
      for (const name of Object.keys(vars)) value = value.split('{' + name + '}').join(String(vars[name]))
    }
    return value
  }
  V.localeId = () => boundLocale

  /* ----------------------------------------------------------------- rpc */

  const RPC_URL = 'api/dsh-vcg/rpc'

  /** POST one Host RPC and unwrap `{ ok, value | error }`. */
  async function rpc(method, args) {
    let response
    try {
      response = await fetch(RPC_URL, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, args: args || {} }),
      })
    } catch (error) {
      throw new Error('无法连接 VCG 宿主服务：' + (error && error.message ? error.message : String(error)))
    }
    let body = null
    try {
      body = await response.json()
    } catch {
      body = null
    }
    if (!response.ok) throw new Error((body && body.error) || 'HTTP ' + response.status)
    if (!body || body.ok !== true) throw new Error((body && body.error) || 'VCG RPC 调用失败')
    return body.value
  }
  V.rpc = rpc

  /* --------------------------------------------------------------- store */

  const store = {
    state: null,
    loaded: false,
    loading: false,
    error: '',
    listeners: new Set(),
  }
  function emit() {
    for (const listener of Array.from(store.listeners)) {
      try {
        listener()
      } catch (error) {
        console.warn('[vcg] store listener failed', error)
      }
    }
  }
  /** Merge a shallow patch into the shared Host state snapshot. */
  V.setStore = function setStore(patch) {
    Object.assign(store, patch || {})
    emit()
  }
  /** Subscribe a React component to the shared store snapshot. */
  V.useStore = function useStore() {
    const [, force] = React.useState(0)
    React.useEffect(() => {
      const listener = () => force((n) => n + 1)
      store.listeners.add(listener)
      return () => store.listeners.delete(listener)
    }, [])
    return store
  }
  /** Reload the Host state snapshot. */
  V.refresh = async function refresh() {
    V.setStore({ loading: true, error: '' })
    try {
      const state = await rpc('state')
      V.setStore({ state, loaded: true, loading: false, error: '' })
      return state
    } catch (error) {
      V.setStore({ loading: false, error: vcgMessage(error) })
      throw error
    }
  }
  V.store = store

  /* -------------------------------------------------------------- helpers */

  let uidCounter = 0
  /** Stable-enough local identity for canvas nodes, edges and rows. */
  V.uid = function uid(prefix) {
    uidCounter += 1
    return String(prefix || 'id') + '_' + Date.now().toString(36) + '_' + uidCounter.toString(36)
  }
  V.clamp = (value, min, max) => Math.min(max, Math.max(min, value))
  /** Turn any thrown value into readable text. */
  function vcgMessage(error) {
    if (!error) return '未知错误'
    if (typeof error === 'string') return error
    if (error.message) return String(error.message)
    return String(error)
  }
  V.messageOf = vcgMessage
  V.downloadJSON = function downloadJSON(name, value) {
    try {
      const text = JSON.stringify(value, null, 2)
      const blob = new Blob([text], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = name.endsWith('.json') ? name : name + '.json'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      return true
    } catch {
      return false
    }
  }
  V.copyText = async function copyText(text) {
    const value = String(text == null ? '' : text)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value)
        return true
      }
    } catch {
      /* fall through to the textarea path */
    }
    try {
      const area = document.createElement('textarea')
      area.value = value
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      area.remove()
      return ok
    } catch {
      return false
    }
  }
  V.formatBytes = function formatBytes(bytes) {
    const n = Number(bytes || 0)
    if (!Number.isFinite(n) || n <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let index = 0
    let value = n
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024
      index += 1
    }
    return (value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)) + ' ' + units[index]
  }
  V.formatTime = function formatTime(input) {
    if (!input) return ''
    const date = new Date(input)
    if (Number.isNaN(date.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
  }
  /** Thousands-separated integer for token counters (§16.4). */
  V.formatCount = function formatCount(value) {
    const n = Number(value)
    if (!Number.isFinite(n)) return '0'
    const rounded = Math.round(n)
    try {
      return rounded.toLocaleString('zh-CN')
    } catch {
      return String(rounded)
    }
  }
  /** File name of a POSIX/Windows path. */
  V.basename = function basename(path) {
    const text = String(path || '')
    const parts = text.split(/[\\/]/)
    return parts[parts.length - 1] || text
  }
  /** Host of a URL (empty when unparsable). */
  V.hostOf = function hostOf(url) {
    try {
      return new URL(String(url || '')).host || ''
    } catch {
      return ''
    }
  }
  V.debounce = function debounce(fn, delay) {
    let timer = null
    return function debounced() {
      const args = arguments
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        fn.apply(null, args)
      }, delay)
    }
  }

  /* ------------------------------------------------ conversation view pref */

  const CONVERSATION_STORE_KEY = 'dsh.conversation'

  /** Read the Host-persisted preferred conversation view for one session. */
  V.readConversationView = function readConversationView(sessionId) {
    if (!sessionId || typeof localStorage === 'undefined') return null
    try {
      const raw = localStorage.getItem(CONVERSATION_STORE_KEY + '.' + sessionId)
      if (!raw) return null
      const stored = JSON.parse(raw)
      return stored && typeof stored === 'object' && typeof stored.view === 'string' ? stored.view : null
    } catch {
      return null
    }
  }
  /**
   * Persist the preferred conversation view before a session's slot store
   * materializes (used by "new VCG chat"). Merges the existing draft so a
   * prepared prompt is not lost.
   */
  V.setPreferredView = function setPreferredView(sessionId, viewId, focus) {
    if (!sessionId || typeof localStorage === 'undefined') return false
    const key = CONVERSATION_STORE_KEY + '.' + sessionId
    let stored = { draft: '', view: null, viewRequest: null }
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') stored = parsed
      }
    } catch {
      /* keep the empty template */
    }
    stored.view = viewId
    stored.viewRequest = focus ? { view: viewId, focus: String(focus) } : null
    if (stored.draft === undefined) stored.draft = ''
    try {
      localStorage.setItem(key, JSON.stringify(stored))
      return true
    } catch {
      return false
    }
  }

  /* --------------------------------------------------------- nav adapters */

  /** Filled by parts/apply.js from the Client services; always safe to call. */
  const nav = {
    openSession: (sessionId) => console.warn('[vcg] nav.openSession unavailable', sessionId),
    connectWorkspace: async () => null,
    openWorkspace: async () => {},
    startSession: () => {},
    setPreferredView: V.setPreferredView,
    readConversationView: V.readConversationView,
  }
  V.nav = nav
  V.setNav = function setNav(patch) {
    Object.assign(nav, patch || {})
  }

  /* ------------------------------------------------------------ constants */

  const PORT_COLORS = {
    model: '#c084fc',
    conditioning: '#fbbf24',
    latent: '#38bdf8',
    image: '#34d399',
    video: '#f472b6',
    text: '#93c5fd',
    number: '#fca5a5',
    any: '#94a3b8',
  }
  const PORT_LABELS = {
    model: 'MODEL',
    conditioning: 'COND',
    latent: 'LATENT',
    image: 'IMAGE',
    video: 'VIDEO',
    text: 'TEXT',
    number: 'NUMBER',
    any: 'ANY',
  }
  const NODE_CATEGORIES = [
    { id: 'input', label: '输入 / 提示词' },
    { id: 'model', label: '模型' },
    { id: 'latent', label: '潜空间 / 尺寸' },
    { id: 'sampling', label: '采样' },
    { id: 'decode', label: '解码 / 输出' },
    { id: 'video', label: '视频' },
    { id: 'utility', label: '工具 / 注释' },
    { id: 'custom', label: '自定义 API 节点' },
  ]
  V.consts = {
    PORT_COLORS,
    PORT_LABELS,
    NODE_CATEGORIES,
    ENGINE_LABELS: { cloud: '云端', local: '本地', both: '云端/本地' },
    ENGINE_COLORS: { cloud: '#7c5cff', local: '#f59e0b', both: '#22c55e' },
    STATUS_COLORS: { idle: '#94a3b8', running: '#38bdf8', done: '#34d399', error: '#f87171' },
    /* §16.2 节点仓库分支：main 已审核，其余为未审核分支 */
    REPO_BRANCHES: ['main', 'dev', 'bug', 'recheck'],
    /* §16.5 本地模型文件格式 */
    MODEL_FORMATS: ['safetensors', 'ckpt', 'pt', 'pth', 'bin', 'gguf'],
  }
  /** True when a node/workflow comes from an unreviewed repository branch (§16.2). */
  V.isUnreviewed = function isUnreviewed(item) {
    if (!item || typeof item !== 'object') return false
    const branch = item.repoBranch || item.branch
    if (typeof branch === 'string' && branch.trim() !== '' && branch.trim() !== 'main') return true
    return item.reviewState === 'unreviewed'
  }
  /** Read `devMode` / `nodeRepo.branch` defensively (host may lag a version). */
  V.readDevMode = function readDevMode(state) {
    return Boolean(state && state.devMode)
  }
  V.readRepoBranch = function readRepoBranch(state) {
    const nodeRepo = state && state.nodeRepo && typeof state.nodeRepo === 'object' ? state.nodeRepo : {}
    const branch = typeof nodeRepo.branch === 'string' ? nodeRepo.branch.trim() : ''
    return branch || 'main'
  }
  V.portColor = (type) => PORT_COLORS[type] || PORT_COLORS.any
  V.categoryLabel = (id) => {
    const found = NODE_CATEGORIES.find((category) => category.id === id)
    return found ? found.label : id
  }

  /* ---------------------------------------------------------- ui: styles */

  const CSS = `
.vcg-root{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;box-sizing:border-box}
.vcg-root *{box-sizing:border-box}
.vcg-scroll{overflow:auto;min-height:0;scrollbar-width:thin}
.vcg-scroll::-webkit-scrollbar{width:9px;height:9px}
.vcg-scroll::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:5px;border:2px solid transparent;background-clip:content-box}
.vcg-muted{color:var(--dsw-alias-label-secondary)}
.vcg-title{font-size:15px;font-weight:600}
.vcg-subtitle{font-size:12px;color:var(--dsw-alias-label-secondary)}
.vcg-divider{height:1px;background:var(--dsw-alias-border-l1);margin:10px 0}
.vcg-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 12px;font-size:13px;font-family:inherit;line-height:18px;cursor:pointer;white-space:nowrap;transition:background 120ms ease,border-color 120ms ease,opacity 120ms ease}
.vcg-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2)}
.vcg-btn:active:not(:disabled){transform:translateY(0.5px)}
.vcg-btn:disabled{opacity:.5;cursor:default}
.vcg-btn-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff}
.vcg-btn-primary:hover:not(:disabled){background:var(--dsw-alias-brand-primary);filter:brightness(1.08)}
.vcg-btn-ghost{background:transparent;border-color:transparent}
.vcg-btn-ghost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:transparent}
.vcg-btn-danger{color:var(--dsw-alias-state-error-primary)}
.vcg-btn-danger:hover:not(:disabled){border-color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent)}
.vcg-btn-sm{padding:3px 8px;font-size:12px;line-height:16px;border-radius:6px}
.vcg-btn-md{padding:7px 16px;font-size:13.5px;line-height:18px;border-radius:8px}
.vcg-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);border-radius:6px;cursor:pointer}
.vcg-iconbtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.vcg-input,.vcg-textarea,.vcg-select{width:100%;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 9px;font-size:13px;font-family:inherit;outline:none;transition:border-color 120ms ease}
.vcg-input:focus,.vcg-textarea:focus,.vcg-select:focus{border-color:var(--dsw-alias-brand-primary)}
.vcg-input::placeholder,.vcg-textarea::placeholder{color:var(--dsw-alias-label-secondary);opacity:.75}
.vcg-textarea{resize:vertical;min-height:64px;line-height:1.45}
.vcg-select{appearance:auto}
.vcg-field{display:flex;flex-direction:column;gap:4px;min-width:0}
.vcg-label{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.vcg-hint{font-size:11px;color:var(--dsw-alias-label-secondary);opacity:.9}
.vcg-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:10px}
.vcg-row{display:flex;align-items:center;gap:8px;min-width:0}
.vcg-col{display:flex;flex-direction:column;gap:8px;min-width:0}
.vcg-grid{display:grid;gap:10px}
.vcg-badge{display:inline-flex;align-items:center;gap:4px;padding:1px 7px;border-radius:999px;font-size:11px;line-height:16px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.vcg-chip{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:999px;font-size:12px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap}
.vcg-chip:hover{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.vcg-tabs{display:flex;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l1);padding:0 2px}
.vcg-tab{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-family:inherit;padding:7px 10px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.vcg-tab:hover{color:var(--dsw-alias-label-primary)}
.vcg-tab-active{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}
.vcg-banner{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);font-size:12px;line-height:1.5;background:var(--dsw-alias-bg-layer-1)}
.vcg-banner-info{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--dsw-alias-brand-primary) 7%,var(--dsw-alias-bg-layer-1))}
.vcg-banner-warn{border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 45%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 8%,var(--dsw-alias-bg-layer-1))}
.vcg-banner-error{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,var(--dsw-alias-bg-layer-1))}
.vcg-banner-success{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 45%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 8%,var(--dsw-alias-bg-layer-1))}
.vcg-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:36px 16px;text-align:center;color:var(--dsw-alias-label-secondary)}
.vcg-spinner{width:16px;height:16px;border-radius:50%;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);animation:vcg-spin .8s linear infinite;display:inline-block}
@keyframes vcg-spin{to{transform:rotate(360deg)}}
.vcg-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.42);display:flex;align-items:center;justify-content:center;z-index:70;padding:24px}
.vcg-modal{background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:0 18px 60px rgba(0,0,0,.35);width:min(720px,100%);max-height:min(80vh,720px);display:flex;flex-direction:column;overflow:hidden}
.vcg-modal-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.vcg-modal-body{padding:14px;overflow:auto;min-height:0}
.vcg-modal-foot{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:10px 14px;border-top:1px solid var(--dsw-alias-border-l1)}
.vcg-toggle{position:relative;display:inline-flex;align-items:center;gap:8px;cursor:pointer;user-select:none;font-size:13px}
.vcg-switch{width:34px;height:19px;border-radius:999px;background:var(--dsw-alias-border-l2);position:relative;transition:background 140ms ease;flex:none}
.vcg-switch::after{content:"";position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform 140ms ease}
.vcg-switch-on{background:var(--dsw-alias-brand-primary)}
.vcg-switch-on::after{transform:translateX(15px)}
.vcg-kbd{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;padding:0 4px;border-radius:4px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.vcg-section{display:flex;flex-direction:column;gap:10px;padding:14px}
.vcg-section + .vcg-section{border-top:1px solid var(--dsw-alias-border-l1)}
.vcg-section-title{font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;justify-content:space-between}
.vcg-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px;overflow:auto;max-height:260px;white-space:pre-wrap;word-break:break-all}
.vcg-img{display:block;max-width:100%;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2)}
.vcg-thumb{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);cursor:zoom-in}
.vcg-debug{display:flex;flex-direction:column;gap:10px;min-width:0}
.vcg-debug-summary{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.vcg-debug-group{display:flex;flex-direction:column;gap:5px}
.vcg-debug-group-title{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.vcg-debug-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.vcg-debug-item{display:flex;align-items:flex-start;gap:7px;padding:5px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);font-size:12px;line-height:1.45}
.vcg-model-modal{display:flex;flex-direction:column;gap:10px;min-width:0}
.vcg-model-kv{display:grid;grid-template-columns:104px minmax(0,1fr);gap:5px 10px;font-size:12px;align-items:start}
.vcg-model-kv-label{color:var(--dsw-alias-label-secondary)}
.vcg-model-kv-value{min-width:0;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px}
.vcg-model-trust{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.vcg-model-risk{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--dsw-alias-label-primary)}
`


  function StyleTag() {
    return h('style', { 'data-vcg': 'core', dangerouslySetInnerHTML: { __html: CSS } })
  }
  /** Render an inline `<style>` element; unmounting removes the rules. */
  V.styleTag = function styleTag(css) {
    return h('style', { 'data-vcg': 'part', dangerouslySetInnerHTML: { __html: String(css || '') } })
  }
  V.css = CSS
  V.StyleTag = StyleTag

  /* -------------------------------------------------------------- ui: glyph */

  const GLYPHS = {
    play: 'M7 4.5v15l13-7.5z',
    stop: 'M6 6h12v12H6z',
    save: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 15h8',
    plus: 'M12 5v14M5 12h14',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
    settings: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 15H4.5a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4.6V4.5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.1a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.3.8z',
    sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1 2.1.9-2.1.9L19 21l-.9-2.1-2.1-.9 2.1-.9z',
    image: 'M4 5h16v14H4zM4 15l5-5 4 4 2-2 5 5M9 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z',
    video: 'M4 6h11v12H4zM15 10l5-3v10l-5-3',
    cloud: 'M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6 9.5 3.5 3.5 0 0 0 7 18z',
    server: 'M4 4h16v6H4zM4 14h16v6H4zM7 7h.01M7 17h.01',
    refresh: 'M20 11a8 8 0 1 0-2.3 6.3M20 4v7h-7',
    chevron: 'M9 6l6 6-6 6',
    close: 'M6 6l12 12M18 6L6 18',
    folder: 'M3 6h6l2 2h10v11H3z',
    copy: 'M9 9h11v11H9zM4 15V4h11',
    check: 'M4 12.5l5 5L20 6.5',
    warning: 'M12 3l9.5 17h-19zM12 9v5M12 17.5h.01',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
    zoomin: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5M8 11h6M11 8v6',
    zoomout: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5M8 11h6',
    fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
    panel: 'M3 5h18v14H3zM9 5v14',
    node: 'M6 6h4v4H6zM14 14h4v4h-4zM10 8h4a2 2 0 0 1 2 2v4',
    external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
    download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
    upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
    dots: 'M6 12h.01M12 12h.01M18 12h.01',
    eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    edit: 'M4 20l4-1 11-11-3-3L5 16zM14 6l4 4',
    back: 'M10 6l-6 6 6 6M4 12h16',
    bolt: 'M13 3L5 14h6l-1 7 8-11h-6z',
    layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  }
  function Glyph({ name, size, className, style }) {
    const path = GLYPHS[name] || GLYPHS.node
    const filled = name === 'play' || name === 'stop'
    return h(
      'svg',
      {
        viewBox: '0 0 24 24',
        width: size || 16,
        height: size || 16,
        className: className,
        style: Object.assign({ display: 'block', flex: 'none' }, style || {}),
        fill: filled ? 'currentColor' : 'none',
        stroke: filled ? 'none' : 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      },
      h('path', { d: path }),
    )
  }

  /* ---------------------------------------------------------------- ui: kit */

  function Button({ variant, size, disabled, onClick, title, type, children, icon, style, className }) {
    const classes = ['vcg-btn']
    if (variant === 'primary') classes.push('vcg-btn-primary')
    else if (variant === 'danger') classes.push('vcg-btn-danger')
    else if (variant === 'ghost') classes.push('vcg-btn-ghost')
    if (size === 'sm') classes.push('vcg-btn-sm')
    else if (size === 'md') classes.push('vcg-btn-md')
    if (className) classes.push(className)
    return h(
      'button',
      {
        type: type || 'button',
        className: classes.join(' '),
        disabled: Boolean(disabled),
        onClick: onClick,
        title: title,
        style: style,
      },
      icon ? h(Glyph, { name: icon, size: 14 }) : null,
      children,
    )
  }

  function IconButton({ label, title, onClick, disabled, children, className }) {
    return h(
      'button',
      {
        type: 'button',
        className: 'vcg-iconbtn ' + (className || ''),
        title: title || label,
        'aria-label': label || title,
        onClick: onClick,
        disabled: Boolean(disabled),
      },
      children || h(Glyph, { name: 'dots', size: 15 }),
    )
  }

  function Field({ label, hint, children, style, action }) {
    return h(
      'div',
      { className: 'vcg-field', style: style },
      label
        ? h(
            'div',
            { className: 'vcg-row', style: { justifyContent: 'space-between' } },
            h('span', { className: 'vcg-label' }, label),
            action || null,
          )
        : null,
      children,
      hint ? h('div', { className: 'vcg-hint' }, hint) : null,
    )
  }

  function TextInput({ value, onChange, placeholder, disabled, type, onKeyDown, style, autoFocus, maxLength }) {
    return h('input', {
      className: 'vcg-input',
      type: type || 'text',
      value: value === undefined || value === null ? '' : value,
      placeholder: placeholder,
      disabled: Boolean(disabled),
      onChange: (event) => onChange && onChange(event.target.value, event),
      onKeyDown: onKeyDown,
      style: style,
      autoFocus: autoFocus,
      maxLength: maxLength,
    })
  }

  function TextArea({ value, onChange, placeholder, disabled, rows, style, onKeyDown, monospace }) {
    return h('textarea', {
      className: 'vcg-textarea',
      value: value === undefined || value === null ? '' : value,
      placeholder: placeholder,
      disabled: Boolean(disabled),
      rows: rows || 3,
      onChange: (event) => onChange && onChange(event.target.value, event),
      onKeyDown: onKeyDown,
      style: Object.assign({}, monospace ? { fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace' } : {}, style || {}),
    })
  }

  function NumberInput({ value, onChange, min, max, step, disabled, placeholder }) {
    return h('input', {
      className: 'vcg-input',
      type: 'number',
      value: value === undefined || value === null || value === '' ? '' : value,
      min: min,
      max: max,
      step: step === undefined ? 1 : step,
      disabled: Boolean(disabled),
      placeholder: placeholder,
      onChange: (event) => {
        const raw = event.target.value
        if (raw === '') return onChange && onChange('', event)
        const parsed = Number(raw)
        onChange && onChange(Number.isFinite(parsed) ? parsed : raw, event)
      },
    })
  }

  function Select({ value, onChange, options, disabled, style }) {
    const list = (options || []).map((option) => (typeof option === 'string' ? { value: option, label: option } : option))
    return h(
      'select',
      {
        className: 'vcg-select',
        value: value === undefined || value === null ? '' : value,
        disabled: Boolean(disabled),
        style: style,
        onChange: (event) => onChange && onChange(event.target.value, event),
      },
      list.map((option) =>
        h('option', { key: String(option.value), value: option.value }, option.label === undefined ? String(option.value) : option.label),
      ),
    )
  }

  function Toggle({ checked, onChange, label, disabled, hint }) {
    return h(
      'label',
      { className: 'vcg-toggle', style: disabled ? { opacity: 0.55, cursor: 'default' } : null },
      h('span', {
        className: 'vcg-switch ' + (checked ? 'vcg-switch-on' : ''),
        onClick: () => {
          if (!disabled) onChange && onChange(!checked)
        },
        role: 'switch',
        'aria-checked': Boolean(checked),
        tabIndex: disabled ? -1 : 0,
        onKeyDown: (event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            onChange && onChange(!checked)
          }
        },
      }),
      h('span', { className: 'vcg-col', style: { gap: 0 } }, h('span', null, label), hint ? h('span', { className: 'vcg-hint' }, hint) : null),
    )
  }

  function Tabs({ tabs, active, onChange, style }) {
    return h(
      'div',
      { className: 'vcg-tabs', style: style, role: 'tablist' },
      (tabs || []).map((tab) =>
        h(
          'button',
          {
            key: tab.id,
            type: 'button',
            role: 'tab',
            'aria-selected': tab.id === active,
            className: 'vcg-tab ' + (tab.id === active ? 'vcg-tab-active' : ''),
            onClick: () => onChange && onChange(tab.id),
          },
          tab.label,
        ),
      ),
    )
  }

  function Banner({ kind, title, children, style, action }) {
    const icons = { info: 'info', warn: 'warning', error: 'warning', success: 'check' }
    return h(
      'div',
      { className: 'vcg-banner vcg-banner-' + (kind || 'info'), style: style },
      h('span', { style: { marginTop: 1, color: kind === 'error' || kind === 'warn' ? 'var(--dsw-alias-state-warn-primary)' : 'var(--dsw-alias-brand-primary)' } }, h(Glyph, { name: icons[kind] || 'info', size: 14 })),
      h(
        'div',
        { className: 'vcg-col', style: { gap: 2, flex: 1, minWidth: 0 } },
        title ? h('div', { style: { fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, title) : null,
        children ? h('div', { style: { wordBreak: 'break-word' } }, children) : null,
      ),
      action || null,
    )
  }

  function Modal({ open, title, onClose, children, footer, width, className }) {
    const ref = React.useRef(null)
    React.useEffect(() => {
      if (!open) return undefined
      const onKey = (event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose && onClose()
        }
      }
      document.addEventListener('keydown', onKey)
      const timer = setTimeout(() => {
        const node = ref.current
        if (!node) return
        const focusable = node.querySelector('input,textarea,select,button:not([disabled])')
        if (focusable && typeof focusable.focus === 'function') focusable.focus()
      }, 30)
      return () => {
        document.removeEventListener('keydown', onKey)
        clearTimeout(timer)
      }
    }, [open, onClose])
    if (!open) return null
    return h(
      'div',
      {
        className: 'vcg-modal-backdrop',
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose && onClose()
        },
      },
      h(
        'div',
        { className: 'vcg-modal ' + (className || ''), style: width ? { width: width } : null, role: 'dialog', 'aria-modal': 'true', ref: ref },
        h(
          'div',
          { className: 'vcg-modal-head' },
          h('div', { className: 'vcg-title' }, title || ''),
          h(IconButton, { label: V.t('close'), onClick: onClose }, h(Glyph, { name: 'close', size: 15 })),
        ),
        h('div', { className: 'vcg-modal-body vcg-scroll' }, children),
        footer ? h('div', { className: 'vcg-modal-foot' }, footer) : null,
      ),
    )
  }

  function Empty({ title, hint, action, icon }) {
    return h(
      'div',
      { className: 'vcg-empty' },
      h('span', { style: { opacity: 0.5 } }, h(Glyph, { name: icon || 'grid', size: 26 })),
      h('div', { style: { fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-label-secondary)' } }, title || V.t('empty')),
      hint ? h('div', { style: { maxWidth: 420, fontSize: 12 } }, hint) : null,
      action || null,
    )
  }

  function Spinner({ size, label }) {
    return h(
      'span',
      { className: 'vcg-row', style: { gap: 6 }, role: 'status' },
      h('span', { className: 'vcg-spinner', style: size ? { width: size, height: size } : null }),
      label ? h('span', { className: 'vcg-subtitle' }, label) : null,
    )
  }

  function Badge({ children, color, style, title }) {
    return h(
      'span',
      { className: 'vcg-badge', style: Object.assign({}, color ? { color: color, borderColor: 'color-mix(in srgb,' + color + ' 45%,transparent)' } : {}, style || {}), title: title },
      children,
    )
  }

  function Section({ title, extra, children, style }) {
    return h(
      'section',
      { className: 'vcg-section', style: style },
      title
        ? h('div', { className: 'vcg-section-title' }, h('span', null, title), extra || null)
        : null,
      children,
    )
  }

  /* --------------------------------------------------- debug run report */

  const DEBUG_GROUP_LABELS = {
    schema: '结构完整性',
    graph: '连线与拓扑',
    params: '参数',
    engine: '运行引擎 / 模型加载',
    model: '模型加载',
    security: '安全性',
  }
  const DEBUG_LEVEL = {
    pass: { label: '通过', color: 'var(--dsw-alias-state-success-primary)', glyph: 'check' },
    warn: { label: '警告', color: 'var(--dsw-alias-state-warn-primary)', glyph: 'warning' },
    fail: { label: '失败', color: 'var(--dsw-alias-state-error-primary)', glyph: 'warning' },
  }

  /**
   * Render one Debug 运行 report (from Host debugWorkflow): grouped checks,
   * pass/warn/fail counts and the explanatory note.
   * @param {{report: object}} props
   */
  function DebugReport({ report }) {
    if (!report) return null
    const checks = Array.isArray(report.checks) ? report.checks : []
    const summary = report.summary || {}
    const groups = []
    const byGroup = new Map()
    for (const item of checks) {
      const group = item.group || 'schema'
      if (!byGroup.has(group)) {
        byGroup.set(group, [])
        groups.push(group)
      }
      byGroup.get(group).push(item)
    }
    const levelStyle = (level) => DEBUG_LEVEL[level] || DEBUG_LEVEL.warn
    return h(
      'div',
      { className: 'vcg-debug' },
      h(
        'div',
        { className: 'vcg-debug-summary' },
        h(Badge, { color: report.ok ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-state-error-primary)' }, report.ok ? 'Debug 通过' : 'Debug 未通过'),
        h(Badge, null, '通过 ' + (summary.passed || 0)),
        h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, '警告 ' + (summary.warned || 0)),
        h(Badge, { color: 'var(--dsw-alias-state-error-primary)' }, '失败 ' + (summary.failed || 0)),
        report.nodeCount !== undefined ? h(Badge, null, report.nodeCount + ' 节点 / ' + (report.edgeCount || 0) + ' 连线') : null,
        report.provider ? h(Badge, null, report.provider.label + ' · ' + (report.provider.model || '默认模型')) : null,
        h('span', { style: { flex: 1 } }),
        h('span', { className: 'vcg-subtitle' }, '用时 ' + (report.ms || 0) + 'ms'),
      ),
      report.note ? h('div', { className: 'vcg-hint', style: { marginBottom: 6 } }, report.note) : null,
      groups.length === 0
        ? h(Empty, { title: '没有检查项', hint: '该工作流为空或无法解析。' })
        : groups.map((group) =>
            h(
              'div',
              { key: group, className: 'vcg-debug-group' },
              h('div', { className: 'vcg-debug-group-title' }, DEBUG_GROUP_LABELS[group] || group),
              h(
                'ul',
                { className: 'vcg-debug-list' },
                byGroup.get(group).map((item, index) => {
                  const style = levelStyle(item.level)
                  return h(
                    'li',
                    { key: group + '-' + index, className: 'vcg-debug-item' },
                    h('span', { style: { color: style.color, display: 'inline-flex', marginTop: 1 } }, h(Glyph, { name: style.glyph, size: 13 })),
                    h(
                      'span',
                      { style: { flex: 1, minWidth: 0 } },
                      h('span', { style: { fontWeight: 600, marginRight: 6 } }, item.label),
                      item.detail ? h('span', { className: 'vcg-muted', style: { wordBreak: 'break-word' } }, String(item.detail)) : null,
                    ),
                    h('span', { className: 'vcg-badge', style: { color: style.color } }, style.label),
                  )
                }),
              ),
            ),
          ),
    )
  }

  /* ------------------------------------------- §16.5 model download modal */

  /**
   * 不可信模型源二次确认 + 下载弹窗（§16.5）。
   * props: { open, declaration, onClose, onDone }
   * declaration: { url, filename, sha256, size, format, name, license }
   */
  function ModelDownloadModal(props) {
    const { open, declaration } = props
    const [trust, setTrust] = React.useState(null)
    const [checking, setChecking] = React.useState(false)
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState('')
    const [done, setDone] = React.useState(false)
    /* §16.5 下载进度：宿主没有独立进度 RPC，复用 toolsStatus.download。 */
    const [progress, setProgress] = React.useState(null)
    const url = declaration ? String(declaration.url || '') : ''
    const decl = declaration || {}
    const filename = String(decl.filename || basenameOf(decl.url) || '')
    const host = (trust && trust.host) || hostOfUrl(url)

    React.useEffect(() => {
      if (!open || !url) return undefined
      let alive = true
      setTrust(null)
      setChecking(true)
      setError('')
      setDone(false)
      setBusy(false)
      V.rpc('modelsTrust', { url: url })
        .then((value) => {
          if (!alive) return
          setTrust(value && typeof value === 'object' ? value : {})
          setChecking(false)
        })
        .catch(() => {
          if (!alive) return
          // 宿主暂不支持时按「不可信」处理，仍允许确认后下载。
          setTrust({ trusted: false, host: hostOfUrl(url), unavailable: true })
          setChecking(false)
        })
      return () => {
        alive = false
      }
    }, [open, url])

    React.useEffect(() => {
      if (!busy) return undefined
      let alive = true
      const tick = () => {
        V.rpc('toolsStatus')
          .then((value) => {
            if (!alive) return
            const download = value && value.download && typeof value.download === 'object' ? value.download : null
            setProgress(download)
          })
          .catch(() => {})
      }
      tick()
      const timer = setInterval(tick, 1500)
      return () => {
        alive = false
        clearInterval(timer)
      }
    }, [busy])

    if (!open) return null

    const trusted = Boolean(trust && trust.trusted === true)

    async function download() {
      if (busy) return
      setBusy(true)
      setError('')
      try {
        const args = { url: url, confirmUntrusted: !trusted }
        if (filename) args.filename = filename
        if (decl.sha256) args.sha256 = decl.sha256
        if (decl.size !== undefined && decl.size !== null && decl.size !== '') args.size = decl.size
        if (decl.format) args.format = decl.format
        await V.rpc('modelsDownload', args)
        setDone(true)
        if (typeof props.onDone === 'function') props.onDone(Object.assign({ filename: filename }, decl))
      } catch (err) {
        setError(vcgMessage(err))
      } finally {
        setBusy(false)
      }
    }

    const kv = [
      decl.name ? h('div', { key: 'name', className: 'vcg-model-kv-label' }, t('cvModelsName')) : null,
      decl.name ? h('div', { key: 'name-v', className: 'vcg-model-kv-value' }, String(decl.name)) : null,
      h('div', { key: 'host', className: 'vcg-model-kv-label' }, t('cvModelsHost')),
      h('div', { key: 'host-v', className: 'vcg-model-kv-value' }, host || '—'),
      h('div', { key: 'file', className: 'vcg-model-kv-label' }, t('cvModelsFilename')),
      h('div', { key: 'file-v', className: 'vcg-model-kv-value' }, filename || '—'),
      decl.size !== undefined && decl.size !== null && decl.size !== ''
        ? h('div', { key: 'size', className: 'vcg-model-kv-label' }, t('cvModelsSize'))
        : null,
      decl.size !== undefined && decl.size !== null && decl.size !== ''
        ? h('div', { key: 'size-v', className: 'vcg-model-kv-value' }, V.formatBytes(decl.size))
        : null,
      decl.format ? h('div', { key: 'format', className: 'vcg-model-kv-label' }, t('cvModelsFormat')) : null,
      decl.format ? h('div', { key: 'format-v', className: 'vcg-model-kv-value' }, String(decl.format)) : null,
      decl.sha256 ? h('div', { key: 'sha', className: 'vcg-model-kv-label' }, 'sha256') : null,
      decl.sha256 ? h('div', { key: 'sha-v', className: 'vcg-model-kv-value' }, String(decl.sha256)) : null,
      decl.license ? h('div', { key: 'lic', className: 'vcg-model-kv-label' }, t('cvModelsLicense')) : null,
      decl.license ? h('div', { key: 'lic-v', className: 'vcg-model-kv-value' }, String(decl.license)) : null,
    ].filter(Boolean)

    const body = h(
      'div',
      { className: 'vcg-model-modal' },
      h('div', { className: 'vcg-model-kv' }, kv),
      h(
        'div',
        { className: 'vcg-model-trust' },
        checking
          ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('cvModelsTrustCheck') + '…')
          : trusted
            ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('cvModelsTrusted'))
            : h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('cvModelsUntrusted')),
      ),
      !checking && !trusted
        ? h(
            Banner,
            { kind: 'warn', title: t('cvModelsUntrustedWarn', { host: host || '—' }) },
            h('ul', { className: 'vcg-model-risk' }, h('li', null, t('cvModelsRisks')), h('li', null, t('cvDevModeRisk2'))),
          )
        : null,
      busy && progress
        ? h(
            'div',
            { className: 'vcg-hint' },
            t('cvModelsDownloading') +
              ' · ' +
              String(Number(progress.progress) || 0) +
              '%' +
              (Number(progress.total) > 0
                ? ' · ' + V.formatBytes(Number(progress.received) || 0) + ' / ' + V.formatBytes(Number(progress.total))
                : ''),
          )
        : null,
      error ? h(Banner, { kind: 'error', title: t('cvModelsDownloadFailed') }, error) : null,
      done ? h(Banner, { kind: 'success', title: t('cvModelsDownloadOk') }, filename) : null,
    )

    const footer = h(
      'div',
      { className: 'vcg-row', style: { marginLeft: 'auto' } },
      h(Button, { onClick: props.onClose, disabled: busy }, done ? t('close') : t('cancel')),
      done
        ? null
        : h(
            Button,
            { variant: 'primary', onClick: download, disabled: busy || checking || !url },
            busy ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('cvModelsDownloading')) : trusted ? t('cvModelsDownload') : t('cvModelsContinue'),
          ),
    )

    return h(
      Modal,
      { open: true, title: t('cvModelsDialogTitle'), onClose: busy ? undefined : props.onClose, width: 'min(620px,100%)', footer: footer },
      body,
    )
  }
  const basenameOf = (value) => V.basename(value)
  const hostOfUrl = (value) => V.hostOf(value)

  /* ------------------------------------------------------- async data hook */

  /**
   * Run an async loader on mount / dependency change and expose a reloader.
   * @param {(signal: AbortSignal) => Promise<any>} loader
   * @param {any[]} deps
   */
  V.useAsync = function useAsync(loader, deps) {
    const [data, setData] = React.useState(null)
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(true)
    const [tick, setTick] = React.useState(0)
    const loaderRef = React.useRef(loader)
    loaderRef.current = loader
    React.useEffect(() => {
      let alive = true
      const controller = new AbortController()
      setLoading(true)
      setError('')
      Promise.resolve()
        .then(() => loaderRef.current(controller.signal))
        .then((value) => {
          if (!alive) return
          setData(value)
          setLoading(false)
        })
        .catch((err) => {
          if (!alive) return
          if (err && err.name === 'AbortError') return
          setError(vcgMessage(err))
          setLoading(false)
        })
      return () => {
        alive = false
        controller.abort()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, (deps || []).concat([tick]))
    const reload = React.useCallback(() => setTick((n) => n + 1), [])
    return { data, error, loading, reload, setData }
  }

  /* ------------------------------------------------------------- ui export */

  V.ModelDownloadModal = ModelDownloadModal
  V.ui = {
    Button,
    IconButton,
    Field,
    TextInput,
    TextArea,
    NumberInput,
    Select,
    Toggle,
    Tabs,
    Banner,
    Modal,
    Empty,
    Spinner,
    Glyph,
    Badge,
    Section,
    StyleTag,
    DebugReport,
  }

  /* --------------------------------------------------------------- inject */

  // hard client dependencies; missing services keep the plugin inactive.
  V.inject = ['slots', 'locale']
})(V)
