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
    cvStatusPending: '等待中',
    cvEngineOverride: '已覆盖引擎',
    cvReplaceEdge: '将替换该输入端口已有的连线',
    cvStartNode: '快速添加',
    cvResultEmpty: '完成（无图像输出）',
    cvDebugRun: 'Debug 运行',
    cvDebugBusy: '校验中…',
    cvDebugHint: 'Debug 运行：只校验模型能否加载、工作流/节点完整性与安全性，不生成内容',
    cvPickerTitle: '添加节点并连接',
    cvPickerHintOut: '连线已保留：从「{node}」的输出「{port}」拖出，选择节点后自动连接',
    cvPickerHintIn: '连线已保留：从「{node}」的输入「{port}」拖出，选择节点后自动连接',
    cvPickerEmpty: '没有可自动连接的节点',
    cvPickerClose: '关闭',
    cvPickerInput: '输入',
    cvPickerOutput: '输出',
    cvRunProgress: '运行中 {done}/{total}',
    cvRunFailed: '失败 {failed}',
    cvRunCurrent: '当前：{node}',
    cvZone: '分区',
    cvZoneNew: '新建分区',
    cvZoneName: '分区 {n}',
    cvZoneDefault: '分区',
    cvZoneHint: '拖动标题栏平移分区（分区内节点一起移动）· 右下角拖拽缩放 · 双击标题栏改名 · Delete 删除分区',
    cvZoneRename: '重命名分区（Enter 提交 / Esc 取消）',
    cvZoneDelete: '删除分区（不删除节点）',
    cvZoneResize: '拖动调整分区大小（最小 160 × 100）',
    cvZoneColor: '切换分区颜色',
    cvMore: '更多',
    cvMoreEngine: '引擎模式',
    cvGraphStats: '图统计',
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
    cvStatusPending: 'Waiting',
    cvEngineOverride: 'Engine overridden',
    cvReplaceEdge: 'Replaces the edge already on this input',
    cvStartNode: 'Quick add',
    cvResultEmpty: 'Done (no image output)',
    cvDebugRun: 'Debug run',
    cvDebugBusy: 'Validating…',
    cvDebugHint: 'Debug run: only validates model loadability, workflow/node integrity and safety — no content is generated',
    cvPickerTitle: 'Add node & connect',
    cvPickerHintOut: 'Link kept: drag started from output “{port}” of “{node}”; pick a node to connect automatically',
    cvPickerHintIn: 'Link kept: drag started from input “{port}” of “{node}”; pick a node to connect automatically',
    cvPickerEmpty: 'No connectable node',
    cvPickerClose: 'Close',
    cvPickerInput: 'input',
    cvPickerOutput: 'output',
    cvRunProgress: 'Running {done}/{total}',
    cvRunFailed: 'failed {failed}',
    cvRunCurrent: 'now: {node}',
    cvZone: 'Zone',
    cvZoneNew: 'New zone',
    cvZoneName: 'Zone {n}',
    cvZoneDefault: 'Zone',
    cvZoneHint: 'Drag the title bar to move the zone (nodes inside move too) · drag the bottom-right corner to resize · double-click the title to rename · Delete removes the zone',
    cvZoneRename: 'Rename zone (Enter to commit / Esc to cancel)',
    cvZoneDelete: 'Delete zone (keeps nodes)',
    cvZoneResize: 'Drag to resize the zone (min 160 × 100)',
    cvZoneColor: 'Cycle zone color',
    cvMore: 'More',
    cvMoreEngine: 'Engine mode',
    cvGraphStats: 'Graph',
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
  /* Zones (§14.1): visual grouping boxes drawn in world coordinates. */
  const ZONE_MIN_W = 160
  const ZONE_MIN_H = 100
  const ZONE_HEADER_H = 30
  const ZONE_PAD = 36
  const ZONE_MAX = 100
  const ZONE_COLOR_CYCLE = ['violet', 'blue', 'green', 'amber', 'rose']
  const ZONE_COLOR_VARS = {
    violet: 'var(--dsw-alias-brand-primary)',
    blue: 'var(--dsw-alias-state-business-primary)',
    green: 'var(--dsw-alias-state-success-primary)',
    amber: 'var(--dsw-alias-state-warn-primary)',
    rose: 'var(--dsw-alias-state-error-primary)',
  }

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
  function nextZoneId(zones) {
    let max = 0
    const used = new Set()
    for (const zone of Array.isArray(zones) ? zones : []) {
      if (!zone || typeof zone.id !== 'string') continue
      used.add(zone.id)
      const match = /^z(\d+)$/.exec(zone.id)
      if (match) max = Math.max(max, Number(match[1]))
    }
    let id = 'z' + (max + 1)
    let guard = 0
    while (used.has(id) && guard < ZONE_MAX + 10) {
      guard += 1
      max += 1
      id = 'z' + (max + 1)
    }
    return id
  }
  /** Next auto zone number: max trailing number of existing labels + 1. */
  function nextZoneNumber(zones) {
    let max = 0
    for (const zone of Array.isArray(zones) ? zones : []) {
      if (!zone) continue
      const match = /(\d+)\s*$/.exec(String(zone.label || ''))
      if (match) max = Math.max(max, Number(match[1]))
    }
    return max + 1
  }
  function zoneColorVar(color) {
    return ZONE_COLOR_VARS[color] || 'var(--dsw-alias-label-secondary)'
  }
  function nextZoneColor(color) {
    const index = ZONE_COLOR_CYCLE.indexOf(String(color || ''))
    return ZONE_COLOR_CYCLE[(index + 1) % ZONE_COLOR_CYCLE.length]
  }
  /** Resolved rectangle of one zone (numbers, min-size clamped). */
  function zoneRect(zone) {
    if (!zone) return { x: 0, y: 0, w: ZONE_MIN_W, h: ZONE_MIN_H }
    return {
      x: isFiniteNumber(zone.x) ? zone.x : 0,
      y: isFiniteNumber(zone.y) ? zone.y : 0,
      w: Math.max(ZONE_MIN_W, isFiniteNumber(zone.w) ? zone.w : ZONE_MIN_W),
      h: Math.max(ZONE_MIN_H, isFiniteNumber(zone.h) ? zone.h : ZONE_MIN_H),
    }
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
  /** Union bounds of nodes and zones (used by the minimap; §14.1). */
  function worldBounds(nodes, zones, defsById, measured) {
    const base = nodesBounds(nodes, defsById, measured)
    let minX = base ? base.minX : Infinity
    let minY = base ? base.minY : Infinity
    let maxX = base ? base.maxX : -Infinity
    let maxY = base ? base.maxY : -Infinity
    for (const zone of Array.isArray(zones) ? zones : []) {
      if (!zone) continue
      const rect = zoneRect(zone)
      minX = Math.min(minX, rect.x)
      minY = Math.min(minY, rect.y)
      maxX = Math.max(maxX, rect.x + rect.w)
      maxY = Math.max(maxY, rect.y + rect.h)
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
.vcg-cv-toolbar{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex:none;flex-wrap:nowrap;min-height:48px;position:relative;overflow:visible}
.vcg-cv-tb-title{font-size:13px;font-weight:600;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none}
.vcg-cv-tb-label{font-size:12px;white-space:nowrap}
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
.vcg-cv-more-wrap{position:relative;flex:none}
.vcg-cv-more-btn{display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;line-height:1;cursor:pointer;flex:none}
.vcg-cv-more-btn:hover,.vcg-cv-more-btn-active{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.vcg-cv-more-caret{transform:rotate(90deg);opacity:.7}
.vcg-cv-more-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:12;min-width:240px;max-width:min(320px,calc(100vw - 32px));display:flex;flex-direction:column;gap:2px;padding:6px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.2);font-size:12px;color:var(--dsw-alias-label-primary)}
.vcg-cv-more-row{display:flex;align-items:center;gap:8px;min-height:30px;padding:4px 8px;border-radius:7px;min-width:0}
.vcg-cv-more-label{flex:1;min-width:0;font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-more-value{font-size:11px;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;white-space:nowrap}
.vcg-cv-more-item{display:flex;align-items:center;gap:7px;width:100%;min-height:30px;padding:4px 8px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;text-align:left;cursor:pointer}
.vcg-cv-more-item:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.vcg-cv-more-item:disabled{opacity:.55;cursor:default}
.vcg-cv-more-item-label{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-more-sep{height:1px;background:var(--dsw-alias-border-l1);margin:4px 2px}
.vcg-cv-more-outdir{display:flex;align-items:flex-start;gap:6px;padding:6px 8px;font-size:10.5px;line-height:1.4;color:var(--dsw-alias-label-secondary);word-break:break-all}
.vcg-cv-more-readonly{display:flex;align-items:center;gap:6px;padding:6px 8px;font-size:11px;color:var(--dsw-alias-state-warn-primary)}

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

/* live run progress in the toolbar (§13.2) */
.vcg-cv-tb-run{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:280px;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-tb-run::before{content:'';flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-brand-primary);animation:vcg-cv-breathe 1.8s ease-in-out infinite}

/* -------------------------------------------------- connect picker menu */
.vcg-cv-picker{position:absolute;z-index:6;width:272px;max-height:min(360px,calc(100% - 16px));display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:0 12px 36px rgba(0,0,0,.22);overflow:hidden;font-size:12px;color:var(--dsw-alias-label-primary)}
.vcg-cv-picker-head{display:flex;align-items:center;gap:6px;padding:8px 8px 4px 10px;flex:none;color:var(--dsw-alias-brand-primary)}
.vcg-cv-picker-title{flex:1;min-width:0;font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-picker-hint{font-size:10.5px;color:var(--dsw-alias-label-secondary);padding:0 10px 6px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-picker-search{padding:0 10px 6px;flex:none}
.vcg-cv-picker-search .vcg-input{height:28px;font-size:12px;border-radius:7px;user-select:text}
.vcg-cv-picker input{user-select:text}
.vcg-cv-picker-list{flex:1;min-height:0;overflow:auto;padding:2px 6px 8px}
.vcg-cv-picker-item{display:flex;align-items:center;gap:7px;width:100%;text-align:left;padding:6px 7px;border:1px solid transparent;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;cursor:pointer}
.vcg-cv-picker-item:hover,.vcg-cv-picker-item:focus-visible{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1);outline:none}
.vcg-cv-picker-accent{width:3px;height:24px;border-radius:2px;flex:none;background:var(--dsw-alias-brand-primary)}
.vcg-cv-picker-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.vcg-cv-picker-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-picker-sub{font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vcg-cv-picker-empty{padding:16px 10px;text-align:center;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary)}

/* ---------------------------------------------------------------- minimap */
.vcg-cv-minimap{position:absolute;right:10px;bottom:10px;z-index:3;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 92%,transparent);box-shadow:0 4px 16px rgba(0,0,0,.16);overflow:hidden;cursor:crosshair;user-select:none;backdrop-filter:blur(4px)}
.vcg-cv-minimap svg{display:block}
.vcg-cv-mini-node{fill:color-mix(in srgb,var(--dsw-alias-label-secondary) 34%,transparent)}
.vcg-cv-mini-zone{vector-effect:non-scaling-stroke;stroke-width:1;stroke-dasharray:2 1.5}
.vcg-cv-mini-view{fill:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent);stroke:var(--dsw-alias-brand-primary);stroke-width:1;vector-effect:non-scaling-stroke}

/* ------------------------------------------------------------- zones §14.1 */
.vcg-cv-zone{position:absolute;z-index:0;pointer-events:none;border-radius:12px;border:1px solid color-mix(in srgb,var(--vcg-cv-zone-color,var(--dsw-alias-label-secondary)) 34%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--vcg-cv-zone-color,var(--dsw-alias-label-secondary)) 6%,transparent);transition:border-color 100ms ease,background 100ms ease}
.vcg-cv-zone-selected{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 32%,transparent)}
.vcg-cv-zone-head{position:absolute;left:0;right:0;top:0;height:30px;display:flex;align-items:center;gap:6px;padding:0 8px;pointer-events:auto;cursor:grab;user-select:none;min-width:0;border-bottom:1px solid color-mix(in srgb,var(--vcg-cv-zone-color,var(--dsw-alias-label-secondary)) 22%,transparent);background:color-mix(in srgb,var(--vcg-cv-zone-color,var(--dsw-alias-label-secondary)) 12%,var(--dsw-alias-bg-layer-1));border-radius:12px 12px 0 0}
.vcg-cv-zone-head:active{cursor:grabbing}
.vcg-cv-zone-dot{width:10px;height:10px;border-radius:3px;border:0;padding:0;flex:none;cursor:pointer;background:var(--vcg-cv-zone-color,var(--dsw-alias-label-secondary));box-shadow:0 0 0 1px color-mix(in srgb,var(--vcg-cv-zone-color,var(--dsw-alias-label-secondary)) 45%,transparent)}
.vcg-cv-zone-dot:hover:not(:disabled){filter:brightness(1.2)}
.vcg-cv-zone-dot:disabled{opacity:.5;cursor:default}
.vcg-cv-zone-title{flex:1;min-width:0;font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text;letter-spacing:.01em}
.vcg-cv-zone-selected .vcg-cv-zone-title{color:var(--dsw-alias-label-primary)}
.vcg-cv-zone-title-input{flex:1;min-width:0;height:20px;border:1px solid var(--dsw-alias-brand-primary);border-radius:5px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:11.5px;padding:0 5px;outline:none}
.vcg-cv-zone-act{width:20px;height:20px;border:0;background:transparent;border-radius:5px;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex:none;opacity:0;transition:opacity 100ms ease}
.vcg-cv-zone-selected .vcg-cv-zone-act{opacity:1}
.vcg-cv-zone-act:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);color:var(--dsw-alias-state-error-primary)}
.vcg-cv-zone-handle{position:absolute;right:1px;bottom:1px;width:16px;height:16px;pointer-events:auto;cursor:nwse-resize;opacity:0;transition:opacity 100ms ease}
.vcg-cv-zone:hover .vcg-cv-zone-handle,.vcg-cv-zone-selected .vcg-cv-zone-handle{opacity:1}
.vcg-cv-zone-handle::before{content:"";position:absolute;right:4px;bottom:4px;width:7px;height:7px;border-right:2px solid var(--vcg-cv-zone-color,var(--dsw-alias-label-secondary));border-bottom:2px solid var(--vcg-cv-zone-color,var(--dsw-alias-label-secondary));border-radius:0 0 1px 0;opacity:.8}

/* ---------------------------------------------------------------- preview */
.vcg-cv-preview{display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px;min-height:120px}
.vcg-cv-preview img,.vcg-cv-preview video{max-width:100%;max-height:60vh;border-radius:6px;display:block;object-fit:contain}
.vcg-cv-preview-meta{font-size:11px;color:var(--dsw-alias-label-secondary);word-break:break-all;max-height:56px;overflow:auto;margin-top:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}

@media (max-width: 980px){
  .vcg-cv-lib{width:204px}
  .vcg-cv-tb-title{max-width:96px}
}
`

  /* ------------------------------------------------------------- utilities */

  const ENGINE_SHORT = { cloud: '云', local: '本', both: '云/本' }
  const ENGINE_ICON = { cloud: 'cloud', local: 'server', both: 'layers' }
  const STATUS_LABEL_KEY = { idle: 'cvStatusIdle', pending: 'cvStatusPending', running: 'cvStatusRunning', done: 'cvStatusDone', error: 'cvStatusError' }

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

  /* --------------------------------------------------- connection picker */

  /**
   * Node definitions that can be auto-connected to `from` (a port ref from a
   * just-finished idle drag). `from.dir === 'out'` lists definitions with at
   * least one compatible *input*; `'in'` lists definitions with a compatible
   * *output*. Compatibility reuses validateConnection/canConnect.
   * @returns {Array<{def: object, port: object}>} sorted by category/order/name.
   */
  function compatibleNodeDefs(defs, from) {
    const list = Array.isArray(defs) ? defs : []
    if (!from || !from.node || !from.port) return []
    const dirIn = from.dir === 'in'
    const fromType = from.type || 'any'
    const picked = []
    for (const def of list) {
      if (!def || !def.id || def.__missing) continue
      const ports = dirIn ? def.outputs : def.inputs
      if (!Array.isArray(ports) || !ports.length) continue
      let match = null
      for (const port of ports) {
        if (!port || !port.id) continue
        const check = dirIn
          ? validateConnection(
              { node: def.id, dir: 'out', port: port.id, type: port.type || 'any' },
              { node: from.node, dir: 'in', port: from.port, type: fromType },
            )
          : validateConnection(
              { node: from.node, dir: 'out', port: from.port, type: fromType },
              { node: def.id, dir: 'in', port: port.id, type: port.type || 'any' },
            )
        if (check.ok) {
          match = port
          break
        }
      }
      if (match) picked.push({ def: def, port: match })
    }
    const categories = Array.isArray(consts.NODE_CATEGORIES) ? consts.NODE_CATEGORIES : []
    const rank = {}
    categories.forEach((category, index) => {
      if (category && category.id && rank[category.id] == null) rank[category.id] = index
    })
    const rankOf = (def) => (rank[def.category || 'utility'] == null ? 99 : rank[def.category || 'utility'])
    return picked.sort((a, b) => {
      const rankDiff = rankOf(a.def) - rankOf(b.def)
      if (rankDiff) return rankDiff
      const orderDiff = (Number(a.def.order) || 999) - (Number(b.def.order) || 999)
      if (orderDiff) return orderDiff
      return String(a.def.nameZh || a.def.name || a.def.id).localeCompare(String(b.def.nameZh || b.def.name || b.def.id))
    })
  }

  /**
   * Floating "add node & connect" menu opened by releasing an idle port drag on
   * blank canvas (CONTRACT §13.5). Local search only; selection bubbles up.
   */
  function ConnectionPicker(props) {
    const defs = Array.isArray(props.defs) ? props.defs : []
    const from = props.from || {}
    const [search, setSearch] = React.useState('')
    const candidates = React.useMemo(
      () => compatibleNodeDefs(defs, from),
      [defs, from.node, from.dir, from.port, from.type],
    )
    const query = search.trim().toLowerCase()
    const items = query
      ? candidates.filter((item) => {
          const def = item.def
          const haystack = [def.id, def.name, def.nameZh, def.description, def.category, def.engine]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return haystack.indexOf(query) >= 0
        })
      : candidates
    const dirIn = from.dir === 'in'
    const style = { left: (Number(props.left) || 0) + 'px', top: (Number(props.top) || 0) + 'px' }
    function onSearchKeyDown(event) {
      if (!event) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (typeof props.onClose === 'function') props.onClose()
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        if (items.length && typeof props.onPick === 'function') props.onPick(items[0])
      }
    }
    return h(
      'div',
      {
        className: 'vcg-cv-picker',
        style: style,
        role: 'dialog',
        'aria-label': t('cvPickerTitle'),
        onPointerDown: stopEvent,
        onMouseDown: stopEvent,
        onContextMenu: (event) => {
          event.preventDefault()
          event.stopPropagation()
        },
      },
      h(
        'div',
        { className: 'vcg-cv-picker-head' },
        h(Glyph, { name: 'plus', size: 13 }),
        h('span', { className: 'vcg-cv-picker-title' }, t('cvPickerTitle')),
        h(
          IconButton,
          { label: t('cvPickerClose'), title: t('cvPickerClose'), onClick: () => props.onClose && props.onClose() },
          h(Glyph, { name: 'close', size: 13 }),
        ),
      ),
      props.hint ? h('div', { className: 'vcg-cv-picker-hint', title: props.hint }, props.hint) : null,
      h(
        'div',
        { className: 'vcg-cv-picker-search' },
        h(TextInput, {
          value: search,
          onChange: (value) => setSearch(value),
          placeholder: t('cvSearchNodes'),
          autoFocus: true,
          onKeyDown: onSearchKeyDown,
        }),
      ),
      h(
        'div',
        { className: 'vcg-cv-picker-list' },
        items.length === 0 ? h('div', { className: 'vcg-cv-picker-empty' }, query ? t('cvNoMatch') : t('cvPickerEmpty')) : null,
        items.map((item) => {
          const def = item.def
          const port = item.port
          const portLabel = (port && (port.label || port.id)) || ''
          const sub = (dirIn ? t('cvPickerOutput') : t('cvPickerInput')) + ' ' + portLabel + ' · ' + engineLabel(def.engine)
          return h(
            'button',
            {
              key: def.id,
              type: 'button',
              className: 'vcg-cv-picker-item',
              title: def.description || def.name || def.id,
              onPointerDown: stopEvent,
              onClick: () => props.onPick && props.onPick(item),
            },
            h('span', {
              className: 'vcg-cv-picker-accent',
              style: { background: (def.ui && def.ui.accent) || 'var(--dsw-alias-brand-primary)' },
            }),
            h(
              'span',
              { className: 'vcg-cv-picker-main' },
              h('span', { className: 'vcg-cv-picker-name' }, def.nameZh || def.name || def.id),
              h('span', { className: 'vcg-cv-picker-sub' }, sub),
            ),
            h(Glyph, { name: 'plus', size: 12, style: { color: 'var(--dsw-alias-label-secondary)' } }),
          )
        }),
      ),
    )
  }

  /* ------------------------------------------------------------- ZoneBox */

  /**
   * One zone (§14.1): world-space box with an interactive title bar and a
   * bottom-right resize handle. The body itself is pointer-events:none so the
   * canvas pan / node / edge gestures underneath keep working.
   */
  function ZoneBox(props) {
    const { zone, selected, readOnly } = props
    const [renaming, setRenaming] = React.useState(false)
    const [draft, setDraft] = React.useState('')
    const cancelledRef = React.useRef(false)
    if (!zone || !zone.id) return null
    const rect = zoneRect(zone)
    const colorVar = zoneColorVar(zone.color)
    const label = zone.label || t('cvZoneDefault')
    return h(
      'div',
      {
        ref: (el) => {
          if (typeof props.registerEl === 'function') props.registerEl(zone.id, el)
        },
        className: 'vcg-cv-zone' + (selected ? ' vcg-cv-zone-selected' : ''),
        'data-zone-id': zone.id,
        style: { left: rect.x, top: rect.y, width: rect.w, height: rect.h, '--vcg-cv-zone-color': colorVar },
        onContextMenu: (event) => {
          event.preventDefault()
          event.stopPropagation()
        },
      },
      h(
        'div',
        {
          className: 'vcg-cv-zone-head',
          title: t('cvZoneHint'),
          onPointerDown: (event) => props.onHeadPointerDown(event, zone),
          onDoubleClick: (event) => event.stopPropagation(),
        },
        h('button', {
          type: 'button',
          className: 'vcg-cv-zone-dot',
          title: t('cvZoneColor'),
          'aria-label': t('cvZoneColor'),
          disabled: readOnly,
          onPointerDown: stopEvent,
          onClick: (event) => {
            event.stopPropagation()
            props.onCycleColor(zone.id)
          },
        }),
        renaming
          ? h('input', {
              className: 'vcg-cv-zone-title-input',
              value: draft,
              autoFocus: true,
              maxLength: 80,
              placeholder: t('cvZoneDefault'),
              title: t('cvZoneRename'),
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
                props.onRename(zone.id, draft.trim())
              },
            })
          : h(
              'span',
              {
                className: 'vcg-cv-zone-title',
                title: label + ' — ' + t('cvZoneRename'),
                onDoubleClick: (event) => {
                  event.stopPropagation()
                  if (readOnly) return
                  setDraft(zone.label || '')
                  setRenaming(true)
                },
              },
              label,
            ),
        selected && !readOnly
          ? h(
              'button',
              {
                type: 'button',
                className: 'vcg-cv-zone-act',
                title: t('cvZoneDelete'),
                'aria-label': t('cvZoneDelete'),
                onPointerDown: stopEvent,
                onClick: (event) => {
                  event.stopPropagation()
                  props.onDelete(zone.id)
                },
              },
              h(Glyph, { name: 'trash', size: 11 }),
            )
          : null,
      ),
      h('div', {
        className: 'vcg-cv-zone-handle',
        title: t('cvZoneResize'),
        'aria-label': t('cvZoneResize'),
        onPointerDown: (event) => props.onHandlePointerDown(event, zone),
      }),
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
      zones: [],
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
    const zones = Array.isArray(workflow.zones) ? workflow.zones : []
    const nodeDefs = Array.isArray(props.nodeDefs) ? props.nodeDefs : []
    const results = props.results && typeof props.results === 'object' ? props.results : EMPTY_OBJECT
    const readOnly = Boolean(props.readOnly)
    const running = Boolean(props.running)
    const debugBusy = Boolean(props.debugBusy)
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
    const zoneElsRef = React.useRef({})
    const stageRef = React.useRef(null)
    const worldRef = React.useRef(null)
    const gridRef = React.useRef(null)
    const moreAnchorRef = React.useRef(null)
    const prevZoneIdsRef = React.useRef(null)
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
    const [libraryOpen, setLibraryOpen] = React.useState(false)
    const [miniOpen, setMiniOpen] = React.useState(true)
    const [moreOpen, setMoreOpen] = React.useState(false)
    const [spaceDown, setSpaceDown] = React.useState(false)
    const [panning, setPanning] = React.useState(false)
    const [enginePref, setEnginePref] = React.useState('auto')
    // Idle drag → "add node & connect" menu (CONTRACT §13.5):
    // { from: portRef, world: {x,y}, screen: {x,y} } | null
    const [picker, setPicker] = React.useState(null)

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

    function selectZone(id) {
      if (!id) {
        clearSelection()
        return
      }
      setSel({ kind: 'zone', id: id })
      setMulti([])
      notifySelect(null)
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

    function removeZone(zoneId) {
      if (readOnly) return
      const current = workflowBase()
      const currentZones = Array.isArray(current.zones) ? current.zones : []
      const nextZones = currentZones.filter((zone) => !zone || zone.id !== zoneId)
      if (nextZones.length === currentZones.length) return
      emitWorkflow(Object.assign({}, current, { zones: nextZones }))
      const active = selRef.current
      if (active && active.kind === 'zone' && active.id === zoneId) {
        setSel({ kind: null, id: null })
        setMulti([])
        notifySelect(null)
      }
    }

    function deleteSelection() {
      if (readOnly) return
      if (connectRef.current) {
        cancelConnect()
        return
      }
      const current = selRef.current || { kind: null, id: null }
      if (current.kind === 'zone') {
        removeZone(current.id)
        return
      }
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

    /* --------------------------------------------------------- zones (§14.1) */

    /** Create a zone around the selected nodes (or the viewport center). */
    function createZone() {
      const p = propsRef.current
      if (!p || p.readOnly) return
      const current = workflowBase()
      const currentZones = Array.isArray(current.zones) ? current.zones : []
      if (currentZones.length >= ZONE_MAX) return
      const currentNodes = Array.isArray(current.nodes) ? current.nodes : []
      const active = selRef.current || { kind: null, id: null }
      const multiIds = multiRef.current || []
      const wanted = multiIds.length
        ? multiIds
        : active.kind === 'node' && active.id
          ? [active.id]
          : []
      const selected = currentNodes.filter((node) => node && wanted.indexOf(node.id) >= 0)
      const measured = measuredSizes()
      let rect = null
      if (selected.length) {
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const node of selected) {
          const def = defsByIdRef.current[node.type]
          const size = measured[node.id]
          const width = size && isFiniteNumber(size.w) ? size.w : nodeWidth(def)
          const height = size && isFiniteNumber(size.h) ? size.h : estimateNodeHeight(def)
          const x = isFiniteNumber(node.x) ? node.x : 0
          const y = isFiniteNumber(node.y) ? node.y : 0
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x + width)
          maxY = Math.max(maxY, y + height)
        }
        if (!Number.isFinite(minX)) return
        rect = {
          x: Math.round(minX - ZONE_PAD),
          y: Math.round(minY - ZONE_PAD - ZONE_HEADER_H),
          w: Math.max(ZONE_MIN_W, Math.round(maxX - minX + ZONE_PAD * 2)),
          h: Math.max(ZONE_MIN_H, Math.round(maxY - minY + ZONE_PAD * 2 + ZONE_HEADER_H)),
        }
      } else {
        const center = viewCenterWorld()
        rect = { x: Math.round(center.x - 260), y: Math.round(center.y - 170), w: 520, h: 340 }
      }
      const number = nextZoneNumber(currentZones)
      const zone = {
        id: nextZoneId(currentZones),
        label: t('cvZoneName', { n: number }),
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        color: ZONE_COLOR_CYCLE[currentZones.length % ZONE_COLOR_CYCLE.length],
      }
      emitWorkflow(Object.assign({}, current, { zones: currentZones.concat([zone]) }))
      setSel({ kind: 'zone', id: zone.id })
      setMulti([])
      notifySelect(null)
      focusStage()
    }

    function cycleZoneColor(zoneId) {
      const p = propsRef.current
      if (!p || p.readOnly) return
      const current = workflowBase()
      const currentZones = Array.isArray(current.zones) ? current.zones : []
      let changed = false
      const nextZones = currentZones.map((zone) => {
        if (!zone || zone.id !== zoneId) return zone
        changed = true
        return Object.assign({}, zone, { color: nextZoneColor(zone.color) })
      })
      if (changed) emitWorkflow(Object.assign({}, current, { zones: nextZones }))
    }

    function renameZone(zoneId, label) {
      if (readOnly) return
      const nextLabel = String(label == null ? '' : label).trim().slice(0, 80)
      const current = workflowBase()
      const currentZones = Array.isArray(current.zones) ? current.zones : []
      let changed = false
      const nextZones = currentZones.map((zone) => {
        if (!zone || zone.id !== zoneId) return zone
        if ((zone.label || '') === nextLabel) return zone
        changed = true
        return Object.assign({}, zone, { label: nextLabel })
      })
      if (changed) emitWorkflow(Object.assign({}, current, { zones: nextZones }))
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
      closePicker()
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
      closePicker()
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
        const activeSel = selRef.current
        const primary = (activeSel && activeSel.kind === 'node' && activeSel.id) || drag.ids[0]
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

    /* -------------------------------------------- zone gestures (§14.1) */

    /** Live-shift a set of nodes (DOM transforms) and their edge paths. */
    function applyLiveNodeShift(drag) {
      const screenDx = drag.dx
      const screenDy = drag.dy
      for (const id of drag.ids) {
        const el = nodeElsRef.current[id]
        if (el) el.style.transform = 'translate3d(' + screenDx + 'px,' + screenDy + 'px,0)'
      }
      if (!drag.ids.length) return
      const worldDx = screenDx / drag.scale
      const worldDy = screenDy / drag.scale
      const idSet = new Set(drag.ids)
      for (const edge of drag.edges) {
        if (!edge || !edge.from || !edge.to) continue
        const fromMoved = idSet.has(edge.from.node)
        const toMoved = idSet.has(edge.to.node)
        if (!fromMoved && !toMoved) continue
        const fromBase = drag.nodesById[edge.from.node]
        const toBase = drag.nodesById[edge.to.node]
        if (!fromBase || !toBase) continue
        const fromNode = fromMoved
          ? Object.assign({}, fromBase, { x: (Number(fromBase.x) || 0) + worldDx, y: (Number(fromBase.y) || 0) + worldDy })
          : fromBase
        const toNode = toMoved
          ? Object.assign({}, toBase, { x: (Number(toBase.x) || 0) + worldDx, y: (Number(toBase.y) || 0) + worldDy })
          : toBase
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

    function resetZoneDragTransforms(drag) {
      const zoneEl = zoneElsRef.current[drag.zoneId]
      if (zoneEl) zoneEl.style.transform = ''
      for (const id of drag.ids) {
        const el = nodeElsRef.current[id]
        if (el) el.style.transform = ''
      }
    }

    function startZoneDrag(event, zone) {
      closePicker()
      const p = propsRef.current
      if (!p || !zone || event.button !== 0) return
      if (connectRef.current) return
      event.stopPropagation()
      if (spaceRef.current) {
        startPan(event, false)
        return
      }
      event.preventDefault()
      selectZone(zone.id)
      focusStage()
      if (p.readOnly) return
      const current = wfRef.current
      const currentNodes = Array.isArray(current.nodes) ? current.nodes : []
      const currentEdges = Array.isArray(current.edges) ? current.edges : []
      const byId = {}
      for (const node of currentNodes) if (node && node.id) byId[node.id] = node
      const rect = zoneRect(zone)
      const measured = measuredSizes()
      const ids = []
      const positions = {}
      for (const node of currentNodes) {
        if (!node || !node.id || !byId[node.id]) continue
        const def = defsByIdRef.current[node.type]
        const size = measured[node.id]
        const width = size && isFiniteNumber(size.w) ? size.w : nodeWidth(def)
        const height = size && isFiniteNumber(size.h) ? size.h : estimateNodeHeight(def)
        const x = isFiniteNumber(node.x) ? node.x : 0
        const y = isFiniteNumber(node.y) ? node.y : 0
        const cx = x + width / 2
        const cy = y + height / 2
        if (cx < rect.x || cx > rect.x + rect.w || cy < rect.y || cy > rect.y + rect.h) continue
        ids.push(node.id)
        positions[node.id] = { x: x, y: y }
      }
      const drag = {
        zoneId: zone.id,
        zoneX: rect.x,
        zoneY: rect.y,
        ids: ids,
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
        edges: currentEdges,
      }
      function applyDrag() {
        if (!drag.moved) return
        const zoneEl = zoneElsRef.current[drag.zoneId]
        if (zoneEl) zoneEl.style.transform = 'translate3d(' + drag.dx + 'px,' + drag.dy + 'px,0)'
        applyLiveNodeShift(drag)
      }
      function cleanup() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
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
        drag.frame = RAF(function onZoneDragFrame() {
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
        resetZoneDragTransforms(drag)
        if (!worldDx && !worldDy) return
        const currentWf = wfRef.current
        const currentNodesNow = Array.isArray(currentWf.nodes) ? currentWf.nodes : []
        const currentZones = Array.isArray(currentWf.zones) ? currentWf.zones : []
        const nextNodes = currentNodesNow.map((node) => {
          if (!node || !drag.positions[node.id]) return node
          return Object.assign({}, node, {
            x: Math.round(drag.positions[node.id].x + worldDx),
            y: Math.round(drag.positions[node.id].y + worldDy),
          })
        })
        const nextZones = currentZones.map((item) =>
          item && item.id === drag.zoneId
            ? Object.assign({}, item, {
                x: Math.round(drag.zoneX + worldDx),
                y: Math.round(drag.zoneY + worldDy),
              })
            : item,
        )
        emitWorkflow(Object.assign({}, currentWf, { nodes: nextNodes, zones: nextZones }))
      }
      function onCancel() {
        clearGestureCleanup()
        resetZoneDragTransforms(drag)
      }
      clearGestureCleanup()
      gestureCleanupRef.current = cleanup
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
    }

    function startZoneResize(event, zone) {
      closePicker()
      const p = propsRef.current
      if (!p || !zone || event.button !== 0) return
      if (connectRef.current) return
      event.stopPropagation()
      event.preventDefault()
      selectZone(zone.id)
      focusStage()
      if (p.readOnly) return
      const rect = zoneRect(zone)
      const startW = rect.w
      const startH = rect.h
      const startX = event.clientX
      const startY = event.clientY
      const scale = viewRef.current.scale
      let width = startW
      let height = startH
      let moved = false
      let frame = 0
      function applyResize() {
        const zoneEl = zoneElsRef.current[zone.id]
        if (!zoneEl) return
        zoneEl.style.width = width + 'px'
        zoneEl.style.height = height + 'px'
      }
      function cleanup() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
        if (frame) {
          CAF(frame)
          frame = 0
        }
      }
      function onMove(moveEvent) {
        const worldDx = (moveEvent.clientX - startX) / scale
        const worldDy = (moveEvent.clientY - startY) / scale
        if (!moved && Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) < 2) return
        moved = true
        width = Math.max(ZONE_MIN_W, Math.round(startW + worldDx))
        height = Math.max(ZONE_MIN_H, Math.round(startH + worldDy))
        if (frame) return
        frame = RAF(function onZoneResizeFrame() {
          frame = 0
          applyResize()
        })
      }
      function onUp() {
        clearGestureCleanup()
        if (!moved) return
        if (frame) {
          CAF(frame)
          frame = 0
        }
        const currentWf = wfRef.current
        const currentZones = Array.isArray(currentWf.zones) ? currentWf.zones : []
        let changed = false
        const nextZones = currentZones.map((item) => {
          if (!item || item.id !== zone.id) return item
          if (item.w === width && item.h === height) return item
          changed = true
          return Object.assign({}, item, { w: width, h: height })
        })
        if (changed) emitWorkflow(Object.assign({}, currentWf, { zones: nextZones }))
      }
      function onCancel() {
        clearGestureCleanup()
        const zoneEl = zoneElsRef.current[zone.id]
        if (zoneEl) {
          zoneEl.style.width = startW + 'px'
          zoneEl.style.height = startH + 'px'
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
      closePicker()
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
      function onUp(upEvent) {
        clearGestureCleanup()
        finishConnect(gesture, upEvent)
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

    function finishConnect(gesture, releaseEvent) {
      hideTempPath()
      setHoverPort(null)
      setConnectState(null)
      connectRef.current = null
      if (!gesture || !gesture.from) return
      if (gesture.hover) {
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
        return
      }
      // Released on blank canvas: keep the connection intent and open the
      // "add node & connect" picker anchored at the release point (§13.5).
      const point = pickerTargetPoint(releaseEvent)
      if (!point) return
      setPicker({ from: gesture.from, world: point.world, screen: point.screen })
    }

    /* ------------------------------------------------ picker (§13.5) */

    function closePicker() {
      setPicker((current) => (current ? null : current))
    }

    /**
     * Screen/world point for the picker, or null when the release point is not
     * blank stage area (port, node body, minimap, toolbar, …).
     */
    function pickerTargetPoint(event) {
      if (!event || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') return null
      const stage = stageRef.current
      if (!stage) return null
      const doc = typeof document !== 'undefined' ? document : null
      if (!doc || typeof doc.elementFromPoint !== 'function') return null
      const rect = stage.getBoundingClientRect()
      const clientX = event.clientX
      const clientY = event.clientY
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null
      const el = doc.elementFromPoint(clientX, clientY)
      if (!el) return null
      if (!stage.contains(el)) return null
      if (el.closest && el.closest('[data-node-id],[data-port-node],.vcg-cv-minimap,.vcg-cv-quick-btn,.vcg-cv-picker,.vcg-cv-zone-head,.vcg-cv-zone-handle')) return null
      const screen = { x: clientX - rect.left, y: clientY - rect.top }
      return { screen: screen, world: canvasToWorld(screen, viewRef.current) }
    }

    /** Place a new node next to the release point, dodging existing nodes. */
    function pickerNodePosition(def, world, dirIn, portIndex, currentNodes) {
      const width = nodeWidth(def)
      const offsetY = portRowOffset(Math.max(0, portIndex || 0))
      let x = Math.round(dirIn ? world.x - width - 24 : world.x + 24)
      let y = Math.round(world.y - offsetY)
      let guard = 0
      while (
        guard < 12 &&
        currentNodes.some(
          (node) => node && Math.abs((Number(node.x) || 0) - x) < 12 && Math.abs((Number(node.y) || 0) - y) < 12,
        )
      ) {
        guard += 1
        x += 26
        y += 26
      }
      return { x: x, y: y }
    }

    /** Create the picked node, auto-wire it, emit once and select it. */
    function pickNodeFromMenu(item) {
      const active = picker
      setPicker(null)
      if (!active || !item || !item.def || !item.def.id) return
      const p = propsRef.current
      if (!p || p.readOnly) return
      const def = item.def
      const from = active.from
      if (!from || !from.node || !from.port) return
      const dirIn = from.dir === 'in'
      const ports = dirIn ? (Array.isArray(def.outputs) ? def.outputs : []) : Array.isArray(def.inputs) ? def.inputs : []
      let port = null
      for (const candidate of ports) {
        if (!candidate || !candidate.id) continue
        const check = dirIn
          ? validateConnection(
              { node: def.id, dir: 'out', port: candidate.id, type: candidate.type || 'any' },
              { node: from.node, dir: 'in', port: from.port, type: from.type || 'any' },
            )
          : validateConnection(
              { node: from.node, dir: 'out', port: from.port, type: from.type || 'any' },
              { node: def.id, dir: 'in', port: candidate.id, type: candidate.type || 'any' },
            )
        if (check.ok) {
          port = candidate
          break
        }
      }
      if (!port) return
      const current = workflowBase()
      const currentNodes = Array.isArray(current.nodes) ? current.nodes : []
      const currentEdges = Array.isArray(current.edges) ? current.edges : []
      const portIndex = ports.indexOf(port)
      const placed = pickerNodePosition(def, active.world || { x: 0, y: 0 }, dirIn, portIndex, currentNodes)
      const id = nextNodeId(currentNodes)
      const node = { id: id, type: def.id, x: placed.x, y: placed.y, params: {}, title: '' }
      const edgeFrom = dirIn ? { node: id, port: port.id } : { node: from.node, port: from.port }
      const edgeTo = dirIn ? { node: from.node, port: from.port } : { node: id, port: port.id }
      // One input port only accepts one edge — replace whatever was there.
      const filtered = currentEdges.filter(
        (edge) => edge && edge.to && !(edge.to.node === edgeTo.node && edge.to.port === edgeTo.port),
      )
      const edge = { id: nextEdgeId(currentEdges), from: edgeFrom, to: edgeTo }
      emitWorkflow(Object.assign({}, current, { nodes: currentNodes.concat([node]), edges: filtered.concat([edge]) }))
      setSel({ kind: 'node', id: id })
      setMulti([id])
      notifySelect(id)
      focusStage()
    }

    /* ------------------------------------------------------ minimap gesture */
    function startMinimapDrag(event) {
      closePicker()
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
      closePicker()
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

    function setZoneEl(id, el) {
      const map = zoneElsRef.current
      if (el) map[id] = el
      else delete map[id]
    }

    function renderZones() {
      if (!zones.length) return null
      return zones.map((zone) => {
        if (!zone || !zone.id) return null
        return h(ZoneBox, {
          key: zone.id,
          zone: zone,
          selected: sel.kind === 'zone' && sel.id === zone.id,
          readOnly: readOnly,
          onHeadPointerDown: (event, item) => startZoneDrag(event, item),
          onHandlePointerDown: (event, item) => startZoneResize(event, item),
          onCycleColor: (id) => cycleZoneColor(id),
          onRename: (id, label) => renameZone(id, label),
          onDelete: (id) => removeZone(id),
          registerEl: (id, el) => setZoneEl(id, el),
        })
      })
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
                closePicker()
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
      /* Live progress across the graph (§13.2): counts + the node being run. */
      let runProgressLabel = ''
      if (running) {
        let done = 0
        let failed = 0
        let current = ''
        for (const node of nodes) {
          const entry = results && results[node.id]
          const state = entry && entry.status
          if (state === 'done') done += 1
          else if (state === 'error') failed += 1
          else if (state === 'running') {
            if (current === '') {
              const def = resolveDef(node.type)
              current = node.title || (def && (def.nameZh || def.name)) || node.type
            }
          }
        }
        runProgressLabel = t('cvRunProgress', { done: done, total: nodes.length })
        if (failed > 0) runProgressLabel += ' · ' + t('cvRunFailed', { failed: failed })
        if (current !== '') runProgressLabel += ' · ' + t('cvRunCurrent', { node: current })
      }
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
        h(
          TBtn,
          { title: t('cvZoneNew') + ' · ' + t('cvZoneHint'), onClick: createZone, disabled: readOnly },
          h(Glyph, { name: 'grid', size: 14 }),
          h('span', { className: 'vcg-cv-tb-label' }, t('cvZone')),
        ),
        running && runProgressLabel
          ? h('span', { className: 'vcg-cv-tb-run', title: runProgressLabel }, runProgressLabel)
          : null,
        h('span', { className: 'vcg-cv-tb-spacer' }),
        props.headerExtra || null,
        running
          ? props.onStop
            ? h(Button, { variant: 'danger', size: 'md', icon: 'stop', onClick: props.onStop }, t('stop'))
            : h(Button, { size: 'md', icon: 'stop', disabled: true }, t('cvRunning'))
          : h(
              Button,
              {
                variant: 'primary',
                size: 'md',
                icon: 'play',
                disabled: !props.onRunAll || running,
                onClick: () => {
                  const p = propsRef.current
                  if (p && typeof p.onRunAll === 'function' && !p.running) p.onRunAll()
                },
              },
              t('runAll'),
            ),
        h(
          Button,
          {
            size: 'md',
            icon: debugBusy ? undefined : 'check',
            title: t('cvDebugHint'),
            disabled: running || debugBusy || typeof props.onDebugRun !== 'function',
            onClick: () => {
              const p = propsRef.current
              if (p && typeof p.onDebugRun === 'function' && !p.running && !p.debugBusy) p.onDebugRun()
            },
          },
          debugBusy ? t('cvDebugBusy') : t('cvDebugRun'),
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
        h(
          'div',
          { className: 'vcg-cv-more-wrap', ref: moreAnchorRef },
          h(
            'button',
            {
              type: 'button',
              className: 'vcg-cv-more-btn' + (moreOpen ? ' vcg-cv-more-btn-active' : ''),
              title: t('cvMore'),
              'aria-label': t('cvMore'),
              'aria-haspopup': 'menu',
              'aria-expanded': moreOpen ? 'true' : 'false',
              onPointerDown: stopEvent,
              onClick: () => setMoreOpen(!moreOpen),
            },
            h('span', null, t('cvMore')),
            h(Glyph, { name: 'chevron', size: 11, className: 'vcg-cv-more-caret' }),
          ),
          renderMoreMenu(engineModes, activeEngine),
        ),
      )
    }

    /** Compact overflow menu (§14.2): engine mode, minimap, graph stats, output dir, read-only. */
    function renderMoreMenu(engineModes, activeEngine) {
      if (!moreOpen) return null
      return h(
        'div',
        {
          className: 'vcg-cv-more-menu',
          role: 'menu',
          onPointerDown: stopEvent,
          onContextMenu: (event) => {
            event.preventDefault()
            event.stopPropagation()
          },
        },
        h(
          'div',
          { className: 'vcg-cv-more-row' },
          h('span', { className: 'vcg-cv-more-label' }, t('cvMoreEngine')),
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
        ),
        h('div', { className: 'vcg-cv-more-sep' }),
        h(
          'button',
          {
            type: 'button',
            className: 'vcg-cv-more-item',
            role: 'menuitemcheckbox',
            'aria-checked': miniOpen ? 'true' : 'false',
            onClick: () => setMiniOpen(!miniOpen),
          },
          h(Glyph, { name: 'grid', size: 13 }),
          h('span', { className: 'vcg-cv-more-item-label' }, t('cvMinimap')),
          miniOpen ? h(Glyph, { name: 'check', size: 13, style: { color: 'var(--dsw-alias-brand-primary)', flex: 'none' } }) : null,
        ),
        h('div', { className: 'vcg-cv-more-sep' }),
        h(
          'div',
          { className: 'vcg-cv-more-row' },
          h('span', { className: 'vcg-cv-more-label' }, t('cvGraphStats')),
          h('span', { className: 'vcg-cv-more-value' }, nodes.length + ' ' + t('cvNodes') + ' · ' + edges.length + ' ' + t('cvEdges')),
        ),
        props.outputDirHint
          ? h(
              'div',
              { className: 'vcg-cv-more-outdir', title: props.outputDirHint },
              h(Glyph, { name: 'folder', size: 12, style: { flex: 'none', marginTop: 1 } }),
              h('span', null, props.outputDirHint),
            )
          : null,
        readOnly
          ? h(
              'div',
              { className: 'vcg-cv-more-readonly' },
              h(Glyph, { name: 'warning', size: 12 }),
              h('span', null, t('cvReadOnly')),
            )
          : null,
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
      if (!miniOpen || (!nodes.length && !zones.length)) return null
      const defs = defsByIdRef.current || {}
      const bounds = worldBounds(nodes, zones, defs, null)
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
          zones.map((zone) => {
            if (!zone || !zone.id) return null
            const rect = zoneRect(zone)
            const colorVar = zoneColorVar(zone.color)
            return h('rect', {
              key: 'zone-' + zone.id,
              className: 'vcg-cv-mini-zone',
              x: rect.x * scale + ox,
              y: rect.y * scale + oy,
              width: Math.max(2, rect.w * scale),
              height: Math.max(2, rect.h * scale),
              rx: 2,
              style: { fill: colorVar, fillOpacity: 0.1, stroke: colorVar, strokeOpacity: 0.4 },
            })
          }),
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

    /* ------------------------------------------------ picker overlay (§13.5) */
    function renderPicker() {
      if (!picker || !picker.from) return null
      const size = viewSize()
      const panelW = 272
      const panelH = 360
      const left = clampNumber((Number(picker.screen && picker.screen.x) || 0) - 8, 8, Math.max(8, size.width - panelW - 8))
      const top = clampNumber((Number(picker.screen && picker.screen.y) || 0) - 8, 8, Math.max(8, size.height - panelH - 8))
      const from = picker.from
      const sourceNode = nodesById[from.node]
      const sourceDef = sourceNode ? resolveDef(sourceNode.type) : null
      const sourcePorts = sourceDef ? (from.dir === 'in' ? sourceDef.inputs : sourceDef.outputs) : null
      const sourcePort = Array.isArray(sourcePorts) ? sourcePorts.find((port) => port && port.id === from.port) : null
      const sourceName =
        (sourceNode && (sourceNode.title || '')) ||
        (sourceDef && (sourceDef.nameZh || sourceDef.name)) ||
        from.node ||
        ''
      const portName = (sourcePort && (sourcePort.label || sourcePort.id)) || from.port || ''
      const hint = t(from.dir === 'in' ? 'cvPickerHintIn' : 'cvPickerHintOut', { node: sourceName, port: portName })
      return h(ConnectionPicker, {
        key: 'picker-' + from.node + '-' + from.port + '-' + (Number(picker.world && picker.world.x) || 0) + '-' + (Number(picker.world && picker.world.y) || 0),
        from: from,
        defs: nodeDefs,
        left: left,
        top: top,
        hint: hint,
        onPick: (item) => pickNodeFromMenu(item),
        onClose: () => closePicker(),
      })
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
        // Let the picker list scroll instead of zooming the canvas.
        if (event.target && event.target.closest && event.target.closest('.vcg-cv-picker')) return
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
          if (typeof acts.closePicker === 'function') acts.closePicker()
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

    /* close the toolbar "more" menu on outside pointerdown / Esc (§14.2) */
    React.useEffect(() => {
      if (!moreOpen) return undefined
      function onDocPointerDown(event) {
        const el = moreAnchorRef.current
        if (el && event.target && el.contains(event.target)) return
        setMoreOpen(false)
      }
      function onDocKeyDown(event) {
        if (event.key !== 'Escape') return
        setMoreOpen(false)
        event.stopPropagation()
      }
      document.addEventListener('pointerdown', onDocPointerDown, true)
      document.addEventListener('keydown', onDocKeyDown, true)
      return () => {
        document.removeEventListener('pointerdown', onDocPointerDown, true)
        document.removeEventListener('keydown', onDocKeyDown, true)
      }
    }, [moreOpen])

    /* drop the local zone selection when the workflow no longer has that zone */
    React.useEffect(() => {
      const ids = new Set()
      for (const zone of zones) if (zone && zone.id) ids.add(zone.id)
      const previous = prevZoneIdsRef.current
      prevZoneIdsRef.current = ids
      const current = selRef.current
      if (!current || current.kind !== 'zone') return
      // Only react to an actual removal (not to a host render lagging one emit behind).
      if (!previous || !previous.has(current.id) || ids.has(current.id)) return
      setSel({ kind: null, id: null })
      setMulti([])
    })

    /* sync controlled selectedId */
    React.useEffect(() => {
      const id = props.selectedId
      const current = selRef.current || { kind: null, id: null }
      // Zone selection is canvas-local: an empty host selection must not clear it.
      if (current.kind === 'zone' && id == null) return
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
      closePicker: closePicker,
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
        renderZones(),
        renderEdges(),
        nodes.map(renderNodeCard),
      ),
      renderEmptyGuide(),
      renderMinimap(),
      nodes.length ? h('div', { className: 'vcg-cv-help' }, t('cvPanHint')) : null,
      renderConnectHint(),
      renderPicker(),
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
