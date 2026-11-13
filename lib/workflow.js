/**
 * Workflow schema (§2) validation, §11.2 port compatibility, and run-time
 * validation against node definitions (§11.1 required/optional inputs).
 *
 * Pure: no filesystem, no host services.
 */

import { topoSort } from './graph.js'
import { isPlainObject, nowIso } from './util.js'

/** Zone limits (CONTRACT §14.1). */
const ZONE_MIN_W = 160
const ZONE_MIN_H = 100
const MAX_ZONES = 100

/** Allowed edge type compatibility (§11.2). */
export function typesCompatible(fromType, toType) {
  const from = typeof fromType === 'string' ? fromType : ''
  const to = typeof toType === 'string' ? toType : ''
  if (from === '' || to === '') return false
  if (from === to) return true
  if (from === 'any' || to === 'any') return true
  if (from === 'text' && to === 'conditioning') return true
  return false
}

/** Human-readable label for one node instance inside an error message. */
export function nodeLabel(node, def) {
  const name = def?.nameZh || def?.name || node?.type || '未知节点'
  return `节点「${node?.id ?? '?'}」（${name}）`
}

/** Create one empty workflow (canvas default). */
export function emptyWorkflow({ name = '未命名工作流', description = '' } = {}) {
  const now = nowIso()
  return {
    version: 1,
    id: `wf-${Date.now().toString(36)}`,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, scale: 1 },
    nodes: [],
    edges: [],
    zones: [],
  }
}

/**
 * Structural workflow validation/normalization (no node definitions needed).
 * Throws readable Chinese errors on malformed shapes.
 */
export function validateWorkflowShape(raw, { where = '工作流' } = {}) {
  if (!isPlainObject(raw)) throw new Error(`${where}：必须是 JSON 对象`)
  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : []
  const rawEdges = Array.isArray(raw.edges) ? raw.edges : []
  const nodes = []
  const nodeIds = new Set()
  for (let index = 0; index < rawNodes.length; index += 1) {
    const item = rawNodes[index]
    if (!isPlainObject(item)) throw new Error(`${where}：nodes[${index}] 必须是对象`)
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    if (id === '') throw new Error(`${where}：nodes[${index}] 缺少 id`)
    if (nodeIds.has(id)) throw new Error(`${where}：节点 id 重复：${id}`)
    nodeIds.add(id)
    const type = typeof item.type === 'string' ? item.type.trim() : ''
    if (type === '') throw new Error(`${where}：${nodeLabel({ id, type: '?' })} 缺少 type`)
    const node = {
      id,
      type,
      x: Number.isFinite(Number(item.x)) ? Number(item.x) : 0,
      y: Number.isFinite(Number(item.y)) ? Number(item.y) : 0,
      params: isPlainObject(item.params) ? { ...item.params } : {},
    }
    if (typeof item.title === 'string' && item.title !== '') node.title = item.title
    if (item.engineOverride === 'cloud' || item.engineOverride === 'local') node.engineOverride = item.engineOverride
    nodes.push(node)
  }

  const edges = []
  const edgeIds = new Set()
  for (let index = 0; index < rawEdges.length; index += 1) {
    const item = rawEdges[index]
    if (!isPlainObject(item)) throw new Error(`${where}：edges[${index}] 必须是对象`)
    const from = isPlainObject(item.from) ? item.from : undefined
    const to = isPlainObject(item.to) ? item.to : undefined
    if (!from || !to) throw new Error(`${where}：edges[${index}] 缺少 from/to`)
    const fromNode = typeof from.node === 'string' ? from.node.trim() : ''
    const fromPort = typeof from.port === 'string' ? from.port.trim() : ''
    const toNode = typeof to.node === 'string' ? to.node.trim() : ''
    const toPort = typeof to.port === 'string' ? to.port.trim() : ''
    if (fromNode === '' || fromPort === '' || toNode === '' || toPort === '') {
      throw new Error(`${where}：edges[${index}] 的 from/to 必须包含 node 与 port`)
    }
    if (!nodeIds.has(fromNode)) throw new Error(`${where}：edges[${index}] 引用了不存在的节点：${fromNode}`)
    if (!nodeIds.has(toNode)) throw new Error(`${where}：edges[${index}] 引用了不存在的节点：${toNode}`)
    let edgeId = typeof item.id === 'string' && item.id.trim() !== '' ? item.id.trim() : `e${index + 1}`
    while (edgeIds.has(edgeId)) edgeId = `${edgeId}_`
    edgeIds.add(edgeId)
    edges.push({
      id: edgeId,
      from: { node: fromNode, port: fromPort },
      to: { node: toNode, port: toPort },
    })
  }

  // Zones (§14.1): visual grouping only — never part of graph validation or execution.
  const zones = []
  const zoneIds = new Set()
  const rawZones = Array.isArray(raw.zones) ? raw.zones : []
  const zoneColors = ['', 'violet', 'blue', 'green', 'amber', 'rose']
  for (let index = 0; index < rawZones.length && zones.length < MAX_ZONES; index += 1) {
    const item = rawZones[index]
    if (!isPlainObject(item)) continue
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    if (id === '' || zoneIds.has(id)) continue
    const x = Number(item.x)
    const y = Number(item.y)
    const w = Number(item.w)
    const h = Number(item.h)
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) continue
    zoneIds.add(id)
    const rawLabel = typeof item.label === 'string' ? item.label.trim() : ''
    const color = typeof item.color === 'string' && zoneColors.indexOf(item.color) >= 0 ? item.color : ''
    zones.push({
      id,
      label: (rawLabel || `分区 ${zones.length + 1}`).slice(0, 80),
      x,
      y,
      w: Math.max(ZONE_MIN_W, w),
      h: Math.max(ZONE_MIN_H, h),
      color,
    })
  }

  const viewport = isPlainObject(raw.viewport) ? raw.viewport : {}
  const now = nowIso()
  return {
    version: Number(raw.version) || 1,
    id: typeof raw.id === 'string' && raw.id !== '' ? raw.id : `wf-${Date.now().toString(36)}`,
    name: typeof raw.name === 'string' && raw.name.trim() !== '' ? raw.name.trim() : '未命名工作流',
    description: typeof raw.description === 'string' ? raw.description : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    viewport: {
      x: Number.isFinite(Number(viewport.x)) ? Number(viewport.x) : 0,
      y: Number.isFinite(Number(viewport.y)) ? Number(viewport.y) : 0,
      scale: Number.isFinite(Number(viewport.scale)) && Number(viewport.scale) > 0 ? Number(viewport.scale) : 1,
    },
    nodes,
    edges,
    zones,
  }
}

/** Find the edge feeding one exact node input port. */
export function inputEdge(edges, nodeId, portId) {
  return edges.find((edge) => edge.to.node === nodeId && edge.to.port === portId)
}

/** Find the edge leaving one exact node output port (first one). */
export function outputEdges(edges, nodeId, portId) {
  return edges.filter((edge) => edge.from.node === nodeId && edge.from.port === portId)
}

/**
 * Validate one workflow against loaded node definitions.
 *
 * Enforces: known node types, known ports, §11.2 type compatibility, one edge
 * per input port, every non-optional input port wired (§11.1), and no cycles.
 *
 * @param {unknown} raw workflow
 * @param {Map<string,object>} defsById node definitions keyed by id
 * @param {{where?:string}} [options]
 * @returns {{workflow:object, notes:string[]}}
 */
export function validateWorkflowWithDefs(raw, defsById, { where = '工作流' } = {}) {
  const workflow = validateWorkflowShape(raw, { where })
  const notes = []
  if (workflow.nodes.length === 0) throw new Error(`${where}：工作流还没有任何节点`)

  const defById = new Map()
  for (const node of workflow.nodes) {
    const def = defsById.get(node.type)
    if (!def) {
      throw new Error(`${where}：${nodeLabel(node)} 的类型「${node.type}」不存在——请先在设置中同步节点仓库`)
    }
    defById.set(node.id, def)
  }

  const targetPorts = new Map()
  for (const edge of workflow.edges) {
    const fromNode = workflow.nodes.find((node) => node.id === edge.from.node)
    const toNode = workflow.nodes.find((node) => node.id === edge.to.node)
    const fromDef = defById.get(edge.from.node)
    const toDef = defById.get(edge.to.node)
    const fromPort = fromDef?.outputs.find((port) => port.id === edge.from.port)
    const toPort = toDef?.inputs.find((port) => port.id === edge.to.port)
    if (!fromPort) {
      throw new Error(`${where}：${nodeLabel(fromNode, fromDef)} 没有输出端口「${edge.from.port}」`)
    }
    if (!toPort) {
      throw new Error(`${where}：${nodeLabel(toNode, toDef)} 没有输入端口「${edge.to.port}」`)
    }
    if (!typesCompatible(fromPort.type, toPort.type)) {
      throw new Error(
        `${where}：${nodeLabel(fromNode, fromDef)} 的 ${fromPort.label}（${fromPort.type}）` +
          ` 不能连接到 ${nodeLabel(toNode, toDef)} 的 ${toPort.label}（${toPort.type}）`,
      )
    }
    const key = `${edge.to.node}:${edge.to.port}`
    if (targetPorts.has(key)) {
      throw new Error(`${where}：${nodeLabel(toNode, toDef)} 的输入端口 ${toPort.label} 只能连接一条连线`)
    }
    targetPorts.set(key, edge)
  }

  for (const node of workflow.nodes) {
    const def = defById.get(node.id)
    for (const port of def.inputs) {
      if (port.optional === true) continue
      if (!targetPorts.has(`${node.id}:${port.id}`)) {
        throw new Error(`${where}：${nodeLabel(node, def)} 的输入端口 ${port.label} 没有连线（该端口不是可选输入）`)
      }
    }
  }

  const sorted = topoSort(workflow.nodes, workflow.edges)
  if (sorted.cyclic) {
    const names = sorted.cycle.map((id) => {
      const node = workflow.nodes.find((item) => item.id === id)
      return nodeLabel(node, defById.get(id))
    })
    throw new Error(`${where}：工作流存在环路（${names.join('、')}），无法执行`)
  }
  if (sorted.order.length !== workflow.nodes.length) {
    throw new Error(`${where}：工作流拓扑排序失败，请检查连线`)
  }
  return { workflow, notes, order: sorted.order }
}

/** Resolve one node param with the definition default as fallback. */
export function resolveParam(node, def, paramId) {
  const param = def?.params?.find((item) => item.id === paramId)
  const raw = node?.params?.[paramId]
  if (raw !== undefined && raw !== null) {
    if (param?.type === 'number') {
      const n = Number(raw)
      if (Number.isFinite(n)) {
        if (typeof param.min === 'number' || typeof param.max === 'number') {
          return Math.min(typeof param.max === 'number' ? param.max : Infinity, Math.max(typeof param.min === 'number' ? param.min : -Infinity, n))
        }
        return n
      }
    }
    if (param?.type === 'toggle') return raw === true || raw === 'true'
    if (param?.type === 'select') {
      const value = String(raw)
      if (!param.options || param.options.includes(value)) return value
      return param.default
    }
    return typeof raw === 'string' ? raw : raw
  }
  return param?.default
}

/** Build the effective param map of one node instance. */
export function nodeParams(node, def) {
  const out = {}
  for (const param of def?.params ?? []) out[param.id] = resolveParam(node, def, param.id)
  // Preserve unknown params supplied by a custom node instance (harmless for builtins).
  for (const [key, value] of Object.entries(node?.params ?? {})) {
    if (!(key in out)) out[key] = value
  }
  return out
}
