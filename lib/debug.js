/**
 * VCG Debug 运行 — 静态校验（纯函数，不生成内容、不写文件）。
 *
 * 「Debug 运行」只回答一个问题：这张工作流如果真正运行，模型能否加载、
 * 图与参数是否完整、以及是否越过安全边界。它不调用生图/生视频 API，
 * 也不写任何输出文件（网络探测由 Host 层补充，见 index.js）。
 */

import { topoSort } from './graph.js'
import { nodeLabel, resolveParam, typesCompatible } from './workflow.js'

/** One check result. */
function check(group, level, label, detail = '') {
  return { group, level, label, detail }
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

/**
 * Run the static portion of a Debug 运行.
 *
 * @param {object} options
 * @param {object} options.workflow validated workflow object
 * @param {Map<string,object>} options.defsById node definitions by id
 * @param {object} options.settings public settings subset (local/proMode/outputDir/defaults)
 * @param {string} options.baseDir resolved output base directory
 * @param {string} options.outputDir resolved output directory name
 * @param {object} [options.provider] selected cloud provider (public shape)
 * @returns {{checks: object[], order: string[], ok: boolean}}
 */
export function runStaticDebug({ workflow, defsById, settings, baseDir, outputDir }) {
  const checks = []
  const seen = new Set()
  const add = (group, level, label, detail) => {
    const key = `${group}:${label}:${detail}`
    if (seen.has(key)) return
    seen.add(key)
    checks.push(check(group, level, label, detail))
  }

  /* ---------------------------------------------------------- schema */

  add('schema', 'pass', '工作流结构', `${workflow.nodes.length} 个节点、${workflow.edges.length} 条连线`)
  const nodeIds = new Set()
  for (const node of workflow.nodes) {
    if (nodeIds.has(node.id)) add('schema', 'fail', '节点 id 重复', `节点 id「${node.id}」重复`)
    nodeIds.add(node.id)
    if (!SAFE_ID.test(String(node.id))) add('security', 'fail', '节点 id 不安全', `「${node.id}」只能包含字母、数字、_ 与 -`)
    if (!Number.isFinite(Number(node.x)) || !Number.isFinite(Number(node.y))) {
      add('schema', 'warn', '节点坐标异常', `${nodeLabel(node)} 的 x/y 不是数字，画布可能显示错位`)
    }
    const def = defsById.get(node.type)
    if (!def) {
      add('schema', 'fail', '节点类型缺失', `${nodeLabel(node)} 的类型「${node.type}」不在节点库中，请先同步节点仓库`)
    }
  }

  /* ----------------------------------------------------------- graph */

  const targetPorts = new Map()
  for (const edge of workflow.edges) {
    const fromDef = defsById.get(workflow.nodes.find((node) => node.id === edge.from?.node)?.type)
    const toNode = workflow.nodes.find((node) => node.id === edge.to?.node)
    const toDef = defsById.get(toNode?.type)
    if (!fromDef || !toDef) continue
    const fromPort = (fromDef.outputs || []).find((port) => port.id === edge.from?.port)
    const toPort = (toDef.inputs || []).find((port) => port.id === edge.to?.port)
    if (!fromPort) {
      add('graph', 'fail', '连线端口不存在', `${fromDef.nameZh || fromDef.name} 没有输出端口「${edge.from?.port}」`)
      continue
    }
    if (!toPort) {
      add('graph', 'fail', '连线端口不存在', `${toDef.nameZh || toDef.name} 没有输入端口「${edge.to?.port}」`)
      continue
    }
    if (!typesCompatible(fromPort.type, toPort.type)) {
      add('graph', 'fail', '端口类型不兼容', `${fromPort.type} → ${toPort.type}（${fromDef.nameZh || fromDef.name} → ${toDef.nameZh || toDef.name}）`)
    }
    const key = `${edge.to?.node}:${edge.to?.port}`
    if (targetPorts.has(key)) add('graph', 'fail', '输入端口重复连线', `${toDef.nameZh || toDef.name} 的 ${toPort.label} 只能连接一条连线`)
    targetPorts.set(key, edge)
  }

  for (const node of workflow.nodes) {
    const def = defsById.get(node.type)
    if (!def) continue
    for (const port of def.inputs || []) {
      if (port.optional === true) continue
      if (!targetPorts.has(`${node.id}:${port.id}`)) {
        add('graph', 'fail', '必需输入未连线', `${nodeLabel(node, def)} 的 ${port.label} 没有连线`)
      }
    }
  }

  const sorted = topoSort(workflow.nodes, workflow.edges)
  if (sorted.cyclic) add('graph', 'fail', '工作流存在环路', `涉及：${sorted.cycle.join('、')}`)
  else add('graph', 'pass', '拓扑顺序', `${sorted.order.length} 个节点可执行`)

  const connected = new Set()
  for (const edge of workflow.edges) {
    connected.add(edge.from?.node)
    connected.add(edge.to?.node)
  }
  for (const node of workflow.nodes) {
    if (connected.has(node.id)) continue
    const def = defsById.get(node.type)
    if (!def) continue
    const terminal = (def.outputs || []).length === 0 && (def.inputs || []).length === 0
    add('graph', terminal ? 'pass' : 'warn', '孤立节点', `${nodeLabel(node, def)} 没有任何连线，运行时可能被跳过或报错`)
  }

  /* ---------------------------------------------------------- params */

  for (const node of workflow.nodes) {
    const def = defsById.get(node.type)
    if (!def) continue
    for (const param of def.params || []) {
      const value = resolveParam(node, def, param.id)
      if (param.type === 'select' && Array.isArray(param.options) && !param.options.includes(value)) {
        add('params', 'fail', '下拉参数非法', `${nodeLabel(node, def)} 的「${param.label}」= ${JSON.stringify(value)} 不在允许值内`)
      }
      if (param.type === 'number' && value !== undefined) {
        const n = Number(value)
        if (!Number.isFinite(n)) add('params', 'fail', '数字参数非法', `${nodeLabel(node, def)} 的「${param.label}」不是数字`)
        else if ((typeof param.min === 'number' && n < param.min) || (typeof param.max === 'number' && n > param.max)) {
          add('params', 'warn', '数字参数越界', `${nodeLabel(node, def)} 的「${param.label}」= ${n}，将按范围 ${param.min ?? '-∞'}~${param.max ?? '+∞'} 截断`)
        }
      }
      if (param.type === 'model' && (value === undefined || value === '')) {
        add('params', 'warn', '模型留空', `${nodeLabel(node, def)} 的「${param.label}」留空，将使用设置中的默认模型`)
      }
      if (param.type === 'text' || param.type === 'textarea') {
        const text = String(value ?? '')
        if (text.length > 8000) add('params', 'warn', '文本过长', `${nodeLabel(node, def)} 的「${param.label}」长度 ${text.length}，可能超出模型限制`)
        if (/\$\{\s*settings\.[A-Za-z0-9_]+\s*\}/.test(text)) {
          add('security', 'warn', '参数含密钥占位符', `${nodeLabel(node, def)} 的「${param.label}」包含 ${'${settings.*}'}，仅自定义 HTTP 节点的请求模板应使用它`)
        }
      }
    }
  }

  /* -------------------------------------------------------- executors */

  const local = settings?.local ?? {}
  const proMode = settings?.proMode === true
  for (const node of workflow.nodes) {
    const def = defsById.get(node.type)
    if (!def) continue
    const engine = node.engineOverride || def.engine || 'both'
    if (engine === 'local' && local.enabled !== true) {
      add('engine', 'fail', '本地节点不可用', `${nodeLabel(node, def)} 只能在本地模式运行，请开启本地运算模式`)
    }
    if (engine === 'cloud' && local.enabled === true) {
      add('engine', 'fail', '云端节点不可用', `${nodeLabel(node, def)} 只能在云端模式运行，本地模式无法执行`)
    }
    if (def.executor?.kind === 'http') {
      if (!proMode) add('security', 'fail', '自定义节点需要专业模式', `${nodeLabel(node, def)} 是 HTTP 自定义节点，请先在设置中打开专业模式`)
      const url = String(def.executor?.request?.url ?? '')
      if (!/^https?:\/\//i.test(url)) add('security', 'fail', '自定义节点 URL 非法', `${nodeLabel(node, def)} 的 request.url 必须是 http(s)：${url || '(空)'}`)
      const timeout = Number(def.executor?.request?.timeoutMs)
      if (Number.isFinite(timeout) && (timeout < 1000 || timeout > 600000)) {
        add('security', 'warn', '自定义节点超时异常', `${nodeLabel(node, def)} timeoutMs=${timeout}，建议 1000~600000`)
      }
    }
    if (def.executor?.kind === 'builtin' && !def.executor?.fn) {
      add('engine', 'fail', '执行器缺失', `${nodeLabel(node, def)} 没有声明 builtin fn`)
    }
  }

  /* --------------------------------------------------------- security */

  if (local.enabled === true && String(local.comfyuiUrl ?? '').trim() === '') {
    add('engine', 'fail', '本地模式未配置', '已开启本地运算但没有填写 ComfyUI 服务端地址')
  }
  const dir = String(outputDir ?? '')
  if (dir === '' || dir.includes('..') || dir.startsWith('/') || /^[A-Za-z]:/.test(dir)) {
    add('security', 'fail', '输出目录不安全', `outputDir「${dir}」必须是工作区内的相对目录名`)
  } else {
    add('security', 'pass', '输出目录', `${baseDir || '(工作区)'} / ${dir}`)
  }
  for (const node of workflow.nodes) {
    const def = defsById.get(node.type)
    if (!def) continue
    if (def.executor?.fn === 'imageOutput' || def.executor?.fn === 'videoOutput') {
      const params = node.params || {}
      for (const key of ['filename']) {
        const value = String(params[key] ?? '')
        if (value.includes('..') || value.includes('/') || value.includes('\\')) {
          add('security', 'fail', '输出文件名不安全', `${nodeLabel(node, def)} 的 ${key} 不能包含路径分隔符或 ..`)
        }
      }
    }
  }

  const failed = checks.filter((item) => item.level === 'fail').length
  const warned = checks.filter((item) => item.level === 'warn').length
  return { checks, order: sorted.cyclic ? [] : sorted.order, ok: failed === 0, failed, warned }
}

/** Sort checks in a stable display order and cap pathological lists. */
export function summarizeChecks(checks) {
  const order = ['schema', 'graph', 'params', 'engine', 'model', 'security']
  return [...checks]
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
    .slice(0, 200)
}
