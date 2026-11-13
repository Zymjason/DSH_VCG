/* ============================================================================
 * VCG 视觉控制生成器 — 节点工作流仓库页（侧栏「VCG 节点工作流仓库」）
 * Visual Control Generator — node/workflow repository browser (V.NodeRepoPage).
 *
 * 浏览 DSH_VCG_repo 节点仓库：分类 + 搜索 + 卡片网格 + 节点详情 Modal，
 * 按需导入节点（专业模式保护）、查看仓库工作流、管理已安装自定义节点。
 * 所有数据走 V.rpc，纯 React.createElement，无 JSX / 无模块 import；
 * 视觉只使用宿主主题 token（--dsw-alias-*）与 V.consts 颜色。
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { React, h } = V
  const {
    Button,
    TextInput,
    Select,
    Banner,
    Spinner,
    Badge,
    Modal,
    Empty,
    StyleTag,
  } = V.ui

  /* ------------------------------------------------------------- locales */

  V.addDict(
    {
      repoTitle: 'VCG 节点工作流仓库',
      repoDesc: '浏览 DSH_VCG_repo 节点仓库中的节点与工作流定义，按分类挑选需要的节点导入本地节点库；导入后即可在画布中使用。',
      repoSourceLabel: '仓库来源',
      repoSourceAuto: '自动（优先 GitHub）',
      repoSourceGithub: 'GitHub',
      repoSourceGitea: 'Gitea',
      repoGithubBase: 'GitHub raw 源',
      repoGiteaBase: 'Gitea raw 源',
      repoCurrentBase: '当前拉取地址',
      repoNotConfigured: '未配置',
      repoAddressHint: '仓库地址来自设置（只读）。修改请到「设置 → VCG 视觉控制生成器 → 节点仓库」。',
      repoRefresh: '刷新仓库',
      repoRefreshing: '刷新中…',
      repoSyncAll: '全部同步',
      repoSyncing: '同步中…',
      repoSyncDone: '仓库同步完成',
      repoSyncFailed: '仓库同步失败',
      repoSyncSummary: '节点 {nodes} 个 · 工作流 {workflows} 个',
      repoFetchFailed: '仓库列表加载失败',
      repoLoadFailed: '仓库加载失败',
      repoRetry: '重试',
      repoFetchedAt: '拉取时间',
      repoVersion: '仓库版本',
      repoCounts: '节点 {nodes} · 工作流 {workflows}',
      repoConfigureHint: '未配置节点仓库地址。请到「设置 → VCG 视觉控制生成器 → 节点仓库」填写 GitHub / Gitea raw 源后再刷新。',
      repoOpenSettings: '去设置中配置',
      repoWarnings: '仓库警告',
      repoProOn: '专业模式已开启',
      repoProOff: '专业模式未开启',
      repoProHintTitle: '专业模式提示',
      repoProHint: '该节点通过 HTTP 调用外部 API，导入前需要在「设置 → VCG 视觉控制生成器 → 专业模式」中开启专业模式。',
      repoNodePro: '专业模式',
      repoHttpNode: 'HTTP 节点',
      repoSearchPh: '搜索节点名称 / 中文名 / id / 描述',
      repoAll: '全部',
      repoNodesTitle: '仓库节点',
      repoBrowserHint: '点击卡片查看节点详情，勾选后可批量导入。',
      repoNodesEmpty: '没有匹配的节点',
      repoNodesEmptyHint: '换个分类或清空搜索词试试；也可以在顶部切换仓库来源。',
      repoLoading: '正在拉取节点仓库…',
      repoPortsValue: '输入 {inputs} · 输出 {outputs}',
      repoParamsCount: '参数 {count}',
      repoInstalled: '已安装',
      repoNeedPro: '需专业模式',
      repoAvailable: '可导入',
      repoDetails: '详情',
      repoSelectNode: '选择节点 {name}',
      repoNoDescription: '（暂无描述）',
      repoImport: '导入节点',
      repoImporting: '导入中…',
      repoImportSelected: '导入所选 {count} 个',
      repoClearSelection: '清空选择',
      repoSelectAll: '全选可导入',
      repoSelectedCount: '已选 {count} 个',
      repoNoSelection: '请先勾选要导入的节点。',
      repoBulkTitle: '批量导入结果',
      repoBulkSummary: '成功 {ok} 个 · 失败 {fail} 个',
      repoBulkProgress: '导入中 {done}/{total}',
      repoImportSuccessTitle: '节点导入成功',
      repoImportOk: '已导入 {name}',
      repoImportFailed: '导入失败',
      repoImportNeedProTitle: '该节点需要专业模式',
      repoCannotImport: '该节点当前不可导入。',
      repoInstalledHint: '该节点已安装，可直接在画布中使用。',
      repoPortsInputs: '输入端口',
      repoPortsOutputs: '输出端口',
      repoNoPorts: '无',
      repoOptional: '可选',
      repoParamsTitle: '参数',
      repoNoParams: '无参数',
      repoParamDefault: '默认',
      repoParamRange: '范围',
      repoParamOptions: '可选值',
      repoExecutorTitle: '执行器',
      repoExecutorKind: '类型',
      repoExecutorBuiltin: '内置执行器',
      repoExecutorFn: '内置函数',
      repoExecutorHttp: 'HTTP 请求',
      repoExecutorComfy: 'ComfyUI 节点',
      repoRequestUrl: '请求地址',
      repoRequestMethod: '请求方法',
      repoRequestHeaders: '请求头字段',
      repoRequestTimeout: '超时（毫秒）',
      repoResponse: '响应取值字段',
      repoCloudTitle: '云端能力',
      repoCloudCapability: '能力',
      repoCloudApi: '所需 API',
      repoCloudNotes: '说明',
      repoCapImage: '图像',
      repoCapVideo: '视频',
      repoCapText: '文本',
      repoCapNone: '无',
      repoLocalTitle: '本地 ComfyUI',
      repoLocalClassType: 'class_type',
      repoLocalMap: '字段映射',
      repoLocalMapCount: '{count} 项',
      repoLocalNone: '未声明本地 ComfyUI 映射',
      repoSourceBadge: '来源',
      repoDetailId: '节点 id',
      repoDetailCategory: '分类',
      repoDetailEngine: '引擎',
      repoInstalledTitle: '已安装自定义节点',
      repoInstalledDesc: '通过专业模式 JSON 导入或本页导入的自定义节点。节点仓库同步的节点不在此处删除。',
      repoInstalledEmpty: '还没有导入自定义节点。可从上方节点卡片导入。',
      repoDelete: '删除',
      repoConfirmDelete: '确认删除？',
      repoDeleteOk: '已删除节点 {id}',
      repoDeleteFail: '删除节点失败',
      repoDeleting: '删除中…',
      repoDeleteSuccessTitle: '节点删除成功',
      repoWorkflowsTitle: '仓库工作流',
      repoWorkflowsDesc: '仓库自带的示例工作流（随节点仓库同步）。本页仅展示，不提供导入。',
      repoWorkflowsEmpty: '仓库没有提供工作流。',
      repoWorkflowNodes: '{count} 个节点',
      repoWorkflowInstalled: '已可用',
      repoWorkflowMissing: '未同步',
      repoWorkflowHint: '打开工作流请到「VCG 工作台 → 工作流」；仓库地址可在设置中配置。',
      repoSettingsLink: '在设置中配置仓库地址',
      repoSettingsUnavailableTitle: '无法打开设置页',
      repoSettingsUnavailable: '请手动打开「设置 → VCG 视觉控制生成器」调整节点仓库或专业模式。',
      repoStoreError: '宿主状态加载失败',
      repoNoMatch: '没有匹配结果',
      repoCategoryEmpty: '该分类下暂无节点',
      repoStoreLoading: '正在加载宿主状态…',
    },
    {
      repoTitle: 'VCG Node & Workflow Repository',
      repoDesc: 'Browse node and workflow definitions in the DSH_VCG_repo repository, filter them by category, and import the nodes you need into the local node library.',
      repoSourceLabel: 'Repository source',
      repoSourceAuto: 'Auto (prefer GitHub)',
      repoSourceGithub: 'GitHub',
      repoSourceGitea: 'Gitea',
      repoGithubBase: 'GitHub raw source',
      repoGiteaBase: 'Gitea raw source',
      repoCurrentBase: 'Current base URL',
      repoNotConfigured: 'Not configured',
      repoAddressHint: 'Addresses come from Settings (read-only). Edit them in Settings → VCG Visual Control Generator → Node repository.',
      repoRefresh: 'Refresh repository',
      repoRefreshing: 'Refreshing…',
      repoSyncAll: 'Sync all',
      repoSyncing: 'Syncing…',
      repoSyncDone: 'Repository sync complete',
      repoSyncFailed: 'Repository sync failed',
      repoSyncSummary: '{nodes} nodes · {workflows} workflows',
      repoFetchFailed: 'Failed to load the repository',
      repoLoadFailed: 'Failed to load the repository',
      repoRetry: 'Retry',
      repoFetchedAt: 'Fetched at',
      repoVersion: 'Repository version',
      repoCounts: '{nodes} nodes · {workflows} workflows',
      repoConfigureHint: 'No node repository address configured. Fill in a GitHub / Gitea raw source in Settings → VCG Visual Control Generator → Node repository, then refresh.',
      repoOpenSettings: 'Open Settings',
      repoWarnings: 'Repository warnings',
      repoProOn: 'Pro mode on',
      repoProOff: 'Pro mode off',
      repoProHintTitle: 'Pro mode required',
      repoProHint: 'This node calls an external API over HTTP. Enable Pro mode in Settings → VCG Visual Control Generator → Pro mode before importing it.',
      repoNodePro: 'Pro mode',
      repoHttpNode: 'HTTP node',
      repoSearchPh: 'Search name / Chinese name / id / description',
      repoAll: 'All',
      repoNodesTitle: 'Repository nodes',
      repoBrowserHint: 'Open a card for details; tick cards to import them in bulk.',
      repoNodesEmpty: 'No matching nodes',
      repoNodesEmptyHint: 'Try another category or clear the search; you can also switch the repository source above.',
      repoLoading: 'Fetching the node repository…',
      repoPortsValue: 'in {inputs} · out {outputs}',
      repoParamsCount: '{count} params',
      repoInstalled: 'Installed',
      repoNeedPro: 'Needs Pro mode',
      repoAvailable: 'Importable',
      repoDetails: 'Details',
      repoSelectNode: 'Select node {name}',
      repoNoDescription: '(no description)',
      repoImport: 'Import node',
      repoImporting: 'Importing…',
      repoImportSelected: 'Import selected ({count})',
      repoClearSelection: 'Clear selection',
      repoSelectAll: 'Select all importable',
      repoSelectedCount: '{count} selected',
      repoNoSelection: 'Tick at least one node to import first.',
      repoBulkTitle: 'Batch import result',
      repoBulkSummary: '{ok} succeeded · {fail} failed',
      repoBulkProgress: 'Importing {done}/{total}',
      repoImportSuccessTitle: 'Node imported',
      repoImportOk: 'Imported {name}',
      repoImportFailed: 'Import failed',
      repoImportNeedProTitle: 'This node requires Pro mode',
      repoCannotImport: 'This node cannot be imported right now.',
      repoInstalledHint: 'This node is installed and ready to use on the canvas.',
      repoPortsInputs: 'Input ports',
      repoPortsOutputs: 'Output ports',
      repoNoPorts: 'None',
      repoOptional: 'Optional',
      repoParamsTitle: 'Parameters',
      repoNoParams: 'No parameters',
      repoParamDefault: 'Default',
      repoParamRange: 'Range',
      repoParamOptions: 'Options',
      repoExecutorTitle: 'Executor',
      repoExecutorKind: 'Kind',
      repoExecutorBuiltin: 'Built-in executor',
      repoExecutorFn: 'Built-in function',
      repoExecutorHttp: 'HTTP request',
      repoExecutorComfy: 'ComfyUI node',
      repoRequestUrl: 'Request URL',
      repoRequestMethod: 'Method',
      repoRequestHeaders: 'Header fields',
      repoRequestTimeout: 'Timeout (ms)',
      repoResponse: 'Response fields',
      repoCloudTitle: 'Cloud capability',
      repoCloudCapability: 'Capability',
      repoCloudApi: 'Required API',
      repoCloudNotes: 'Notes',
      repoCapImage: 'Image',
      repoCapVideo: 'Video',
      repoCapText: 'Text',
      repoCapNone: 'None',
      repoLocalTitle: 'Local ComfyUI',
      repoLocalClassType: 'class_type',
      repoLocalMap: 'Field mapping',
      repoLocalMapCount: '{count} entries',
      repoLocalNone: 'No local ComfyUI mapping declared',
      repoSourceBadge: 'Source',
      repoDetailId: 'Node id',
      repoDetailCategory: 'Category',
      repoDetailEngine: 'Engine',
      repoInstalledTitle: 'Installed custom nodes',
      repoInstalledDesc: 'Custom nodes imported via Pro-mode JSON or from this page. Nodes synced from the repository cannot be deleted here.',
      repoInstalledEmpty: 'No custom nodes imported yet. Import one from a node card above.',
      repoDelete: 'Delete',
      repoConfirmDelete: 'Confirm delete?',
      repoDeleteOk: 'Node {id} deleted',
      repoDeleteFail: 'Failed to delete the node',
      repoDeleting: 'Deleting…',
      repoDeleteSuccessTitle: 'Node deleted',
      repoWorkflowsTitle: 'Repository workflows',
      repoWorkflowsDesc: 'Example workflows shipped with the repository (synced with it). Display only — no import action here.',
      repoWorkflowsEmpty: 'The repository provides no workflows.',
      repoWorkflowNodes: '{count} nodes',
      repoWorkflowInstalled: 'Available',
      repoWorkflowMissing: 'Not synced',
      repoWorkflowHint: 'Open workflows in VCG Studio → Workflows; configure the repository address in Settings.',
      repoSettingsLink: 'Configure the repository address in Settings',
      repoSettingsUnavailableTitle: 'Cannot open Settings',
      repoSettingsUnavailable: 'Open Settings → VCG Visual Control Generator manually to adjust the node repository or Pro mode.',
      repoStoreError: 'Failed to load the Host state',
      repoNoMatch: 'No matching result',
      repoCategoryEmpty: 'No nodes in this category',
      repoStoreLoading: 'Loading the Host state…',
    },
  )

  const t = (key, vars) => V.t(key, vars)
  const msgOf = (error) => V.messageOf(error)
  const asArray = (value) => (Array.isArray(value) ? value : [])
  const str = (value) => (value === undefined || value === null ? '' : String(value))

  const CATEGORY_EN = {
    input: 'Input / Prompt',
    model: 'Models',
    latent: 'Latent / Size',
    sampling: 'Sampling',
    decode: 'Decode / Output',
    video: 'Video',
    utility: 'Utility / Notes',
    custom: 'Custom API nodes',
  }
  const CATEGORY_ORDER = new Map(V.consts.NODE_CATEGORIES.map((category, index) => [category.id, index]))
  const ENGINE_KEYS = { cloud: 'cloud', local: 'local', both: 'both' }

  /* -------------------------------------------------------------- helpers */

  function engineText(engine) {
    const key = ENGINE_KEYS[engine]
    if (key) return t(key)
    return V.consts.ENGINE_LABELS[engine] || str(engine) || '—'
  }

  function engineColor(engine) {
    return V.consts.ENGINE_COLORS[engine] || undefined
  }

  function categoryText(category) {
    const id = str(category)
    if (id === '') return '—'
    if (V.localeId() === 'en') return CATEGORY_EN[id] || id
    return V.categoryLabel(id)
  }

  function capabilityText(capability) {
    const id = str(capability)
    if (id === 'image') return t('repoCapImage')
    if (id === 'video') return t('repoCapVideo')
    if (id === 'text') return t('repoCapText')
    if (id === '' || id === 'none') return t('repoCapNone')
    return id
  }

  function requiresProMode(node) {
    if (!node || typeof node !== 'object') return false
    if (node.requiresPro === true) return true
    return Boolean(node.executor && node.executor.kind === 'http')
  }

  /** Only imported custom nodes may be removed; repo / builtin nodes are protected. */
  function isImportedCustom(node) {
    if (!node || typeof node !== 'object') return false
    const source = str(node.source)
    if (source === 'builtin' || source === 'repo') return false
    if (node.custom === true) return true
    return source === 'custom' || source === 'imported'
  }

  function nodeTitle(node) {
    if (!node || typeof node !== 'object') return '—'
    return str(node.nameZh) || str(node.name) || str(node.id) || '—'
  }

  function nodeSubtitle(node) {
    if (!node || typeof node !== 'object') return ''
    const parts = []
    if (node.name) parts.push(str(node.name))
    if (node.id) parts.push(str(node.id))
    return parts.join(' · ')
  }

  function paramDefaultText(param) {
    if (!param || param.default === undefined || param.default === null) return '—'
    try {
      const text = JSON.stringify(param.default)
      return text === undefined ? str(param.default) : text
    } catch {
      return str(param.default)
    }
  }

  function paramRangeText(param) {
    if (!param) return ''
    const min = param.min
    const max = param.max
    if (min === undefined && max === undefined) return ''
    return (min === undefined ? '−∞' : str(min)) + ' ~ ' + (max === undefined ? '+∞' : str(max))
  }

  function normalizeRepoData(data) {
    const repo = data && typeof data === 'object' ? data : {}
    return {
      source: str(repo.source),
      base: str(repo.base),
      version: repo.version === undefined || repo.version === null ? '' : str(repo.version),
      fetchedAt: str(repo.fetchedAt),
      warnings: asArray(repo.warnings).map((warning) => str(warning)).filter(Boolean),
      nodes: asArray(repo.nodes).filter((node) => node && typeof node === 'object'),
      workflows: asArray(repo.workflows).filter((workflow) => workflow && typeof workflow === 'object'),
    }
  }

  function matchesSearch(node, query) {
    const needle = str(query).trim().toLowerCase()
    if (needle === '') return true
    return [node.name, node.nameZh, node.id, node.description, node.category, node.nameZh]
      .some((value) => str(value).toLowerCase().indexOf(needle) >= 0)
  }

  /* ------------------------------------------------------------ ui: pieces */

  function Notice({ notice, onClose }) {
    if (!notice) return null
    const items = asArray(notice.items).filter(Boolean)
    return h(
      Banner,
      {
        kind: notice.kind || 'info',
        title: notice.title,
        action: onClose
          ? h(Button, { size: 'sm', variant: 'ghost', onClick: onClose }, t('close'))
          : null,
      },
      notice.message ? h('div', null, notice.message) : null,
      items.length
        ? h(
            'div',
            { className: 'vcg-repo-notice-list' },
            items.map((item, index) =>
              h(
                'div',
                { key: index, className: 'vcg-repo-notice-item' },
                '· ' + str(item.label),
                item.error ? h('span', { className: 'vcg-repo-notice-error' }, '：' + str(item.error)) : null,
              ),
            ),
          )
        : null,
    )
  }

  function PortRow({ port }) {
    const type = str(port && port.type) || 'any'
    return h(
      'div',
      { className: 'vcg-repo-port' },
      h('span', { className: 'vcg-repo-dot', style: { background: V.portColor(type) } }),
      h('span', { className: 'vcg-repo-port-label' }, str(port && (port.label || port.id)) || '—'),
      h('span', { className: 'vcg-repo-port-type' }, type.toUpperCase()),
      port && port.optional === true ? h(Badge, null, t('repoOptional')) : null,
    )
  }

  function DetailBlock({ title, extra, children }) {
    return h(
      'div',
      { className: 'vcg-repo-detail-block' },
      h(
        'div',
        { className: 'vcg-repo-detail-block-head' },
        h('span', { className: 'vcg-repo-detail-block-title' }, title || ''),
        extra || null,
      ),
      h('div', { className: 'vcg-repo-detail-block-body' }, children),
    )
  }

  function KVRow({ label, children, mono }) {
    return h(
      'div',
      { className: 'vcg-repo-kv-row' },
      h('span', { className: 'vcg-repo-kv-key' }, label),
      h('span', { className: 'vcg-repo-kv-val' + (mono ? ' vcg-repo-mono' : '') }, children),
    )
  }

  function ParamRow({ param }) {
    const extras = []
    const options = asArray(param && param.options)
    if (options.length) extras.push(t('repoParamOptions') + '：' + options.map(str).join(' / '))
    const range = paramRangeText(param)
    if (range !== '') extras.push(t('repoParamRange') + '：' + range)
    return h(
      'div',
      { className: 'vcg-repo-param-row' },
      h(
        'div',
        { className: 'vcg-repo-param-main' },
        h('div', { className: 'vcg-repo-param-name' }, str(param && (param.label || param.id)) || '—'),
        h('div', { className: 'vcg-repo-param-id' }, str(param && param.id)),
      ),
      h(Badge, null, str(param && param.type) || 'any'),
      h('span', { className: 'vcg-repo-param-default' }, t('repoParamDefault') + ' ' + paramDefaultText(param)),
      extras.length ? h('div', { className: 'vcg-repo-param-extra' }, extras.join('；')) : null,
    )
  }

  function NodeCard({ node, installed, blocked, devLocked, unreviewed, importable, selected, locked, onToggle, onOpen }) {
    const inputs = asArray(node.inputs)
    const outputs = asArray(node.outputs)
    const classes = ['vcg-repo-card']
    if (selected) classes.push('vcg-repo-card-selected')
    if (installed) classes.push('vcg-repo-card-installed')
    const title = nodeTitle(node)
    const subtitle = nodeSubtitle(node)
    return h(
      'div',
      {
        className: classes.join(' '),
        role: 'button',
        tabIndex: 0,
        title: str(node.description) || str(node.id),
        onClick: () => onOpen(node.id),
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onOpen(node.id)
          }
        },
      },
      h(
        'div',
        { className: 'vcg-repo-card-head' },
        h('input', {
          type: 'checkbox',
          className: 'vcg-repo-check',
          checked: Boolean(selected),
          disabled: !importable || locked,
          'aria-label': t('repoSelectNode', { name: title }),
          onClick: (event) => event.stopPropagation(),
          onChange: () => onToggle(node.id),
        }),
        h(
          'div',
          { className: 'vcg-repo-card-title' },
          h('div', { className: 'vcg-repo-card-name' }, title),
          h('div', { className: 'vcg-repo-card-sub' }, subtitle),
        ),
        h(Badge, { color: engineColor(node.engine) }, engineText(node.engine)),
      ),
      h('div', { className: 'vcg-repo-card-desc' }, str(node.description) || t('repoNoDescription')),
      h(
        'div',
        { className: 'vcg-repo-card-meta' },
        h(Badge, null, categoryText(node.category)),
        h(Badge, null, t('repoPortsValue', { inputs: inputs.length, outputs: outputs.length })),
        h(Badge, null, t('repoParamsCount', { count: asArray(node.params).length })),
        unreviewed
          ? h(
              Badge,
              {
                color: 'var(--dsw-alias-state-warn-primary)',
                title: str(node.repoBranch) ? t('cvUnreviewedFrom', { branch: str(node.repoBranch) }) : t('cvDevModeHint'),
              },
              t('cvUnreviewed'),
            )
          : null,
        requiresProMode(node)
          ? h(
              Badge,
              { color: blocked ? 'var(--dsw-alias-state-warn-primary)' : 'var(--dsw-alias-brand-primary)' },
              blocked ? t('repoNeedPro') : t('repoNodePro'),
            )
          : null,
      ),
      h(
        'div',
        { className: 'vcg-repo-card-foot' },
        h(
          'span',
          { className: 'vcg-repo-card-state' },
          installed
            ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('repoInstalled'))
            : devLocked
              ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('cvUnreviewed'))
              : blocked
                ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('repoNeedPro'))
                : h(Badge, null, t('repoAvailable')),
        ),
        h(
          Button,
          {
            size: 'sm',
            variant: 'ghost',
            onClick: (event) => {
              event.stopPropagation()
              onOpen(node.id)
            },
          },
          t('repoDetails'),
        ),
      ),
    )
  }

  function NodeDetail({ node, installed, blocked, devLocked, unreviewed, importable, installing, error, onOpenSettings }) {
    const inputs = asArray(node.inputs)
    const outputs = asArray(node.outputs)
    const params = asArray(node.params)
    const executor = node.executor && typeof node.executor === 'object' ? node.executor : {}
    const cloud = node.cloud && typeof node.cloud === 'object' ? node.cloud : {}
    const local = node.local && typeof node.local === 'object' ? node.local : {}
    const comfy = local.comfyui && typeof local.comfyui === 'object' ? local.comfyui : {}
    const request = executor.request && typeof executor.request === 'object' ? executor.request : {}
    const response = executor.response && typeof executor.response === 'object' ? executor.response : {}
    const headerKeys = request.headers && typeof request.headers === 'object' ? Object.keys(request.headers) : []
    const mapKeys = comfy.map && typeof comfy.map === 'object' ? Object.keys(comfy.map) : []
    const responseKeys = Object.keys(response)
    const executorKind = str(executor.kind)

    let executorBody = h('div', { className: 'vcg-hint' }, '—')
    if (executorKind === 'builtin') {
      executorBody = [
        h(KVRow, { key: 'kind', label: t('repoExecutorKind'), children: t('repoExecutorBuiltin') }),
        h(KVRow, { key: 'fn', label: t('repoExecutorFn'), mono: true, children: str(executor.fn) || '—' }),
      ]
    } else if (executorKind === 'http') {
      executorBody = [
        h(KVRow, { key: 'kind', label: t('repoExecutorKind'), children: t('repoExecutorHttp') }),
        h(KVRow, {
          key: 'method',
          label: t('repoRequestMethod'),
          children: h(Badge, null, str(request.method) || 'POST'),
        }),
        h(KVRow, { key: 'url', label: t('repoRequestUrl'), mono: true, children: str(request.url) || '—' }),
        headerKeys.length
          ? h(KVRow, {
              key: 'headers',
              label: t('repoRequestHeaders'),
              mono: true,
              children: headerKeys.join(', '),
            })
          : null,
        request.timeoutMs !== undefined
          ? h(KVRow, { key: 'timeout', label: t('repoRequestTimeout'), children: str(request.timeoutMs) })
          : null,
        responseKeys.length
          ? h(KVRow, {
              key: 'response',
              label: t('repoResponse'),
              mono: true,
              children: responseKeys.join(', '),
            })
          : null,
      ]
    } else if (executorKind === 'comfy') {
      executorBody = [
        h(KVRow, { key: 'kind', label: t('repoExecutorKind'), children: t('repoExecutorComfy') }),
        h(KVRow, {
          key: 'class',
          label: t('repoLocalClassType'),
          mono: true,
          children: str(comfy.class_type) || '—',
        }),
      ]
    }

    const infoRows = [
      h(KVRow, { key: 'id', label: t('repoDetailId'), mono: true, children: str(node.id) || '—' }),
      h(KVRow, { key: 'category', label: t('repoDetailCategory'), children: categoryText(node.category) }),
      h(KVRow, { key: 'engine', label: t('repoDetailEngine'), children: engineText(node.engine) }),
      str(node.source)
        ? h(KVRow, { key: 'source', label: t('repoSourceBadge'), children: str(node.source) })
        : null,
      str(node.repoBranch)
        ? h(KVRow, { key: 'branch', label: t('cvBranchShort'), children: str(node.repoBranch) })
        : null,
    ]

    return h(
      'div',
      { className: 'vcg-repo-detail' },
      h(
        'div',
        { className: 'vcg-repo-detail-head' },
        h(
          'div',
          { className: 'vcg-repo-detail-titlewrap' },
          h('div', { className: 'vcg-repo-detail-title' }, nodeTitle(node)),
          h('div', { className: 'vcg-repo-detail-sub' }, nodeSubtitle(node)),
        ),
        h(
          'div',
          { className: 'vcg-repo-card-meta' },
          h(Badge, { color: engineColor(node.engine) }, engineText(node.engine)),
          h(Badge, null, categoryText(node.category)),
          installed
            ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('repoInstalled'))
            : blocked
              ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('repoNeedPro'))
              : h(Badge, null, t('repoAvailable')),
          requiresProMode(node) ? h(Badge, { color: 'var(--dsw-alias-brand-primary)' }, t('repoHttpNode')) : null,
          unreviewed
            ? h(
                Badge,
                {
                  color: 'var(--dsw-alias-state-warn-primary)',
                  title: str(node.repoBranch) ? t('cvUnreviewedFrom', { branch: str(node.repoBranch) }) : t('cvDevModeHint'),
                },
                t('cvUnreviewed'),
              )
            : null,
        ),
      ),
      h('div', { className: 'vcg-repo-detail-desc' }, str(node.description) || t('repoNoDescription')),
      unreviewed
        ? h(
            Banner,
            {
              kind: 'warn',
              title: t('cvBranchUnreviewed'),
              action: devLocked ? h(Button, { size: 'sm', onClick: onOpenSettings }, t('repoOpenSettings')) : null,
            },
            devLocked
              ? t('cvUnreviewedNodeHint')
              : str(node.repoBranch)
                ? t('cvUnreviewedFrom', { branch: str(node.repoBranch) })
                : t('cvDevModeHint'),
          )
        : null,
      blocked
        ? h(
            Banner,
            {
              kind: 'warn',
              title: t('repoImportNeedProTitle'),
              action: h(Button, { size: 'sm', onClick: onOpenSettings }, t('repoOpenSettings')),
            },
            t('repoProHint'),
          )
        : null,
      !installed && !blocked && !importable
        ? h(Banner, { kind: 'info', title: t('repoCannotImport') })
        : null,
      installed ? h(Banner, { kind: 'success', title: t('repoInstalled') }, t('repoInstalledHint')) : null,
      error ? h(Banner, { kind: 'error', title: t('repoImportFailed') }, error) : null,
      h(
        'div',
        { className: 'vcg-repo-port-grid' },
        h(
          DetailBlock,
          {
            title: t('repoPortsInputs'),
            extra: h(Badge, null, str(inputs.length)),
          },
          inputs.length
            ? inputs.map((port, index) => h(PortRow, { key: str(port.id) || 'in-' + index, port: port }))
            : h('div', { className: 'vcg-hint' }, t('repoNoPorts')),
        ),
        h(
          DetailBlock,
          {
            title: t('repoPortsOutputs'),
            extra: h(Badge, null, str(outputs.length)),
          },
          outputs.length
            ? outputs.map((port, index) => h(PortRow, { key: str(port.id) || 'out-' + index, port: port }))
            : h('div', { className: 'vcg-hint' }, t('repoNoPorts')),
        ),
      ),
      h(
        DetailBlock,
        {
          title: t('repoParamsTitle'),
          extra: h(Badge, null, str(params.length)),
        },
        params.length
          ? h(
              'div',
              { className: 'vcg-repo-param-list' },
              params.map((param, index) => h(ParamRow, { key: str(param.id) || 'p-' + index, param: param })),
            )
          : h('div', { className: 'vcg-hint' }, t('repoNoParams')),
      ),
      h(
        DetailBlock,
        {
          title: t('repoExecutorTitle'),
          extra: executorKind ? h(Badge, null, executorKind) : null,
        },
        executorBody,
      ),
      Object.keys(cloud).length
        ? h(
            DetailBlock,
            { title: t('repoCloudTitle') },
            h(KVRow, {
              label: t('repoCloudCapability'),
              children: capabilityText(cloud.capability),
            }),
            str(cloud.api)
              ? h(KVRow, { label: t('repoCloudApi'), mono: true, children: str(cloud.api) })
              : null,
            str(cloud.notes) ? h(KVRow, { label: t('repoCloudNotes'), children: str(cloud.notes) }) : null,
          )
        : null,
      Object.keys(comfy).length
        ? h(
            DetailBlock,
            { title: t('repoLocalTitle') },
            h(KVRow, {
              label: t('repoLocalClassType'),
              mono: true,
              children: str(comfy.class_type) || '—',
            }),
            h(KVRow, {
              label: t('repoLocalMap'),
              mono: true,
              children: mapKeys.length
                ? mapKeys.join(', ') + '（' + t('repoLocalMapCount', { count: mapKeys.length }) + '）'
                : t('repoLocalNone'),
            }),
          )
        : null,
      h(DetailBlock, { title: t('repoDetailId') }, infoRows),
      installing
        ? h(
            'div',
            { className: 'vcg-repo-loading vcg-repo-loading-inline' },
            h(Spinner, { size: 15, label: t('repoImporting') }),
          )
        : null,
    )
  }

  function WorkflowsSection({ workflows, loading, onOpenSettings }) {
    const list = asArray(workflows)
    return h(
      'section',
      { className: 'vcg-repo-section' },
      h(
        'div',
        { className: 'vcg-repo-section-head' },
        h(
          'div',
          null,
          h('div', { className: 'vcg-repo-section-title' }, t('repoWorkflowsTitle')),
          h('div', { className: 'vcg-repo-section-desc' }, t('repoWorkflowsDesc')),
        ),
        h(
          Button,
          { size: 'sm', variant: 'ghost', onClick: onOpenSettings, icon: 'settings' },
          t('repoSettingsLink'),
        ),
      ),
      loading && !list.length
        ? h('div', { className: 'vcg-repo-loading vcg-repo-loading-inline' }, h(Spinner, { size: 15 }))
        : null,
      !loading && !list.length ? h(Empty, { title: t('repoWorkflowsEmpty'), icon: 'layers' }) : null,
      list.length
        ? h(
            'div',
            { className: 'vcg-repo-wf-list' },
            list.map((workflow, index) =>
              h(
                'div',
                { key: str(workflow.id) || 'wf-' + index, className: 'vcg-repo-wf-row' },
                h(
                  'div',
                  { className: 'vcg-repo-wf-main' },
                  h(
                    'div',
                    { className: 'vcg-repo-wf-head' },
                    h('span', { className: 'vcg-repo-wf-name' }, str(workflow.name) || str(workflow.id) || '—'),
                    workflow.installed
                      ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('repoWorkflowInstalled'))
                      : h(Badge, null, t('repoWorkflowMissing')),
                  ),
                  h(
                    'div',
                    { className: 'vcg-repo-wf-desc' },
                    str(workflow.description) || t('repoNoDescription'),
                  ),
                ),
                h(
                  'div',
                  { className: 'vcg-repo-wf-meta' },
                  h(Badge, null, t('repoWorkflowNodes', { count: asArray(workflow.nodes).length || Number(workflow.nodeCount) || 0 })),
                  workflow.id ? h('span', { className: 'vcg-repo-mono' }, str(workflow.id)) : null,
                ),
              ),
            ),
          )
        : null,
      h('div', { className: 'vcg-hint vcg-repo-section-hint' }, t('repoWorkflowHint')),
    )
  }

  function CustomNodesSection({
    nodes,
    loading,
    error,
    deletingId,
    confirmId,
    onDelete,
    onOpenSettings,
    onReload,
  }) {
    const list = asArray(nodes)
    return h(
      'section',
      { className: 'vcg-repo-section' },
      h(
        'div',
        { className: 'vcg-repo-section-head' },
        h(
          'div',
          null,
          h('div', { className: 'vcg-repo-section-title' }, t('repoInstalledTitle')),
          h('div', { className: 'vcg-repo-section-desc' }, t('repoInstalledDesc')),
        ),
        h(
          'div',
          { className: 'vcg-row' },
          h(Button, { size: 'sm', onClick: onReload, icon: 'refresh' }, t('refresh')),
          h(
            Button,
            { size: 'sm', variant: 'ghost', onClick: onOpenSettings, icon: 'settings' },
            t('repoOpenSettings'),
          ),
        ),
      ),
      error
        ? h(
            Banner,
            {
              kind: 'error',
              title: t('repoLoadFailed'),
              action: h(Button, { size: 'sm', onClick: onReload }, t('retry')),
            },
            error,
          )
        : null,
      loading && !list.length
        ? h('div', { className: 'vcg-repo-loading vcg-repo-loading-inline' }, h(Spinner, { size: 15, label: t('loading') }))
        : null,
      !loading && !error && !list.length
        ? h(Empty, { title: t('repoInstalledEmpty'), icon: 'node' })
        : null,
      list.length
        ? h(
            'div',
            { className: 'vcg-repo-custom-list' },
            list.map((node) =>
              h(
                'div',
                { key: str(node.id), className: 'vcg-repo-custom-row' },
                h(
                  'div',
                  { className: 'vcg-repo-custom-main' },
                  h('div', { className: 'vcg-repo-custom-name' }, nodeTitle(node)),
                  h('div', { className: 'vcg-repo-custom-sub' }, nodeSubtitle(node)),
                ),
                h(
                  'div',
                  { className: 'vcg-repo-card-meta' },
                  h(Badge, { color: engineColor(node.engine) }, engineText(node.engine)),
                  h(Badge, null, categoryText(node.category)),
                  str(node.source) ? h(Badge, null, str(node.source)) : null,
                ),
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: 'danger',
                    disabled: deletingId === str(node.id),
                    onClick: () => onDelete(node.id),
                  },
                  deletingId === str(node.id)
                    ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('repoDeleting'))
                    : confirmId === str(node.id)
                      ? t('repoConfirmDelete')
                      : t('repoDelete'),
                ),
              ),
            ),
          )
        : null,
    )
  }

  /* ----------------------------------------------------------- panel icon */

  /** Sidebar icon: a repository box with two linked nodes on its front face. */
  function RepoPanelIcon(props) {
    const size =
      (props && (props.size || props.width || props.height)) || 18
    return h(
      'svg',
      {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        className: 'vcg-repo-panel-icon' + (props && props.className ? ' ' + props.className : ''),
        role: 'img',
        'aria-label': 'VCG 节点工作流仓库',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'block', flex: 'none' },
      },
      /* 仓库箱体 */
      h('path', { d: 'M3.6 8.1L12 3.7l8.4 4.4v7.8L12 20.3 3.6 15.9z' }),
      h('path', { d: 'M3.6 8.1L12 12.5l8.4-4.4' }),
      h('path', { d: 'M12 12.5v7.8' }),
      /* 前面板上的两个节点 + 连线（与 PanelIcon 的三节点星芒区分） */
      h('rect', { x: 7.9, y: 14, width: 2.1, height: 2.1, rx: 0.45, fill: 'currentColor', stroke: 'none' }),
      h('rect', { x: 14, y: 14, width: 2.1, height: 2.1, rx: 0.45, fill: 'currentColor', stroke: 'none' }),
      h('path', { d: 'M10.2 15.05h3.5' }),
    )
  }

  /* ---------------------------------------------------------------- page */

  function NodeRepoPage() {
    const store = V.useStore()
    const [source, setSource] = React.useState('auto')
    const [repoData, setRepoData] = React.useState(null)
    const [repoLoading, setRepoLoading] = React.useState(true)
    const [repoError, setRepoError] = React.useState('')
    const [category, setCategory] = React.useState('all')
    const [search, setSearch] = React.useState('')
    const [selected, setSelected] = React.useState({})
    const [detailId, setDetailId] = React.useState('')
    const [installingId, setInstallingId] = React.useState('')
    const [installError, setInstallError] = React.useState('')
    const [bulkBusy, setBulkBusy] = React.useState(false)
    const [bulkProgress, setBulkProgress] = React.useState({ done: 0, total: 0 })
    const [syncing, setSyncing] = React.useState(false)
    const [notice, setNotice] = React.useState(null)
    const [storeError, setStoreError] = React.useState('')
    const [deleteTarget, setDeleteTarget] = React.useState('')
    const [deletingId, setDeletingId] = React.useState('')

    const loadSeq = React.useRef(0)
    const deleteTimer = React.useRef(null)

    const nodesAsync = V.useAsync(
      () => V.rpc('listNodes').then((result) => asArray(result && result.nodes)),
      [],
    )

    const nodeRepoState = store.state && typeof store.state.nodeRepo === 'object' ? store.state.nodeRepo : {}
    const proMode = Boolean(store.state && store.state.proMode)
    const devMode = typeof V.readDevMode === 'function' ? V.readDevMode(store.state) : Boolean(store.state && store.state.devMode)
    const branch = typeof V.readRepoBranch === 'function' ? V.readRepoBranch(store.state) : str(nodeRepoState.branch) || 'main'
    const configured = Boolean(str(nodeRepoState.githubBase) || str(nodeRepoState.giteaBase))
    const defaultBranches = V.consts && Array.isArray(V.consts.REPO_BRANCHES) ? V.consts.REPO_BRANCHES.slice() : ['main', 'dev', 'bug', 'recheck']
    const [branches, setBranches] = React.useState(defaultBranches)
    const [branchInfo, setBranchInfo] = React.useState([])
    const [branchBusy, setBranchBusy] = React.useState(false)
    const [branchError, setBranchError] = React.useState('')

    /* --- data loading --- */

    const loadRepo = async (force) => {
      const seq = loadSeq.current + 1
      loadSeq.current = seq
      setRepoLoading(true)
      setRepoError('')
      try {
        const args = { source: source }
        if (force) args.force = true
        const data = await V.rpc('listRepoNodes', args)
        if (seq !== loadSeq.current) return
        setRepoData(normalizeRepoData(data))
      } catch (error) {
        if (seq !== loadSeq.current) return
        setRepoError(msgOf(error))
      } finally {
        if (seq === loadSeq.current) setRepoLoading(false)
      }
    }

    React.useEffect(() => {
      let alive = true
      V.refresh()
        .then(() => {
          if (alive) setStoreError('')
        })
        .catch((error) => {
          if (alive) setStoreError(msgOf(error))
        })
      return () => {
        alive = false
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
      loadRepo(false)
      return () => {
        loadSeq.current += 1
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source])

    /* §16.2 分支清单：宿主暂不支持 repoBranches 时退回内置主/开发/缺陷/复核分支。 */
    React.useEffect(() => {
      let alive = true
      V.rpc('repoBranches')
        .then((result) => {
          if (!alive || !result) return
          const raw = Array.isArray(result) ? result : asArray(result.branches)
          const infos = raw
            .map((item) =>
              typeof item === 'string'
                ? { branch: item }
                : {
                    branch: str(item && (item.branch || item.name || item.id)),
                    available: item && item.available !== false,
                    current: Boolean(item && item.current),
                    nodeCount: item && item.nodeCount,
                    workflowCount: item && item.workflowCount,
                    error: str(item && item.error),
                  },
            )
            .filter((item) => item.branch)
          if (!infos.length) return
          setBranchInfo(infos)
          setBranches(infos.map((item) => item.branch))
        })
        .catch(() => {})
      return () => {
        alive = false
      }
    }, [])

    React.useEffect(
      () => () => {
        if (deleteTimer.current) clearTimeout(deleteTimer.current)
      },
      [],
    )

    /* --- derived data --- */

    const repoNodes = React.useMemo(() => {
      if (!repoData) return []
      return repoData.nodes.slice().sort((a, b) => {
        const catA = CATEGORY_ORDER.has(str(a.category)) ? CATEGORY_ORDER.get(str(a.category)) : 99
        const catB = CATEGORY_ORDER.has(str(b.category)) ? CATEGORY_ORDER.get(str(b.category)) : 99
        if (catA !== catB) return catA - catB
        const orderA = Number(a.order)
        const orderB = Number(b.order)
        if (Number.isFinite(orderA) && Number.isFinite(orderB) && orderA !== orderB) return orderA - orderB
        return nodeTitle(a).localeCompare(nodeTitle(b), 'zh')
      })
    }, [repoData])

    const nodeById = React.useMemo(() => {
      const map = new Map()
      for (const node of repoNodes) map.set(str(node.id), node)
      return map
    }, [repoNodes])

    const installedIds = React.useMemo(() => {
      const ids = new Set()
      for (const node of asArray(nodesAsync.data)) ids.add(str(node.id))
      return ids
    }, [nodesAsync.data])

    const isInstalled = (node) => Boolean(node && (node.installed === true || installedIds.has(str(node.id))))
    const isUnreviewedNode = (node) =>
      typeof V.isUnreviewed === 'function'
        ? V.isUnreviewed(node)
        : Boolean(node && ((str(node.repoBranch) && str(node.repoBranch) !== 'main') || node.reviewState === 'unreviewed'))
    /* §16.2 开发者模式关闭时，未审核分支的节点不可导入。 */
    const isDevLocked = (node) => isUnreviewedNode(node) && !devMode
    const isBlocked = (node) => Boolean(node) && ((requiresProMode(node) && !proMode) || isDevLocked(node))
    const isImportable = (node) => Boolean(node) && !isInstalled(node) && !isBlocked(node) && node.canImport !== false

    const categoryCounts = React.useMemo(() => {
      const counts = {}
      for (const node of repoNodes) {
        const id = str(node.category) || 'custom'
        counts[id] = (counts[id] || 0) + 1
      }
      return counts
    }, [repoNodes])

    const categoryList = React.useMemo(() => {
      const base = asArray(V.consts.NODE_CATEGORIES).map((entry) => ({
        id: entry.id,
        label: V.localeId() === 'en' ? CATEGORY_EN[entry.id] || entry.id : entry.label || entry.id,
      }))
      const known = new Set(base.map((entry) => entry.id))
      for (const node of repoNodes) {
        const id = str(node.category) || 'custom'
        if (!known.has(id)) {
          known.add(id)
          base.push({ id: id, label: categoryText(id) })
        }
      }
      return base
    }, [repoNodes])

    const visibleNodes = React.useMemo(
      () =>
        repoNodes.filter(
          (node) => (category === 'all' || (str(node.category) || 'custom') === category) && matchesSearch(node, search),
        ),
      [repoNodes, category, search],
    )

    const selectedImportableIds = React.useMemo(
      () =>
        Object.keys(selected).filter((id) => {
          const node = nodeById.get(id)
          return Boolean(selected[id] && node && isImportable(node))
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selected, nodeById, proMode, installedIds],
    )

    const importableVisible = visibleNodes.filter((node) => isImportable(node))
    const installedCustomNodes = asArray(nodesAsync.data).filter(isImportedCustom)
    const detailNode = detailId !== '' ? nodeById.get(detailId) : null
    const detailInstalled = detailNode ? isInstalled(detailNode) : false
    const detailBlocked = detailNode && !detailInstalled ? isBlocked(detailNode) : false
    const detailDevLocked = detailNode && !detailInstalled ? isDevLocked(detailNode) : false
    const detailUnreviewed = detailNode ? isUnreviewedNode(detailNode) : false
    const detailImportable = detailNode ? isImportable(detailNode) : false
    const detailTitle = detailNode ? nodeTitle(detailNode) : ''

    /* --- actions --- */

    function showNotice(next) {
      setNotice(next)
    }

    function openSettings() {
      const nav = V.nav || {}
      if (typeof nav.openSettings === 'function') {
        try {
          const result = nav.openSettings('vcg')
          if (result && typeof result.catch === 'function') result.catch(() => {})
          return
        } catch {
          /* fall through to the readable hint */
        }
      }
      showNotice({
        kind: 'info',
        title: t('repoSettingsUnavailableTitle'),
        message: t('repoSettingsUnavailable'),
      })
    }

    function changeSource(next) {
      if (next === source) return
      setSource(next)
      setSelected({})
      setDetailId('')
      setInstallError('')
      setNotice(null)
      setCategory('all')
      setSearch('')
    }

    function toggleSelect(id) {
      setSelected((previous) => {
        const next = Object.assign({}, previous)
        if (next[id]) delete next[id]
        else next[id] = true
        return next
      })
    }

    function selectAllImportable() {
      setSelected((previous) => {
        const next = Object.assign({}, previous)
        for (const node of importableVisible) next[str(node.id)] = true
        return next
      })
    }

    function clearSelection() {
      setSelected({})
    }

    function openDetail(id) {
      setInstallError('')
      setDetailId(str(id))
    }

    function closeDetail() {
      setDetailId('')
      setInstallError('')
    }

    function installArgsFor(id) {
      const resolved = repoData && repoData.source ? str(repoData.source) : ''
      const chosen = source !== 'auto' ? source : ''
      const reposSource = resolved || chosen
      const args = { id: id, branch: branch }
      if (reposSource) args.source = reposSource
      return args
    }

    function nameOfResult(result, fallbackNode) {
      const node = result && result.node
      if (node) return nodeTitle(node)
      if (fallbackNode) return nodeTitle(fallbackNode)
      return str(result && result.name) || '—'
    }

    function reloadAfterInstall() {
      nodesAsync.reload()
      loadRepo(false)
      V.refresh().catch(() => {})
    }

    async function importSingle(node) {
      if (!node || installingId !== '') return
      if (!isImportable(node)) return
      const id = str(node.id)
      setInstallingId(id)
      setInstallError('')
      try {
        const result = await V.rpc('installRepoNode', installArgsFor(id))
        setSelected((previous) => {
          if (!previous[id]) return previous
          const next = Object.assign({}, previous)
          delete next[id]
          return next
        })
        showNotice({
          kind: 'success',
          title: t('repoImportSuccessTitle'),
          message: t('repoImportOk', { name: nameOfResult(result, node) }),
        })
        reloadAfterInstall()
      } catch (error) {
        setInstallError(msgOf(error))
        showNotice({ kind: 'error', title: t('repoImportFailed'), message: msgOf(error) })
      } finally {
        setInstallingId('')
      }
    }

    async function importSelected() {
      if (bulkBusy) return
      const ids = selectedImportableIds.slice()
      if (ids.length === 0) {
        showNotice({ kind: 'info', title: t('repoBulkTitle'), message: t('repoNoSelection') })
        return
      }
      setBulkBusy(true)
      setBulkProgress({ done: 0, total: ids.length })
      showNotice(null)
      const succeeded = []
      const failed = []
      for (let index = 0; index < ids.length; index += 1) {
        const id = ids[index]
        const node = nodeById.get(id)
        try {
          const result = await V.rpc('installRepoNode', installArgsFor(id))
          succeeded.push({ label: t('repoImportOk', { name: nameOfResult(result, node) }) })
        } catch (error) {
          failed.push({
            label: node ? nodeTitle(node) + '（' + id + '）' : id,
            error: msgOf(error),
          })
        }
        setBulkProgress({ done: index + 1, total: ids.length })
      }
      setBulkBusy(false)
      setSelected({})
      const okCount = succeeded.length
      const failCount = failed.length
      showNotice({
        kind: failCount === 0 ? 'success' : okCount === 0 ? 'error' : 'warn',
        title: t('repoBulkTitle'),
        message: t('repoBulkSummary', { ok: okCount, fail: failCount }),
        items: succeeded.concat(failed),
      })
      if (okCount > 0) reloadAfterInstall()
    }

    /* §16.2 切换分支：非 main 需要开发者模式；切换后重新拉取仓库与节点列表。 */
    async function changeBranch(next) {
      const target = str(next) || 'main'
      if (branchBusy || target === branch) return
      if (!devMode && target !== 'main') {
        showNotice({ kind: 'warn', title: t('cvBranch'), message: t('cvBranchLocked') })
        return
      }
      const info = branchInfo.find((item) => item.branch === target)
      if (info && info.available === false) {
        showNotice({ kind: 'warn', title: t('cvBranch'), message: t('cvBranchUnavailable') + (info.error ? '：' + info.error : '') })
        return
      }
      setBranchBusy(true)
      setBranchError('')
      try {
        const result = await V.rpc('setRepoBranch', { branch: target })
        if (result && result.state) V.setStore({ state: result.state, loaded: true, loading: false, error: '' })
        else await V.refresh().catch(() => {})
        nodesAsync.reload()
        await loadRepo(true)
        showNotice({ kind: 'success', title: t('cvBranch'), message: t('cvBranchChanged', { branch: target }) })
      } catch (error) {
        setBranchError(msgOf(error))
        showNotice({ kind: 'error', title: t('cvBranchFailed'), message: msgOf(error) })
      } finally {
        setBranchBusy(false)
      }
    }

    async function syncAll() {
      if (syncing) return
      setSyncing(true)
      showNotice(null)
      try {
        const result = await V.rpc('syncNodeRepo', source === 'auto' ? {} : { source: source })
        const warnings = asArray(result && result.warnings).map((warning) => str(warning)).filter(Boolean)
        const counts = result && typeof result.counts === 'object' ? result.counts : {}
        const nodesCount = Number(counts.nodes)
        const workflowCount = Number(counts.workflows)
        const nodeTotal = Number.isFinite(nodesCount) ? nodesCount : asArray(result && result.nodes).length
        const workflowTotal = Number.isFinite(workflowCount)
          ? workflowCount
          : asArray(result && result.workflows).length
        showNotice({
          kind: warnings.length || (result && result.ok === false) ? 'warn' : 'success',
          title: t('repoSyncDone'),
          message: t('repoSyncSummary', { nodes: nodeTotal, workflows: workflowTotal }),
          items: warnings.map((warning) => ({ label: warning })),
        })
        nodesAsync.reload()
        await loadRepo(false)
        V.refresh().catch(() => {})
      } catch (error) {
        showNotice({ kind: 'error', title: t('repoSyncFailed'), message: msgOf(error) })
      } finally {
        setSyncing(false)
      }
    }

    function requestDelete(id) {
      const key = str(id)
      if (deleteTarget === key) {
        if (deleteTimer.current) {
          clearTimeout(deleteTimer.current)
          deleteTimer.current = null
        }
        setDeleteTarget('')
        if (deletingId === '') removeCustomNode(key)
        return
      }
      setDeleteTarget(key)
      if (deleteTimer.current) clearTimeout(deleteTimer.current)
      deleteTimer.current = setTimeout(() => {
        deleteTimer.current = null
        setDeleteTarget('')
      }, 4000)
    }

    async function removeCustomNode(id) {
      setDeletingId(id)
      try {
        await V.rpc('removeNode', { id: id })
        showNotice({ kind: 'success', title: t('repoDeleteSuccessTitle'), message: t('repoDeleteOk', { id: id }) })
        nodesAsync.reload()
        loadRepo(false)
        V.refresh().catch(() => {})
      } catch (error) {
        showNotice({ kind: 'error', title: t('repoDeleteFail'), message: msgOf(error) })
      } finally {
        setDeletingId('')
      }
    }

    /* --- render: header --- */

    const header = h(
      'div',
      { className: 'vcg-repo-header' },
      h(
        'div',
        { className: 'vcg-repo-header-main' },
        h('div', { className: 'vcg-repo-brand' }, h(RepoPanelIcon, { size: 20 })),
        h(
          'div',
          { className: 'vcg-repo-headings' },
          h('div', { className: 'vcg-repo-title' }, t('repoTitle')),
          h('div', { className: 'vcg-repo-subtitle' }, t('repoDesc')),
        ),
      ),
      h(
        'div',
        { className: 'vcg-repo-header-actions' },
        proMode
          ? h(Badge, { color: 'var(--dsw-alias-state-success-primary)' }, t('repoProOn'))
          : h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('repoProOff')),
        devMode
          ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('cvDevModeBadge'))
          : h(Badge, null, t('cvBranchShort') + '：' + branch),
        h(
          Button,
          {
            size: 'sm',
            onClick: () => loadRepo(true),
            disabled: repoLoading || syncing,
            icon: repoLoading ? undefined : 'refresh',
          },
          repoLoading
            ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('repoRefreshing'))
            : t('repoRefresh'),
        ),
        h(
          Button,
          {
            size: 'sm',
            variant: 'primary',
            onClick: syncAll,
            disabled: syncing || repoLoading,
            icon: syncing ? undefined : 'upload',
          },
          syncing
            ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('repoSyncing'))
            : t('repoSyncAll'),
        ),
        h(Button, { size: 'sm', variant: 'ghost', onClick: openSettings, icon: 'settings' }, t('repoOpenSettings')),
      ),
    )

    const sourceSelect = h(
      'div',
      { className: 'vcg-repo-source-select' },
      h('span', { className: 'vcg-repo-source-label' }, t('repoSourceLabel')),
      h(Select, {
        value: source,
        options: [
          { value: 'auto', label: t('repoSourceAuto') },
          { value: 'github', label: t('repoSourceGithub') },
          { value: 'gitea', label: t('repoSourceGitea') },
        ],
        onChange: changeSource,
      }),
    )

    /* §16.2 分支选择器：开发者模式关闭时锁定 main 并提示。 */
    const branchMeta = new Map(branchInfo.map((item) => [item.branch, item]))
    const branchOptions = branches.slice()
    if (branchOptions.indexOf(branch) < 0) branchOptions.push(branch)
    if (branchOptions.indexOf('main') < 0) branchOptions.unshift('main')
    const branchLabel = (name) => {
      const meta = branchMeta.get(name) || {}
      let label = name === 'main' ? t('cvBranchMain') : name
      if (meta.available === false) label += ' · ' + t('cvBranchUnavailable')
      else if (Number.isFinite(Number(meta.nodeCount))) label += ' · ' + Number(meta.nodeCount) + ' ' + t('nodes')
      if (!devMode && name !== 'main') label += ' 🔒'
      return label
    }
    const branchSelect = h(
      'div',
      { className: 'vcg-repo-branch-select' },
      h('span', { className: 'vcg-repo-source-label' }, t('cvBranch')),
      h(Select, {
        value: branch,
        options: branchOptions.map((name) => ({ value: name, label: branchLabel(name) })),
        disabled: !devMode || branchBusy,
        onChange: changeBranch,
      }),
      branchBusy ? h(Spinner, { size: 12 }) : null,
      !devMode
        ? h('span', { className: 'vcg-repo-branch-lock', title: t('cvDevModeOnlyMain') }, t('cvBranchLocked'))
        : branch !== 'main'
          ? h(Badge, { color: 'var(--dsw-alias-state-warn-primary)' }, t('cvUnreviewed'))
          : null,
    )

    const addressRows = h(
      'div',
      { className: 'vcg-repo-addresses' },
      h(
        'div',
        { className: 'vcg-repo-address' },
        h('span', { className: 'vcg-repo-address-label' }, t('repoGithubBase')),
        h(
          'span',
          {
            className: 'vcg-repo-mono vcg-repo-address-value',
            title: str(nodeRepoState.githubBase) || t('repoNotConfigured'),
          },
          str(nodeRepoState.githubBase) || t('repoNotConfigured'),
        ),
      ),
      h(
        'div',
        { className: 'vcg-repo-address' },
        h('span', { className: 'vcg-repo-address-label' }, t('repoGiteaBase')),
        h(
          'span',
          {
            className: 'vcg-repo-mono vcg-repo-address-value',
            title: str(nodeRepoState.giteaBase) || t('repoNotConfigured'),
          },
          str(nodeRepoState.giteaBase) || t('repoNotConfigured'),
        ),
      ),
      repoData && repoData.base
        ? h(
            'div',
            { className: 'vcg-repo-address' },
            h('span', { className: 'vcg-repo-address-label' }, t('repoCurrentBase')),
            h('span', { className: 'vcg-repo-mono vcg-repo-address-value', title: repoData.base }, repoData.base),
          )
        : null,
      h('div', { className: 'vcg-repo-address-hint' }, t('repoAddressHint')),
    )

    const statusChips = h(
      'div',
      { className: 'vcg-repo-status' },
      repoData && repoData.source ? h(Badge, null, t('repoSourceBadge') + '：' + repoData.source) : null,
      repoData && repoData.version ? h(Badge, null, t('repoVersion') + ' ' + repoData.version) : null,
      repoData && repoData.fetchedAt
        ? h(Badge, null, t('repoFetchedAt') + ' ' + (V.formatTime(repoData.fetchedAt) || repoData.fetchedAt))
        : null,
      repoData
        ? h(
            Badge,
            null,
            t('repoCounts', { nodes: repoNodes.length, workflows: asArray(repoData.workflows).length }),
          )
        : null,
    )

    const toolbar = h(
      'div',
      { className: 'vcg-repo-toolbar' },
      h('div', { className: 'vcg-repo-toolbar-main' }, sourceSelect, branchSelect, statusChips),
      addressRows,
    )

    /* --- render: category sidebar --- */

    const categoryButtons = h(
      'aside',
      { className: 'vcg-repo-aside', 'aria-label': t('repoNodesTitle') },
      h(
        'button',
        {
          type: 'button',
          className: 'vcg-repo-cat ' + (category === 'all' ? 'vcg-repo-cat-on' : ''),
          onClick: () => setCategory('all'),
        },
        h('span', { className: 'vcg-repo-cat-label' }, t('repoAll')),
        h('span', { className: 'vcg-repo-cat-count' }, str(repoNodes.length)),
      ),
      categoryList.map((entry) =>
        h(
          'button',
          {
            key: entry.id,
            type: 'button',
            className: 'vcg-repo-cat ' + (category === entry.id ? 'vcg-repo-cat-on' : ''),
            onClick: () => setCategory(entry.id),
          },
          h('span', { className: 'vcg-repo-cat-label' }, entry.label),
          h('span', { className: 'vcg-repo-cat-count' }, str(categoryCounts[entry.id] || 0)),
        ),
      ),
    )

    /* --- render: node browser --- */

    const browserTools = h(
      'div',
      { className: 'vcg-repo-tools' },
      h(
        'div',
        { className: 'vcg-repo-tools-left' },
        h(
          'div',
          { className: 'vcg-repo-search' },
          h(TextInput, {
            value: search,
            placeholder: t('repoSearchPh'),
            disabled: bulkBusy,
            onChange: (value) => setSearch(value),
          }),
        ),
        h('div', { className: 'vcg-repo-selected' }, t('repoSelectedCount', { count: selectedImportableIds.length })),
      ),
      h(
        'div',
        { className: 'vcg-repo-tools-right' },
        h(Button, { size: 'sm', variant: 'ghost', onClick: selectAllImportable, disabled: bulkBusy || importableVisible.length === 0 }, t('repoSelectAll')),
        h(Button, { size: 'sm', variant: 'ghost', onClick: clearSelection, disabled: bulkBusy || selectedImportableIds.length === 0 }, t('repoClearSelection')),
        h(
          Button,
          {
            size: 'sm',
            variant: 'primary',
            onClick: importSelected,
            disabled: bulkBusy || selectedImportableIds.length === 0,
            icon: bulkBusy ? undefined : 'download',
          },
          bulkBusy
            ? h(
                'span',
                { className: 'vcg-row' },
                h(Spinner, { size: 12 }),
                t('repoBulkProgress', { done: bulkProgress.done, total: bulkProgress.total }),
              )
            : t('repoImportSelected', { count: selectedImportableIds.length }),
        ),
      ),
    )

    let browserBody
    if (repoLoading && !repoData) {
      browserBody = h('div', { className: 'vcg-repo-loading' }, h(Spinner, { size: 18, label: t('repoLoading') }))
    } else if (!repoData && repoError) {
      browserBody = h(
        Banner,
        {
          kind: 'error',
          title: t('repoFetchFailed'),
          action: h(
            'div',
            { className: 'vcg-row' },
            h(Button, { size: 'sm', onClick: () => loadRepo(true) }, t('retry')),
            h(Button, { size: 'sm', variant: 'ghost', onClick: openSettings }, t('repoOpenSettings')),
          ),
        },
        repoError,
      )
    } else if (visibleNodes.length === 0) {
      browserBody = h(Empty, {
        title: repoNodes.length === 0 ? t('repoNodesEmpty') : t('repoCategoryEmpty'),
        hint: t('repoNodesEmptyHint'),
        icon: 'grid',
      })
    } else {
      browserBody = h(
        'div',
        { className: 'vcg-repo-grid' },
        visibleNodes.map((node) =>
          h(NodeCard, {
            key: str(node.id),
            node: node,
            installed: isInstalled(node),
            blocked: isBlocked(node) && !isInstalled(node),
            devLocked: isDevLocked(node) && !isInstalled(node),
            unreviewed: isUnreviewedNode(node),
            importable: isImportable(node),
            selected: Boolean(selected[str(node.id)]),
            locked: bulkBusy,
            onToggle: toggleSelect,
            onOpen: openDetail,
          }),
        ),
      )
    }

    const browser = h(
      'div',
      { className: 'vcg-repo-browser' },
      categoryButtons,
      h(
        'div',
        { className: 'vcg-repo-main' },
        h(
          'div',
          { className: 'vcg-repo-main-head' },
          h(
            'div',
            { className: 'vcg-repo-main-title' },
            t('repoNodesTitle'),
            h('span', { className: 'vcg-repo-main-count' }, str(visibleNodes.length)),
          ),
          h('div', { className: 'vcg-repo-main-hint' }, t('repoBrowserHint')),
        ),
        browserTools,
        browserBody,
      ),
    )

    /* --- render: banners --- */

    const banners = []
    if (storeError) {
      banners.push(
        h(
          Banner,
          { key: 'store', kind: 'warn', title: t('repoStoreError') },
          storeError,
        ),
      )
    }
    if (store.state && !configured && !repoError) {
      banners.push(
        h(
          Banner,
          {
            key: 'configure',
            kind: 'info',
            title: t('repoConfigureHint'),
            action: h(Button, { size: 'sm', onClick: openSettings }, t('repoOpenSettings')),
          },
        ),
      )
    }
    if (!proMode && repoData && repoNodes.some((node) => requiresProMode(node))) {
      banners.push(
        h(
          Banner,
          {
            key: 'pro-mode',
            kind: 'info',
            title: t('repoProHintTitle'),
            action: h(Button, { size: 'sm', onClick: openSettings }, t('repoOpenSettings')),
          },
          t('repoProHint'),
        ),
      )
    }
    if (branch !== 'main') {
      banners.push(
        h(
          Banner,
          {
            key: 'branch-warn',
            kind: 'warn',
            title: t('cvBranchUnreviewed'),
            action: !devMode ? h(Button, { size: 'sm', onClick: openSettings }, t('repoOpenSettings')) : null,
          },
          t('cvBranchUnreviewedDesc', { branch: branch }),
        ),
      )
    }
    if (branchError) {
      banners.push(
        h(
          Banner,
          {
            key: 'branch-error',
            kind: 'error',
            title: t('cvBranchFailed'),
            action: h(Button, { size: 'sm', onClick: () => setBranchError('') }, t('close')),
          },
          branchError,
        ),
      )
    }
    if (repoError && repoData) {
      banners.push(
        h(
          Banner,
          {
            key: 'repo-error',
            kind: 'error',
            title: t('repoFetchFailed'),
            action: h(Button, { size: 'sm', onClick: () => loadRepo(true) }, t('retry')),
          },
          repoError,
        ),
      )
    }
    if (repoData && repoData.warnings.length) {
      banners.push(
        h(
          Banner,
          { key: 'warnings', kind: 'warn', title: t('repoWarnings') },
          h(
            'div',
            { className: 'vcg-repo-notice-list' },
            repoData.warnings.map((warning, index) =>
              h('div', { key: index, className: 'vcg-repo-notice-item' }, '· ' + warning),
            ),
          ),
        ),
      )
    }
    if (notice) {
      banners.push(h(Notice, { key: 'notice', notice: notice, onClose: () => setNotice(null) }))
    }

    /* --- render: detail modal --- */

    const detailFooter = detailNode
      ? h(
          'div',
          { className: 'vcg-repo-modal-foot' },
          h(
            'div',
            { className: 'vcg-repo-modal-hint' },
            detailInstalled
              ? t('repoInstalledHint')
              : detailDevLocked
                ? t('cvUnreviewedNodeHint')
                : detailBlocked
                  ? t('repoProHint')
                  : detailImportable
                  ? ''
                  : t('repoCannotImport'),
          ),
          h(
            'div',
            { className: 'vcg-row' },
            h(Button, { onClick: closeDetail }, t('close')),
            detailBlocked
              ? h(Button, { variant: 'primary', onClick: openSettings }, t('repoOpenSettings'))
              : null,
            h(
              Button,
              {
                variant: 'primary',
                disabled: !detailImportable || installingId !== '',
                onClick: () => detailNode && importSingle(detailNode),
              },
              installingId === str(detailNode.id) && !detailInstalled
                ? h('span', { className: 'vcg-row' }, h(Spinner, { size: 12 }), t('repoImporting'))
                : detailInstalled
                  ? t('repoInstalled')
                  : t('repoImport'),
            ),
          ),
        )
      : null

    return h(
      'div',
      { className: 'vcg-repo-root' },
      h(StyleTag),
      V.styleTag(CSS),
      header,
      toolbar,
      h(
        'div',
        { className: 'vcg-repo-body vcg-scroll' },
        h(
          'div',
          { className: 'vcg-repo-content' },
          banners.length ? h('div', { className: 'vcg-repo-banners' }, banners) : null,
          store.state == null && !storeError
            ? h('div', { className: 'vcg-repo-loading' }, h(Spinner, { size: 18, label: t('repoStoreLoading') }))
            : null,
          browser,
          h(WorkflowsSection, {
            workflows: repoData ? repoData.workflows : [],
            loading: repoLoading,
            onOpenSettings: openSettings,
          }),
          h(CustomNodesSection, {
            nodes: installedCustomNodes,
            loading: nodesAsync.loading,
            error: nodesAsync.error ? msgOf(nodesAsync.error) : '',
            deletingId: deletingId,
            confirmId: deleteTarget,
            onDelete: requestDelete,
            onOpenSettings: openSettings,
            onReload: () => nodesAsync.reload(),
          }),
        ),
      ),
      detailNode
        ? h(
            Modal,
            {
              open: true,
              title: detailTitle,
              onClose: closeDetail,
              width: 'min(780px,100%)',
              footer: detailFooter,
            },
            h(NodeDetail, {
              node: detailNode,
              installed: detailInstalled,
              blocked: detailBlocked,
              devLocked: detailDevLocked,
              unreviewed: detailUnreviewed,
              importable: detailImportable,
              installing: installingId === str(detailNode.id),
              error: installError,
              onOpenSettings: openSettings,
            }),
          )
        : null,
    )
  }

  /* ------------------------------------------------------------------ css */

  const CSS = `
.vcg-repo-root{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;overflow:hidden}
.vcg-repo-root *{box-sizing:border-box}
.vcg-repo-header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:12px 18px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;flex:none}
.vcg-repo-header-main{display:flex;align-items:flex-start;gap:11px;min-width:0;flex:1 1 360px}
.vcg-repo-brand{width:38px;height:38px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;flex:none;color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 30%,transparent)}
.vcg-repo-headings{display:flex;flex-direction:column;gap:2px;min-width:0}
.vcg-repo-title{font-size:15px;font-weight:650;line-height:1.3}
.vcg-repo-subtitle{font-size:12px;color:var(--dsw-alias-label-secondary);max-width:680px}
.vcg-repo-header-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.vcg-repo-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 18px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex-wrap:wrap;flex:none}
.vcg-repo-toolbar-main{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0}
.vcg-repo-source-select{display:flex;align-items:center;gap:7px;flex:none}
.vcg-repo-source-label{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.vcg-repo-source-select .vcg-select{width:180px;padding:4px 8px;font-size:12px}
.vcg-repo-branch-select{display:flex;align-items:center;gap:7px;flex:none;min-width:0}
.vcg-repo-branch-select .vcg-select{width:190px;padding:4px 8px;font-size:12px}
.vcg-repo-branch-lock{font-size:10.5px;color:var(--dsw-alias-label-secondary);opacity:.9;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-status{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.vcg-repo-addresses{display:flex;align-items:center;gap:6px 16px;flex-wrap:wrap;flex:1 1 420px;justify-content:flex-end;min-width:0}
.vcg-repo-address{display:flex;align-items:center;gap:6px;min-width:0;max-width:100%}
.vcg-repo-address-label{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.vcg-repo-address-value{max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;color:var(--dsw-alias-label-secondary)}
.vcg-repo-address-hint{flex-basis:100%;text-align:right;font-size:10.5px;color:var(--dsw-alias-label-secondary);opacity:.8}
.vcg-repo-body{flex:1;min-height:0;overflow:auto}
.vcg-repo-content{max-width:1440px;margin:0 auto;padding:12px 18px 28px;display:flex;flex-direction:column;gap:12px}
.vcg-repo-banners{display:flex;flex-direction:column;gap:8px}
.vcg-repo-notice-list{display:flex;flex-direction:column;gap:2px;margin-top:4px;max-height:220px;overflow:auto}
.vcg-repo-notice-item{font-size:11.5px;word-break:break-word;color:var(--dsw-alias-label-secondary)}
.vcg-repo-notice-error{color:var(--dsw-alias-state-error-primary)}
.vcg-repo-browser{display:grid;grid-template-columns:200px minmax(0,1fr);gap:14px;align-items:start}
.vcg-repo-aside{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:7px;display:flex;flex-direction:column;gap:2px;position:sticky;top:0}
.vcg-repo-cat{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);border-radius:8px;padding:6px 8px;font-size:12.5px;font-family:inherit;line-height:18px;cursor:pointer;text-align:left}
.vcg-repo-cat:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.vcg-repo-cat-on{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,transparent);color:var(--dsw-alias-brand-primary);font-weight:600}
.vcg-repo-cat-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-cat-count{font-size:11px;color:var(--dsw-alias-label-secondary);flex:none}
.vcg-repo-main{display:flex;flex-direction:column;gap:10px;min-width:0}
.vcg-repo-main-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}
.vcg-repo-main-title{font-size:13px;font-weight:650;display:flex;align-items:center;gap:7px}
.vcg-repo-main-count{font-size:11px;font-weight:400;color:var(--dsw-alias-label-secondary)}
.vcg-repo-main-hint{font-size:11px;color:var(--dsw-alias-label-secondary);opacity:.85;max-width:560px}
.vcg-repo-tools{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.vcg-repo-tools-left{display:flex;align-items:center;gap:8px;flex:1 1 260px;min-width:0;flex-wrap:wrap}
.vcg-repo-search{flex:1 1 220px;max-width:360px;min-width:150px}
.vcg-repo-search .vcg-input{padding:5px 9px;font-size:12.5px}
.vcg-repo-selected{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.vcg-repo-tools-right{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.vcg-repo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:10px}
.vcg-repo-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:10px 11px;display:flex;flex-direction:column;gap:7px;cursor:pointer;min-width:0;transition:border-color 120ms ease,background 120ms ease}
.vcg-repo-card:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.vcg-repo-card:focus-visible{outline:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,transparent);outline-offset:1px}
.vcg-repo-card-selected{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,transparent)}
.vcg-repo-card-installed{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 5%,var(--dsw-alias-bg-layer-1))}
.vcg-repo-card-head{display:flex;align-items:flex-start;gap:8px;min-width:0}
.vcg-repo-check{width:14px;height:14px;margin:2px 0 0;flex:none;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}
.vcg-repo-check:disabled{cursor:default;opacity:.55}
.vcg-repo-card-title{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.vcg-repo-card-name{font-size:13px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-card-sub{font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-card-desc{font-size:12px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:32px;word-break:break-word}
.vcg-repo-card-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.vcg-repo-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:2px}
.vcg-repo-card-state{display:flex;align-items:center;gap:4px;min-width:0}
.vcg-repo-dot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}
.vcg-repo-section{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:12px 14px}
.vcg-repo-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.vcg-repo-section-title{font-size:13px;font-weight:650}
.vcg-repo-section-desc{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:2px;max-width:760px}
.vcg-repo-section-hint{margin-top:8px}
.vcg-repo-wf-list{display:flex;flex-direction:column;gap:0}
.vcg-repo-wf-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-top:1px dashed var(--dsw-alias-border-l1);padding:8px 0}
.vcg-repo-wf-row:first-child{border-top:none;padding-top:0}
.vcg-repo-wf-main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.vcg-repo-wf-head{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.vcg-repo-wf-name{font-size:12.5px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-wf-desc{font-size:11.5px;color:var(--dsw-alias-label-secondary);word-break:break-word}
.vcg-repo-wf-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:none}
.vcg-repo-custom-list{display:flex;flex-direction:column;gap:6px}
.vcg-repo-custom-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);padding:8px 10px;flex-wrap:wrap}
.vcg-repo-custom-main{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1 1 200px}
.vcg-repo-custom-name{font-size:12.5px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-custom-sub{font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-loading{display:flex;align-items:center;justify-content:center;padding:48px 0}
.vcg-repo-loading-inline{padding:18px 0}
.vcg-repo-detail{display:flex;flex-direction:column;gap:10px}
.vcg-repo-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}
.vcg-repo-detail-titlewrap{display:flex;flex-direction:column;gap:2px;min-width:0}
.vcg-repo-detail-title{font-size:15px;font-weight:650}
.vcg-repo-detail-sub{font-size:12px;color:var(--dsw-alias-label-secondary)}
.vcg-repo-detail-desc{font-size:12.5px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word}
.vcg-repo-port-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.vcg-repo-detail-block{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-2);padding:9px 10px;display:flex;flex-direction:column;gap:6px;min-width:0}
.vcg-repo-detail-block-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.vcg-repo-detail-block-title{font-size:12px;font-weight:650;color:var(--dsw-alias-label-primary)}
.vcg-repo-detail-block-body{display:flex;flex-direction:column;gap:5px;min-width:0}
.vcg-repo-port{display:flex;align-items:center;gap:7px;font-size:12.5px;min-width:0;flex-wrap:wrap}
.vcg-repo-port-label{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-port-type{font-size:10.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-secondary);letter-spacing:.02em}
.vcg-repo-param-list{display:flex;flex-direction:column;gap:6px}
.vcg-repo-param-row{display:grid;grid-template-columns:minmax(110px,1.2fr) auto minmax(92px,.9fr);gap:5px 10px;align-items:center;border-top:1px solid var(--dsw-alias-border-l1);padding-top:6px;font-size:12px}
.vcg-repo-param-row:first-child{border-top:none;padding-top:0}
.vcg-repo-param-main{display:flex;flex-direction:column;gap:0;min-width:0}
.vcg-repo-param-name{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-param-id{font-size:10.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vcg-repo-param-default{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis}
.vcg-repo-param-extra{grid-column:1 / -1;font-size:11px;color:var(--dsw-alias-label-secondary);word-break:break-word}
.vcg-repo-kv-row{display:grid;grid-template-columns:118px minmax(0,1fr);gap:6px 10px;font-size:12px;align-items:start}
.vcg-repo-kv-key{color:var(--dsw-alias-label-secondary);font-size:11.5px}
.vcg-repo-kv-val{min-width:0;word-break:break-word}
.vcg-repo-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px}
.vcg-repo-modal-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;flex-wrap:wrap}
.vcg-repo-modal-hint{font-size:11.5px;color:var(--dsw-alias-label-secondary);max-width:440px}
@media (max-width:860px){
  .vcg-repo-header,.vcg-repo-toolbar,.vcg-repo-content{padding-left:12px;padding-right:12px}
  .vcg-repo-browser{grid-template-columns:minmax(0,1fr)}
  .vcg-repo-aside{position:static;flex-direction:row;overflow:auto;flex-wrap:nowrap;scrollbar-width:thin}
  .vcg-repo-cat{flex:none}
  .vcg-repo-addresses{justify-content:flex-start}
  .vcg-repo-address-hint{text-align:left}
  .vcg-repo-port-grid{grid-template-columns:minmax(0,1fr)}
  .vcg-repo-header-actions{justify-content:flex-start}
}
@media (max-width:520px){
  .vcg-repo-grid{grid-template-columns:minmax(0,1fr)}
  .vcg-repo-source-select .vcg-select{width:150px}
  .vcg-repo-kv-row{grid-template-columns:96px minmax(0,1fr)}
}
`

  V.NodeRepoPage = NodeRepoPage
  V.RepoPanelIcon = RepoPanelIcon
})(V)
