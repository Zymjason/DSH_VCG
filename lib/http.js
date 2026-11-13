/**
 * Minimal HTTP layer for the VCG host: JSON requests with a hard timeout,
 * bounded retries on transient failures, and user-readable Chinese errors.
 *
 * Retry policy (§9): network failures, HTTP 429 and 5xx retry twice with
 * exponential backoff; other 4xx fail immediately with the server message.
 */

import { messageOf, sleep, tail } from './util.js'

/** One HTTP failure with the provider status attached. */
export class HttpError extends Error {
  constructor(message, { status = 0, body = '', code = '' } = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.body = body
    this.code = code
  }
}

/** Extract the most useful server-side message from a response body. */
export function serverMessage(body, json) {
  const data = json && typeof json === 'object' ? json : undefined
  if (data) {
    const candidates = [
      data.error?.message,
      data.error?.msg,
      data.message,
      data.msg,
      data.output?.message,
      data.output?.error?.message,
      data.error,
      data.code,
      data.detail,
    ]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim() !== '') return tail(candidate.trim(), 500)
    }
  }
  const text = typeof body === 'string' ? body.trim() : ''
  return text === '' ? '' : tail(text, 500)
}

/** Readable error text for one non-2xx response. */
export function readableHttpError(status, body, json) {
  const detail = serverMessage(body, json)
  if (status === 401 || status === 403) {
    return `API 鉴权失败（HTTP ${status}）：请检查 API Key 是否正确、是否有该模型权限${detail ? `。服务端信息：${detail}` : ''}`
  }
  if (status === 404) {
    return `接口不存在（HTTP 404）：请检查服务地址是否正确（Base URL 应指向 /compatible-mode/v1 之类的 API 根路径）${detail ? `。服务端信息：${detail}` : ''}`
  }
  if (status === 429) return `请求过于频繁或额度不足（HTTP 429）：${detail || '请稍后重试'}`
  if (status >= 500) return `云端服务异常（HTTP ${status}）：${detail || '请稍后重试'}`
  return `云端接口错误（HTTP ${status}）：${detail || '请求被拒绝'}`
}

/** Whether the status is worth retrying (429 / 5xx only). */
export function isRetryableStatus(status) {
  return status === 429 || (status >= 500 && status <= 599)
}

/** Combine an optional caller signal with one per-request timeout signal. */
export function withTimeoutSignal(signal, timeoutMs) {
  const timeout = AbortSignal.timeout(Math.max(1000, Number(timeoutMs) || 30000))
  if (!signal) return timeout
  try {
    return AbortSignal.any([signal, timeout])
  } catch {
    return timeout
  }
}

/** Parse a response body as JSON without throwing. */
export function parseJsonSafe(text) {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/**
 * Perform one HTTP request and return a normalized result.
 *
 * @param {string} url request URL
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {Record<string,string>} [options.headers]
 * @param {unknown} [options.body] object (serialized) or string
 * @param {number} [options.timeoutMs]
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.retries] transient retries (default 2)
 * @param {number} [options.retryBaseMs] exponential backoff base
 * @param {boolean} [options.throwOnError] throw HttpError on 4xx/5xx (default true)
 * @param {typeof fetch} [options.fetchImpl]
 * @returns {Promise<{status:number, ok:boolean, json:any, text:string, headers:Headers}>}
 */
export async function requestJson(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 30000,
    signal,
    retries = 2,
    retryBaseMs = 400,
    throwOnError = true,
    fetchImpl = globalThis.fetch,
  } = options
  if (typeof fetchImpl !== 'function') throw new Error('当前运行环境不支持网络请求（缺少 fetch）')
  const target = String(url ?? '').trim()
  if (target === '') throw new Error('请求地址为空')
  const payload =
    body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
  const requestHeaders = { 'Content-Type': 'application/json', Accept: 'application/json', ...headers }
  const maxAttempts = Math.max(1, Math.min(4, Number(retries) + 1 || 1))
  let lastError
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const timeoutSignal = withTimeoutSignal(signal, timeoutMs)
    let response
    try {
      response = await fetchImpl(target, {
        method,
        headers: requestHeaders,
        ...(payload === undefined ? {} : { body: payload }),
        signal: timeoutSignal,
      })
    } catch (error) {
      if (signal?.aborted) throw new Error('请求已取消')
      lastError = new Error(
        timeoutSignal.aborted
          ? `请求超时（${Math.round((Number(timeoutMs) || 30000) / 1000)} 秒）：${target}`
          : `网络请求失败：${messageOf(error)}`,
      )
      if (attempt < maxAttempts - 1) {
        await sleep(retryBaseMs * 3 ** attempt)
        continue
      }
      throw lastError
    }
    let text = ''
    try {
      text = await response.text()
    } catch {
      text = ''
    }
    const json = parseJsonSafe(text)
    if (response.ok) {
      return { status: response.status, ok: true, json, text, headers: response.headers }
    }
    const error = new HttpError(readableHttpError(response.status, text, json), {
      status: response.status,
      body: text,
      code: String(json?.code ?? ''),
    })
    if (isRetryableStatus(response.status) && attempt < maxAttempts - 1) {
      lastError = error
      await sleep(retryBaseMs * 3 ** attempt)
      continue
    }
    if (throwOnError) throw error
    return { status: response.status, ok: false, json, text, headers: response.headers }
  }
  throw lastError ?? new Error('网络请求失败')
}

/** Fetch one JSON document (GET) with a hard timeout. */
export async function fetchJson(url, { timeoutMs = 15000, signal, fetchImpl, headers } = {}) {
  const result = await requestJson(url, {
    method: 'GET',
    timeoutMs,
    signal,
    retries: 1,
    fetchImpl,
    headers: { Accept: 'application/json', ...(headers ?? {}) },
  })
  if (result.json === undefined) throw new Error(`返回内容不是有效 JSON：${url}`)
  return result.json
}

/**
 * Download a URL (including `data:` URLs) into a Buffer with a hard timeout.
 * Returns the bytes and the response content type.
 */
export async function fetchBytes(url, { timeoutMs = 120000, signal, fetchImpl = globalThis.fetch } = {}) {
  const target = String(url ?? '').trim()
  if (target === '') throw new Error('下载地址为空')
  const dataMatch = /^data:([\w.+/-]+)?;base64,(.*)$/is.exec(target)
  if (dataMatch) {
    return { buffer: Buffer.from(dataMatch[2], 'base64'), contentType: dataMatch[1] ?? '', finalUrl: target }
  }
  if (typeof fetchImpl !== 'function') throw new Error('当前运行环境不支持网络请求（缺少 fetch）')
  const timeoutSignal = withTimeoutSignal(signal, timeoutMs)
  let response
  try {
    response = await fetchImpl(target, { signal: timeoutSignal })
  } catch (error) {
    if (signal?.aborted) throw new Error('下载已取消')
    throw new Error(`下载文件失败：${messageOf(error)}`)
  }
  if (!response.ok) throw new Error(`下载文件失败（HTTP ${response.status}）：${tail(target, 200)}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const contentType = String(response.headers?.get?.('content-type') ?? '')
  return { buffer: bytes, contentType, finalUrl: response.url || target }
}
