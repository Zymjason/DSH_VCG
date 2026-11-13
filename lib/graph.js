/**
 * Workflow graph helpers (pure).
 * 纯函数：拓扑排序 / 环检测 / 邻接查询，可被 self-test 直接 import。
 */

import { isPlainObject } from './util.js'

/** Normalize a node list into a string id list, preserving order. */
export function nodeIdsOf(nodes) {
  const out = []
  for (const node of Array.isArray(nodes) ? nodes : []) {
    const id = typeof node === 'string' ? node : node?.id
    if (typeof id === 'string' && id !== '') out.push(id)
  }
  return out
}

/** Normalized `{ from, to }` node-id pairs of one edge list. */
export function edgePairsOf(edges) {
  const out = []
  for (const edge of Array.isArray(edges) ? edges : []) {
    if (!isPlainObject(edge)) continue
    const from = typeof edge.from === 'string' ? edge.from : edge.from?.node
    const to = typeof edge.to === 'string' ? edge.to : edge.to?.node
    if (typeof from === 'string' && typeof to === 'string' && from !== '' && to !== '') out.push({ from, to })
  }
  return out
}

/**
 * Kahn topological sort over a workflow graph.
 *
 * Edges between unknown nodes are ignored. The result is stable with respect to
 * the input node order (nodes with equal in-degree keep their original order).
 *
 * @param {Array<{id:string}|string>} nodes workflow nodes (or ids)
 * @param {Array<{from:{node:string},to:{node:string}}|{from:string,to:string}>} edges
 * @returns {{order:string[], cycle:string[], cyclic:boolean}}
 */
export function topoSort(nodes, edges) {
  const ids = nodeIdsOf(nodes)
  const index = new Map(ids.map((id, i) => [id, i]))
  const indegree = new Map(ids.map((id) => [id, 0]))
  const children = new Map(ids.map((id) => [id, []]))
  const seen = new Set()
  for (const { from, to } of edgePairsOf(edges)) {
    if (!index.has(from) || !index.has(to) || from === to) continue
    const key = `${from}->${to}`
    if (seen.has(key)) continue
    seen.add(key)
    children.get(from).push(to)
    indegree.set(to, indegree.get(to) + 1)
  }
  const ready = ids.filter((id) => indegree.get(id) === 0)
  const order = []
  while (ready.length > 0) {
    ready.sort((a, b) => index.get(a) - index.get(b))
    const id = ready.shift()
    order.push(id)
    for (const child of children.get(id)) {
      const next = indegree.get(child) - 1
      indegree.set(child, next)
      if (next === 0) ready.push(child)
    }
  }
  const cycle = ids.filter((id) => !order.includes(id))
  return { order, cycle, cyclic: cycle.length > 0 }
}

/** The edge that feeds one exact node input port (last one wins is not allowed; caller validates). */
export function edgeIntoNode(edges, nodeId, portId) {
  for (const edge of Array.isArray(edges) ? edges : []) {
    const to = edge?.to
    if (!isPlainObject(to) || to.node !== nodeId) continue
    if (portId === undefined || to.port === portId) return edge
  }
  return undefined
}

/** All node ids that must run before `targetId` (transitive predecessors, excluding target). */
export function upstreamOf(edges, targetId) {
  const pairs = edgePairsOf(edges)
  const parents = new Map()
  for (const { from, to } of pairs) {
    if (!parents.has(to)) parents.set(to, [])
    parents.get(to).push(from)
  }
  const seen = new Set()
  const stack = [targetId]
  while (stack.length > 0) {
    const id = stack.pop()
    for (const parent of parents.get(id) ?? []) {
      if (seen.has(parent)) continue
      seen.add(parent)
      stack.push(parent)
    }
  }
  return seen
}
