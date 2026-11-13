/**
 * Generic helpers shared by the VCG host modules.
 * 本文件不依赖任何宿主服务，可被 self-test 直接 import。
 */

import { randomUUID } from 'node:crypto'

/** Turn an unknown thrown value into readable text. */
export function messageOf(error) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

/** Sleep for a bounded number of milliseconds. */
export function sleep(ms) {
  const delay = Number(ms)
  return new Promise((resolve) => setTimeout(resolve, Number.isFinite(delay) && delay > 0 ? delay : 0))
}

/** Clamp one number into [min, max]. */
export function clamp(value, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

/** Whether a value is a plain (non-array, non-null) object. */
export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Keep only the tail of a long text, bounded by characters. */
export function tail(value, limit = 600) {
  const text = typeof value === 'string' ? value : ''
  return text.length <= limit ? text : `…${text.slice(text.length - limit)}`
}

/** Truncate a text to a character bound. */
export function truncate(value, limit = 600) {
  const text = typeof value === 'string' ? value : ''
  return text.length <= limit ? text : `${text.slice(0, limit)}…`
}

/** Stable-ish identifier with a readable prefix. */
export function uid(prefix = 'id') {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`
}

/** Current ISO timestamp (single source for createdAt/updatedAt). */
export function nowIso() {
  return new Date().toISOString()
}

/** Coerce any value to a safe prompt/filename string. */
export function textOf(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/** Normalize a user-typed API root URL (no trailing slash, no endpoint suffix). */
export function normalizeBaseUrl(raw) {
  let value = typeof raw === 'string' ? raw.trim() : ''
  if (value === '') return ''
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`
  value = value.replace(/\/+$/, '')
  value = value.replace(/\/(?:chat\/completions|images\/generations|models)$/i, '')
  return value.replace(/\/+$/, '')
}

/** Deduplicate and trim a list of strings. */
export function uniqueStrings(list) {
  const seen = new Set()
  const out = []
  for (const item of Array.isArray(list) ? list : []) {
    const value = typeof item === 'string' ? item.trim() : ''
    if (value === '' || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

/** A JSON response on the shared fetch channel. */
export function jsonResponse(status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/** Positive integer or a fallback. */
export function positiveInt(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return clamp(Math.round(n), min, max)
}
