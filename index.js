/**
 * VCG 视觉控制生成器 (Visual Control Generator) — Host half.
 *
 * One shared operation layer serves two callers:
 *   - the Web UI through an authenticated JSON RPC route on the shared /api
 *     channel (`ctx.connection.fetch`), and
 *   - the model through the `vcg` agent tool.
 *
 * Features:
 *   - state persisted at `$DSH_PROFILE_DIR/data/dsh-vcg/state.json` (0600),
 *   - provider auto-detection via `ctx.llm` + `ctx.credentials`,
 *   - cloud image/video generation (§9 Alibaba Token Plan chat-completions
 *     protocol plus OpenAI-style routes), local ComfyUI execution,
 *   - node/workflow repository sync (DSH_VCG_repo) with builtin fallback,
 *   - AI workflow builder via `ctx.llm.stream`,
 *   - topological workflow execution with §4 builtin executors,
 *   - VCG project workspaces registered through `ctx.workspaceRegistry`.
 *
 * No `@deepseek-ai/*` import: host services are resolved with ctx.get/inject.
 */

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { clamp, isPlainObject, jsonResponse, messageOf, nowIso, normalizeBaseUrl, positiveInt, tail, uid, uniqueStrings } from './lib/util.js'
import {
  DEFAULT_MODEL_CATALOG,
  REPO_BRANCHES,
  StateStore,
  dataDirectory,
  defaultModelsDir,
  maskProvider,
  normalizeOutputDir,
  normalizeProvider,
  normalizeRepoBranch,
} from './lib/state.js'
import {
  BUILTIN_FNS,
  NODE_CATEGORIES,
  PARAM_TYPES,
  PORT_TYPES,
  NodeStore,
  decorateNode,
  prepareImportedNode,
  validateNodeDef,
  joinUrl,
  resolveRepoBranchBase,
} from './lib/nodes.js'
import {
  KNOWN_IMAGE_MODELS,
  KNOWN_TEXT_MODELS,
  catalogModels,
  chatText,
  classifyModel,
  listProviderModels,
  preferredModel,
  generateImage as generateCloudImage,
  generateVideo as generateCloudVideo,
  mergeCatalogs,
  testProviderConnection,
} from './lib/cloud.js'
import { Engine, addUsage, emptyUsage, normalizeUsage, queryPath, textValue, urlListOf } from './lib/engine.js'
import { buildWorkflowPrompt, collectStreamText, extractJsonObject, validateGeneratedPlan } from './lib/builder.js'
import { defaultProjectsRoot, projectSlug, requireProjectName, sanitizeProjectName, suggestProjectPath } from './lib/projects.js'
import { baseName, isWithin, mimeForPath } from './lib/paths.js'
import { emptyWorkflow, typesCompatible, validateWorkflowShape, validateWorkflowWithDefs } from './lib/workflow.js'
import { topoSort } from './lib/graph.js'
import { runStaticDebug, summarizeChecks } from './lib/debug.js'
import { fetchJson } from './lib/http.js'
import { LocalTools } from './lib/localtools.js'

/** RPC route path on the shared API channel. */
const RPC_PATH = '/api/dsh-vcg/rpc'
/** Default request body cap; canvas saves may be larger. */
const MAX_BODY_BYTES = 256 * 1024
const MAX_CANVAS_BODY_BYTES = 1024 * 1024
/** Largest file read back as a data URL. */
const MAX_DATA_URL_BYTES = 12 * 1024 * 1024
/** Known API root of the global Alibaba Token Plan route (§9). */
const DEFAULT_BAILIAN_BASE_URL = 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'
const DEFAULT_BAILIAN_KEY_REF = 'BAILIAN_TPP_API_KEY'
/** Methods allowed to carry a large body (canvas / imported node JSON). */
const LARGE_BODY_METHODS = new Set(['saveCanvas', 'importNode', 'saveSettings'])
/** Per-provider `/models` detection cap (§14.3); detection is best-effort. */
const PROVIDER_DETECT_TIMEOUT_MS = 8000

/** Directory of this plugin file. */
const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url))

/** Whether a provider kind needs an Authorization Bearer key. */
function needsApiKey() {
  return true
}

/**
 * Compose a signal that aborts after the per-provider detection cap.
 * Returns the parent signal unchanged if no timeout primitive is available.
 */
function detectionSignal(parent) {
  let timeout
  try {
    timeout = AbortSignal.timeout(PROVIDER_DETECT_TIMEOUT_MS)
  } catch {
    return parent
  }
  if (!parent) return timeout
  try {
    return AbortSignal.any([parent, timeout])
  } catch {
    return parent
  }
}

/** Empty model catalog in the state `models` shape. */
function emptyModelCatalog() {
  return { image: [], video: [], text: [], audio: [], all: [] }
}

/** One VCG studio instance owns state, nodes, execution, RPC, tool, prompt. */
class VcgStudio {
  constructor(ctx, config) {
    this.ctx = ctx
    this.log = ctx.logger ?? console
    this.config = isPlainObject(config) ? config : {}
    this.directory = dataDirectory()
    this.stateFile = join(this.directory, 'state.json')
    this.customNodesDir = join(this.directory, 'node-custom')
    this.nodeRepoCacheDir = join(this.directory, 'node-repo')
    this.abort = new AbortController()
    this.disposed = false
    this.globalKeyAvailable = false
    this.llmAvailable = false
    this.injectedDisposers = []
    this.store = new StateStore({ directory: this.directory, config: this.config, logger: this.log })
    this.nodes = new NodeStore({
      pluginDir: PLUGIN_DIR,
      cacheDir: this.nodeRepoCacheDir,
      customDir: this.customNodesDir,
      logger: this.log,
    })
    this.engine = new Engine(this)
    /** Local toolchain + model directory manager (§16.5). */
    this.localTools = new LocalTools({
      directory: this.directory,
      modelsDir: () => this.state.local.modelsDir || defaultModelsDir(this.directory),
      logger: this.log,
    })
    /** Live run records keyed by canvas key (§13.1), polled by the UI. */
    this.runs = new Map()
    /** Short-lived repository catalog cache keyed by source|base|branch (§16.4). */
    this.repoCatalogCache = new Map()
  }

  /* -------------------------------------------------------------- lifecycle */

  async init() {
    await this.store.load()
    try {
      const loaded = await this.nodes.load()
      for (const warning of loaded.warnings) this.log?.warn?.(`dsh-vcg: ${warning}`)
    } catch (error) {
      this.log?.warn?.(`dsh-vcg: 节点定义加载失败: ${messageOf(error)}`)
    }
    this.registerRoutes()
    this.registerTool()
    this.registerPromptSection()
    this.repoCatalogCache = new Map()
    this.watchServices()
  }

  /** Detect the LLM provider catalog as soon as the service appears. */
  watchServices() {
    try {
      const dispose = this.ctx.inject(['llm'], (llmCtx) => {
        this.llmAvailable = true
        void this.detectProviders().catch((error) => {
          this.log?.warn?.(`dsh-vcg: Provider 自动检测失败: ${messageOf(error)}`)
        })
        return () => {
          this.llmAvailable = false
        }
      })
      if (typeof dispose === 'function') this.injectedDisposers.push(dispose)
    } catch (error) {
      this.log?.warn?.(`dsh-vcg: 无法等待 llm 服务: ${messageOf(error)}`)
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    try {
      this.abort.abort()
    } catch {
      /* ignore a double abort */
    }
    for (const dispose of this.injectedDisposers.splice(0)) {
      try {
        dispose()
      } catch {
        /* ignore */
      }
    }
    this.runs.clear()
    this.localTools?.dispose?.()
    void this.persist()
  }

  get state() {
    return this.store.state
  }

  async persist() {
    return this.store.saveQuietly()
  }

  /** Append one generated-file record to the output history (newest first). */
  recordOutput(entry) {
    if (!entry || typeof entry.path !== 'string') return
    this.state.outputs = [entry, ...(this.state.outputs ?? [])].slice(0, 500)
  }

  /* ------------------------------------------------------- host adapter API */

  nodeMap() {
    return this.nodes.nodes
  }

  nodeList() {
    return this.nodes.nodesList()
  }

  outputDirName() {
    return normalizeOutputDir(this.state.outputDir)
  }

  providerById(id) {
    return this.state.providers.find((provider) => provider.id === String(id ?? ''))
  }

  /** Enabled providers first, then everything else. */
  enabledProviders() {
    const enabled = this.state.providers.filter((provider) => provider.enabled !== false)
    return enabled.length > 0 ? enabled : this.state.providers
  }

  /**
   * Pick the provider + model for one capability without any I/O.
   * @param {'image'|'video'|'text'} capability
   * @param {string} [requestedModel]
   * @param {string} [providerHint]
   */
  selectProvider(capability, requestedModel, providerHint) {
    const providers = this.enabledProviders()
    if (providers.length === 0) {
      throw new Error('尚未配置云端 API Provider：请到「设置 → VCG 视觉控制生成器」检测全局 API 或添加自定义 Provider')
    }
    let provider
    if (providerHint) provider = providers.find((item) => item.id === providerHint)
    if (!provider && requestedModel) {
      provider = providers.find((item) => (item.models?.[capability] ?? []).includes(requestedModel))
    }
    if (!provider && this.state.defaults.providerId) {
      const byDefault = providers.find((item) => item.id === this.state.defaults.providerId)
      if (byDefault) provider = byDefault
    }
    if (!provider) provider = providers.find((item) => (item.models?.[capability] ?? []).length > 0)
    if (!provider) provider = providers[0]
    const catalog = provider.models?.[capability] ?? []
    const defaultModelKey = capability === 'image' ? 'imageModel' : capability === 'video' ? 'videoModel' : 'textModel'
    const fallbackModel =
      (capability === 'image' ? KNOWN_IMAGE_MODELS[0] : capability === 'text' ? KNOWN_TEXT_MODELS[0] : '') || catalog[0] || ''
    let model = String(requestedModel ?? '').trim() || String(this.state.defaults[defaultModelKey] ?? '').trim() || catalog[0] || fallbackModel
    if (catalog.length > 0 && model !== '' && !catalog.includes(model)) {
      const other = providers.find((item) => (item.models?.[capability] ?? []).includes(model))
      if (!other) {
        throw new Error(
          `模型「${model}」不在 Provider「${provider.label}」的 ${capability} 模型列表中（可用：${catalog.join('、')}）。` +
            '请到「设置 → VCG 视觉控制生成器」重新选择默认模型。',
        )
      }
      provider = other
    }
    return { provider, model }
  }

  /** Resolve one capability route plus its API key (async, per call). */
  async resolveProviderFor(capability, { model, providerId } = {}) {
    const selected = this.selectProvider(capability, model, providerId)
    const apiKey = await this.providerKey(selected.provider)
    return { provider: selected.provider, model: selected.model, apiKey }
  }

  /** Resolve the API key of one provider (stored key > apiKeyRef > global ref). */
  async providerKey(provider) {
    if (!provider) return ''
    if (typeof provider.apiKey === 'string' && provider.apiKey !== '') return provider.apiKey
    const credentials = this.ctx.get('credentials')
    if (credentials) {
      const refs = []
      if (typeof provider.apiKeyRef === 'string' && provider.apiKeyRef !== '') refs.push(provider.apiKeyRef)
      if (provider.detectedFrom === 'global' || provider.id === 'bailian-tpp') refs.push(DEFAULT_BAILIAN_KEY_REF)
      for (const ref of refs) {
        try {
          const resolved = await credentials.resolve(ref)
          if (resolved?.value) return resolved.value
        } catch {
          /* try the next ref */
        }
      }
    }
    return ''
  }

  /** Read the global Alibaba Token Plan key for detection/status. */
  async resolveGlobalKey() {
    const credentials = this.ctx.get('credentials')
    if (!credentials) return ''
    try {
      const resolved = await credentials.resolve(DEFAULT_BAILIAN_KEY_REF)
      return typeof resolved?.value === 'string' ? resolved.value : ''
    } catch {
      return ''
    }
  }

  /** Sync host model selection used inside cloud executor calls. */
  resolveModel(requestedModel) {
    const { provider, model } = this.selectProvider('image', requestedModel)
    return { providerId: provider.id, model, clip: `${model}-clip`, vae: `${model}-vae` }
  }

  /** Cloud image generation (used by the ksampler executor). */
  async generateImage({ providerId, model: requestedModel, prompt, negative, size, signal }) {
    const { provider, model, apiKey } = await this.resolveProviderFor('image', { model: requestedModel, providerId })
    if (apiKey === '' && needsApiKey()) {
      throw new Error(`Provider「${provider.label}」未配置 API Key：请到「设置 → VCG 视觉控制生成器」填写，或配置全局 API 密钥`)
    }
    const result = await generateCloudImage(provider, {
      apiKey,
      model,
      prompt,
      negative,
      size,
      signal: signal ?? this.abort.signal,
    })
    return { images: result.images, usage: result.usage, providerId: provider.id, model: result.model ?? model }
  }

  /** Cloud video generation (used by the videoSampler executor). */
  async generateVideo({ providerId, model: requestedModel, prompt, image, size, duration, fps, seed, signal }) {
    const requested = String(requestedModel ?? '').trim()
    const videoProviders = this.enabledProviders().filter(
      (provider) => (provider.models?.video ?? []).length > 0 || provider.kind === 'bailian-video' || provider.kind === 'openai-video',
    )
    if (videoProviders.length === 0) {
      throw new Error(
        '尚未配置视频 Provider：阿里的 token-plan 兼容接口不支持视频模型直连，请在「设置 → VCG 视觉控制生成器」新增 openai-video 类 Provider 并填写视频模型。',
      )
    }
    const selected = this.selectProvider('video', requested, providerId)
    const apiKey = await this.providerKey(selected.provider)
    if (apiKey === '') {
      throw new Error(`视频 Provider「${selected.provider.label}」未配置 API Key：请到设置中填写`)
    }
    const result = await generateCloudVideo(selected.provider, {
      apiKey,
      model: selected.model,
      prompt,
      image,
      size,
      duration,
      fps,
      seed,
      signal: signal ?? this.abort.signal,
    })
    return { videos: result.videos, usage: result.usage, providerId: selected.provider.id, model: result.model ?? selected.model }
  }

  /** Text generation: direct cloud chat first, then the host LLM service. */
  async generateText({ prompt, system, maxTokens = 1200, model: requestedModel, providerId, signal }) {
    const errors = []
    try {
      const { provider, model, apiKey } = await this.resolveProviderFor('text', { model: requestedModel, providerId })
      if (provider.baseUrl !== '' && (apiKey !== '' || provider.kind === 'custom-http')) {
        const result = await chatText({
          baseUrl: provider.baseUrl,
          apiKey,
          model,
          prompt,
          system,
          maxTokens,
          signal: signal ?? this.abort.signal,
        })
        return { text: result.text, provider: provider.id, model: result.model ?? model, usage: result.usage }
      }
      errors.push(`Provider「${provider.label}」没有可用的文本 API 地址或 API Key`)
    } catch (error) {
      errors.push(messageOf(error))
    }
    const llm = this.ctx.get('llm')
    if (llm) {
      const candidates = []
      const defaultProvider = String(this.state.defaults.providerId ?? '').trim()
      if (defaultProvider !== '') candidates.push({ provider: defaultProvider, model: String(this.state.defaults.textModel ?? '') || 'qwen3.8-max' })
      candidates.push({ provider: 'bailian-tpp', model: 'qwen3.8-max' })
      candidates.push({ provider: 'deepseek-official', model: 'deepseek-flash' })
      const seen = new Set()
      for (const candidate of candidates) {
        const key = `${candidate.provider}/${candidate.model}`
        if (seen.has(key)) continue
        seen.add(key)
        try {
          const stream = llm.stream({
            provider: candidate.provider,
            model: candidate.model,
            ...(system ? { system } : {}),
            messages: [{ role: 'user', content: [{ type: 'text', text: String(prompt ?? '') }] }],
            ...(Number.isFinite(maxTokens) ? { maxTokens } : {}),
            signal: signal ?? this.abort.signal,
          })
          const collected = await collectStreamText(stream)
          if (collected.text.trim() !== '') {
            return { text: collected.text, provider: candidate.provider, model: candidate.model }
          }
          errors.push(`${key} 未返回文本`)
        } catch (error) {
          errors.push(`${key}: ${messageOf(error)}`)
        }
      }
    }
    throw new Error(`文本生成失败：${errors[errors.length - 1] ?? '没有可用的文本模型'}`)
  }

  /** Local tool bridge for §16.6 pure-local executors (no network, no tokens). */
  async localTool({ fn, params } = {}) {
    if (fn === 'safetensorsInspect') {
      return this.localTools.inspectSafetensors({ file: params?.model_file ?? params?.file })
    }
    throw new Error(`未知本地执行器：${fn || '(空)'}`)
  }

  /* ------------------------------------------------------------- directories */

  /** Deployment working directory for agent-less calls. */
  workingRoot() {
    const workingDirectory = this.ctx.get('workingDirectory')
    return workingDirectory?.defaultDirectory ?? process.cwd()
  }

  /** Working directory of one live session (empty when unknown). */
  sessionDirectory(sessionId) {
    if (typeof sessionId !== 'string' || sessionId === '') return ''
    const agent = this.ctx.get('agents')?.get?.(sessionId)
    const workingDirectory = this.ctx.get('workingDirectory')
    if (agent && workingDirectory) {
      try {
        return workingDirectory.get(agent.session ?? sessionId)
      } catch {
        /* fall through */
      }
    }
    return ''
  }

  /** Project record by id (or by exact path). */
  projectById(id) {
    const value = String(id ?? '')
    return this.state.projects.find((project) => project.id === value) ?? this.state.projects.find((project) => project.path === value)
  }

  /** Resolve the base directory for one canvas key / session. */
  resolveBaseDir({ key, sessionId, baseDir } = {}) {
    if (typeof baseDir === 'string' && baseDir.trim() !== '') {
      const value = baseDir.trim()
      return isAbsolute(value) ? value : resolve(this.workingRoot(), value)
    }
    const rawKey = typeof key === 'string' ? key.trim() : ''
    const projectMatch = /^project:(.+)$/.exec(rawKey)
    if (projectMatch) {
      const project = this.projectById(projectMatch[1])
      if (!project) throw new Error(`项目不存在：${projectMatch[1]}`)
      return project.path
    }
    const sessionMatch = /^session:(.+)$/.exec(rawKey)
    const keySessionId = sessionMatch ? sessionMatch[1] : ''
    const effectiveSession = typeof sessionId === 'string' && sessionId !== '' ? sessionId : keySessionId
    if (rawKey !== '' && !rawKey.startsWith('session:')) {
      const project = this.projectById(rawKey)
      if (project) return project.path
    }
    const binding = effectiveSession !== '' ? this.state.bindings?.[effectiveSession] : undefined
    if (binding?.projectId) {
      const project = this.projectById(binding.projectId)
      if (project) return project.path
    }
    const sessionDir = this.sessionDirectory(effectiveSession)
    if (sessionDir !== '') return sessionDir
    return this.workingRoot()
  }

  /* -------------------------------------------------------------- detection */

  /** Public (masked) provider list. */
  publicProviders() {
    return this.state.providers.map((provider) => {
      const masked = maskProvider(provider)
      const hasKey = masked.hasKey || (provider.detectedFrom === 'global' && this.globalKeyAvailable)
      return { ...masked, hasKey, apiKeyConfigured: hasKey }
    })
  }

  /** Refresh the cached global-key availability flag. */
  async refreshGlobalKey() {
    const key = await this.resolveGlobalKey()
    this.globalKeyAvailable = key !== ''
    return this.globalKeyAvailable
  }

  /**
   * Detect providers from `ctx.llm` + `ctx.credentials`, persist a default
   * record for the global Alibaba Token Plan route, then read the full model
   * catalog of every configured provider through its `/models` endpoint (§14.3).
   *
   * Best-effort by design: every call is parallel, capped at 8s per provider,
   * and failures are swallowed so plugin startup and the UI are never blocked.
   * @returns {Promise<{candidates:object[], globalModels:object, providerId?:string,
   *   allModels:Object<string,string[]>, discovered:Object<string,{ok:boolean,count:number,error?:string}>}>}
   */
  async detectProviders() {
    const llm = this.ctx.get('llm')
    this.llmAvailable = Boolean(llm)
    let globalKey = ''
    try {
      globalKey = await this.resolveGlobalKey()
    } catch {
      globalKey = ''
    }
    this.globalKeyAvailable = globalKey !== ''
    let globalModels = emptyModelCatalog()
    let detectedInfo
    let changed = false
    if (llm) {
      let infos = []
      try {
        infos = typeof llm.listProviders === 'function' ? llm.listProviders() : []
      } catch (error) {
        this.log?.warn?.(`dsh-vcg: listProviders 失败: ${messageOf(error)}`)
      }
      for (const info of Array.isArray(infos) ? infos : []) {
        if (!info?.id) continue
        let models = []
        try {
          models = typeof llm.listModels === 'function' ? await llm.listModels(info.id) : []
        } catch {
          models = []
        }
        const ids = (Array.isArray(models) ? models : []).map((model) => (typeof model === 'string' ? model : model?.id)).filter(Boolean)
        const catalog = catalogModels(ids)
        const isBailian = info.id === 'bailian-tpp' || /bailian|token\s*plan|阿里/i.test(`${info.id} ${info.name ?? ''}`)
        if (isBailian) {
          detectedInfo = { id: info.id, name: info.name ?? info.id, catalog }
          globalModels = mergeCatalogs(globalModels, catalog)
        }
      }
    }
    const globalCount =
      globalModels.image.length + globalModels.video.length + globalModels.text.length + globalModels.audio.length
    const finalModels =
      globalCount > 0 ? globalModels : globalKey !== '' || detectedInfo ? mergeCatalogs(DEFAULT_MODEL_CATALOG) : emptyModelCatalog()

    if (detectedInfo || (globalKey !== '' && this.state.providers.length === 0)) {
      const info = detectedInfo ?? { id: 'bailian-tpp', name: 'Alibaba Token Plan', catalog: finalModels }
      const models = mergeCatalogs(info.catalog, finalModels)
      let record = this.state.providers.find((provider) => provider.detectedFrom === 'global')
      if (!record) {
        const created = normalizeProvider(
          {
            id: info.id,
            label: `${info.name}（全局 API · 自动检测）`,
            kind: 'bailian-chat-image',
            baseUrl: DEFAULT_BAILIAN_BASE_URL,
            apiKeyRef: DEFAULT_BAILIAN_KEY_REF,
            models,
            detectedFrom: 'global',
            enabled: true,
          },
          undefined,
        )
        if (created) {
          record = created
          this.state.providers.unshift(record)
          changed = true
        }
      } else {
        record.models = mergeCatalogs(record.models, models)
        if (!record.baseUrl) record.baseUrl = DEFAULT_BAILIAN_BASE_URL
        if (!record.apiKeyRef) record.apiKeyRef = DEFAULT_BAILIAN_KEY_REF
        changed = true
      }
      if (record) {
        if (!this.state.defaults.providerId || !this.state.providers.some((provider) => provider.id === this.state.defaults.providerId)) {
          this.state.defaults.providerId = record.id
          changed = true
        }
        if (!this.state.defaults.imageModel && record.models.image.length > 0) {
          this.state.defaults.imageModel = preferredModel('image', record.models.image)
        }
        if (!this.state.defaults.videoModel && record.models.video.length > 0) {
          this.state.defaults.videoModel = preferredModel('video', record.models.video)
        }
        if (!this.state.defaults.textModel && record.models.text.length > 0) {
          this.state.defaults.textModel = preferredModel('text', record.models.text)
        }
      }
    }

    // §14.3: read the full `/models` catalog of every provider that has a
    // baseUrl, in parallel. One slow/failing provider never blocks the rest.
    const allModels = {}
    const discovered = {}
    const targets = (Array.isArray(this.state.providers) ? this.state.providers : []).filter(
      (provider) => provider && typeof provider.baseUrl === 'string' && provider.baseUrl.trim() !== '',
    )
    const settled = await Promise.allSettled(
      targets.map(async (provider) => {
        const apiKey = await this.providerKey(provider)
        const result = await listProviderModels(provider, {
          apiKey,
          timeoutMs: PROVIDER_DETECT_TIMEOUT_MS,
          signal: detectionSignal(this.abort.signal),
        })
        return { provider, result }
      }),
    )
    for (let index = 0; index < targets.length; index += 1) {
      const provider = targets[index]
      const entry = settled[index]
      if (!entry || entry.status !== 'fulfilled' || !entry.value) {
        discovered[provider.id] = {
          ok: false,
          count: 0,
          error: entry?.status === 'rejected' ? messageOf(entry.reason) : '读取 /models 失败',
        }
        continue
      }
      const result = entry.value.result ?? {}
      const all = uniqueStrings([...(Array.isArray(result.all) ? result.all : []), ...(Array.isArray(result.models?.all) ? result.models.all : [])])
      if (result.discovered) {
        provider.models = mergeCatalogs(provider.models, result.models)
        const mergedAll = uniqueStrings([...(provider.models.all ?? []), ...all])
        provider.models.all = mergedAll
        // §14.3: older state records kept audio ids inside the text bucket; the
        // live /models classification now knows better, so drop those stale ids
        // from the generation buckets (they stay visible in `audio` / `all`).
        for (const capability of ['image', 'video', 'text']) {
          provider.models[capability] = provider.models[capability].filter((model) => classifyModel(model) !== 'audio')
        }
        allModels[provider.id] = mergedAll
        discovered[provider.id] = { ok: true, count: mergedAll.length }
        changed = true
      } else {
        if (all.length > 0) allModels[provider.id] = all
        discovered[provider.id] = { ok: false, count: 0, error: '未从 /models 读取到模型列表' }
      }
    }
    if (changed) await this.persist()
    return {
      candidates: this.publicProviders(),
      globalModels: finalModels,
      providerId: this.state.defaults.providerId,
      allModels,
      discovered,
    }
  }

  /* ------------------------------------------------------------------ state */

  /** Public state snapshot with API keys masked. */
  publicState() {
    const canvases = {}
    for (const [key, entry] of Object.entries(this.state.canvases ?? {})) {
      canvases[key] = {
        updatedAt: entry?.updatedAt ?? '',
        nodeCount: Array.isArray(entry?.workflow?.nodes) ? entry.workflow.nodes.length : 0,
      }
    }
    const nodes = this.nodeList()
    return {
      version: this.state.version,
      outputDir: this.outputDirName(),
      proMode: this.state.proMode === true,
      devMode: this.state.devMode === true,
      local: { ...this.state.local },
      defaults: { ...this.state.defaults },
      providers: this.publicProviders(),
      nodeRepo: { ...this.state.nodeRepo },
      projects: this.state.projects.map((project) => ({ ...project })),
      canvases,
      outputs: (this.state.outputs ?? []).slice(0, 100).map((output) => ({ ...output })),
      bindings: { ...(this.state.bindings ?? {}) },
      counts: {
        nodes: nodes.length,
        workflows: this.nodes.workflowsList().length,
        builtinNodes: this.nodes.builtinCount,
        customNodes: nodes.filter((node) => node.custom).length,
      },
      detection: {
        llmAvailable: this.llmAvailable,
        globalKey: this.globalKeyAvailable,
        syncedAt: this.nodes.syncedAt,
        source: this.nodes.source,
      },
    }
  }

  /** Merge a settings patch (§6 saveSettings). */
  async saveSettings(args = {}) {
    const patch = isPlainObject(args?.patch) ? args.patch : isPlainObject(args) ? args : {}
    if (Array.isArray(patch.providers)) {
      const incoming = []
      const seen = new Set()
      for (const raw of patch.providers) {
        if (!isPlainObject(raw)) continue
        const id = typeof raw.id === 'string' ? raw.id.trim() : ''
        const existing = id !== '' ? this.providerById(id) : undefined
        const normalized = normalizeProvider(raw, existing)
        if (!normalized || seen.has(normalized.id)) continue
        seen.add(normalized.id)
        incoming.push(normalized)
      }
      // Detected global providers not included in the patch stay in place.
      const kept = this.state.providers.filter((provider) => provider.detectedFrom === 'global' && !seen.has(provider.id))
      this.state.providers = [...kept, ...incoming]
    }
    if (isPlainObject(patch.defaults)) {
      for (const key of ['providerId', 'imageModel', 'videoModel', 'textModel']) {
        if (typeof patch.defaults[key] === 'string') this.state.defaults[key] = patch.defaults[key].trim()
      }
      if (this.state.defaults.providerId !== '' && !this.providerById(this.state.defaults.providerId)) {
        throw new Error(`默认 Provider 不存在：${this.state.defaults.providerId}`)
      }
    }
    if (isPlainObject(patch.local)) {
      if (patch.local.enabled !== undefined) this.state.local.enabled = patch.local.enabled === true
      if (typeof patch.local.comfyuiUrl === 'string') this.state.local.comfyuiUrl = normalizeBaseUrl(patch.local.comfyuiUrl)
      if (patch.local.timeoutMs !== undefined) this.state.local.timeoutMs = clamp(Number(patch.local.timeoutMs) || 600000, 30000, 3600000)
      if (typeof patch.local.modelsDir === 'string') {
        const raw = patch.local.modelsDir.trim()
        if (raw === '') {
          this.state.local.modelsDir = defaultModelsDir(this.directory)
        } else {
          const next = isAbsolute(raw) ? resolve(raw) : resolve(this.workingRoot(), raw)
          this.state.local.modelsDir = next
        }
      }
      if (patch.local.autoInstall !== undefined) this.state.local.autoInstall = patch.local.autoInstall === true
    }
    if (patch.proMode !== undefined) this.state.proMode = patch.proMode === true
    if (patch.devMode !== undefined) {
      this.state.devMode = patch.devMode === true
      // Turning developer mode off immediately returns to the reviewed branch.
      if (this.state.devMode !== true) this.state.nodeRepo.branch = 'main'
    }
    if (isPlainObject(patch.nodeRepo)) {
      if (typeof patch.nodeRepo.githubBase === 'string') this.state.nodeRepo.githubBase = patch.nodeRepo.githubBase.trim()
      if (typeof patch.nodeRepo.giteaBase === 'string') this.state.nodeRepo.giteaBase = patch.nodeRepo.giteaBase.trim()
      if (typeof patch.nodeRepo.branch === 'string') {
        const branch = normalizeRepoBranch(patch.nodeRepo.branch)
        if (branch !== 'main' && this.state.devMode !== true) {
          throw new Error('只能使用 main 分支的节点仓库：切换 dev/bug/recheck 分支需要先打开「开发者模式」')
        }
        this.state.nodeRepo.branch = branch
      }
    }
    if (patch.outputDir !== undefined) {
      const next = normalizeOutputDir(patch.outputDir)
      if (next.includes('..') || isAbsolute(next)) throw new Error('输出目录必须是工作区内的相对目录名')
      this.state.outputDir = next
    }
    await this.persist()
    return { state: this.publicState() }
  }

  /** Test one provider connection. */
  async testProvider(args = {}) {
    const providerId = String(args?.providerId ?? args?.id ?? '').trim()
    const provider = providerId !== '' ? this.providerById(providerId) : this.enabledProviders()[0]
    if (!provider) throw new Error('Provider 不存在：请先检测或添加 Provider')
    const apiKey = await this.providerKey(provider)
    const result = await testProviderConnection(provider, {
      apiKey,
      defaults: { ...this.state.defaults },
      signal: this.abort.signal,
    })
    return { ...result, providerId: provider.id }
  }

  /* ------------------------------------------------------------ local tools */

  /** All §16.5 local tool/model RPCs require pro mode. */
  ensureProMode(feature = '本地工具与模型') {
    if (this.state.proMode !== true) {
      throw new Error(`${feature}需要先打开「专业模式」（设置 → VCG 视觉控制生成器 → 专业模式）`)
    }
  }

  /** §16.5: detect python3 / pip / torch / safetensors / cuda + disk + models dir. */
  async toolsStatus() {
    this.ensureProMode('本地工具与模型检测')
    return this.localTools.status()
  }

  /** §16.5: start one pip install (torch CPU / safetensors / all). */
  async toolsInstall(args = {}) {
    this.ensureProMode('安装本地工具')
    return this.localTools.install(args?.component, { dryRun: args?.dryRun === true })
  }

  /** §16.5: list weight files in the local model directory. */
  async modelsList() {
    this.ensureProMode('模型目录')
    const models = await this.localTools.listModels()
    return { models }
  }

  /** §16.5: download one model file (https, trusted source or explicit confirm). */
  async modelsDownload(args = {}) {
    this.ensureProMode('模型下载')
    return this.localTools.downloadModel({
      url: args?.url,
      filename: args?.filename,
      sha256: args?.sha256,
      size: args?.size,
      format: args?.format,
      confirmUntrusted: args?.confirmUntrusted === true,
      overwrite: args?.overwrite === true,
      signal: this.abort.signal,
    })
  }

  /** §16.5: whether one URL points at a trusted model source. */
  async modelsTrust(args = {}) {
    this.ensureProMode('模型来源校验')
    const verdict = await this.localTools.trustFor(args?.url)
    return {
      trusted: verdict.trusted,
      host: verdict.host,
      registryUpdatedAt: verdict.registryUpdatedAt ?? '',
    }
  }

  /* ------------------------------------------------------------------ nodes */

  listNodes() {
    const nodes = this.nodeList()
    return {
      nodes,
      syncedAt: this.nodes.syncedAt,
      source: this.nodes.source,
      builtinCount: this.nodes.builtinCount,
      customCount: nodes.filter((node) => node.custom).length,
      warnings: [...this.nodes.warnings],
    }
  }

  /** Sync the node repository from GitHub/Gitea (or an explicit URL). */
  async syncNodeRepo(args = {}) {
    const requested = typeof args?.source === 'string' ? args.source.trim() : ''
    const { base, branchBase, source: sourceName, branch } = this.resolveRepoSelection(requested, args?.branch)
    if (sourceName === 'custom' && this.state.devMode !== true) {
      throw new Error('从自定义地址（未认证第三方来源）同步节点仓库需要先打开「开发者模式」')
    }
    const result = await this.nodes.sync({ base, source: sourceName, branch, signal: this.abort.signal })
    if (!Array.isArray(result.warnings)) result.warnings = []
    if (result.ok !== false) {
      this.state.nodeRepo.lastSyncAt = result.syncedAt ?? nowIso()
      this.state.nodeRepo.source = sourceName
      this.state.nodeRepo.branch = normalizeRepoBranch(result.branch ?? branch)
      // §16.5: keep the trusted model-source registry next to the node cache.
      try {
        const trusted = await fetchJson(joinUrl(result.branchBase ?? branchBase, 'trusted-sources.json'), {
          timeoutMs: 10000,
          signal: this.abort.signal,
        })
        await this.localTools.saveTrustedRegistry(trusted)
      } catch (error) {
        result.warnings.push(`可信模型源清单拉取失败：${messageOf(error)}`)
      }
      await this.persist()
    }
    return result
  }

  /**
   * §16.4 RPC: availability of every known repository branch.
   * Returns `[{branch, available, manifestVersion?, nodeCount?, workflowCount?, error?}]`.
   */
  async repoBranches(args = {}) {
    const requested = typeof args?.source === 'string' ? args.source.trim() : ''
    const { base } = this.repoTarget(requested)
    return Promise.all(
      REPO_BRANCHES.map(async (branch) => {
        try {
          const branchBase = resolveRepoBranchBase(base, branch)
          const manifest = await fetchJson(joinUrl(branchBase, 'manifest.json'), { timeoutMs: 12000, signal: this.abort.signal })
          const nodeCount = Array.isArray(manifest?.nodes) ? manifest.nodes.length : 0
          const workflowCount = Array.isArray(manifest?.workflows) ? manifest.workflows.length : 0
          return {
            branch,
            available: true,
            manifestVersion: String(manifest?.version ?? ''),
            nodeCount,
            workflowCount,
          }
        } catch (error) {
          return { branch, available: false, error: messageOf(error) }
        }
      }),
    )
  }

  /** §16.4 RPC: switch the active repository branch (non-main needs devMode). */
  async setRepoBranch(args = {}) {
    const branch = normalizeRepoBranch(args?.branch)
    if (String(args?.branch ?? '').trim() !== branch) {
      throw new Error(`未知节点仓库分支：${String(args?.branch ?? '').trim() || '(空)'}（允许：${REPO_BRANCHES.join('/')}）`)
    }
    if (branch !== 'main' && this.state.devMode !== true) {
      throw new Error('切换 dev/bug/recheck 分支需要先打开「开发者模式」（设置 → VCG 视觉控制生成器 → 开发者模式）')
    }
    this.state.nodeRepo.branch = branch
    this.repoCatalogCache.clear()
    await this.persist()
    return { branch, state: this.publicState() }
  }

  /** Import one custom node definition (§3, pro mode only). */
  async importNode(args = {}) {
    if (this.state.proMode !== true) {
      throw new Error('导入自定义节点需要先打开「专业模式」（设置 → VCG 视觉控制生成器 → 专业模式）')
    }
    let raw = args?.json
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw)
      } catch (error) {
        throw new Error(`节点 JSON 解析失败：${messageOf(error)}`)
      }
    }
    // §16.4: unreviewed third-party origins are developer-mode only.
    const origin = String(args?.repoBranch ?? args?.branch ?? '').trim()
    const originSource = String(args?.source ?? '').trim()
    const untrustedOrigin = (origin !== '' && origin !== 'main') || originSource === 'custom' || /^https?:\/\//i.test(originSource)
    if (untrustedOrigin && this.state.devMode !== true) {
      throw new Error('导入未认证第三方节点（dev/bug/recheck 分支或自定义地址）需要先打开「开发者模式」')
    }
    const def = prepareImportedNode(raw, { proMode: this.state.proMode })
    const existing = this.nodes.nodeById(def.id)
    if (existing) {
      if (existing.source === 'builtin' || existing.source === 'repo') {
        throw new Error(`节点 id「${def.id}」与${existing.source === 'builtin' ? '内置' : '节点仓库'}节点冲突，请换一个 id`)
      }
      if (args?.overwrite !== true) {
        throw new Error(`已存在同名自定义节点「${def.id}」：如需覆盖请传 overwrite: true`)
      }
    }
    const node = await this.nodes.saveCustom(def, { allowHttp: true })
    return { node }
  }

  /** Remove one imported custom node (builtin / repo nodes are protected). */
  async removeNode(args = {}) {
    const removed = await this.nodes.removeCustom(args?.id ?? args?.nodeId)
    return { removed }
  }

  listWorkflows() {
    return { workflows: this.nodes.workflowsList() }
  }

  /* ----------------------------------------------------------------- canvas */

  getCanvas(args = {}) {
    const key = String(args?.key ?? '').trim()
    if (key === '') throw new Error('缺少画布 key')
    const entry = this.state.canvases?.[key]
    return { workflow: entry?.workflow ?? null, updatedAt: entry?.updatedAt ?? '' }
  }

  async saveCanvas(args = {}) {
    const key = String(args?.key ?? '').trim()
    if (key === '') throw new Error('缺少画布 key')
    const workflow = validateWorkflowShape(args?.workflow, { where: '保存画布' })
    const updatedAt = nowIso()
    workflow.updatedAt = updatedAt
    this.state.canvases[key] = { workflow, updatedAt }
    // Bound the canvas map so state cannot grow without limit.
    const keys = Object.keys(this.state.canvases)
    if (keys.length > 200) {
      const sorted = keys
        .map((item) => ({ key: item, ts: this.state.canvases[item]?.updatedAt ?? '' }))
        .sort((a, b) => String(a.ts).localeCompare(String(b.ts)))
      for (const entry of sorted.slice(0, keys.length - 200)) delete this.state.canvases[entry.key]
    }
    await this.persist()
    return { updatedAt }
  }

  /* --------------------------------------------------------------- projects */

  async createProject(args = {}) {
    const name = requireProjectName(args?.name)
    const explicitPath = typeof args?.path === 'string' ? args.path.trim() : ''
    const root = this.workingRoot()
    const path = suggestProjectPath({
      name,
      path: explicitPath,
      root: root || defaultProjectsRoot(),
    })
    const absolute = isAbsolute(path) ? path : resolve(root, path)
    const existing = this.state.projects.find((project) => project.path === absolute)
    if (existing) throw new Error(`该目录已登记为项目「${existing.name}」：${absolute}`)
    let createdDir = false
    const info = await stat(absolute).catch(() => null)
    if (!info) {
      await mkdir(absolute, { recursive: true })
      createdDir = true
    } else if (!info.isDirectory()) {
      throw new Error(`项目路径不是目录：${absolute}`)
    }
    let workspaceId = ''
    const registry = this.ctx.get('workspaceRegistry')
    if (registry) {
      try {
        const workspace = (await registry.resolveByPath(absolute)) ?? (await registry.create(absolute))
        workspaceId = workspace?.id ?? ''
      } catch (error) {
        this.log?.warn?.(`dsh-vcg: 注册工作区失败: ${messageOf(error)}`)
      }
    }
    const now = nowIso()
    const project = {
      id: uid('prj'),
      name,
      path: absolute,
      workspaceId,
      createdAt: now,
      updatedAt: now,
      managed: createdDir,
    }
    this.state.projects.push(project)
    await this.persist()
    return { project }
  }

  async deleteProject(args = {}) {
    const id = String(args?.id ?? args?.projectId ?? '').trim()
    const index = this.state.projects.findIndex((project) => project.id === id)
    if (index < 0) throw new Error(`项目不存在：${id || '(空)'}`)
    const project = this.state.projects[index]
    this.state.projects.splice(index, 1)
    for (const [sessionId, binding] of Object.entries(this.state.bindings ?? {})) {
      if (binding?.projectId === id) delete this.state.bindings[sessionId]
    }
    // Physical deletion only for plugin-created project directories with an explicit purge.
    if (args?.purge === true && project.managed === true) {
      const { rm } = await import('node:fs/promises')
      const safeRoots = [this.workingRoot(), defaultProjectsRoot()]
      const deletable = safeRoots.some((root) => isWithin(root, project.path)) && project.path !== this.workingRoot()
      if (deletable) await rm(project.path, { recursive: true, force: true })
    }
    await this.persist()
    return { ok: true }
  }

  listProjects() {
    return { projects: this.state.projects.map((project) => ({ ...project })) }
  }

  async bindSession(args = {}) {
    const sessionId = String(args?.sessionId ?? '').trim()
    if (sessionId === '') throw new Error('缺少会话 id')
    const projectId = String(args?.projectId ?? '').trim()
    if (projectId === '') {
      delete this.state.bindings[sessionId]
      await this.persist()
      return { ok: true }
    }
    if (!this.projectById(projectId)) throw new Error(`项目不存在：${projectId}`)
    this.state.bindings[sessionId] = { projectId, updatedAt: nowIso() }
    await this.persist()
    return { ok: true }
  }

  /* ------------------------------------------------------- AI workflow build */

  /** Build one workflow from a natural-language request (§6 buildWorkflow). */
  async buildWorkflow(args = {}) {
    const prompt = String(args?.prompt ?? '').trim()
    if (prompt === '') throw new Error('请先描述想要生成的工作流需求（prompt 不能为空）')
    const llm = this.ctx.get('llm')
    if (!llm) throw new Error('宿主未提供 LLM 服务，无法自动组建工作流：请检查 Harness 的模型配置')
    const current = args?.current && typeof args.current === 'object' ? args.current : undefined
    const { system, user } = buildWorkflowPrompt({ userPrompt: prompt, current, nodeDefs: this.nodeList() })
    const candidates = []
    const defaultProvider = String(this.state.defaults.providerId ?? '').trim()
    const defaultTextModel = String(this.state.defaults.textModel ?? '').trim() || 'qwen3.8-max'
    if (defaultProvider !== '') candidates.push({ provider: defaultProvider, model: defaultTextModel })
    candidates.push({ provider: 'bailian-tpp', model: 'qwen3.8-max' })
    candidates.push({ provider: 'deepseek-official', model: 'deepseek-flash' })
    const errors = []
    const seen = new Set()
    let usedModel
    let plan
    for (const candidate of candidates) {
      const key = `${candidate.provider}/${candidate.model}`
      if (seen.has(key)) continue
      seen.add(key)
      try {
        const stream = llm.stream({
          provider: candidate.provider,
          model: candidate.model,
          system,
          messages: [{ role: 'user', content: [{ type: 'text', text: user }] }],
          maxTokens: 4000,
          signal: this.abort.signal,
        })
        const collected = await collectStreamText(stream)
        if (collected.text.trim() === '') {
          errors.push(`${key}: 模型未返回内容`)
          continue
        }
        plan = extractJsonObject(collected.text)
        usedModel = candidate
        break
      } catch (error) {
        errors.push(`${key}: ${messageOf(error)}`)
      }
    }
    if (!plan || !usedModel) {
      throw new Error(`自动组建工作流失败：${errors[errors.length - 1] ?? '没有可用的文本模型'}`)
    }
    const built = validateGeneratedPlan(plan, this.nodes.nodes, { prompt })
    return {
      workflow: built.workflow,
      reply: built.reply,
      notes: built.notes,
      usedModel: `${usedModel.provider}/${usedModel.model}`,
    }
  }

  /* ------------------------------------------------------------- run / output */

  ensureLocalConfigured() {
    if (this.state.local?.enabled === true && String(this.state.local?.comfyuiUrl ?? '').trim() === '') {
      throw new Error('本地运算已开启但未配置 ComfyUI 服务端地址，请到 设置 → VCG 视觉控制生成器 配置')
    }
  }

  /** Canvas key used by both live run records and the saved workbook. */
  resolveCanvasKey(args = {}) {
    const sessionId = String(args?.sessionId ?? '').trim()
    return String(args?.key ?? '').trim() || (sessionId !== '' ? `session:${sessionId}` : '')
  }

  /**
   * Create (and store) the live run record for one canvas key (§13.1).
   * The client polls `runStatus` for this record while `running`.
   */
  createRunRecord(key, runId) {
    const record = {
      runId,
      key,
      status: 'running',
      startedAt: nowIso(),
      finishedAt: '',
      order: [],
      currentNodeId: '',
      error: '',
      nodes: {},
      // §16.7: run-level token usage summary (zeros until a cloud call reports).
      usage: emptyUsage(),
    }
    this.runs.set(key, record)
    // Bounded memory: keep the most recent records only (running ones stay).
    if (this.runs.size > 20) {
      for (const [candidateKey, candidate] of this.runs) {
        if (this.runs.size <= 20) break
        if (candidateKey === key || candidate.status === 'running') continue
        this.runs.delete(candidateKey)
      }
    }
    return record
  }

  /** Normalize one engine result into the record node shape (§13.1). */
  runNodeRecord(result) {
    const value = isPlainObject(result) ? result : {}
    const usage = normalizeUsage(value.usage)
    return {
      status: value.status === 'error' ? 'error' : value.status === 'running' ? 'running' : 'done',
      ms: Number.isFinite(value.ms) ? value.ms : 0,
      images: Array.isArray(value.images) ? value.images : [],
      text: typeof value.text === 'string' ? value.text : '',
      video: value.video ?? null,
      error: typeof value.error === 'string' ? value.error : '',
      skipped: value.skipped === true,
      ...(usage ? { usage } : {}),
    }
  }

  /** Apply one Engine progress event to a run record (§13.1). */
  applyRunEvent(record, event) {
    if (!record || !isPlainObject(event)) return
    const nodeId = typeof event.nodeId === 'string' ? event.nodeId : ''
    switch (event.type) {
      case 'run-start': {
        record.order = Array.isArray(event.order) ? event.order.slice() : []
        for (const id of record.order) {
          if (!record.nodes[id]) record.nodes[id] = { status: 'pending', ms: 0, images: [], text: '', video: null, error: '', skipped: false }
        }
        break
      }
      case 'node-start': {
        if (nodeId === '') break
        record.nodes[nodeId] = { status: 'running', ms: 0, images: [], text: '', video: null, error: '', skipped: false }
        record.currentNodeId = nodeId
        break
      }
      case 'node-done': {
        if (nodeId === '') break
        record.nodes[nodeId] = this.runNodeRecord(event.result)
        addUsage(record.usage, event.result?.usage)
        if (record.currentNodeId === nodeId) record.currentNodeId = ''
        break
      }
      case 'node-error': {
        if (nodeId === '') break
        record.nodes[nodeId] = {
          status: 'error',
          ms: Number.isFinite(event.ms) ? event.ms : 0,
          images: [],
          text: '',
          video: null,
          error: String(event.error ?? ''),
          skipped: false,
        }
        if (record.currentNodeId === nodeId) record.currentNodeId = ''
        break
      }
      case 'run-done': {
        record.status = event.ok === false || event.error ? 'error' : 'done'
        record.error = String(event.error ?? '')
        record.finishedAt = nowIso()
        record.currentNodeId = ''
        break
      }
      default:
        break
    }
  }

  /** Record a thrown run failure (validation / config / abort). */
  failRunRecord(record, error) {
    if (!record) return
    record.status = 'error'
    record.finishedAt = nowIso()
    record.error = messageOf(error)
    record.currentNodeId = ''
  }

  /** Finalize a record when the engine returned without a run-done event. */
  finishRunRecord(record, value) {
    if (!record || record.status !== 'running') return
    const result = isPlainObject(value) ? value : {}
    record.status = result.error || result.result?.status === 'error' ? 'error' : 'done'
    record.error = String(result.error ?? result.result?.error ?? '')
    record.finishedAt = nowIso()
    record.currentNodeId = ''
    // The engine-level summary is authoritative; fall back to the aggregate
    // built from node-done events (or the single-node result's usage).
    const usage = normalizeUsage(result.usage) ?? normalizeUsage(result.result?.usage)
    if (usage) record.usage = usage
  }

  /** §13.1 RPC: latest run record for one canvas key (read-only). */
  runStatus(args = {}) {
    const key = this.resolveCanvasKey(args)
    return { run: this.runs.get(key) ?? null }
  }

  async runWorkflow(args = {}) {
    this.ensureLocalConfigured()
    const sessionId = String(args?.sessionId ?? '').trim()
    const key = this.resolveCanvasKey(args)
    const runId = uid('run')
    const record = this.createRunRecord(key, runId)
    try {
      const value = await this.engine.run({
        key,
        workflow: args?.workflow,
        sessionId,
        baseDir: args?.baseDir,
        signal: this.abort.signal,
        runId,
        onEvent: (event) => this.applyRunEvent(record, event),
      })
      this.finishRunRecord(record, value)
      return value
    } catch (error) {
      this.failRunRecord(record, error)
      throw error
    }
  }

  async runNode(args = {}) {
    this.ensureLocalConfigured()
    const nodeId = String(args?.nodeId ?? '').trim()
    if (nodeId === '') throw new Error('缺少要运行的节点 id（nodeId）')
    const sessionId = String(args?.sessionId ?? '').trim()
    const key = this.resolveCanvasKey(args)
    const runId = uid('run')
    const record = this.createRunRecord(key, runId)
    try {
      const value = await this.engine.run({
        key,
        workflow: args?.workflow,
        sessionId,
        baseDir: args?.baseDir,
        nodeId,
        signal: this.abort.signal,
        runId,
        onEvent: (event) => this.applyRunEvent(record, event),
      })
      this.finishRunRecord(record, value)
      return { result: value.result, order: value.order, usage: normalizeUsage(value.usage) ?? record.usage }
    } catch (error) {
      this.failRunRecord(record, error)
      throw error
    }
  }

  /* ------------------------------------------------------- debug / repo */

  /**
   * Debug 运行：只做完整性 / 模型可加载性 / 安全性校验，不生成内容、不写文件。
   */
  async debugWorkflow(args = {}) {
    const started = Date.now()
    const startedAt = nowIso()
    const sessionId = String(args?.sessionId ?? '').trim()
    const key = String(args?.key ?? '').trim() || (sessionId !== '' ? `session:${sessionId}` : '')
    const raw = args?.workflow ?? (key !== '' ? this.state.canvases?.[key]?.workflow : null) ?? null
    if (!raw) throw new Error('没有可调试的工作流：请先保存画布或传入 workflow')
    const defsById = new Map([...this.nodes.nodes.values()].map((def) => [def.id, def]))
    const baseDir = this.resolveBaseDir({ key, sessionId, baseDir: args?.baseDir })
    const outputDir = this.outputDirName()
    const checks = []
    let workflow
    try {
      workflow = validateWorkflowShape(raw, { where: '工作流' })
    } catch (error) {
      checks.push({ group: 'schema', level: 'fail', label: '工作流结构非法', detail: messageOf(error) })
      return this.debugResult({ checks, started, startedAt, key, baseDir, outputDir, network: false })
    }
    const staticResult = runStaticDebug({
      workflow,
      defsById,
      settings: { local: this.state.local, proMode: this.state.proMode, outputDir },
      baseDir,
      outputDir,
    })
    checks.push(...staticResult.checks)

    /* Model loadability: resolve the route, credential and (optionally) probe. */
    const network = args?.network !== false
    const isVideo = workflow.nodes.some((node) => defsById.get(node.type)?.executor?.fn === 'videoSampler')
    const capability = isVideo ? 'video' : 'image'
    let explicitModel = ''
    for (const node of workflow.nodes) {
      const def = defsById.get(node.type)
      if (!def) continue
      if (def.executor?.fn === 'ksampler' || def.executor?.fn === 'videoSampler') {
        const value = node.params?.model
        if (typeof value === 'string' && value.trim() !== '') explicitModel = value.trim()
      }
    }
    let selected = null
    try {
      selected = this.selectProvider(capability, explicitModel || undefined)
      checks.push({
        group: 'model',
        level: 'pass',
        label: '模型路由',
        detail: `${selected.provider.label} · ${selected.model || '(使用默认模型)'}（${capability === 'video' ? '生视频' : '生图'}）`,
      })
    } catch (error) {
      checks.push({ group: 'model', level: 'fail', label: '模型路由失败', detail: messageOf(error) })
    }
    if (selected) {
      try {
        const apiKey = await this.providerKey(selected.provider)
        if (apiKey === '') {
          checks.push({
            group: 'model',
            level: 'fail',
            label: 'API Key 缺失',
            detail: `Provider「${selected.provider.label}」没有可用密钥（全局 API 未登录或自定义 Provider 未填 Key）`,
          })
        } else {
          checks.push({ group: 'model', level: 'pass', label: 'API Key', detail: '已配置（值不进入客户端）' })
        }
        const catalog = selected.provider.models?.[capability] ?? []
        if (catalog.length === 0) {
          checks.push({ group: 'model', level: 'warn', label: '模型目录为空', detail: '该 Provider 尚未检测到模型列表，运行时会依赖服务端实际可用模型' })
        } else if (selected.model && !catalog.includes(selected.model)) {
          checks.push({ group: 'model', level: 'warn', label: '模型不在目录', detail: `${selected.model} 不在已检测目录（${catalog.slice(0, 6).join('、')}）` })
        }
        if (network) {
          const probe = await testProviderConnection(selected.provider, {
            apiKey,
            defaults: { ...this.state.defaults },
            signal: this.abort.signal,
          })
          const failedProbe = /401|403|404|密钥|API Key|model|模型/i.test(String(probe?.error ?? ''))
          checks.push({
            group: 'model',
            level: probe?.ok ? 'pass' : failedProbe ? 'fail' : 'warn',
            label: probe?.ok ? '模型可加载' : '模型加载探测失败',
            detail: probe?.ok
              ? `${probe.mode || 'probe'} · ${probe.latencyMs}ms · 生图模型 ${probe.models?.image?.length ?? 0} 个 / 文本 ${probe.models?.text?.length ?? 0} 个`
              : String(probe?.error ?? '未知错误'),
          })
        } else {
          checks.push({ group: 'model', level: 'pass', label: '离线校验', detail: '已跳过网络探测（network=false）' })
        }
      } catch (error) {
        checks.push({ group: 'model', level: 'fail', label: '模型检查异常', detail: messageOf(error) })
      }
    }

    /* Local ComfyUI reachability when local mode is on. */
    if (this.state.local?.enabled === true) {
      const comfyUrl = normalizeBaseUrl(this.state.local?.comfyuiUrl)
      if (comfyUrl === '') {
        checks.push({ group: 'engine', level: 'fail', label: 'ComfyUI 未配置', detail: '本地模式已开启但未填写 ComfyUI 服务端地址' })
      } else if (network) {
        try {
          await fetchJson(joinUrl(comfyUrl, 'system_stats'), { timeoutMs: 8000, signal: this.abort.signal })
          checks.push({ group: 'engine', level: 'pass', label: 'ComfyUI 可连接', detail: comfyUrl })
        } catch (error) {
          checks.push({ group: 'engine', level: 'fail', label: 'ComfyUI 连接失败', detail: `${comfyUrl}：${messageOf(error)}` })
        }
      }
    }

    return this.debugResult({
      checks,
      started,
      startedAt,
      key,
      baseDir,
      outputDir,
      network,
      provider: selected ? { id: selected.provider.id, label: selected.provider.label, model: selected.model } : null,
      order: staticResult.order,
      nodeCount: workflow.nodes.length,
      edgeCount: workflow.edges.length,
    })
  }

  /** Shape one Debug 运行 report (no execution results). */
  debugResult({ checks, started, startedAt, key, baseDir, outputDir, network, provider = null, order = [], nodeCount = 0, edgeCount = 0 }) {
    const ordered = summarizeChecks(checks)
    const failed = ordered.filter((item) => item.level === 'fail').length
    const warned = ordered.filter((item) => item.level === 'warn').length
    const passed = ordered.filter((item) => item.level === 'pass').length
    return {
      ok: failed === 0,
      mode: 'debug',
      key,
      baseDir,
      outputDir,
      network: Boolean(network),
      provider,
      order,
      nodeCount,
      edgeCount,
      checks: ordered,
      summary: { passed, warned, failed, total: ordered.length },
      startedAt,
      ms: Date.now() - started,
      note: 'Debug 运行不会调用生图/生视频 API，也不会写入输出文件',
    }
  }

  /** Resolve one node-repository raw base from a source selector. */
  repoTarget(requested = '') {
    const value = String(requested ?? '').trim()
    if (/^https?:\/\//i.test(value)) return { base: value, source: 'custom' }
    if (value === 'github' || value === 'gitea') {
      const base = value === 'github' ? this.state.nodeRepo.githubBase : this.state.nodeRepo.giteaBase
      if (base === '') throw new Error(`未配置 ${value} 节点仓库地址：请到「设置 → VCG 视觉控制生成器 → 节点仓库」填写`)
      return { base, source: value }
    }
    const last = this.state.nodeRepo.source
    const order = last === 'gitea' ? ['gitea', 'github'] : ['github', 'gitea']
    for (const name of order) {
      const base = name === 'gitea' ? this.state.nodeRepo.giteaBase : this.state.nodeRepo.githubBase
      if (base !== '') return { base, source: name }
    }
    throw new Error('未配置节点仓库地址：请到「设置 → VCG 视觉控制生成器 → 节点仓库」填写 GitHub/Gitea 仓库地址')
  }

  /**
   * Resolve one source selector + branch into the raw base to fetch (§16.4).
   * Non-main branches require developer mode; custom URLs are kept as-is.
   */
  resolveRepoSelection(requested, branchArg) {
    const { base, source } = this.repoTarget(requested)
    let fromUrl = ''
    try {
      const segments = new URL(base).pathname.split('/').filter(Boolean)
      const last = segments[segments.length - 1] ?? ''
      if (REPO_BRANCHES.includes(last)) fromUrl = last
    } catch {
      /* repoTarget already validated custom URLs loosely */
    }
    const explicitBranch = typeof branchArg === 'string' ? branchArg.trim() : ''
    if (explicitBranch !== '' && !REPO_BRANCHES.includes(explicitBranch)) {
      throw new Error(`未知节点仓库分支：${explicitBranch}（允许：${REPO_BRANCHES.join('/')}）`)
    }
    const branch = normalizeRepoBranch(
      explicitBranch !== '' ? explicitBranch : source === 'custom' && fromUrl !== '' ? fromUrl : this.state.nodeRepo.branch,
    )
    if (branch !== 'main' && this.state.devMode !== true) {
      throw new Error(`当前只能使用 main 分支的节点仓库：切换 dev/bug/recheck 分支需要先打开「开发者模式」`)
    }
    const branchBase = resolveRepoBranchBase(base, branch)
    return { base, branchBase, source, branch }
  }

  /** Browse the node repository without installing anything (60s cache). */
  async listRepoNodes(args = {}) {
    const { base, branchBase, source, branch } = this.resolveRepoSelection(args?.source, args?.branch)
    const cacheKey = `${source}|${branchBase}|${branch}`
    const cached = this.repoCatalogCache.get(cacheKey)
    if (args?.force !== true && cached && Date.now() - cached.at < 60000) return cached.value
    const signal = this.abort.signal
    let manifest
    try {
      manifest = await fetchJson(joinUrl(branchBase, 'manifest.json'), { timeoutMs: 15000, signal })
    } catch (error) {
      throw new Error(`拉取节点仓库失败（${branchBase}）：${messageOf(error)}`)
    }
    const repoExtra = branch === 'main' ? {} : { repoBranch: branch, reviewState: 'unreviewed' }
    const warnings = []
    const nodeIds = Array.isArray(manifest?.nodes) ? manifest.nodes.filter((id) => typeof id === 'string') : []
    const nodes = []
    for (const id of nodeIds) {
      try {
        const raw = await fetchJson(joinUrl(branchBase, `nodes/${id}.json`), { timeoutMs: 15000, signal })
        const def = validateNodeDef(raw, { where: `仓库节点 ${id}`, source: 'repo' })
        const existing = this.nodes.nodeById(def.id)
        const requiresPro = def.executor?.kind === 'http'
        nodes.push({
          ...decorateNode(def, 'repo', repoExtra),
          installed: Boolean(existing),
          installedSource: existing?.source ?? '',
          requiresPro,
          canImport: !existing && (requiresPro ? this.state.proMode === true : true),
        })
      } catch (error) {
        warnings.push(`节点 ${id} 拉取失败：${messageOf(error)}`)
      }
    }
    const workflowIds = Array.isArray(manifest?.workflows) ? manifest.workflows.filter((id) => typeof id === 'string') : []
    const workflows = []
    for (const wid of workflowIds) {
      const stem = String(wid).replace(/\.json$/i, '')
      const candidates = [...new Set([stem, stem.replace(/^wf-/, ''), stem.startsWith('wf-') ? stem : `wf-${stem}`])]
      let raw = null
      for (const name of candidates) {
        try {
          raw = await fetchJson(joinUrl(branchBase, `workflows/${name}.json`), { timeoutMs: 15000, signal })
          break
        } catch {
          /* try the next naming convention */
        }
      }
      if (!raw) {
        warnings.push(`工作流 ${wid} 拉取失败`)
        continue
      }
      const workflowId = String(raw?.id ?? wid)
      workflows.push({
        id: workflowId,
        name: String(raw?.name ?? wid),
        description: String(raw?.description ?? ''),
        nodeCount: Array.isArray(raw?.nodes) ? raw.nodes.length : 0,
        installed: Boolean(this.nodes.workflowById(workflowId)),
      })
    }
    const value = {
      source,
      base,
      branch,
      branchBase,
      version: String(manifest?.version ?? ''),
      fetchedAt: nowIso(),
      nodes,
      workflows,
      warnings,
    }
    this.repoCatalogCache.set(cacheKey, { at: Date.now(), value })
    return value
  }

  /** Install one node from the repository into the custom node library. */
  async installRepoNode(args = {}) {
    const id = String(args?.id ?? '').trim()
    if (id === '') throw new Error('缺少节点 id（id）')
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`节点 id 非法：${id}`)
    const existing = this.nodes.nodeById(id)
    if (existing) return { node: existing, installed: true, skipped: true, source: existing.source }
    const { base, branchBase, source, branch } = this.resolveRepoSelection(args?.source, args?.branch)
    if (source === 'custom' && this.state.devMode !== true) {
      throw new Error('从自定义地址（未认证第三方来源）安装节点需要先打开「开发者模式」')
    }
    const raw = await fetchJson(joinUrl(branchBase, `nodes/${id}.json`), { timeoutMs: 15000, signal: this.abort.signal })
    const def = validateNodeDef(raw, { where: `仓库节点 ${id}`, source: 'repo' })
    if (def.executor?.kind === 'http' && this.state.proMode !== true) {
      throw new Error(`节点「${def.nameZh || def.name}」是 HTTP 自定义节点，导入需要先打开「专业模式」（设置 → VCG 视觉控制生成器 → 专业模式）`)
    }
    const node = await this.nodes.saveCustom(def, {
      allowHttp: true,
      repoBranch: branch,
      reviewState: branch === 'main' ? '' : 'unreviewed',
    })
    this.repoCatalogCache.clear()
    return { node, installed: true, skipped: false, source, branch, base }
  }

  listOutputs(args = {}) {
    const limit = positiveInt(args?.limit, 100, { min: 1, max: 500 })
    return { outputs: (this.state.outputs ?? []).slice(0, limit).map((output) => ({ ...output })) }
  }

  /** Allowed roots for reading an output back into the UI. */
  allowedOutputRoots() {
    const roots = new Set()
    const add = (value) => {
      if (typeof value !== 'string' || value === '') return
      roots.add(resolve(value))
    }
    add(this.workingRoot())
    add(this.workingRoot() === process.cwd() ? '' : process.cwd())
    for (const project of this.state.projects) add(project.path)
    for (const output of this.state.outputs ?? []) {
      if (typeof output?.path === 'string') add(dirname(output.path))
    }
    return [...roots]
  }

  /** Read one output file back as a data URL (≤12MB). */
  async readOutput(args = {}) {
    const raw = String(args?.path ?? '').trim()
    if (raw === '') throw new Error('缺少输出文件路径（path）')
    const target = isAbsolute(raw) ? resolve(raw) : resolve(this.workingRoot(), raw)
    const allowed = this.allowedOutputRoots().some((root) => isWithin(root, target))
    if (!allowed) throw new Error('不允许读取该路径：仅支持读取 VCG 输出目录、项目目录或工作区内的文件')
    const info = await stat(target).catch(() => null)
    if (!info || !info.isFile()) throw new Error(`文件不存在：${target}`)
    if (info.size > MAX_DATA_URL_BYTES) {
      throw new Error(`文件过大（${(info.size / 1024 / 1024).toFixed(1)}MB），超过 12MB 预览上限：${baseName(target)}`)
    }
    const bytes = await readFile(target)
    const mime = mimeForPath(target)
    return {
      dataUrl: `data:${mime};base64,${bytes.toString('base64')}`,
      mime,
      path: target,
      bytes: bytes.length,
    }
  }

  /** Resolve (and create) the output directory path for one base target. */
  async openOutputDir(args = {}) {
    const projectId = String(args?.projectId ?? '').trim()
    const sessionId = String(args?.sessionId ?? '').trim()
    let base
    if (projectId !== '') {
      const project = this.projectById(projectId)
      if (!project) throw new Error(`项目不存在：${projectId}`)
      base = project.path
    } else {
      base = this.resolveBaseDir({ key: sessionId !== '' ? `session:${sessionId}` : '', sessionId })
    }
    const path = join(base, this.outputDirName())
    await mkdir(path, { recursive: true })
    return { path }
  }

  /* -------------------------------------------------------------------- RPC */

  /** One dispatch table shared by the UI route and the agent tool. */
  operations() {
    return {
      state: async () => {
        await this.refreshGlobalKey()
        return this.publicState()
      },
      saveSettings: (args) => this.saveSettings(args),
      detectProviders: () => this.detectProviders(),
      testProvider: (args) => this.testProvider(args),
      listNodes: () => this.listNodes(),
      syncNodeRepo: (args) => this.syncNodeRepo(args),
      repoBranches: (args) => this.repoBranches(args),
      setRepoBranch: (args) => this.setRepoBranch(args),
      importNode: (args) => this.importNode(args),
      removeNode: (args) => this.removeNode(args),
      listWorkflows: () => this.listWorkflows(),
      getCanvas: (args) => this.getCanvas(args),
      saveCanvas: (args) => this.saveCanvas(args),
      createProject: (args) => this.createProject(args),
      deleteProject: (args) => this.deleteProject(args),
      listProjects: () => this.listProjects(),
      bindSession: (args) => this.bindSession(args),
      buildWorkflow: (args) => this.buildWorkflow(args),
      runWorkflow: (args) => this.runWorkflow(args),
      runNode: (args) => this.runNode(args),
      runStatus: (args) => this.runStatus(args),
      debugWorkflow: (args) => this.debugWorkflow(args),
      listRepoNodes: (args) => this.listRepoNodes(args),
      installRepoNode: (args) => this.installRepoNode(args),
      toolsStatus: () => this.toolsStatus(),
      toolsInstall: (args) => this.toolsInstall(args),
      modelsList: () => this.modelsList(),
      modelsDownload: (args) => this.modelsDownload(args),
      modelsTrust: (args) => this.modelsTrust(args),
      listOutputs: (args) => this.listOutputs(args),
      readOutput: (args) => this.readOutput(args),
      openOutputDir: (args) => this.openOutputDir(args),
    }
  }

  registerRoutes() {
    this.ctx.inject(['connection'], (connCtx) => {
      const ops = this.operations()
      const dispose = connCtx.connection.fetch.register({
        path: RPC_PATH,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: async (request) => {
          let payload
          try {
            const text = await request.text()
            if (text.length > MAX_CANVAS_BODY_BYTES) return jsonResponse(413, { ok: false, error: '请求体过大' })
            payload = JSON.parse(text || '{}')
          } catch {
            return jsonResponse(400, { ok: false, error: '请求体不是有效 JSON' })
          }
          const method = typeof payload?.method === 'string' ? payload.method : ''
          const limit = LARGE_BODY_METHODS.has(method) ? MAX_CANVAS_BODY_BYTES : MAX_BODY_BYTES
          if (JSON.stringify(payload).length > limit) return jsonResponse(413, { ok: false, error: '请求体过大' })
          const handler = ops[method]
          if (!handler) return jsonResponse(404, { ok: false, error: `未知方法：${method}` })
          try {
            const value = await handler(payload?.args ?? {})
            return jsonResponse(200, { ok: true, value })
          } catch (error) {
            return jsonResponse(200, { ok: false, error: messageOf(error) })
          }
        },
      })
      connCtx.effect(() => () => {
        void dispose()
      }, 'dsh-vcg: rpc route')
    })
  }

  /* ------------------------------------------------------------------- tool */

  registerTool() {
    this.ctx.inject(['tools'], (toolCtx) => {
      const definition = {
        name: 'vcg',
        description:
          'VCG 视觉控制生成器：AI 自动构建/运行节点式图像视频工作流。能力：' +
          'status 查看状态与默认模型；settings_set 修改设置；detect_providers 自动检测云端 Provider；' +
          'list_nodes / sync_nodes（从 DSH_VCG_repo 节点仓库同步）/ import_node / remove_node 管理节点；' +
          'list_workflows 列出内置示例工作流；canvas_get / canvas_save 读写会话或项目画布；' +
          'build_workflow 用自然语言自动搭建工作流；run_workflow / run_node 运行整张工作流或单个节点；' +
          'debug_workflow 只做完整性/模型可加载性/安全性校验（不生成内容）；' +
          'list_repo_nodes / install_repo_node 浏览并安装 DSH_VCG_repo 节点；' +
          'list_projects / create_project / delete_project 管理 VCG 项目工作区（项目工作区中的对话默认使用 VCG 画布）；' +
          'list_outputs 查看生成的图片/视频。用户要求生成图片、视频或搭建视觉工作流时：先 build_workflow，再 run_workflow。',
        parameters: {
          type: 'object',
          additionalProperties: false,
          required: ['action'],
          properties: {
            action: {
              type: 'string',
              enum: [
                'status',
                'settings_set',
                'detect_providers',
                'list_nodes',
                'sync_nodes',
                'import_node',
                'remove_node',
                'list_workflows',
                'build_workflow',
                'run_workflow',
                'run_node',
                'debug_workflow',
                'list_repo_nodes',
                'install_repo_node',
                'canvas_get',
                'canvas_save',
                'list_projects',
                'create_project',
                'delete_project',
                'list_outputs',
              ],
              description: '要执行的操作。',
            },
            network: { type: 'boolean', description: 'debug_workflow：是否做网络探测（默认 true；false 仅离线静态校验）。' },
            force: { type: 'boolean', description: 'list_repo_nodes：跳过 60 秒缓存强制刷新。' },
            prompt: { type: 'string', description: 'build_workflow：用户想要的图像/视频工作流需求描述。' },
            workflow: { type: 'object', additionalProperties: true, description: 'run_workflow / run_node / canvas_save：工作流对象（缺省时读取当前画布）。' },
            current: { type: 'object', additionalProperties: true, description: 'build_workflow：当前画布工作流（用于在已有基础上修改）。' },
            key: { type: 'string', description: '画布 key，形如 session:<会话id> 或 project:<项目id>；省略时使用当前会话。' },
            nodeId: { type: 'string', description: 'run_node：要运行的节点 id（会自动补跑其上游依赖）。' },
            projectId: { type: 'string', description: '项目 id（create/delete/bindSession 用）。' },
            name: { type: 'string', description: 'create_project：项目名称。' },
            path: { type: 'string', description: 'create_project：项目目录（省略时使用默认工作目录下的同名目录）。' },
            json: { type: 'object', additionalProperties: true, description: 'import_node：自定义节点 JSON（需专业模式）。' },
            overwrite: { type: 'boolean', description: 'import_node：是否覆盖同名自定义节点。' },
            id: { type: 'string', description: 'remove_node / delete_project：目标 id。' },
            purge: { type: 'boolean', description: 'delete_project：是否同时删除插件创建的项目目录。' },
            source: { type: 'string', description: 'sync_nodes：github / gitea / 或直接给 raw 仓库地址。' },
            patch: { type: 'object', additionalProperties: true, description: 'settings_set：要合并的设置补丁（defaults/local/nodeRepo/providers/proMode/outputDir）。' },
            sessionId: { type: 'string', description: '目标会话 id，省略为当前会话。' },
            baseDir: { type: 'string', description: 'run_workflow：输出根目录（绝对路径或相对工作目录）。' },
            limit: { type: 'integer', description: 'list_outputs：条数上限。' },
          },
        },
        timeoutMs: 300000,
        output: {
          schema: { type: 'object', additionalProperties: true },
          render: (args, value) => [{ type: 'text', text: '```json\n' + JSON.stringify(value, null, 2) + '\n```' }],
        },
        execute: async (args, exec) => {
          const action = args && typeof args === 'object' ? args.action : undefined
          const sessionId = String(args?.sessionId ?? exec?.agent?.id ?? '').trim()
          const key = String(args?.key ?? '').trim() || (sessionId !== '' ? `session:${sessionId}` : '')
          try {
            switch (action) {
              case 'status': {
                await this.refreshGlobalKey()
                const binding = sessionId !== '' ? this.state.bindings?.[sessionId] : undefined
                return {
                  ok: true,
                  ...this.publicState(),
                  binding: binding ?? null,
                  canvasKey: key,
                  provider: this.publicProviders()[0] ?? null,
                }
              }
              case 'settings_set': {
                const value = await this.saveSettings({ patch: args?.patch ?? {} })
                return { ok: true, ...value }
              }
              case 'detect_providers':
                return { ok: true, ...(await this.detectProviders()) }
              case 'list_nodes': {
                const value = this.listNodes()
                return { ok: true, count: value.nodes.length, builtinCount: value.builtinCount, source: value.source, syncedAt: value.syncedAt, nodes: value.nodes, warnings: value.warnings }
              }
              case 'sync_nodes': {
                const value = await this.syncNodeRepo({ source: args?.source })
                return {
                  ok: value.ok !== false,
                  nodes: value.nodes,
                  workflows: value.workflows,
                  syncedAt: value.syncedAt,
                  source: value.source,
                  warnings: value.warnings ?? [],
                }
              }
              case 'import_node':
                return { ok: true, ...(await this.importNode({ json: args?.json, overwrite: args?.overwrite })) }
              case 'remove_node':
                return { ok: true, ...(await this.removeNode({ id: args?.id })) }
              case 'list_workflows':
                return { ok: true, ...this.listWorkflows() }
              case 'build_workflow':
                return { ok: true, ...(await this.buildWorkflow({ prompt: args?.prompt, current: args?.current, sessionId })) }
              case 'run_workflow': {
                const value = await this.runWorkflow({ key, workflow: args?.workflow, sessionId, baseDir: args?.baseDir })
                return { ok: !value.error, ...value }
              }
              case 'run_node': {
                const value = await this.runNode({ key, workflow: args?.workflow, sessionId, baseDir: args?.baseDir, nodeId: args?.nodeId })
                return { ok: value.result?.status !== 'error', ...value }
              }
              case 'debug_workflow': {
                const value = await this.debugWorkflow({ key, workflow: args?.workflow, sessionId, baseDir: args?.baseDir, network: args?.network })
                return { ok: value.ok, ...value }
              }
              case 'list_repo_nodes': {
                const value = await this.listRepoNodes({ source: args?.source, force: args?.force })
                // Model-facing view stays compact; the UI RPC gets the full definitions.
                return {
                  ok: true,
                  source: value.source,
                  base: value.base,
                  version: value.version,
                  fetchedAt: value.fetchedAt,
                  count: value.nodes.length,
                  warnings: value.warnings,
                  nodes: value.nodes.map((node) => ({
                    id: node.id,
                    name: node.nameZh || node.name,
                    category: node.category,
                    engine: node.engine,
                    installed: node.installed,
                    requiresPro: node.requiresPro,
                    canImport: node.canImport,
                    outputs: (node.outputs || []).length,
                    inputs: (node.inputs || []).length,
                  })),
                  workflows: value.workflows,
                }
              }
              case 'install_repo_node':
                return { ok: true, ...(await this.installRepoNode({ id: args?.id, source: args?.source })) }
              case 'canvas_get':
                return { ok: true, ...this.getCanvas({ key }) }
              case 'canvas_save': {
                const value = await this.saveCanvas({ key, workflow: args?.workflow })
                return { ok: true, key, ...value }
              }
              case 'list_projects':
                return { ok: true, ...this.listProjects() }
              case 'create_project':
                return { ok: true, ...(await this.createProject({ name: args?.name, path: args?.path })) }
              case 'delete_project':
                return { ok: true, ...(await this.deleteProject({ id: args?.id, purge: args?.purge })) }
              case 'list_outputs':
                return { ok: true, ...this.listOutputs({ limit: args?.limit }) }
              default:
                return { ok: false, error: `未知操作：${String(action)}` }
            }
          } catch (error) {
            return { ok: false, error: messageOf(error) }
          }
        },
      }
      toolCtx.effect(() => toolCtx.tools.register(definition), 'dsh-vcg: tool')
    })
  }

  /* --------------------------------------------------------- prompt section */

  registerPromptSection() {
    this.ctx.inject(['systemPrompt'], (promptCtx) => {
      promptCtx.effect(
        () =>
          promptCtx.systemPrompt.section({
            name: 'dsh-vcg',
            order: 2965,
            interpolate: false,
            text: (context) => {
              const sessionId = context?.agent?.id
              const binding = sessionId ? this.state.bindings?.[sessionId] : undefined
              const project = binding?.projectId ? this.projectById(binding.projectId) : undefined
              const providers = this.publicProviders()
              const provider = providers.find((item) => item.id === this.state.defaults.providerId) ?? providers[0]
              const local = this.state.local
              const providerText = provider
                ? `默认云端 Provider：${provider.label}（模型：生图 ${this.state.defaults.imageModel || '未设置'}、生视频 ${this.state.defaults.videoModel || '未设置'}、文本 ${this.state.defaults.textModel || '未设置'}）`
                : '尚未配置云端 Provider，请提示用户到「设置 → VCG 视觉控制生成器」检测全局 API 或添加自定义 Provider'
              return (
                'VCG 视觉控制生成器插件已启用：vcg 工具可自动构建并运行节点式图像/视频生成工作流（节点定义来自 DSH_VCG_repo 节点仓库，内置文生图/文生视频示例）。' +
                '用户要生成图片或视频、或要搭建视觉工作流时：先调用 vcg build_workflow（prompt 写清画面内容、风格、尺寸、时长等要求）拿到 workflow，' +
                '再调用 vcg run_workflow（可传 workflow 对象，key 用 session:<当前会话id>；省略 workflow 时运行已保存的当前画布），然后根据 results 里的 images[].path / images[].url 告知用户结果。' +
                '只需运行单个节点用 vcg run_node。' +
                (sessionId ? `当前会话 id：${sessionId}，画布 key：session:${sessionId}。` : '') +
                (project ? `本会话绑定 VCG 项目「${project.name}」（路径 ${project.path}），输出保存在该项目目录。` : '') +
                `${providerText}。` +
                (local.enabled
                  ? `本地运算模式已开启（ComfyUI：${local.comfyuiUrl || '未配置地址'}），工作流将翻译为 ComfyUI API prompt 执行。`
                  : '当前为云端模式。') +
                `输出目录：${this.outputDirName()}。` +
                '用户提到节点仓库 DSH_VCG_repo 或需要新节点时用 vcg sync_nodes 同步；管理项目用 vcg create_project / list_projects。' +
                '不要在回复里编造生成结果：一切以 vcg 工具返回的 results/outputs 为准。'
              )
            },
          }),
        'dsh-vcg: prompt section',
      )
    })
  }
}

/** Host entrypoint. */
export async function apply(ctx, config) {
  const studio = new VcgStudio(ctx, config)
  ctx.effect(() => () => studio.dispose(), 'dsh-vcg: lifecycle')
  try {
    await studio.init()
  } catch (error) {
    ;(ctx.logger ?? console).warn?.(`dsh-vcg: 初始化失败: ${messageOf(error)}`)
  }
}

/* Exported for host self-tests: VcgStudio accepts a fake ctx (no services needed). */
export { VcgStudio }

/* Exported pure functions for host self-tests (no side effects on import). */
export {
  BUILTIN_FNS,
  NODE_CATEGORIES,
  PARAM_TYPES,
  PORT_TYPES,
  buildWorkflowPrompt,
  catalogModels,
  emptyWorkflow,
  extractJsonObject,
  isWithin,
  maskProvider,
  mergeCatalogs,
  mimeForPath,
  normalizeOutputDir,
  normalizeProvider,
  prepareImportedNode,
  projectSlug,
  queryPath,
  sanitizeProjectName,
  textValue,
  topoSort,
  typesCompatible,
  urlListOf,
  validateGeneratedPlan,
  validateNodeDef,
  validateWorkflowShape,
  validateWorkflowWithDefs,
}
export { buildComfyPrompt } from './lib/comfy.js'
export { classifyModel, composeImagePrompt, normalizeSize, parseChatImageResponse, parseChatTextResponse, preferredModel } from './lib/cloud.js'
export { fileStamp, outputFileName, safeResolveOutputPath } from './lib/paths.js'
export { defaultState, normalizeState } from './lib/state.js'
export { collectStreamText } from './lib/builder.js'
export { nodeParams, resolveParam } from './lib/workflow.js'
export { firstImageValue, renderTemplate, resolveWorkflowBaseDir, validateForRun } from './lib/engine.js'
