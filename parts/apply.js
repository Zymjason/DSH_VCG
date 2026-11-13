/* ============================================================================
 * VCG 客户端装配：把各部件注册进宿主 Slot 树，并接上会话导航适配。
 *
 * 注册面：
 *   - settings.section              → 设置页（云端 API / 本地模式 / 专业模式 / 节点仓库）
 *   - sidebar.panellist            → 左侧栏 VCG 面板图标
 *   - main (key: dsh-vcg)          → VCG 主工作台（项目 / 工作流 / 输出）
 *   - conversation.view (id: vcg)  → 聊天 VCG 画布模式（替代传统对话消息区）
 *   - conversation.hero.options    → 新建聊天时的「VCG 画布」选择
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { React, h } = V
  const { Glyph, Empty } = V.ui

  const PACKAGE_ID = 'dsh-vcg'
  const REPO_PACKAGE_ID = 'dsh-vcg-repo'
  const VIEW_ID = 'vcg'

  /** Guard: render a friendly placeholder if a part failed to materialize. */
  function guard(component, label) {
    if (typeof component === 'function') return component
    return function MissingPart() {
      return h(Empty, { title: label + ' 未就绪', hint: '客户端构建缺少对应模块，请重新构建 client.js。', icon: 'warning' })
    }
  }

  /* ------------------------------------------------ new-chat VCG selector */

  /**
   * Blank-session (Hero) option: remember VCG as the preferred view for this
   * new conversation. The Host Conversation store reads the preference when it
   * materializes; our "新建 VCG 对话" flow writes it before opening.
   */
  function HeroVcgOption({ sessionId }) {
    const [preferred, setPreferred] = React.useState(() => V.readConversationView(sessionId) === VIEW_ID)
    React.useEffect(() => {
      setPreferred(V.readConversationView(sessionId) === VIEW_ID)
    }, [sessionId])
    const toggle = () => {
      const next = !preferred
      V.setPreferredView(sessionId, next ? VIEW_ID : 'chat')
      setPreferred(next)
    }
    return h(
      'button',
      {
        type: 'button',
        className: 'vcg-hero-option' + (preferred ? ' vcg-hero-option-on' : ''),
        title: preferred
          ? '本会话偏好 VCG 画布（发送首条消息后如未自动切换，点顶部「VCG 画布」页签）'
          : '新建聊天时使用 VCG 画布模式替代传统对话框',
        onClick: toggle,
        'aria-pressed': preferred,
      },
      h(Glyph, { name: 'sparkles', size: 14 }),
      preferred ? 'VCG 画布' : 'VCG 模式',
    )
  }

  /* ------------------------------------------------------------- apply */

  function apply(ctx) {
    V.bindLocale(ctx)
    const slots = ctx.get('slots')
    if (!slots) {
      console.warn('[vcg] slots service unavailable; plugin inactive')
      return
    }

    /* Conversation / workspace navigation adapters (best effort). */
    try {
      const uiWorkspace = ctx.get('uiWorkspace')
      const layout = ctx.get('layout')
      V.setNav({
        ...(uiWorkspace
          ? {
              openSession: (sessionId) => uiWorkspace.openSession(sessionId),
              openWorkspace: (workspaceId, beforeOpen) => uiWorkspace.openWorkspace(workspaceId, beforeOpen),
              connectWorkspace: (workspaceId, options) => uiWorkspace.connectWorkspace(workspaceId, options),
              startSession: (workspaceId, options) => uiWorkspace.startSession(workspaceId, options),
            }
          : {}),
        openPanel: (panelId) => {
          if (layout && typeof layout.selectPanel === 'function') layout.selectPanel(panelId)
        },
        setPreferredView: V.setPreferredView,
        readConversationView: V.readConversationView,
      })
    } catch (error) {
      console.warn('[vcg] navigation adapters unavailable', error)
    }

    /* Warm the shared Host state so pages render without an extra round-trip. */
    void V.refresh().catch(() => {})

    ctx.effect(
      () =>
        slots.inject('settings.section', () =>
          slots.register(
            {
              name: 'settings.section',
              id: PACKAGE_ID,
              order: 42,
              label: () => V.t('appName'),
            },
            guard(V.SettingsPage, '设置页'),
          ),
        ),
      'vcg: settings section',
    )

    ctx.effect(
      () =>
        slots.inject('sidebar.panellist', () =>
          slots.register(
            {
              name: 'sidebar.panellist',
              id: PACKAGE_ID,
              order: 22,
              label: () => V.t('appName'),
            },
            guard(V.PanelIcon, '侧栏图标'),
          ),
        ),
      'vcg: sidebar panel',
    )

    ctx.effect(
      () =>
        slots.inject('main', () =>
          slots.register(
            {
              name: 'main',
              key: PACKAGE_ID,
            },
            guard(V.StudioPage, 'VCG 工作台'),
          ),
        ),
      'vcg: studio page',
    )

    /*
     * §13.4 专业模式门控：节点仓库侧栏只在 proMode === true 时注册。
     * 初始 store.state 可能为 null（V.refresh 异步），此时先隐藏；
     * state 到达后由 listeners 通知，切到 true 注册、切回 false 撤销。
     */
    let repoSlotDispose = null
    let repoSlotsRegistered = false
    const wantsRepoSlots = () => Boolean(V.store.state && V.store.state.proMode === true)
    const registerRepoSlots = () => {
      if (repoSlotsRegistered) return
      repoSlotsRegistered = true
      const disposers = [
        slots.inject('sidebar.panellist', () =>
          slots.register(
            {
              name: 'sidebar.panellist',
              id: REPO_PACKAGE_ID,
              order: 24,
              label: () => 'VCG 节点工作流仓库',
            },
            guard(V.RepoPanelIcon || V.PanelIcon, '节点仓库图标'),
          ),
        ),
        slots.inject('main', () =>
          slots.register(
            {
              name: 'main',
              key: REPO_PACKAGE_ID,
            },
            guard(V.NodeRepoPage, 'VCG 节点工作流仓库'),
          ),
        ),
      ].filter((dispose) => typeof dispose === 'function')
      repoSlotDispose = () => {
        for (const dispose of disposers.splice(0)) {
          try {
            dispose()
          } catch (error) {
            console.warn('[vcg] node repository slot dispose failed', error)
          }
        }
      }
    }
    const unregisterRepoSlots = () => {
      repoSlotsRegistered = false
      const dispose = repoSlotDispose
      repoSlotDispose = null
      if (typeof dispose === 'function') {
        try {
          dispose()
        } catch (error) {
          console.warn('[vcg] node repository slot dispose failed', error)
        }
      }
    }
    const syncRepoSlots = () => {
      if (wantsRepoSlots()) registerRepoSlots()
      else unregisterRepoSlots()
    }
    V.store.listeners.add(syncRepoSlots)
    ctx.effect(() => {
      syncRepoSlots()
      return () => {
        V.store.listeners.delete(syncRepoSlots)
        unregisterRepoSlots()
      }
    }, 'vcg: node repository (proMode gate)')

    ctx.effect(
      () =>
        slots.inject('conversation.view', () =>
          slots.register(
            {
              name: 'conversation.view',
              id: VIEW_ID,
              order: 15,
              locale: V.NS,
              label: () => 'VCG 画布',
              inject: (sessionId) => ({ sessionId }),
            },
            guard(V.ChatCanvasView, 'VCG 画布视图'),
          ),
        ),
      'vcg: conversation view',
    )

    ctx.effect(
      () =>
        slots.inject('conversation.hero.options', () =>
          slots.register(
            {
              name: 'conversation.hero.options',
              id: 'vcg-new-chat',
              order: 12,
              locale: V.NS,
              inject: (sessionId) => ({ sessionId }),
            },
            HeroVcgOption,
          ),
        ),
      'vcg: new chat selector',
    )
  }

  const HERO_CSS = `
.vcg-hero-option{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:3px 10px;font-size:12px;font-family:inherit;cursor:pointer;white-space:nowrap}
.vcg-hero-option:hover{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.vcg-hero-option-on{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,transparent);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,var(--dsw-alias-bg-layer-1))}
`
  // The hero selector is tiny; inject its styles once through a wrapper so the
  // component stays a plain function.
  function withHeroStyle(component) {
    return function StyledHeroOption(props) {
      return h(React.Fragment, null, h('style', { dangerouslySetInnerHTML: { __html: HERO_CSS } }), h(component, props))
    }
  }
  HeroVcgOption = withHeroStyle(HeroVcgOption)

  V.apply = apply
  V.inject = ['slots', 'locale']
})(V)
