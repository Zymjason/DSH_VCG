/**
 * Path safety and output-file naming for VCG.
 * 纯函数：safeResolveOutputPath / isWithin / mimeForPath / outputFileName 均可 self-test。
 */

import { basename, extname, isAbsolute, join, resolve, sep } from 'node:path'

/** The plugin's fallback output directory name. */
export const DEFAULT_OUTPUT_DIR = 'vcg-output'

/** Whether `target` resolves to `root` or one of its descendants. */
export function isWithin(root, target) {
  const base = resolve(String(root ?? '.'))
  const candidate = resolve(String(target ?? ''))
  if (candidate === base) return true
  const prefix = base.endsWith(sep) ? base : `${base}${sep}`
  return candidate.startsWith(prefix)
}

/**
 * Join path segments under one base directory, refusing escapes.
 * Throws a readable Chinese error when the resolved path leaves the base.
 */
export function safeJoin(baseDir, ...parts) {
  const base = resolve(String(baseDir ?? '.'))
  for (const part of parts) {
    const value = String(part ?? '')
    if (value === '' || value === '.' || value === '..' || isAbsolute(value) || value.includes('..') || value.includes(sep) || value.includes('/')) {
      throw new Error(`非法的文件名或路径片段：${value || '(空)'}（只允许单层相对名称）`)
    }
  }
  const target = resolve(join(base, ...parts.map(String)))
  if (!isWithin(base, target)) throw new Error(`路径越界：${target} 不在 ${base} 内`)
  return target
}

/**
 * Build the absolute output path for one generated file.
 * `name` must be a single file name (no directory separators, no `..`).
 */
export function safeResolveOutputPath(baseDir, name) {
  const value = String(name ?? '').trim()
  if (value === '') throw new Error('输出文件名不能为空')
  if (value === '.' || value === '..') throw new Error(`非法的输出文件名：${value}`)
  if (isAbsolute(value)) throw new Error(`输出文件名必须是相对名称：${value}`)
  if (/[\\/]/.test(value)) throw new Error(`输出文件名不能包含路径分隔符：${value}`)
  if (value.includes('..')) throw new Error(`输出文件名不能包含 ..：${value}`)
  const base = resolve(String(baseDir ?? '.'))
  return safeJoin(base, value)
}

/** Sanitize one arbitrary token into a safe single path segment. */
export function safeSegment(value, fallback = 'item') {
  const raw = String(value ?? '').trim()
  const cleaned = raw.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').replace(/\s+/g, '-').replace(/\.{2,}/g, '.').replace(/^-+|-+$/g, '')
  return cleaned === '' || cleaned === '.' ? fallback : cleaned.slice(0, 80)
}

/** Whether a relative path is a safe single-segment name. */
export function isSafeFileName(name) {
  const value = String(name ?? '')
  return value !== '' && value !== '.' && value !== '..' && !isAbsolute(value) && !/[\\/]/.test(value) && !value.includes('..')
}

/** Extension (without dot, lowercase) from a URL, data URL or file name. */
export function extFromUrl(raw) {
  const value = String(raw ?? '').trim()
  if (value === '') return ''
  const match = /^data:([\w.+/-]+);base64,/i.exec(value)
  if (match) {
    const mime = match[1].toLowerCase()
    return MIME_EXT[mime] ?? ''
  }
  let pathname = value
  try {
    pathname = new URL(value).pathname
  } catch {
    pathname = value.split(/[?#]/)[0]
  }
  return extname(pathname).replace(/^\./, '').toLowerCase()
}

/** MIME type of a file path (image/video-friendly whitelist). */
export function mimeForPath(filePath) {
  const ext = extname(String(filePath ?? '')).replace(/^\./, '').toLowerCase()
  return EXT_MIME[ext] ?? 'application/octet-stream'
}

/** MIME → extension table used when downloading remote files. */
export const MIME_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/json': 'json',
  'text/plain': 'txt',
}

const EXT_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  json: 'application/json',
  txt: 'text/plain',
}

/** The extension of one output kind when nothing better is known. */
export function defaultExt(kind) {
  if (kind === 'video') return 'mp4'
  return 'png'
}

/** Timestamp stamp used inside output file names: 20261113-103612. */
export function fileStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  )
}

/** Output file name shape: vcg-<timestamp>-<nodeId>.<ext>. */
export function outputFileName(nodeId, ext = 'png', date = new Date()) {
  const id = safeSegment(nodeId, 'node')
  const suffix = safeSegment(ext, 'png').toLowerCase().replace(/^\./, '')
  return `vcg-${fileStamp(date)}-${id}.${suffix}`
}

/** Last path segment, safe to display. */
export function baseName(filePath) {
  try {
    return basename(String(filePath ?? ''))
  } catch {
    return String(filePath ?? '')
  }
}
