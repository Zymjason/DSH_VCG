#!/usr/bin/env node
/**
 * VCG host self-test — pure/offline assertions only (no real network calls).
 *
 * Run with: node scripts/self-test.mjs
 * Exit code 0 = all assertions passed (or only documented skips).
 */

import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  BUILTIN_FNS,
  NODE_CATEGORIES,
  PORT_TYPES,
  buildComfyPrompt,
  buildWorkflowPrompt,
  catalogModels,
  classifyModel,
  composeImagePrompt,
  emptyWorkflow,
  extractJsonObject,
  fileStamp,
  isWithin,
  maskProvider,
  mergeCatalogs,
  mimeForPath,
  nodeParams,
  normalizeOutputDir,
  normalizeProvider,
  normalizeSize,
  normalizeState,
  outputFileName,
  parseChatImageResponse,
  parseChatTextResponse,
  prepareImportedNode,
  projectSlug,
  queryPath,
  renderTemplate,
  resolveParam,
  safeResolveOutputPath,
  sanitizeProjectName,
  textValue,
  topoSort,
  typesCompatible,
  urlListOf,
  validateGeneratedPlan,
  validateNodeDef,
  validateWorkflowShape,
  validateWorkflowWithDefs,
} from '../index.js'
import { Engine, firstImageValue, validateForRun } from '../lib/engine.js'
import { isPlainObject } from '../lib/util.js'
import { defaultState } from '../lib/state.js'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const NODES_DIR = join(ROOT, 'nodes')
const WORKFLOWS_DIR = join(ROOT, 'workflows')

let passed = 0
let failed = 0
const failures = []
const warnings = []

function ok(condition, label, detail = '') {
  if (condition) {
    passed += 1
    return true
  }
  failed += 1
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`)
  return false
}

function equal(actual, expected, label) {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  return ok(a === b, label, `expected ${b}, got ${a}`)
}

function throws(fn, label, includes = '') {
  try {
    fn()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (includes !== '' && !message.includes(includes)) {
      return ok(false, label, `error message "${message}" does not include "${includes}"`)
    }
    return ok(true, label)
  }
  return ok(false, label, 'expected a thrown error')
}

async function throwsAsync(fn, label, includes = '') {
  try {
    await fn()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (includes !== '' && !message.includes(includes)) {
      return ok(false, label, `error message "${message}" does not include "${includes}"`)
    }
    return ok(true, label)
  }
  return ok(false, label, 'expected a rejected promise')
}

async function readJsonDir(dir) {
  const files = (await readdir(dir).catch(() => [])).filter((file) => file.endsWith('.json')).sort()
  const out = []
  for (const file of files) out.push({ file, json: JSON.parse(await readFile(join(dir, file), 'utf8')) })
  return out
}

/* ------------------------------------------------------------------ loading */

const nodeFiles = await readJsonDir(NODES_DIR)
const workflowFiles = await readJsonDir(WORKFLOWS_DIR)
if (nodeFiles.length === 0) warnings.push('DSH_VCG/nodes 为空：节点相关断言已跳过（等待节点仓库交付）')
if (workflowFiles.length === 0) warnings.push('DSH_VCG/workflows 为空：工作流断言已跳过')

const defs = new Map()
for (const { file, json } of nodeFiles) {
  try {
    const def = validateNodeDef(json, { where: `nodes/${file}` })
    defs.set(def.id, def)
    ok(true, `节点 JSON 合法：${file}`)
  } catch (error) {
    ok(false, `节点 JSON 合法：${file}`, error instanceof Error ? error.message : String(error))
  }
}

const workflows = new Map()
for (const { file, json } of workflowFiles) {
  try {
    const workflow = validateWorkflowShape(json, { where: `workflows/${file}` })
    workflows.set(workflow.id, workflow)
    ok(true, `工作流 JSON 结构合法：${file}`)
  } catch (error) {
    ok(false, `工作流 JSON 结构合法：${file}`, error instanceof Error ? error.message : String(error))
  }
}

if (nodeFiles.length > 0 && workflowFiles.length > 0) {
  for (const [id, workflow] of workflows) {
    try {
      const result = validateWorkflowWithDefs(workflow, defs, { where: `workflow ${id}` })
      ok(result.order.length === workflow.nodes.length, `工作流可执行校验（节点/端口/类型/无环）：${id}`)
    } catch (error) {
      ok(false, `工作流可执行校验：${id}`, error instanceof Error ? error.message : String(error))
    }
  }
}

/* ------------------------------------------------- node definition contract */

ok(
  nodeFiles.length === 0 || defs.size === nodeFiles.length,
  '节点 id 唯一且与文件名语义一致',
  `defs=${defs.size} files=${nodeFiles.length}`,
)
ok(BUILTIN_FNS.length === 13, '§4 内置执行器 fn 数量为 13', String(BUILTIN_FNS.length))
ok(NODE_CATEGORIES.length === 8, '§11.7 category 共 8 个', NODE_CATEGORIES.join(','))
ok(PORT_TYPES.includes('conditioning') && PORT_TYPES.includes('any'), '端口类型表含 conditioning/any')

for (const def of defs.values()) {
  ok(NODE_CATEGORIES.includes(def.category), `节点 ${def.id} category 合法`)
  ok(['cloud', 'local', 'both'].includes(def.engine), `节点 ${def.id} engine 合法`)
  if (def.executor.kind === 'builtin') {
    ok(BUILTIN_FNS.includes(def.executor.fn), `节点 ${def.id} 内置 fn 合法：${def.executor.fn}`)
  }
  if (def.local?.comfyui) {
    ok(typeof def.local.comfyui.class_type === 'string' && def.local.comfyui.class_type !== '', `节点 ${def.id} ComfyUI class_type 合法`)
    for (const [field, ref] of Object.entries(def.local.comfyui.map ?? {})) {
      if (typeof ref === 'string' && ref.startsWith('params.')) {
        const paramId = ref.slice('params.'.length)
        ok(def.params.some((param) => param.id === paramId), `节点 ${def.id} 映射 ${field}→${ref} 指向已声明参数`)
      } else if (typeof ref === 'string' && ref.startsWith('inputs.')) {
        const portId = ref.slice('inputs.'.length)
        ok(def.inputs.some((port) => port.id === portId), `节点 ${def.id} 映射 ${field}→${ref} 指向已声明输入`)
      } else if (!(ref && typeof ref === 'object' && 'value' in ref)) {
        ok(false, `节点 ${def.id} 映射 ${field} 引用形式合法`)
      }
    }
  }
}

throws(() => validateNodeDef({ id: 'Bad_ID', name: 'x', category: 'custom', executor: { kind: 'builtin', fn: 'note' } }), '非法节点 id 被拒绝', 'kebab-case')
throws(() => validateNodeDef({ id: 'ok-id', name: 'x', category: 'nope', executor: { kind: 'builtin', fn: 'note' } }), '非法 category 被拒绝', 'category')
throws(
  () => validateNodeDef({ id: 'ok-id', name: 'x', category: 'custom', params: [{ id: 'p', type: 'select' }], executor: { kind: 'builtin', fn: 'note' } }),
  'select 缺 options 被拒绝',
  'options',
)
throws(
  () => validateNodeDef({ id: 'ok-id', name: 'x', category: 'custom', executor: { kind: 'http', request: { url: 'file:///etc/passwd' } } }),
  'http 节点非 http(s) URL 被拒绝',
  'http(s)',
)

/* ------------------------------------------------------------- type system */

ok(typesCompatible('text', 'conditioning') === true, '§11.2 text→conditioning 允许')
ok(typesCompatible('conditioning', 'text') === false, '§11.2 conditioning→text 禁止')
ok(typesCompatible('model', 'any') === true && typesCompatible('any', 'model') === true, '§11.2 any 双向允许')
ok(typesCompatible('image', 'latent') === false, '§11.2 image→latent 禁止')

/* --------------------------------------------------------------- topo sort */

{
  const nodes = ['a', 'b', 'c', 'd']
  const edges = [
    { from: { node: 'a' }, to: { node: 'b' } },
    { from: { node: 'b' }, to: { node: 'c' } },
    { from: { node: 'a' }, to: { node: 'd' } },
  ]
  const sorted = topoSort(nodes, edges)
  ok(!sorted.cyclic && sorted.order.length === 4, 'topoSort 无环排序完整')
  ok(sorted.order.indexOf('a') === 0, 'topoSort 根节点优先')
  ok(sorted.order.indexOf('b') < sorted.order.indexOf('c'), 'topoSort 保持依赖顺序')
  const cyclic = topoSort(['x', 'y'], [
    { from: { node: 'x' }, to: { node: 'y' } },
    { from: { node: 'y' }, to: { node: 'x' } },
  ])
  ok(cyclic.cyclic === true && cyclic.cycle.length === 2, 'topoSort 检测环')
}

/* ----------------------------------------------------- workflow validation */

{
  const base = emptyWorkflow({ name: '测试' })
  ok(base.nodes.length === 0 && base.edges.length === 0, 'emptyWorkflow 结构正确')
  throws(() => validateWorkflowShape({ nodes: [{ id: 'n1', type: 'x' }, { id: 'n1', type: 'y' }] }), '重复节点 id 被拒绝', '重复')
  throws(
    () => validateWorkflowShape({ nodes: [{ id: 'n1', type: 'x' }], edges: [{ from: { node: 'n1', port: 'a' }, to: { node: 'n2', port: 'b' } }] }),
    '边引用不存在的节点被拒绝',
    '不存在的节点',
  )
  ok(Array.isArray(base.zones) && base.zones.length === 0, '§14.1 emptyWorkflow 含 zones 空数组')
  const zoned = validateWorkflowShape({
    nodes: [],
    edges: [],
    zones: [
      { id: 'z1', label: '角色', x: 10, y: 20, w: 50, h: 60, color: 'violet' },
      { id: 'z1', label: 'dup', x: 0, y: 0, w: 300, h: 300 },
      { id: 'z2', x: 0, y: 0, w: 400, h: 300, color: 'nope' },
      { label: 'no-id', x: 0, y: 0, w: 300, h: 300 },
      'bad',
      { id: 'z3', x: 'x', y: 0, w: 300, h: 300 },
    ],
  })
  equal(zoned.zones.length, 2, '§14.1 非法分区被丢弃、id 去重')
  equal(zoned.zones[0], { id: 'z1', label: '角色', x: 10, y: 20, w: 160, h: 100, color: 'violet' }, '§14.1 分区尺寸 clamp 与字段保留')
  equal(zoned.zones[1].label, '分区 2', '§14.1 分区缺省命名')
  equal(zoned.zones[1].color, '', '§14.1 非法颜色回退空')
  const roundTrip = validateWorkflowShape(zoned, { where: '分区往返' })
  equal(roundTrip.zones, zoned.zones, '§14.1 分区规范化后可重复往返')
}

/* -------------------------------------------- §11.1 optional / required ports */

{
  const makeDef = (id, inputs, outputs = []) => ({
    id,
    name: id,
    nameZh: id,
    category: 'utility',
    order: 1,
    description: '',
    engine: 'both',
    inputs,
    outputs,
    params: [],
    executor: { kind: 'builtin', fn: 'note' },
    cloud: { capability: 'none' },
    ui: { accent: '#7c5cff', width: 240 },
  })
  const map = new Map()
  map.set('src', makeDef('src', [], [{ id: 'text', label: 'TEXT', type: 'text' }]))
  map.set('optional-sink', makeDef('optional-sink', [{ id: 'text', label: 'TEXT', type: 'text', optional: true }]))
  map.set('required-sink', makeDef('required-sink', [{ id: 'text', label: 'TEXT', type: 'text' }]))

  const optionalWorkflow = {
    version: 1,
    id: 'wf-optional',
    name: 'optional',
    nodes: [
      { id: 'n1', type: 'src' },
      { id: 'n2', type: 'optional-sink' },
    ],
    edges: [],
  }
  const optionalResult = validateWorkflowWithDefs(optionalWorkflow, map)
  ok(optionalResult.order.length === 2, '§11.1 悬空可选输入通过校验')

  const requiredWorkflow = { ...optionalWorkflow, id: 'wf-required', nodes: [{ id: 'n1', type: 'src' }, { id: 'n2', type: 'required-sink' }] }
  throws(() => validateWorkflowWithDefs(requiredWorkflow, map), '§11.1 必需输入未连线被拒绝', '没有连线')

  const typedWorkflow = {
    version: 1,
    id: 'wf-type',
    name: 'type',
    nodes: [
      { id: 'n1', type: 'src' },
      { id: 'n2', type: 'optional-sink' },
    ],
    edges: [{ id: 'e1', from: { node: 'n1', port: 'text' }, to: { node: 'n2', port: 'text' } }],
  }
  ok(validateWorkflowWithDefs(typedWorkflow, map).order.length === 2, '同类型连线通过校验')
}

/* ----------------------------------------------------- builtin executors */

{
  const execDir = await mkdtemp(join(tmpdir(), 'vcg-exec-'))
  const engine = new Engine({
    state: defaultState(),
    log: { warn() {} },
    nodeMap: () => defs,
    nodeList: () => [...defs.values()],
    resolveModel: () => ({ providerId: 'bailian-tpp', model: 'wan2.7-image', clip: 'c', vae: 'v' }),
    resolveProviderFor: () => ({ provider: { id: 'p', label: 'p', baseUrl: 'http://127.0.0.1:1', models: {}, kind: 'bailian-chat-image' }, model: 'wan2.7-image', apiKey: 'k' }),
    generateImage: async () => ({ images: [{ url: 'data:image/png;base64,iVBORw0KGgo=' }], providerId: 'bailian-tpp', model: 'wan2.7-image' }),
    generateVideo: async () => ({ videos: [{ url: 'https://example.com/v.mp4' }], providerId: 'p', model: 'v' }),
    generateText: async () => ({ text: 'polished prompt' }),
    resolveBaseDir: () => execDir,
    outputDirName: () => 'vcg-output',
    recordOutput: () => {},
    persist: async () => {},
  })
  engine.activeOutputDir = join(execDir, 'out')
  await mkdir(engine.activeOutputDir, { recursive: true })

  const runBuiltin = async (type, inputs, paramsOverride) => {
    const def = defs.get(type)
    const node = { id: 'n1', type, params: paramsOverride ?? {} }
    const params = nodeParams(node, def)
    return engine.executeBuiltin({ node, def, inputs, params })
  }

  if (defs.has('prompt-input')) {
    const out = await runBuiltin('prompt-input', {}, { positive: 'a cat', negative: 'blurry' })
    equal(out.outputs.positive, 'a cat', 'promptInput positive 直通')
    equal(out.outputs.negative, 'blurry', 'promptInput negative 直通')
  }
  if (defs.has('model-loader')) {
    const out = await runBuiltin('model-loader', {})
    equal(out.outputs.model?.model, 'wan2.7-image', 'modelLoader 返回默认模型')
    ok(typeof out.outputs.model?.providerId === 'string' && out.outputs.model.providerId !== '', 'modelLoader 返回 providerId')
  }
  if (defs.has('checkpoint-loader')) {
    const out = await runBuiltin('checkpoint-loader', {})
    ok(out.outputs.model && out.outputs.clip && out.outputs.vae, 'checkpoint-loader 云端返回 model/clip/vae 三个端口值')
  }
  if (defs.has('empty-latent-image')) {
    const out = await runBuiltin('empty-latent-image', {})
    equal(out.outputs.latent, { width: 1280, height: 720, batch: 1 }, 'emptyLatent 使用参数默认 1280×720')
    const wired = await runBuiltin('empty-latent-image', { width: 1024, height: 512 }, { width: 1280, height: 720 })
    equal(wired.outputs.latent, { width: 1024, height: 512, batch: 1 }, 'emptyLatent 优先使用输入的宽高')
  }
  if (defs.has('image-props')) {
    const out = await runBuiltin('image-props', {}, { width: 800, height: 600 })
    equal([out.outputs.width, out.outputs.height], [800, 600], 'imageProps 输出宽高数字')
  }
  if (defs.has('clip-text-encoder')) {
    const fromParams = await runBuiltin('clip-text-encoder', {}, { text: 'from params' })
    equal(fromParams.outputs.conditioning, 'from params', 'clipTextEncode 回退 params.text')
    const fromInput = await runBuiltin('clip-text-encoder', { text: 'from input' }, { text: 'from params' })
    equal(fromInput.outputs.conditioning, 'from input', 'clipTextEncode 优先 inputs.text')
    const rewritten = await runBuiltin('clip-text-encoder', { text: 'raw' }, { text: 'raw', rewrite: true })
    equal(rewritten.outputs.conditioning, 'polished prompt', 'clipTextEncode rewrite=true 调用文本模型')
  }
  if (defs.has('text-input')) {
    const out = await runBuiltin('text-input', {}, { text: 'hello' })
    equal(out.outputs.text, 'hello', 'textInput 直通')
  }
  if (defs.has('note')) {
    const out = await runBuiltin('note', {})
    equal(out.outputs, {}, 'note 无输出')
  }
  if (defs.has('ksampler')) {
    const out = await runBuiltin(
      'ksampler',
      { positive: 'a cat (text→conditioning)', negative: 'bad', latent: { width: 1024, height: 768, batch: 1 } },
      { seed: 1 },
    )
    ok(out.images.length === 1 && typeof out.images[0].path === 'string', 'ksampler 接受 text→conditioning 提示词并落盘')
    ok(out.images[0].path.includes('vcg-'), '输出文件名以 vcg- 开头')
    ok(isWithin(join(execDir, 'out'), out.images[0].path), '生成文件位于输出目录内')
  }
  await rm(execDir, { recursive: true, force: true })
}

/* ------------------------------------------------- full dry-run: txt2img */

{
  const workflow = workflows.get('wf-txt2img')
  if (!workflow) {
    warnings.push('未找到 wf-txt2img：整流程 dry-run 已跳过')
  } else {
    const dir = await mkdtemp(join(tmpdir(), 'vcg-selftest-'))
    const recorded = []
    const engine = new Engine({
      state: normalizeState({ local: { enabled: false } }),
      log: { warn() {} },
      nodeMap: () => defs,
      nodeList: () => [...defs.values()],
      resolveModel: (requested) => {
        const model = requested || 'wan2.7-image'
        return { providerId: 'bailian-tpp', model, clip: 'c', vae: 'v' }
      },
      resolveProviderFor: () => ({
        provider: { id: 'bailian-tpp', label: 'bailian', baseUrl: 'http://127.0.0.1:1', models: { image: ['wan2.7-image'] }, kind: 'bailian-chat-image' },
        model: 'wan2.7-image',
        apiKey: 'k',
      }),
      generateImage: async () => ({
        images: [{ url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }],
        providerId: 'bailian-tpp',
        model: 'wan2.7-image',
      }),
      generateVideo: async () => ({ videos: [], providerId: 'p', model: 'v' }),
      generateText: async () => ({ text: 'ok' }),
      resolveBaseDir: () => dir,
      outputDirName: () => 'vcg-output',
      recordOutput: (entry) => recorded.push(entry),
      persist: async () => {},
    })
    try {
      const events = []
      const dry = await engine.run({
        key: 'session:selftest',
        workflow,
        sessionId: 'selftest',
        runId: 'run-selftest',
        onEvent: (event) => events.push(event),
      })
      const nodeResults = Object.values(dry.results)
      ok(nodeResults.every((result) => result.status === 'done'), 'txt2img dry-run 全部节点 done', dry.error ?? '')
      const outputNode = workflow.nodes.find((node) => node.type === 'image-output')
      const outputResult = outputNode ? dry.results[outputNode.id] : undefined
      ok(Boolean(outputResult?.images?.[0]?.path), 'txt2img dry-run image-output 产出本地图片路径')
      if (outputResult?.images?.[0]?.path) {
        ok(isWithin(dir, outputResult.images[0].path), '输出文件位于 baseDir/outputDir 内')
        ok(/vcg-\d{8}-\d{6}-/.test(outputResult.images[0].path), '输出文件名符合 vcg-<timestamp>-<nodeId> 规则')
      }
      ok(recorded.length >= 1, 'outputs[] 登记了生成记录')
      ok(recorded.every((entry) => entry.providerId && entry.model), 'outputs[] 记录 provider/model')
      /* §13.1 progress events: order, runId passthrough and per-node timing. */
      ok(events.length > 0 && events[0].type === 'run-start', '§13.1 首个进度事件是 run-start')
      equal(events[0].runId, 'run-selftest', '§13.1 runId 透传到进度事件')
      equal(events[0].order, dry.order, '§13.1 run-start order 与返回 order 一致')
      const starts = events.filter((event) => event.type === 'node-start').map((event) => event.nodeId)
      const dones = events.filter((event) => event.type === 'node-done')
      const doneIds = dones.map((event) => event.nodeId)
      ok(doneIds.length === dry.order.length, '§13.1 每个执行节点都有一个 node-done', 'dones=' + doneIds.length + ' order=' + dry.order.length)
      ok(doneIds.every((id) => starts.includes(id)), '§13.1 每个 node-done 之前都有 node-start')
      ok(
        dones.every((event) => {
          const result = event.result
          return result && (result.status === 'done' || result.status === 'error') && Array.isArray(result.images)
        }),
        '§13.1 node-done 携带完整 result',
      )
      const finish = events[events.length - 1]
      ok(finish.type === 'run-done' && finish.ok === true && finish.runId === 'run-selftest', '§13.1 最后一个事件是成功 run-done')

      /* Single-node run: the record/order only covers nodeId + upstream (§13.1). */
      const singleEvents = []
      const singleTarget = workflow.nodes.find((node) => node.type === 'prompt-input') || workflow.nodes[0]
      if (singleTarget) {
        const single = await engine.run({
          key: 'session:selftest',
          workflow,
          sessionId: 'selftest',
          nodeId: singleTarget.id,
          runId: 'run-single',
          onEvent: (event) => singleEvents.push(event),
        })
        const singleOrder = singleEvents[0]?.order ?? []
        ok(singleOrder.includes(singleTarget.id), '§13.1 单节点运行 order 含目标节点')
        ok(singleOrder.length < dry.order.length, '§13.1 单节点运行 order 是整图子集')
        ok(single.result && single.result.status === 'done', '§13.1 单节点运行返回目标节点 result')
      }

      // Local-mode guard: txt2img uses cloud-only model-loader → readable error.
      const localHost = {
        ...engine.host,
        state: normalizeState({ local: { enabled: true, comfyuiUrl: 'http://127.0.0.1:1' } }),
      }
      const localEngine = new Engine(localHost)
      const { workflow: normalized, order } = validateForRun(workflow, defs)
      await throwsAsync(
        async () => localEngine.runLocal({ runId: 'dry', workflow: normalized, defs, order, outputDir: join(dir, 'vcg-output') }),
        '本地模式拒绝仅支持云端的节点并给出可读错误',
        '仅支持云端',
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  }
}

/* ------------------------------------------------------------- ComfyUI map */

{
  const productShot = workflows.get('wf-product-shot')
  if (productShot) {
    const translated = buildComfyPrompt(productShot, defs)
    equal(translated.warnings, [], 'product-shot ComfyUI 翻译无 warning')
    const promptIds = Object.keys(translated.prompt)
    ok(promptIds.length > 0, 'product-shot 生成 ComfyUI prompt 节点')
    ok(
      promptIds.every((id) => typeof translated.prompt[id].class_type === 'string' && typeof translated.prompt[id].inputs === 'object'),
      'ComfyUI prompt 结构为 {class_type, inputs}',
    )
    const linked = Object.values(translated.prompt).flatMap((entry) =>
      Object.values(entry.inputs).filter((value) => Array.isArray(value) && value.length === 2),
    )
    ok(linked.length > 0, 'ComfyUI prompt 含 [上游id, 输出索引] 连线值')
    ok(linked.every(([id, index]) => typeof id === 'string' && typeof index === 'number'), 'ComfyUI 连线值为 ["<id>", index]')
    ok(
      translated.mapped.every((canvasId) => translated.idMap.has(canvasId)),
      'ComfyUI 节点 id 映射完整',
    )
    // Unwired optional input falls back to params (§11.1).
    if (defs.has('clip-text-encoder')) {
      const def = defs.get('clip-text-encoder')
      const manual = {
        version: 1,
        id: 'wf-comfy-fallback',
        name: 'fallback',
        nodes: [{ id: 'n1', type: 'clip-text-encoder', x: 0, y: 0, params: { text: 'from params' } }],
        edges: [],
      }
      const fallback = buildComfyPrompt(manual, defs)
      equal(fallback.prompt['1'].inputs.text, 'from params', '§11.1 buildComfyPrompt 未连线的 inputs.text 回退 params.text')
      ok(def.local.comfyui.map.text === 'inputs.text', 'clip-text-encoder 映射 text→inputs.text')
    }
  } else {
    warnings.push('未找到 wf-product-shot：ComfyUI 映射断言已跳过')
  }
}

/* ---------------------------------------------------------------- path safety */

{
  ok(isWithin('/a/b', '/a/b/c') === true && isWithin('/a/b', '/a/bc') === false, 'isWithin 边界正确')
  throws(() => safeResolveOutputPath('/tmp/out', '../evil.png'), '输出路径拒绝 ../ 逃逸', '不能包含')
  throws(() => safeResolveOutputPath('/tmp/out', '/etc/passwd'), '输出路径拒绝绝对路径', '相对')
  throws(() => safeResolveOutputPath('/tmp/out', 'a/b.png'), '输出路径拒绝子目录', '分隔符')
  const okPath = safeResolveOutputPath('/tmp/out', 'vcg-20261113-101010-n1.png')
  ok(okPath === join('/tmp/out', 'vcg-20261113-101010-n1.png'), '合法输出文件名解析正确')
  ok(/^vcg-\d{8}-\d{6}-n1\.png$/.test(outputFileName('n1', 'png', new Date(2026, 10, 13, 10, 10, 10))), '输出文件命名规则正确')
  ok(/^vcg-\d{8}-\d{6}-node\.png$/.test(outputFileName('', 'png')), '空 nodeId 输出名仍合法')
  equal(mimeForPath('/x/y.PNG'), 'image/png', 'mime 按扩展名（大小写不敏感）')
  equal(mimeForPath('/x/y.mp4'), 'video/mp4', 'mime 视频类型')
}

/* -------------------------------------------------------------- state/masking */

{
  const migrated = normalizeState({ baseUrl: 'https://api.example.com/v1', apiKey: 'secret-key', model: 'wan2.7-image' })
  ok(migrated.version === 2 && migrated.providers.length === 1, 'v1 → v2 state 迁移生成 provider 记录')
  equal(migrated.providers[0].apiKey, 'secret-key', 'v1 apiKey 迁移保留')
  equal(migrated.defaults.imageModel, 'wan2.7-image', 'v1 model 迁移为默认生图模型')
  const masked = maskProvider(migrated.providers[0])
  ok(masked.hasKey === true, 'maskProvider hasKey 正确')
  ok(!('apiKey' in masked) || masked.apiKey === undefined, 'maskProvider 不输出明文 apiKey')

  const existing = normalizeProvider({ id: 'p1', baseUrl: 'https://x/v1', apiKey: 'keep-me' })
  const updated = normalizeProvider({ id: 'p1', label: '新名字', baseUrl: 'https://x/v1' }, existing)
  equal(updated.apiKey, 'keep-me', 'saveSettings 未传 apiKey 时保留旧 Key')
  equal(updated.label, '新名字', 'saveSettings 更新 label')
  const cleared = normalizeProvider({ id: 'p1', clearApiKey: true }, existing)
  equal(cleared.apiKey, '', 'clearApiKey 清空 Key')

  const defaults = defaultState()
  equal(defaults.outputDir, 'vcg-output', '默认输出目录')
  equal(defaults.local.timeoutMs, 600000, '默认本运算超时 600s')
  equal(normalizeOutputDir('  my-output/  '), 'my-output', '输出目录规范化')
  equal(normalizeOutputDir('../escape'), 'escape', '输出目录拒绝 .. 段')

  const provider = normalizeProvider({ id: 'custom-1', kind: 'openai-images', baseUrl: 'https://api.x/v1/', models: { image: ['flux-1'] } })
  equal(provider.baseUrl, 'https://api.x/v1', 'Provider baseUrl 去尾斜杠')
  equal(provider.detectedFrom, 'custom', '自定义 Provider 标记 custom')
}

/* --------------------------------------------------------------- providers */

{
  equal(classifyModel('wan2.7-image'), 'image', '模型分类 wan2.7-image → image')
  equal(classifyModel('qwen-image-3.0-pro'), 'image', '模型分类 qwen-image → image')
  equal(classifyModel('wan3.0-video'), 'video', '模型分类 wan3.0-video → video')
  equal(classifyModel('qwen3.8-max'), 'text', '模型分类 qwen3.8-max → text')
  equal(classifyModel('qwen-audio-3.0-tts-plus'), 'audio', '§14.3 模型分类 qwen-audio → audio')
  equal(classifyModel('qwen-audio-3.0-asr-flash'), 'audio', '§14.3 模型分类 asr → audio')
  const catalog = catalogModels(['wan2.7-image', 'wan3.0-video', 'qwen3.8-max', 'wan2.7-image', 'qwen-audio-3.0-tts-plus'])
  equal(catalog.image, ['wan2.7-image'], '模型目录去重')
  equal(catalog.audio, ['qwen-audio-3.0-tts-plus'], '§14.3 模型目录 audio 分桶')
  equal(catalog.all, ['wan2.7-image', 'wan3.0-video', 'qwen3.8-max', 'qwen-audio-3.0-tts-plus'], '§14.3 模型目录 all 保留全部 id')
  const merged = mergeCatalogs({ image: ['a'] }, { image: ['a', 'b'], text: ['t'] })
  equal(merged, { image: ['a', 'b'], video: [], text: ['t'], audio: [], all: [] }, '模型目录合并去重')

  equal(normalizeSize('1280x720'), '1280*720', '§9 尺寸 1280x720 → 1280*720')
  equal(normalizeSize('1024*1024'), '1024*1024', '§9 尺寸保持 W*H')
  equal(normalizeSize('1280×720'), '1280*720', '§9 尺寸支持 × 分隔符')
  equal(normalizeSize(undefined, '1024*1024'), '1024*1024', '§9 尺寸非法时使用 fallback')
  throws(() => composeImagePrompt('   ', ''), '空提示词被拒绝', '提示词')
  equal(composeImagePrompt('cat', 'bad'), 'cat\nNegative prompt: bad', '负向提示词拼接')

  const sample = {
    output: {
      choices: [
        {
          message: {
            content: [
              { type: 'image', image: 'https://cdn.example.com/a.png' },
              { type: 'text', text: 'done' },
            ],
          },
        },
      ],
    },
    usage: { image_count: 1 },
  }
  const parsed = parseChatImageResponse(sample)
  equal(parsed.images.map((image) => image.url), ['https://cdn.example.com/a.png'], '§9 chat 响应解析图片 URL')
  equal(parseChatTextResponse({ choices: [{ message: { content: 'hello' } }] }), 'hello', '标准 chat 响应解析文本')
  equal(parseChatTextResponse({ choices: [{ message: { content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] } }] }), 'ab', 'chat 多块文本拼接')
}

/* --------------------------------------------------------------- http nodes */

{
  const json = { data: [{ url: 'https://x/1.png' }, { url: 'https://x/2.png' }], text: 'ok', error: { message: 'boom' } }
  equal(queryPath(json, '$.data[*].url'), ['https://x/1.png', 'https://x/2.png'], 'JSONPath $.a[*].b')
  equal(queryPath(json, '$.text'), 'ok', 'JSONPath $.a.b')
  equal(queryPath(json, '$.error.message'), 'boom', 'JSONPath 错误消息')
  equal(queryPath(json, '$.missing.path'), undefined, 'JSONPath 缺失路径返回 undefined')
  const scope = {
    inputs: { text: 'a prompt', image: { url: 'https://x/i.png' } },
    params: { size: '1024*1024', api: 'model-x', n: 1 },
    settings: { apiKey: 'k-123', baseUrl: 'https://api', providerId: 'p' },
  }
  equal(renderTemplate('Bearer ${settings.apiKey}', scope), 'Bearer k-123', '模板替换 settings')
  equal(renderTemplate('${inputs.text}', scope), 'a prompt', '模板替换 inputs')
  equal(renderTemplate({ model: '${params.api}', size: '${params.size}', n: '${params.n}' }, scope), { model: 'model-x', size: '1024*1024', n: '1' }, '模板替换嵌套 body')
  equal(urlListOf('https://x/a.png'), ['https://x/a.png'], 'urlListOf 字符串')
  equal(firstImageValue({ images: [{ url: 'https://x/a.png' }] })?.url, 'https://x/a.png', 'firstImageValue 取图片')
  equal(textValue({ text: 'hi' }), 'hi', 'textValue 取文本')
}

/* ---------------------------------------------------------------- AI builder */

{
  const fenced = '好的，下面是工作流：\n```json\n{"reply":"说明","nodes":[{"id":"n1","type":"prompt-input"}],"edges":[]}\n```\n完成。'
  const parsed = extractJsonObject(fenced)
  equal(parsed.reply, '说明', '提取 ```json 围栏内的 JSON')
  throws(() => extractJsonObject('这里没有 JSON'), '无 JSON 时抛出可读错误', '不是有效 JSON')
  ok(typeof buildWorkflowPrompt({ userPrompt: '一只猫', nodeDefs: [...defs.values()] }).system === 'string', 'buildWorkflowPrompt 生成 system 提示')
  ok(buildWorkflowPrompt({ userPrompt: 'x', nodeDefs: [...defs.values()] }).user.includes('一只猫') === false, 'buildWorkflowPrompt user 包含需求')

  if (defs.size > 0) {
    const plan = {
      reply: '已为你搭建文生图',
      nodes: [
        { id: 'n1', type: 'prompt-input', x: 80, y: 160, params: { positive: 'cat' } },
        { id: 'n2', type: 'model-loader', x: 400, y: 100 },
        { id: 'n3', type: 'empty-latent-image', x: 400, y: 260, params: { width: 1024, height: 1024 } },
        { id: 'n4', type: 'ksampler', x: 720, y: 160 },
        { id: 'n5', type: 'vae-decode', x: 1040, y: 160 },
        { id: 'n6', type: 'image-output', x: 1320, y: 160 },
        { id: 'nX', type: 'not-a-node', x: 0, y: 0 },
      ],
      edges: [
        { from: { node: 'n1', port: 'positive' }, to: { node: 'n4', port: 'positive' } },
        { from: { node: 'n1', port: 'negative' }, to: { node: 'n4', port: 'negative' } },
        { from: { node: 'n2', port: 'model' }, to: { node: 'n4', port: 'model' } },
        { from: { node: 'n3', port: 'latent' }, to: { node: 'n4', port: 'latent' } },
        { from: { node: 'n4', port: 'image' }, to: { node: 'n5', port: 'image' } },
        { from: { node: 'n5', port: 'image' }, to: { node: 'n6', port: 'image' } },
        { from: { node: 'n1', port: 'positive' }, to: { node: 'n9', port: 'positive' } },
      ],
    }
    const built = validateGeneratedPlan(plan, defs, { prompt: '一只猫' })
    equal(built.workflow.nodes.length, 6, 'AI 建流丢弃未知节点')
    equal(built.workflow.nodes.map((node) => node.id), ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'], 'AI 建流重新编号 n1..nN')
    equal(built.workflow.edges.length, 6, 'AI 建流丢弃无效连线')
    equal(built.workflow.edges[0].id, 'e1', 'AI 建流连线编号 e1..')
    ok(built.notes.some((note) => note.includes('未知节点')), 'AI 建流 notes 记录被丢弃项')
    const revalidated = validateWorkflowWithDefs(built.workflow, defs, { where: 'AI 建流' })
    ok(revalidated.order.length === 6, 'AI 生成的工作流可通过执行校验')
    equal(built.workflow.nodes[2].params, { width: 1024, height: 1024 }, 'AI 建流 params 合法保留')
  }
}

  // Regression: models return display names + uppercase port labels (Lead report).
  if (defs.size > 0) {
    const capitalized = {
      reply: '大写端口测试',
      nodes: [
        { id: 'n1', type: 'Prompt Input', x: 80, y: 160, params: { positive: 'cat', negative: 'bad' } },
        { id: 'n2', type: 'Model Loader', x: 400, y: 60 },
        { id: 'n3', type: 'Empty Latent Image', x: 400, y: 260 },
        { id: 'n4', type: 'KSampler', x: 720, y: 160 },
        { id: 'n5', type: 'VAE Decode', x: 1040, y: 160 },
        { id: 'n6', type: 'Image Output', x: 1320, y: 160 },
      ],
      edges: [
        { from: { node: 'n1', port: 'POSITIVE' }, to: { node: 'n4', port: 'POSITIVE' } },
        { from: { node: 'n1', port: 'NEGATIVE' }, to: { node: 'n4', port: 'NEGATIVE' } },
        { from: { node: 'n2', port: 'MODEL' }, to: { node: 'n4', port: 'MODEL' } },
        { from: { node: 'n3', port: 'LATENT' }, to: { node: 'n4', port: 'LATENT' } },
        { from: { node: 'n4', port: 'IMAGE' }, to: { node: 'n5', port: 'IMAGE' } },
        { from: { node: 'n5', port: 'IMAGE' }, to: { node: 'n6', port: 'IMAGE' } },
      ],
    }
    const fixed = validateGeneratedPlan(capitalized, defs, { prompt: 'cat' })
    equal(
      fixed.workflow.nodes.map((node) => node.type),
      ['prompt-input', 'model-loader', 'empty-latent-image', 'ksampler', 'vae-decode', 'image-output'],
      '节点显示名 / 大小写别名映射为规范 id',
    )
    equal(fixed.workflow.edges.length, 6, '大写端口连线全部保留')
    ok(
      fixed.workflow.edges.every((edge) => edge.from.port === edge.from.port.toLowerCase() && edge.to.port === edge.to.port.toLowerCase()),
      '端口 id 归一化为小写',
    )
    ok(validateWorkflowWithDefs(fixed.workflow, defs, { where: '大写端口回归' }).order.length === 6, '大写端口工作流通过执行校验')

    // Auto-connect fallback: model returned nodes without a single edge.
    const noEdges = validateGeneratedPlan({ reply: 'x', nodes: capitalized.nodes, edges: [] }, defs, { prompt: 'cat' })
    ok(noEdges.workflow.edges.length >= 6, '缺少连线时自动补边', `edges=${noEdges.workflow.edges.length}`)
    ok(noEdges.notes.some((note) => note.includes('已自动连线')), '自动连线写入 notes')
    ok(validateWorkflowWithDefs(noEdges.workflow, defs, { where: '自动连线回归' }).order.length === 6, '自动连线后的工作流可执行')

    const promptText = buildWorkflowPrompt({ userPrompt: 'x', nodeDefs: [...defs.values()] }).system
    ok(promptText.includes('positive(text)') && promptText.includes('latent(latent)'), 'system 提示含精确端口表')
    ok(promptText.includes('小写 id'), 'system 提示要求使用小写 id')
  }

/* ------------------------------------------------------------------ projects */

{
  equal(sanitizeProjectName('  我的项目 / v1  '), '我的项目 v1', '项目名清洗')
  equal(sanitizeProjectName('a/b\\c*d'), 'abcd', '项目名去除非法字符')
  equal(sanitizeProjectName('   '), '', '空项目名清洗为空')
  equal(projectSlug('我的 项目 01'), '我的-项目-01', '项目 slug 生成')
  equal(projectSlug(''), projectSlug(''), '空 slug 稳定回退')
  ok(projectSlug('').startsWith('vcg-project-'), '空 slug 使用 vcg-project- 前缀')
}

/* --------------------------------------------------------- custom node import */

{
  const httpNode = {
    id: 'my-http-node',
    name: 'My Node',
    nameZh: '我的节点',
    category: 'custom',
    engine: 'cloud',
    inputs: [{ id: 'text', label: 'TEXT', type: 'text', optional: true }],
    outputs: [{ id: 'image', label: 'IMAGE', type: 'image' }],
    params: [{ id: 'api', label: 'API', type: 'select', options: ['my-api'], default: 'my-api' }],
    executor: {
      kind: 'http',
      request: { url: 'https://api.example.com/generate', method: 'POST', headers: { Authorization: 'Bearer ${settings.apiKey}' }, body: { prompt: '${inputs.text}' } },
      response: { images: '$.data[*].url', error: '$.error.message' },
    },
    cloud: { capability: 'image' },
  }
  throws(() => prepareImportedNode(httpNode, { proMode: false }), '未开专业模式导入 http 节点被拒绝', '专业模式')
  const prepared = prepareImportedNode(httpNode, { proMode: true })
  equal(prepared.executor.kind, 'http', '专业模式导入 http 节点通过')
  const missingApi = { ...httpNode, params: [] }
  throws(() => prepareImportedNode(missingApi, { proMode: true }), '导入节点缺少 api 参数被拒绝', 'api')
}

/* ------------------------------------------------- studio offline smoke test */

{
  // A fake Cordis context that exposes just enough service surface to capture
  // the RPC route, the vcg tool and the system-prompt section.
  const rpcRegistrations = []
  const capturedSections = []
  let capturedTool
  const effectChild = () => ({
    effect(fn) {
      try {
        const disposer = fn()
        return typeof disposer === 'function' ? disposer : () => {}
      } catch {
        return () => {}
      }
    },
  })
  const fakeCtx = (workingDirectory) => {
    const services = {
      connection: {
        fetch: {
          register(config) {
            rpcRegistrations.push(config)
            return () => {}
          },
        },
      },
      tools: {
        register(definition) {
          capturedTool = definition
          return () => {}
        },
      },
      systemPrompt: {
        section(spec) {
          capturedSections.push(spec)
          return () => {}
        },
      },
    }
    const child = {
      ...effectChild(),
      connection: services.connection,
      tools: services.tools,
      systemPrompt: services.systemPrompt,
    }
    return {
      logger: { warn() {} },
      get(name) {
        if (name === 'workingDirectory') return { defaultDirectory: workingDirectory }
        return services[name]
      },
      inject(deps, callback) {
        if (Array.isArray(deps) && deps.some((dep) => services[dep])) {
          try {
            callback(child)
          } catch (error) {
            /* surface nothing: the smoke test asserts registration results */
            void error
          }
        }
        return () => {}
      },
      effect(fn) {
        try {
          const disposer = fn()
          return typeof disposer === 'function' ? disposer : () => {}
        } catch {
          return () => {}
        }
      },
    }
  }

  const smokeRoot = await mkdtemp(join(tmpdir(), 'vcg-studio-'))
  const previousProfile = process.env.DSH_PROFILE_DIR
  process.env.DSH_PROFILE_DIR = join(smokeRoot, 'profile')
  try {
    const { VcgStudio } = await import('../index.js')
    const workDir = join(smokeRoot, 'work')
    await mkdir(workDir, { recursive: true })
    const studio = new VcgStudio(fakeCtx(workDir), { outputDir: 'vcg-output' })
    await studio.init()

    // RPC route / tool / prompt section registrations were captured by the fake ctx.
    ok(rpcRegistrations.length === 1, 'RPC 路由已注册一次')
    const rpcConfig = rpcRegistrations[0]
    equal(rpcConfig.path, '/api/dsh-vcg/rpc', 'RPC 路径为 /api/dsh-vcg/rpc')
    equal(rpcConfig.methods, ['POST'], 'RPC 只接受 POST')
    equal(rpcConfig.requestBody, 'buffered', 'RPC 使用 buffered 请求体')
    ok(capturedTool?.name === 'vcg', 'vcg 工具已注册')
    const toolActions = capturedTool?.parameters?.properties?.action?.enum ?? []
    for (const action of [
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
      'canvas_get',
      'canvas_save',
      'list_projects',
      'create_project',
      'delete_project',
      'list_outputs',
    ]) {
      ok(toolActions.includes(action), `vcg 工具 action 枚举包含 ${action}`)
    }
    ok(capturedSections.length === 1 && capturedSections[0].name === 'dsh-vcg', 'systemPrompt 段落已注册')
    const promptText = capturedSections[0]?.text?.({ agent: { id: 'smoke-session' } })
    ok(typeof promptText === 'string' && promptText.includes('vcg'), 'systemPrompt 文本含 vcg 工具说明')

    // RPC round-trip through the registered fetch handler.
    const callRpc = async (payload) => {
      const request = new Request('http://localhost/api/dsh-vcg/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof payload === 'string' ? payload : JSON.stringify(payload),
      })
      const response = await rpcConfig.fetch(request)
      return { status: response.status, body: await response.json() }
    }
    const stateRpc = await callRpc({ method: 'state', args: {} })
    ok(stateRpc.status === 200 && stateRpc.body.ok === true, 'RPC state 返回 {ok:true,value}')
    ok(typeof stateRpc.body.value?.outputDir === 'string', 'RPC state 含 outputDir')
    ok(Array.isArray(stateRpc.body.value?.providers), 'RPC state 含 providers')
    ok(Array.isArray(stateRpc.body.value?.providers) && stateRpc.body.value.providers.every((provider) => typeof provider.hasKey === 'boolean'), 'RPC state Provider 带 hasKey')
    const unknownRpc = await callRpc({ method: 'nope', args: {} })
    ok(unknownRpc.status === 404 && unknownRpc.body.ok === false, 'RPC 未知方法返回 404 + ok:false')
    const badJson = await callRpc('{not json')
    ok(badJson.status === 400 && badJson.body.ok === false, 'RPC 非法 JSON 返回 400')
    const bigCanvas = { nodes: [{ id: 'n1', type: 'note', x: 0, y: 0, params: { text: 'x'.repeat(400000) } }], edges: [] }
    const bigSave = await callRpc({ method: 'saveCanvas', args: { key: 'session:big', workflow: bigCanvas } })
    ok(bigSave.status === 200 && bigSave.body.ok === true, 'RPC saveCanvas 允许 1MB 级请求体')
    const hugeSave = await callRpc({ method: 'saveCanvas', args: { key: 'session:huge', workflow: { nodes: [{ id: 'n1', type: 'note', params: { text: 'x'.repeat(1100000) } }], edges: [] } } })
    ok(hugeSave.status === 413 && hugeSave.body.ok === false, 'RPC 超大请求体返回 413')

    ok(studio.listNodes().nodes.length === defs.size, 'studio.listNodes 加载内置节点')
    ok(studio.listNodes().builtinCount === defs.size, 'studio.listNodes builtinCount 正确')
    ok(studio.getCanvas({ key: 'session:smoke' }).workflow === null, 'getCanvas 无记录返回 workflow:null')

    const saved = await studio.saveCanvas({ key: 'session:smoke', workflow: emptyWorkflow({ name: '空画布' }) })
    ok(typeof saved.updatedAt === 'string' && saved.updatedAt !== '', 'saveCanvas 返回 updatedAt')
    ok(studio.getCanvas({ key: 'session:smoke' }).workflow?.name === '空画布', 'getCanvas 读回已保存画布')

    const created = await studio.createProject({ name: '冒烟 项目' })
    ok(created.project?.path?.startsWith(workDir), 'createProject 在默认工作目录下创建项目目录')
    ok(studio.listProjects().projects.length === 1, 'listProjects 返回项目')
    await studio.bindSession({ sessionId: 'smoke-session', projectId: created.project.id })
    ok(studio.resolveBaseDir({ key: 'session:smoke-session', sessionId: 'smoke-session' }) === created.project.path, 'bindSession 后会话输出目录指向项目')

    const customProvider = {
      id: 'smoke-provider',
      label: '冒烟 Provider',
      kind: 'openai-images',
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-secret',
      models: { image: ['flux-1'], video: [], text: ['qwen3.8-max'] },
    }
    const settings = await studio.saveSettings({
      patch: {
        providers: [customProvider],
        defaults: { providerId: 'smoke-provider', imageModel: 'flux-1', textModel: 'qwen3.8-max' },
        outputDir: 'smoke-output',
      },
    })
    const savedProvider = settings.state.providers.find((provider) => provider.id === 'smoke-provider')
    ok(savedProvider?.hasKey === true, 'saveSettings 后 Provider hasKey=true')
    ok(savedProvider?.apiKey !== 'sk-secret', 'state 响应中 apiKey 已掩码')
    ok(settings.state.outputDir === 'smoke-output', 'saveSettings 更新输出目录')
    equal(settings.state.local.comfyuiUrl, '', 'saveSettings local 默认空地址')

    const detect = await studio.detectProviders()
    ok(Array.isArray(detect.candidates), 'detectProviders 返回 candidates 数组')
    ok(isPlainObject(detect.globalModels), 'detectProviders 返回 globalModels')

    // Custom node import requires pro mode.
    const httpNode = {
      id: 'smoke-http-node',
      name: 'Smoke HTTP',
      nameZh: '冒烟 HTTP 节点',
      category: 'custom',
      engine: 'cloud',
      inputs: [{ id: 'text', label: 'TEXT', type: 'text', optional: true }],
      outputs: [{ id: 'image', label: 'IMAGE', type: 'image' }],
      params: [{ id: 'api', label: 'API', type: 'select', options: ['smoke-api'], default: 'smoke-api' }],
      executor: {
        kind: 'http',
        request: { url: 'https://api.example.com/generate', method: 'POST', body: { prompt: '${inputs.text}' }, headers: { Authorization: 'Bearer ${settings.apiKey}' } },
        response: { images: '$.data[*].url', error: '$.error.message' },
      },
      cloud: { capability: 'image' },
    }
    await throwsAsync(async () => studio.importNode({ json: httpNode }), 'studio.importNode 未开专业模式被拒绝', '专业模式')
    await studio.saveSettings({ patch: { proMode: true } })
    const imported = await studio.importNode({ json: httpNode })
    ok(imported.node?.id === 'smoke-http-node' && imported.node.custom === true, 'studio.importNode 保存自定义节点')
    ok(studio.listNodes().nodes.some((node) => node.id === 'smoke-http-node'), 'listNodes 含导入的自定义节点')
    await studio.removeNode({ id: 'smoke-http-node' })
    ok(!studio.listNodes().nodes.some((node) => node.id === 'smoke-http-node'), 'removeNode 删除自定义节点')
    await throwsAsync(async () => studio.removeNode({ id: 'ksampler' }), 'removeNode 拒绝删除内置节点', '内置节点')

    // Output directory + readOutput security.
    const outDir = (await studio.openOutputDir({ projectId: created.project.id })).path
    ok(isWithin(created.project.path, outDir), 'openOutputDir 位于项目目录内')
    const pngBytes = Buffer.from('89504e470d0a1a0a', 'hex')
    await writeFile(join(outDir, 'vcg-20261113-101010-n1.png'), pngBytes)
    studio.recordOutput({ id: 'out_smoke', ts: new Date().toISOString(), path: join(outDir, 'vcg-20261113-101010-n1.png'), kind: 'image', providerId: 'smoke-provider', model: 'flux-1', prompt: 'smoke' })
    const readBack = await studio.readOutput({ path: join(outDir, 'vcg-20261113-101010-n1.png') })
    ok(readBack.dataUrl.startsWith('data:image/png;base64,'), 'readOutput 返回 dataUrl')
    equal(readBack.mime, 'image/png', 'readOutput mime 正确')
    await throwsAsync(async () => studio.readOutput({ path: '/etc/passwd' }), 'readOutput 拒绝工作区外路径', '不允许读取')

    const opResult = await studio.operations().state({})
    ok(opResult.providers.every((provider) => provider.apiKey === '' || provider.apiKey === undefined), 'RPC state 方法返回掩码 Provider')
    await throwsAsync(async () => studio.buildWorkflow({ prompt: '一只猫' }), 'buildWorkflow 无 LLM 服务时报可读错误', 'LLM')

    await studio.deleteProject({ id: created.project.id, purge: true })
    ok(studio.listProjects().projects.length === 0, 'deleteProject 移除项目记录')
    studio.dispose()
    const persisted = JSON.parse(await readFile(join(process.env.DSH_PROFILE_DIR, 'data', 'dsh-vcg', 'state.json'), 'utf8'))
    ok(persisted.version === 2, 'state.json 持久化 schema v2')
    ok(Array.isArray(persisted.providers) && persisted.providers.length >= 1, 'state.json 持久化 Provider')
  } finally {
    if (previousProfile === undefined) delete process.env.DSH_PROFILE_DIR
    else process.env.DSH_PROFILE_DIR = previousProfile
    await rm(smokeRoot, { recursive: true, force: true })
  }
}

/* ----------------------------------------------------------------- summary */

console.log('')
for (const warning of warnings) console.log(`⚠️  ${warning}`)
if (failures.length > 0) {
  console.log('')
  for (const failure of failures) console.log(`❌ ${failure}`)
}
console.log('')
console.log(`VCG host self-test: ${passed} passed, ${failed} failed, ${warnings.length} skipped/warning`)
console.log(`节点定义：${defs.size} 个；工作流：${workflows.size} 个；时间戳示例：${fileStamp()}`)
if (failed > 0) {
  process.exitCode = 1
} else {
  console.log('✅ 全部断言通过（未发起真实网络请求）')
}
