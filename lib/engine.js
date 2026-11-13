/**
 * VCG execution engine.
 *
 * Cloud mode: topologically walks the workflow and runs the builtin executors
 * (§4) plus declarative `http` custom nodes (§3). Local mode: translates the
 * whole workflow into a ComfyUI API prompt (lib/comfy.js), submits it, and
 * saves every produced file.
 *
 * The engine receives a `host` object from the plugin entry (index.js) so the
 * BFS-heavy execution code stays free of host-service imports:
 *
 *   host.state                  normalized plugin state
 *   host.nodeMap()              Map<id, def>
 *   host.providerById(id)       provider record or undefined
 *   host.resolveModel(name)     {providerId, model, clip, vae}
 *   host.generateImage(args)    {images:[{url}], usage, providerId, model}
 *   host.generateVideo(args)    {videos:[{url}], usage, providerId, model}
 *   host.generateText(args)     {text, provider, model}
 *   host.resolveBaseDir(args)   absolute directory
 *   host.recordOutput(entry)    append one state.outputs record
 *   host.persist()              flush state
 *   host.outputDirName()        configured relative output dir
 */

import { access, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fetchBytes, requestJson } from './http.js'
import {
  MIME_EXT,
  defaultExt,
  extFromUrl,
  mimeForPath,
  outputFileName,
  safeResolveOutputPath,
} from './paths.js'
import { isPlainObject, messageOf, nowIso, textOf, uid } from './util.js'
import { edgeIntoNode, topoSort, upstreamOf } from './graph.js'
import { nodeParams, resolveParam, typesCompatible, validateWorkflowWithDefs } from './workflow.js'
import { buildComfyPrompt, hasComfyMapping, runComfyWorkflow } from './comfy.js'
import { normalizeSize } from './cloud.js'
import { normalizeOutputDir } from './state.js'

/** Safe extension whitelist for generated files. */
const SAFE_EXT = /^(png|jpg|jpeg|webp|gif|avif|mp4|webm|mov|json|txt)$/

/** Read the prompt text out of a conditioning/text value. */
export function textValue(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = textValue(item)
      if (text !== '') return text
    }
    return ''
  }
  if (value && typeof value === 'object') {
    for (const key of ['text', 'positive', 'prompt', 'value', 'conditioning', 'url']) {
      const text = textValue(value[key])
      if (text !== '') return text
    }
  }
  return ''
}

/** First image descriptor ({url, path}) of an arbitrary port value. */
export function firstImageValue(value) {
  if (!value) return undefined
  if (typeof value === 'string') return { url: value }
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = firstImageValue(item)
      if (image) return image
    }
    return undefined
  }
  if (typeof value === 'object') {
    if (typeof value.url === 'string' && value.url !== '') return { url: value.url, ...(value.path ? { path: value.path } : {}) }
    if (Array.isArray(value.images)) return firstImageValue(value.images)
    if (typeof value.image === 'string') return { url: value.image }
  }
  return undefined
}

/** First video descriptor ({url, path}) of an arbitrary port value. */
export function firstVideoValue(value) {
  if (!value) return undefined
  if (typeof value === 'string') return /^https?:\/\//i.test(value) ? { url: value } : undefined
  if (Array.isArray(value)) {
    for (const item of value) {
      const video = firstVideoValue(item)
      if (video) return video
    }
    return undefined
  }
  if (typeof value === 'object') {
    if (typeof value.url === 'string' && value.url !== '') return { url: value.url, ...(value.path ? { path: value.path } : {}) }
    if (Array.isArray(value.videos)) return firstVideoValue(value.videos)
  }
  return undefined
}

/** Normalize an arbitrary JSONPath result into an array of media URL strings. */
export function urlListOf(value) {
  if (typeof value === 'string') return value.trim() === '' ? [] : [value.trim()]
  if (Array.isArray(value)) {
    const out = []
    for (const item of value) out.push(...urlListOf(item))
    return out
  }
  if (isPlainObject(value)) {
    for (const key of ['url', 'image', 'video_url', 'b64_json']) {
      if (typeof value[key] === 'string' && value[key] !== '') {
        return key === 'b64_json' ? [`data:image/png;base64,${value[key]}`] : [value[key]]
      }
    }
  }
  return []
}

/**
 * Evaluate a minimal JSONPath expression against a JSON value.
 * Supports `$.a.b`, `$.a[0].b`, `$.a[*].b` and the bare `$`.
 */
export function queryPath(json, expr) {
  const path = String(expr ?? '').trim()
  if (path === '' || path === '$') return json
  const source = path.replace(/^\$/, '').replace(/^\./, '')
  const tokens = []
  let i = 0
  while (i < source.length) {
    const char = source[i]
    if (char === '.') {
      i += 1
      continue
    }
    if (char === '[') {
      const end = source.indexOf(']', i)
      if (end < 0) return undefined
      const inner = source.slice(i + 1, end).trim()
      tokens.push(inner === '*' ? { wildcard: true } : { index: Number(inner) })
      i = end + 1
      continue
    }
    let j = i
    while (j < source.length && source[j] !== '.' && source[j] !== '[') j += 1
    tokens.push({ key: source.slice(i, j) })
    i = j
  }
  const walk = (value, remaining) => {
    if (remaining.length === 0) return value
    const [token, ...rest] = remaining
    if (value === undefined || value === null) return undefined
    if (token.wildcard) {
      const list = Array.isArray(value) ? value : isPlainObject(value) ? Object.values(value) : []
      const out = []
      for (const item of list) {
        const result = walk(item, rest)
        if (Array.isArray(result)) out.push(...result)
        else if (result !== undefined) out.push(result)
      }
      return out
    }
    if (typeof token.index === 'number') {
      if (!Array.isArray(value)) return undefined
      return walk(value[token.index], rest)
    }
    if (!isPlainObject(value)) return undefined
    return walk(value[token.key], rest)
  }
  return walk(json, tokens)
}

/** Convert a port value into a template substitution string. */
function templateValue(value) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  const image = firstImageValue(value)
  if (image?.url) return image.url
  const video = firstVideoValue(value)
  if (video?.url) return video.url
  const model = isPlainObject(value) ? value.model : undefined
  if (typeof model === 'string') return model
  return textOf(value)
}

/** Render one `${...}` template string / nested JSON value for an http node. */
export function renderTemplate(value, scope) {
  if (typeof value === 'string') {
    if (value.includes('${')) {
      return value.replace(/\$\{([^}]+)\}/g, (match, expr) => {
        const key = String(expr).trim()
        if (key.startsWith('inputs.')) return templateValue(scope.inputs?.[key.slice(7)])
        if (key.startsWith('params.')) return templateValue(scope.params?.[key.slice(7)])
        if (key.startsWith('settings.')) return templateValue(scope.settings?.[key.slice(9)])
        return ''
      })
    }
    return value
  }
  if (Array.isArray(value)) return value.map((item) => renderTemplate(item, scope))
  if (isPlainObject(value)) {
    const out = {}
    for (const [key, item] of Object.entries(value)) out[key] = renderTemplate(item, scope)
    return out
  }
  return value
}

/** Serialized prompt of one workflow, used for output provenance. */
function workflowPromptText(workflow, defs) {
  for (const node of workflow.nodes ?? []) {
    const def = defs.get(node.type)
    if (def?.executor?.fn === 'promptInput') {
      const positive = resolveParam(node, def, 'positive')
      if (typeof positive === 'string' && positive !== '') return positive
    }
  }
  for (const node of workflow.nodes ?? []) {
    const def = defs.get(node.type)
    if (def?.executor?.fn === 'clipTextEncode' || def?.executor?.fn === 'textInput') {
      const text = resolveParam(node, def, 'text')
      if (typeof text === 'string' && text !== '') return text
    }
  }
  return ''
}

/** One execution engine bound to a host adapter (the plugin instance). */
export class Engine {
  constructor(host) {
    this.host = host
    this.activeOutputDir = ''
    this.activeProvider = ''
    this.activeModel = ''
    this.activePrompt = ''
    this.currentSignal = undefined
  }

  get log() {
    return this.host.log
  }

  /* -------------------------------------------------------------- workbook */

  /**
   * Run one workflow (or one node's dependency subgraph).
   *
   * §13.1: optional `runId` + `onEvent(event)` report progress to the Host so
   * the UI can poll a live run record. Events are advisory only: failures in a
   * listener never abort the run.
   */
  async run({ key, workflow, sessionId, baseDir, signal, nodeId, runId, onEvent }) {
    const state = this.host.state
    const defs = this.host.nodeMap()
    const resolvedKey = typeof key === 'string' && key.trim() !== '' ? key.trim() : sessionId ? `session:${sessionId}` : ''
    const rawWorkflow = workflow ?? (resolvedKey !== '' ? state.canvases?.[resolvedKey]?.workflow : undefined)
    if (!rawWorkflow) {
      throw new Error('当前没有可运行的工作流：请先在画布中添加节点，或保存工作流后重试')
    }
    const validated = validateWorkflowWithDefs(rawWorkflow, defs, { where: '运行工作流' })
    let { workflow: wf, order } = validated

    this.currentSignal = signal
    const base = this.host.resolveBaseDir({ key: resolvedKey, sessionId, baseDir })
    const outputDir = join(base, normalizeOutputDir(state.outputDir))
    await mkdir(outputDir, { recursive: true })
    this.activeOutputDir = outputDir

    let targetOrder = order
    if (typeof nodeId === 'string' && nodeId !== '') {
      if (!wf.nodes.some((node) => node.id === nodeId)) throw new Error(`工作流中没有节点：${nodeId}`)
      const needed = upstreamOf(wf.edges, nodeId)
      needed.add(nodeId)
      targetOrder = order.filter((id) => needed.has(id))
    }

    const activeRunId = typeof runId === 'string' && runId !== '' ? runId : uid('run')
    const emit = (event) => {
      if (typeof onEvent !== 'function') return
      try {
        onEvent(event)
      } catch {
        /* progress listeners must never break a run */
      }
    }
    // The order actually handed to the executor: a single-node cloud run only
    // walks nodeId + upstream, while local mode translates the whole graph.
    const runOrder = state.local.enabled === true ? order : targetOrder
    emit({ type: 'run-start', runId: activeRunId, order: runOrder.slice() })
    let result
    try {
      result =
        state.local.enabled === true
          ? await this.runLocal({ runId: activeRunId, onEvent: emit, workflow: wf, defs, order, base, outputDir, signal })
          : await this.runCloud({ runId: activeRunId, onEvent: emit, workflow: wf, defs, order: targetOrder, base, outputDir, signal })
    } catch (error) {
      emit({ type: 'run-done', runId: activeRunId, ok: false, error: messageOf(error) })
      throw error
    }
    emit({ type: 'run-done', runId: activeRunId, ok: !result.error, error: result.error || '' })

    await Promise.resolve(this.host.persist?.()).catch(() => {})
    const value = {
      runId: activeRunId,
      results: result.results,
      order: result.order,
      baseDir: base,
      outputDir,
      ...(result.error ? { error: result.error } : {}),
      ...(result.warnings?.length ? { warnings: result.warnings } : {}),
    }
    if (typeof nodeId === 'string' && nodeId !== '') {
      return { ...value, result: result.results[nodeId] ?? { status: 'error', error: '节点未执行', images: [], text: '', ms: 0 } }
    }
    return value
  }

  /* ---------------------------------------------------------------- cloud */

  async runCloud({ runId, onEvent, workflow, defs, order, outputDir }) {
    void outputDir
    const results = {}
    const outputsByNode = new Map()
    const emit = (event) => {
      if (typeof onEvent !== 'function') return
      try {
        onEvent(event)
      } catch {
        /* progress listeners must never break a run */
      }
    }
    let firstError = ''
    for (const nodeId of order) {
      const node = workflow.nodes.find((item) => item.id === nodeId)
      const def = defs.get(node.type)
      const started = Date.now()
      emit({ type: 'node-start', runId, nodeId })
      if (!def) {
        results[nodeId] = { status: 'error', images: [], text: '', video: null, error: `节点类型不存在：${node.type}`, ms: 0 }
        firstError ||= results[nodeId].error
        emit({ type: 'node-error', runId, nodeId, error: results[nodeId].error, ms: 0 })
        continue
      }
      try {
        if (node.engineOverride === 'local') {
          throw new Error('该节点要求本地执行，但当前为云端模式：请到设置中开启本地运算模式')
        }
        if (def.engine === 'local') {
          throw new Error(`节点 ${node.id}（${def.nameZh || def.name}）仅支持本地运算：请开启本地运算模式并配置 ComfyUI`)
        }
        if (def.executor?.kind === 'comfy') {
          throw new Error('该节点仅支持本地 ComfyUI 执行：请在设置中开启本地运算模式')
        }
        if (def.executor?.kind === 'local') {
          throw new Error('该节点声明为本地节点，但当前为云端模式：请开启本地运算模式')
        }
        const inputs = this.collectInputs(node, def, workflow, results, outputsByNode)
        const params = nodeParams(node, def)
        const outcome =
          def.executor?.kind === 'http'
            ? await this.executeHttpNode({ node, def, inputs, params })
            : await this.executeBuiltin({ node, def, inputs, params })
        const images = Array.isArray(outcome.images) ? outcome.images : []
        const text = typeof outcome.text === 'string' ? outcome.text : ''
        const video = outcome.video ?? null
        results[nodeId] = {
          status: 'done',
          images,
          text,
          video,
          error: '',
          ms: Date.now() - started,
        }
        outputsByNode.set(nodeId, outcome.outputs ?? {})
        if (outcome.warnings?.length) this.log?.warn?.(`dsh-vcg: ${outcome.warnings.join('；')}`)
        emit({ type: 'node-done', runId, nodeId, result: results[nodeId] })
      } catch (error) {
        const message = messageOf(error)
        results[nodeId] = { status: 'error', images: [], text: '', video: null, error: message, ms: Date.now() - started }
        if (firstError === '') firstError = message
        this.log?.warn?.(`dsh-vcg: 节点 ${nodeId} 执行失败: ${message}`)
        emit({ type: 'node-error', runId, nodeId, error: message, ms: results[nodeId].ms })
      }
    }
    // Nodes dropped from a single-node run still appear as skipped.
    for (const node of workflow.nodes) {
      if (results[node.id]) continue
      results[node.id] = { status: 'done', images: [], text: '', video: null, error: '', ms: 0, skipped: true }
    }
    return {
      results,
      order,
      ...(firstError !== '' ? { error: firstError } : {}),
      warnings: [],
    }
  }

  /** Resolve every input port of one node from upstream results. */
  collectInputs(node, def, workflow, results, outputsByNode) {
    const inputs = {}
    for (const port of def.inputs ?? []) {
      const edge = edgeIntoNode(workflow.edges, node.id, port.id)
      if (!edge) continue
      const upstream = results[edge.from.node]
      if (!upstream) throw new Error(`上游节点 ${edge.from.node} 尚未执行`)
      if (upstream.status !== 'done') {
        throw new Error(`上游节点 ${edge.from.node} 执行失败，无法取得输入 ${port.label}`)
      }
      const upstreamOutputs = outputsByNode.get(edge.from.node)
      if (!upstreamOutputs || !(edge.from.port in upstreamOutputs)) {
        throw new Error(`上游节点 ${edge.from.node} 没有产出端口 ${edge.from.port}（${port.label}）`)
      }
      inputs[port.id] = upstreamOutputs[edge.from.port]
    }
    return inputs
  }

  /** Dispatch one §4 builtin executor. */
  async executeBuiltin({ node, def, inputs, params }) {
    const fn = def.executor?.fn
    const context = { node, def, inputs, params, engine: this }
    switch (fn) {
      case 'promptInput':
        return this.execPromptInput(context)
      case 'modelLoader':
        return this.execModelLoader(context)
      case 'clipTextEncode':
        return this.execClipTextEncode(context)
      case 'emptyLatent':
        return this.execEmptyLatent(context)
      case 'imageProps':
        return this.execImageProps(context)
      case 'ksampler':
        return this.execKSampler(context)
      case 'vaeDecode':
        return this.execVaeDecode(context)
      case 'imageOutput':
        return this.execImageOutput(context)
      case 'videoSampler':
        return this.execVideoSampler(context)
      case 'videoOutput':
        return this.execVideoOutput(context)
      case 'textInput':
        return this.execTextInput(context)
      case 'textOutput':
        return this.execTextOutput(context)
      case 'note':
        return { outputs: {} }
      default:
        throw new Error(`未知内置执行器：${fn}`)
    }
  }

  /* Builtin executors (§4). Outputs are keyed by the definition's output port id. */

  execPromptInput({ def, params }) {
    const positive = textValue(params.positive)
    const negative = textValue(params.negative)
    const outputs = {}
    for (const port of def.outputs ?? []) {
      if (port.id === 'positive') outputs[port.id] = positive
      else if (port.id === 'negative') outputs[port.id] = negative
      else if (port.type === 'text') outputs[port.id] = positive
      else outputs[port.id] = ''
    }
    return { outputs, text: positive }
  }

  execModelLoader({ def, params }) {
    const requested = textValue(params.model)
    const resolved = this.host.resolveModel(requested)
    const modelValue = {
      providerId: resolved.providerId,
      model: resolved.model,
      clip: resolved.clip ?? `${resolved.model}-clip`,
      vae: resolved.vae ?? `${resolved.model}-vae`,
    }
    this.activeProvider = resolved.providerId
    this.activeModel = resolved.model
    const outputs = {}
    for (const port of def.outputs ?? []) outputs[port.id] = modelValue
    return { outputs, text: resolved.model }
  }

  async execClipTextEncode({ node, def, inputs, params }) {
    let text = textValue(inputs.text) || textValue(params.text)
    if (params.rewrite === true && text !== '') {
      try {
        const rewritten = await this.host.generateText({
          prompt: `请把下面的图像生成提示词润色得更具体、更有画面感，只输出润色后的提示词本身，不要解释、不要引号：\n${text}`,
          maxTokens: 600,
        })
        if (rewritten?.text) text = rewritten.text.trim()
      } catch (error) {
        this.log?.warn?.(`dsh-vcg: CLIP 文本润色失败，使用原始提示词：${messageOf(error)}`)
      }
    }
    const outputs = {}
    for (const port of def.outputs ?? []) {
      if (port.type === 'conditioning' || port.type === 'text' || port.type === 'any') outputs[port.id] = text
      else outputs[port.id] = text
    }
    void node
    return { outputs, text }
  }

  execEmptyLatent({ def, inputs, params }) {
    const width = Number(inputs.width ?? params.width ?? 1280) || 1280
    const height = Number(inputs.height ?? params.height ?? 720) || 720
    const batch = Math.max(1, Math.round(Number(params.batch_size ?? 1) || 1))
    const latent = { width: Math.round(width), height: Math.round(height), batch }
    const outputs = {}
    for (const port of def.outputs ?? []) {
      if (port.type === 'latent') outputs[port.id] = latent
      else if (port.type === 'number') outputs[port.id] = port.id === 'height' ? latent.height : latent.width
      else outputs[port.id] = latent
    }
    return { outputs, text: `${latent.width}×${latent.height}` }
  }

  execImageProps({ def, params }) {
    const width = Number(params.width ?? 1280) || 1280
    const height = Number(params.height ?? 720) || 720
    const outputs = {}
    for (const port of def.outputs ?? []) {
      if (port.id === 'height' || port.type === 'number') outputs[port.id] = port.id === 'height' ? height : width
      else outputs[port.id] = { width, height }
    }
    return { outputs, text: `${width}×${height}` }
  }

  async execKSampler({ node, def, inputs, params, engine }) {
    void engine
    const modelValue = isPlainObject(inputs.model) ? inputs.model : undefined
    const positive = textValue(inputs.positive)
    const negative = textValue(inputs.negative)
    const latent = isPlainObject(inputs.latent) ? inputs.latent : {}
    const width = Math.round(Number(latent.width ?? params.width ?? 1280) || 1280)
    const height = Math.round(Number(latent.height ?? params.height ?? 720) || 720)
    const prompt = positive || textValue(params.prompt)
    if (prompt.trim() === '') throw new Error('采样器没有收到提示词：请把提示词节点的 POSITIVE 输出连接到采样器 positive 输入')
    const size = normalizeSize(`${width}*${height}`)
    const generated = await this.host.generateImage({
      providerId: modelValue?.providerId,
      model: modelValue?.model,
      prompt,
      negative,
      size,
    })
    const images = []
    for (const [index, image] of (generated.images ?? []).entries()) {
      if (!image?.url) continue
      const saved = await this.saveRemoteMedia(image.url, {
        kind: 'image',
        nodeId: node.id,
        providerId: generated.providerId,
        model: generated.model,
        prompt,
      })
      const label = (node.title || def.nameZh || def.name) + (index > 0 ? ` #${index + 1}` : '')
      images.push({ url: image.url, path: saved.path, label })
    }
    if (images.length === 0) throw new Error('生图服务未返回可下载的图片')
    this.activeProvider = generated.providerId ?? this.activeProvider
    this.activeModel = generated.model ?? this.activeModel
    this.activePrompt = prompt
    const outputs = {}
    for (const port of def.outputs ?? []) outputs[port.id] = images[0]
    return { outputs, images, text: prompt }
  }

  async execVaeDecode({ node, def, inputs }) {
    const image = firstImageValue(inputs.image)
    if (!image) throw new Error('VAE 解码没有收到图像：请连接采样器输出')
    let path = image.path
    if (typeof path !== 'string' || path === '') {
      const saved = await this.saveRemoteMedia(image.url, { kind: 'image', nodeId: node.id })
      path = saved.path
    }
    const value = { url: image.url, path }
    const outputs = {}
    for (const port of def.outputs ?? []) outputs[port.id] = value
    return { outputs, images: [{ url: image.url, path, label: def.nameZh || def.name }] }
  }

  async execImageOutput({ node, def, inputs, params }) {
    const image = firstImageValue(inputs.image)
    if (!image) throw new Error('图像输出节点没有收到图像：请连接图像输入')
    let path = image.path
    if (typeof path !== 'string' || path === '') {
      // The downloaded file's own extension wins; the format param only serves as
      // a hint when the URL carries no usable extension (lib/paths.js fallback).
      const saved = await this.saveRemoteMedia(image.url, {
        kind: 'image',
        nodeId: node.id,
        prompt: this.activePrompt,
      })
      path = saved.path
    }
    const value = { url: image.url, path }
    const outputs = {}
    for (const port of def.outputs ?? []) outputs[port.id] = value
    return { outputs, images: [{ url: image.url, path, label: def.nameZh || def.name }] }
  }

  async execVideoSampler({ node, def, inputs, params }) {
    const prompt = textValue(inputs.positive) || textValue(params.prompt)
    if (prompt.trim() === '') throw new Error('视频采样器没有收到提示词：请连接提示词节点')
    const image = firstImageValue(inputs.image)
    const size = normalizeSize(params.size)
    const generated = await this.host.generateVideo({
      prompt,
      image: image?.url,
      size,
      duration: params.duration,
      fps: params.fps,
      seed: params.seed,
    })
    const videos = []
    for (const [index, video] of (generated.videos ?? []).entries()) {
      if (!video?.url) continue
      const saved = await this.saveRemoteMedia(video.url, {
        kind: 'video',
        nodeId: node.id,
        providerId: generated.providerId,
        model: generated.model,
        prompt,
      })
      videos.push({
        url: video.url,
        path: saved.path,
        label: (node.title || def.nameZh || def.name) + (index > 0 ? ` #${index + 1}` : ''),
      })
    }
    if (videos.length === 0) throw new Error('视频服务未返回可下载的视频')
    const outputs = {}
    for (const port of def.outputs ?? []) outputs[port.id] = videos[0]
    return { outputs, videos: undefined, video: videos[0], text: prompt }
  }

  async execVideoOutput({ node, def, inputs }) {
    const video = firstVideoValue(inputs.video)
    if (!video) throw new Error('视频输出节点没有收到视频：请连接视频输入')
    let path = video.path
    if (typeof path !== 'string' || path === '') {
      const saved = await this.saveRemoteMedia(video.url, {
        kind: 'video',
        nodeId: node.id,
        prompt: this.activePrompt,
      })
      path = saved.path
    }
    const value = { url: video.url, path }
    const outputs = {}
    for (const port of def.outputs ?? []) outputs[port.id] = value
    return { outputs, video: { url: video.url, path, label: def.nameZh || def.name } }
  }

  execTextInput({ def, params }) {
    const text = textValue(params.text)
    const outputs = {}
    for (const port of def.outputs ?? []) outputs[port.id] = text
    return { outputs, text }
  }

  execTextOutput({ inputs, params }) {
    const text = textValue(inputs.text) || textValue(params.text) || textValue(params.label)
    return { outputs: {}, text }
  }

  /* ----------------------------------------------------- declarative http */

  async executeHttpNode({ node, def, inputs, params }) {
    const request = def.executor?.request
    if (!request) throw new Error('自定义节点缺少 executor.request')
    let provider
    let apiKey = ''
    try {
      const capability = def.cloud?.capability === 'video' ? 'video' : 'image'
      const resolved = this.host.resolveProviderFor(capability)
      provider = resolved.provider
      apiKey = resolved.apiKey
    } catch {
      /* a custom node may not need credentials at all */
    }
    const scope = {
      inputs,
      params,
      settings: { apiKey, baseUrl: provider?.baseUrl ?? '', providerId: provider?.id ?? '' },
    }
    const url = String(renderTemplate(request.url, scope))
    if (!/^https?:\/\//i.test(url)) throw new Error(`自定义节点请求地址无效：${url}`)
    const headers = {}
    for (const [key, value] of Object.entries(request.headers ?? {})) headers[key] = String(renderTemplate(value, scope))
    let body
    if (request.method !== 'GET' && request.method !== 'DELETE' && request.body !== undefined) {
      body = renderTemplate(request.body, scope)
      if (typeof body !== 'string') body = JSON.stringify(body)
      if (!Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
        headers['Content-Type'] = 'application/json'
      }
    }
    const response = await requestJson(url, {
      method: request.method ?? 'POST',
      headers,
      body,
      timeoutMs: request.timeoutMs ?? 120000,
      signal: this.currentSignal,
      retries: 2,
    })
    const responseSpec = def.executor.response ?? {}
    if (responseSpec.error) {
      const errorValue = queryPath(response.json, responseSpec.error)
      if (typeof errorValue === 'string' && errorValue.trim() !== '') {
        throw new Error(`自定义节点返回错误：${errorValue.trim()}`)
      }
    }
    const mediaValue = responseSpec.images ? queryPath(response.json, responseSpec.images) : response.json
    const urls = urlListOf(mediaValue)
    const text = responseSpec.text ? textValue(queryPath(response.json, responseSpec.text)) : ''
    if (urls.length === 0 && (!responseSpec.images || text === '')) {
      if (responseSpec.images) throw new Error('自定义节点没有返回图片地址（请检查 response.images 的 JSONPath）')
    }
    const images = []
    for (const urlValue of urls) {
      const saved = await this.saveRemoteMedia(urlValue, {
        kind: 'image',
        nodeId: node.id,
        providerId: provider?.id ?? '',
        model: textValue(params.api),
        prompt: textValue(inputs.text),
      })
      images.push({ url: urlValue, path: saved.path, label: def.nameZh || def.name })
    }
    const outputs = {}
    for (const port of def.outputs ?? []) {
      if (port.type === 'image') outputs[port.id] = images[0] ?? null
      else if (port.type === 'video') outputs[port.id] = images[0] ?? null
      else if (port.type === 'text') outputs[port.id] = text
      else outputs[port.id] = images[0] ?? text
    }
    return { outputs, images, text }
  }

  /* ----------------------------------------------------------- local mode */

  async runLocal({ runId, onEvent, workflow, defs, order, outputDir, signal }) {
    const state = this.host.state
    const emit = (event) => {
      if (typeof onEvent !== 'function') return
      try {
        onEvent(event)
      } catch {
        /* progress listeners must never break a run */
      }
    }
    const comfyuiUrl = String(state.local?.comfyuiUrl ?? '').trim()
    if (comfyuiUrl === '') {
      throw new Error('本地运算已开启但未配置 ComfyUI 服务端地址，请到 设置 → VCG 视觉控制生成器 配置')
    }
    // §1/§4: engine="cloud" nodes cannot run locally — fail loudly instead of
    // silently dropping them from the translated ComfyUI prompt.
    const cloudOnly = order
      .map((id) => workflow.nodes.find((node) => node.id === id))
      .filter((node) => defs.get(node.type)?.engine === 'cloud')
      .map((node) => `${node.id}（${defs.get(node.type)?.nameZh || node.type}）`)
    if (cloudOnly.length > 0) {
      throw new Error(
        `本地运算模式下无法执行仅支持云端的节点：${cloudOnly.join('、')}。` +
          '请在节点上切换引擎 / 改用 checkpoint-loader 等本地节点，或到设置中关闭本地运算模式。',
      )
    }
    if (!hasComfyMapping(workflow, defs)) {
      throw new Error('该工作流没有可本地执行的 ComfyUI 节点映射：请使用带 local.comfyui 定义的节点，或关闭本地运算模式')
    }
    // §13.1: the whole graph is submitted as one ComfyUI prompt, so mark every
    // planned node running before submit and emit done per node afterwards.
    const runningNodes = order.slice()
    for (const nodeId of runningNodes) emit({ type: 'node-start', runId, nodeId })
    try {
      const local = await runComfyWorkflow({
        baseUrl: comfyuiUrl,
        workflow,
        defsById: defs,
        timeoutMs: state.local?.timeoutMs ?? 600000,
        signal: signal ?? this.currentSignal,
        clientId: `dsh-vcg-${runId}`,
      })
      // Download/save every produced file, attributing them to the last node with
      // a matching output type (usually image-output / video-output).
      const target = this.localTargetNode(workflow, defs, order)
      const images = []
      const videos = []
      for (const media of local.media) {
        const kind = media.kind === 'video' ? 'video' : 'image'
        const ext = extFromUrl(media.filename) || MIME_EXT[String(media.contentType ?? '').split(';')[0]] || defaultExt(kind)
        const saved = await this.saveBuffer(media.buffer, {
          kind,
          nodeId: target.nodeId,
          ext,
          prompt: workflowPromptText(workflow, defs),
          providerId: 'comfyui',
          model: 'comfyui',
        })
        const entry = { url: media.url, path: saved.path, label: target.label + (kind === 'video' ? ' 视频' : '') }
        if (kind === 'video') videos.push(entry)
        else images.push(entry)
      }
      const results = {}
      for (const node of workflow.nodes) {
        const isTarget = node.id === target.nodeId
        results[node.id] = {
          status: 'done',
          images: isTarget ? images : [],
          text: '',
          video: isTarget ? videos[0] ?? null : null,
          error: '',
          ms: 0,
        }
      }
      for (const nodeId of runningNodes) {
        if (results[nodeId]) emit({ type: 'node-done', runId, nodeId, result: results[nodeId] })
      }
      if (images.length === 0 && videos.length === 0) {
        const warnings = [...local.warnings, 'ComfyUI 已完成执行但没有返回任何图片/视频文件']
        return { results, order, warnings }
      }
      return { results, order, warnings: local.warnings }
    } catch (error) {
      const message = messageOf(error)
      for (const nodeId of runningNodes) emit({ type: 'node-error', runId, nodeId, error: message, ms: 0 })
      throw error
    }
  }

  /**
   * Choose the node that owns local-mode output media.
   * Prefers the terminal host save nodes (image-output / video-output), which
   * have no output ports; falls back to the last node with an image/video output.
   */
  localTargetNode(workflow, defs, order) {
    const ordered = order.map((id) => workflow.nodes.find((node) => node.id === id)).filter(Boolean)
    for (const node of [...ordered].reverse()) {
      const def = defs.get(node.type)
      const fn = def?.executor?.fn
      if (fn === 'imageOutput' || fn === 'videoOutput') return { nodeId: node.id, label: def.nameZh || def.name }
    }
    for (const node of [...ordered].reverse()) {
      const def = defs.get(node.type)
      const hasImageOut = (def.outputs ?? []).some((port) => port.type === 'image')
      const hasVideoOut = (def.outputs ?? []).some((port) => port.type === 'video')
      if (hasImageOut || hasVideoOut) return { nodeId: node.id, label: def.nameZh || def.name }
    }
    const last = ordered[ordered.length - 1]
    return { nodeId: last?.id ?? '', label: last ? defs.get(last.type)?.nameZh ?? last.type : '本地输出' }
  }

  /* -------------------------------------------------------------- outputs */

  /** Save one downloaded remote URL into the active output directory. */
  async saveRemoteMedia(url, { kind = 'image', nodeId = '', providerId = '', model = '', prompt = '', extHint, signal } = {}) {
    const outputDir = this.requireOutputDir()
    const downloaded = await fetchBytes(url, { signal: signal ?? this.currentSignal })
    const contentType = String(downloaded.contentType ?? '').split(';')[0].trim()
    let ext = extHint || extFromUrl(downloaded.finalUrl) || extFromUrl(url) || MIME_EXT[contentType] || (mimeForPath(url) !== 'application/octet-stream' ? extFromUrl(url) : '')
    if (!ext || !SAFE_EXT.test(ext)) ext = defaultExt(kind)
    return this.writeOutputFile(downloaded.buffer, { kind, nodeId, ext, providerId, model, prompt })
  }

  /** Save one in-memory buffer into the active output directory. */
  async saveBuffer(buffer, { kind = 'image', nodeId = '', ext = 'png', providerId = '', model = '', prompt = '' } = {}) {
    return this.writeOutputFile(buffer, { kind, nodeId, ext: SAFE_EXT.test(ext) ? ext : defaultExt(kind), providerId, model, prompt })
  }

  requireOutputDir() {
    if (this.activeOutputDir === '') throw new Error('输出目录尚未初始化：请通过运行工作流产生输出')
    return this.activeOutputDir
  }

  /** Write one file with a unique `vcg-<ts>-<nodeId>.<ext>` name and record it. */
  async writeOutputFile(buffer, { kind, nodeId, ext, providerId = '', model = '', prompt = '' }) {
    const outputDir = this.requireOutputDir()
    const baseName = outputFileName(nodeId || 'node', ext)
    const filePath = await this.uniquePath(outputDir, baseName)
    await writeFile(filePath, buffer)
    const entry = {
      id: uid('out'),
      ts: nowIso(),
      path: filePath,
      kind: kind === 'video' ? 'video' : 'image',
      providerId: providerId || this.activeProvider || '',
      model: model || this.activeModel || '',
      prompt: String(prompt || this.activePrompt || '').slice(0, 500),
      nodeId: nodeId || '',
    }
    this.host.recordOutput(entry)
    return { path: filePath, bytes: buffer.length, ext }
  }

  /** Return a non-colliding path under `dir` for `name`. */
  async uniquePath(dir, name) {
    const first = safeResolveOutputPath(dir, name)
    let candidate = first
    let suffix = 2
    for (;;) {
      try {
        await access(candidate)
        const dot = name.lastIndexOf('.')
        const stem = dot > 0 ? name.slice(0, dot) : name
        const ext = dot > 0 ? name.slice(dot) : ''
        candidate = safeResolveOutputPath(dir, `${stem}-${suffix}${ext}`)
        suffix += 1
        if (suffix > 999) throw new Error('输出目录中同名文件过多')
      } catch (error) {
        if (error && typeof error === 'object' && error.code === 'ENOENT') return candidate
        throw error
      }
    }
  }
}

/** Exported for self-test: validate one workflow against definitions + cycle check. */
export function validateForRun(workflow, defsById) {
  return validateWorkflowWithDefs(workflow, defsById, { where: '运行工作流' })
}

/** Exported for self-test: translate a workflow into a ComfyUI prompt. */
export { buildComfyPrompt, topoSort, typesCompatible }

/** Resolve one deferred helper reference used by tests. */
export function resolveWorkflowBaseDir(baseDir, outputDir) {
  return join(resolve(baseDir), normalizeOutputDir(outputDir))
}
