/**
 * Local execution mode: translate a VCG workflow into a ComfyUI API prompt
 * (§1 `local.comfyui` mapping), submit it to `/prompt`, poll `/history/<id>`,
 * and download `/view` results.
 *
 * `buildComfyPrompt` is pure and covered by scripts/self-test.mjs.
 */

import { fetchBytes, requestJson, serverMessage } from './http.js'
import { messageOf, sleep } from './util.js'
import { edgeIntoNode } from './graph.js'
import { nodeParams } from './workflow.js'

/** Join a ComfyUI base URL with one API path. */
function comfyUrl(baseUrl, path) {
  const base = String(baseUrl ?? '').trim().replace(/\/+$/, '')
  if (base === '') throw new Error('ComfyUI 服务端地址未配置')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Translate one workflow into a ComfyUI API prompt.
 *
 * Node ids become numeric strings in canvas order (n1 → "1"). A graph input
 * field mapped to `inputs.x` with an incoming edge becomes a link value
 * `["<upstream mapped id>", <output index>]`; `params.x` becomes the effective
 * parameter value; `{ value }` becomes a literal.
 *
 * @param {object} workflow normalized workflow
 * @param {Map<string,object>|Record<string,object>} defsById node definitions
 * @returns {{prompt:Record<string,object>, idMap:Map<string,string>, warnings:string[], mapped:string[]}}
 */
export function buildComfyPrompt(workflow, defsById) {
  const defs = defsById instanceof Map ? defsById : new Map(Object.entries(defsById ?? {}))
  const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes : []
  const edges = Array.isArray(workflow?.edges) ? workflow.edges : []
  const idMap = new Map()
  let counter = 1
  for (const node of nodes) {
    idMap.set(node.id, String(counter))
    counter += 1
  }
  const prompt = {}
  const warnings = []
  const mapped = []
  for (const node of nodes) {
    const def = defs.get(node.type)
    const comfy = def?.local?.comfyui
    if (!comfy || typeof comfy.class_type !== 'string' || comfy.class_type === '') continue
    const params = nodeParams(node, def)
    const inputs = {}
    for (const [field, ref] of Object.entries(comfy.map ?? {})) {
      if (ref && typeof ref === 'object' && 'value' in ref) {
        inputs[field] = ref.value
        continue
      }
      if (typeof ref !== 'string') continue
      if (ref.startsWith('params.')) {
        const paramId = ref.slice('params.'.length)
        const value = params[paramId]
        if (value === undefined) {
          warnings.push(`节点 ${node.id}（${def.nameZh || def.name}）缺少参数 ${paramId}，已跳过 ComfyUI 字段 ${field}`)
          continue
        }
        inputs[field] = value
        continue
      }
      if (ref.startsWith('inputs.')) {
        const portId = ref.slice('inputs.'.length)
        const edge = edgeIntoNode(edges, node.id, portId)
        if (!edge) {
          // §11.1: an unwired input falls back to the node's own param value when
          // one exists (e.g. clip-text-encoder text → params.text).
          const fallback = params[portId]
          if (fallback !== undefined) {
            inputs[field] = fallback
            continue
          }
          const port = def.inputs?.find((item) => item.id === portId)
          if (port?.optional !== true) {
            warnings.push(`节点 ${node.id}（${def.nameZh || def.name}）的输入端口 ${portId} 未连线，ComfyUI 字段 ${field} 缺失`)
          }
          continue
        }
        const upstream = nodes.find((item) => item.id === edge.from.node)
        const upstreamDef = upstream ? defs.get(upstream.type) : undefined
        const outputIndex = upstreamDef?.outputs?.findIndex((port) => port.id === edge.from.port) ?? -1
        if (!upstream || outputIndex < 0) {
          warnings.push(`节点 ${node.id} 的输入 ${portId} 无法解析上游输出 ${edge.from.node}.${edge.from.port}`)
          continue
        }
        inputs[field] = [idMap.get(edge.from.node), outputIndex]
        continue
      }
      // Literal string reference.
      inputs[field] = ref
    }
    prompt[idMap.get(node.id)] = { class_type: comfy.class_type, inputs }
    mapped.push(node.id)
  }
  return { prompt, idMap, warnings, mapped }
}

/** Whether one workflow has at least one ComfyUI-mappable node. */
export function hasComfyMapping(workflow, defsById) {
  const defs = defsById instanceof Map ? defsById : new Map(Object.entries(defsById ?? {}))
  return (workflow?.nodes ?? []).some((node) => Boolean(defs.get(node.type)?.local?.comfyui?.class_type))
}

/** Submit one ComfyUI API prompt and return its prompt id. */
export async function comfySubmit(baseUrl, prompt, { clientId = 'dsh-vcg', signal, timeoutMs = 30000 } = {}) {
  const result = await requestJson(comfyUrl(baseUrl, '/prompt'), {
    method: 'POST',
    body: { prompt, client_id: clientId },
    timeoutMs,
    signal,
    retries: 0,
  })
  const promptId = result.json?.prompt_id ?? result.json?.promptId
  if (typeof promptId !== 'string' || promptId === '') {
    throw new Error(`ComfyUI 未返回 prompt_id：${serverMessage(result.text, result.json) || '响应格式异常'}`)
  }
  if (result.json?.node_errors && Object.keys(result.json.node_errors).length > 0) {
    throw new Error(`ComfyUI 节点校验失败：${JSON.stringify(result.json.node_errors).slice(0, 600)}`)
  }
  return promptId
}

/** Poll `/history/<id>` until the prompt settles or the timeout fires. */
export async function comfyWait(baseUrl, promptId, { timeoutMs = 600000, pollMs = 1500, signal } = {}) {
  const started = Date.now()
  let lastError = ''
  while (Date.now() - started < timeoutMs) {
    if (signal?.aborted) throw new Error('本地运算已取消')
    let history
    try {
      const result = await requestJson(comfyUrl(baseUrl, `/history/${encodeURIComponent(promptId)}`), {
        method: 'GET',
        timeoutMs: 15000,
        signal,
        retries: 0,
      })
      history = result.json
    } catch (error) {
      lastError = messageOf(error)
      await sleep(pollMs)
      continue
    }
    const entry = history && typeof history === 'object' ? history[promptId] ?? Object.values(history)[0] : undefined
    if (entry) {
      const statusStr = entry.status?.status_str ?? entry.status?.status
      if (statusStr === 'error') {
        const messages = Array.isArray(entry.status?.messages) ? entry.status.messages : []
        const detail = messages
          .map((item) => (Array.isArray(item) ? item[1]?.message ?? JSON.stringify(item[1] ?? '') : JSON.stringify(item)))
          .join('；')
        throw new Error(`ComfyUI 执行失败：${detail || serverMessage(JSON.stringify(entry), entry) || '未知错误'}`)
      }
      if (entry.outputs && Object.keys(entry.outputs).length > 0) {
        return { entry, history }
      }
      if (statusStr === 'success' && (!entry.outputs || Object.keys(entry.outputs).length === 0)) {
        return { entry, history }
      }
    }
    await sleep(pollMs)
  }
  throw new Error(
    `本地运算超时（${Math.round(timeoutMs / 1000)} 秒）：ComfyUI 未在限定时间内完成${lastError ? `（最后错误：${lastError}）` : ''}`,
  )
}

/** Collect downloadable media files from one ComfyUI history entry. */
export function collectComfyFiles(entry) {
  const files = []
  const outputs = entry?.outputs && typeof entry.outputs === 'object' ? entry.outputs : {}
  for (const output of Object.values(outputs)) {
    if (!output || typeof output !== 'object') continue
    for (const [arrayKey, kind] of [
      ['images', 'image'],
      ['gifs', 'video'],
      ['videos', 'video'],
    ]) {
      const items = Array.isArray(output[arrayKey]) ? output[arrayKey] : []
      for (const item of items) {
        if (!item || typeof item.filename !== 'string' || item.filename === '') continue
        files.push({
          filename: item.filename,
          subfolder: typeof item.subfolder === 'string' ? item.subfolder : '',
          type: typeof item.type === 'string' ? item.type : 'output',
          kind,
        })
      }
    }
  }
  return files
}

/** Build the `/view` URL of one ComfyUI output file. */
export function comfyViewUrl(baseUrl, file) {
  const base = String(baseUrl ?? '').trim().replace(/\/+$/, '')
  const query = new URLSearchParams({
    filename: String(file.filename ?? ''),
    subfolder: String(file.subfolder ?? ''),
    type: String(file.type ?? 'output'),
  })
  return `${base}/view?${query.toString()}`
}

/** Download one ComfyUI output file into a Buffer. */
export async function comfyDownload(baseUrl, file, { signal, timeoutMs = 180000 } = {}) {
  const url = comfyViewUrl(baseUrl, file)
  const result = await fetchBytes(url, { signal, timeoutMs })
  return { ...result, url }
}

/**
 * Full local run: submit → wait → download every produced file.
 * Returns the downloaded media (buffers) plus warnings for unmapped nodes.
 */
export async function runComfyWorkflow({ baseUrl, workflow, defsById, timeoutMs = 600000, signal, clientId }) {
  const translated = buildComfyPrompt(workflow, defsById)
  if (translated.mapped.length === 0) {
    throw new Error('该工作流没有可本地执行的 ComfyUI 节点映射：请在节点定义中配置 local.comfyui，或关闭本地运算模式')
  }
  const promptId = await comfySubmit(baseUrl, translated.prompt, { clientId, signal })
  const { entry } = await comfyWait(baseUrl, promptId, { timeoutMs, signal })
  const files = collectComfyFiles(entry)
  const media = []
  for (const file of files) {
    try {
      const downloaded = await comfyDownload(baseUrl, file, { signal })
      media.push({ ...file, ...downloaded })
    } catch (error) {
      translated.warnings.push(`下载 ComfyUI 结果 ${file.filename} 失败：${messageOf(error)}`)
    }
  }
  return { promptId, media, warnings: translated.warnings, mapped: translated.mapped, prompt: translated.prompt }
}
