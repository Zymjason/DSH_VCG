/**
 * VCG plugin state: schema v2, v1 migration, API-key masking, atomic store.
 *
 * The file lives at `$DSH_PROFILE_DIR/data/dsh-vcg/state.json`, or
 * `~/.dsh/dsh-vcg/state.json` when the profile directory is not configured.
 * Writes are atomic (temp file + rename) and mode 0600.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { clamp, isPlainObject, normalizeBaseUrl, nowIso, uniqueStrings } from './util.js'
import { DEFAULT_OUTPUT_DIR } from './paths.js'

/** Durable state schema version understood by this build. */
export const STATE_VERSION = 2

/** Provider kinds supported by the cloud layer. */
export const PROVIDER_KINDS = ['bailian-chat-image', 'bailian-video', 'openai-images', 'openai-video', 'custom-http']

/** Node repository branches understood by the sync layer (§16.4). */
export const REPO_BRANCHES = ['main', 'dev', 'bug', 'recheck']

/** Default node repository locations (DSH_VCG_repo). */
export const DEFAULT_NODE_REPO = {
  githubBase: 'https://raw.githubusercontent.com/Zymjason/DSH_VCG_repo/main',
  giteaBase: 'https://gitea.com/ZymJason_DSH/DSH_VCG_repo/raw/branch/main',
  branch: 'main',
  lastSyncAt: '',
  source: '',
}

/** Default models advertised by the Alibaba Token Plan route (§9). */
export const DEFAULT_MODEL_CATALOG = {
  image: ['wan2.7-image', 'wan2.7-image-pro', 'qwen-image-3.0-pro'],
  video: ['wan3.0-video'],
  text: ['qwen3.8-max'],
  audio: [],
  all: ['wan2.7-image', 'wan2.7-image-pro', 'qwen-image-3.0-pro', 'wan3.0-video', 'qwen3.8-max'],
}

/** Directory for plugin data. */
export function dataDirectory(env = process.env) {
  if (env?.DSH_PROFILE_DIR) return join(env.DSH_PROFILE_DIR, 'data', 'dsh-vcg')
  return join(homedir(), '.dsh', 'dsh-vcg')
}

/** Default local model directory (§16.5): `<plugin data>/models`. */
export function defaultModelsDir(directory) {
  return join(typeof directory === 'string' && directory !== '' ? directory : dataDirectory(), 'models')
}

/** Normalize one repository branch name; unknown values fall back to main. */
export function normalizeRepoBranch(raw) {
  const value = typeof raw === 'string' ? raw.trim() : ''
  return REPO_BRANCHES.includes(value) ? value : 'main'
}

/**
 * Normalize the `models` bucket of one provider record.
 * `all` (/models full list) and `audio` are preserved so a state round-trip
 * never drops the auto-read catalog (§14.3); legacy records without `all`
 * fall back to the union of the capability buckets.
 */
export function normalizeModels(raw) {
  const source = isPlainObject(raw) ? raw : {}
  const image = uniqueStrings(source.image)
  const video = uniqueStrings(source.video)
  const text = uniqueStrings(source.text)
  const audio = uniqueStrings(source.audio)
  let all = uniqueStrings(source.all)
  if (all.length === 0) all = uniqueStrings([...image, ...video, ...text, ...audio])
  else all = uniqueStrings([...all, ...audio])
  return { image, video, text, audio, all }
}

/** One provider record normalized for storage; returns undefined when unusable. */
export function normalizeProvider(raw, existing) {
  if (!isPlainObject(raw)) return undefined
  const idRaw = typeof raw.id === 'string' ? raw.id.trim() : ''
  const id = idRaw !== '' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(idRaw) ? idRaw : ''
  if (id === '') return undefined
  const kind = PROVIDER_KINDS.includes(raw.kind) ? raw.kind : existing?.kind ?? 'bailian-chat-image'
  const baseUrl = normalizeBaseUrl(raw.baseUrl ?? existing?.baseUrl ?? '')
  const previousKey = typeof existing?.apiKey === 'string' ? existing.apiKey : ''
  const clear = raw.clearApiKey === true
  const apiKey =
    typeof raw.apiKey === 'string' && raw.apiKey.trim() !== ''
      ? raw.apiKey.trim()
      : clear
        ? ''
        : previousKey
  const apiKeyRef =
    typeof raw.apiKeyRef === 'string' && raw.apiKeyRef.trim() !== ''
      ? raw.apiKeyRef.trim()
      : typeof existing?.apiKeyRef === 'string'
        ? existing.apiKeyRef
        : ''
  const detectedFrom = raw.detectedFrom === 'global' || raw.detectedFrom === 'custom' ? raw.detectedFrom : existing?.detectedFrom ?? 'custom'
  // The settings form only edits image / video / text, so keep the auto-read
  // `audio` / `all` catalog of the previous record across saves (§14.3).
  const incomingRaw = isPlainObject(raw.models) ? raw.models : undefined
  const incoming = normalizeModels(incomingRaw ?? existing?.models)
  const previous = normalizeModels(existing?.models)
  const keepAll = !(incomingRaw && Array.isArray(incomingRaw.all) && incomingRaw.all.length > 0)
  const keepAudio = !(incomingRaw && Array.isArray(incomingRaw.audio) && incomingRaw.audio.length > 0)
  const models = {
    image: incoming.image,
    video: incoming.video,
    text: incoming.text,
    audio: keepAudio ? uniqueStrings([...previous.audio, ...incoming.audio]) : incoming.audio,
    all: keepAll ? uniqueStrings([...previous.all, ...incoming.all]) : incoming.all,
  }
  return {
    id,
    label: typeof raw.label === 'string' && raw.label.trim() !== '' ? raw.label.trim() : existing?.label ?? id,
    kind,
    baseUrl,
    apiKeyRef,
    apiKey,
    models,
    detectedFrom,
    enabled: raw.enabled === undefined ? existing?.enabled !== false : raw.enabled !== false,
  }
}

/** Public (masked) view of one provider record. */
export function maskProvider(provider) {
  if (!isPlainObject(provider)) return undefined
  return {
    id: provider.id,
    label: provider.label,
    kind: provider.kind,
    baseUrl: provider.baseUrl,
    apiKeyRef: provider.apiKeyRef ?? '',
    hasKey: typeof provider.apiKey === 'string' ? provider.apiKey !== '' : false,
    models: normalizeModels(provider.models),
    detectedFrom: provider.detectedFrom ?? 'custom',
    enabled: provider.enabled !== false,
  }
}

/** Default settings for a fresh installation. */
export function defaultState() {
  return {
    version: STATE_VERSION,
    providers: [],
    defaults: { providerId: '', imageModel: '', videoModel: '', textModel: '' },
    local: {
      enabled: false,
      comfyuiUrl: '',
      timeoutMs: 600000,
      modelsDir: defaultModelsDir(),
      autoInstall: false,
    },
    proMode: false,
    devMode: false,
    nodeRepo: { ...DEFAULT_NODE_REPO },
    outputDir: DEFAULT_OUTPUT_DIR,
    projects: [],
    canvases: {},
    outputs: [],
    bindings: {},
  }
}

/** Normalize the output directory setting into one relative path segment. */
export function normalizeOutputDir(raw, fallback = DEFAULT_OUTPUT_DIR) {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (value === '') return fallback
  const cleaned = value
    .replace(/^[\\/]+/, '')
    .split(/[\\/]+/)
    .filter((segment) => segment !== '' && segment !== '.' && segment !== '..')
    .join('/')
  return cleaned === '' ? fallback : cleaned
}

/** Normalize one placeholder project record. */
function normalizeProject(raw) {
  if (!isPlainObject(raw)) return undefined
  const id = typeof raw.id === 'string' && raw.id.trim() !== '' ? raw.id.trim() : ''
  const path = typeof raw.path === 'string' && raw.path.trim() !== '' ? raw.path.trim() : ''
  if (id === '' || path === '') return undefined
  const name = typeof raw.name === 'string' && raw.name.trim() !== '' ? raw.name.trim() : id
  return {
    id,
    name,
    path,
    workspaceId: typeof raw.workspaceId === 'string' ? raw.workspaceId : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
    managed: raw.managed === true,
  }
}

/** Normalize one output record. */
function normalizeOutput(raw) {
  if (!isPlainObject(raw) || typeof raw.path !== 'string' || raw.path === '') return undefined
  return {
    id: typeof raw.id === 'string' && raw.id !== '' ? raw.id : `out_${Math.random().toString(36).slice(2, 12)}`,
    ts: typeof raw.ts === 'string' ? raw.ts : '',
    path: raw.path,
    kind: raw.kind === 'video' ? 'video' : 'image',
    providerId: typeof raw.providerId === 'string' ? raw.providerId : '',
    model: typeof raw.model === 'string' ? raw.model : '',
    prompt: typeof raw.prompt === 'string' ? raw.prompt.slice(0, 2000) : '',
    nodeId: typeof raw.nodeId === 'string' ? raw.nodeId : '',
  }
}

/**
 * Normalize a stored/loaded state object into the current schema.
 * Handles the v1 → v2 migration (single provider → providers[]).
 *
 * @param {unknown} raw parsed JSON (or undefined)
 * @param {{config?:object, now?:string}} [options]
 * @returns {object} fresh state object
 */
export function normalizeState(raw, { config } = {}) {
  const state = defaultState()
  const source = isPlainObject(raw) ? raw : {}

  // Providers: v2 array; v1 single-provider fields are migrated below.
  if (Array.isArray(source.providers)) {
    const seen = new Set()
    state.providers = source.providers
      .map((item) => normalizeProvider(item))
      .filter((item) => {
        if (!item || seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
  } else if (isPlainObject(source.provider)) {
    const migrated = normalizeProvider({ ...source.provider, detectedFrom: 'custom' })
    if (migrated) state.providers = [migrated]
  } else if (typeof source.baseUrl === 'string' && source.baseUrl.trim() !== '') {
    const migrated = normalizeProvider({
      id: 'custom',
      label: '自定义 API',
      kind: typeof source.kind === 'string' ? source.kind : 'bailian-chat-image',
      baseUrl: source.baseUrl,
      apiKey: source.apiKey,
      models: source.models,
      detectedFrom: 'custom',
    })
    if (migrated) state.providers = [migrated]
  }

  // Defaults (v2 object, with v1 `model` fallback).
  const defaults = isPlainObject(source.defaults) ? source.defaults : {}
  state.defaults = {
    providerId: typeof defaults.providerId === 'string' ? defaults.providerId : state.providers[0]?.id ?? '',
    imageModel:
      typeof defaults.imageModel === 'string' && defaults.imageModel !== ''
        ? defaults.imageModel
        : typeof source.model === 'string'
          ? source.model
          : '',
    videoModel: typeof defaults.videoModel === 'string' ? defaults.videoModel : '',
    textModel:
      typeof defaults.textModel === 'string'
        ? defaults.textModel
        : typeof source.textModel === 'string'
          ? source.textModel
          : '',
  }

  // Local (ComfyUI) settings + local tool/model settings (§16.5).
  const local = isPlainObject(source.local) ? source.local : {}
  state.local = {
    enabled: local.enabled === true,
    comfyuiUrl: normalizeBaseUrl(local.comfyuiUrl),
    timeoutMs: clamp(Number(local.timeoutMs) || 600000, 30000, 3600000),
    modelsDir: typeof local.modelsDir === 'string' && local.modelsDir.trim() !== '' ? local.modelsDir.trim() : state.local.modelsDir,
    autoInstall: local.autoInstall === true,
  }

  state.proMode = source.proMode === true
  // Developer mode unlocks the non-main node-repository branches (§16.4).
  state.devMode = source.devMode === true

  const repo = isPlainObject(source.nodeRepo) ? source.nodeRepo : {}
  state.nodeRepo = {
    githubBase: typeof repo.githubBase === 'string' && repo.githubBase.trim() !== '' ? repo.githubBase.trim() : DEFAULT_NODE_REPO.githubBase,
    giteaBase: typeof repo.giteaBase === 'string' && repo.giteaBase.trim() !== '' ? repo.giteaBase.trim() : DEFAULT_NODE_REPO.giteaBase,
    branch: normalizeRepoBranch(repo.branch),
    lastSyncAt: typeof repo.lastSyncAt === 'string' ? repo.lastSyncAt : '',
    source: typeof repo.source === 'string' ? repo.source : '',
  }
  // Without developer mode only the reviewed `main` branch is usable.
  if (state.devMode !== true) state.nodeRepo.branch = 'main'

  state.outputDir = normalizeOutputDir(source.outputDir)

  if (Array.isArray(source.projects)) {
    state.projects = source.projects.map(normalizeProject).filter(Boolean)
  }

  const canvases = isPlainObject(source.canvases) ? source.canvases : {}
  for (const [key, entry] of Object.entries(canvases)) {
    if (typeof key !== 'string' || !isPlainObject(entry)) continue
    if (!isPlainObject(entry.workflow)) continue
    state.canvases[key] = {
      workflow: entry.workflow,
      updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
    }
  }

  if (Array.isArray(source.outputs)) {
    state.outputs = source.outputs.map(normalizeOutput).filter(Boolean).slice(0, 500)
  }

  if (isPlainObject(source.bindings)) {
    for (const [sessionId, binding] of Object.entries(source.bindings)) {
      if (!isPlainObject(binding) || typeof binding.projectId !== 'string') continue
      state.bindings[sessionId] = {
        projectId: binding.projectId,
        updatedAt: typeof binding.updatedAt === 'string' ? binding.updatedAt : '',
      }
    }
  }

  // Deployment row config supplies first-start defaults only; stored state wins.
  if (config && typeof config === 'object') {
    const storedOutputDir = typeof source.outputDir === 'string' && source.outputDir.trim() !== ''
    if (!storedOutputDir && typeof config.outputDir === 'string' && config.outputDir.trim() !== '') {
      state.outputDir = normalizeOutputDir(config.outputDir)
    }
    const storedGithubBase = isPlainObject(source.nodeRepo) && typeof source.nodeRepo.githubBase === 'string' && source.nodeRepo.githubBase.trim() !== ''
    if (!storedGithubBase && typeof config.nodeRepo === 'string' && config.nodeRepo.trim() !== '') {
      state.nodeRepo.githubBase = config.nodeRepo.trim()
    }
    if (state.providers.length === 0 && typeof config.baseUrl === 'string' && config.baseUrl.trim() !== '') {
      const seeded = normalizeProvider({
        id: 'custom',
        label: '自定义 API',
        kind: 'bailian-chat-image',
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        detectedFrom: 'custom',
      })
      if (seeded) state.providers.push(seeded)
    }
  }

  if (state.providers.length > 0 && !state.providers.some((provider) => provider.id === state.defaults.providerId)) {
    state.defaults.providerId = state.providers[0].id
  }
  return state
}

/**
 * Atomic, 0600 state store.
 * `read()` normalizes on load; `write()` persists the current object atomically.
 */
export class StateStore {
  constructor({ directory, config, logger } = {}) {
    this.directory = directory ?? dataDirectory()
    this.file = join(this.directory, 'state.json')
    this.config = config ?? {}
    this.log = logger
    this.state = defaultState()
  }

  /** Load (or seed) the state file. Never throws for a missing/corrupt file. */
  async load() {
    let raw
    try {
      raw = JSON.parse(await readFile(this.file, 'utf8'))
    } catch {
      raw = undefined
    }
    this.state = normalizeState(raw, { config: this.config })
    // The model directory default is relative to this store's data directory,
    // so an explicit stored value wins but a fresh install uses `<data>/models`.
    const storedModelsDir = isPlainObject(raw?.local) && typeof raw.local.modelsDir === 'string' && raw.local.modelsDir.trim() !== ''
    if (!storedModelsDir) this.state.local.modelsDir = defaultModelsDir(this.directory)
    await mkdir(this.directory, { recursive: true }).catch(() => {})
    return this.state
  }

  /** Persist the state atomically (temp file + rename, mode 0600). */
  async save() {
    await mkdir(this.directory, { recursive: true })
    const tmp = `${this.file}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(this.state, null, 2), { mode: 0o600 })
    await rename(tmp, this.file)
  }

  /** Save, logging (not throwing) on failure. */
  async saveQuietly() {
    try {
      await this.save()
      return true
    } catch (error) {
      try {
        this.log?.warn?.(`dsh-vcg: 保存状态失败: ${error instanceof Error ? error.message : String(error)}`)
      } catch {
        /* logger is best-effort */
      }
      return false
    }
  }

  /** Touch the updatedAt timestamp of one project. */
  touchProject(projectId) {
    const project = this.state.projects.find((item) => item.id === projectId)
    if (project) project.updatedAt = nowIso()
    return project
  }
}
