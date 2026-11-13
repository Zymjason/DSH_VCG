/**
 * VCG 视觉控制生成器 — 浏览器半部分（由 build.mjs 从 parts/*.js 生成，勿手改）。
 * Visual Control Generator browser half, generated from parts/*.js.
 */
window.__ModuleLoader__.load({
  id: "@local/dsh-vcg",
  factory(require) {
    'use strict'
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement
    const Fragment = React.Fragment
    const V = { React, ReactDOM, h, Fragment, NS: 'vcg' };
/* ==== part: core.js ==== */
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

;
/* ==== part: canvas.js ==== */
;/* ============================================================================
 * VCG 视觉控制生成器 — 节点式工作流画布（V.Canvas）
 * Visual Control Generator — node graph canvas.
 *
 * 纯 React.createElement（V.h / V.React），不 import 任何 Harness Client 包；
 * 视觉全部走宿主主题 token（--dsw-alias-*）。所有画布结构变化都通过
 * props.onChange 回写受控 workflow；视口（viewport）在平移/缩放结束时回写。
 *
 * 交互：
 *  - 节点卡片拖动（pointer events + 直接 transform，结束才 onChange）
 *  - 输出端口拖线到输入端口（贝塞尔曲线、类型校验、占用替换）
 *  - 点击节点/连线选中，Delete/Backspace 删除；Shift+点击多选节点
 *  - 空白左键/中键/空格+左键平移；滚轮以指针为中心缩放 0.25~2.5；适应画布
 *  - 右侧面板无右键菜单（全区域 onContextMenu preventDefault）
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { React, h } = V
  const ui = V.ui || {}
  const { Button, IconButton, TextInput, TextArea, NumberInput, Select, Modal, Glyph } = ui
  const consts = V.consts || {}

  /* ------------------------------------------------------------ i18n bits */

  const zhExtra = {
    cvNodeLibrary: '节点库',
    cvSearchNodes: '搜索节点…',
    cvNoMatch: '没有匹配的节点',
    cvNoDefs: '还没有节点定义',
    cvNoDefsHint: '请到「设置 → VCG 视觉控制生成器 → 节点仓库」同步节点，或确认插件 nodes/ 目录内已有节点 JSON。',
    cvEmptyTitle: '画布是空的',
    cvEmptyHint: '从左侧节点库点击或拖入节点，开始搭建你的视觉生成工作流。',
    cvLibDragHint: '点击添加 · 拖入画布放置',
    cvPanHint: '空白拖动平移 · 滚轮缩放 · Delete 删除选中',
    cvFit: '适应画布（显示全部节点）',
    cvZoomIn: '放大',
    cvZoomOut: '缩小',
    cvZoomReset: '重置缩放为 100%',
    cvMinimap: '小地图',
    cvToggleLib: '展开 / 收起节点库',
    cvReadOnly: '只读',
    cvRenameHint: '双击重命名',
    cvRequiredInput: '必需的输入未连接',
    cvOptional: '可选',
    cvConnectHint: '拖到目标端口以连接',
    cvConnectRelease: '松开以连接',
    cvInvalidTarget: '类型不匹配或不可连接',
    cvResult: '结果',
    cvRunning: '运行中…',
    cvDone: '完成',
    cvFailed: '失败',
    cvPreview: '查看大图',
    cvOpen: '打开原图',
    cvCopyPath: '复制路径',
    cvNodes: '节点',
    cvEdges: '连线',
    cvEngineAuto: '自动',
    cvEngineHint: '全局引擎：自动 / 云端 / 本地（写入可切换节点的 engineOverride）',
    cvModelCustom: '自定义模型…',
    cvModelSelect: '从模型列表选择',
    cvModelFree: '手动输入模型',
    cvUnknownDef: '节点定义缺失',
    cvNoResult: '尚未运行',
    cvDefaultWorkflowName: '未命名工作流',
    cvDeleteNode: '删除节点',
    cvRunNodeShort: '运行此节点',
    cvNodeUnbound: '未加载节点定义',
    cvZoomLevel: '缩放',
    cvStatusIdle: '待运行',
    cvStatusRunning: '运行中',
    cvStatusDone: '已完成',
    cvStatusError: '出错',
    cvEngineOverride: '已覆盖引擎',
    cvReplaceEdge: '将替换该输入端口已有的连线',
    cvStartNode: '快速添加',
    cvResultEmpty: '完成（无图像输出）',
  }
  const enExtra = {
    cvNodeLibrary: 'Node library',
    cvSearchNodes: 'Search nodes…',
    cvNoMatch: 'No matching nodes',
    cvNoDefs: 'No node definitions yet',
    cvNoDefsHint: 'Sync the node repository in Settings → VCG Visual Control Generator, or make sure nodes/*.json ships with the plugin.',
    cvEmptyTitle: 'Empty canvas',
    cvEmptyHint: 'Click a node in the left library or drag it onto the canvas to start building.',
    cvLibDragHint: 'Click to add · drag onto canvas to place',
    cvPanHint: 'Drag empty space to pan · wheel to zoom · Delete removes selection',
    cvFit: 'Fit all nodes',
    cvZoomIn: 'Zoom in',
    cvZoomOut: 'Zoom out',
    cvZoomReset: 'Reset zoom to 100%',
    cvMinimap: 'Minimap',
    cvToggleLib: 'Toggle node library',
    cvReadOnly: 'Read-only',
    cvRenameHint: 'Double-click to rename',
    cvRequiredInput: 'Required input not connected',
    cvOptional: 'optional',
    cvConnectHint: 'Drop on a compatible port to connect',
    cvConnectRelease: 'Release to connect',
    cvInvalidTarget: 'Incompatible ports',
    cvResult: 'Result',
    cvRunning: 'Running…',
    cvDone: 'Done',
    cvFailed: 'Failed',
    cvPreview: 'Preview image',
    cvOpen: 'Open original',
    cvCopyPath: 'Copy path',
    cvNodes: 'nodes',
    cvEdges: 'links',
    cvEngineAuto: 'Auto',
    cvEngineHint: 'Global engine: Auto / Cloud / Local (writes engineOverride on switchable nodes)',
    cvModelCustom: 'Custom model…',
    cvModelSelect: 'Pick from model list',
    cvModelFree: 'Type a model id',
    cvUnknownDef: 'Node definition missing',
    cvNoResult: 'Not run yet',
    cvDefaultWorkflowName: 'Untitled workflow',
    cvDeleteNode: 'Delete node',
    cvRunNodeShort: 'Run this node',
    cvNodeUnbound: 'No node definitions loaded',
    cvZoomLevel: 'Zoom',
    cvStatusIdle: 'Idle',
    cvStatusRunning: 'Running',
    cvStatusDone: 'Done',
    cvStatusError: 'Error',
    cvEngineOverride: 'Engine overridden',
    cvReplaceEdge: 'Replaces the edge already on this input',
    cvStartNode: 'Quick add',
    cvResultEmpty: 'Done (no image output)',
  }
  if (typeof V.addDict === 'function') V.addDict(zhExtra, enExtra)

  function t(key, vars) {
    if (typeof V.t === 'function') return V.t(key, vars)
    return (zhExtra && zhExtra[key]) || key
  }

  /* --------------------------------------------------------------- limits */

  const MIN_SCALE = 0.25
  const MAX_SCALE = 2.5
  const NODE_HEADER_H = 36
  const NODE_PORT_PAD = 4
  const NODE_PORT_ROW = 22
  const NODE_DEFAULT_WIDTH = 252
  const NODE_MIN_WIDTH = 200
  const NODE_MAX_WIDTH = 360
  const EDGE_HALF = 12000
  const EDGE_SIZE = EDGE_HALF * 2
  const MINI_W = 186
  const MINI_H = 120
  const EMPTY_OBJECT = {}

  const RAF =
    typeof requestAnimationFrame === 'function'
      ? function raf(fn) {
          return requestAnimationFrame(fn)
        }
      : function rafFallback(fn) {
          return setTimeout(fn, 16)
        }
  const CAF =
    typeof cancelAnimationFrame === 'function'
      ? function caf(id) {
          cancelAnimationFrame(id)
        }
      : function cafFallback(id) {
          clearTimeout(id)
        }

  /* ------------------------------------------------------ pure helpers API */

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value))
  }
  function clampScale(scale) {
    if (typeof scale !== 'number' || !Number.isFinite(scale)) return 1
    return clampNumber(scale, MIN_SCALE, MAX_SCALE)
  }
  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value)
  }
  function portColor(type) {
    if (typeof V.portColor === 'function') return V.portColor(type)
    const colors = consts.PORT_COLORS || {}
    return colors[type] || colors.any || '#94a3b8'
  }
  function nodeWidth(def) {
    const raw = def && def.ui && Number(def.ui.width)
    if (Number.isFinite(raw) && raw > 0) return clampNumber(raw, NODE_MIN_WIDTH, NODE_MAX_WIDTH)
    return NODE_DEFAULT_WIDTH
  }
  function portRowOffset(index) {
    const i = isFiniteNumber(index) && index > 0 ? Math.floor(index) : 0
    return NODE_HEADER_H + NODE_PORT_PAD + i * NODE_PORT_ROW + NODE_PORT_ROW / 2
  }
  function estimateNodeHeight(def) {
    const inputs = def && Array.isArray(def.inputs) ? def.inputs.length : 0
    const outputs = def && Array.isArray(def.outputs) ? def.outputs.length : 0
    const params = def && Array.isArray(def.params) ? def.params.length : 0
    const rows = Math.max(inputs, outputs)
    return NODE_HEADER_H + NODE_PORT_PAD * 2 + rows * NODE_PORT_ROW + params * 34 + 11
  }
  /** Screen (container-relative) point → world (workflow) coordinates. */
  function canvasToWorld(point, viewport) {
    const vp = viewport || { x: 0, y: 0, scale: 1 }
    const scale = clampScale(vp.scale)
    return {
      x: (Number(point && point.x) - (isFiniteNumber(vp.x) ? vp.x : 0)) / scale,
      y: (Number(point && point.y) - (isFiniteNumber(vp.y) ? vp.y : 0)) / scale,
    }
  }
  /** World (workflow) coordinates → screen (container-relative) point. */
  function worldToCanvas(point, viewport) {
    const vp = viewport || { x: 0, y: 0, scale: 1 }
    const scale = clampScale(vp.scale)
    return {
      x: (Number(point && point.x) || 0) * scale + (isFiniteNumber(vp.x) ? vp.x : 0),
      y: (Number(point && point.y) || 0) * scale + (isFiniteNumber(vp.y) ? vp.y : 0),
    }
  }
  /**
   * Port type compatibility (CONTRACT §11.2):
   * same type, either side "any", or text → conditioning.
   */
  function canConnect(from, to) {
    const a = typeof from === 'string' ? from : from && from.type
    const b = typeof to === 'string' ? to : to && to.type
    if (!a || !b) return false
    if (a === b) return true
    if (a === 'any' || b === 'any') return true
    if (a === 'text' && b === 'conditioning') return true
    return false
  }
  /** Validate one directed connection (output port → input port). */
  function validateConnection(from, to) {
    if (!from || !to) return { ok: false, reason: 'missing' }
    if (from.dir && from.dir !== 'out') return { ok: false, reason: 'direction' }
    if (to.dir && to.dir !== 'in') return { ok: false, reason: 'direction' }
    if (from.node === to.node) return { ok: false, reason: 'self' }
    if (!canConnect(from.type, to.type)) return { ok: false, reason: 'type' }
    return { ok: true }
  }
  function findEdge(edges, toNode, toPort) {
    if (!Array.isArray(edges)) return null
    for (const edge of edges) {
      if (!edge || !edge.to) continue
      if (edge.to.node === toNode && edge.to.port === toPort) return edge
    }
    return null
  }
  function findEdgeById(edges, id) {
    if (!Array.isArray(edges) || id == null) return null
    for (const edge of edges) if (edge && edge.id === id) return edge
    return null
  }
  function nextNodeId(nodes) {
    let max = 0
    for (const node of Array.isArray(nodes) ? nodes : []) {
      if (!node || typeof node.id !== 'string') continue
      const match = /^n(\d+)$/.exec(node.id)
      if (match) max = Math.max(max, Number(match[1]))
    }
    return 'n' + (max + 1)
  }
  function nextEdgeId(edges) {
    const used = new Set()
    let max = 0
    for (const edge of Array.isArray(edges) ? edges : []) {
      if (!edge || typeof edge.id !== 'string') continue
      used.add(edge.id)
      const match = /^e(\d+)$/.exec(edge.id)
      if (match) max = Math.max(max, Number(match[1]))
    }
    let id = 'e' + (max + 1)
    let guard = 0
    while (used.has(id) && guard < 10000) {
      guard += 1
      max += 1
      id = 'e' + (max + 1)
    }
    return id
  }
  function portPosition(node, def, dir, portId) {
    const nodeX = isFiniteNumber(node && node.x) ? node.x : 0
    const nodeY = isFiniteNumber(node && node.y) ? node.y : 0
    const list = def ? (dir === 'in' ? def.inputs : def.outputs) : null
    let index = Array.isArray(list) ? list.findIndex((port) => port && port.id === portId) : -1
    if (index < 0) index = 0
    return {
      x: nodeX + (dir === 'in' ? 0 : nodeWidth(def)),
      y: nodeY + portRowOffset(index),
    }
  }
  function edgePath(from, to) {
    const fromX = Number(from && from.x) || 0
    const fromY = Number(from && from.y) || 0
    const toX = Number(to && to.x) || 0
    const toY = Number(to && to.y) || 0
    const offset = Math.max(38, Math.abs(toX - fromX) * 0.5)
    const round = (n) => Math.round(n * 100) / 100
    return (
      'M ' +
      round(fromX) +
      ' ' +
      round(fromY) +
      ' C ' +
      round(fromX + offset) +
      ' ' +
      round(fromY) +
      ', ' +
      round(toX - offset) +
      ' ' +
      round(toY) +
      ', ' +
      round(toX) +
      ' ' +
      round(toY)
    )
  }
  function nodesBounds(nodes, defsById, measured) {
    const list = Array.isArray(nodes) ? nodes : []
    if (!list.length) return null
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const node of list) {
      if (!node) continue
      const def = defsById ? defsById[node.type] : null
      const size = measured && measured[node.id] ? measured[node.id] : null
      const width = size && isFiniteNumber(size.w) ? size.w : nodeWidth(def)
      const height = size && isFiniteNumber(size.h) ? size.h : estimateNodeHeight(def)
      const x = isFiniteNumber(node.x) ? node.x : 0
      const y = isFiniteNumber(node.y) ? node.y : 0
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + width)
      maxY = Math.max(maxY, y + height)
    }
    if (!Number.isFinite(minX)) return null
    return { minX, minY, maxX, maxY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) }
  }
  function fitView(nodes, defsById, size, padding, measured) {
    const bounds = nodesBounds(nodes, defsById, measured)
    if (!bounds) return { x: 0, y: 0, scale: 1 }
    const width = Math.max(1, Number(size && size.width) || 800)
    const height = Math.max(1, Number(size && size.height) || 600)
    const pad = isFiniteNumber(padding) ? padding : 48
    const availW = Math.max(40, width - pad * 2)
    const availH = Math.max(40, height - pad * 2)
    const scale = clampScale(Math.min(availW / bounds.width, availH / bounds.height, 1.35))
    return {
      x: (width - bounds.width * scale) / 2 - bounds.minX * scale,
      y: (height - bounds.height * scale) / 2 - bounds.minY * scale,
      scale,
    }
  }
  function resolveViewport(viewport) {
    const vp = viewport && typeof viewport === 'object' ? viewport : {}
    return {
      x: isFiniteNumber(vp.x) ? vp.x : 0,
      y: isFiniteNumber(vp.y) ? vp.y : 0,
      scale: clampScale(vp.scale),
    }
  }
  function viewportsEqual(a, b) {
    if (!a || !b) return false
    return Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01 && Math.abs(a.scale - b.scale) < 0.0001
  }
  function formatMs(ms) {
    const value = Number(ms)
    if (!Number.isFinite(value) || value <= 0) return ''
    if (value < 1000) return Math.round(value) + 'ms'
    const seconds = value / 1000
    if (seconds < 60) return (seconds >= 10 ? Math.round(seconds) : seconds.toFixed(1)) + 's'
    const minutes = Math.floor(seconds / 60)
    return minutes + 'm' + Math.round(seconds % 60) + 's'
  }
  function collectModelOptions(state) {
    const out = []
    const push = (value) => {
      if (value && typeof value === 'string' && out.indexOf(value) < 0) out.push(value)
    }
    if (!state || typeof state !== 'object') return out
    const defaults = state.defaults || {}
    push(defaults.imageModel)
    push(defaults.videoModel)
    push(defaults.textModel)
    const providers = Array.isArray(state.providers) ? state.providers : []
    for (const provider of providers) {
      if (!provider || !provider.models || typeof provider.models !== 'object') continue
      for (const key of Object.keys(provider.models)) {
        const models = provider.models[key]
        if (Array.isArray(models)) for (const model of models) push(model)
      }
    }
    return out
  }

  /* --------------------------------------------------------- expose utils */

  V.CanvasUtils = {
    MIN_SCALE,
    MAX_SCALE,
    NODE_HEADER_H,
    NODE_PORT_ROW,
    NODE_PORT_PAD,
    canvasToWorld,
    worldToCanvas,
    clampScale,
    canConnect,
    validateConnection,
    findEdge,
    findEdgeById,
    nextNodeId,
    nextEdgeId,
    nodeWidth,
    estimateNodeHeight,
    portRowOffset,
    portPosition,
    edgePath,
    nodesBounds,
    fitView,
    resolveViewport,
    viewportsEqual,
    formatMs,
    collectModelOptions,
  }

  /* ----------------------------------------------------------------- style */

  const CSS = `
.vcg-cv-root{position:relative;display:flex;flex:1;width:100%;height:100%;min-height:0;min-width:0;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.45;border-radius:10px}
.vcg-cv-root *{box-sizing:border-box}
.vcg-cv-root ::-webkit-scrollbar{width:8px;height:8px}
.vcg-cv-root ::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:4px}

/* ------------------------------------------------------------- left library */
.vcg-cv-lib{width:232px;flex:none;display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.vcg-cv-lib-head{display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;color:var(--dsw-alias-label-secondary)}
.vcg-cv-lib-title{flex:1;font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-lib-count{font-size:10.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:0 6px;line-height:16px;flex:none}
.vcg-cv-lib-search{padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}
.vcg-cv-search{padding:4px 8px;font-size:12px;height:28px;border-radius:7px}
.vcg-cv-lib-list{flex:1;overflow:auto;min-height:0;padding:4px 8px 16px}
.vcg-cv-lib-hint{font-size:10.5px;color:var(--dsw-alias-label-secondary);padding:4px 4px 2px;opacity:.9}
.vcg-cv-lib-group{margin-top:6px}
.vcg-cv-lib-group-title{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);padding:4px 4px 3px;opacity:.9}
.vcg-cv-lib-item{display:flex;align-items:center;gap:7px;width:100%;text-align:left;padding:6px 7px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;cursor:grab;transition:background 100ms ease,border-color 100ms ease}
.vcg-cv-lib-item:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1)}
.vcg-cv-lib-item:active{cursor:grabbing}
.vcg-cv-lib-item:disabled{opacity:.5;cursor:not-allowed}
.vcg-cv-lib-accent{width:3px;height:24px;border-radius:2px;flex:none;background:var(--dsw-alias-brand-primary)}
.vcg-cv-lib-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.vcg-cv-lib-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-lib-sub{font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-lib-plus{flex:none;color:var(--dsw-alias-brand-primary);opacity:0;transition:opacity 100ms ease;display:inline-flex}
.vcg-cv-lib-item:hover .vcg-cv-lib-plus{opacity:1}
.vcg-cv-lib-empty{padding:22px 14px;text-align:center;font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.6}
.vcg-cv-lib-empty-small{padding:14px 8px;font-size:11.5px;color:var(--dsw-alias-label-secondary);text-align:center}
.vcg-cv-lib-empty .vcg-hint{margin-top:4px}

/* ---------------------------------------------------------------- toolbar */
.vcg-cv-main{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0}
.vcg-cv-toolbar{display:flex;align-items:center;gap:7px;padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex:none;flex-wrap:wrap;row-gap:6px;min-height:42px}
.vcg-cv-tb-title{font-size:13px;font-weight:600;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-tb-meta{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;font-variant-numeric:tabular-nums}
.vcg-cv-tb-spacer{flex:1;min-width:6px}
.vcg-cv-tb-sep{width:1px;height:18px;background:var(--dsw-alias-border-l1);margin:0 2px;flex:none}
.vcg-cv-tbtn{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:26px;min-width:26px;padding:0 7px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;line-height:1;cursor:pointer;transition:background 100ms ease,border-color 100ms ease,color 100ms ease}
.vcg-cv-tbtn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.vcg-cv-tbtn-active{color:var(--dsw-alias-brand-primary);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,var(--dsw-alias-bg-layer-1))}
.vcg-cv-tbtn:disabled{opacity:.45;cursor:default}
.vcg-cv-zoompct{min-width:48px;justify-content:center;font-variant-numeric:tabular-nums}
.vcg-cv-seg{display:inline-flex;align-items:stretch;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;overflow:hidden;height:26px;flex:none}
.vcg-cv-seg-btn{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:11.5px;padding:0 8px;cursor:pointer;border-right:1px solid var(--dsw-alias-border-l1);line-height:1;white-space:nowrap}
.vcg-cv-seg-btn:last-child{border-right:0}
.vcg-cv-seg-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.vcg-cv-seg-btn-active{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-brand-primary);font-weight:600}
.vcg-cv-seg-btn:disabled{opacity:.5;cursor:default}
.vcg-cv-outdir{display:inline-flex;align-items:center;gap:5px;max-width:220px;font-size:11px;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:999px;padding:2px 9px;min-height:24px;flex:none}
.vcg-cv-outdir-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-cv-readonly{font-size:10.5px;font-weight:600;color:var(--dsw-alias-state-warn-primary);border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary) 40%,var(--dsw-alias-border-l1));border-radius:999px;padding:1px 8px;line-height:16px;flex:none}

/* ------------------------------------------------------------------ stage */
.vcg-cv-stage-wrap{position:relative;flex:1;min-height:0;overflow:hidden;background:var(--dsw-alias-bg-base)}
.vcg-cv-stage{position:absolute;inset:0;overflow:hidden;outline:none;touch-action:none;cursor:default;user-select:none}
.vcg-cv-stage.vcg-cv-panning{cursor:grabbing}
.vcg-cv-stage.vcg-cv-space{cursor:grab}
.vcg-cv-grid{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(circle,color-mix(in srgb,var(--dsw-alias-border-l2) 88%,transparent) 1px,transparent 1.25px);background-size:22px 22px;background-position:0 0;opacity:.8}
.vcg-cv-world{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
.vcg-cv-edges{position:absolute;overflow:visible;pointer-events:none}
.vcg-cv-edge-group{pointer-events:none}
.vcg-cv-edge-main{fill:none;stroke-linecap:round;pointer-events:none;transition:stroke-width 80ms ease,opacity 80ms ease}
.vcg-cv-edge-group:hover .vcg-cv-edge-main{stroke-width:3.2;opacity:1}
.vcg-cv-edge-hit{fill:none;stroke:transparent;stroke-width:16;pointer-events:stroke;cursor:pointer}
.vcg-cv-edge-temp{fill:none;stroke:var(--dsw-alias-brand-primary);stroke-width:2.4;stroke-dasharray:7 5;pointer-events:none;animation:vcg-cv-dash 1s linear infinite}
.vcg-cv-edge-temp.vcg-cv-invalid{stroke:var(--dsw-alias-state-error-primary)}
@keyframes vcg-cv-dash{to{stroke-dashoffset:-12}}

/* ------------------------------------------------------------------ nodes */
.vcg-cv-node{position:absolute;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.08);user-select:none;will-change:transform;z-index:1}
.vcg-cv-node:hover{border-color:var(--dsw-alias-border-l2);box-shadow:0 4px 16px rgba(0,0,0,.12)}
.vcg-cv-node-selected{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 22%,transparent),0 6px 20px rgba(0,0,0,.14);z-index:2}
.vcg-cv-node[data-status="error"]{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 62%,var(--dsw-alias-border-l1))}
.vcg-cv-node[data-status="running"]{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,var(--dsw-alias-border-l1));animation:vcg-cv-breathe 1.8s ease-in-out infinite}
@keyframes vcg-cv-breathe{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--dsw-alias-brand-primary) 0%,transparent)}50%{box-shadow:0 0 0 4px color-mix(in srgb,var(--dsw-alias-brand-primary) 15%,transparent)}}
.vcg-cv-node-head{display:flex;align-items:center;gap:5px;height:36px;padding:0 6px 0 9px;border-bottom:1px solid var(--dsw-alias-border-l1);background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-bg-layer-2) 65%,transparent),transparent);border-radius:10px 10px 0 0;flex:none;cursor:grab;position:relative;min-width:0}
.vcg-cv-node-head:active{cursor:grabbing}
.vcg-cv-node-head::before{content:"";width:3px;height:16px;border-radius:2px;background:var(--vcg-cv-accent,var(--dsw-alias-brand-primary));flex:none}
.vcg-cv-status{width:7px;height:7px;border-radius:50%;flex:none;background:var(--dsw-alias-label-secondary);box-shadow:0 0 0 2px color-mix(in srgb,currentColor 16%,transparent)}
.vcg-cv-node-title{flex:1;min-width:0;font-size:12.5px;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text}
.vcg-cv-title-input{flex:1;min-width:0;height:22px;border:1px solid var(--dsw-alias-brand-primary);border-radius:5px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;padding:0 5px;outline:none}
.vcg-cv-ms{font-size:10px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;flex:none;white-space:nowrap}
.vcg-cv-engine{display:inline-flex;align-items:center;gap:3px;border:1px solid;border-radius:999px;padding:0 6px;height:18px;font-family:inherit;font-size:10px;font-weight:600;cursor:pointer;background:transparent;flex:none;line-height:1;white-space:nowrap;transition:filter 100ms ease}
.vcg-cv-engine:hover:not(:disabled){filter:brightness(1.15)}
.vcg-cv-engine:disabled{cursor:default;opacity:.9}
.vcg-cv-engine-override{border-style:dashed}
.vcg-cv-engine-icon{display:inline-flex;align-items:center}
.vcg-cv-node-actions{display:flex;align-items:center;gap:1px;flex:none;opacity:0;transition:opacity 100ms ease}
.vcg-cv-node:hover .vcg-cv-node-actions,.vcg-cv-node-selected .vcg-cv-node-actions{opacity:1}
.vcg-cv-node-act{width:20px;height:20px;border:0;background:transparent;border-radius:5px;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex:none}
.vcg-cv-node-act:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.vcg-cv-node-act:disabled{opacity:.4;cursor:default}
.vcg-cv-node-act-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);color:var(--dsw-alias-state-error-primary)}
.vcg-cv-spin{width:12px;height:12px;border-radius:50%;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);animation:vcg-cv-spin .8s linear infinite;flex:none;display:inline-block}
@keyframes vcg-cv-spin{to{transform:rotate(360deg)}}

/* ------------------------------------------------------------------ ports */
.vcg-cv-node input,.vcg-cv-node textarea,.vcg-cv-node select{user-select:text}
.vcg-cv-ports{display:flex;justify-content:space-between;padding:4px 0;flex:none;position:relative}
.vcg-cv-ports-col{display:flex;flex-direction:column;min-width:0;width:50%}
.vcg-cv-ports-col-out{align-items:flex-end;text-align:right}
.vcg-cv-port-row{position:relative;height:22px;display:flex;align-items:center;gap:6px;width:100%;padding:0 8px 0 9px;min-width:0}
.vcg-cv-ports-col-out .vcg-cv-port-row{justify-content:flex-end;padding:0 9px 0 8px}
.vcg-cv-port{position:absolute;left:-5px;top:50%;width:10px;height:10px;border-radius:50%;transform:translateY(-50%);border:2px solid var(--dsw-alias-bg-layer-1);cursor:crosshair;z-index:2;transition:transform 100ms ease,box-shadow 100ms ease;box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-border-l2) 70%,transparent)}
.vcg-cv-ports-col-out .vcg-cv-port{left:auto;right:-5px}
.vcg-cv-port:hover{transform:translateY(-50%) scale(1.3)}
.vcg-cv-port-compat{box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 32%,transparent);animation:vcg-cv-port-pulse 1.3s ease-in-out infinite}
@keyframes vcg-cv-port-pulse{0%,100%{box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 22%,transparent)}50%{box-shadow:0 0 0 5px color-mix(in srgb,var(--dsw-alias-brand-primary) 34%,transparent)}}
.vcg-cv-port-hover-ok{transform:translateY(-50%) scale(1.45)!important;box-shadow:0 0 0 4px color-mix(in srgb,var(--dsw-alias-state-success-primary) 45%,transparent)!important}
.vcg-cv-port-hover-bad{transform:translateY(-50%) scale(1.35)!important;box-shadow:0 0 0 4px color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent)!important}
.vcg-cv-port-warn{box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-state-warn-primary) 55%,transparent)}
.vcg-cv-port-label{font-size:9.5px;line-height:1.2;letter-spacing:.04em;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;opacity:.9}
.vcg-cv-port-warn + .vcg-cv-port-label{color:var(--dsw-alias-state-warn-primary)}

/* ------------------------------------------------------------ node body */
.vcg-cv-node-body{padding:2px 9px 9px;display:flex;flex-direction:column;gap:6px;min-height:2px}
.vcg-cv-param{display:flex;flex-direction:column;gap:2px;min-width:0}
.vcg-cv-param-label{font-size:10px;font-weight:600;color:var(--dsw-alias-label-secondary);letter-spacing:.02em;display:flex;align-items:center;gap:4px;min-width:0}
.vcg-cv-param-label span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-cv-node-body .vcg-input,.vcg-cv-node-body .vcg-textarea,.vcg-cv-node-body .vcg-select{padding:3px 7px;font-size:11.5px;border-radius:6px;min-height:24px}
.vcg-cv-node-body .vcg-textarea{min-height:42px;resize:vertical;line-height:1.4}
.vcg-cv-node-body .vcg-input[type="number"]{font-variant-numeric:tabular-nums}
.vcg-cv-param-toggle{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:22px}
.vcg-cv-switch{position:relative;width:28px;height:16px;border-radius:999px;background:var(--dsw-alias-border-l2);cursor:pointer;transition:background 130ms ease;flex:none}
.vcg-cv-switch::after{content:"";position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3);transition:transform 130ms ease}
.vcg-cv-switch-on{background:var(--dsw-alias-brand-primary)}
.vcg-cv-switch-on::after{transform:translateX(12px)}
.vcg-cv-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.vcg-cv-model{display:flex;flex-direction:column;gap:3px;min-width:0}
.vcg-cv-model-row{display:flex;align-items:center;gap:4px;min-width:0}
.vcg-cv-model-row .vcg-input,.vcg-cv-model-row .vcg-select{flex:1;min-width:0}
.vcg-cv-model-act{width:22px;height:22px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex:none}
.vcg-cv-model-act:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}

/* ---------------------------------------------------------------- results */
.vcg-cv-result{margin-top:2px;display:flex;flex-direction:column;gap:5px;border-top:1px dashed var(--dsw-alias-border-l1);padding-top:6px;user-select:text;min-width:0}
.vcg-cv-result-head{display:flex;align-items:center;gap:4px;font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}
.vcg-cv-result-thumbs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}
.vcg-cv-result-thumbs-single{grid-template-columns:1fr}
.vcg-cv-thumb{position:relative;width:100%;aspect-ratio:1/1;border-radius:6px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);cursor:zoom-in;padding:0;display:block}
.vcg-cv-thumb:hover{border-color:var(--dsw-alias-brand-primary)}
.vcg-cv-thumb img,.vcg-cv-thumb video{width:100%;height:100%;object-fit:cover;display:block}
.vcg-cv-thumb-missing{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:100%;aspect-ratio:1/1;border-radius:6px;border:1px dashed var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:9px;padding:4px;text-align:center;word-break:break-all;overflow:hidden}
.vcg-cv-result-text{font-size:11px;color:var(--dsw-alias-label-secondary);line-height:1.45;max-height:64px;overflow:hidden;white-space:pre-wrap;word-break:break-word}
.vcg-cv-result-error{font-size:11px;line-height:1.4;color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 30%,transparent);border-radius:6px;padding:4px 6px;max-height:96px;overflow:auto;white-space:pre-wrap;word-break:break-word}
.vcg-cv-runbar{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dsw-alias-label-secondary);padding:1px 0}
.vcg-cv-result-done{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--dsw-alias-state-success-primary)}

/* ------------------------------------------------------------ empty/help */
.vcg-cv-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;pointer-events:none;padding:20px;text-align:center;color:var(--dsw-alias-label-secondary);z-index:2}
.vcg-cv-empty-icon{opacity:.4;color:var(--dsw-alias-brand-primary);display:inline-flex}
.vcg-cv-empty-title{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary);opacity:.8}
.vcg-cv-empty-hint{font-size:12px;max-width:380px;line-height:1.6}
.vcg-cv-quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;pointer-events:auto;justify-content:center;max-width:420px}
.vcg-cv-quick-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:11.5px;cursor:pointer}
.vcg-cv-quick-btn:hover{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}
.vcg-cv-help{position:absolute;left:10px;bottom:10px;z-index:3;font-size:10.5px;color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 84%,transparent);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:3px 9px;pointer-events:none;backdrop-filter:blur(4px);max-width:calc(100% - 220px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-connect-hint{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:4;font-size:11.5px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:4px 12px;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.16);white-space:nowrap}
.vcg-cv-connect-hint.vcg-cv-invalid{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,var(--dsw-alias-border-l1))}

/* ---------------------------------------------------------------- minimap */
.vcg-cv-minimap{position:absolute;right:10px;bottom:10px;z-index:3;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 92%,transparent);box-shadow:0 4px 16px rgba(0,0,0,.16);overflow:hidden;cursor:crosshair;user-select:none;backdrop-filter:blur(4px)}
.vcg-cv-minimap svg{display:block}
.vcg-cv-mini-node{fill:color-mix(in srgb,var(--dsw-alias-label-secondary) 34%,transparent)}
.vcg-cv-mini-view{fill:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent);stroke:var(--dsw-alias-brand-primary);stroke-width:1;vector-effect:non-scaling-stroke}

/* ---------------------------------------------------------------- preview */
.vcg-cv-preview{display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px;min-height:120px}
.vcg-cv-preview img,.vcg-cv-preview video{max-width:100%;max-height:60vh;border-radius:6px;display:block;object-fit:contain}
.vcg-cv-preview-meta{font-size:11px;color:var(--dsw-alias-label-secondary);word-break:break-all;max-height:56px;overflow:auto;margin-top:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}

@media (max-width: 980px){
  .vcg-cv-lib{width:204px}
  .vcg-cv-outdir{max-width:150px}
}
`

  /* ------------------------------------------------------------- utilities */

  const ENGINE_SHORT = { cloud: '云', local: '本', both: '云/本' }
  const ENGINE_ICON = { cloud: 'cloud', local: 'server', both: 'layers' }
  const STATUS_LABEL_KEY = { idle: 'cvStatusIdle', running: 'cvStatusRunning', done: 'cvStatusDone', error: 'cvStatusError' }

  function engineLabel(engine) {
    const labels = consts.ENGINE_LABELS || {}
    return labels[engine] || String(engine || 'cloud')
  }
  function engineColor(engine) {
    const colors = consts.ENGINE_COLORS || {}
    return colors[engine] || 'var(--dsw-alias-brand-primary)'
  }
  function statusColor(status) {
    const colors = consts.STATUS_COLORS || {}
    return colors[status] || colors.idle || '#94a3b8'
  }
  function isTypingTarget(target) {
    if (!target || typeof target !== 'object') return false
    const tag = String(target.tagName || '').toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
    if (target.isContentEditable) return true
    return false
  }
  function isVideoItem(item) {
    if (!item) return false
    if (item.kind === 'video' || item.type === 'video') return true
    const src = String(item.url || item.src || '')
    return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)
  }
  function itemSrc(item) {
    if (!item) return ''
    return String(item.url || item.dataUrl || item.src || '')
  }
  function stopEvent(event) {
    if (!event) return
    event.stopPropagation()
  }

  /* ---------------------------------------------------------------- TBtn */

  function TBtn(props) {
    const classes = ['vcg-cv-tbtn']
    if (props.active) classes.push('vcg-cv-tbtn-active')
    if (props.className) classes.push(props.className)
    return h(
      'button',
      {
        type: 'button',
        className: classes.join(' '),
        title: props.title,
        disabled: Boolean(props.disabled),
        onClick: props.onClick,
        onPointerDown: stopEvent,
        style: props.style,
        'aria-label': props.title,
        'aria-pressed': props.active ? 'true' : undefined,
      },
      props.children,
    )
  }

  /* ------------------------------------------------------------ ParamField */

  function ParamField(props) {
    const { param, value, disabled, modelOptions } = props
    if (!param || !param.id) return null
    const type = param.type || 'text'
    const onChange = (next) => props.onChange(param.id, next)
    const label = param.label || param.id

    if (type === 'toggle') {
      const checked = Boolean(value)
      return h(
        'div',
        { className: 'vcg-cv-param', onPointerDown: stopEvent },
        h(
          'div',
          { className: 'vcg-cv-param-toggle' },
          h('span', { className: 'vcg-cv-param-label' }, h('span', null, label)),
          h('span', {
            className: 'vcg-cv-switch ' + (checked ? 'vcg-cv-switch-on' : ''),
            role: 'switch',
            'aria-checked': checked,
            tabIndex: disabled ? -1 : 0,
            title: label,
            onClick: () => {
              if (!disabled) onChange(!checked)
            },
            onKeyDown: (event) => {
              if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                stopEvent(event)
                onChange(!checked)
              }
            },
          }),
        ),
      )
    }

    let control = null
    if (type === 'textarea') {
      control = h(TextArea, {
        value: value === undefined || value === null ? '' : value,
        onChange: onChange,
        disabled: disabled,
        rows: 3,
        placeholder: param.placeholder || '',
        onKeyDown: stopEvent,
      })
    } else if (type === 'number') {
      control = h(NumberInput, {
        value: value === undefined || value === null ? '' : value,
        onChange: onChange,
        disabled: disabled,
        min: param.min,
        max: param.max,
        step: param.step,
      })
    } else if (type === 'select') {
      const options = Array.isArray(param.options) ? param.options.slice() : []
      if (value !== undefined && value !== null && value !== '' && options.indexOf(value) < 0) options.unshift(value)
      if (!options.length) options.push('')
      control = h(Select, {
        value: value === undefined || value === null ? '' : value,
        onChange: onChange,
        options,
        disabled: disabled,
        style: { minWidth: 0 },
      })
    } else if (type === 'model') {
      control = h(ModelParam, {
        value: value === undefined || value === null ? '' : value,
        options: Array.isArray(param.options) && param.options.length ? param.options : modelOptions || [],
        disabled: disabled,
        onChange,
      })
    } else {
      control = h(TextInput, {
        value: value === undefined || value === null ? '' : value,
        onChange: onChange,
        disabled: disabled,
        placeholder: param.placeholder || '',
        onKeyDown: stopEvent,
      })
    }

    return h(
      'div',
      { className: 'vcg-cv-param', onPointerDown: stopEvent },
      h('div', { className: 'vcg-cv-param-label', title: label + ' · ' + type }, h('span', null, label)),
      control,
    )
  }

  /** Model select from settings providers + free text fallback. */
  function ModelParam(props) {
    const { value, options, disabled } = props
    const list = Array.isArray(options) ? options.slice() : []
    if (value && list.indexOf(value) < 0) list.unshift(value)
    const [free, setFree] = React.useState(() => list.length === 0 || Boolean(value && list.indexOf(value) < 0))
    const selectOptions = list.concat([{ value: '__vcg_custom__', label: t('cvModelCustom') }])
    if (!list.length) selectOptions.unshift({ value: '', label: '—' })
    return h(
      'div',
      { className: 'vcg-cv-model' },
      h(
        'div',
        { className: 'vcg-cv-model-row' },
        free
          ? h(TextInput, {
              value: value || '',
              placeholder: t('cvModelFree'),
              disabled: disabled,
              onChange: (next) => props.onChange(next),
              onKeyDown: stopEvent,
            })
          : h(Select, {
              value: value || '',
              options: selectOptions,
              disabled: disabled,
              onChange: (next) => {
                if (next === '__vcg_custom__') {
                  setFree(true)
                  return
                }
                props.onChange(next)
              },
              style: { minWidth: 0 },
            }),
        h(
          'button',
          {
            type: 'button',
            className: 'vcg-cv-model-act',
            title: free ? t('cvModelSelect') : t('cvModelCustom'),
            disabled: disabled,
            onPointerDown: stopEvent,
            onClick: () => setFree(!free),
          },
          h(Glyph, { name: free ? 'layers' : 'edit', size: 11 }),
        ),
      ),
    )
  }

  /* ------------------------------------------------------------ NodeResult */

  function NodeResult(props) {
    const result = props.result
    if (!result) return null
    const status = result.status || 'idle'
    if (status === 'idle') return null
    if (status === 'running') {
      return h(
        'div',
        { className: 'vcg-cv-runbar', role: 'status' },
        h('span', { className: 'vcg-cv-spin' }),
        h('span', null, t('cvRunning')),
      )
    }
    const images = Array.isArray(result.images) ? result.images : []
    const text = typeof result.text === 'string' && result.text ? result.text : ''
    const error = result.error ? String(result.error) : ''
    if (status === 'error') {
      return h(
        'div',
        { className: 'vcg-cv-result', 'data-nodrag': 'true' },
        error ? h('div', { className: 'vcg-cv-result-error', title: error }, error) : h('div', { className: 'vcg-cv-result-error' }, t('cvFailed')),
      )
    }
    const children = []
    if (images.length) {
      children.push(
        h(
          'div',
          { className: 'vcg-cv-result-thumbs ' + (images.length === 1 ? 'vcg-cv-result-thumbs-single' : ''), 'data-nodrag': 'true' },
          images.slice(0, 4).map((item, index) => {
            const entry = typeof item === 'string' ? { url: item } : item || {}
            const src = itemSrc(entry)
            const video = isVideoItem(entry)
            if (!src) {
              return h(
                'div',
                { className: 'vcg-cv-thumb-missing', key: 'thumb' + index, title: entry.path || entry.label ? String(entry.path || entry.label) : '' },
                h(Glyph, { name: video ? 'video' : 'image', size: 14 }),
                h('span', null, entry.label || entry.path || ''),
              )
            }
            return h(
              'button',
              {
                type: 'button',
                key: 'thumb' + index,
                className: 'vcg-cv-thumb',
                title: entry.label || t('cvPreview'),
                onPointerDown: stopEvent,
                onClick: () =>
                  props.onPreview({
                    src,
                    kind: video ? 'video' : 'image',
                    label: entry.label || '',
                    path: entry.path || '',
                    url: entry.url || '',
                  }),
              },
              video
                ? h('video', { src, muted: true, playsInline: true, preload: 'metadata' })
                : h('img', { src, alt: entry.label || '', loading: 'lazy' }),
            )
          }),
        ),
      )
    }
    if (text) children.push(h('div', { className: 'vcg-cv-result-text', title: text, 'data-nodrag': 'true' }, text))
    if (!children.length) {
      children.push(h('div', { className: 'vcg-cv-result-done' }, h(Glyph, { name: 'check', size: 12 }), t('cvResultEmpty')))
    }
    return h(
      'div',
      { className: 'vcg-cv-result', 'data-nodrag': 'true' },
      h('div', { className: 'vcg-cv-result-head' }, t('cvResult')),
      children,
    )
  }

  /* -------------------------------------------------------------- NodeCard */

  function NodeCard(props) {
    const { node, def, result, selected, readOnly, connectedInputs, connect, hoverPort, modelOptions } = props
    const [renaming, setRenaming] = React.useState(false)
    const [draft, setDraft] = React.useState('')
    const cancelledRef = React.useRef(false)
    const width = nodeWidth(def)
    const inputs = Array.isArray(def.inputs) ? def.inputs : []
    const outputs = Array.isArray(def.outputs) ? def.outputs : []
    const params = Array.isArray(def.params) ? def.params : []
    const status = result && result.status ? result.status : 'idle'
    const effectiveEngine = node.engineOverride || def.engine || 'cloud'
    const title = node.title || def.nameZh || def.name || node.type
    const accent = (def.ui && def.ui.accent) || null
    const engineFlexible = def.engine === 'both' || !def.engine
    const engineOverride = Boolean(node.engineOverride)
    const statusTitle = t(STATUS_LABEL_KEY[status] || 'cvStatusIdle')
    const paramsSource = node.params && typeof node.params === 'object' ? node.params : EMPTY_OBJECT

    const header = h(
      'div',
      {
        className: 'vcg-cv-node-head',
        onDoubleClick: (event) => {
          if (readOnly) return
          const target = event.target
          if (target && target.closest && target.closest('input,textarea,select,button,a,label,[data-nodrag]')) return
          if (props.onOpen) props.onOpen(node.id)
        },
      },
      status === 'running'
        ? h('span', { className: 'vcg-cv-spin', title: statusTitle })
        : h('span', {
            className: 'vcg-cv-status',
            title: statusTitle,
            style: { background: statusColor(status), color: statusColor(status) },
          }),
      renaming
        ? h('input', {
            className: 'vcg-cv-title-input',
            value: draft,
            autoFocus: true,
            placeholder: def.nameZh || def.name || node.type,
            onFocus: (event) => event.target.select(),
            onChange: (event) => setDraft(event.target.value),
            onPointerDown: stopEvent,
            onKeyDown: (event) => {
              stopEvent(event)
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                cancelledRef.current = true
                event.currentTarget.blur()
              }
            },
            onBlur: () => {
              setRenaming(false)
              if (cancelledRef.current) {
                cancelledRef.current = false
                return
              }
              const nextTitle = draft.trim()
              if (nextTitle !== (node.title || '')) props.onRename(node.id, nextTitle)
            },
          })
        : h(
            'span',
            {
              className: 'vcg-cv-node-title',
              title: (def.nameZh ? def.nameZh + ' / ' : '') + (def.name || node.type) + ' — ' + t('cvRenameHint'),
              onDoubleClick: (event) => {
                event.stopPropagation()
                if (readOnly) return
                setDraft(node.title || '')
                setRenaming(true)
              },
            },
            title,
          ),
      status === 'running' || status === 'error' ? null : result && formatMs(result.ms) ? h('span', { className: 'vcg-cv-ms' }, formatMs(result.ms)) : null,
      h(
        'button',
        {
          type: 'button',
          className: 'vcg-cv-engine' + (engineOverride ? ' vcg-cv-engine-override' : ''),
          title:
            engineLabel(effectiveEngine) +
            (engineFlexible ? ' · ' + t('cvEngineHint') : '') +
            (engineOverride ? ' · ' + t('cvEngineOverride') : ''),
          disabled: readOnly || !engineFlexible,
          style: { color: engineColor(effectiveEngine), borderColor: 'color-mix(in srgb,' + engineColor(effectiveEngine) + ' 45%,transparent)' },
          onPointerDown: stopEvent,
          onClick: (event) => {
            event.stopPropagation()
            props.onCycleEngine(node, def)
          },
        },
        h('span', { className: 'vcg-cv-engine-icon' }, h(Glyph, { name: ENGINE_ICON[effectiveEngine] || 'cloud', size: 10 })),
        ENGINE_SHORT[effectiveEngine] || engineLabel(effectiveEngine),
      ),
      h(
        'div',
        { className: 'vcg-cv-node-actions', onPointerDown: stopEvent },
        props.onRun
          ? h(
              'button',
              {
                type: 'button',
                className: 'vcg-cv-node-act',
                title: t('runNode'),
                disabled: Boolean(props.running),
                onClick: (event) => {
                  event.stopPropagation()
                  props.onRun(node.id)
                },
              },
              h(Glyph, { name: 'play', size: 11 }),
            )
          : null,
        !readOnly
          ? h(
              'button',
              {
                type: 'button',
                className: 'vcg-cv-node-act vcg-cv-node-act-danger',
                title: t('cvDeleteNode'),
                disabled: props.running,
                onClick: (event) => {
                  event.stopPropagation()
                  props.onDelete(node.id)
                },
              },
              h(Glyph, { name: 'trash', size: 11 }),
            )
          : null,
      ),
    )

    function renderPort(port, dir, index) {
      if (!port || !port.id) return null
      const key = dir + ':' + port.id
      const connected = Boolean(connectedInputs[node.id + '::' + port.id])
      const warn = dir === 'in' && !connected && port.optional !== true
      const isHover = Boolean(hoverPort && hoverPort.node === node.id && hoverPort.dir === dir && hoverPort.port === port.id)
      let compatible = false
      if (connect && connect.fromNode !== node.id && connect.fromDir !== dir) {
        const fromType = connect.fromDir === 'out' ? connect.fromType : port.type
        const toType = connect.fromDir === 'out' ? port.type : connect.fromType
        compatible = canConnect(fromType, toType)
      }
      const classes = ['vcg-cv-port']
      if (warn) classes.push('vcg-cv-port-warn')
      if (compatible) classes.push('vcg-cv-port-compat')
      if (isHover) classes.push(hoverPort.valid ? 'vcg-cv-port-hover-ok' : 'vcg-cv-port-hover-bad')
      const bits = [port.label || port.id, String(port.type || 'any')]
      if (port.optional) bits.push(t('cvOptional'))
      if (warn) bits.push(t('cvRequiredInput'))
      if (isHover) bits.push(hoverPort.valid ? t('cvConnectRelease') : t('cvInvalidTarget'))
      if (connected) bits.push('●')
      return h(
        'div',
        { className: 'vcg-cv-port-row', key: key },
        h('span', {
          className: classes.join(' '),
          style: { background: portColor(port.type) },
          title: bits.join(' · '),
          'data-port-node': node.id,
          'data-port-dir': dir,
          'data-port-id': port.id,
          'data-port-type': port.type || 'any',
          onPointerDown: (event) => props.onPortPointerDown(event, node, dir, port, index),
        }),
        h('span', { className: 'vcg-cv-port-label' }, port.label || port.id),
      )
    }

    const body = h(
      'div',
      { className: 'vcg-cv-node-body' },
      params.length
        ? params.map((param) =>
            h(ParamField, {
              key: param.id,
              param,
              value: Object.prototype.hasOwnProperty.call(paramsSource, param.id) ? paramsSource[param.id] : param.default,
              disabled: Boolean(readOnly),
              modelOptions,
              onChange: (paramId, value) => props.onParamChange(node.id, paramId, value),
            }),
          )
        : null,
      h(NodeResult, { result, onPreview: props.onPreview }),
    )

    return h(
      'div',
      {
        ref: (el) => {
          if (typeof props.registerEl === 'function') props.registerEl(node.id, el)
        },
        className: 'vcg-cv-node' + (selected ? ' vcg-cv-node-selected' : ''),
        'data-node-id': node.id,
        'data-status': status,
        style: Object.assign(
          {
            left: isFiniteNumber(node.x) ? node.x : 0,
            top: isFiniteNumber(node.y) ? node.y : 0,
            width: width,
            zIndex: selected ? 2 : 1,
          },
          accent ? { '--vcg-cv-accent': accent } : null,
        ),
        onPointerDown: (event) => props.onNodePointerDown(event, node),
        onContextMenu: (event) => {
          event.preventDefault()
          event.stopPropagation()
        },
      },
      header,
      h(
        'div',
        { className: 'vcg-cv-ports' },
        h('div', { className: 'vcg-cv-ports-col' }, inputs.map((port, index) => renderPort(port, 'in', index))),
        h('div', { className: 'vcg-cv-ports-col vcg-cv-ports-col-out' }, outputs.map((port, index) => renderPort(port, 'out', index))),
      ),
      body,
    )
  }

  /* ------------------------------------------------------------ NodeLibrary */

  function NodeLibrary(props) {
    const [search, setSearch] = React.useState('')
    const defs = Array.isArray(props.defs) ? props.defs : []
    const readOnly = Boolean(props.readOnly)
    const query = search.trim().toLowerCase()
    const filtered = query
      ? defs.filter((def) => {
          if (!def) return false
          const haystack = [def.id, def.name, def.nameZh, def.description, def.category, def.engine]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return haystack.indexOf(query) >= 0
        })
      : defs
    const categories = Array.isArray(consts.NODE_CATEGORIES) ? consts.NODE_CATEGORIES : []
    const known = new Set(categories.map((category) => category.id))
    const groups = []
    for (const category of categories) {
      const items = filtered.filter((def) => def && (def.category || 'utility') === category.id)
      if (items.length) groups.push({ id: category.id, label: category.label || category.id, items })
    }
    const leftovers = filtered.filter((def) => def && !known.has(def.category || 'utility'))
    if (leftovers.length) groups.push({ id: 'other', label: '其他 / Other', items: leftovers })
    const sortItems = (items) =>
      items.slice().sort((a, b) => {
        const orderDiff = (Number(a.order) || 999) - (Number(b.order) || 999)
        if (orderDiff) return orderDiff
        return String(a.nameZh || a.name || a.id).localeCompare(String(b.nameZh || b.name || b.id))
      })
    const renderItem = (def) =>
      h(
        'button',
        {
          key: def.id,
          type: 'button',
          className: 'vcg-cv-lib-item',
          draggable: !readOnly,
          disabled: readOnly,
          title: (def.description || def.name || def.id) + '\n' + t('cvLibDragHint'),
          onDragStart: (event) => props.onDragStart(event, def),
          onClick: () => props.onAdd(def),
          onPointerDown: stopEvent,
        },
        h('span', { className: 'vcg-cv-lib-accent', style: { background: (def.ui && def.ui.accent) || 'var(--dsw-alias-brand-primary)' } }),
        h(
          'span',
          { className: 'vcg-cv-lib-main' },
          h('span', { className: 'vcg-cv-lib-name' }, def.nameZh || def.name || def.id),
          h('span', { className: 'vcg-cv-lib-sub' }, (def.name && def.nameZh ? def.name + ' · ' : '') + engineLabel(def.engine)),
        ),
        h('span', { className: 'vcg-cv-lib-plus' }, h(Glyph, { name: 'plus', size: 12 })),
      )

    return h(
      'aside',
      { className: 'vcg-cv-lib' },
      h(
        'div',
        { className: 'vcg-cv-lib-head' },
        h(Glyph, { name: 'layers', size: 14 }),
        h('span', { className: 'vcg-cv-lib-title' }, t('cvNodeLibrary')),
        h('span', { className: 'vcg-cv-lib-count' }, String(defs.length)),
      ),
      h(
        'div',
        { className: 'vcg-cv-lib-search' },
        h('input', {
          className: 'vcg-input vcg-cv-search',
          type: 'search',
          value: search,
          placeholder: t('cvSearchNodes'),
          'aria-label': t('cvSearchNodes'),
          onChange: (event) => setSearch(event.target.value),
          onPointerDown: stopEvent,
        }),
      ),
      defs.length === 0
        ? h(
            'div',
            { className: 'vcg-cv-lib-empty' },
            h('div', null, t('cvNoDefs')),
            h('div', { className: 'vcg-hint' }, t('cvNoDefsHint')),
          )
        : h(
            'div',
            { className: 'vcg-cv-lib-list' },
            h('div', { className: 'vcg-cv-lib-hint' }, readOnly ? t('cvReadOnly') : t('cvLibDragHint')),
            groups.length === 0 ? h('div', { className: 'vcg-cv-lib-empty-small' }, t('cvNoMatch')) : null,
            groups.map((group) =>
              h(
                'div',
                { className: 'vcg-cv-lib-group', key: group.id },
                h('div', { className: 'vcg-cv-lib-group-title' }, group.label),
                sortItems(group.items).map(renderItem),
              ),
            ),
          ),
    )
  }

  /* ---------------------------------------------------------------- Canvas */

  function emptyWorkflow(id) {
    const now = new Date().toISOString()
    return {
      version: 1,
      id: id || 'wf',
      name: '',
      description: '',
      createdAt: now,
      updatedAt: now,
      viewport: { x: 0, y: 0, scale: 1 },
      nodes: [],
      edges: [],
    }
  }

  function initialSelection(selectedId, nodes, edges) {
    if (selectedId == null) return { kind: null, id: null }
    const list = Array.isArray(nodes) ? nodes : []
    if (list.some((node) => node && node.id === selectedId)) return { kind: 'node', id: selectedId }
    const edgeList = Array.isArray(edges) ? edges : []
    if (edgeList.some((edge) => edge && edge.id === selectedId)) return { kind: 'edge', id: selectedId }
    return { kind: null, id: null }
  }

  /**
   * VCG 工作流画布（受控组件）。
   * @param {object} props 见 CONTRACT.md §7 / §11。
   */
  function Canvas(props) {
    /* ------------------------------------------------------------ context */
    const store = typeof V.useStore === 'function' ? V.useStore() : null
    const propsRef = React.useRef(props)
    propsRef.current = props

    const rawWf = props.workflow && typeof props.workflow === 'object' ? props.workflow : null
    const workflow = rawWf || EMPTY_OBJECT
    const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : []
    const edges = Array.isArray(workflow.edges) ? workflow.edges : []
    const nodeDefs = Array.isArray(props.nodeDefs) ? props.nodeDefs : []
    const results = props.results && typeof props.results === 'object' ? props.results : EMPTY_OBJECT
    const readOnly = Boolean(props.readOnly)
    const running = Boolean(props.running)
    const workflowName = workflow.name || t('cvDefaultWorkflowName')
    const modelOptions = collectModelOptions(store && store.state)

    const defsById = React.useMemo(() => {
      const map = {}
      for (const def of nodeDefs) if (def && def.id) map[def.id] = def
      return map
    }, [nodeDefs])
    const nodesById = React.useMemo(() => {
      const map = {}
      for (const node of nodes) if (node && node.id) map[node.id] = node
      return map
    }, [nodes])
    const inputConnected = React.useMemo(() => {
      const map = {}
      for (const edge of edges) {
        if (edge && edge.to && edge.to.node && edge.to.port) map[edge.to.node + '::' + edge.to.port] = true
      }
      return map
    }, [edges])

    const fallbackDefsRef = React.useRef({})
    function resolveDef(type) {
      const found = defsById[type]
      if (found) return found
      const key = type || 'unknown'
      if (!fallbackDefsRef.current[key]) {
        fallbackDefsRef.current[key] = {
          id: key,
          name: key,
          nameZh: key,
          category: 'custom',
          engine: 'both',
          inputs: [],
          outputs: [],
          params: [],
          ui: {},
          __missing: true,
        }
      }
      return fallbackDefsRef.current[key]
    }

    /* -------------------------------------------------------------- refs */
    const wfRef = React.useRef(workflow)
    wfRef.current = workflow
    const rawWfRef = React.useRef(rawWf)
    rawWfRef.current = rawWf
    const defsByIdRef = React.useRef(defsById)
    defsByIdRef.current = defsById
    const nodeElsRef = React.useRef({})
    const edgeElsRef = React.useRef({})
    const stageRef = React.useRef(null)
    const worldRef = React.useRef(null)
    const gridRef = React.useRef(null)
    const tempPathRef = React.useRef(null)
    const gestureRef = React.useRef(null)
    const gestureCleanupRef = React.useRef(null)
    const activeRef = React.useRef(false)
    const connectRef = React.useRef(null)
    const miniMapRef = React.useRef(null)
    const lastSentViewRef = React.useRef(null)
    const didFitRef = React.useRef(false)
    const wheelTimerRef = React.useRef(null)
    const spaceRef = React.useRef(false)
    const actionsRef = React.useRef({})

    /* ------------------------------------------------------------- state */
    const [view, setView] = React.useState(() => resolveViewport(rawWf && rawWf.viewport))
    const viewRef = React.useRef(view)
    // NOTE: viewRef is the live viewport (mutated directly during pan/zoom for
    // 60fps DOM updates); the state `view` only forces re-renders of chrome.
    const [stageSize, setStageSize] = React.useState({ width: 0, height: 0 })
    const stageSizeRef = React.useRef(stageSize)
    stageSizeRef.current = stageSize
    const [sel, setSel] = React.useState(() => initialSelection(props.selectedId, nodes, edges))
    const selRef = React.useRef(sel)
    selRef.current = sel
    const [multi, setMulti] = React.useState(() => {
      const initial = initialSelection(props.selectedId, nodes, edges)
      return initial.kind === 'node' ? [initial.id] : []
    })
    const multiRef = React.useRef(multi)
    multiRef.current = multi
    const [hoverPort, setHoverPort] = React.useState(null)
    const hoverPortRef = React.useRef(hoverPort)
    hoverPortRef.current = hoverPort
    const [connectState, setConnectState] = React.useState(null)
    const [preview, setPreview] = React.useState(null)
    const previewRef = React.useRef(preview)
    previewRef.current = preview
    const [libraryOpen, setLibraryOpen] = React.useState(true)
    const [miniOpen, setMiniOpen] = React.useState(true)
    const [spaceDown, setSpaceDown] = React.useState(false)
    const [panning, setPanning] = React.useState(false)
    const [enginePref, setEnginePref] = React.useState('auto')

    /* --------------------------------------------------------- view math */
    function applyView(nextView) {
      viewRef.current = nextView
      const world = worldRef.current
      if (world) {
        world.style.transform =
          'translate3d(' + nextView.x + 'px,' + nextView.y + 'px,0) scale(' + nextView.scale + ')'
      }
      const grid = gridRef.current
      if (grid) grid.style.backgroundPosition = nextView.x + 'px ' + nextView.y + 'px'
    }

    function viewSize() {
      const size = stageSizeRef.current
      if (size && size.width > 0 && size.height > 0) return size
      const el = stageRef.current
      if (el) return { width: el.clientWidth || 800, height: el.clientHeight || 600 }
      return { width: 800, height: 600 }
    }

    function emitWorkflow(nextWorkflow) {
      const p = propsRef.current
      if (!p || typeof p.onChange !== 'function' || !nextWorkflow) return
      const v = viewRef.current
      lastSentViewRef.current = { x: v.x, y: v.y, scale: v.scale }
      const next = Object.assign({}, nextWorkflow, { viewport: { x: v.x, y: v.y, scale: v.scale } })
      p.onChange(next)
    }

    function commitView(nextView) {
      viewRef.current = nextView
      setView(nextView)
      const p = propsRef.current
      if (!p || typeof p.onChange !== 'function' || !rawWfRef.current) return
      const last = lastSentViewRef.current
      if (last && viewportsEqual(last, nextView)) return
      lastSentViewRef.current = { x: nextView.x, y: nextView.y, scale: nextView.scale }
      p.onChange(
        Object.assign({}, rawWfRef.current, {
          viewport: { x: nextView.x, y: nextView.y, scale: nextView.scale },
        }),
      )
    }

    function workflowBase() {
      if (rawWfRef.current) return rawWfRef.current
      return emptyWorkflow(typeof V.uid === 'function' ? V.uid('wf') : 'wf-' + Date.now().toString(36))
    }

    function notifySelect(id) {
      const p = propsRef.current
      if (p && typeof p.onSelect === 'function') p.onSelect(id)
    }

    function focusStage() {
      const el = stageRef.current
      if (!el || typeof el.focus !== 'function') return
      try {
        el.focus({ preventScroll: true })
      } catch {
        try {
          el.focus()
        } catch {
          /* ignore */
        }
      }
    }

    function measuredSizes() {
      const out = {}
      const els = nodeElsRef.current || {}
      for (const id of Object.keys(els)) {
        const el = els[id]
        if (!el) continue
        const width = el.offsetWidth
        const height = el.offsetHeight
        if (width > 0 && height > 0) out[id] = { w: width, h: height }
      }
      return out
    }

    function viewCenterWorld() {
      const size = viewSize()
      const v = viewRef.current
      return {
        x: (size.width / 2 - v.x) / v.scale,
        y: (size.height / 2 - v.y) / v.scale,
      }
    }

    function fitAll() {
      const defs = defsByIdRef.current || {}
      const size = viewSize()
      const current = wfRef.current
      const currentNodes = Array.isArray(current.nodes) ? current.nodes : []
      if (!currentNodes.length) {
        applyView({ x: 0, y: 0, scale: 1 })
        commitView({ x: 0, y: 0, scale: 1 })
        return
      }
      const next = fitView(currentNodes, defs, size, 56, measuredSizes())
      applyView(next)
      commitView(next)
    }

    function zoomRelative(factor) {
      const size = viewSize()
      const v = viewRef.current
      const nextScale = clampScale(v.scale * factor)
      if (Math.abs(nextScale - v.scale) < 0.0001) return
      const cx = size.width / 2
      const cy = size.height / 2
      const wx = (cx - v.x) / v.scale
      const wy = (cy - v.y) / v.scale
      const next = { x: cx - wx * nextScale, y: cy - wy * nextScale, scale: nextScale }
      applyView(next)
      commitView(next)
    }

    function resetZoom() {
      const size = viewSize()
      const v = viewRef.current
      const nextScale = 1
      if (Math.abs(v.scale - nextScale) < 0.0001) return
      const cx = size.width / 2
      const cy = size.height / 2
      const wx = (cx - v.x) / v.scale
      const wy = (cy - v.y) / v.scale
      const next = { x: cx - wx * nextScale, y: cy - wy * nextScale, scale: nextScale }
      applyView(next)
      commitView(next)
    }

    /* ------------------------------------------------------- workflow edit */
    function selectNode(id, additive) {
      if (!id) {
        setSel({ kind: null, id: null })
        setMulti([])
        notifySelect(null)
        return []
      }
      const existing = multiRef.current || []
      if (additive) {
        const has = existing.indexOf(id) >= 0
        const nextMulti = has ? existing.filter((item) => item !== id) : existing.concat([id])
        if (!nextMulti.length) {
          setSel({ kind: null, id: null })
          setMulti([])
          notifySelect(null)
          return []
        }
        const primary = has ? nextMulti[nextMulti.length - 1] : id
        setSel({ kind: 'node', id: primary })
        setMulti(nextMulti)
        notifySelect(primary)
        return nextMulti
      }
      if (existing.length > 1 && existing.indexOf(id) >= 0) {
        setSel({ kind: 'node', id: id })
        notifySelect(id)
        return existing
      }
      setSel({ kind: 'node', id: id })
      setMulti([id])
      notifySelect(id)
      return [id]
    }

    function selectEdge(id) {
      if (!id) {
        clearSelection()
        return
      }
      setSel({ kind: 'edge', id: id })
      setMulti([])
      notifySelect(id)
    }

    function clearSelection() {
      setSel({ kind: null, id: null })
      setMulti([])
      notifySelect(null)
    }

    function removeNodes(ids) {
      if (readOnly) return
      const list = Array.isArray(ids) ? ids.filter(Boolean) : Array.from(ids || []).filter(Boolean)
      if (!list.length) return
      const removeSet = new Set(list)
      const current = workflowBase()
      const currentNodes = Array.isArray(current.nodes) ? current.nodes : []
      const currentEdges = Array.isArray(current.edges) ? current.edges : []
      const nextNodes = currentNodes.filter((node) => node && !removeSet.has(node.id))
      if (nextNodes.length === currentNodes.length) return
      const nextEdges = currentEdges.filter(
        (edge) => edge && edge.from && edge.to && !removeSet.has(edge.from.node) && !removeSet.has(edge.to.node),
      )
      emitWorkflow(Object.assign({}, current, { nodes: nextNodes, edges: nextEdges }))
      setSel({ kind: null, id: null })
      setMulti([])
      notifySelect(null)
    }

    function removeEdge(edgeId) {
      if (readOnly) return
      const current = workflowBase()
      const currentEdges = Array.isArray(current.edges) ? current.edges : []
      const nextEdges = currentEdges.filter((edge) => !edge || edge.id !== edgeId)
      if (nextEdges.length !== currentEdges.length) emitWorkflow(Object.assign({}, current, { edges: nextEdges }))
      setSel({ kind: null, id: null })
      setMulti([])
      notifySelect(null)
    }

    function deleteSelection() {
      if (readOnly) return
      if (connectRef.current) {
        cancelConnect()
        return
      }
      const current = selRef.current || { kind: null, id: null }
      if (current.kind === 'edge') {
        removeEdge(current.id)
        return
      }
      const currentMulti = multiRef.current || []
      const ids = currentMulti.length ? currentMulti : current.kind === 'node' && current.id ? [current.id] : []
      removeNodes(ids)
    }

    function changeParam(nodeId, paramId, value) {
      if (readOnly) return
      const current = workflowBase()
      const currentNodes = Array.isArray(current.nodes) ? current.nodes : []
      let changed = false
      const nextNodes = currentNodes.map((node) => {
        if (!node || node.id !== nodeId) return node
        changed = true
        const params = Object.assign({}, node.params || {})
        params[paramId] = value
        return Object.assign({}, node, { params: params })
      })
      if (changed) emitWorkflow(Object.assign({}, current, { nodes: nextNodes }))
    }

    function setNodeTitle(nodeId, title) {
      if (readOnly) return
      const current = workflowBase()
      const currentNodes = Array.isArray(current.nodes) ? current.nodes : []
      let changed = false
      const nextNodes = currentNodes.map((node) => {
        if (!node || node.id !== nodeId) return node
        changed = true
        return Object.assign({}, node, { title: title })
      })
      if (changed) emitWorkflow(Object.assign({}, current, { nodes: nextNodes }))
    }

    function cycleNodeEngine(node, def) {
      const p = propsRef.current
      if (!p || p.readOnly) return
      if (!def || (def.engine !== 'both' && def.engine)) return
      const current = node.engineOverride
      const next = current === 'cloud' ? 'local' : current === 'local' ? null : 'cloud'
      const currentWf = workflowBase()
      const currentNodes = Array.isArray(currentWf.nodes) ? currentWf.nodes : []
      const nextNodes = currentNodes.map((item) => {
        if (!item || item.id !== node.id) return item
        const copy = Object.assign({}, item)
        if (next) copy.engineOverride = next
        else delete copy.engineOverride
        return copy
      })
      emitWorkflow(Object.assign({}, currentWf, { nodes: nextNodes }))
    }

    function changeEngineMode(mode) {
      setEnginePref(mode)
      const p = propsRef.current
      if (!p) return
      if (typeof p.onEngineChange === 'function') {
        p.onEngineChange(mode)
        return
      }
      if (p.readOnly || typeof p.onChange !== 'function') return
      const current = workflowBase()
      const currentNodes = Array.isArray(current.nodes) ? current.nodes : []
      let changed = false
      const nextNodes = currentNodes.map((node) => {
        if (!node) return node
        const def = defsByIdRef.current[node.type]
        const flexible = !def || !def.engine || def.engine === 'both'
        if (!flexible) return node
        if (mode === 'auto') {
          if (!node.engineOverride) return node
          changed = true
          const copy = Object.assign({}, node)
          delete copy.engineOverride
          return copy
        }
        if (node.engineOverride !== mode) {
          changed = true
          return Object.assign({}, node, { engineOverride: mode })
        }
        return node
      })
      if (changed) emitWorkflow(Object.assign({}, current, { nodes: nextNodes }))
    }

    function addNodeFromDef(def, position) {
      if (!def || !def.id) return
      const p = propsRef.current
      if (!p || p.readOnly) return
      if (typeof p.onAddNode === 'function') {
        p.onAddNode(def, position || viewCenterWorld())
        return
      }
      const current = workflowBase()
      const currentNodes = Array.isArray(current.nodes) ? current.nodes : []
      const center = position || viewCenterWorld()
      let x = Math.round(center.x - nodeWidth(def) / 2)
      let y = Math.round(center.y - 40)
      let guard = 0
      while (guard < 12 && currentNodes.some((node) => node && Math.abs((Number(node.x) || 0) - x) < 12 && Math.abs((Number(node.y) || 0) - y) < 12)) {
        guard += 1
        x += 26
        y += 26
      }
      const id = nextNodeId(currentNodes)
      const node = { id: id, type: def.id, x: x, y: y, params: {}, title: '' }
      emitWorkflow(Object.assign({}, current, { nodes: currentNodes.concat([node]) }))
      setSel({ kind: 'node', id: id })
      setMulti([id])
      notifySelect(id)
    }

    function showTempPath(from, to, invalid) {
      const el = tempPathRef.current
      if (!el) return
      el.style.display = ''
      el.setAttribute('d', edgePath(from, to))
      if (invalid) el.classList.add('vcg-cv-invalid')
      else el.classList.remove('vcg-cv-invalid')
    }

    function hideTempPath() {
      const el = tempPathRef.current
      if (!el) return
      el.style.display = 'none'
      el.classList.remove('vcg-cv-invalid')
      el.setAttribute('d', '')
    }

    function buildConnection(fromPort, hoverPortInfo) {
      let outPort = null
      let inPort = null
      if (fromPort.dir === 'out' && hoverPortInfo.dir === 'in') {
        outPort = fromPort
        inPort = hoverPortInfo
      } else if (fromPort.dir === 'in' && hoverPortInfo.dir === 'out') {
        outPort = hoverPortInfo
        inPort = fromPort
      }
      if (!outPort || !inPort) return { ok: false }
      const check = validateConnection(
        { node: outPort.node, dir: 'out', port: outPort.port, type: outPort.type },
        { node: inPort.node, dir: 'in', port: inPort.port, type: inPort.type },
      )
      return { ok: check.ok, from: outPort, to: inPort, reason: check.reason }
    }

    /* ---------------------------------------------------------- gestures */
    function clearGestureCleanup() {
      const cleanup = gestureCleanupRef.current
      gestureCleanupRef.current = null
      if (typeof cleanup === 'function') {
        try {
          cleanup()
        } catch {
          /* ignore */
        }
      }
    }

    function startPan(event, clearWhenClick) {
      if (event.button !== 0 && event.button !== 1) return
      if (connectRef.current) return
      event.preventDefault()
      if (clearWhenClick) clearSelection()
      focusStage()
      const startView = { x: viewRef.current.x, y: viewRef.current.y, scale: viewRef.current.scale }
      const startX = event.clientX
      const startY = event.clientY
      let moved = false
      let frame = 0
      let lastDx = 0
      let lastDy = 0
      function cleanup() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        if (frame) {
          CAF(frame)
          frame = 0
        }
      }
      function onMove(moveEvent) {
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY
        lastDx = dx
        lastDy = dy
        if (!moved && Math.abs(dx) + Math.abs(dy) > 1) {
          moved = true
          setPanning(true)
        }
        if (frame) return
        frame = RAF(function applyPan() {
          frame = 0
          applyView({ x: startView.x + lastDx, y: startView.y + lastDy, scale: startView.scale })
        })
      }
      function onUp() {
        clearGestureCleanup()
        setPanning(false)
        if (!moved) return
        const finalView = { x: startView.x + lastDx, y: startView.y + lastDy, scale: startView.scale }
        applyView(finalView)
        commitView(finalView)
      }
      function onCancel() {
        clearGestureCleanup()
        setPanning(false)
      }
      clearGestureCleanup()
      gestureCleanupRef.current = cleanup
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
    }

    function startNodeDrag(event, node) {
      const p = propsRef.current
      if (!p || event.button !== 0) return
      if (connectRef.current) return
      if (spaceRef.current) {
        event.stopPropagation()
        startPan(event, false)
        return
      }
      const target = event.target
      if (target && target.closest && target.closest('input,textarea,select,button,a,label,[data-nodrag],[data-port-node]')) return
      event.stopPropagation()
      if (event.shiftKey) {
        selectNode(node.id, true)
        return
      }
      const nextMulti = selectNode(node.id, false)
      if (p.readOnly) return
      focusStage()
      const current = wfRef.current
      const currentNodes = Array.isArray(current.nodes) ? current.nodes : []
      const byId = {}
      for (const item of currentNodes) if (item && item.id) byId[item.id] = item
      const ids = (nextMulti && nextMulti.length ? nextMulti : [node.id]).filter((id) => byId[id])
      if (!ids.length) return
      const positions = {}
      for (const id of ids) positions[id] = { x: Number(byId[id].x) || 0, y: Number(byId[id].y) || 0 }
      const drag = {
        ids: ids,
        idSet: new Set(ids),
        positions: positions,
        startX: event.clientX,
        startY: event.clientY,
        scale: viewRef.current.scale,
        moved: false,
        dx: 0,
        dy: 0,
        frame: 0,
        wf: current,
        nodesById: byId,
        defsById: defsByIdRef.current,
        edges: Array.isArray(current.edges) ? current.edges : [],
      }
      function applyDrag() {
        if (!drag.moved) return
        for (const id of drag.ids) {
          const el = nodeElsRef.current[id]
          if (el) el.style.transform = 'translate3d(' + drag.dx + 'px,' + drag.dy + 'px,0)'
        }
        const worldDx = drag.dx / drag.scale
        const worldDy = drag.dy / drag.scale
        for (const edge of drag.edges) {
          if (!edge || !edge.from || !edge.to) continue
          const fromMoved = drag.idSet.has(edge.from.node)
          const toMoved = drag.idSet.has(edge.to.node)
          if (!fromMoved && !toMoved) continue
          const fromBase = drag.nodesById[edge.from.node]
          const toBase = drag.nodesById[edge.to.node]
          if (!fromBase || !toBase) continue
          const fromNode = fromMoved ? Object.assign({}, fromBase, { x: (Number(fromBase.x) || 0) + worldDx, y: (Number(fromBase.y) || 0) + worldDy }) : fromBase
          const toNode = toMoved ? Object.assign({}, toBase, { x: (Number(toBase.x) || 0) + worldDx, y: (Number(toBase.y) || 0) + worldDy }) : toBase
          const from = portPosition(fromNode, drag.defsById[fromNode.type], 'out', edge.from.port)
          const to = portPosition(toNode, drag.defsById[toNode.type], 'in', edge.to.port)
          const path = edgePath(from, to)
          const refs = edgeElsRef.current[edge.id]
          if (refs) {
            if (refs.main) refs.main.setAttribute('d', path)
            if (refs.hit) refs.hit.setAttribute('d', path)
          }
        }
      }
      function cleanup() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        if (drag.frame) {
          CAF(drag.frame)
          drag.frame = 0
        }
      }
      function onMove(moveEvent) {
        const dx = moveEvent.clientX - drag.startX
        const dy = moveEvent.clientY - drag.startY
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) return
        drag.moved = true
        drag.dx = dx
        drag.dy = dy
        if (drag.frame) return
        drag.frame = RAF(function onFrame() {
          drag.frame = 0
          applyDrag()
        })
      }
      function onUp() {
        clearGestureCleanup()
        if (!drag.moved) return
        if (drag.frame) {
          CAF(drag.frame)
          drag.frame = 0
        }
        const worldDx = Math.round(drag.dx / drag.scale)
        const worldDy = Math.round(drag.dy / drag.scale)
        for (const id of drag.ids) {
          const el = nodeElsRef.current[id]
          if (el) el.style.transform = ''
        }
        if (worldDx || worldDy) {
          const currentWf = wfRef.current
          const currentNodes = Array.isArray(currentWf.nodes) ? currentWf.nodes : []
          let changed = false
          const nextNodes = currentNodes.map((item) => {
            if (!item || !drag.positions[item.id]) return item
            changed = true
            return Object.assign({}, item, {
              x: Math.round(drag.positions[item.id].x + worldDx),
              y: Math.round(drag.positions[item.id].y + worldDy),
            })
          })
          if (changed) emitWorkflow(Object.assign({}, currentWf, { nodes: nextNodes }))
        }
        const primary = (selRef.current && selRef.current.id) || drag.ids[0]
        if (primary) notifySelect(primary)
      }
      function onCancel() {
        clearGestureCleanup()
        if (drag.frame) {
          CAF(drag.frame)
          drag.frame = 0
        }
        for (const id of drag.ids) {
          const el = nodeElsRef.current[id]
          if (el) el.style.transform = ''
        }
      }
      clearGestureCleanup()
      gestureCleanupRef.current = cleanup
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
    }

    function startConnect(event, node, dir, port) {
      const p = propsRef.current
      if (!p || p.readOnly || connectRef.current) return
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      focusStage()
      activeRef.current = true
      const def = resolveDef(node.type)
      const startPoint = portPosition(node, def, dir, port.id)
      const fromPort = { node: node.id, dir: dir, port: port.id, type: port.type || 'any' }
      const gesture = { from: fromPort, hover: null }
      connectRef.current = gesture
      setConnectState({ fromType: fromPort.type, fromDir: dir, fromNode: node.id })
      showTempPath(startPoint, startPoint, false)
      const stageRect = stageRef.current ? stageRef.current.getBoundingClientRect() : { left: 0, top: 0 }
      function portFromPoint(clientX, clientY) {
        const doc = typeof document !== 'undefined' ? document : null
        if (!doc || typeof doc.elementFromPoint !== 'function') return null
        const el = doc.elementFromPoint(clientX, clientY)
        const found = el && el.closest ? el.closest('[data-port-node]') : null
        if (!found) return null
        return {
          node: found.getAttribute('data-port-node'),
          dir: found.getAttribute('data-port-dir'),
          port: found.getAttribute('data-port-id'),
          type: found.getAttribute('data-port-type') || 'any',
        }
      }
      function onMove(moveEvent) {
        const point = canvasToWorld(
          { x: moveEvent.clientX - stageRect.left, y: moveEvent.clientY - stageRect.top },
          viewRef.current,
        )
        const target = portFromPoint(moveEvent.clientX, moveEvent.clientY)
        let invalid = false
        if (target) {
          const check = buildConnection(fromPort, target)
          invalid = !check.ok
          const same =
            gesture.hover &&
            gesture.hover.node === target.node &&
            gesture.hover.dir === target.dir &&
            gesture.hover.port === target.port &&
            gesture.hover.valid === check.ok
          if (!same) {
            gesture.hover = Object.assign({}, target, { valid: check.ok })
            setHoverPort(gesture.hover)
          }
        } else if (gesture.hover) {
          gesture.hover = null
          setHoverPort(null)
        }
        showTempPath(startPoint, point, invalid)
      }
      function cleanup() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
      }
      function onUp() {
        clearGestureCleanup()
        finishConnect(gesture)
      }
      function onCancel() {
        clearGestureCleanup()
        hideTempPath()
        setHoverPort(null)
        setConnectState(null)
        connectRef.current = null
      }
      clearGestureCleanup()
      gestureCleanupRef.current = cleanup
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
    }

    function cancelConnect() {
      if (!connectRef.current) return
      connectRef.current = null
      clearGestureCleanup()
      hideTempPath()
      setHoverPort(null)
      setConnectState(null)
    }

    function finishConnect(gesture) {
      hideTempPath()
      setHoverPort(null)
      setConnectState(null)
      connectRef.current = null
      if (!gesture || !gesture.from || !gesture.hover) return
      const built = buildConnection(gesture.from, gesture.hover)
      if (!built.ok || !built.from || !built.to) return
      const current = wfRef.current
      const currentEdges = Array.isArray(current.edges) ? current.edges : []
      const filtered = currentEdges.filter(
        (edge) => edge && edge.to && !(edge.to.node === built.to.node && edge.to.port === built.to.port),
      )
      const edge = {
        id: nextEdgeId(currentEdges),
        from: { node: built.from.node, port: built.from.port },
        to: { node: built.to.node, port: built.to.port },
      }
      emitWorkflow(Object.assign({}, current, { edges: filtered.concat([edge]) }))
    }

    /* ------------------------------------------------------ minimap gesture */
    function startMinimapDrag(event) {
      if (event.button !== 0) return
      event.stopPropagation()
      event.preventDefault()
      const info = miniMapRef.current
      if (!info || !info.scale) return
      const box = event.currentTarget.getBoundingClientRect()
      let frame = 0
      function applyCenter(clientX, clientY) {
        const mx = clientX - box.left
        const my = clientY - box.top
        const worldX = (mx - info.ox) / info.scale
        const worldY = (my - info.oy) / info.scale
        const size = viewSize()
        const scale = viewRef.current.scale
        applyView({ x: size.width / 2 - worldX * scale, y: size.height / 2 - worldY * scale, scale: scale })
        if (frame) return
        frame = RAF(function onMiniFrame() {
          frame = 0
          setView({ x: viewRef.current.x, y: viewRef.current.y, scale: viewRef.current.scale })
        })
      }
      applyCenter(event.clientX, event.clientY)
      function cleanup() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        if (frame) {
          CAF(frame)
          frame = 0
        }
      }
      function onMove(moveEvent) {
        applyCenter(moveEvent.clientX, moveEvent.clientY)
      }
      function onUp() {
        clearGestureCleanup()
        commitView(viewRef.current)
      }
      clearGestureCleanup()
      gestureCleanupRef.current = cleanup
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    }

    /* --------------------------------------------------------- drag & drop */
    function onLibraryDragStart(event, def) {
      if (!event || !event.dataTransfer || !def) return
      try {
        event.dataTransfer.setData('text/plain', 'vcg-node:' + def.id)
        event.dataTransfer.effectAllowed = 'copy'
      } catch {
        /* ignore */
      }
    }

    function onStageDragOver(event) {
      if (!event) return
      event.preventDefault()
      if (event.dataTransfer) {
        try {
          event.dataTransfer.dropEffect = 'copy'
        } catch {
          /* ignore */
        }
      }
    }

    function onStageDrop(event) {
      if (!event) return
      event.preventDefault()
      const dataTransfer = event.dataTransfer
      if (!dataTransfer) return
      let raw = ''
      try {
        raw = dataTransfer.getData('text/plain') || ''
      } catch {
        raw = ''
      }
      const type = String(raw).replace(/^vcg-node:/, '').trim()
      const def = defsByIdRef.current[type]
      if (!def) return
      const stageRect = stageRef.current ? stageRef.current.getBoundingClientRect() : { left: 0, top: 0 }
      const world = canvasToWorld(
        { x: event.clientX - stageRect.left, y: event.clientY - stageRect.top },
        viewRef.current,
      )
      addNodeFromDef(def, world)
    }

    /* ------------------------------------------------------------- pointer */
    function onStagePointerDown(event) {
      if (event.button === 2) {
        event.preventDefault()
        return
      }
      if (connectRef.current) return
      const target = event.target
      if (
        target &&
        target.closest &&
        target.closest('[data-node-id],[data-port-node],[data-edge-id],.vcg-cv-minimap,.vcg-cv-quick-btn')
      ) {
        return
      }
      if (event.button === 0 || event.button === 1) {
        const panOnly = event.button === 1 || spaceRef.current
        startPan(event, !panOnly)
      }
    }

    /* -------------------------------------------------------------- edges */
    function setEdgeRef(id, kind, el) {
      const map = edgeElsRef.current
      let entry = map[id]
      if (!entry) {
        entry = {}
        map[id] = entry
      }
      entry[kind] = el || null
    }

    function renderEdges() {
      const items = []
      for (const edge of edges) {
        if (!edge || !edge.from || !edge.to) continue
        const fromNode = nodesById[edge.from.node]
        const toNode = nodesById[edge.to.node]
        if (!fromNode || !toNode) continue
        const fromDef = resolveDef(fromNode.type)
        const toDef = resolveDef(toNode.type)
        const from = portPosition(fromNode, fromDef, 'out', edge.from.port)
        const to = portPosition(toNode, toDef, 'in', edge.to.port)
        const path = edgePath(from, to)
        const fromPorts = Array.isArray(fromDef.outputs) ? fromDef.outputs : []
        const fromPort = fromPorts.find((port) => port && port.id === edge.from.port)
        const color = portColor(fromPort && fromPort.type)
        const selected = sel.kind === 'edge' && sel.id === edge.id
        items.push(
          h(
            'g',
            { key: edge.id, className: 'vcg-cv-edge-group' },
            h('path', {
              ref: (el) => setEdgeRef(edge.id, 'main', el),
              className: 'vcg-cv-edge-main',
              d: path,
              fill: 'none',
              'stroke-width': selected ? 3 : 2,
              style: {
                stroke: selected ? 'var(--dsw-alias-brand-primary)' : color,
                opacity: selected ? 1 : 0.82,
              },
            }),
            h('path', {
              ref: (el) => setEdgeRef(edge.id, 'hit', el),
              className: 'vcg-cv-edge-hit',
              d: path,
              fill: 'none',
              'data-edge-id': edge.id,
              onPointerDown: (event) => {
                event.stopPropagation()
              },
              onClick: (event) => {
                event.stopPropagation()
                selectEdge(edge.id)
              },
            }),
          ),
        )
      }
      return h(
        'svg',
        {
          className: 'vcg-cv-edges',
          width: EDGE_SIZE,
          height: EDGE_SIZE,
          style: { left: -EDGE_HALF, top: -EDGE_HALF },
          'aria-hidden': true,
        },
        h(
          'g',
          { transform: 'translate(' + EDGE_HALF + ',' + EDGE_HALF + ')' },
          items,
          h('path', {
            ref: tempPathRef,
            className: 'vcg-cv-edge-temp',
            d: '',
            style: { display: 'none' },
          }),
        ),
      )
    }

    /* --------------------------------------------------------------- nodes */
    function renderNodeCard(node) {
      if (!node || !node.id) return null
      const def = resolveDef(node.type)
      const result = results[node.id]
      return h(NodeCard, {
        key: node.id,
        node: node,
        def: def,
        result: result,
        selected: sel.kind === 'node' && multi.indexOf(node.id) >= 0,
        readOnly: readOnly,
        running: running,
        connectedInputs: inputConnected,
        connect: connectState,
        hoverPort: hoverPort,
        modelOptions: modelOptions,
        onNodePointerDown: (event, item) => startNodeDrag(event, item),
        onPortPointerDown: (event, item, dir, port, index) => startConnect(event, item, dir, port, index),
        onCycleEngine: (item, itemDef) => cycleNodeEngine(item, itemDef),
        onDelete: (id) => removeNodes([id]),
        onRun:
          typeof props.onRunNode === 'function'
            ? (id) => {
                const p = propsRef.current
                if (p && typeof p.onRunNode === 'function' && !p.running) p.onRunNode(id)
              }
            : null,
        onRename: (id, title) => setNodeTitle(id, title),
        onParamChange: (id, paramId, value) => changeParam(id, paramId, value),
        onOpen: (id) => {
          const p = propsRef.current
          if (p && typeof p.onSelectNode === 'function') p.onSelectNode(id)
        },
        onPreview: (item) => setPreview(item),
        registerEl: (id, el) => {
          if (el) nodeElsRef.current[id] = el
          else delete nodeElsRef.current[id]
        },
      })
    }

    /* ------------------------------------------------------------- toolbar */
    function renderToolbar() {
      const percent = Math.round(viewRef.current.scale * 100)
      const activeEngine = typeof props.engine === 'string' ? props.engine : enginePref
      const engineModes = [
        { id: 'auto', label: t('cvEngineAuto') },
        { id: 'cloud', label: t('cloud') },
        { id: 'local', label: t('local') },
      ]
      return h(
        'div',
        {
          className: 'vcg-cv-toolbar',
          onContextMenu: (event) => {
            event.preventDefault()
            event.stopPropagation()
          },
        },
        h(
          IconButton,
          { label: t('cvToggleLib'), title: t('cvToggleLib'), onClick: () => setLibraryOpen(!libraryOpen) },
          h(Glyph, { name: 'panel', size: 15 }),
        ),
        h('div', { className: 'vcg-cv-tb-title', title: workflowName }, workflowName),
        h('span', { className: 'vcg-cv-tb-meta' }, nodes.length + ' ' + t('cvNodes') + ' · ' + edges.length + ' ' + t('cvEdges')),
        h('span', { className: 'vcg-cv-tb-spacer' }),
        props.headerExtra || null,
        running
          ? props.onStop
            ? h(Button, { variant: 'danger', size: 'sm', icon: 'stop', onClick: props.onStop }, t('stop'))
            : h(Button, { size: 'sm', icon: 'stop', disabled: true }, t('cvRunning'))
          : h(
              Button,
              {
                variant: 'primary',
                size: 'sm',
                icon: 'play',
                disabled: !props.onRunAll || running,
                onClick: () => {
                  const p = propsRef.current
                  if (p && typeof p.onRunAll === 'function' && !p.running) p.onRunAll()
                },
              },
              t('runAll'),
            ),
        h('span', { className: 'vcg-cv-tb-sep' }),
        h(
          'div',
          { className: 'vcg-cv-seg', title: t('cvEngineHint') },
          engineModes.map((mode) =>
            h(
              'button',
              {
                key: mode.id,
                type: 'button',
                className: 'vcg-cv-seg-btn' + (activeEngine === mode.id ? ' vcg-cv-seg-btn-active' : ''),
                disabled: readOnly,
                onClick: () => changeEngineMode(mode.id),
              },
              mode.label,
            ),
          ),
        ),
        h('span', { className: 'vcg-cv-tb-sep' }),
        h(
          TBtn,
          { title: t('cvZoomOut'), onClick: () => zoomRelative(1 / 1.2), disabled: viewRef.current.scale <= MIN_SCALE + 0.0001 },
          h(Glyph, { name: 'zoomout', size: 14 }),
        ),
        h(TBtn, { title: t('cvZoomReset') + ' · ' + percent + '%', className: 'vcg-cv-zoompct', onClick: resetZoom }, percent + '%'),
        h(
          TBtn,
          { title: t('cvZoomIn'), onClick: () => zoomRelative(1.2), disabled: viewRef.current.scale >= MAX_SCALE - 0.0001 },
          h(Glyph, { name: 'zoomin', size: 14 }),
        ),
        h(TBtn, { title: t('cvFit'), onClick: fitAll }, h(Glyph, { name: 'fit', size: 14 })),
        h(TBtn, { title: t('cvMinimap'), active: miniOpen, onClick: () => setMiniOpen(!miniOpen) }, h(Glyph, { name: 'grid', size: 14 })),
        props.outputDirHint
          ? h(
              'span',
              { className: 'vcg-cv-outdir', title: props.outputDirHint },
              h(Glyph, { name: 'folder', size: 12 }),
              h('span', { className: 'vcg-cv-outdir-text' }, props.outputDirHint),
            )
          : null,
        readOnly ? h('span', { className: 'vcg-cv-readonly' }, t('cvReadOnly')) : null,
      )
    }

    /* --------------------------------------------------------------- empty */
    function quickDefs() {
      if (!nodeDefs.length || readOnly) return []
      const priority = ['prompt-input', 'ksampler', 'image-output', 'model-loader']
      const picked = []
      for (const id of priority) {
        const found = nodeDefs.find((def) => def && def.id === id)
        if (found && picked.indexOf(found) < 0) picked.push(found)
      }
      for (const def of nodeDefs) {
        if (picked.length >= 4) break
        if (def && picked.indexOf(def) < 0) picked.push(def)
      }
      return picked.slice(0, 4)
    }

    function renderEmptyGuide() {
      if (nodes.length) return null
      const picked = quickDefs()
      return h(
        'div',
        { className: 'vcg-cv-empty' },
        h('div', { className: 'vcg-cv-empty-icon' }, h(Glyph, { name: 'layers', size: 34 })),
        h('div', { className: 'vcg-cv-empty-title' }, t('cvEmptyTitle')),
        h('div', { className: 'vcg-cv-empty-hint' }, nodeDefs.length ? t('cvEmptyHint') : t('cvNoDefsHint')),
        picked.length
          ? h(
              'div',
              { className: 'vcg-cv-quick' },
              picked.map((def) =>
                h(
                  'button',
                  {
                    key: def.id,
                    type: 'button',
                    className: 'vcg-cv-quick-btn',
                    onPointerDown: stopEvent,
                    onClick: () => addNodeFromDef(def),
                  },
                  h(Glyph, { name: 'plus', size: 12 }),
                  def.nameZh || def.name || def.id,
                ),
              ),
            )
          : null,
      )
    }

    /* -------------------------------------------------------------- minimap */
    function renderMinimap() {
      if (!miniOpen || !nodes.length) return null
      const defs = defsByIdRef.current || {}
      const bounds = nodesBounds(nodes, defs, null)
      if (!bounds) return null
      const pad = 8
      const scale = Math.min((MINI_W - pad * 2) / Math.max(bounds.width, 60), (MINI_H - pad * 2) / Math.max(bounds.height, 60))
      const ox = pad + (MINI_W - pad * 2 - bounds.width * scale) / 2 - bounds.minX * scale
      const oy = pad + (MINI_H - pad * 2 - bounds.height * scale) / 2 - bounds.minY * scale
      miniMapRef.current = { scale: scale, ox: ox, oy: oy }
      const v = viewRef.current
      const size = viewSize()
      const viewX = (0 - v.x) / v.scale
      const viewY = (0 - v.y) / v.scale
      const viewW = size.width / v.scale
      const viewH = size.height / v.scale
      return h(
        'div',
        {
          className: 'vcg-cv-minimap',
          style: { width: MINI_W, height: MINI_H },
          title: t('cvMinimap'),
          onPointerDown: startMinimapDrag,
          onContextMenu: (event) => {
            event.preventDefault()
            event.stopPropagation()
          },
        },
        h(
          'svg',
          { width: MINI_W, height: MINI_H },
          nodes.map((node) => {
            if (!node || !node.id) return null
            const def = resolveDef(node.type)
            const w = Math.max(2, nodeWidth(def) * scale)
            const hgt = Math.max(3, estimateNodeHeight(def) * scale)
            return h('rect', {
              key: node.id,
              className: 'vcg-cv-mini-node',
              x: (Number(node.x) || 0) * scale + ox,
              y: (Number(node.y) || 0) * scale + oy,
              width: w,
              height: hgt,
              rx: 1.5,
            })
          }),
          h('rect', {
            className: 'vcg-cv-mini-view',
            x: viewX * scale + ox,
            y: viewY * scale + oy,
            width: Math.max(4, viewW * scale),
            height: Math.max(4, viewH * scale),
            rx: 2,
          }),
        ),
      )
    }

    /* ------------------------------------------------------------ overlays */
    function renderConnectHint() {
      if (!connectState) return null
      const invalid = hoverPort && !hoverPort.valid
      const label = hoverPort ? (hoverPort.valid ? t('cvConnectRelease') : t('cvInvalidTarget')) : t('cvConnectHint')
      return h('div', { className: 'vcg-cv-connect-hint' + (invalid ? ' vcg-cv-invalid' : '') }, label)
    }

    function renderPreview() {
      if (!preview) return null
      const location = preview.path || preview.url || ''
      const footer = h(
        'div',
        { className: 'vcg-row', style: { gap: 8, alignItems: 'center', minWidth: 0, width: '100%' } },
        h(
          'span',
          { className: 'vcg-subtitle', style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, title: location },
          location,
        ),
        preview.url && /^https?:/i.test(preview.url)
          ? h('a', { className: 'vcg-btn vcg-btn-sm', href: preview.url, target: '_blank', rel: 'noopener noreferrer' }, t('cvOpen'))
          : null,
        h(
          Button,
          {
            size: 'sm',
            onClick: () => {
              if (typeof V.copyText === 'function' && location) V.copyText(location)
            },
          },
          t('cvCopyPath'),
        ),
      )
      return h(
        Modal,
        {
          open: true,
          title: preview.label || t('cvPreview'),
          onClose: () => setPreview(null),
          footer: footer,
          width: 'min(880px,100%)',
        },
        h(
          'div',
          { className: 'vcg-cv-preview' },
          preview.kind === 'video'
            ? h('video', { src: preview.src, controls: true, autoPlay: true, loop: true })
            : h('img', { src: preview.src, alt: preview.label || '' }),
        ),
        location ? h('div', { className: 'vcg-cv-preview-meta' }, location) : null,
      )
    }

    /* ------------------------------------------------------------ effects */
    React.useEffect(() => {
      const el = stageRef.current
      if (!el) return undefined
      const update = () => setStageSize({ width: el.clientWidth || 0, height: el.clientHeight || 0 })
      update()
      if (typeof ResizeObserver === 'function') {
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
      }
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }, [])

    React.useEffect(() => {
      const el = stageRef.current
      if (!el) return undefined
      function onWheel(event) {
        event.preventDefault()
        const rect = el.getBoundingClientRect()
        const v = viewRef.current
        const rawDelta =
          event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * 100 : event.deltaY
        const delta = clampNumber(rawDelta, -120, 120)
        const factor = Math.exp(-delta * 0.0016)
        const nextScale = clampScale(v.scale * factor)
        if (Math.abs(nextScale - v.scale) < 0.0001) return
        const px = event.clientX - rect.left
        const py = event.clientY - rect.top
        const wx = (px - v.x) / v.scale
        const wy = (py - v.y) / v.scale
        applyView({ x: px - wx * nextScale, y: py - wy * nextScale, scale: nextScale })
        if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
        wheelTimerRef.current = setTimeout(() => {
          wheelTimerRef.current = null
          const commit = actionsRef.current && actionsRef.current.commitView
          if (commit) commit(viewRef.current)
        }, 180)
      }
      el.addEventListener('wheel', onWheel, { passive: false })
      return () => {
        el.removeEventListener('wheel', onWheel)
        if (wheelTimerRef.current) {
          clearTimeout(wheelTimerRef.current)
          wheelTimerRef.current = null
        }
      }
    }, [])

    React.useEffect(() => {
      function onPointerDown(event) {
        const el = stageRef.current
        activeRef.current = Boolean(el && el.contains(event.target))
      }
      document.addEventListener('pointerdown', onPointerDown, true)
      return () => document.removeEventListener('pointerdown', onPointerDown, true)
    }, [])

    React.useEffect(() => {
      function onKeyDown(event) {
        if (isTypingTarget(event.target)) return
        if (!activeRef.current) return
        if (event.isComposing) return
        if (previewRef.current) return
        const acts = actionsRef.current || {}
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault()
          if (typeof acts.deleteSelection === 'function') acts.deleteSelection()
          return
        }
        if (event.key === 'Escape') {
          if (typeof acts.cancelConnect === 'function') acts.cancelConnect()
          if (typeof acts.clearSelection === 'function') acts.clearSelection()
          return
        }
        if (event.key === ' ') {
          if (!spaceRef.current) {
            spaceRef.current = true
            setSpaceDown(true)
          }
          event.preventDefault()
          return
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          const p = propsRef.current
          if (p && typeof p.onRunAll === 'function' && !p.running) {
            event.preventDefault()
            p.onRunAll()
          }
        }
      }
      function onKeyUp(event) {
        if (event.key === ' ') {
          spaceRef.current = false
          setSpaceDown(false)
        }
      }
      function onBlur() {
        spaceRef.current = false
        setSpaceDown(false)
      }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      window.addEventListener('blur', onBlur)
      return () => {
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
        window.removeEventListener('blur', onBlur)
      }
    }, [])

    React.useEffect(
      () => () => {
        clearGestureCleanup()
        if (wheelTimerRef.current) {
          clearTimeout(wheelTimerRef.current)
          wheelTimerRef.current = null
        }
      },
      [],
    )

    /* sync controlled selectedId */
    React.useEffect(() => {
      const id = props.selectedId
      const current = selRef.current || { kind: null, id: null }
      if (id == null && current.id == null) return
      if (id != null && id === current.id) return
      if (id == null) {
        setSel({ kind: null, id: null })
        setMulti([])
        return
      }
      const kind = nodesById[id] ? 'node' : findEdgeById(edges, id) ? 'edge' : null
      if (!kind) {
        setSel({ kind: null, id: null })
        setMulti([])
        return
      }
      setSel({ kind: kind, id: id })
      setMulti(kind === 'node' ? [id] : [])
    }, [props.selectedId])

    /* adopt externally changed viewport (new/loaded workflow) */
    React.useEffect(() => {
      const vp = props.workflow && props.workflow.viewport
      if (!vp || typeof vp !== 'object') return
      const next = resolveViewport(vp)
      const current = viewRef.current
      if (viewportsEqual(next, current)) return
      const last = lastSentViewRef.current
      if (last && viewportsEqual(next, last)) return
      viewRef.current = next
      setView(next)
    }, [props.workflow && props.workflow.viewport])

    /* initial auto-fit when the workflow does not fit in view */
    React.useEffect(() => {
      if (didFitRef.current) return
      if (!stageSize.width || !stageSize.height) return
      if (!nodes.length) return
      didFitRef.current = true
      const defs = defsByIdRef.current || {}
      const bounds = nodesBounds(nodes, defs, measuredSizes())
      if (!bounds) return
      const fits =
        bounds.minX >= 0 &&
        bounds.minY >= 0 &&
        bounds.maxX <= stageSize.width &&
        bounds.maxY <= stageSize.height
      if (!fits && workflow.viewport && viewportsEqual(resolveViewport(workflow.viewport), { x: 0, y: 0, scale: 1 })) {
        fitAll()
      } else if (!fits && !workflow.viewport) {
        fitAll()
      }
    }, [stageSize.width, stageSize.height, nodes.length])

    /* keep action refs fresh for window listeners */
    actionsRef.current = {
      deleteSelection: deleteSelection,
      clearSelection: clearSelection,
      cancelConnect: cancelConnect,
      commitView: commitView,
      fitAll: fitAll,
      resetZoom: resetZoom,
    }

    /* ---------------------------------------------------------------- view */
    const currentView = viewRef.current
    const gridStyle = { backgroundPosition: currentView.x + 'px ' + currentView.y + 'px' }
    const worldStyle = {
      transform:
        'translate3d(' + currentView.x + 'px,' + currentView.y + 'px,0) scale(' + currentView.scale + ')',
    }
    const stageClass =
      'vcg-cv-stage' + (panning ? ' vcg-cv-panning' : '') + (spaceDown && !panning ? ' vcg-cv-space' : '')

    const stage = h(
      'div',
      {
        ref: stageRef,
        className: stageClass,
        tabIndex: 0,
        role: 'application',
        'aria-label': t('canvas'),
        onPointerDown: onStagePointerDown,
        onFocus: () => {
          activeRef.current = true
        },
        onMouseDown: (event) => {
          if (event.button === 1) event.preventDefault()
        },
        onAuxClick: (event) => event.preventDefault(),
        onContextMenu: (event) => {
          event.preventDefault()
          event.stopPropagation()
        },
        onDragOver: onStageDragOver,
        onDrop: onStageDrop,
      },
      h('div', { className: 'vcg-cv-grid', ref: gridRef, style: gridStyle }),
      h(
        'div',
        { className: 'vcg-cv-world', ref: worldRef, style: worldStyle },
        renderEdges(),
        nodes.map(renderNodeCard),
      ),
      renderEmptyGuide(),
      renderMinimap(),
      nodes.length ? h('div', { className: 'vcg-cv-help' }, t('cvPanHint')) : null,
      renderConnectHint(),
    )

    return h(
      V.Fragment,
      null,
      typeof V.styleTag === 'function' ? V.styleTag(CSS) : null,
      h(
        'div',
        {
          className: 'vcg-cv-root',
          'data-vcg-canvas': 'true',
          onContextMenu: (event) => {
            event.preventDefault()
            event.stopPropagation()
          },
        },
        libraryOpen
          ? h(NodeLibrary, {
              defs: nodeDefs,
              readOnly: readOnly,
              onAdd: (def) => addNodeFromDef(def),
              onDragStart: onLibraryDragStart,
            })
          : null,
        h('div', { className: 'vcg-cv-main' }, renderToolbar(), h('div', { className: 'vcg-cv-stage-wrap' }, stage)),
        renderPreview(),
      ),
    )
  }

  V.Canvas = Canvas
})(V);

;
/* ==== part: settings.js ==== */
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
    const out = { image: [], video: [], text: [] }
    if (Array.isArray(models)) {
      out.image = models.map(String)
      return out
    }
    if (models && typeof models === 'object') {
      for (const cap of CAPS) out[cap] = asArray(models[cap]).map(String)
    }
    return out
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

  function ProviderCard({ provider, onChange, onModelText, onRemove }) {
    const configured = provider.apiKeyConfigured
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
    )
  }

  function DetectPanel({ detect, detecting, error, onApply, onDetect }) {
    const data = detect || {}
    const candidates = asArray(data.candidates)
    const globalModels = data.globalModels && typeof data.globalModels === 'object' ? data.globalModels : {}
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
            candidates.map((candidate, index) =>
              h(
                'div',
                { key: (candidate && candidate.id) || index, className: 'vcg-set-candidate' },
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
              ),
            ),
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
      const models = asArray(test.models).map((model) => (typeof model === 'string' ? model : model && (model.id || model.name))).filter(Boolean)
      return h(
        Banner,
        { kind: 'success', title: t('setTestOk') },
        h(
          'div',
          { className: 'vcg-row', style: { flexWrap: 'wrap' } },
          test.latencyMs !== undefined ? h(Badge, null, t('setLatency') + ' ' + test.latencyMs + 'ms') : null,
          test.mode ? h(Badge, null, t('setTestMode') + ' ' + test.mode) : null,
          models.length ? h('span', { className: 'vcg-subtitle' }, t('setModels') + '：' + models.join(' / ')) : null,
        ),
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

;
/* ==== part: studio.js ==== */
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
    IconButton,
    Modal,
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
    const [fullscreen, setFullscreen] = React.useState(false)
    const [debugBusy, setDebugBusy] = React.useState(false)
    const [debugReport, setDebugReport] = React.useState(null)
    const [debugError, setDebugError] = React.useState('')
    React.useEffect(() => {
      if (!fullscreen) return undefined
      const onKey = (event) => {
        if (event.key === 'Escape') setFullscreen(false)
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }, [fullscreen])
    const debugRun = async () => {
      if (!workflow || debugBusy) return
      setDebugBusy(true)
      setDebugError('')
      try {
        const report = await V.rpc('debugWorkflow', { key: scopeKey, workflow })
        setDebugReport(report)
      } catch (error) {
        setDebugError(msgOf(error))
      } finally {
        setDebugBusy(false)
      }
    }
    return h(
      'div',
      { className: 'vcg-studio-canvas-panel' + (fullscreen ? ' vcg-studio-canvas-panel-full' : '') },
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
            Button,
            { variant: 'primary', size: 'sm', onClick: onRunAll, disabled: running || !workflow, icon: running ? undefined : 'play' },
            running ? '运行中…' : '运行工作流',
          ),
          h(
            Button,
            { size: 'sm', onClick: debugRun, disabled: debugBusy || running || !workflow, icon: debugBusy ? undefined : 'check', title: 'Debug 运行：只校验模型能否加载、工作流/节点完整性与安全性，不生成内容' },
            debugBusy ? '校验中…' : 'Debug 运行',
          ),
          h(
            IconButton,
            { label: fullscreen ? '退出全屏' : '全屏画布', title: fullscreen ? '退出全屏（Esc）' : '全屏画布', onClick: () => setFullscreen((value) => !value) },
            h(Glyph, { name: fullscreen ? 'close' : 'fit', size: 15 }),
          ),
          h(
            Field,
            { label: t('stuScope'), style: { minWidth: 190 } },
            h(Select, { value: scopeKey, options: scopeOptions, onChange: onScopeChange }),
          ),
          h(
            Button,
            { size: 'sm', onClick: onSave, disabled: saving, icon: saving ? undefined : 'save' },
            saving ? t('saving') : t('stuSaveCanvas'),
          ),
        ),
      ),
      outputDirHint ? h('div', { className: 'vcg-studio-canvas-hint' }, outputDirHint) : null,
      debugError ? h('div', { style: { padding: '0 12px 6px' } }, h(Banner, { kind: 'error', title: 'Debug 运行失败' }, debugError)) : null,
      h(Modal, {
        open: Boolean(debugReport),
        title: 'Debug 运行报告（不生成内容）',
        onClose: () => setDebugReport(null),
        width: 'min(760px,100%)',
        footer: [
          h('span', { key: 'hint', className: 'vcg-subtitle', style: { flex: 1 } }, debugReport && debugReport.ok ? '所有必需检查通过，可以正式运行。' : '存在失败项，请按提示修正后再运行。'),
          h(Button, { key: 'close', onClick: () => setDebugReport(null) }, '关闭'),
          debugReport && debugReport.ok
            ? h(Button, { key: 'run', variant: 'primary', icon: 'play', onClick: () => { setDebugReport(null); onRunAll() } }, '正式运行')
            : null,
        ],
      }, h(V.ui.DebugReport, { report: debugReport })),
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
.vcg-studio-canvas-panel-full{position:fixed;inset:0;z-index:80;background:var(--dsw-alias-bg-base);height:100vh;width:100vw;box-shadow:0 0 0 1px var(--dsw-alias-border-l2)}
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

;
/* ==== part: panel.js ==== */
/* ============================================================================
 * VCG 视觉控制生成器 — 侧栏图标
 * Visual Control Generator — sidebar panel icon (V.PanelIcon).
 *
 * 品牌图形：节点连线 + 星芒（当前颜色 currentColor，宿主高亮面板时自动适配）。
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { h } = V

  const SVG_LABEL = 'VCG 视觉控制生成器'

  function PanelIcon(props) {
    const size = (props && (props.size || props.width || props.height)) || 18
    return h(
      'svg',
      {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        className: 'vcg-panel-icon',
        role: 'img',
        'aria-label': SVG_LABEL,
        'aria-hidden': undefined,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'block', flex: 'none' },
      },
      /* 连线：三节点环形连接，代表节点式工作流 */
      h('path', { d: 'M7.4 7.4l9.2 1.1' }),
      h('path', { d: 'M6.9 9.6l3.4 7.1' }),
      h('path', { d: 'M17.6 9.8l-6.6 6.6' }),
      /* 节点 */
      h('circle', { cx: 5.4, cy: 7, r: 2.2, fill: 'currentColor', stroke: 'none' }),
      h('circle', { cx: 18.7, cy: 9.5, r: 2.2, fill: 'currentColor', stroke: 'none' }),
      h('circle', { cx: 11.7, cy: 18.6, r: 2.2, fill: 'currentColor', stroke: 'none' }),
      /* 星芒（生成 / AI） */
      h('path', {
        d: 'M19.4 1.6l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z',
        fill: 'currentColor',
        stroke: 'none',
      }),
      /* 中心连线小点 */
      h('circle', { cx: 11.9, cy: 11.2, r: 1.1, fill: 'currentColor', stroke: 'none', opacity: 0.9 }),
    )
  }

  V.PanelIcon = PanelIcon
})(V)

;
/* ==== part: repo.js ==== */
/* ============================================================================
 * VCG 视觉控制生成器 — 节点工作流仓库页（侧栏「VCG 节点工作流仓库」）
 * Visual Control Generator — node/workflow repository browser (V.NodeRepoPage).
 *
 * 浏览 DSH_VCG_repo 节点仓库：分类 + 搜索 + 卡片网格 + 节点详情 Modal，
 * 按需导入节点（专业模式保护）、查看仓库工作流、管理已安装自定义节点。
 * 所有数据走 V.rpc，纯 React.createElement，无 JSX / 无模块 import；
 * 视觉只使用宿主主题 token（--dsw-alias-*）与 V.consts 颜色。
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { React, h } = V
  const {
    Button,
    TextInput,
    Select,
    Banner,
    Spinner,
    Badge,
    Modal,
    Empty,
    StyleTag,
  } = V.ui

  /* ------------------------------------------------------------- locales */

  V.addDict(
    {
      repoTitle: 'VCG 节点工作流仓库',
      repoDesc: '浏览 DSH_VCG_repo 节点仓库中的节点与工作流定义，按分类挑选需要的节点导入本地节点库；导入后即可在画布中使用。',
      repoSourceLabel: '仓库来源',
      repoSourceAuto: '自动（优先 GitHub）',
      repoSourceGithub: 'GitHub',
      repoSourceGitea: 'Gitea',
      repoGithubBase: 'GitHub raw 源',
      repoGiteaBase: 'Gitea raw 源',
      repoCurrentBase: '当前拉取地址',
      repoNotConfigured: '未配置',
      repoAddressHint: '仓库地址来自设置（只读）。修改请到「设置 → VCG 视觉控制生成器 → 节点仓库」。',
      repoRefresh: '刷新仓库',
      repoRefreshing: '刷新中…',
      repoSyncAll: '全部同步',
      repoSyncing: '同步中…',
      repoSyncDone: '仓库同步完成',
      repoSyncFailed: '仓库同步失败',
      repoSyncSummary: '节点 {nodes} 个 · 工作流 {workflows} 个',
      repoFetchFailed: '仓库列表加载失败',
      repoLoadFailed: '仓库加载失败',
      repoRetry: '重试',
      repoFetchedAt: '拉取时间',
      repoVersion: '仓库版本',
      repoCounts: '节点 {nodes} · 工作流 {workflows}',
      repoConfigureHint: '未配置节点仓库地址。请到「设置 → VCG 视觉控制生成器 → 节点仓库」填写 GitHub / Gitea raw 源后再刷新。',
      repoOpenSettings: '去设置中配置',
      repoWarnings: '仓库警告',
      repoProOn: '专业模式已开启',
      repoProOff: '专业模式未开启',
      repoProHintTitle: '专业模式提示',
      repoProHint: '该节点通过 HTTP 调用外部 API，导入前需要在「设置 → VCG 视觉控制生成器 → 专业模式」中开启专业模式。',
      repoNodePro: '专业模式',
      repoHttpNode: 'HTTP 节点',
      repoSearchPh: '搜索节点名称 / 中文名 / id / 描述',
      repoAll: '全部',
      repoNodesTitle: '仓库节点',
      repoBrowserHint: '点击卡片查看节点详情，勾选后可批量导入。',
      repoNodesEmpty: '没有匹配的节点',
      repoNodesEmptyHint: '换个分类或清空搜索词试试；也可以在顶部切换仓库来源。',
      repoLoading: '正在拉取节点仓库…',
      repoPortsValue: '输入 {inputs} · 输出 {outputs}',
      repoParamsCount: '参数 {count}',
      repoInstalled: '已安装',
      repoNeedPro: '需专业模式',
      repoAvailable: '可导入',
      repoDetails: '详情',
      repoSelectNode: '选择节点 {name}',
      repoNoDescription: '（暂无描述）',
      repoImport: '导入节点',
      repoImporting: '导入中…',
      repoImportSelected: '导入所选 {count} 个',
      repoClearSelection: '清空选择',
      repoSelectAll: '全选可导入',
      repoSelectedCount: '已选 {count} 个',
      repoNoSelection: '请先勾选要导入的节点。',
      repoBulkTitle: '批量导入结果',
      repoBulkSummary: '成功 {ok} 个 · 失败 {fail} 个',
      repoBulkProgress: '导入中 {done}/{total}',
      repoImportSuccessTitle: '节点导入成功',
      repoImportOk: '已导入 {name}',
      repoImportFailed: '导入失败',
      repoImportNeedProTitle: '该节点需要专业模式',
      repoCannotImport: '该节点当前不可导入。',
      repoInstalledHint: '该节点已安装，可直接在画布中使用。',
      repoPortsInputs: '输入端口',
      repoPortsOutputs: '输出端口',
      repoNoPorts: '无',
      repoOptional: '可选',
      repoParamsTitle: '参数',
      repoNoParams: '无参数',
      repoParamDefault: '默认',
      repoParamRange: '范围',
      repoParamOptions: '可选值',
      repoExecutorTitle: '执行器',
      repoExecutorKind: '类型',
      repoExecutorBuiltin: '内置执行器',
      repoExecutorFn: '内置函数',
      repoExecutorHttp: 'HTTP 请求',
      repoExecutorComfy: 'ComfyUI 节点',
      repoRequestUrl: '请求地址',
      repoRequestMethod: '请求方法',
      repoRequestHeaders: '请求头字段',
      repoRequestTimeout: '超时（毫秒）',
      repoResponse: '响应取值字段',
      repoCloudTitle: '云端能力',
      repoCloudCapability: '能力',
      repoCloudApi: '所需 API',
      repoCloudNotes: '说明',
      repoCapImage: '图像',
      repoCapVideo: '视频',
      repoCapText: '文本',
      repoCapNone: '无',
      repoLocalTitle: '本地 ComfyUI',
      repoLocalClassType: 'class_type',
      repoLocalMap: '字段映射',
      repoLocalMapCount: '{count} 项',
      repoLocalNone: '未声明本地 ComfyUI 映射',
      repoSourceBadge: '来源',
      repoDetailId: '节点 id',
      repoDetailCategory: '分类',
      repoDetailEngine: '引擎',
      repoInstalledTitle: '已安装自定义节点',
      repoInstalledDesc: '通过专业模式 JSON 导入或本页导入的自定义节点。节点仓库同步的节点不在此处删除。',
      repoInstalledEmpty: '还没有导入自定义节点。可从上方节点卡片导入。',
      repoDelete: '删除',
      repoConfirmDelete: '确认删除？',
      repoDeleteOk: '已删除节点 {id}',
      repoDeleteFail: '删除节点失败',
      repoDeleting: '删除中…',
      repoDeleteSuccessTitle: '节点删除成功',
      repoWorkflowsTitle: '仓库工作流',
      repoWorkflowsDesc: '仓库自带的示例工作流（随节点仓库同步）。本页仅展示，不提供导入。',
      repoWorkflowsEmpty: '仓库没有提供工作流。',
      repoWorkflowNodes: '{count} 个节点',
      repoWorkflowInstalled: '已可用',
      repoWorkflowMissing: '未同步',
      repoWorkflowHint: '打开工作流请到「VCG 工作台 → 工作流」；仓库地址可在设置中配置。',
      repoSettingsLink: '在设置中配置仓库地址',
      repoSettingsUnavailableTitle: '无法打开设置页',
      repoSettingsUnavailable: '请手动打开「设置 → VCG 视觉控制生成器」调整节点仓库或专业模式。',
      repoStoreError: '宿主状态加载失败',
      repoNoMatch: '没有匹配结果',
      repoCategoryEmpty: '该分类下暂无节点',
      repoStoreLoading: '正在加载宿主状态…',
    },
    {
      repoTitle: 'VCG Node & Workflow Repository',
      repoDesc: 'Browse node and workflow definitions in the DSH_VCG_repo repository, filter them by category, and import the nodes you need into the local node library.',
      repoSourceLabel: 'Repository source',
      repoSourceAuto: 'Auto (prefer GitHub)',
      repoSourceGithub: 'GitHub',
      repoSourceGitea: 'Gitea',
      repoGithubBase: 'GitHub raw source',
      repoGiteaBase: 'Gitea raw source',
      repoCurrentBase: 'Current base URL',
      repoNotConfigured: 'Not configured',
      repoAddressHint: 'Addresses come from Settings (read-only). Edit them in Settings → VCG Visual Control Generator → Node repository.',
      repoRefresh: 'Refresh repository',
      repoRefreshing: 'Refreshing…',
      repoSyncAll: 'Sync all',
      repoSyncing: 'Syncing…',
      repoSyncDone: 'Repository sync complete',
      repoSyncFailed: 'Repository sync failed',
      repoSyncSummary: '{nodes} nodes · {workflows} workflows',
      repoFetchFailed: 'Failed to load the repository',
      repoLoadFailed: 'Failed to load the repository',
      repoRetry: 'Retry',
      repoFetchedAt: 'Fetched at',
      repoVersion: 'Repository version',
      repoCounts: '{nodes} nodes · {workflows} workflows',
      repoConfigureHint: 'No node repository address configured. Fill in a GitHub / Gitea raw source in Settings → VCG Visual Control Generator → Node repository, then refresh.',
      repoOpenSettings: 'Open Settings',
      repoWarnings: 'Repository warnings',
      repoProOn: 'Pro mode on',
      repoProOff: 'Pro mode off',
      repoProHintTitle: 'Pro mode required',
      repoProHint: 'This node calls an external API over HTTP. Enable Pro mode in Settings → VCG Visual Control Generator → Pro mode before importing it.',
      repoNodePro: 'Pro mode',
      repoHttpNode: 'HTTP node',
      repoSearchPh: 'Search name / Chinese name / id / description',
      repoAll: 'All',
      repoNodesTitle: 'Repository nodes',
      repoBrowserHint: 'Open a card for details; tick cards to import them in bulk.',
      repoNodesEmpty: 'No matching nodes',
      repoNodesEmptyHint: 'Try another category or clear the search; you can also switch the repository source above.',
      repoLoading: 'Fetching the node repository…',
      repoPortsValue: 'in {inputs} · out {outputs}',
      repoParamsCount: '{count} params',
      repoInstalled: 'Installed',
      repoNeedPro: 'Needs Pro mode',
      repoAvailable: 'Importable',
      repoDetails: 'Details',
      repoSelectNode: 'Select node {name}',
      repoNoDescription: '(no description)',
      repoImport: 'Import node',
      repoImporting: 'Importing…',
      repoImportSelected: 'Import selected ({count})',
      repoClearSelection: 'Clear selection',
      repoSelectAll: 'Select all importable',
      repoSelectedCount: '{count} selected',
      repoNoSelection: 'Tick at least one node to import first.',
      repoBulkTitle: 'Batch import result',
      repoBulkSummary: '{ok} succeeded · {fail} failed',
      repoBulkProgress: 'Importing {done}/{total}',
      repoImportSuccessTitle: 'Node imported',
      repoImportOk: 'Imported {name}',
      repoImportFailed: 'Import failed',
      repoImportNeedProTitle: 'This node requires Pro mode',
      repoCannotImport: 'This node cannot be imported right now.',
      repoInstalledHint: 'This node is installed and ready to use on the canvas.',
      repoPortsInputs: 'Input ports',
      repoPortsOutputs: 'Output ports',
      repoNoPorts: 'None',
      repoOptional: 'Optional',
      repoParamsTitle: 'Parameters',
      repoNoParams: 'No parameters',
      repoParamDefault: 'Default',
      repoParamRange: 'Range',
      repoParamOptions: 'Options',
      repoExecutorTitle: 'Executor',
      repoExecutorKind: 'Kind',
      repoExecutorBuiltin: 'Built-in executor',
      repoExecutorFn: 'Built-in function',
      repoExecutorHttp: 'HTTP request',
      repoExecutorComfy: 'ComfyUI node',
      repoRequestUrl: 'Request URL',
      repoRequestMethod: 'Method',
      repoRequestHeaders: 'Header fields',
      repoRequestTimeout: 'Timeout (ms)',
      repoResponse: 'Response fields',
      repoCloudTitle: 'Cloud capability',
      repoCloudCapability: 'Capability',
      repoCloudApi: 'Required API',
      repoCloudNotes: 'Notes',
      repoCapImage: 'Image',
      repoCapVideo: 'Video',
      repoCapText: 'Text',
      repoCapNone: 'None',
      repoLocalTitle: 'Local ComfyUI',
      repoLocalClassType: 'class_type',
      repoLocalMap: 'Field mapping',
      repoLocalMapCount: '{count} entries',
      repoLocalNone: 'No local ComfyUI mapping declared',
      repoSourceBadge: 'Source',
      repoDetailId: 'Node id',
      repoDetailCategory: 'Category',
      repoDetailEngine: 'Engine',
      repoInstalledTitle: 'Installed custom nodes',
      repoInstalledDesc: 'Custom nodes imported via Pro-mode JSON or from this page. Nodes synced from the repository cannot be deleted here.',
      repoInstalledEmpty: 'No custom nodes imported yet. Import one from a node card above.',
      repoDelete: 'Delete',
      repoConfirmDelete: 'Confirm delete?',
      repoDeleteOk: 'Node {id} deleted',
      repoDeleteFail: 'Failed to delete the node',
      repoDeleting: 'Deleting…',
      repoDeleteSuccessTitle: 'Node deleted',
      repoWorkflowsTitle: 'Repository workflows',
      repoWorkflowsDesc: 'Example workflows shipped with the repository (synced with it). Display only — no import action here.',
      repoWorkflowsEmpty: 'The repository provides no workflows.',
      repoWorkflowNodes: '{count} nodes',
      repoWorkflowInstalled: 'Available',
      repoWorkflowMissing: 'Not synced',
      repoWorkflowHint: 'Open workflows in VCG Studio → Workflows; configure the repository address in Settings.',
      repoSettingsLink: 'Configure the repository address in Settings',
      repoSettingsUnavailableTitle: 'Cannot open Settings',
      repoSettingsUnavailable: 'Open Settings → VCG Visual Control Generator manually to adjust the node repository or Pro mode.',
      repoStoreError: 'Failed to load the Host state',
      repoNoMatch: 'No matching result',
      repoCategoryEmpty: 'No nodes in this category',
      repoStoreLoading: 'Loading the Host state…',
    },
  )

  const t = (key, vars) => V.t(key, vars)
  const msgOf = (error) => V.messageOf(error)
  const asArray = (value) => (Array.isArray(value) ? value : [])
  const str = (value) => (value === undefined || value === null ? '' : String(value))

  const CATEGORY_EN = {
    input: 'Input / Prompt',
    model: 'Models',
    latent: 'Latent / Size',
    sampling: 'Sampling',
    decode: 'Decode / Output',
    video: 'Video',
    utility: 'Utility / Notes',
    custom: 'Custom API nodes',
  }
  const CATEGORY_ORDER = new Map(V.consts.NODE_CATEGORIES.map((category, index) => [category.id, index]))
  const ENGINE_KEYS = { cloud: 'cloud', local: 'local', both: 'both' }

  /* -------------------------------------------------------------- helpers */

  function engineText(engine) {
    const key = ENGINE_KEYS[engine]
    if (key) return t(key)
    return V.consts.ENGINE_LABELS[engine] || str(engine) || '—'
  }

  function engineColor(engine) {
    return V.consts.ENGINE_COLORS[engine] || undefined
  }

  function categoryText(category) {
    const id = str(category)
    if (id === '') return '—'
    if (V.localeId() === 'en') return CATEGORY_EN[id] || id
    return V.categoryLabel(id)
  }

  function capabilityText(capability) {
    const id = str(capability)
    if (id === 'image') return t('repoCapImage')
    if (id === 'video') return t('repoCapVideo')
    if (id === 'text') return t('repoCapText')
    if (id === '' || id === 'none') return t('repoCapNone')
    return id
  }

  function requiresProMode(node) {
    if (!node || typeof node !== 'object') return false
    if (node.requiresPro === true) return true
    return Boolean(node.executor && node.executor.kind === 'http')
  }

  /** Only imported custom nodes may be removed; repo / builtin nodes are protected. */
  function isImportedCustom(node) {
    if (!node || typeof node !== 'object') return false
    const source = str(node.source)
    if (source === 'builtin' || source === 'repo') return false
    if (node.custom === true) return true
    return source === 'custom' || source === 'imported'
  }

  function nodeTitle(node) {
    if (!node || typeof node !== 'object') return '—'
    return str(node.nameZh) || str(node.name) || str(node.id) || '—'
  }

  function nodeSubtitle(node) {
    if (!node || typeof node !== 'object') return ''
    const parts = []
    if (node.name) parts.push(str(node.name))
    if (node.id) parts.push(str(node.id))
    return parts.join(' · ')
  }

  function paramDefaultText(param) {
    if (!param || param.default === undefined || param.default === null) return '—'
    try {
      const text = JSON.stringify(param.default)
      return text === undefined ? str(param.default) : text
    } catch {
      return str(param.default)
    }
  }

  function paramRangeText(param) {
    if (!param) return ''
    const min = param.min
    const max = param.max
    if (min === undefined && max === undefined) return ''
    return (min === undefined ? '−∞' : str(min)) + ' ~ ' + (max === undefined ? '+∞' : str(max))
  }

  function normalizeRepoData(data) {
    const repo = data && typeof data === 'object' ? data : {}
    return {
      source: str(repo.source),
      base: str(repo.base),
      version: repo.version === undefined || repo.version === null ? '' : str(repo.version),
      fetchedAt: str(repo.fetchedAt),
      warnings: asArray(repo.warnings).map((warning) => str(warning)).filter(Boolean),
      nodes: asArray(repo.nodes).filter((node) => node && typeof node === 'object'),
      workflows: asArray(repo.workflows).filter((workflow) => workflow && typeof workflow === 'object'),
    }
  }

  function matchesSearch(node, query) {
    const needle = str(query).trim().toLowerCase()
    if (needle === '') return true
    return [node.name, node.nameZh, node.id, node.description, node.category, node.nameZh]
      .some((value) => str(value).toLowerCase().indexOf(needle) >= 0)
  }

  /* ------------------------------------------------------------ ui: pieces */

  function Notice({ notice, onClose }) {
    if (!notice) return null
    const items = asArray(notice.items).filter(Boolean)
    return h(
      Banner,
      {
        kind: notice.kind || 'info',
        title: notice.title,
        action: onClose
          ? h(Button, { size: 'sm', variant: 'ghost', onClick: onClose }, t('close'))
          : null,
      },
      notice.message ? h('div', null, notice.message) : null,
      items.length
        ? h(
            'div',
            { className: 'vcg-repo-notice-list' },
            items.map((item, index) =>
              h(
                'div',
                { key: index, className: 'vcg-repo-notice-item' },
                '· ' + str(item.label),
                item.error ? h('span', { className: 'vcg-repo-notice-error' }, '：' + str(item.error)) : null,
              ),
            ),
          )
        : null,
    )
  }

  function PortRow({ port }) {
    const type = str(port && port.type) || 'any'
    return h(
      'div',
      { className: 'vcg-repo-port' },
      h('span', { className: 'vcg-repo-dot', style: { background: V.portColor(type) } }),
      h('span', { className: 'vcg-repo-port-label' }, str(port && (port.label || port.id)) || '—'),
      h('span', { className: 'vcg-repo-port-type' }, type.toUpperCase()),
      port && port.optional === true ? h(Badge, null, t('repoOptional')) : null,
    )
  }

  function DetailBlock({ title, extra, children }) {
    return h(
      'div',
      { className: 'vcg-repo-detail-block' },
      h(
        'div',
        { className: 'vcg-repo-detail-block-head' },
        h('span', { className: 'vcg-repo-detail-block-title' }, title || ''),
        extra || null,
      ),
      h('div', { className: 'vcg-repo-detail-block-body' }, children),
    )
  }

  function KVRow({ label, children, mono }) {
    return h(
      'div',
      { className: 'vcg-repo-kv-row' },
      h('span', { className: 'vcg-repo-kv-key' }, label),
      h('span', { className: 'vcg-repo-kv-val' + (mono ? ' vcg-repo-mono' : '') }, children),
    )
  }

  function ParamRow({ param }) {
    const extras = []
    const options = asArray(param && param.options)
    if (options.length) extras.push(t('repoParamOptions') + '：' + options.map(str).join(' / '))
    const range = paramRangeText(param)
    if (range !== '') extras.push(t('repoParamRange') + '：' + range)
    return h(
      'div',
      { className: 'vcg-repo-param-row' },
      h(
        'div',
        { className: 'vcg-repo-param-main' },
        h('div', { className: 'vcg-repo-param-name' }, str(param && (param.label || param.id)) || '—'),
        h('div', { className: 'vcg-repo-param-id' }, str(param && param.id)),
      ),
      h(Badge, null, str(param && param.type) || 'any'),
      h('span', { className: 'vcg-repo-param-default' }, t('repoParamDefault') + ' ' + paramDefaultText(param)),
      extras.length ? h('div', { className: 'vcg-repo-param-extra' }, extras.join('；')) : null,
    )
  }

  function NodeCard({ node, installed, blocked, importable, selected, locked, onToggle, onOpen }) {
    const inputs = asArray(node.inputs)
    const outputs = asArray(node.outputs)
    const classes = ['vcg-repo-card']
    if (selected) classes.push('vcg-repo-card-selected')
    if (installed) classes.push('vcg-repo-card-installed')
    const title = nodeTitle(node)
    const subtitle = nodeSubtitle(node)
    return h(
      'div',
      {
        className: classes.join(' '),
        role: 'button',
        tabIndex: 0,
        title: str(node.description) || str(node.id),
        onClick: () => onOpen(node.id),
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onOpen(node.id)
          }
        },
      },
      h(
        'div',
        { className: 'vcg-repo-card-head' },
        h('input', {
          type: 'checkbox',
          className: 'vcg-repo-check',
          checked: Boolean(selected),
          disabled: !importable || locked,
          'aria-label': t('repoSelectNode', { name: title }),
          onClick: (event) => event.stopPropagation(),
          onChange: () => onToggle(node.id),
        }),
        h(
          'div',
          { className: 'vcg-repo-card-title' },
          h('div', { className: 'vcg-repo-card-name' }, title),
          h('div', { className: 'vcg-repo-card-sub' }, subtitle),
        ),
        h(Badge, { color: engineColor(node.engine) }, engineText(node.engine)),
      ),
      h('div', { className: 'vcg-repo-card-desc' }, str(node.description) || t('repoNoDescription')),
      h(
        'div',
        { className: 'vcg-repo-card-meta' },
        h(Badge, null, categoryText(node.category)),
        h(Badge, null, t('repoPortsValue', { inputs: inputs.length, outputs: outputs.length })),
        h(Badge, null, t('repoParamsCount', { count: asArray(node.params).length })),
        requiresProMode(node)
          ? h(
              Badge,
              { color: blocked ? 'var(--dsw-alias-state-warn-primary)' : 'var(--dsw-alias-brand-primary)' },
              blocked ? t('repoNeedPro') : t('repoNodePro'),
            )
          : null,
      ),
      h(
        'div',
        { className: 'vcg-repo-card-foot' },
        h(
          'span',
          { className: 'vcg-repo-card-state' },
          installed
            ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('repoInstalled'))
            : blocked
              ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('repoNeedPro'))
              : h(Badge, null, t('repoAvailable')),
        ),
        h(
          Button,
          {
            size: 'sm',
            variant: 'ghost',
            onClick: (event) => {
              event.stopPropagation()
              onOpen(node.id)
            },
          },
          t('repoDetails'),
        ),
      ),
    )
  }

  function NodeDetail({ node, installed, blocked, importable, installing, error, onOpenSettings }) {
    const inputs = asArray(node.inputs)
    const outputs = asArray(node.outputs)
    const params = asArray(node.params)
    const executor = node.executor && typeof node.executor === 'object' ? node.executor : {}
    const cloud = node.cloud && typeof node.cloud === 'object' ? node.cloud : {}
    const local = node.local && typeof node.local === 'object' ? node.local : {}
    const comfy = local.comfyui && typeof local.comfyui === 'object' ? local.comfyui : {}
    const request = executor.request && typeof executor.request === 'object' ? executor.request : {}
    const response = executor.response && typeof executor.response === 'object' ? executor.response : {}
    const headerKeys = request.headers && typeof request.headers === 'object' ? Object.keys(request.headers) : []
    const mapKeys = comfy.map && typeof comfy.map === 'object' ? Object.keys(comfy.map) : []
    const responseKeys = Object.keys(response)
    const executorKind = str(executor.kind)

    let executorBody = h('div', { className: 'vcg-hint' }, '—')
    if (executorKind === 'builtin') {
      executorBody = [
        h(KVRow, { key: 'kind', label: t('repoExecutorKind'), children: t('repoExecutorBuiltin') }),
        h(KVRow, { key: 'fn', label: t('repoExecutorFn'), mono: true, children: str(executor.fn) || '—' }),
      ]
    } else if (executorKind === 'http') {
      executorBody = [
        h(KVRow, { key: 'kind', label: t('repoExecutorKind'), children: t('repoExecutorHttp') }),
        h(KVRow, {
          key: 'method',
          label: t('repoRequestMethod'),
          children: h(Badge, null, str(request.method) || 'POST'),
        }),
        h(KVRow, { key: 'url', label: t('repoRequestUrl'), mono: true, children: str(request.url) || '—' }),
        headerKeys.length
          ? h(KVRow, {
              key: 'headers',
              label: t('repoRequestHeaders'),
              mono: true,
              children: headerKeys.join(', '),
            })
          : null,
        request.timeoutMs !== undefined
          ? h(KVRow, { key: 'timeout', label: t('repoRequestTimeout'), children: str(request.timeoutMs) })
          : null,
        responseKeys.length
          ? h(KVRow, {
              key: 'response',
              label: t('repoResponse'),
              mono: true,
              children: responseKeys.join(', '),
            })
          : null,
      ]
    } else if (executorKind === 'comfy') {
      executorBody = [
        h(KVRow, { key: 'kind', label: t('repoExecutorKind'), children: t('repoExecutorComfy') }),
        h(KVRow, {
          key: 'class',
          label: t('repoLocalClassType'),
          mono: true,
          children: str(comfy.class_type) || '—',
        }),
      ]
    }

    const infoRows = [
      h(KVRow, { key: 'id', label: t('repoDetailId'), mono: true, children: str(node.id) || '—' }),
      h(KVRow, { key: 'category', label: t('repoDetailCategory'), children: categoryText(node.category) }),
      h(KVRow, { key: 'engine', label: t('repoDetailEngine'), children: engineText(node.engine) }),
      str(node.source)
        ? h(KVRow, { key: 'source', label: t('repoSourceBadge'), children: str(node.source) })
        : null,
    ]

    return h(
      'div',
      { className: 'vcg-repo-detail' },
      h(
        'div',
        { className: 'vcg-repo-detail-head' },
        h(
          'div',
          { className: 'vcg-repo-detail-titlewrap' },
          h('div', { className: 'vcg-repo-detail-title' }, nodeTitle(node)),
          h('div', { className: 'vcg-repo-detail-sub' }, nodeSubtitle(node)),
        ),
        h(
          'div',
          { className: 'vcg-repo-card-meta' },
          h(Badge, { color: engineColor(node.engine) }, engineText(node.engine)),
          h(Badge, null, categoryText(node.category)),
          installed
            ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('repoInstalled'))
            : blocked
              ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('repoNeedPro'))
              : h(Badge, null, t('repoAvailable')),
          requiresProMode(node) ? h(Badge, { color: 'var(--dsw-alias-brand-primary)' }, t('repoHttpNode')) : null,
        ),
      ),
      h('div', { className: 'vcg-repo-detail-desc' }, str(node.description) || t('repoNoDescription')),
      blocked
        ? h(
            Banner,
            {
              kind: 'warn',
              title: t('repoImportNeedProTitle'),
              action: h(Button, { size: 'sm', onClick: onOpenSettings }, t('repoOpenSettings')),
            },
            t('repoProHint'),
          )
        : null,
      !installed && !blocked && !importable
        ? h(Banner, { kind: 'info', title: t('repoCannotImport') })
        : null,
      installed ? h(Banner, { kind: 'success', title: t('repoInstalled') }, t('repoInstalledHint')) : null,
      error ? h(Banner, { kind: 'error', title: t('repoImportFailed') }, error) : null,
      h(
        'div',
        { className: 'vcg-repo-port-grid' },
        h(
          DetailBlock,
          {
            title: t('repoPortsInputs'),
            extra: h(Badge, null, str(inputs.length)),
          },
          inputs.length
            ? inputs.map((port, index) => h(PortRow, { key: str(port.id) || 'in-' + index, port: port }))
            : h('div', { className: 'vcg-hint' }, t('repoNoPorts')),
        ),
        h(
          DetailBlock,
          {
            title: t('repoPortsOutputs'),
            extra: h(Badge, null, str(outputs.length)),
          },
          outputs.length
            ? outputs.map((port, index) => h(PortRow, { key: str(port.id) || 'out-' + index, port: port }))
            : h('div', { className: 'vcg-hint' }, t('repoNoPorts')),
        ),
      ),
      h(
        DetailBlock,
        {
          title: t('repoParamsTitle'),
          extra: h(Badge, null, str(params.length)),
        },
        params.length
          ? h(
              'div',
              { className: 'vcg-repo-param-list' },
              params.map((param, index) => h(ParamRow, { key: str(param.id) || 'p-' + index, param: param })),
            )
          : h('div', { className: 'vcg-hint' }, t('repoNoParams')),
      ),
      h(
        DetailBlock,
        {
          title: t('repoExecutorTitle'),
          extra: executorKind ? h(Badge, null, executorKind) : null,
        },
        executorBody,
      ),
      Object.keys(cloud).length
        ? h(
            DetailBlock,
            { title: t('repoCloudTitle') },
            h(KVRow, {
              label: t('repoCloudCapability'),
              children: capabilityText(cloud.capability),
            }),
            str(cloud.api)
              ? h(KVRow, { label: t('repoCloudApi'), mono: true, children: str(cloud.api) })
              : null,
            str(cloud.notes) ? h(KVRow, { label: t('repoCloudNotes'), children: str(cloud.notes) }) : null,
          )
        : null,
      Object.keys(comfy).length
        ? h(
            DetailBlock,
            { title: t('repoLocalTitle') },
            h(KVRow, {
              label: t('repoLocalClassType'),
              mono: true,
              children: str(comfy.class_type) || '—',
            }),
            h(KVRow, {
              label: t('repoLocalMap'),
              mono: true,
              children: mapKeys.length
                ? mapKeys.join(', ') + '（' + t('repoLocalMapCount', { count: mapKeys.length }) + '）'
                : t('repoLocalNone'),
            }),
          )
        : null,
      h(DetailBlock, { title: t('repoDetailId') }, infoRows),
      installing
        ? h(
            'div',
            { className: 'vcg-repo-loading vcg-repo-loading-inline' },
            h(Spinner, { size: 15, label: t('repoImporting') }),
          )
        : null,
    )
  }

  function WorkflowsSection({ workflows, loading, onOpenSettings }) {
    const list = asArray(workflows)
    return h(
      'section',
      { className: 'vcg-repo-section' },
      h(
        'div',
        { className: 'vcg-repo-section-head' },
        h(
          'div',
          null,
          h('div', { className: 'vcg-repo-section-title' }, t('repoWorkflowsTitle')),
          h('div', { className: 'vcg-repo-section-desc' }, t('repoWorkflowsDesc')),
        ),
        h(
          Button,
          { size: 'sm', variant: 'ghost', onClick: onOpenSettings, icon: 'settings' },
          t('repoSettingsLink'),
        ),
      ),
      loading && !list.length
        ? h('div', { className: 'vcg-repo-loading vcg-repo-loading-inline' }, h(Spinner, { size: 15 }))
        : null,
      !loading && !list.length ? h(Empty, { title: t('repoWorkflowsEmpty'), icon: 'layers' }) : null,
      list.length
        ? h(
            'div',
            { className: 'vcg-repo-wf-list' },
            list.map((workflow, index) =>
              h(
                'div',
                { key: str(workflow.id) || 'wf-' + index, className: 'vcg-repo-wf-row' },
                h(
                  'div',
                  { className: 'vcg-repo-wf-main' },
                  h(
                    'div',
                    { className: 'vcg-repo-wf-head' },
                    h('span', { className: 'vcg-repo-wf-name' }, str(workflow.name) || str(workflow.id) || '—'),
                    workflow.installed
                      ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('repoWorkflowInstalled'))
                      : h(Badge, null, t('repoWorkflowMissing')),
                  ),
                  h(
                    'div',
                    { className: 'vcg-repo-wf-desc' },
                    str(workflow.description) || t('repoNoDescription'),
                  ),
                ),
                h(
                  'div',
                  { className: 'vcg-repo-wf-meta' },
                  h(Badge, null, t('repoWorkflowNodes', { count: asArray(workflow.nodes).length || Number(workflow.nodeCount) || 0 })),
                  workflow.id ? h('span', { className: 'vcg-repo-mono' }, str(workflow.id)) : null,
                ),
              ),
            ),
          )
        : null,
      h('div', { className: 'vcg-hint vcg-repo-section-hint' }, t('repoWorkflowHint')),
    )
  }

  function CustomNodesSection({
    nodes,
    loading,
    error,
    deletingId,
    confirmId,
    onDelete,
    onOpenSettings,
    onReload,
  }) {
    const list = asArray(nodes)
    return h(
      'section',
      { className: 'vcg-repo-section' },
      h(
        'div',
        { className: 'vcg-repo-section-head' },
        h(
          'div',
          null,
          h('div', { className: 'vcg-repo-section-title' }, t('repoInstalledTitle')),
          h('div', { className: 'vcg-repo-section-desc' }, t('repoInstalledDesc')),
        ),
        h(
          'div',
          { className: 'vcg-row' },
          h(Button, { size: 'sm', onClick: onReload, icon: 'refresh' }, t('refresh')),
          h(
            Button,
            { size: 'sm', variant: 'ghost', onClick: onOpenSettings, icon: 'settings' },
            t('repoOpenSettings'),
          ),
        ),
      ),
      error
        ? h(
            Banner,
            {
              kind: 'error',
              title: t('repoLoadFailed'),
              action: h(Button, { size: 'sm', onClick: onReload }, t('retry')),
            },
            error,
          )
        : null,
      loading && !list.length
        ? h('div', { className: 'vcg-repo-loading vcg-repo-loading-inline' }, h(Spinner, { size: 15, label: t('loading') }))
        : null,
      !loading && !error && !list.length
        ? h(Empty, { title: t('repoInstalledEmpty'), icon: 'node' })
        : null,
      list.length
        ? h(
            'div',
            { className: 'vcg-repo-custom-list' },
            list.map((node) =>
              h(
                'div',
                { key: str(node.id), className: 'vcg-repo-custom-row' },
                h(
                  'div',
                  { className: 'vcg-repo-custom-main' },
                  h('div', { className: 'vcg-repo-custom-name' }, nodeTitle(node)),
                  h('div', { className: 'vcg-repo-custom-sub' }, nodeSubtitle(node)),
                ),
                h(
                  'div',
                  { className: 'vcg-repo-card-meta' },
                  h(Badge, { color: engineColor(node.engine) }, engineText(node.engine)),
                  h(Badge, null, categoryText(node.category)),
                  str(node.source) ? h(Badge, null, str(node.source)) : null,
                ),
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: 'danger',
                    disabled: deletingId === str(node.id),
                    onClick: () => onDelete(node.id),
                  },
                  deletingId === str(node.id)
                    ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('repoDeleting'))
                    : confirmId === str(node.id)
                      ? t('repoConfirmDelete')
                      : t('repoDelete'),
                ),
              ),
            ),
          )
        : null,
    )
  }

  /* ----------------------------------------------------------- panel icon */

  /** Sidebar icon: a repository box with two linked nodes on its front face. */
  function RepoPanelIcon(props) {
    const size =
      (props && (props.size || props.width || props.height)) || 18
    return h(
      'svg',
      {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        className: 'vcg-repo-panel-icon' + (props && props.className ? ' ' + props.className : ''),
        role: 'img',
        'aria-label': 'VCG 节点工作流仓库',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'block', flex: 'none' },
      },
      /* 仓库箱体 */
      h('path', { d: 'M3.6 8.1L12 3.7l8.4 4.4v7.8L12 20.3 3.6 15.9z' }),
      h('path', { d: 'M3.6 8.1L12 12.5l8.4-4.4' }),
      h('path', { d: 'M12 12.5v7.8' }),
      /* 前面板上的两个节点 + 连线（与 PanelIcon 的三节点星芒区分） */
      h('rect', { x: 7.9, y: 14, width: 2.1, height: 2.1, rx: 0.45, fill: 'currentColor', stroke: 'none' }),
      h('rect', { x: 14, y: 14, width: 2.1, height: 2.1, rx: 0.45, fill: 'currentColor', stroke: 'none' }),
      h('path', { d: 'M10.2 15.05h3.5' }),
    )
  }

  /* ---------------------------------------------------------------- page */

  function NodeRepoPage() {
    const store = V.useStore()
    const [source, setSource] = React.useState('auto')
    const [repoData, setRepoData] = React.useState(null)
    const [repoLoading, setRepoLoading] = React.useState(true)
    const [repoError, setRepoError] = React.useState('')
    const [category, setCategory] = React.useState('all')
    const [search, setSearch] = React.useState('')
    const [selected, setSelected] = React.useState({})
    const [detailId, setDetailId] = React.useState('')
    const [installingId, setInstallingId] = React.useState('')
    const [installError, setInstallError] = React.useState('')
    const [bulkBusy, setBulkBusy] = React.useState(false)
    const [bulkProgress, setBulkProgress] = React.useState({ done: 0, total: 0 })
    const [syncing, setSyncing] = React.useState(false)
    const [notice, setNotice] = React.useState(null)
    const [storeError, setStoreError] = React.useState('')
    const [deleteTarget, setDeleteTarget] = React.useState('')
    const [deletingId, setDeletingId] = React.useState('')

    const loadSeq = React.useRef(0)
    const deleteTimer = React.useRef(null)

    const nodesAsync = V.useAsync(
      () => V.rpc('listNodes').then((result) => asArray(result && result.nodes)),
      [],
    )

    const nodeRepoState = store.state && typeof store.state.nodeRepo === 'object' ? store.state.nodeRepo : {}
    const proMode = Boolean(store.state && store.state.proMode)
    const configured = Boolean(str(nodeRepoState.githubBase) || str(nodeRepoState.giteaBase))

    /* --- data loading --- */

    const loadRepo = async (force) => {
      const seq = loadSeq.current + 1
      loadSeq.current = seq
      setRepoLoading(true)
      setRepoError('')
      try {
        const args = { source: source }
        if (force) args.force = true
        const data = await V.rpc('listRepoNodes', args)
        if (seq !== loadSeq.current) return
        setRepoData(normalizeRepoData(data))
      } catch (error) {
        if (seq !== loadSeq.current) return
        setRepoError(msgOf(error))
      } finally {
        if (seq === loadSeq.current) setRepoLoading(false)
      }
    }

    React.useEffect(() => {
      let alive = true
      V.refresh()
        .then(() => {
          if (alive) setStoreError('')
        })
        .catch((error) => {
          if (alive) setStoreError(msgOf(error))
        })
      return () => {
        alive = false
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
      loadRepo(false)
      return () => {
        loadSeq.current += 1
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source])

    React.useEffect(
      () => () => {
        if (deleteTimer.current) clearTimeout(deleteTimer.current)
      },
      [],
    )

    /* --- derived data --- */

    const repoNodes = React.useMemo(() => {
      if (!repoData) return []
      return repoData.nodes.slice().sort((a, b) => {
        const catA = CATEGORY_ORDER.has(str(a.category)) ? CATEGORY_ORDER.get(str(a.category)) : 99
        const catB = CATEGORY_ORDER.has(str(b.category)) ? CATEGORY_ORDER.get(str(b.category)) : 99
        if (catA !== catB) return catA - catB
        const orderA = Number(a.order)
        const orderB = Number(b.order)
        if (Number.isFinite(orderA) && Number.isFinite(orderB) && orderA !== orderB) return orderA - orderB
        return nodeTitle(a).localeCompare(nodeTitle(b), 'zh')
      })
    }, [repoData])

    const nodeById = React.useMemo(() => {
      const map = new Map()
      for (const node of repoNodes) map.set(str(node.id), node)
      return map
    }, [repoNodes])

    const installedIds = React.useMemo(() => {
      const ids = new Set()
      for (const node of asArray(nodesAsync.data)) ids.add(str(node.id))
      return ids
    }, [nodesAsync.data])

    const isInstalled = (node) => Boolean(node && (node.installed === true || installedIds.has(str(node.id))))
    const isBlocked = (node) => requiresProMode(node) && !proMode
    const isImportable = (node) => Boolean(node) && !isInstalled(node) && !isBlocked(node) && node.canImport !== false

    const categoryCounts = React.useMemo(() => {
      const counts = {}
      for (const node of repoNodes) {
        const id = str(node.category) || 'custom'
        counts[id] = (counts[id] || 0) + 1
      }
      return counts
    }, [repoNodes])

    const categoryList = React.useMemo(() => {
      const base = asArray(V.consts.NODE_CATEGORIES).map((entry) => ({
        id: entry.id,
        label: V.localeId() === 'en' ? CATEGORY_EN[entry.id] || entry.id : entry.label || entry.id,
      }))
      const known = new Set(base.map((entry) => entry.id))
      for (const node of repoNodes) {
        const id = str(node.category) || 'custom'
        if (!known.has(id)) {
          known.add(id)
          base.push({ id: id, label: categoryText(id) })
        }
      }
      return base
    }, [repoNodes])

    const visibleNodes = React.useMemo(
      () =>
        repoNodes.filter(
          (node) => (category === 'all' || (str(node.category) || 'custom') === category) && matchesSearch(node, search),
        ),
      [repoNodes, category, search],
    )

    const selectedImportableIds = React.useMemo(
      () =>
        Object.keys(selected).filter((id) => {
          const node = nodeById.get(id)
          return Boolean(selected[id] && node && isImportable(node))
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selected, nodeById, proMode, installedIds],
    )

    const importableVisible = visibleNodes.filter((node) => isImportable(node))
    const installedCustomNodes = asArray(nodesAsync.data).filter(isImportedCustom)
    const detailNode = detailId !== '' ? nodeById.get(detailId) : null
    const detailInstalled = detailNode ? isInstalled(detailNode) : false
    const detailBlocked = detailNode && !detailInstalled ? isBlocked(detailNode) : false
    const detailImportable = detailNode ? isImportable(detailNode) : false
    const detailTitle = detailNode ? nodeTitle(detailNode) : ''

    /* --- actions --- */

    function showNotice(next) {
      setNotice(next)
    }

    function openSettings() {
      const nav = V.nav || {}
      if (typeof nav.openSettings === 'function') {
        try {
          const result = nav.openSettings('vcg')
          if (result && typeof result.catch === 'function') result.catch(() => {})
          return
        } catch {
          /* fall through to the readable hint */
        }
      }
      showNotice({
        kind: 'info',
        title: t('repoSettingsUnavailableTitle'),
        message: t('repoSettingsUnavailable'),
      })
    }

    function changeSource(next) {
      if (next === source) return
      setSource(next)
      setSelected({})
      setDetailId('')
      setInstallError('')
      setNotice(null)
      setCategory('all')
      setSearch('')
    }

    function toggleSelect(id) {
      setSelected((previous) => {
        const next = Object.assign({}, previous)
        if (next[id]) delete next[id]
        else next[id] = true
        return next
      })
    }

    function selectAllImportable() {
      setSelected((previous) => {
        const next = Object.assign({}, previous)
        for (const node of importableVisible) next[str(node.id)] = true
        return next
      })
    }

    function clearSelection() {
      setSelected({})
    }

    function openDetail(id) {
      setInstallError('')
      setDetailId(str(id))
    }

    function closeDetail() {
      setDetailId('')
      setInstallError('')
    }

    function installArgsFor(id) {
      const resolved = repoData && repoData.source ? str(repoData.source) : ''
      const chosen = source !== 'auto' ? source : ''
      const reposSource = resolved || chosen
      return reposSource ? { id: id, source: reposSource } : { id: id }
    }

    function nameOfResult(result, fallbackNode) {
      const node = result && result.node
      if (node) return nodeTitle(node)
      if (fallbackNode) return nodeTitle(fallbackNode)
      return str(result && result.name) || '—'
    }

    function reloadAfterInstall() {
      nodesAsync.reload()
      loadRepo(false)
      V.refresh().catch(() => {})
    }

    async function importSingle(node) {
      if (!node || installingId !== '') return
      if (!isImportable(node)) return
      const id = str(node.id)
      setInstallingId(id)
      setInstallError('')
      try {
        const result = await V.rpc('installRepoNode', installArgsFor(id))
        setSelected((previous) => {
          if (!previous[id]) return previous
          const next = Object.assign({}, previous)
          delete next[id]
          return next
        })
        showNotice({
          kind: 'success',
          title: t('repoImportSuccessTitle'),
          message: t('repoImportOk', { name: nameOfResult(result, node) }),
        })
        reloadAfterInstall()
      } catch (error) {
        setInstallError(msgOf(error))
        showNotice({ kind: 'error', title: t('repoImportFailed'), message: msgOf(error) })
      } finally {
        setInstallingId('')
      }
    }

    async function importSelected() {
      if (bulkBusy) return
      const ids = selectedImportableIds.slice()
      if (ids.length === 0) {
        showNotice({ kind: 'info', title: t('repoBulkTitle'), message: t('repoNoSelection') })
        return
      }
      setBulkBusy(true)
      setBulkProgress({ done: 0, total: ids.length })
      showNotice(null)
      const succeeded = []
      const failed = []
      for (let index = 0; index < ids.length; index += 1) {
        const id = ids[index]
        const node = nodeById.get(id)
        try {
          const result = await V.rpc('installRepoNode', installArgsFor(id))
          succeeded.push({ label: t('repoImportOk', { name: nameOfResult(result, node) }) })
        } catch (error) {
          failed.push({
            label: node ? nodeTitle(node) + '（' + id + '）' : id,
            error: msgOf(error),
          })
        }
        setBulkProgress({ done: index + 1, total: ids.length })
      }
      setBulkBusy(false)
      setSelected({})
      const okCount = succeeded.length
      const failCount = failed.length
      showNotice({
        kind: failCount === 0 ? 'success' : okCount === 0 ? 'error' : 'warn',
        title: t('repoBulkTitle'),
        message: t('repoBulkSummary', { ok: okCount, fail: failCount }),
        items: succeeded.concat(failed),
      })
      if (okCount > 0) reloadAfterInstall()
    }

    async function syncAll() {
      if (syncing) return
      setSyncing(true)
      showNotice(null)
      try {
        const result = await V.rpc('syncNodeRepo', source === 'auto' ? {} : { source: source })
        const warnings = asArray(result && result.warnings).map((warning) => str(warning)).filter(Boolean)
        const counts = result && typeof result.counts === 'object' ? result.counts : {}
        const nodesCount = Number(counts.nodes)
        const workflowCount = Number(counts.workflows)
        const nodeTotal = Number.isFinite(nodesCount) ? nodesCount : asArray(result && result.nodes).length
        const workflowTotal = Number.isFinite(workflowCount)
          ? workflowCount
          : asArray(result && result.workflows).length
        showNotice({
          kind: warnings.length || (result && result.ok === false) ? 'warn' : 'success',
          title: t('repoSyncDone'),
          message: t('repoSyncSummary', { nodes: nodeTotal, workflows: workflowTotal }),
          items: warnings.map((warning) => ({ label: warning })),
        })
        nodesAsync.reload()
        await loadRepo(false)
        V.refresh().catch(() => {})
      } catch (error) {
        showNotice({ kind: 'error', title: t('repoSyncFailed'), message: msgOf(error) })
      } finally {
        setSyncing(false)
      }
    }

    function requestDelete(id) {
      const key = str(id)
      if (deleteTarget === key) {
        if (deleteTimer.current) {
          clearTimeout(deleteTimer.current)
          deleteTimer.current = null
        }
        setDeleteTarget('')
        if (deletingId === '') removeCustomNode(key)
        return
      }
      setDeleteTarget(key)
      if (deleteTimer.current) clearTimeout(deleteTimer.current)
      deleteTimer.current = setTimeout(() => {
        deleteTimer.current = null
        setDeleteTarget('')
      }, 4000)
    }

    async function removeCustomNode(id) {
      setDeletingId(id)
      try {
        await V.rpc('removeNode', { id: id })
        showNotice({ kind: 'success', title: t('repoDeleteSuccessTitle'), message: t('repoDeleteOk', { id: id }) })
        nodesAsync.reload()
        loadRepo(false)
        V.refresh().catch(() => {})
      } catch (error) {
        showNotice({ kind: 'error', title: t('repoDeleteFail'), message: msgOf(error) })
      } finally {
        setDeletingId('')
      }
    }

    /* --- render: header --- */

    const header = h(
      'div',
      { className: 'vcg-repo-header' },
      h(
        'div',
        { className: 'vcg-repo-header-main' },
        h('div', { className: 'vcg-repo-brand' }, h(RepoPanelIcon, { size: 20 })),
        h(
          'div',
          { className: 'vcg-repo-headings' },
          h('div', { className: 'vcg-repo-title' }, t('repoTitle')),
          h('div', { className: 'vcg-repo-subtitle' }, t('repoDesc')),
        ),
      ),
      h(
        'div',
        { className: 'vcg-repo-header-actions' },
        proMode
          ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('repoProOn'))
          : h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('repoProOff')),
        h(
          Button,
          {
            size: 'sm',
            onClick: () => loadRepo(true),
            disabled: repoLoading || syncing,
            icon: repoLoading ? undefined : 'refresh',
          },
          repoLoading
            ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('repoRefreshing'))
            : t('repoRefresh'),
        ),
        h(
          Button,
          {
            size: 'sm',
            variant: 'primary',
            onClick: syncAll,
            disabled: syncing || repoLoading,
            icon: syncing ? undefined : 'upload',
          },
          syncing
            ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('repoSyncing'))
            : t('repoSyncAll'),
        ),
        h(Button, { size: 'sm', variant: 'ghost', onClick: openSettings, icon: 'settings' }, t('repoOpenSettings')),
      ),
    )

    const sourceSelect = h(
      'div',
      { className: 'vcg-repo-source-select' },
      h('span', { className: 'vcg-repo-source-label' }, t('repoSourceLabel')),
      h(Select, {
        value: source,
        options: [
          { value: 'auto', label: t('repoSourceAuto') },
          { value: 'github', label: t('repoSourceGithub') },
          { value: 'gitea', label: t('repoSourceGitea') },
        ],
        onChange: changeSource,
      }),
    )

    const addressRows = h(
      'div',
      { className: 'vcg-repo-addresses' },
      h(
        'div',
        { className: 'vcg-repo-address' },
        h('span', { className: 'vcg-repo-address-label' }, t('repoGithubBase')),
        h(
          'span',
          {
            className: 'vcg-repo-mono vcg-repo-address-value',
            title: str(nodeRepoState.githubBase) || t('repoNotConfigured'),
          },
          str(nodeRepoState.githubBase) || t('repoNotConfigured'),
        ),
      ),
      h(
        'div',
        { className: 'vcg-repo-address' },
        h('span', { className: 'vcg-repo-address-label' }, t('repoGiteaBase')),
        h(
          'span',
          {
            className: 'vcg-repo-mono vcg-repo-address-value',
            title: str(nodeRepoState.giteaBase) || t('repoNotConfigured'),
          },
          str(nodeRepoState.giteaBase) || t('repoNotConfigured'),
        ),
      ),
      repoData && repoData.base
        ? h(
            'div',
            { className: 'vcg-repo-address' },
            h('span', { className: 'vcg-repo-address-label' }, t('repoCurrentBase')),
            h('span', { className: 'vcg-repo-mono vcg-repo-address-value', title: repoData.base }, repoData.base),
          )
        : null,
      h('div', { className: 'vcg-repo-address-hint' }, t('repoAddressHint')),
    )

    const statusChips = h(
      'div',
      { className: 'vcg-repo-status' },
      repoData && repoData.source ? h(Badge, null, t('repoSourceBadge') + '：' + repoData.source) : null,
      repoData && repoData.version ? h(Badge, null, t('repoVersion') + ' ' + repoData.version) : null,
      repoData && repoData.fetchedAt
        ? h(Badge, null, t('repoFetchedAt') + ' ' + (V.formatTime(repoData.fetchedAt) || repoData.fetchedAt))
        : null,
      repoData
        ? h(
            Badge,
            null,
            t('repoCounts', { nodes: repoNodes.length, workflows: asArray(repoData.workflows).length }),
          )
        : null,
    )

    const toolbar = h(
      'div',
      { className: 'vcg-repo-toolbar' },
      h('div', { className: 'vcg-repo-toolbar-main' }, sourceSelect, statusChips),
      addressRows,
    )

    /* --- render: category sidebar --- */

    const categoryButtons = h(
      'aside',
      { className: 'vcg-repo-aside', 'aria-label': t('repoNodesTitle') },
      h(
        'button',
        {
          type: 'button',
          className: 'vcg-repo-cat ' + (category === 'all' ? 'vcg-repo-cat-on' : ''),
          onClick: () => setCategory('all'),
        },
        h('span', { className: 'vcg-repo-cat-label' }, t('repoAll')),
        h('span', { className: 'vcg-repo-cat-count' }, str(repoNodes.length)),
      ),
      categoryList.map((entry) =>
        h(
          'button',
          {
            key: entry.id,
            type: 'button',
            className: 'vcg-repo-cat ' + (category === entry.id ? 'vcg-repo-cat-on' : ''),
            onClick: () => setCategory(entry.id),
          },
          h('span', { className: 'vcg-repo-cat-label' }, entry.label),
          h('span', { className: 'vcg-repo-cat-count' }, str(categoryCounts[entry.id] || 0)),
        ),
      ),
    )

    /* --- render: node browser --- */

    const browserTools = h(
      'div',
      { className: 'vcg-repo-tools' },
      h(
        'div',
        { className: 'vcg-repo-tools-left' },
        h(
          'div',
          { className: 'vcg-repo-search' },
          h(TextInput, {
            value: search,
            placeholder: t('repoSearchPh'),
            disabled: bulkBusy,
            onChange: (value) => setSearch(value),
          }),
        ),
        h('div', { className: 'vcg-repo-selected' }, t('repoSelectedCount', { count: selectedImportableIds.length })),
      ),
      h(
        'div',
        { className: 'vcg-repo-tools-right' },
        h(Button, { size: 'sm', variant: 'ghost', onClick: selectAllImportable, disabled: bulkBusy || importableVisible.length === 0 }, t('repoSelectAll')),
        h(Button, { size: 'sm', variant: 'ghost', onClick: clearSelection, disabled: bulkBusy || selectedImportableIds.length === 0 }, t('repoClearSelection')),
        h(
          Button,
          {
            size: 'sm',
            variant: 'primary',
            onClick: importSelected,
            disabled: bulkBusy || selectedImportableIds.length === 0,
            icon: bulkBusy ? undefined : 'download',
          },
          bulkBusy
            ? h(
                'span',
                { className: 'vcg-row' },
                h(Spinner, { size: 12 }),
                t('repoBulkProgress', { done: bulkProgress.done, total: bulkProgress.total }),
              )
            : t('repoImportSelected', { count: selectedImportableIds.length }),
        ),
      ),
    )

    let browserBody
    if (repoLoading && !repoData) {
      browserBody = h('div', { className: 'vcg-repo-loading' }, h(Spinner, { size: 18, label: t('repoLoading') }))
    } else if (!repoData && repoError) {
      browserBody = h(
        Banner,
        {
          kind: 'error',
          title: t('repoFetchFailed'),
          action: h(
            'div',
            { className: 'vcg-row' },
            h(Button, { size: 'sm', onClick: () => loadRepo(true) }, t('retry')),
            h(Button, { size: 'sm', variant: 'ghost', onClick: openSettings }, t('repoOpenSettings')),
          ),
        },
        repoError,
      )
    } else if (visibleNodes.length === 0) {
      browserBody = h(Empty, {
        title: repoNodes.length === 0 ? t('repoNodesEmpty') : t('repoCategoryEmpty'),
        hint: t('repoNodesEmptyHint'),
        icon: 'grid',
      })
    } else {
      browserBody = h(
        'div',
        { className: 'vcg-repo-grid' },
        visibleNodes.map((node) =>
          h(NodeCard, {
            key: str(node.id),
            node: node,
            installed: isInstalled(node),
            blocked: isBlocked(node) && !isInstalled(node),
            importable: isImportable(node),
            selected: Boolean(selected[str(node.id)]),
            locked: bulkBusy,
            onToggle: toggleSelect,
            onOpen: openDetail,
          }),
        ),
      )
    }

    const browser = h(
      'div',
      { className: 'vcg-repo-browser' },
      categoryButtons,
      h(
        'div',
        { className: 'vcg-repo-main' },
        h(
          'div',
          { className: 'vcg-repo-main-head' },
          h(
            'div',
            { className: 'vcg-repo-main-title' },
            t('repoNodesTitle'),
            h('span', { className: 'vcg-repo-main-count' }, str(visibleNodes.length)),
          ),
          h('div', { className: 'vcg-repo-main-hint' }, t('repoBrowserHint')),
        ),
        browserTools,
        browserBody,
      ),
    )

    /* --- render: banners --- */

    const banners = []
    if (storeError) {
      banners.push(
        h(
          Banner,
          { key: 'store', kind: 'warn', title: t('repoStoreError') },
          storeError,
        ),
      )
    }
    if (store.state && !configured && !repoError) {
      banners.push(
        h(
          Banner,
          {
            key: 'configure',
            kind: 'info',
            title: t('repoConfigureHint'),
            action: h(Button, { size: 'sm', onClick: openSettings }, t('repoOpenSettings')),
          },
        ),
      )
    }
    if (!proMode && repoData && repoNodes.some((node) => requiresProMode(node))) {
      banners.push(
        h(
          Banner,
          {
            key: 'pro-mode',
            kind: 'info',
            title: t('repoProHintTitle'),
            action: h(Button, { size: 'sm', onClick: openSettings }, t('repoOpenSettings')),
          },
          t('repoProHint'),
        ),
      )
    }
    if (repoError && repoData) {
      banners.push(
        h(
          Banner,
          {
            key: 'repo-error',
            kind: 'error',
            title: t('repoFetchFailed'),
            action: h(Button, { size: 'sm', onClick: () => loadRepo(true) }, t('retry')),
          },
          repoError,
        ),
      )
    }
    if (repoData && repoData.warnings.length) {
      banners.push(
        h(
          Banner,
          { key: 'warnings', kind: 'warn', title: t('repoWarnings') },
          h(
            'div',
            { className: 'vcg-repo-notice-list' },
            repoData.warnings.map((warning, index) =>
              h('div', { key: index, className: 'vcg-repo-notice-item' }, '· ' + warning),
            ),
          ),
        ),
      )
    }
    if (notice) {
      banners.push(h(Notice, { key: 'notice', notice: notice, onClose: () => setNotice(null) }))
    }

    /* --- render: detail modal --- */

    const detailFooter = detailNode
      ? h(
          'div',
          { className: 'vcg-repo-modal-foot' },
          h(
            'div',
            { className: 'vcg-repo-modal-hint' },
            detailInstalled
              ? t('repoInstalledHint')
              : detailBlocked
                ? t('repoProHint')
                : detailImportable
                  ? ''
                  : t('repoCannotImport'),
          ),
          h(
            'div',
            { className: 'vcg-row' },
            h(Button, { onClick: closeDetail }, t('close')),
            detailBlocked
              ? h(Button, { variant: 'primary', onClick: openSettings }, t('repoOpenSettings'))
              : null,
            h(
              Button,
              {
                variant: 'primary',
                disabled: !detailImportable || installingId !== '',
                onClick: () => detailNode && importSingle(detailNode),
              },
              installingId === str(detailNode.id) && !detailInstalled
                ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('repoImporting'))
                : detailInstalled
                  ? t('repoInstalled')
                  : t('repoImport'),
            ),
          ),
        )
      : null

    return h(
      'div',
      { className: 'vcg-repo-root' },
      h(StyleTag),
      V.styleTag(CSS),
      header,
      toolbar,
      h(
        'div',
        { className: 'vcg-repo-body vcg-scroll' },
        h(
          'div',
          { className: 'vcg-repo-content' },
          banners.length ? h('div', { className: 'vcg-repo-banners' }, banners) : null,
          store.state == null && !storeError
            ? h('div', { className: 'vcg-repo-loading' }, h(Spinner, { size: 18, label: t('repoStoreLoading') }))
            : null,
          browser,
          h(WorkflowsSection, {
            workflows: repoData ? repoData.workflows : [],
            loading: repoLoading,
            onOpenSettings: openSettings,
          }),
          h(CustomNodesSection, {
            nodes: installedCustomNodes,
            loading: nodesAsync.loading,
            error: nodesAsync.error ? msgOf(nodesAsync.error) : '',
            deletingId: deletingId,
            confirmId: deleteTarget,
            onDelete: requestDelete,
            onOpenSettings: openSettings,
            onReload: () => nodesAsync.reload(),
          }),
        ),
      ),
      detailNode
        ? h(
            Modal,
            {
              open: true,
              title: detailTitle,
              onClose: closeDetail,
              width: 'min(780px,100%)',
              footer: detailFooter,
            },
            h(NodeDetail, {
              node: detailNode,
              installed: detailInstalled,
              blocked: detailBlocked,
              importable: detailImportable,
              installing: installingId === str(detailNode.id),
              error: installError,
              onOpenSettings: openSettings,
            }),
          )
        : null,
    )
  }

  /* ------------------------------------------------------------------ css */

  const CSS = `
.vcg-repo-root{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;overflow:hidden}
.vcg-repo-root *{box-sizing:border-box}
.vcg-repo-header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:12px 18px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;flex:none}
.vcg-repo-header-main{display:flex;align-items:flex-start;gap:11px;min-width:0;flex:1 1 360px}
.vcg-repo-brand{width:38px;height:38px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;flex:none;color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 30%,transparent)}
.vcg-repo-headings{display:flex;flex-direction:column;gap:2px;min-width:0}
.vcg-repo-title{font-size:15px;font-weight:650;line-height:1.3}
.vcg-repo-subtitle{font-size:12px;color:var(--dsw-alias-label-secondary);max-width:680px}
.vcg-repo-header-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.vcg-repo-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 18px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex-wrap:wrap;flex:none}
.vcg-repo-toolbar-main{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0}
.vcg-repo-source-select{display:flex;align-items:center;gap:7px;flex:none}
.vcg-repo-source-label{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.vcg-repo-source-select .vcg-select{width:180px;padding:4px 8px;font-size:12px}
.vcg-repo-status{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.vcg-repo-addresses{display:flex;align-items:center;gap:6px 16px;flex-wrap:wrap;flex:1 1 420px;justify-content:flex-end;min-width:0}
.vcg-repo-address{display:flex;align-items:center;gap:6px;min-width:0;max-width:100%}
.vcg-repo-address-label{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.vcg-repo-address-value{max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;color:var(--dsw-alias-label-secondary)}
.vcg-repo-address-hint{flex-basis:100%;text-align:right;font-size:10.5px;color:var(--dsw-alias-label-secondary);opacity:.8}
.vcg-repo-body{flex:1;min-height:0;overflow:auto}
.vcg-repo-content{max-width:1440px;margin:0 auto;padding:12px 18px 28px;display:flex;flex-direction:column;gap:12px}
.vcg-repo-banners{display:flex;flex-direction:column;gap:8px}
.vcg-repo-notice-list{display:flex;flex-direction:column;gap:2px;margin-top:4px;max-height:220px;overflow:auto}
.vcg-repo-notice-item{font-size:11.5px;word-break:break-word;color:var(--dsw-alias-label-secondary)}
.vcg-repo-notice-error{color:var(--dsw-alias-state-error-primary)}
.vcg-repo-browser{display:grid;grid-template-columns:200px minmax(0,1fr);gap:14px;align-items:start}
.vcg-repo-aside{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:7px;display:flex;flex-direction:column;gap:2px;position:sticky;top:0}
.vcg-repo-cat{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);border-radius:8px;padding:6px 8px;font-size:12.5px;font-family:inherit;line-height:18px;cursor:pointer;text-align:left}
.vcg-repo-cat:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.vcg-repo-cat-on{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,transparent);color:var(--dsw-alias-brand-primary);font-weight:600}
.vcg-repo-cat-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-cat-count{font-size:11px;color:var(--dsw-alias-label-secondary);flex:none}
.vcg-repo-main{display:flex;flex-direction:column;gap:10px;min-width:0}
.vcg-repo-main-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}
.vcg-repo-main-title{font-size:13px;font-weight:650;display:flex;align-items:center;gap:7px}
.vcg-repo-main-count{font-size:11px;font-weight:400;color:var(--dsw-alias-label-secondary)}
.vcg-repo-main-hint{font-size:11px;color:var(--dsw-alias-label-secondary);opacity:.85;max-width:560px}
.vcg-repo-tools{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.vcg-repo-tools-left{display:flex;align-items:center;gap:8px;flex:1 1 260px;min-width:0;flex-wrap:wrap}
.vcg-repo-search{flex:1 1 220px;max-width:360px;min-width:150px}
.vcg-repo-search .vcg-input{padding:5px 9px;font-size:12.5px}
.vcg-repo-selected{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.vcg-repo-tools-right{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.vcg-repo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:10px}
.vcg-repo-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:10px 11px;display:flex;flex-direction:column;gap:7px;cursor:pointer;min-width:0;transition:border-color 120ms ease,background 120ms ease}
.vcg-repo-card:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.vcg-repo-card:focus-visible{outline:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,transparent);outline-offset:1px}
.vcg-repo-card-selected{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,transparent)}
.vcg-repo-card-installed{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 5%,var(--dsw-alias-bg-layer-1))}
.vcg-repo-card-head{display:flex;align-items:flex-start;gap:8px;min-width:0}
.vcg-repo-check{width:14px;height:14px;margin:2px 0 0;flex:none;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}
.vcg-repo-check:disabled{cursor:default;opacity:.55}
.vcg-repo-card-title{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.vcg-repo-card-name{font-size:13px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-card-sub{font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-card-desc{font-size:12px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:32px;word-break:break-word}
.vcg-repo-card-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.vcg-repo-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:2px}
.vcg-repo-card-state{display:flex;align-items:center;gap:4px;min-width:0}
.vcg-repo-dot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}
.vcg-repo-section{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:12px 14px}
.vcg-repo-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.vcg-repo-section-title{font-size:13px;font-weight:650}
.vcg-repo-section-desc{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:2px;max-width:760px}
.vcg-repo-section-hint{margin-top:8px}
.vcg-repo-wf-list{display:flex;flex-direction:column;gap:0}
.vcg-repo-wf-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-top:1px dashed var(--dsw-alias-border-l1);padding:8px 0}
.vcg-repo-wf-row:first-child{border-top:none;padding-top:0}
.vcg-repo-wf-main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.vcg-repo-wf-head{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.vcg-repo-wf-name{font-size:12.5px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-wf-desc{font-size:11.5px;color:var(--dsw-alias-label-secondary);word-break:break-word}
.vcg-repo-wf-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:none}
.vcg-repo-custom-list{display:flex;flex-direction:column;gap:6px}
.vcg-repo-custom-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);padding:8px 10px;flex-wrap:wrap}
.vcg-repo-custom-main{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1 1 200px}
.vcg-repo-custom-name{font-size:12.5px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-custom-sub{font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-loading{display:flex;align-items:center;justify-content:center;padding:48px 0}
.vcg-repo-loading-inline{padding:18px 0}
.vcg-repo-detail{display:flex;flex-direction:column;gap:10px}
.vcg-repo-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}
.vcg-repo-detail-titlewrap{display:flex;flex-direction:column;gap:2px;min-width:0}
.vcg-repo-detail-title{font-size:15px;font-weight:650}
.vcg-repo-detail-sub{font-size:12px;color:var(--dsw-alias-label-secondary)}
.vcg-repo-detail-desc{font-size:12.5px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word}
.vcg-repo-port-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.vcg-repo-detail-block{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-2);padding:9px 10px;display:flex;flex-direction:column;gap:6px;min-width:0}
.vcg-repo-detail-block-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.vcg-repo-detail-block-title{font-size:12px;font-weight:650;color:var(--dsw-alias-label-primary)}
.vcg-repo-detail-block-body{display:flex;flex-direction:column;gap:5px;min-width:0}
.vcg-repo-port{display:flex;align-items:center;gap:7px;font-size:12.5px;min-width:0;flex-wrap:wrap}
.vcg-repo-port-label{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-port-type{font-size:10.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-secondary);letter-spacing:.02em}
.vcg-repo-param-list{display:flex;flex-direction:column;gap:6px}
.vcg-repo-param-row{display:grid;grid-template-columns:minmax(110px,1.2fr) auto minmax(92px,.9fr);gap:5px 10px;align-items:center;border-top:1px solid var(--dsw-alias-border-l1);padding-top:6px;font-size:12px}
.vcg-repo-param-row:first-child{border-top:none;padding-top:0}
.vcg-repo-param-main{display:flex;flex-direction:column;gap:0;min-width:0}
.vcg-repo-param-name{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-param-id{font-size:10.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-param-default{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis}
.vcg-repo-param-extra{grid-column:1 / -1;font-size:11px;color:var(--dsw-alias-label-secondary);word-break:break-word}
.vcg-repo-kv-row{display:grid;grid-template-columns:118px minmax(0,1fr);gap:6px 10px;font-size:12px;align-items:start}
.vcg-repo-kv-key{color:var(--dsw-alias-label-secondary);font-size:11.5px}
.vcg-repo-kv-val{min-width:0;word-break:break-word}
.vcg-repo-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px}
.vcg-repo-modal-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;flex-wrap:wrap}
.vcg-repo-modal-hint{font-size:11.5px;color:var(--dsw-alias-label-secondary);max-width:440px}
@media (max-width:860px){
  .vcg-repo-header,.vcg-repo-toolbar,.vcg-repo-content{padding-left:12px;padding-right:12px}
  .vcg-repo-browser{grid-template-columns:minmax(0,1fr)}
  .vcg-repo-aside{position:static;flex-direction:row;overflow:auto;flex-wrap:nowrap;scrollbar-width:thin}
  .vcg-repo-cat{flex:none}
  .vcg-repo-addresses{justify-content:flex-start}
  .vcg-repo-address-hint{text-align:left}
  .vcg-repo-port-grid{grid-template-columns:minmax(0,1fr)}
  .vcg-repo-header-actions{justify-content:flex-start}
}
@media (max-width:520px){
  .vcg-repo-grid{grid-template-columns:minmax(0,1fr)}
  .vcg-repo-source-select .vcg-select{width:150px}
  .vcg-repo-kv-row{grid-template-columns:96px minmax(0,1fr)}
}
`

  V.NodeRepoPage = NodeRepoPage
  V.RepoPanelIcon = RepoPanelIcon
})(V)

;
/* ==== part: view.js ==== */
/* ============================================================================
 * VCG 会话视图（聊天 → VCG 画布模式）
 *
 * 注册为 conversation.view 的一个页签（由 parts/apply.js 完成注册）。
 * 在传统对话消息区的位置渲染完整节点工作流画布，并在画布上方提供
 * 「AI 自动组建工作流」模块：用户用自然语言描述需求即可生成/改写画布。
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { React, h } = V
  const { Button, Field, TextArea, Banner, Spinner, Empty, IconButton, Glyph, Badge, Modal } = V.ui

  const VIEW_ID = 'vcg'

  /* ----------------------------------------------------- default workflow */

  /** Build the four-node starter workflow used before a canvas is saved. */
  function defaultWorkflow(defs) {
    const available = new Set((defs || []).map((def) => def.id))
    const nodes = []
    const edges = []
    let cursor = 0
    function push(type, x, y, params) {
      if (!available.has(type)) return null
      cursor += 1
      const id = 'n' + cursor
      nodes.push({ id, type, x, y, params: params || {}, title: '' })
      return id
    }
    const promptInput = push('prompt-input', 60, 120, {
      positive: 'a cyberpunk corgi wearing neon goggles, cinematic lighting, highly detailed',
      negative: 'lowres, blurry, watermark, text',
    })
    const modelLoader = push('model-loader', 60, 340, {})
    const emptyLatent = push('empty-latent-image', 60, 520, { width: 1280, height: 720, batch: 1 })
    const ksampler = push('ksampler', 400, 240, {})
    const vaeDecode = push('vae-decode', 720, 240, {})
    const imageOutput = push('image-output', 1000, 240, {})
    let edgeIndex = 0
    const link = (fromNode, fromPort, toNode, toPort) => {
      if (!fromNode || !toNode) return
      edgeIndex += 1
      edges.push({ id: 'e' + edgeIndex, from: { node: fromNode, port: fromPort }, to: { node: toNode, port: toPort } })
    }
    link(promptInput, 'positive', ksampler, 'positive')
    link(promptInput, 'negative', ksampler, 'negative')
    link(modelLoader, 'model', ksampler, 'model')
    link(emptyLatent, 'latent', ksampler, 'latent')
    link(ksampler, 'image', vaeDecode, 'image')
    link(vaeDecode, 'image', imageOutput, 'image')
    return {
      version: 1,
      id: 'wf-' + V.uid('canvas'),
      name: '未命名工作流',
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewport: { x: 0, y: 0, scale: 1 },
      nodes,
      edges,
    }
  }

  /* -------------------------------------------------------- AI build panel */

  /**
   * 画布上方的 AI 组建模块：自然语言 → 校验后的工作流 JSON。
   * @param {{workflow: object, onBuilt: (workflow: object) => void}} props
   */
  function AiBuilder({ workflow, onBuilt, disabled }) {
    const [prompt, setPrompt] = React.useState('')
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState('')
    const [reply, setReply] = React.useState('')
    const [notes, setNotes] = React.useState([])
    const [usedModel, setUsedModel] = React.useState('')

    const generate = async () => {
      const text = prompt.trim()
      if (text === '' || busy) return
      setBusy(true)
      setError('')
      setReply('')
      setNotes([])
      try {
        const result = await V.rpc('buildWorkflow', { prompt: text, current: workflow || undefined })
        if (!result || !result.workflow) throw new Error('AI 未返回可用工作流')
        onBuilt(result.workflow)
        setReply(result.reply || '')
        setNotes(Array.isArray(result.notes) ? result.notes : [])
        setUsedModel(result.usedModel || '')
        setPrompt('')
      } catch (err) {
        setError(V.messageOf(err))
      } finally {
        setBusy(false)
      }
    }

    return h(
      'div',
      { className: 'vcg-view-aibuild' },
      h(
        'div',
        { className: 'vcg-row', style: { gap: 6, marginBottom: 6 } },
        h('span', { className: 'vcg-view-aibuild-icon' }, h(Glyph, { name: 'sparkles', size: 15 })),
        h('span', { className: 'vcg-title', style: { fontSize: 13 } }, 'AI 自动组建工作流'),
        h('span', { className: 'vcg-subtitle' }, '用一句话描述画面与生成方式，自动生成/改写节点连线'),
        h('span', { style: { flex: 1 } }),
        usedModel ? h(Badge, null, usedModel) : null,
      ),
      h(
        'div',
        { className: 'vcg-row', style: { alignItems: 'flex-end', gap: 8 } },
        h(TextArea, {
          value: prompt,
          onChange: setPrompt,
          rows: 2,
          disabled: busy,
          placeholder: '例如：生成一张宽屏 16:9 的赛博朋克城市夜景，1280x720，负面词排除水印和低清；再给一个产品海报版本。',
          onKeyDown: (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault()
              generate()
            }
          },
        }),
        h(Button, { variant: 'primary', onClick: generate, disabled: busy || disabled, icon: busy ? undefined : 'sparkles' }, busy ? 'AI 正在搭建…' : '自动组建'),
      ),
      error ? h('div', { style: { marginTop: 6 } }, h(Banner, { kind: 'error', title: '自动组建失败' }, error)) : null,
      reply ? h('div', { style: { marginTop: 6 } }, h(Banner, { kind: 'success', title: '已生成工作流' }, reply)) : null,
      notes && notes.length > 0
        ? h('div', { style: { marginTop: 6 } }, h(Banner, { kind: 'warn', title: '自动修正 / 提示' }, notes.join('；')))
        : null,
    )
  }

  /* --------------------------------------------------------- canvas view */

  /**
   * 会话内的 VCG 画布视图（conversation.view 入口）。
   * @param {object} props - inject 提供的 sessionId + view owner props。
   */
  function ChatCanvasView(props) {
    const sessionId = props && props.sessionId
    const store = V.useStore()
    const state = store.state
    const [nodeDefs, setNodeDefs] = React.useState([])
    const [workflow, setWorkflow] = React.useState(null)
    const [results, setResults] = React.useState({})
    const [selectedId, setSelectedId] = React.useState(null)
    const [running, setRunning] = React.useState(false)
    const [fullscreen, setFullscreen] = React.useState(false)
    const [debugBusy, setDebugBusy] = React.useState(false)
    const [debugReport, setDebugReport] = React.useState(null)
    const [debugError, setDebugError] = React.useState('')
    const [saving, setSaving] = React.useState(false)
    const [loadError, setLoadError] = React.useState('')
    const [runError, setRunError] = React.useState('')
    const [notice, setNotice] = React.useState('')
    const [ready, setReady] = React.useState(false)
    const [lastSaved, setLastSaved] = React.useState('')
    const runToken = React.useRef(0)
    const loadedRef = React.useRef(false)
    const canvasKey = sessionId ? 'session:' + sessionId : 'session:default'

    /* Load node definitions, saved canvas and host state on mount. */
    React.useEffect(() => {
      let alive = true
      setReady(false)
      setLoadError('')
      loadedRef.current = false
      async function load() {
        try {
          if (!V.store.state) await V.refresh().catch(() => {})
          const nodes = await V.rpc('listNodes')
          if (!alive) return
          const defs = (nodes && nodes.nodes) || []
          setNodeDefs(defs)
          let saved = null
          try {
            saved = await V.rpc('getCanvas', { key: canvasKey })
          } catch {
            saved = null
          }
          if (!alive) return
          const existing = saved && saved.workflow
          if (existing && Array.isArray(existing.nodes) && existing.nodes.length > 0) {
            setWorkflow(existing)
            if (existing.viewport) setViewportHint(existing.viewport)
          } else {
            setWorkflow(defaultWorkflow(defs))
          }
          setLastSaved((saved && saved.updatedAt) || '')
        } catch (err) {
          if (alive) setLoadError(V.messageOf(err))
        } finally {
          if (alive) {
            setReady(true)
            loadedRef.current = true
          }
        }
      }
      load()
      return () => {
        alive = false
      }
    }, [canvasKey])

    const [viewportHint, setViewportHint] = React.useState(null)

    /* Debounced autosave; skipped until the initial load completes. */
    const saveTimer = React.useRef(null)
    const persist = React.useCallback(
      (next) => {
        if (!next || !loadedRef.current) return
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(async () => {
          setSaving(true)
          try {
            const value = await V.rpc('saveCanvas', { key: canvasKey, workflow: next })
            setLastSaved((value && value.updatedAt) || new Date().toISOString())
            setNotice('')
          } catch (err) {
            setNotice('自动保存失败：' + V.messageOf(err))
          } finally {
            setSaving(false)
          }
        }, 700)
      },
      [canvasKey],
    )
    React.useEffect(
      () => () => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
      },
      [],
    )

    const onChange = React.useCallback(
      (next) => {
        setWorkflow(next)
        persist(next)
      },
      [persist],
    )

    /* Run the whole workflow through the Host engine. */
    const runAll = async () => {
      if (!workflow || running) return
      const token = ++runToken.current
      setRunning(true)
      setRunError('')
      const seeded = {}
      for (const node of workflow.nodes) seeded[node.id] = { status: 'running' }
      setResults(seeded)
      try {
        const value = await V.rpc('runWorkflow', { key: canvasKey, workflow, sessionId: sessionId || undefined })
        if (token !== runToken.current) return
        if (value && value.results) setResults(value.results)
        if (value && value.error) setRunError(value.error)
      } catch (err) {
        if (token !== runToken.current) return
        setRunError(V.messageOf(err))
        setResults((prev) => {
          const next = {}
          for (const key of Object.keys(prev || {})) next[key] = { status: 'error', error: V.messageOf(err) }
          return next
        })
      } finally {
        if (token === runToken.current) setRunning(false)
      }
    }

    /* Run one node (its upstream dependencies are resolved by the Host). */
    const runNode = async (nodeId) => {
      if (!workflow || running) return
      const token = ++runToken.current
      setRunning(true)
      setRunError('')
      setResults((prev) => Object.assign({}, prev, { [nodeId]: { status: 'running' } }))
      try {
        const value = await V.rpc('runNode', { key: canvasKey, nodeId, workflow, sessionId: sessionId || undefined })
        if (token !== runToken.current) return
        const result = value && value.result
        if (result) setResults((prev) => Object.assign({}, prev, { [nodeId]: result }))
      } catch (err) {
        if (token !== runToken.current) return
        setRunError(V.messageOf(err))
        setResults((prev) => Object.assign({}, prev, { [nodeId]: { status: 'error', error: V.messageOf(err) } }))
      } finally {
        if (token === runToken.current) setRunning(false)
      }
    }

    const stop = () => {
      runToken.current += 1
      setRunning(false)
      setNotice('已停止等待当前运行结果（云端请求可能仍在服务端完成）。')
    }

    /* Debug 运行：只校验模型可加载性/完整性/安全性，不生成内容。 */
    const debugRun = async () => {
      if (!workflow || debugBusy) return
      setDebugBusy(true)
      setDebugError('')
      try {
        const report = await V.rpc('debugWorkflow', {
          key: canvasKey,
          workflow,
          sessionId: sessionId || undefined,
        })
        setDebugReport(report)
      } catch (err) {
        setDebugError(V.messageOf(err))
      } finally {
        setDebugBusy(false)
      }
    }

    /* 画布全屏：固定覆盖整个窗口，Esc 退出。 */
    const toggleFullscreen = () => setFullscreen((value) => !value)
    React.useEffect(() => {
      if (!fullscreen) return undefined
      const onKey = (event) => {
        if (event.key === 'Escape') setFullscreen(false)
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }, [fullscreen])

    const openChat = () => {
      if (props && typeof props.openView === 'function') props.openView('chat', '')
      else if (props && typeof props.completeViewRequest === 'function') props.completeViewRequest()
    }

    const outputDirHint = state && state.outputDir ? '输出目录：工作区 / ' + state.outputDir : '输出目录：工作区 / vcg-output'

    if (!ready) {
      return h(
        'div',
        { className: 'vcg-root vcg-view' },
        h(V.StyleTag, null),
        h('style', { dangerouslySetInnerHTML: { __html: VIEW_CSS } }),
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
          h(Spinner, { label: '正在载入 VCG 画布…' }),
        ),
      )
    }

    return h(
      'div',
      { className: 'vcg-root vcg-view' + (fullscreen ? ' vcg-view-full' : ''), onContextMenu: (event) => event.preventDefault() },
      h(V.StyleTag, null),
      h('style', { dangerouslySetInnerHTML: { __html: VIEW_CSS } }),
      loadError ? h('div', { style: { padding: '8px 12px 0' } }, h(Banner, { kind: 'error', title: 'VCG 画布载入失败' }, loadError)) : null,
      h(
        'div',
        { className: 'vcg-view-top' },
        h(
          'div',
          { className: 'vcg-view-topbar' },
          h('span', { className: 'vcg-view-brand' }, h(Glyph, { name: 'sparkles', size: 15 }), 'VCG 视觉控制生成器'),
          h(Badge, { color: '#7c5cff' }, (store.state && store.state.local && store.state.local.enabled ? '本地运算' : '云端 API')),
          store.state && store.state.defaults && store.state.defaults.imageModel
            ? h(Badge, null, store.state.defaults.imageModel)
            : null,
          h('span', { className: 'vcg-subtitle' }, outputDirHint),
          h('span', { style: { flex: 1 } }),
          saving ? h('span', { className: 'vcg-subtitle' }, '保存中…') : lastSaved ? h('span', { className: 'vcg-subtitle' }, '已保存 ' + V.formatTime(lastSaved)) : null,
          h(
            Button,
            { variant: 'primary', size: 'sm', onClick: runAll, disabled: running || !workflow, icon: running ? undefined : 'play' },
            running ? '运行中…' : '运行工作流',
          ),
          h(
            Button,
            { size: 'sm', onClick: debugRun, disabled: debugBusy || running || !workflow, icon: debugBusy ? undefined : 'check', title: 'Debug 运行：只校验模型能否加载、工作流/节点完整性与安全性，不生成内容' },
            debugBusy ? '校验中…' : 'Debug 运行',
          ),
          h(
            IconButton,
            { label: fullscreen ? '退出全屏' : '全屏画布', title: fullscreen ? '退出全屏（Esc）' : '全屏画布', onClick: toggleFullscreen },
            h(Glyph, { name: fullscreen ? 'close' : 'fit', size: 15 }),
          ),
          h(Button, { size: 'sm', variant: 'ghost', icon: 'back', onClick: openChat }, '切换到对话'),
        ),
        h(AiBuilder, { workflow, onBuilt: (next) => onChange(next), disabled: running }),
      ),
      runError ? h('div', { style: { padding: '0 12px 6px' } }, h(Banner, { kind: 'error', title: '运行失败', action: h(IconButton, { label: '关闭', onClick: () => setRunError('') }, h(Glyph, { name: 'close', size: 14 })) }, runError)) : null,
      notice ? h('div', { style: { padding: '0 12px 6px' } }, h(Banner, { kind: 'info' }, notice)) : null,
      debugError ? h('div', { style: { padding: '0 12px 6px' } }, h(Banner, { kind: 'error', title: 'Debug 运行失败' }, debugError)) : null,
      h(Modal, {
        open: Boolean(debugReport),
        title: 'Debug 运行报告（不生成内容）',
        onClose: () => setDebugReport(null),
        width: 'min(760px,100%)',
        footer: [
          h('span', { key: 'hint', className: 'vcg-subtitle', style: { flex: 1 } }, debugReport && debugReport.ok ? '所有必需检查通过，可以正式运行。' : '存在失败项，请按提示修正后再运行。'),
          h(Button, { key: 'close', onClick: () => setDebugReport(null) }, '关闭'),
          debugReport && debugReport.ok
            ? h(Button, { key: 'run', variant: 'primary', icon: 'play', onClick: () => { setDebugReport(null); runAll() } }, '正式运行')
            : null,
        ],
      }, h(V.ui.DebugReport, { report: debugReport })),
      h(
        'div',
        { className: 'vcg-view-canvas' },
        nodeDefs.length === 0
          ? h(Empty, { title: '还没有节点定义', hint: '请到「设置 → VCG 视觉控制生成器 → 节点仓库」同步节点，或确认 DSH_VCG/nodes 中已有节点 JSON。', icon: 'layers' })
          : workflow
            ? h(V.Canvas, {
                key: canvasKey,
                workflow,
                nodeDefs,
                results,
                selectedId,
                onSelect: setSelectedId,
                onChange,
                onRunNode: runNode,
                onRunAll: runAll,
                onStop: stop,
                running,
                readOnly: false,
                outputDirHint,
              })
            : null,
      ),
    )
  }

  const VIEW_CSS = `
.vcg-view{height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.vcg-view-top{display:flex;flex-direction:column;gap:8px;padding:10px 12px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);flex:none}
.vcg-view-topbar{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}
.vcg-view-brand{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;white-space:nowrap}
.vcg-view-aibuild{display:flex;flex-direction:column;gap:2px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:10px;padding:8px 10px}
.vcg-view-aibuild-icon{color:var(--dsw-alias-brand-primary);display:inline-flex}
.vcg-view-canvas{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.vcg-view-full{position:fixed;inset:0;z-index:80;background:var(--dsw-alias-bg-base);height:100vh;width:100vw;box-shadow:0 0 0 1px var(--dsw-alias-border-l2)}
`

  V.ChatCanvasView = ChatCanvasView
  V.__vcgViewId = VIEW_ID
  V.__defaultWorkflow = defaultWorkflow
})(V)

;
/* ==== part: apply.js ==== */
/* ============================================================================
 * VCG 客户端装配：把各部件注册进宿主 Slot 树，并接上会话导航适配。
 *
 * 注册面：
 *   - settings.section              → 设置页（云端 API / 本地模式 / 专业模式 / 节点仓库）
 *   - sidebar.panellist            → 左侧栏 VCG 面板图标
 *   - main (key: dsh-vcg)          → VCG 主工作台（项目 / 工作流 / 输出）
 *   - conversation.view (id: vcg)  → 聊天 VCG 画布模式（替代传统对话消息区）
 *   - conversation.hero.options    → 新建聊天时的「VCG 画布」选择
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { React, h } = V
  const { Glyph, Empty } = V.ui

  const PACKAGE_ID = 'dsh-vcg'
  const REPO_PACKAGE_ID = 'dsh-vcg-repo'
  const VIEW_ID = 'vcg'

  /** Guard: render a friendly placeholder if a part failed to materialize. */
  function guard(component, label) {
    if (typeof component === 'function') return component
    return function MissingPart() {
      return h(Empty, { title: label + ' 未就绪', hint: '客户端构建缺少对应模块，请重新构建 client.js。', icon: 'warning' })
    }
  }

  /* ------------------------------------------------ new-chat VCG selector */

  /**
   * Blank-session (Hero) option: remember VCG as the preferred view for this
   * new conversation. The Host Conversation store reads the preference when it
   * materializes; our "新建 VCG 对话" flow writes it before opening.
   */
  function HeroVcgOption({ sessionId }) {
    const [preferred, setPreferred] = React.useState(() => V.readConversationView(sessionId) === VIEW_ID)
    React.useEffect(() => {
      setPreferred(V.readConversationView(sessionId) === VIEW_ID)
    }, [sessionId])
    const toggle = () => {
      const next = !preferred
      V.setPreferredView(sessionId, next ? VIEW_ID : 'chat')
      setPreferred(next)
    }
    return h(
      'button',
      {
        type: 'button',
        className: 'vcg-hero-option' + (preferred ? ' vcg-hero-option-on' : ''),
        title: preferred
          ? '本会话偏好 VCG 画布（发送首条消息后如未自动切换，点顶部「VCG 画布」页签）'
          : '新建聊天时使用 VCG 画布模式替代传统对话框',
        onClick: toggle,
        'aria-pressed': preferred,
      },
      h(Glyph, { name: 'sparkles', size: 14 }),
      preferred ? 'VCG 画布' : 'VCG 模式',
    )
  }

  /* ------------------------------------------------------------- apply */

  function apply(ctx) {
    V.bindLocale(ctx)
    const slots = ctx.get('slots')
    if (!slots) {
      console.warn('[vcg] slots service unavailable; plugin inactive')
      return
    }

    /* Conversation / workspace navigation adapters (best effort). */
    try {
      const uiWorkspace = ctx.get('uiWorkspace')
      const layout = ctx.get('layout')
      V.setNav({
        ...(uiWorkspace
          ? {
              openSession: (sessionId) => uiWorkspace.openSession(sessionId),
              openWorkspace: (workspaceId, beforeOpen) => uiWorkspace.openWorkspace(workspaceId, beforeOpen),
              connectWorkspace: (workspaceId, options) => uiWorkspace.connectWorkspace(workspaceId, options),
              startSession: (workspaceId, options) => uiWorkspace.startSession(workspaceId, options),
            }
          : {}),
        openPanel: (panelId) => {
          if (layout && typeof layout.selectPanel === 'function') layout.selectPanel(panelId)
        },
        setPreferredView: V.setPreferredView,
        readConversationView: V.readConversationView,
      })
    } catch (error) {
      console.warn('[vcg] navigation adapters unavailable', error)
    }

    /* Warm the shared Host state so pages render without an extra round-trip. */
    void V.refresh().catch(() => {})

    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            {
              name: 'settings.section',
              id: PACKAGE_ID,
              order: 42,
              label: () => V.t('appName'),
            },
            guard(V.SettingsPage, '设置页'),
          ),
        ),
      'vcg: settings section',
    )

    ctx.effect(
      () =>
        slots.inject('sidebar.panellist', () =>
          slots.register(
            {
              name: 'sidebar.panellist',
              id: PACKAGE_ID,
              order: 22,
              label: () => V.t('appName'),
            },
            guard(V.PanelIcon, '侧栏图标'),
          ),
        ),
      'vcg: sidebar panel',
    )

    ctx.effect(
      () =>
        slots.inject('main', () =>
          slots.register(
            {
              name: 'main',
              key: PACKAGE_ID,
            },
            guard(V.StudioPage, 'VCG 工作台'),
          ),
        ),
      'vcg: studio page',
    )

    ctx.effect(
      () =>
        slots.inject('sidebar.panellist', () =>
          slots.register(
            {
              name: 'sidebar.panellist',
              id: REPO_PACKAGE_ID,
              order: 24,
              label: () => 'VCG 节点工作流仓库',
            },
            guard(V.RepoPanelIcon || V.PanelIcon, '节点仓库图标'),
          ),
        ),
      'vcg: node repository panel',
    )

    ctx.effect(
      () =>
        slots.inject('main', () =>
          slots.register(
            {
              name: 'main',
              key: REPO_PACKAGE_ID,
            },
            guard(V.NodeRepoPage, 'VCG 节点工作流仓库'),
          ),
        ),
      'vcg: node repository page',
    )

    ctx.effect(
      () =>
        slots.inject('conversation.view', () =>
          slots.register(
            {
              name: 'conversation.view',
              id: VIEW_ID,
              order: 15,
              locale: V.NS,
              label: () => 'VCG 画布',
              inject: (sessionId) => ({ sessionId }),
            },
            guard(V.ChatCanvasView, 'VCG 画布视图'),
          ),
        ),
      'vcg: conversation view',
    )

    ctx.effect(
      () =>
        slots.inject('conversation.hero.options', () =>
          slots.register(
            {
              name: 'conversation.hero.options',
              id: 'vcg-new-chat',
              order: 12,
              locale: V.NS,
              inject: (sessionId) => ({ sessionId }),
            },
            HeroVcgOption,
          ),
        ),
      'vcg: new chat selector',
    )
  }

  const HERO_CSS = `
.vcg-hero-option{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:3px 10px;font-size:12px;font-family:inherit;cursor:pointer;white-space:nowrap}
.vcg-hero-option:hover{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.vcg-hero-option-on{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,transparent);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,var(--dsw-alias-bg-layer-1))}
`
  // The hero selector is tiny; inject its styles once through a wrapper so the
  // component stays a plain function.
  function withHeroStyle(component) {
    return function StyledHeroOption(props) {
      return h(React.Fragment, null, h('style', { dangerouslySetInnerHTML: { __html: HERO_CSS } }), h(component, props))
    }
  }
  HeroVcgOption = withHeroStyle(HeroVcgOption)

  V.apply = apply
  V.inject = ['slots', 'locale']
})(V)
;

    if (typeof V.apply !== 'function') throw new Error('vcg client: parts/apply.js must export V.apply')
    return {
      name: "@local/dsh-vcg",
      inject: V.inject || ['slots', 'locale'],
      apply: V.apply,
    }
  },
})
