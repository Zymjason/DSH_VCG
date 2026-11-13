#!/usr/bin/env node
/**
 * Client bundle smoke test.
 *
 * Evaluates the generated client.js in a fake browser module table, materializes
 * the plugin factory with a fake React/ReactDOM, then runs `apply` against a fake
 * Cordis context and asserts every Slot registration the product depends on.
 *
 *   node scripts/smoke-client.mjs
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const packageDir = join(here, '..')

const failures = []
const assertions = []
function check(name, condition, detail) {
  assertions.push({ name, ok: Boolean(condition), detail })
  if (!condition) failures.push(name + (detail ? ' — ' + detail : ''))
}

/* ---------------------------------------------------------- fake browser */

function makeReact() {
  const noop = () => {}
  const react = {
    Fragment: Symbol('Fragment'),
    StrictMode: Symbol('StrictMode'),
    createElement(type, props, ...children) {
      return { type, props: Object.assign({}, props || {}, children.length ? { children } : {}), children }
    },
    cloneElement(element, props, ...children) {
      return Object.assign({}, element, { props: Object.assign({}, element.props, props || {}, children.length ? { children } : {}) })
    },
    isValidElement: (value) => Boolean(value && typeof value === 'object' && 'type' in value),
    useState(initial) {
      return [typeof initial === 'function' ? initial() : initial, noop]
    },
    useEffect: noop,
    useLayoutEffect: noop,
    useRef(value) {
      return { current: value }
    },
    useMemo(factory) {
      return factory()
    },
    useCallback(fn) {
      return fn
    },
    useContext(context) {
      return context && context.__value
    },
    useReducer(reducer, initial) {
      return [typeof initial === 'function' ? initial() : initial, noop]
    },
    useImperativeHandle: noop,
    useSyncExternalStore(_subscribe, getSnapshot) {
      return getSnapshot()
    },
    memo: (fn) => fn,
    forwardRef: (fn) => fn,
    createContext(value) {
      return { __value: value, Provider: Symbol('Provider'), Consumer: Symbol('Consumer') }
    },
    Children: { map: (children, fn) => (Array.isArray(children) ? children.map(fn) : []), toArray: (children) => (Array.isArray(children) ? children : children ? [children] : []) },
  }
  return new Proxy(react, {
    get(target, key) {
      if (key in target) return target[key]
      return noop
    },
  })
}

const registrations = []
let captured = null
globalThis.window = {
  __ModuleLoader__: {
    load(descriptor) {
      captured = descriptor
    },
  },
}
globalThis.localStorage = {
  _data: new Map(),
  getItem(key) {
    return this._data.has(key) ? this._data.get(key) : null
  },
  setItem(key, value) {
    this._data.set(key, String(value))
  },
  removeItem(key) {
    this._data.delete(key)
  },
}
globalThis.document = {
  createElement: () => ({ style: {}, remove() {}, select() {}, click() {} }),
  body: { appendChild() {}, removeChild() {} },
  execCommand: () => true,
  addEventListener() {},
  removeEventListener() {},
}

const react = makeReact()
const reactDom = { createPortal: (element) => element, flushSync: (fn) => fn && fn() }
const fakeRequire = (id) => {
  if (id === 'react') return react
  if (id === 'react-dom') return reactDom
  throw new Error('unexpected client require: ' + id)
}

/* ------------------------------------------------------------- evaluate */

const source = await readFile(join(packageDir, 'client.js'), 'utf8')
let loadError = ''
try {
  // Evaluate as a classic script body: no imports/exports are allowed by design.
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', 'localStorage', 'navigator', 'fetch', source)(
    globalThis.window,
    globalThis.document,
    globalThis.localStorage,
    {},
    undefined,
  )
} catch (error) {
  loadError = error && error.message ? error.message : String(error)
}
check('client.js evaluates without syntax/ASI failure', loadError === '', loadError)
check('module loader received a descriptor', captured && typeof captured.factory === 'function')
check('module id matches package name', captured && captured.id === '@local/dsh-vcg', captured && captured.id)

let moduleExports = null
let materializeError = ''
try {
  moduleExports = captured.factory(fakeRequire)
} catch (error) {
  materializeError = error && error.message ? error.message : String(error)
}
check('factory materializes every part', materializeError === '', materializeError)
check('exports apply()', moduleExports && typeof moduleExports.apply === 'function')
check('exports inject list', moduleExports && Array.isArray(moduleExports.inject) && moduleExports.inject.includes('slots'))

/* ---------------------------------------------------------------- apply */

const slots = {
  inject(_key, callback) {
    const disposer = callback()
    return typeof disposer === 'function' ? disposer : () => {}
  },
  register(options, component) {
    registrations.push({ slot: options && options.name, id: options && (options.id || options.key), component })
    return () => {}
  },
}
const locale = {
  register() {},
  bind() {
    return (key) => key
  },
  getSnapshot() {
    return { id: 'zh', locale: 'zh' }
  },
}
const disposers = []
const ctx = {
  get(name) {
    if (name === 'slots') return slots
    return undefined
  },
  inject(_deps, callback) {
    return callback({ get: ctx.get, effect: ctx.effect })
  },
  effect(callback) {
    const disposer = callback()
    disposers.push(disposer)
    return typeof disposer === 'function' ? disposer : () => {}
  },
  on() {
    return () => {}
  },
}
let applyError = ''
try {
  moduleExports.apply(ctx)
} catch (error) {
  applyError = error && error.message ? error.message : String(error)
}
check('apply() runs against a fake context', applyError === '', applyError)

const bySlot = (slotName) => registrations.filter((entry) => entry.slot === slotName)
const required = [
  ['settings.section', 'dsh-vcg'],
  ['sidebar.panellist', 'dsh-vcg'],
  ['main', 'dsh-vcg'],
  ['conversation.view', 'vcg'],
  ['conversation.hero.options', 'vcg-new-chat'],
  ['sidebar.panellist', 'dsh-vcg-repo'],
  ['main', 'dsh-vcg-repo'],
]
for (const [slot, id] of required) {
  const found = bySlot(slot).some((entry) => entry.id === id && typeof entry.component === 'function')
  check(`registers ${slot}#${id}`, found, JSON.stringify(bySlot(slot).map((entry) => entry.id)))
}

/* ----------------------------------------------------- one-pass render */

/* Render every registered component once against the fake React above.
   Hooks are no-ops and effects never run, so this only catches render-time
   crashes: missing V.ui components, undefined helpers, bad destructuring. */
const renderFailures = []
let renderedNodes = 0
const RENDER_LIMIT = 20000
function walkElement(node, depth) {
  if (depth > 60 || renderedNodes > RENDER_LIMIT) return
  if (node === null || node === undefined || node === false || node === true) return
  if (Array.isArray(node)) {
    for (const item of node) walkElement(item, depth + 1)
    return
  }
  if (typeof node === 'string' || typeof node === 'number') return
  if (!node || typeof node !== 'object' || !('type' in node)) return
  renderedNodes += 1
  const type = node.type
  const props = node.props || {}
  if (typeof type === 'function') {
    let out
    try {
      out = type(props)
    } catch (error) {
      renderFailures.push((type.name || 'anonymous') + ': ' + (error && error.message ? error.message : String(error)))
      return
    }
    walkElement(out, depth + 1)
    return
  }
  if (typeof type === 'symbol') {
    walkElement(props.children, depth + 1)
    return
  }
  walkElement(props.children, depth + 1)
}
for (const entry of registrations) {
  let out
  try {
    out = entry.component({ sessionId: undefined })
  } catch (error) {
    renderFailures.push(entry.slot + '#' + entry.id + ': ' + (error && error.message ? error.message : String(error)))
    continue
  }
  walkElement(out, 0)
}
check('registered components render one pass without throwing', renderFailures.length === 0, renderFailures.slice(0, 3).join(' ; '))
check('render walk covers a non-trivial tree', renderedNodes > 50, 'rendered nodes: ' + renderedNodes)

/* --------------------------------------------------------------- report */

const passed = assertions.filter((item) => item.ok).length
console.log('VCG client smoke test')
console.log('=====================')
for (const item of assertions) console.log(`  ${item.ok ? '✅' : '❌'} ${item.name}${item.detail && !item.ok ? ' — ' + item.detail : ''}`)
console.log(`\n结果: ${failures.length === 0 ? 'PASS' : 'FAIL'} — ${passed}/${assertions.length} 通过；Slot 注册 ${registrations.length} 条`)
if (failures.length > 0) {
  console.error('\n失败项:\n' + failures.map((item) => ' - ' + item).join('\n'))
  process.exit(1)
}
