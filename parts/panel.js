/* ============================================================================
 * VCG 视觉控制生成器 — 侧栏图标
 * Visual Control Generator — sidebar panel icon (V.PanelIcon).
 *
 * 品牌图形：节点连线 + 星芒（当前颜色 currentColor，宿主高亮面板时自动适配）。
 * ==========================================================================*/
(function (V) {
  'use strict'

  const { h } = V

  const SVG_LABEL = 'VCG 视觉控制生成器'

  function PanelIcon(props) {
    const size = (props && (props.size || props.width || props.height)) || 18
    return h(
      'svg',
      {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        className: 'vcg-panel-icon',
        role: 'img',
        'aria-label': SVG_LABEL,
        'aria-hidden': undefined,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'block', flex: 'none' },
      },
      /* 连线：三节点环形连接，代表节点式工作流 */
      h('path', { d: 'M7.4 7.4l9.2 1.1' }),
      h('path', { d: 'M6.9 9.6l3.4 7.1' }),
      h('path', { d: 'M17.6 9.8l-6.6 6.6' }),
      /* 节点 */
      h('circle', { cx: 5.4, cy: 7, r: 2.2, fill: 'currentColor', stroke: 'none' }),
      h('circle', { cx: 18.7, cy: 9.5, r: 2.2, fill: 'currentColor', stroke: 'none' }),
      h('circle', { cx: 11.7, cy: 18.6, r: 2.2, fill: 'currentColor', stroke: 'none' }),
      /* 星芒（生成 / AI） */
      h('path', {
        d: 'M19.4 1.6l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z',
        fill: 'currentColor',
        stroke: 'none',
      }),
      /* 中心连线小点 */
      h('circle', { cx: 11.9, cy: 11.2, r: 1.1, fill: 'currentColor', stroke: 'none', opacity: 0.9 }),
    )
  }

  V.PanelIcon = PanelIcon
})(V)
