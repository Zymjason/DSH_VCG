#!/usr/bin/env node
/**
 * VCG client bundle builder.
 *
 * The Harness Web client loads one plain-JS module per plugin through
 * `window.__ModuleLoader__.load({ id, factory(require) })`. We author the client
 * half as ordered IIFE parts sharing one object `V`; this script wraps them in
 * that module envelope so the plugin stays dependency-free and readable in
 * source form.
 *
 * Usage: node build.mjs [--check]
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(await readFile(join(here, 'package.json'), 'utf8'))
const PARTS = ['core', 'canvas', 'settings', 'studio', 'panel', 'repo', 'view', 'apply']
const pkgName = pkg.name

const parts = []
for (const name of PARTS) {
  const file = join(here, 'parts', `${name}.js`)
  let source
  try {
    source = await readFile(file, 'utf8')
  } catch {
    if (name === 'canvas' || name === 'settings' || name === 'studio' || name === 'panel' || name === 'repo') {
      console.warn(`[vcg build] missing part parts/${name}.js — skipping`)
      continue
    }
    throw new Error(`missing required part parts/${name}.js`)
  }
  if (/^\s*import\s/m.test(source)) throw new Error(`parts/${name}.js must not use ESM import statements`)
  parts.push(`/* ==== part: ${name}.js ==== */\n${source.trim()}\n`)
}

const header = `/**
 * VCG 视觉控制生成器 — 浏览器半部分（由 build.mjs 从 parts/*.js 生成，勿手改）。
 * Visual Control Generator browser half, generated from parts/*.js.
 */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkgName)},
  factory(require) {
    'use strict'
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement
    const Fragment = React.Fragment
    const V = { React, ReactDOM, h, Fragment, NS: 'vcg' };
`

const footer = `
    if (typeof V.apply !== 'function') throw new Error('vcg client: parts/apply.js must export V.apply')
    return {
      name: ${JSON.stringify(pkgName)},
      inject: V.inject || ['slots', 'locale'],
      apply: V.apply,
    }
  },
})
`

const out = header + parts.join('\n;\n') + ';\n' + footer
const target = join(here, 'client.js')
await writeFile(target, out, 'utf8')
console.log(`[vcg build] wrote ${target} (${out.split('\n').length} lines, ${parts.length} parts)`)
