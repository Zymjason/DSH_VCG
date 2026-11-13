/* ============================================================================
 * VCG 会话视图（聊天 → VCG 画布模式）
 *
 * 注册为 conversation.view 的一个页签（由 parts/apply.js 完成注册）。
 * 在传统对话消息区的位置渲染完整节点工作流画布，并在画布上方提供
 * 「AI 自动组建工作流」模块：用户用自然语言描述需求即可生成/改写画布。
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { React, h } = V
  const { Button, Field, TextArea, Banner, Spinner, Empty, IconButton, Glyph, Badge, Modal } = V.ui

  const VIEW_ID = 'vcg'

  /* ----------------------------------------------------- default workflow */

  /** Build the four-node starter workflow used before a canvas is saved. */
  function defaultWorkflow(defs) {
    const available = new Set((defs || []).map((def) => def.id))
    const nodes = []
    const edges = []
    let cursor = 0
    function push(type, x, y, params) {
      if (!available.has(type)) return null
      cursor += 1
      const id = 'n' + cursor
      nodes.push({ id, type, x, y, params: params || {}, title: '' })
      return id
    }
    const promptInput = push('prompt-input', 60, 120, {
      positive: 'a cyberpunk corgi wearing neon goggles, cinematic lighting, highly detailed',
      negative: 'lowres, blurry, watermark, text',
    })
    const modelLoader = push('model-loader', 60, 340, {})
    const emptyLatent = push('empty-latent-image', 60, 520, { width: 1280, height: 720, batch: 1 })
    const ksampler = push('ksampler', 400, 240, {})
    const vaeDecode = push('vae-decode', 720, 240, {})
    const imageOutput = push('image-output', 1000, 240, {})
    let edgeIndex = 0
    const link = (fromNode, fromPort, toNode, toPort) => {
      if (!fromNode || !toNode) return
      edgeIndex += 1
      edges.push({ id: 'e' + edgeIndex, from: { node: fromNode, port: fromPort }, to: { node: toNode, port: toPort } })
    }
    link(promptInput, 'positive', ksampler, 'positive')
    link(promptInput, 'negative', ksampler, 'negative')
    link(modelLoader, 'model', ksampler, 'model')
    link(emptyLatent, 'latent', ksampler, 'latent')
    link(ksampler, 'image', vaeDecode, 'image')
    link(vaeDecode, 'image', imageOutput, 'image')
    return {
      version: 1,
      id: 'wf-' + V.uid('canvas'),
      name: '未命名工作流',
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewport: { x: 0, y: 0, scale: 1 },
      nodes,
      edges,
    }
  }

  /* -------------------------------------------------------- AI build panel */

  /**
   * 画布上方的 AI 组建模块：自然语言 → 校验后的工作流 JSON。
   * @param {{workflow: object, onBuilt: (workflow: object) => void}} props
   */
  function AiBuilder({ workflow, onBuilt, disabled }) {
    const [prompt, setPrompt] = React.useState('')
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState('')
    const [reply, setReply] = React.useState('')
    const [notes, setNotes] = React.useState([])
    const [usedModel, setUsedModel] = React.useState('')

    const generate = async () => {
      const text = prompt.trim()
      if (text === '' || busy) return
      setBusy(true)
      setError('')
      setReply('')
      setNotes([])
      try {
        const result = await V.rpc('buildWorkflow', { prompt: text, current: workflow || undefined })
        if (!result || !result.workflow) throw new Error('AI 未返回可用工作流')
        onBuilt(result.workflow)
        setReply(result.reply || '')
        setNotes(Array.isArray(result.notes) ? result.notes : [])
        setUsedModel(result.usedModel || '')
        setPrompt('')
      } catch (err) {
        setError(V.messageOf(err))
      } finally {
        setBusy(false)
      }
    }

    return h(
      'div',
      { className: 'vcg-view-aibuild' },
      h(
        'div',
        { className: 'vcg-row', style: { gap: 6, marginBottom: 6 } },
        h('span', { className: 'vcg-view-aibuild-icon' }, h(Glyph, { name: 'sparkles', size: 15 })),
        h('span', { className: 'vcg-title', style: { fontSize: 13 } }, 'AI 自动组建工作流'),
        h('span', { className: 'vcg-subtitle' }, '用一句话描述画面与生成方式，自动生成/改写节点连线'),
        h('span', { style: { flex: 1 } }),
        usedModel ? h(Badge, null, usedModel) : null,
      ),
      h(
        'div',
        { className: 'vcg-row', style: { alignItems: 'flex-end', gap: 8 } },
        h(TextArea, {
          value: prompt,
          onChange: setPrompt,
          rows: 2,
          disabled: busy,
          placeholder: '例如：生成一张宽屏 16:9 的赛博朋克城市夜景，1280x720，负面词排除水印和低清；再给一个产品海报版本。',
          onKeyDown: (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault()
              generate()
            }
          },
        }),
        h(Button, { variant: 'primary', onClick: generate, disabled: busy || disabled, icon: busy ? undefined : 'sparkles' }, busy ? 'AI 正在搭建…' : '自动组建'),
      ),
      error ? h('div', { style: { marginTop: 6 } }, h(Banner, { kind: 'error', title: '自动组建失败' }, error)) : null,
      reply ? h('div', { style: { marginTop: 6 } }, h(Banner, { kind: 'success', title: '已生成工作流' }, reply)) : null,
      notes && notes.length > 0
        ? h('div', { style: { marginTop: 6 } }, h(Banner, { kind: 'warn', title: '自动修正 / 提示' }, notes.join('；')))
        : null,
    )
  }

  /* ------------------------------------------------------ live run merging */

  /**
   * Merge one `runStatus` node map into canvas results (§13.2): pending nodes
   * are skipped (so an upcoming node keeps its previous `running` marker),
   * running nodes show the running state, finished nodes take the full result.
   */
  function mergeRunNodes(previous, nodes) {
    const next = Object.assign({}, previous || {})
    if (!nodes || typeof nodes !== 'object') return next
    for (const nodeId of Object.keys(nodes)) {
      const entry = nodes[nodeId]
      if (!entry || typeof entry !== 'object') continue
      if (entry.status === 'pending') {
        next[nodeId] = { status: 'pending' }
        continue
      }
      if (entry.status === 'running') {
        next[nodeId] = { status: 'running' }
        continue
      }
      next[nodeId] = {
        status: entry.status === 'error' ? 'error' : 'done',
        images: Array.isArray(entry.images) ? entry.images : [],
        text: typeof entry.text === 'string' ? entry.text : '',
        video: entry.video == null ? null : entry.video,
        error: typeof entry.error === 'string' ? entry.error : '',
        ms: Number(entry.ms) || 0,
        ...(entry.skipped ? { skipped: true } : {}),
      }
    }
    return next
  }

  /* --------------------------------------------------------- canvas view */

  /**
   * 会话内的 VCG 画布视图（conversation.view 入口）。
   * @param {object} props - inject 提供的 sessionId + view owner props。
   */
  function ChatCanvasView(props) {
    const sessionId = props && props.sessionId
    const store = V.useStore()
    const state = store.state
    const [nodeDefs, setNodeDefs] = React.useState([])
    const [workflow, setWorkflow] = React.useState(null)
    const [results, setResults] = React.useState({})
    const [selectedId, setSelectedId] = React.useState(null)
    const [running, setRunning] = React.useState(false)
    const [fullscreen, setFullscreen] = React.useState(false)
    const [debugBusy, setDebugBusy] = React.useState(false)
    const [debugReport, setDebugReport] = React.useState(null)
    const [debugError, setDebugError] = React.useState('')
    const [saving, setSaving] = React.useState(false)
    const [loadError, setLoadError] = React.useState('')
    const [runError, setRunError] = React.useState('')
    const [notice, setNotice] = React.useState('')
    const [ready, setReady] = React.useState(false)
    const [lastSaved, setLastSaved] = React.useState('')
    const runToken = React.useRef(0)
    const loadedRef = React.useRef(false)
    const canvasKey = sessionId ? 'session:' + sessionId : 'session:default'
    /* Run-record polling (§13.2): one interval at a time, always torn down. */
    const pollTimer = React.useRef(null)
    const pollSeq = React.useRef(0)
    const stopPolling = React.useCallback(() => {
      // Invalidate in-flight poll responses so a late reply cannot overwrite
      // the authoritative `results` right after the run resolves.
      pollSeq.current += 1
      if (pollTimer.current !== null) {
        clearInterval(pollTimer.current)
        pollTimer.current = null
      }
    }, [])
    const startPolling = React.useCallback(
      (token) => {
        stopPolling()
        pollTimer.current = setInterval(() => {
          if (token !== runToken.current) {
            stopPolling()
            return
          }
          const seq = ++pollSeq.current
          V.rpc('runStatus', { key: canvasKey, sessionId: sessionId || undefined })
            .then((value) => {
              if (token !== runToken.current) return
              // Drop an out-of-order response: a later poll already applied.
              if (seq !== pollSeq.current) return
              const run = value && value.run
              if (!run || !run.nodes) return
              setResults((previous) => mergeRunNodes(previous, run.nodes))
            })
            .catch(() => {
              /* a failed poll must not interrupt the running workflow */
            })
        }, 500)
      },
      [canvasKey, sessionId, stopPolling],
    )
    React.useEffect(() => stopPolling, [stopPolling])

    /* Load node definitions, saved canvas and host state on mount. */
    React.useEffect(() => {
      let alive = true
      setReady(false)
      setLoadError('')
      loadedRef.current = false
      async function load() {
        try {
          if (!V.store.state) await V.refresh().catch(() => {})
          const nodes = await V.rpc('listNodes')
          if (!alive) return
          const defs = (nodes && nodes.nodes) || []
          setNodeDefs(defs)
          let saved = null
          try {
            saved = await V.rpc('getCanvas', { key: canvasKey })
          } catch {
            saved = null
          }
          if (!alive) return
          const existing = saved && saved.workflow
          if (existing && Array.isArray(existing.nodes) && existing.nodes.length > 0) {
            setWorkflow(existing)
            if (existing.viewport) setViewportHint(existing.viewport)
          } else {
            setWorkflow(defaultWorkflow(defs))
          }
          setLastSaved((saved && saved.updatedAt) || '')
        } catch (err) {
          if (alive) setLoadError(V.messageOf(err))
        } finally {
          if (alive) {
            setReady(true)
            loadedRef.current = true
          }
        }
      }
      load()
      return () => {
        alive = false
      }
    }, [canvasKey])

    const [viewportHint, setViewportHint] = React.useState(null)

    /* Debounced autosave; skipped until the initial load completes. */
    const saveTimer = React.useRef(null)
    const persist = React.useCallback(
      (next) => {
        if (!next || !loadedRef.current) return
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(async () => {
          setSaving(true)
          try {
            const value = await V.rpc('saveCanvas', { key: canvasKey, workflow: next })
            setLastSaved((value && value.updatedAt) || new Date().toISOString())
            setNotice('')
          } catch (err) {
            setNotice('自动保存失败：' + V.messageOf(err))
          } finally {
            setSaving(false)
          }
        }, 700)
      },
      [canvasKey],
    )
    React.useEffect(
      () => () => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
      },
      [],
    )

    const onChange = React.useCallback(
      (next) => {
        setWorkflow(next)
        persist(next)
      },
      [persist],
    )

    /* Run the whole workflow through the Host engine. */
    const runAll = async () => {
      if (!workflow || running) return
      const token = ++runToken.current
      setRunning(true)
      setRunError('')
      const seeded = {}
      for (const node of workflow.nodes) seeded[node.id] = { status: 'running' }
      setResults(seeded)
      startPolling(token)
      try {
        const value = await V.rpc('runWorkflow', { key: canvasKey, workflow, sessionId: sessionId || undefined })
        if (token !== runToken.current) return
        if (value && value.results) setResults(value.results)
        if (value && value.error) setRunError(value.error)
      } catch (err) {
        if (token !== runToken.current) return
        setRunError(V.messageOf(err))
        setResults((prev) => {
          const next = {}
          for (const key of Object.keys(prev || {})) next[key] = { status: 'error', error: V.messageOf(err) }
          return next
        })
      } finally {
        if (token === runToken.current) {
          stopPolling()
          setRunning(false)
        }
      }
    }

    /* Run one node (its upstream dependencies are resolved by the Host). */
    const runNode = async (nodeId) => {
      if (!workflow || running) return
      const token = ++runToken.current
      setRunning(true)
      setRunError('')
      setResults((prev) => Object.assign({}, prev, { [nodeId]: { status: 'running' } }))
      startPolling(token)
      try {
        const value = await V.rpc('runNode', { key: canvasKey, nodeId, workflow, sessionId: sessionId || undefined })
        if (token !== runToken.current) return
        const result = value && value.result
        if (result) setResults((prev) => Object.assign({}, prev, { [nodeId]: result }))
      } catch (err) {
        if (token !== runToken.current) return
        setRunError(V.messageOf(err))
        setResults((prev) => Object.assign({}, prev, { [nodeId]: { status: 'error', error: V.messageOf(err) } }))
      } finally {
        if (token === runToken.current) {
          stopPolling()
          setRunning(false)
        }
      }
    }

    const stop = () => {
      runToken.current += 1
      stopPolling()
      setRunning(false)
      setNotice('已停止等待当前运行结果（云端请求可能仍在服务端完成）。')
    }

    /* Debug 运行：只校验模型可加载性/完整性/安全性，不生成内容。 */
    const debugRun = async () => {
      if (!workflow || debugBusy) return
      setDebugBusy(true)
      setDebugError('')
      try {
        const report = await V.rpc('debugWorkflow', {
          key: canvasKey,
          workflow,
          sessionId: sessionId || undefined,
        })
        setDebugReport(report)
      } catch (err) {
        setDebugError(V.messageOf(err))
      } finally {
        setDebugBusy(false)
      }
    }

    /* 画布全屏：固定覆盖整个窗口，Esc 退出。 */
    const toggleFullscreen = () => setFullscreen((value) => !value)
    React.useEffect(() => {
      if (!fullscreen) return undefined
      const onKey = (event) => {
        if (event.key === 'Escape') setFullscreen(false)
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }, [fullscreen])

    const openChat = () => {
      if (props && typeof props.openView === 'function') props.openView('chat', '')
      else if (props && typeof props.completeViewRequest === 'function') props.completeViewRequest()
    }

    const outputDirHint = state && state.outputDir ? '输出目录：工作区 / ' + state.outputDir : '输出目录：工作区 / vcg-output'

    if (!ready) {
      return h(
        'div',
        { className: 'vcg-root vcg-view' },
        h(V.StyleTag, null),
        h('style', { dangerouslySetInnerHTML: { __html: VIEW_CSS } }),
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
          h(Spinner, { label: '正在载入 VCG 画布…' }),
        ),
      )
    }

    return h(
      'div',
      { className: 'vcg-root vcg-view' + (fullscreen ? ' vcg-view-full' : ''), onContextMenu: (event) => event.preventDefault() },
      h(V.StyleTag, null),
      h('style', { dangerouslySetInnerHTML: { __html: VIEW_CSS } }),
      loadError ? h('div', { style: { padding: '8px 12px 0' } }, h(Banner, { kind: 'error', title: 'VCG 画布载入失败' }, loadError)) : null,
      h(
        'div',
        { className: 'vcg-view-top' },
        h(
          'div',
          { className: 'vcg-view-topbar' },
          h('span', { className: 'vcg-view-brand' }, h(Glyph, { name: 'sparkles', size: 15 }), 'VCG 视觉控制生成器'),
          h(Badge, { color: '#7c5cff' }, (store.state && store.state.local && store.state.local.enabled ? '本地运算' : '云端 API')),
          store.state && store.state.defaults && store.state.defaults.imageModel
            ? h(Badge, null, store.state.defaults.imageModel)
            : null,
          h('span', { className: 'vcg-subtitle' }, outputDirHint),
          h('span', { style: { flex: 1 } }),
          saving ? h('span', { className: 'vcg-subtitle' }, '保存中…') : lastSaved ? h('span', { className: 'vcg-subtitle' }, '已保存 ' + V.formatTime(lastSaved)) : null,
          h(
            IconButton,
            { label: fullscreen ? '退出全屏' : '全屏画布', title: fullscreen ? '退出全屏（Esc）' : '全屏画布', onClick: toggleFullscreen },
            h(Glyph, { name: fullscreen ? 'close' : 'fit', size: 15 }),
          ),
          h(Button, { size: 'sm', variant: 'ghost', icon: 'back', onClick: openChat }, '切换到对话'),
        ),
        h(AiBuilder, { workflow, onBuilt: (next) => onChange(next), disabled: running }),
      ),
      runError ? h('div', { style: { padding: '0 12px 6px' } }, h(Banner, { kind: 'error', title: '运行失败', action: h(IconButton, { label: '关闭', onClick: () => setRunError('') }, h(Glyph, { name: 'close', size: 14 })) }, runError)) : null,
      notice ? h('div', { style: { padding: '0 12px 6px' } }, h(Banner, { kind: 'info' }, notice)) : null,
      debugError ? h('div', { style: { padding: '0 12px 6px' } }, h(Banner, { kind: 'error', title: 'Debug 运行失败' }, debugError)) : null,
      h(Modal, {
        open: Boolean(debugReport),
        title: 'Debug 运行报告（不生成内容）',
        onClose: () => setDebugReport(null),
        width: 'min(760px,100%)',
        footer: [
          h('span', { key: 'hint', className: 'vcg-subtitle', style: { flex: 1 } }, debugReport && debugReport.ok ? '所有必需检查通过，可以正式运行。' : '存在失败项，请按提示修正后再运行。'),
          h(Button, { key: 'close', onClick: () => setDebugReport(null) }, '关闭'),
          debugReport && debugReport.ok
            ? h(Button, { key: 'run', variant: 'primary', icon: 'play', onClick: () => { setDebugReport(null); runAll() } }, '正式运行')
            : null,
        ],
      }, h(V.ui.DebugReport, { report: debugReport })),
      h(
        'div',
        { className: 'vcg-view-canvas' },
        nodeDefs.length === 0
          ? h(Empty, { title: '还没有节点定义', hint: '请到「设置 → VCG 视觉控制生成器 → 节点仓库」同步节点，或确认 DSH_VCG/nodes 中已有节点 JSON。', icon: 'layers' })
          : workflow
            ? h(V.Canvas, {
                key: canvasKey,
                workflow,
                nodeDefs,
                results,
                selectedId,
                onSelect: setSelectedId,
                onChange,
                onRunNode: runNode,
                onRunAll: runAll,
                onDebugRun: debugRun,
                debugBusy,
                onStop: stop,
                running,
                readOnly: false,
                outputDirHint,
              })
            : null,
      ),
    )
  }

  const VIEW_CSS = `
.vcg-view{height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.vcg-view-top{display:flex;flex-direction:column;gap:8px;padding:10px 12px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);flex:none}
.vcg-view-topbar{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}
.vcg-view-brand{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;white-space:nowrap}
.vcg-view-aibuild{display:flex;flex-direction:column;gap:2px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:10px;padding:8px 10px}
.vcg-view-aibuild-icon{color:var(--dsw-alias-brand-primary);display:inline-flex}
.vcg-view-canvas{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.vcg-view-full{position:fixed;inset:0;z-index:80;background:var(--dsw-alias-bg-base);height:100vh;width:100vw;box-shadow:0 0 0 1px var(--dsw-alias-border-l2)}
`

  V.ChatCanvasView = ChatCanvasView
  V.__vcgViewId = VIEW_ID
  V.__defaultWorkflow = defaultWorkflow
})(V)
