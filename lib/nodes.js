/**
 * Node definitions (§1) and workflows (§2, §11): validation, loading, repo sync,
 * custom-node import/removal.
 *
 * Loading order: builtin `DSH_VCG/nodes` → repo cache `data/dsh-vcg/node-repo`
 * → imported custom nodes `data/dsh-vcg/node-custom`. Later sources override the
 * same node id and are tagged with their `source`.
 */

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fetchJson } from './http.js'
import { isPlainObject, messageOf, nowIso, tail } from './util.js'
import { validateWorkflowShape } from './workflow.js'

/** Port / param type vocabulary (§1). */
export const PORT_TYPES = ['model', 'conditioning', 'latent', 'image', 'video', 'text', 'number', 'any']
export const PARAM_TYPES = ['text', 'textarea', 'number', 'select', 'toggle', 'model']
export const ENGINE_VALUES = ['cloud', 'local', 'both']
export const EXECUTOR_KINDS = ['builtin', 'http', 'comfy']
export const CLOUD_CAPABILITIES = ['image', 'video', 'text', 'none']
/** The only allowed category ids (§11.7, mirrors client NODE_CATEGORIES). */
export const NODE_CATEGORIES = ['input', 'model', 'latent', 'sampling', 'decode', 'video', 'utility', 'custom']
/** Builtin executor fn names (§4). */
export const BUILTIN_FNS = [
  'promptInput',
  'modelLoader',
  'clipTextEncode',
  'emptyLatent',
  'imageProps',
  'ksampler',
  'vaeDecode',
  'imageOutput',
  'videoSampler',
  'videoOutput',
  'textInput',
  'textOutput',
  'note',
]

/** Join a raw repository base URL with one repo-relative path. */
export function joinUrl(base, relative) {
  const root = String(base ?? '').replace(/\/+$/, '')
  const path = String(relative ?? '').replace(/^\/+/, '')
  return path === '' ? root : `${root}/${path}`
}

/** Normalize one port definition; throws a readable error on invalid input. */
function normalizePort(raw, kind, where) {
  if (!isPlainObject(raw)) throw new Error(`${where}：端口定义必须是对象`)
  const id = typeof raw.id === 'string' ? raw.id.trim() : ''
  if (id === '' || !/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`${where}：端口 id 无效（${id || '(空)'}）`)
  const type = typeof raw.type === 'string' ? raw.type : ''
  if (!PORT_TYPES.includes(type)) throw new Error(`${where}：端口「${id}」的类型无效（${type || '(空)'}），允许：${PORT_TYPES.join('/')}`)
  const port = {
    id,
    label: typeof raw.label === 'string' && raw.label.trim() !== '' ? raw.label.trim() : id.toUpperCase(),
    type,
  }
  if (kind === 'input' && raw.optional === true) port.optional = true
  return port
}

/** Normalize one param definition; throws a readable error on invalid input. */
function normalizeParam(raw, where) {
  if (!isPlainObject(raw)) throw new Error(`${where}：参数定义必须是对象`)
  const id = typeof raw.id === 'string' ? raw.id.trim() : ''
  if (id === '' || !/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`${where}：参数 id 无效（${id || '(空)'}）`)
  const type = typeof raw.type === 'string' ? raw.type : ''
  if (!PARAM_TYPES.includes(type)) throw new Error(`${where}：参数「${id}」的类型无效（${type || '(空)'}），允许：${PARAM_TYPES.join('/')}`)
  const param = {
    id,
    label: typeof raw.label === 'string' && raw.label.trim() !== '' ? raw.label.trim() : id,
    type,
  }
  if (type === 'select') {
    const options = Array.isArray(raw.options) ? raw.options.filter((option) => typeof option === 'string') : []
    if (options.length === 0) throw new Error(`${where}：select 参数「${id}」必须提供非空 options 字符串数组`)
    param.options = options
    param.default = options.includes(raw.default) ? raw.default : options[0]
  } else if (type === 'number') {
    if (raw.default !== undefined && typeof raw.default !== 'number') throw new Error(`${where}：number 参数「${id}」的 default 必须是数字`)
    param.default = typeof raw.default === 'number' ? raw.default : 0
    if (typeof raw.min === 'number') param.min = raw.min
    if (typeof raw.max === 'number') param.max = raw.max
    if (typeof raw.step === 'number' && raw.step > 0) param.step = raw.step
  } else if (type === 'toggle') {
    param.default = raw.default === true
  } else if (type === 'model') {
    param.default = typeof raw.default === 'string' ? raw.default : ''
  } else {
    param.default = typeof raw.default === 'string' ? raw.default : ''
  }
  return param
}

/** Normalize the ComfyUI mapping block (may be absent for cloud-only nodes). */
function normalizeLocal(raw, where) {
  if (raw === undefined || raw === null) return undefined
  if (!isPlainObject(raw)) throw new Error(`${where}：local 必须是对象`)
  if (raw.comfyui === undefined) return undefined
  const comfy = raw.comfyui
  if (!isPlainObject(comfy)) throw new Error(`${where}：local.comfyui 必须是对象`)
  const classType = typeof comfy.class_type === 'string' ? comfy.class_type.trim() : ''
  if (classType === '') throw new Error(`${where}：local.comfyui.class_type 不能为空`)
  const map = isPlainObject(comfy.map) ? comfy.map : {}
  const normalizedMap = {}
  for (const [field, ref] of Object.entries(map)) {
    if (typeof ref === 'string') {
      normalizedMap[field] = ref
    } else if (isPlainObject(ref) && 'value' in ref) {
      normalizedMap[field] = { value: ref.value }
    } else {
      throw new Error(`${where}：local.comfyui.map.${field} 必须是字符串（params.x / inputs.x）或 {value}`)
    }
  }
  return { comfyui: { class_type: classType, map: normalizedMap } }
}

/** Normalize the declarative HTTP executor of a custom node (§3). */
function normalizeHttpExecutor(raw, where) {
  const request = isPlainObject(raw.request) ? raw.request : undefined
  if (!request) throw new Error(`${where}：executor.kind="http" 必须提供 request 对象`)
  const url = typeof request.url === 'string' ? request.url.trim() : ''
  if (url === '') throw new Error(`${where}：自定义节点 request.url 不能为空`)
  if (!/^https?:\/\//i.test(url)) throw new Error(`${where}：自定义节点 request.url 必须是 http(s) 地址`)
  const method = typeof request.method === 'string' ? request.method.toUpperCase() : 'POST'
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) throw new Error(`${where}：不支持的 request.method：${method}`)
  const headers = isPlainObject(request.headers)
    ? Object.fromEntries(Object.entries(request.headers).map(([key, value]) => [key, String(value)]))
    : {}
  return {
    kind: 'http',
    request: {
      url,
      method,
      headers,
      body: request.body,
      timeoutMs:
        typeof request.timeoutMs === 'number' && request.timeoutMs > 0
          ? Math.min(Math.max(request.timeoutMs, 1000), 600000)
          : 120000,
    },
    response: isPlainObject(raw.response)
      ? {
          images: typeof raw.response.images === 'string' ? raw.response.images : undefined,
          text: typeof raw.response.text === 'string' ? raw.response.text : undefined,
          error: typeof raw.response.error === 'string' ? raw.response.error : undefined,
        }
      : {},
  }
}

/**
 * Validate and normalize one node definition (§1 + §11.1/11.4/11.5/11.7).
 * Throws a user-readable Chinese error; returns a detached normalized object.
 *
 * @param {unknown} input raw JSON node definition
 * @param {{where?:string, allowHttp?:boolean}} [options]
 */
export function validateNodeDef(input, options = {}) {
  const where = options.where ? `节点定义 ${options.where}` : '节点定义'
  if (!isPlainObject(input)) throw new Error(`${where}：必须是 JSON 对象`)
  const id = typeof input.id === 'string' ? input.id.trim() : ''
  if (id === '') throw new Error(`${where}：缺少 id`)
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`${where}：id「${id}」必须是小写 kebab-case（仅 a-z0-9-）`)
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (name === '') throw new Error(`${where}（${id}）：缺少 name`)
  const category = typeof input.category === 'string' ? input.category.trim() : ''
  if (!NODE_CATEGORIES.includes(category)) {
    throw new Error(`${where}（${id}）：category 无效（${category || '(空)'}），允许：${NODE_CATEGORIES.join('/')}`)
  }
  const engine = typeof input.engine === 'string' ? input.engine : 'cloud'
  if (!ENGINE_VALUES.includes(engine)) throw new Error(`${where}（${id}）：engine 无效（${engine}）`)
  const inputs = Array.isArray(input.inputs) ? input.inputs.map((port) => normalizePort(port, 'input', `${where}（${id}）`)) : []
  const outputs = Array.isArray(input.outputs) ? input.outputs.map((port) => normalizePort(port, 'output', `${where}（${id}）`)) : []
  const params = Array.isArray(input.params) ? input.params.map((param) => normalizeParam(param, `${where}（${id}）`)) : []
  for (const [kind, ports] of [
    ['输入', inputs],
    ['输出', outputs],
  ]) {
    const seen = new Set()
    for (const port of ports) {
      if (seen.has(port.id)) throw new Error(`${where}（${id}）：${kind}端口 id 重复：${port.id}`)
      seen.add(port.id)
    }
  }
  const seenParams = new Set()
  for (const param of params) {
    if (seenParams.has(param.id)) throw new Error(`${where}（${id}）：参数 id 重复：${param.id}`)
    seenParams.add(param.id)
  }

  const executorRaw = isPlainObject(input.executor) ? input.executor : undefined
  if (!executorRaw) throw new Error(`${where}（${id}）：缺少 executor`)
  const kind = typeof executorRaw.kind === 'string' ? executorRaw.kind : ''
  if (!EXECUTOR_KINDS.includes(kind)) throw new Error(`${where}（${id}）：executor.kind 无效（${kind || '(空)'}）`)
  if (kind === 'builtin') {
    const fn = typeof executorRaw.fn === 'string' ? executorRaw.fn : ''
    if (!BUILTIN_FNS.includes(fn)) throw new Error(`${where}（${id}）：executor.fn「${fn || '(空)'}」不是内置执行器（可用：${BUILTIN_FNS.join('/')}）`)
  }

  const cloudRaw = isPlainObject(input.cloud) ? input.cloud : {}
  const capability = CLOUD_CAPABILITIES.includes(cloudRaw.capability) ? cloudRaw.capability : 'none'

  const def = {
    id,
    name,
    nameZh: typeof input.nameZh === 'string' ? input.nameZh : name,
    category,
    order: typeof input.order === 'number' && Number.isFinite(input.order) ? input.order : 0,
    description: typeof input.description === 'string' ? input.description : '',
    engine,
    inputs,
    outputs,
    params,
    executor: kind === 'http' ? normalizeHttpExecutor(executorRaw, `${where}（${id}）`) : { ...executorRaw },
    cloud: {
      capability,
      ...(typeof cloudRaw.api === 'string' ? { api: cloudRaw.api } : {}),
      ...(typeof cloudRaw.notes === 'string' ? { notes: cloudRaw.notes } : {}),
    },
    ui: isPlainObject(input.ui)
      ? {
          accent: typeof input.ui.accent === 'string' && /^#[0-9a-f]{6}$/i.test(input.ui.accent) ? input.ui.accent : '#7c5cff',
          width: typeof input.ui.width === 'number' && input.ui.width > 0 ? Math.min(Math.max(input.ui.width, 120), 720) : 264,
        }
      : { accent: '#7c5cff', width: 264 },
    local: normalizeLocal(input.local, `${where}（${id}）`),
  }
  if (options.source) def.source = options.source
  if (def.local === undefined) delete def.local
  return def
}

/** Attach source/custom metadata for the client listing. */
export function decorateNode(def, source) {
  return {
    ...def,
    source,
    custom: source !== 'builtin',
    builtin: source === 'builtin',
  }
}

/** Read one JSON file, returning a readable error message on failure. */
async function readJsonFile(file) {
  const text = await readFile(file, 'utf8')
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`${file}：JSON 解析失败（${messageOf(error)}）`)
  }
}

/** List the `.json` files of one directory (empty when missing). */
async function listJsonFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json')).map((entry) => entry.name).sort()
  } catch {
    return []
  }
}

/**
 * Node / workflow definition store.
 *
 * @param {object} options
 * @param {string} options.pluginDir plugin root (contains nodes/ and workflows/)
 * @param {string} options.cacheDir repo cache (<data>/node-repo)
 * @param {string} options.customDir imported nodes (<data>/node-custom)
 * @param {{warn?:Function}} [options.logger]
 */
export class NodeStore {
  constructor({ pluginDir, cacheDir, customDir, logger } = {}) {
    this.pluginDir = pluginDir
    this.cacheDir = cacheDir
    this.customDir = customDir
    this.log = logger
    this.nodes = new Map()
    this.workflows = new Map()
    this.builtinCount = 0
    this.source = 'builtin'
    this.syncedAt = ''
    this.warnings = []
    this.manifest = undefined
  }

  builtinNodesDir() {
    return join(this.pluginDir, 'nodes')
  }

  builtinWorkflowsDir() {
    return join(this.pluginDir, 'workflows')
  }

  /** Load builtin + cached repo + imported custom definitions. */
  async load() {
    this.nodes = new Map()
    this.workflows = new Map()
    this.warnings = []
    this.builtinCount = 0
    let builtinSource = true

    // 1) Builtin definitions shipped with the plugin.
    for (const file of await listJsonFiles(this.builtinNodesDir())) {
      try {
        const raw = await readJsonFile(join(this.builtinNodesDir(), file))
        const def = validateNodeDef(raw, { where: `nodes/${file}`, source: 'builtin' })
        if (this.nodes.has(def.id)) throw new Error(`节点 id 重复：${def.id}`)
        this.nodes.set(def.id, decorateNode(def, 'builtin'))
        this.builtinCount += 1
      } catch (error) {
        this.warnings.push(`内置节点 ${file} 无效：${messageOf(error)}`)
      }
    }
    for (const file of await listJsonFiles(this.builtinWorkflowsDir())) {
      try {
        const raw = await readJsonFile(join(this.builtinWorkflowsDir(), file))
        const workflow = validateWorkflowShape(raw, { where: `workflows/${file}` })
        this.workflows.set(workflow.id, { ...workflow, source: 'builtin' })
      } catch (error) {
        this.warnings.push(`内置工作流 ${file} 无效：${messageOf(error)}`)
      }
    }

    // 2) Repository cache (overrides same-id builtin entries; records `source`).
    const cacheNodesDir = join(this.cacheDir, 'nodes')
    const cacheWorkflowsDir = join(this.cacheDir, 'workflows')
    for (const file of await listJsonFiles(cacheNodesDir)) {
      try {
        const raw = await readJsonFile(join(cacheNodesDir, file))
        const def = validateNodeDef(raw, { where: `node-repo/nodes/${file}`, source: 'repo' })
        this.nodes.set(def.id, decorateNode(def, 'repo'))
        builtinSource = false
      } catch (error) {
        this.warnings.push(`仓库节点 ${file} 无效：${messageOf(error)}`)
      }
    }
    for (const file of await listJsonFiles(cacheWorkflowsDir)) {
      try {
        const raw = await readJsonFile(join(cacheWorkflowsDir, file))
        const workflow = validateWorkflowShape(raw, { where: `node-repo/workflows/${file}` })
        this.workflows.set(workflow.id, { ...workflow, source: 'repo' })
      } catch (error) {
        this.warnings.push(`仓库工作流 ${file} 无效：${messageOf(error)}`)
      }
    }

    // 3) Imported custom nodes.
    for (const file of await listJsonFiles(this.customDir)) {
      try {
        const raw = await readJsonFile(join(this.customDir, file))
        const def = validateNodeDef(raw, { where: `node-custom/${file}`, source: 'imported' })
        this.nodes.set(def.id, decorateNode(def, 'imported'))
      } catch (error) {
        this.warnings.push(`自定义节点 ${file} 无效：${messageOf(error)}`)
      }
    }

    try {
      this.manifest = JSON.parse(await readFile(join(this.cacheDir, 'manifest.json'), 'utf8'))
    } catch {
      this.manifest = undefined
    }
    this.syncedAt = this.manifest?.syncedAt ?? ''
    this.source = builtinSource ? 'builtin' : this.manifest?.source ?? 'repo'
    return {
      nodes: this.nodesList(),
      workflows: this.workflowsList(),
      builtinCount: this.builtinCount,
      source: this.source,
      syncedAt: this.syncedAt,
      warnings: [...this.warnings],
    }
  }

  /** Node definitions sorted by order, then name. */
  nodesList() {
    return [...this.nodes.values()].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.nameZh ?? a.name).localeCompare(String(b.nameZh ?? b.name), 'zh'),
    )
  }

  /** Workflow definitions sorted by name. */
  workflowsList() {
    return [...this.workflows.values()].sort((a, b) => String(a.name ?? a.id).localeCompare(String(b.name ?? b.id), 'zh'))
  }

  /** One node definition or undefined. */
  nodeById(id) {
    return this.nodes.get(String(id ?? ''))
  }

  /** All workflows in one id→workflow object (for validation). */
  workflowById(id) {
    return this.workflows.get(String(id ?? ''))
  }

  /** Persist and register one imported custom node. */
  async saveCustom(def, { allowHttp = false } = {}) {
    if (def.executor?.kind === 'http' && !allowHttp) {
      throw new Error('导入 http 自定义节点需要先打开「专业模式」')
    }
    if (!allowHttp && def.executor?.kind === 'http') throw new Error('自定义节点需要专业模式')
    await mkdir(this.customDir, { recursive: true })
    const file = join(this.customDir, `${def.id}.json`)
    await writeFile(file, JSON.stringify(def, null, 2), { mode: 0o600 })
    const decorated = decorateNode({ ...def, source: 'imported' }, 'imported')
    this.nodes.set(def.id, decorated)
    return decorated
  }

  /** Remove one imported custom node; builtin/repo nodes are off limits. */
  async removeCustom(id) {
    const nodeId = String(id ?? '').trim()
    const existing = this.nodes.get(nodeId)
    if (!existing) throw new Error(`节点不存在：${nodeId || '(空)'}`)
    if (existing.source === 'builtin') throw new Error(`内置节点不可删除：${nodeId}`)
    if (existing.source === 'repo') throw new Error(`节点仓库同步的节点不可删除：${nodeId}（删除请从 DSH_VCG_repo 移除）`)
    await rm(join(this.customDir, `${nodeId}.json`), { force: true })
    this.nodes.delete(nodeId)
    return true
  }

  /**
   * Sync the node repository from one raw base URL.
   * Fetches manifest.json, then nodes/*.json and workflows/*.json.
   * Writes a cache; returns validated definitions and readable warnings.
   */
  async sync({ base, source = 'github', signal, timeoutMs = 15000 } = {}) {
    const root = String(base ?? '').trim()
    if (root === '') throw new Error('未配置节点仓库地址：请到「设置 → VCG 视觉控制生成器」填写 GitHub/Gitea 节点仓库地址')
    const warnings = []
    let manifest
    try {
      manifest = await fetchJson(joinUrl(root, 'manifest.json'), { timeoutMs, signal })
    } catch (error) {
      throw new Error(`拉取节点仓库 manifest 失败（${root}）：${messageOf(error)}`)
    }
    const nodeIds = Array.isArray(manifest?.nodes) ? manifest.nodes.filter((id) => typeof id === 'string') : []
    const workflowIds = Array.isArray(manifest?.workflows) ? manifest.workflows.filter((id) => typeof id === 'string') : []
    if (nodeIds.length === 0 && workflowIds.length === 0) {
      throw new Error('节点仓库 manifest.json 未声明任何 nodes / workflows')
    }

    const fetchedNodes = []
    for (const id of nodeIds) {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
        warnings.push(`忽略非法节点 id：${id}`)
        continue
      }
      try {
        const raw = await fetchJson(joinUrl(root, `nodes/${id}.json`), { timeoutMs, signal })
        const def = validateNodeDef(raw, { where: `仓库节点 ${id}`, source: 'repo' })
        if (def.id !== id) warnings.push(`仓库节点 ${id}.json 的 id 为 ${def.id}，已按文件内容登记`)
        fetchedNodes.push({ id: def.id, raw, def })
      } catch (error) {
        warnings.push(`节点 ${id} 同步失败：${messageOf(error)}`)
      }
    }
    const fetchedWorkflows = []
    for (const id of workflowIds) {
      if (!/^[\w.-]+$/.test(id)) {
        warnings.push(`忽略非法工作流 id：${id}`)
        continue
      }
      try {
        const raw = await fetchJson(joinUrl(root, `workflows/${id}.json`), { timeoutMs, signal })
        const workflow = validateWorkflowShape(raw, { where: `仓库工作流 ${id}` })
        fetchedWorkflows.push({ id: workflow.id ?? id, raw, workflow })
      } catch (error) {
        warnings.push(`工作流 ${id} 同步失败：${messageOf(error)}`)
      }
    }

    if (fetchedNodes.length === 0 && fetchedWorkflows.length === 0) {
      return {
        nodes: this.nodesList(),
        workflows: this.workflowsList(),
        syncedAt: this.syncedAt,
        source: this.source,
        warnings: [...warnings, '节点仓库同步未取得任何有效定义，已继续使用内置/缓存节点'],
        ok: false,
      }
    }

    // Write cache only after at least one definition validated.
    const cacheNodes = join(this.cacheDir, 'nodes')
    const cacheWorkflows = join(this.cacheDir, 'workflows')
    await mkdir(cacheNodes, { recursive: true })
    await mkdir(cacheWorkflows, { recursive: true })
    await this.replaceDirJson(cacheNodes, fetchedNodes.map((item) => ({ id: item.id, raw: item.raw })))
    await this.replaceDirJson(cacheWorkflows, fetchedWorkflows.map((item) => ({ id: item.id, raw: item.raw })))
    const syncedAt = nowIso()
    const manifestCache = {
      version: manifest?.version ?? 1,
      nodes: fetchedNodes.map((item) => item.id),
      workflows: fetchedWorkflows.map((item) => item.id),
      minPluginVersion: manifest?.minPluginVersion ?? '',
      syncedAt,
      source,
      base: root,
    }
    await writeFile(join(this.cacheDir, 'manifest.json'), JSON.stringify(manifestCache, null, 2), { mode: 0o600 })

    // Reload so the returned lists reflect the merge (builtin + repo + custom).
    const loaded = await this.load()
    return {
      nodes: loaded.nodes,
      workflows: loaded.workflows,
      syncedAt,
      source,
      warnings: [...warnings, ...loaded.warnings],
      ok: true,
      counts: { nodes: loaded.nodes.length, workflows: loaded.workflows.length },
    }
  }

  /** Replace all `.json` files of one cache directory (stale files are removed). */
  async replaceDirJson(dir, items) {
    const keep = new Set(items.map((item) => `${item.id}.json`))
    for (const file of await listJsonFiles(dir)) {
      if (!keep.has(file)) await rm(join(dir, file), { force: true })
    }
    for (const item of items) {
      await writeFile(join(dir, `${item.id}.json`), JSON.stringify(item.raw, null, 2), { mode: 0o600 })
    }
  }
}

/** Validate + normalize a node import request (§3). */
export function prepareImportedNode(input, { proMode = false } = {}) {
  if (proMode !== true) {
    throw new Error('导入自定义节点需要先打开「专业模式」（设置 → VCG 视觉控制生成器 → 专业模式）')
  }
  const def = validateNodeDef(input, { where: '导入节点' })
  if (def.executor.kind !== 'http') throw new Error('导入的自定义节点必须声明 executor.kind="http"')
  const url = def.executor.request?.url ?? ''
  if (!/^https?:\/\//i.test(url)) throw new Error(`导入节点的 request.url 必须是 http(s) 地址：${url || '(空)'}`)
  const apiParam = def.params?.find((param) => param.id === 'api')
  if (!apiParam) {
    throw new Error('导入节点必须在 params 中声明 `api` 字段（API 名称/模型），用于设置中配置凭据')
  }
  return def
}

/** Human-readable summary of a validation failure for sync warnings. */
export function shortError(error) {
  return tail(messageOf(error), 300)
}
