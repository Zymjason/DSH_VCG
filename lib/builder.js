/**
 * AI workflow builder: prompt construction, tolerant JSON extraction, and
 * validation of the model-generated plan into a real §2 workflow.
 *
 * Models frequently use display names / uppercase port labels instead of the
 * definition ids, so the plan validator is deliberately forgiving:
 *   - node `type` resolves case-insensitively and through `name` / `nameZh`;
 *   - edge ports resolve case-insensitively and through port labels;
 *   - remaining required inputs are auto-connected left-to-right when exactly
 *     one compatible output source exists (`text` → `conditioning` allowed);
 *   - the finished workflow is run through `validateWorkflowWithDefs` and any
 *     residual problem becomes a readable note instead of a broken canvas.
 *
 * Pure helpers here are covered by scripts/self-test.mjs.
 */

import { isPlainObject, messageOf, nowIso, truncate } from './util.js'
import { typesCompatible, validateWorkflowWithDefs } from './workflow.js'

/** One-line description of a node definition for the model catalog. */
export function describeNode(def) {
  const portList = (ports, withOptional) =>
    (ports ?? []).length === 0
      ? '(none)'
      : ports
          .map((port) => `${port.id}(${port.type}${withOptional && port.optional ? ',optional' : ''})`)
          .join(', ')
  const params = (def.params ?? [])
    .map((param) => {
      if (param.type === 'select') return `${param.id}(${param.type}: ${param.options.join('|')}=${param.default})`
      if (param.type === 'number') {
        return `${param.id}(${param.type}${param.min !== undefined ? ` ${param.min}~${param.max}` : ''}=${param.default})`
      }
      if (param.type === 'toggle') return `${param.id}(${param.type}=${param.default})`
      return `${param.id}(${param.type})`
    })
    .join(', ')
  return (
    `- ${def.id} — ${def.nameZh || def.name}（engine=${def.engine}）` +
    `\n    inputs: ${portList(def.inputs, true)}` +
    `\n    outputs: ${portList(def.outputs, false)}` +
    `\n    params: ${params || '(none)'}`
  )
}

/** Build the system + user prompt for `buildWorkflow`. */
export function buildWorkflowPrompt({ userPrompt, current, nodeDefs = [] }) {
  const catalog = nodeDefs.map(describeNode).join('\n')
  const system = [
    '你是 VCG 视觉控制生成器（Visual Control Generator）的工作流规划器。',
    '你只输出一个 JSON 对象，不要输出任何解释、Markdown 围栏或多余文字。',
    'JSON 结构固定为：{"reply":"给用户的中文说明","nodes":[{"id":"n1","type":"ksampler","x":80,"y":160,"params":{}}],"edges":[{"from":{"node":"n1","port":"positive"},"to":{"node":"n4","port":"positive"}}]}',
    '规则：',
    '1) nodes[].type 与 edges 里的 port 必须原样使用下面「节点目录」给出的**小写 id**，不要使用显示名、中文名或大写端口标签（例如用 positive 不要用 POSITIVE，用 checkpoint-loader 不要用 "Checkpoint Loader"）。',
    '2) nodes[].id 用 n1、n2… 自增；edges 的 from.node / to.node 引用这些 id。',
    '3) 必须为每个「非 optional 输入端口」提供一条入边；标了 optional 的输入可以不连线。',
    '4) 端口类型必须一致或任一端为 any；text 可以连接到 conditioning（提示词文本直连采样器，等价于已编码）。',
    '5) params 只需写与默认值不同的值；select 只能取列出的选项。',
    '6) 输出类节点（image-output / video-output）没有输出端口，它们是终点；note 节点不参与运算。',
    '7) 典型文生图：prompt-input.positive→ksampler.positive、prompt-input.negative→ksampler.negative、model-loader.model→ksampler.model、empty-latent-image.latent→ksampler.latent、ksampler.image→vae-decode.image、vae-decode.image→image-output.image。',
    '8) 节点目录（type — 名称 / inputs / outputs / params；端口括号内是类型，optional 表示可不连）：',
    catalog,
  ].join('\n')

  const currentText =
    current && Array.isArray(current.nodes) && current.nodes.length > 0
      ? `\n当前画布已有工作流（可在此基础上修改，也可整体重建）：\n${JSON.stringify({ nodes: current.nodes, edges: current.edges }, null, 0).slice(0, 6000)}`
      : ''
  const user =
    `用户需求：${truncate(String(userPrompt ?? '').trim(), 4000)}\n` +
    '注意：所有 type 与 port 必须使用节点目录中的小写 id。\n' +
    `${currentText}\n请只输出 JSON。`
  return { system, user }
}

/** Remove trailing commas before } or ] (common model JSON typo). */
export function stripTrailingCommas(text) {
  return String(text ?? '').replace(/,\s*([}\]])/g, '$1')
}

/** Find the first balanced `{ ... }` slice in a text. */
function firstBalancedObject(text) {
  const source = String(text ?? '')
  const start = source.indexOf('{')
  if (start < 0) return ''
  let depth = 0
  let inString = false
  let quote = ''
  let escaped = false
  for (let i = start; i < source.length; i += 1) {
    const char = source[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) inString = false
      continue
    }
    if (char === '"' || char === "'") {
      inString = true
      quote = char
      continue
    }
    if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  return ''
}

/**
 * Extract one JSON object from a model reply, tolerating ```json fences and
 * surrounding prose. Throws a readable Chinese error when nothing parses.
 */
export function extractJsonObject(text) {
  const raw = String(text ?? '').trim()
  if (raw === '') throw new Error('模型没有返回任何内容，无法自动组建工作流')
  const candidates = [raw]
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)
  if (fence) candidates.push(fence[1].trim())
  const balanced = firstBalancedObject(raw)
  if (balanced !== '') candidates.push(balanced)
  for (const candidate of candidates) {
    for (const attempt of [candidate, stripTrailingCommas(candidate)]) {
      try {
        const parsed = JSON.parse(attempt)
        if (isPlainObject(parsed)) return parsed
        if (Array.isArray(parsed)) return { nodes: parsed }
      } catch {
        /* try the next candidate */
      }
    }
  }
  throw new Error(`模型返回的内容不是有效 JSON，无法自动组建工作流（返回片段：${truncate(raw, 300)}）`)
}

/** Normalize one identifier token for alias matching. */
function normalizeToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Build one resolver from node definitions that matches:
 * exact id → case-insensitive id → `name` / `nameZh` → normalized alias.
 */
export function buildTypeResolver(defsById) {
  const defs = defsById instanceof Map ? defsById : new Map(Object.entries(defsById ?? {}))
  const byId = new Map()
  const byName = new Map()
  for (const def of defs.values()) {
    byId.set(String(def.id).toLowerCase(), def)
    byId.set(normalizeToken(def.id), def)
    for (const alias of [def.name, def.nameZh, def.id]) {
      if (typeof alias !== 'string' || alias.trim() === '') continue
      byName.set(alias.trim().toLowerCase(), def)
      byName.set(normalizeToken(alias), def)
    }
  }
  return (raw) => {
    const value = String(raw ?? '').trim()
    if (value === '') return undefined
    const lower = value.toLowerCase()
    return byId.get(lower) ?? byName.get(lower) ?? byId.get(normalizeToken(lower)) ?? byName.get(normalizeToken(lower))
  }
}

/**
 * Resolve one edge port against a node definition.
 * Accepts the exact id, case-insensitive id, port label, or a unique port type.
 */
export function resolvePortId(def, direction, rawPort) {
  const value = String(rawPort ?? '')
    .trim()
    .replace(/\(.*$/, '')
    .trim()
  if (value === '') return undefined
  const ports = direction === 'out' ? def?.outputs ?? [] : def?.inputs ?? []
  const lower = value.toLowerCase()
  const compact = lower.replace(/[_-]/g, '')
  const found =
    ports.find((port) => port.id === value) ??
    ports.find((port) => String(port.id).toLowerCase() === lower) ??
    ports.find((port) => String(port.label ?? '').trim().toLowerCase() === lower) ??
    ports.find((port) => String(port.id).toLowerCase().replace(/[_-]/g, '') === compact)
  if (found) return found.id
  const byType = ports.filter((port) => String(port.type).toLowerCase() === lower)
  return byType.length === 1 ? byType[0].id : undefined
}

/** Coerce one model-generated param value against its definition. */
function coerceParam(param, value) {
  if (param.type === 'number') {
    const n = Number(value)
    if (!Number.isFinite(n)) return { ok: false }
    let next = n
    if (typeof param.min === 'number') next = Math.max(param.min, next)
    if (typeof param.max === 'number') next = Math.min(param.max, next)
    return { ok: true, value: next }
  }
  if (param.type === 'select') {
    const text = String(value)
    if (Array.isArray(param.options) && !param.options.includes(text)) return { ok: false }
    return { ok: true, value: text }
  }
  if (param.type === 'toggle') {
    if (value === true || value === 'true' || value === 1) return { ok: true, value: true }
    if (value === false || value === 'false' || value === 0) return { ok: true, value: false }
    return { ok: false }
  }
  if (typeof value === 'string') return { ok: true, value }
  if (typeof value === 'number' || typeof value === 'boolean') return { ok: true, value: String(value) }
  return { ok: false }
}

/** One-line port label with its type, for readable notes. */
function portLabelOf(def, direction, portId) {
  const ports = direction === 'out' ? def?.outputs ?? [] : def?.inputs ?? []
  const port = ports.find((item) => item.id === portId)
  return port ? `${port.label}(${port.type})` : portId
}

/**
 * Auto-connect still-dangling required inputs, left-to-right by canvas x.
 * Score order: same port id → exact type → nearest left node.
 */
function autoConnect(nodes, edges, defsByNodeId, notes) {
  const ordered = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y)
  const position = new Map(ordered.map((node, index) => [node.id, index]))
  const connected = new Set(edges.map((edge) => `${edge.to.node}:${edge.to.port}`))
  for (const node of ordered) {
    const def = defsByNodeId.get(node.id)
    if (!def) continue
    for (const port of def.inputs ?? []) {
      if (port.optional === true) continue
      const key = `${node.id}:${port.id}`
      if (connected.has(key)) continue
      const candidates = []
      for (const source of ordered) {
        const sourcePos = position.get(source.id)
        const targetPos = position.get(node.id)
        if (sourcePos === undefined || targetPos === undefined || sourcePos >= targetPos) continue
        const sourceDef = defsByNodeId.get(source.id)
        for (const outPort of sourceDef?.outputs ?? []) {
          if (!typesCompatible(outPort.type, port.type)) continue
          candidates.push({
            source,
            outPort,
            sameId: String(outPort.id).toLowerCase() === String(port.id).toLowerCase() ? 0 : 1,
            exactType: outPort.type === port.type ? 0 : 1,
            distance: targetPos - sourcePos,
          })
        }
      }
      if (candidates.length === 0) continue
      candidates.sort(
        (a, b) => a.sameId - b.sameId || a.exactType - b.exactType || a.distance - b.distance,
      )
      const chosen = candidates[0]
      edges.push({
        id: `e${edges.length + 1}`,
        from: { node: chosen.source.id, port: chosen.outPort.id },
        to: { node: node.id, port: port.id },
      })
      connected.add(key)
      notes.push(
        `已自动连线 ${chosen.source.id}.${chosen.outPort.id}（${portLabelOf(defsByNodeId.get(chosen.source.id), 'out', chosen.outPort.id)}）` +
          ` → ${node.id}.${port.id}（${port.label}）`,
      )
    }
  }
}

/**
 * Validate a model-generated plan and turn it into a workflow object.
 *
 * Invalid nodes/params/edges are dropped (never throw for them) and recorded in
 * `notes`; dangling required inputs are auto-connected where possible, then the
 * result is checked with `validateWorkflowWithDefs`. Residual problems become
 * notes, so callers always receive a canvas the user can finish by hand.
 *
 * @param {object} plan parsed model JSON
 * @param {Map<string,object>} defsById node definitions
 * @param {{name?:string, prompt?:string}} [options]
 * @returns {{workflow:object, reply:string, notes:string[], dropped:number}}
 */
export function validateGeneratedPlan(plan, defsById, options = {}) {
  const defs = defsById instanceof Map ? defsById : new Map(Object.entries(defsById ?? {}))
  const resolveType = buildTypeResolver(defs)
  const notes = []
  const rawNodes = Array.isArray(plan?.nodes) ? plan.nodes : []
  const rawEdges = Array.isArray(plan?.edges) ? plan.edges : []
  if (rawNodes.length === 0) throw new Error('模型没有给出任何节点，无法自动组建工作流')

  const entries = []
  const rawIdToFinal = new Map()
  let dropped = 0
  for (let index = 0; index < rawNodes.length; index += 1) {
    const raw = rawNodes[index]
    if (!isPlainObject(raw)) {
      notes.push(`已忽略第 ${index + 1} 个无效节点`)
      dropped += 1
      continue
    }
    const def = resolveType(raw.type)
    if (!def) {
      notes.push(`已忽略未知节点类型「${String(raw.type ?? '').trim() || '(空)'}」`)
      dropped += 1
      continue
    }
    const rawId = typeof raw.id === 'string' && raw.id.trim() !== '' ? raw.id.trim() : `n${index + 1}`
    const id = `n${entries.length + 1}`
    if (rawIdToFinal.has(rawId)) notes.push(`模型返回了重复节点 id「${rawId}」，后续节点已重新编号`)
    rawIdToFinal.set(rawId, id)
    const params = {}
    if (isPlainObject(raw.params)) {
      for (const [key, value] of Object.entries(raw.params)) {
        const param = def.params.find((item) => item.id === key)
        if (!param) {
          notes.push(`节点 ${id}（${def.nameZh || def.name}）忽略了未知参数 ${key}`)
          continue
        }
        const coerced = coerceParam(param, value)
        if (!coerced.ok) {
          notes.push(`节点 ${id}（${def.nameZh || def.name}）的参数 ${key} 取值非法，已使用默认值`)
          continue
        }
        params[key] = coerced.value
      }
    }
    const x = Number.isFinite(Number(raw.x)) ? Number(raw.x) : 80 + (entries.length % 4) * 320
    const y = Number.isFinite(Number(raw.y)) ? Number(raw.y) : 160 + Math.floor(entries.length / 4) * 260
    entries.push({ rawId, node: { id, type: def.id, x, y, params }, def })
  }
  if (entries.length === 0) throw new Error('模型给出的节点全部无效，无法自动组建工作流')

  const nodes = entries.map((entry) => entry.node)
  const defsByNodeId = new Map(entries.map((entry) => [entry.node.id, entry.def]))

  /** Resolve one edge endpoint reference (raw id / index / type / name). */
  const resolveNodeRef = (raw) => {
    const value = String(raw ?? '').trim()
    if (value === '') return undefined
    if (rawIdToFinal.has(value)) return rawIdToFinal.get(value)
    const lower = value.toLowerCase()
    for (const [rawId, finalId] of rawIdToFinal) {
      if (rawId.toLowerCase() === lower) return finalId
    }
    const indexMatch = /^n?(\d+)$/i.exec(value)
    if (indexMatch) {
      const entry = entries[Number(indexMatch[1]) - 1]
      if (entry) return entry.node.id
    }
    const def = resolveType(value)
    if (def) {
      const matches = entries.filter((entry) => entry.node.type === def.id)
      if (matches.length === 1) return matches[0].node.id
    }
    const nameMatches = entries.filter(
      (entry) =>
        lower === String(entry.def.name ?? '').toLowerCase() || lower === String(entry.def.nameZh ?? '').toLowerCase(),
    )
    return nameMatches.length === 1 ? nameMatches[0].node.id : undefined
  }

  const edges = []
  const targetUsed = new Set()
  for (const raw of rawEdges) {
    if (!isPlainObject(raw)) continue
    const fromId = resolveNodeRef(raw.from?.node)
    const toId = resolveNodeRef(raw.to?.node)
    if (!fromId || !toId) {
      notes.push(`已忽略引用未知节点的连线 ${String(raw.from?.node ?? '?')}→${String(raw.to?.node ?? '?')}`)
      continue
    }
    const fromDef = defsByNodeId.get(fromId)
    const toDef = defsByNodeId.get(toId)
    const fromPortId = resolvePortId(fromDef, 'out', raw.from?.port)
    const toPortId = resolvePortId(toDef, 'in', raw.to?.port)
    if (!fromPortId || !toPortId) {
      notes.push(
        `已忽略端口不存在的连线 ${fromId}.${String(raw.from?.port ?? '?')}→${toId}.${String(raw.to?.port ?? '?')}`,
      )
      continue
    }
    const fromPort = fromDef.outputs.find((port) => port.id === fromPortId)
    const toPort = toDef.inputs.find((port) => port.id === toPortId)
    if (!typesCompatible(fromPort.type, toPort.type)) {
      notes.push(
        `已忽略类型不兼容的连线 ${fromDef.nameZh || fromDef.name}.${fromPort.label}→${toDef.nameZh || toDef.name}.${toPort.label}`,
      )
      continue
    }
    const key = `${toId}:${toPortId}`
    if (targetUsed.has(key)) {
      notes.push(`节点 ${toId} 的输入 ${toPortId} 已有连线，重复连线已忽略`)
      continue
    }
    targetUsed.add(key)
    edges.push({
      id: `e${edges.length + 1}`,
      from: { node: fromId, port: fromPortId },
      to: { node: toId, port: toPortId },
    })
  }

  // Fill remaining required inputs with deterministic left-to-right links.
  autoConnect(nodes, edges, defsByNodeId, notes)
  for (let index = 0; index < edges.length; index += 1) edges[index].id = `e${index + 1}`

  // Report inputs that could not be auto-connected.
  const wired = new Set(edges.map((edge) => `${edge.to.node}:${edge.to.port}`))
  for (const node of nodes) {
    const def = defsByNodeId.get(node.id)
    for (const port of def.inputs ?? []) {
      if (port.optional === true) continue
      if (!wired.has(`${node.id}:${port.id}`)) {
        notes.push(
          `节点 ${node.id}（${def.nameZh || def.name}）的输入端口 ${port.label}(${port.type}) 还没有连线，请在画布中补上后再运行`,
        )
      }
    }
  }

  const now = nowIso()
  const name =
    typeof options.name === 'string' && options.name.trim() !== ''
      ? options.name.trim()
      : `AI 工作流 · ${truncate(String(options.prompt ?? '').trim() || '未命名', 20)}`
  const workflow = {
    version: 1,
    id: `wf-ai-${Date.now().toString(36)}`,
    name,
    description: truncate(String(plan?.reply ?? '').trim(), 400),
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, scale: 0.9 },
    nodes,
    edges,
  }

  // Final safety net: never hand back a workflow that cannot be executed when a
  // deterministic repair is still possible. Residual problems become notes.
  try {
    validateWorkflowWithDefs(workflow, defs, { where: 'AI 自动组建' })
  } catch (error) {
    notes.push(`自动组建的工作流还有问题：${messageOf(error)}。建议在画布中手动调整连线后再运行。`)
  }

  return { workflow, reply: typeof plan?.reply === 'string' ? plan.reply.trim() : '', notes, dropped }
}

/**
 * Consume one `ctx.llm.stream` async iterable into text.
 * Returns the accumulated text; throws only when the stream reports a hard
 * failure and produced no text.
 */
export async function collectStreamText(stream) {
  let text = ''
  let failure = ''
  try {
    for await (const chunk of stream) {
      if (!chunk || typeof chunk !== 'object') continue
      if (chunk.type === 'text-delta') {
        if (typeof chunk.text === 'string') text += chunk.text
      } else if (chunk.type === 'block-end' && chunk.block?.type === 'text' && text === '') {
        if (typeof chunk.block.text === 'string') text += chunk.block.text
      } else if (chunk.type === 'finish') {
        const reason = chunk.reason
        if (reason?.kind === 'error' || reason?.kind === 'aborted') {
          failure = reason.failure?.message || (reason.kind === 'aborted' ? '模型调用已取消' : '模型调用失败')
        }
      }
    }
  } catch (error) {
    if (text.trim() === '') throw new Error(`调用模型失败：${error instanceof Error ? error.message : String(error)}`)
  }
  if (text.trim() === '' && failure !== '') throw new Error(failure)
  return { text, failure }
}
