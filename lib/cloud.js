/**
 * Cloud providers for VCG: model classification, the Alibaba Token Plan
 * chat-completion image/text protocol (§9), OpenAI-style image/video routes,
 * and generic custom HTTP routes.
 *
 * All calls go through lib/http.js, which owns timeouts and the retry policy
 * (network / 429 / 5xx → 2 retries with exponential backoff; other 4xx fail
 * immediately with a readable Chinese error).
 */

import { fetchJson, requestJson, serverMessage } from './http.js'
import { tail } from './util.js'
import { messageOf, normalizeBaseUrl, truncate, uniqueStrings } from './util.js'

/** Models known to be available on the global Alibaba Token Plan route. */
export const KNOWN_IMAGE_MODELS = ['wan2.7-image', 'wan2.7-image-pro', 'qwen-image-3.0-pro']
export const KNOWN_VIDEO_MODELS = ['wan3.0-video']
export const KNOWN_TEXT_MODELS = ['qwen3.8-max']
export const DEFAULT_IMAGE_SIZE = '1280*720'

/** Classify a model id into image / video / text / audio ('' when unknown). */
export function classifyModel(id) {
  const value = typeof id === 'string' ? id.trim().toLowerCase() : ''
  if (value === '') return ''
  if (/(^|[-/])(video|t2v|i2v|kling|veo|sora)/.test(value) || value.includes('wan3.0-video')) return 'video'
  if (/(image|img|flux|sdxl|stable-diffusion|dall-e|qwen-image|wan2\.7-image)/.test(value)) return 'image'
  // Audio / speech models also carry text-ish names (gpt-4o-audio, qwen-audio),
  // so they must be classified before the text bucket (§14.3).
  if (/(audio|tts|asr|realtime|speech|voice)/.test(value)) return 'audio'
  if (/(text|chat|qwen|deepseek|gpt|claude|gemini|llama|glm)/.test(value)) return 'text'
  return ''
}

/**
 * Bucket a flat model-id list into the state `models` shape.
 * `all` keeps every id, including ids with no known capability (§14.3).
 */
export function catalogModels(ids) {
  const list = uniqueStrings(ids)
  const catalog = { image: [], video: [], text: [], audio: [], all: list }
  for (const id of list) {
    const kind = classifyModel(id)
    if (kind !== '' && Array.isArray(catalog[kind])) catalog[kind].push(id)
  }
  return catalog
}

/**
 * Preferred default model of one capability: the contract-known model when the
 * live catalog advertises it, else the catalog's first entry.
 * @param {'image'|'video'|'text'} capability
 * @param {string[]} catalog detected model ids
 */
export function preferredModel(capability, catalog) {
  const known = capability === 'image' ? KNOWN_IMAGE_MODELS : capability === 'video' ? KNOWN_VIDEO_MODELS : KNOWN_TEXT_MODELS
  const list = Array.isArray(catalog) ? catalog : []
  for (const model of known) {
    if (list.includes(model)) return model
  }
  return list[0] ?? ''
}

/**
 * Merge two model catalogs, keeping the first occurrence.
 * `all` is merged too and defaults to `[]` for older catalogs that lack it.
 */
export function mergeCatalogs(...catalogs) {
  const out = { image: [], video: [], text: [], audio: [], all: [] }
  for (const catalog of catalogs) {
    if (!catalog || typeof catalog !== 'object') continue
    out.image.push(...(Array.isArray(catalog.image) ? catalog.image : []))
    out.video.push(...(Array.isArray(catalog.video) ? catalog.video : []))
    out.text.push(...(Array.isArray(catalog.text) ? catalog.text : []))
    out.audio.push(...(Array.isArray(catalog.audio) ? catalog.audio : []))
    out.all.push(...(Array.isArray(catalog.all) ? catalog.all : []))
  }
  return {
    image: uniqueStrings(out.image),
    video: uniqueStrings(out.video),
    text: uniqueStrings(out.text),
    audio: uniqueStrings(out.audio),
    all: uniqueStrings(out.all),
  }
}

/**
 * Normalize a size for the cloud API into the exact `W*H` shape (§9).
 * Accepts `1280*720`, `1280x720`, `1280×720`, `{width,height}` or `[w,h]`.
 */
export function normalizeSize(size, fallback = DEFAULT_IMAGE_SIZE) {
  let width
  let height
  if (size && typeof size === 'object' && !Array.isArray(size)) {
    width = Number(size.width)
    height = Number(size.height)
  } else if (Array.isArray(size)) {
    width = Number(size[0])
    height = Number(size[1])
  } else if (typeof size === 'string') {
    const match = /^\s*(\d{2,5})\s*[*x×X,]\s*(\d{2,5})\s*$/.exec(size)
    if (match) {
      width = Number(match[1])
      height = Number(match[2])
    }
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    const [fw, fh] = String(fallback).split('*').map(Number)
    return `${Number.isFinite(fw) ? fw : 1280}*${Number.isFinite(fh) ? fh : 720}`
  }
  return `${Math.round(width)}*${Math.round(height)}`
}

/** Compose the final image prompt from positive/negative text. */
export function composeImagePrompt(prompt, negative) {
  const positive = truncate(String(prompt ?? '').trim(), 4000)
  const neg = truncate(String(negative ?? '').trim(), 2000)
  if (positive === '') throw new Error('生图提示词为空：请填写正向提示词')
  return neg === '' ? positive : `${positive}\nNegative prompt: ${neg}`
}

/**
 * Parse one chat-completion response carrying generated images (§9).
 * Returns normalized image descriptors; never throws for a well-formed empty
 * response (the caller turns that into a readable error).
 */
export function parseChatImageResponse(json) {
  const images = []
  const push = (value, extra = {}) => {
    if (typeof value !== 'string' || value.trim() === '') return
    images.push({ url: value.trim(), ...extra })
  }
  const output = json && typeof json === 'object' ? json.output ?? json : undefined
  const choices = Array.isArray(output?.choices) ? output.choices : Array.isArray(json?.choices) ? json.choices : []
  for (const choice of choices) {
    const content = choice?.message?.content
    if (typeof content === 'string') {
      // Some routes inline the URL in text content.
      const url = /https?:\/\/[^\s"'<>]+/i.exec(content)?.[0]
      if (url) push(url)
      continue
    }
    if (Array.isArray(content)) {
      for (const block of content) {
        if (!block || typeof block !== 'object') continue
        push(block.image)
        push(block.image_url?.url ?? block.image_url)
        push(block.url)
        if (block.type === 'video' || block.video) push(block.video ?? block.video_url?.url)
      }
    }
  }
  const data = Array.isArray(json?.data) ? json.data : Array.isArray(output?.data) ? output.data : []
  for (const item of data) {
    if (typeof item === 'string') push(item)
    else if (item && typeof item === 'object') {
      push(item.url)
      if (typeof item.b64_json === 'string' && item.b64_json !== '') {
        push(`data:image/png;base64,${item.b64_json}`)
      }
    }
  }
  if (images.length === 0) {
    // Last-resort: scan the serialized response for one media URL.
    try {
      const text = JSON.stringify(json)
      const url = /https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|mp4|webm|mov)(?:\?[^\s"'<>]*)?/i.exec(text)?.[0]
      if (url) push(url)
    } catch {
      /* ignore */
    }
  }
  return { images, usage: json?.usage, raw: json }
}

/** Parse the text content of one standard OpenAI chat completion. */
export function parseChatTextResponse(json) {
  const choices = Array.isArray(json?.choices) ? json.choices : Array.isArray(json?.output?.choices) ? json.output.choices : []
  for (const choice of choices) {
    const content = choice?.message?.content ?? choice?.text
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
      const text = content
        .map((block) => (block && typeof block === 'object' && typeof block.text === 'string' ? block.text : ''))
        .join('')
      if (text !== '') return text
    }
  }
  return ''
}

/** Auth headers for one provider key. */
function authHeaders(apiKey, extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra }
  if (typeof apiKey === 'string' && apiKey !== '') headers.Authorization = `Bearer ${apiKey}`
  return headers
}

/** Endpoint builder that tolerates base URLs that already include the route. */
function endpoint(baseUrl, suffix) {
  const base = normalizeBaseUrl(baseUrl)
  if (base === '') throw new Error('Provider 未配置 API 地址（baseUrl）')
  if (base.toLowerCase().endsWith(suffix.toLowerCase())) return base
  if (suffix === '/chat/completions' && /\/chat\/completions$/i.test(base)) return base
  if (suffix === '/images/generations' && /\/images\/generations$/i.test(base)) return base
  return `${base}${suffix}`
}

/**
 * Call the §9 chat-completion image protocol on the global route.
 * @returns {Promise<{images:Array<{url:string}>, usage:any, model:string}>}
 */
export async function chatImage({ baseUrl, apiKey, model, prompt, negative, size, signal, timeoutMs = 180000, fetchImpl }) {
  const body = {
    model: String(model ?? '').trim() || KNOWN_IMAGE_MODELS[0],
    messages: [{ role: 'user', content: [{ type: 'text', text: composeImagePrompt(prompt, negative) }] }],
    parameters: { size: normalizeSize(size), n: 1 },
  }
  const result = await requestJson(endpoint(baseUrl, '/chat/completions'), {
    method: 'POST',
    headers: authHeaders(apiKey),
    body,
    timeoutMs,
    signal,
    retries: 2,
    fetchImpl,
  })
  const parsed = parseChatImageResponse(result.json)
  if (parsed.images.length === 0) {
    throw new Error(`云端未返回图片：${serverMessage(result.text, result.json) || '响应中没有 image 内容'}`)
  }
  return { images: parsed.images, usage: parsed.usage, model: body.model, raw: parsed.raw }
}

/**
 * Standard OpenAI chat completion for text.
 * @returns {Promise<{text:string, model:string, usage:any}>}
 */
export async function chatText({
  baseUrl,
  apiKey,
  model,
  prompt,
  system,
  messages,
  maxTokens,
  temperature,
  signal,
  timeoutMs = 120000,
  fetchImpl,
}) {
  const conversation = Array.isArray(messages) && messages.length > 0
    ? messages
    : [{ role: 'user', content: typeof prompt === 'string' ? prompt : '' }]
  const body = {
    model: String(model ?? '').trim() || KNOWN_TEXT_MODELS[0],
    messages: system ? [{ role: 'system', content: system }, ...conversation] : conversation,
  }
  if (Number.isFinite(maxTokens)) body.max_tokens = Math.max(1, Math.round(maxTokens))
  if (Number.isFinite(temperature)) body.temperature = temperature
  const result = await requestJson(endpoint(baseUrl, '/chat/completions'), {
    method: 'POST',
    headers: authHeaders(apiKey),
    body,
    timeoutMs,
    signal,
    retries: 2,
    fetchImpl,
  })
  const text = parseChatTextResponse(result.json)
  if (text.trim() === '') {
    throw new Error(`文本模型未返回内容：${serverMessage(result.text, result.json) || '响应为空'}`)
  }
  return { text, model: body.model, usage: result.json?.usage }
}

/** OpenAI-style image route (`POST /images/generations`). */
async function openaiImages({ baseUrl, apiKey, model, prompt, negative, size, signal, timeoutMs = 180000, fetchImpl }) {
  const [width, height] = normalizeSize(size).split('*')
  const body = {
    model: String(model ?? '').trim(),
    prompt: composeImagePrompt(prompt, negative),
    size: `${width}x${height}`,
    n: 1,
    response_format: 'url',
  }
  const result = await requestJson(endpoint(baseUrl, '/images/generations'), {
    method: 'POST',
    headers: authHeaders(apiKey),
    body,
    timeoutMs,
    signal,
    retries: 2,
    fetchImpl,
  })
  const parsed = parseChatImageResponse(result.json)
  if (parsed.images.length === 0) {
    throw new Error(`生图接口未返回图片：${serverMessage(result.text, result.json) || '响应为空'}`)
  }
  return { images: parsed.images, usage: parsed.usage, model: body.model }
}

/** Generic custom HTTP image route: POST {model,prompt,size,n} to baseUrl. */
async function customHttpImage({ baseUrl, apiKey, model, prompt, negative, size, signal, timeoutMs = 180000, fetchImpl }) {
  const body = {
    model: String(model ?? '').trim(),
    prompt: composeImagePrompt(prompt, negative),
    size: normalizeSize(size),
    n: 1,
  }
  const result = await requestJson(endpoint(baseUrl, ''), {
    method: 'POST',
    headers: authHeaders(apiKey),
    body,
    timeoutMs,
    signal,
    retries: 2,
    fetchImpl,
  })
  const parsed = parseChatImageResponse(result.json)
  if (parsed.images.length === 0) {
    const textUrl = /https?:\/\/[^\s"'<>]+/i.exec(result.text)?.[0]
    if (textUrl) return { images: [{ url: textUrl }], usage: undefined, model: body.model }
    throw new Error(`自定义生图接口未返回图片地址：${serverMessage(result.text, result.json) || tail(result.text, 300)}`)
  }
  return { images: parsed.images, usage: parsed.usage, model: body.model }
}

/**
 * Generate images through one provider record.
 * @param {object} provider normalized provider (id/kind/baseUrl)
 * @param {object} request {apiKey, model, prompt, negative, size, signal, timeoutMs}
 */
export async function generateImage(provider, request = {}) {
  const kind = provider?.kind ?? 'bailian-chat-image'
  const args = { ...request, baseUrl: provider?.baseUrl, apiKey: request.apiKey ?? provider?.apiKey }
  try {
    if (kind === 'openai-images') return await openaiImages(args)
    if (kind === 'custom-http') return await customHttpImage(args)
    if (kind === 'bailian-video' || kind === 'openai-video') {
      throw new Error(`该 Provider 类型（${kind}）不支持生图：请在「设置 → VCG 视觉控制生成器」把默认生图模型指向图像 Provider`)
    }
    return await chatImage(args)
  } catch (error) {
    const where = provider?.label ? `${provider.label}` : provider?.id ?? '云端'
    throw new Error(`${where} 生图失败：${messageOf(error)}`)
  }
}

/** Parse a video response into `{url}` descriptors. */
export function parseVideoResponse(json) {
  const urls = []
  const push = (value) => {
    if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) urls.push({ url: value.trim() })
  }
  const visit = (node, depth = 0) => {
    if (depth > 6 || node === null || node === undefined) return
    if (typeof node === 'string') {
      if (/^https?:\/\//i.test(node) && /\.(mp4|webm|mov)(\?|$)/i.test(node)) push(node)
      return
    }
    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth + 1)
      return
    }
    if (typeof node === 'object') {
      for (const key of ['url', 'video_url', 'videoUrl', 'video', 'output']) push(node[key])
      for (const value of Object.values(node)) visit(value, depth + 1)
    }
  }
  visit(json)
  const unique = []
  const seen = new Set()
  for (const item of urls) {
    if (seen.has(item.url)) continue
    seen.add(item.url)
    unique.push(item)
  }
  return unique
}

/**
 * Generate a video through one provider record.
 * Alibaba's chat route rejects video models (400); the readable error tells the
 * user to configure an OpenAI-video style provider through settings.
 */
export async function generateVideo(provider, request = {}) {
  const kind = provider?.kind ?? 'bailian-video'
  const baseUrl = normalizeBaseUrl(provider?.baseUrl)
  const apiKey = request.apiKey ?? provider?.apiKey
  const model = String(request.model ?? '').trim() || KNOWN_VIDEO_MODELS[0]
  const prompt = String(request.prompt ?? '').trim()
  if (prompt === '') throw new Error('视频提示词为空：请连接文本/提示词节点')
  const size = normalizeSize(request.size, '1280*720')
  try {
    if (kind === 'bailian-video' || kind === 'bailian-chat-image') {
      const result = await requestJson(endpoint(baseUrl, '/chat/completions'), {
        method: 'POST',
        headers: authHeaders(apiKey),
        body: {
          model,
          messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
          parameters: { size, n: 1 },
        },
        timeoutMs: request.timeoutMs ?? 300000,
        signal: request.signal,
        retries: 2,
      })
      const videos = parseVideoResponse(result.json)
      if (videos.length === 0) {
        throw new Error(
          `视频接口未返回视频地址：${serverMessage(result.text, result.json) || '响应为空'}。` +
            '阿里 token-plan 兼容接口目前不支持视频模型直连，请在「设置 → VCG 视觉控制生成器」新增 openai-video 类 Provider。',
        )
      }
      return { videos, model, usage: result.json?.usage }
    }
    // openai-video style: POST {baseUrl}/videos {model,prompt,size}
    const result = await requestJson(`${baseUrl}/videos`, {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: { model, prompt, size: size.replace('*', 'x'), n: 1 },
      timeoutMs: request.timeoutMs ?? 300000,
      signal: request.signal,
      retries: 2,
    })
    const videos = parseVideoResponse(result.json)
    if (videos.length === 0) {
      throw new Error(`视频接口未返回视频地址：${serverMessage(result.text, result.json) || '响应为空'}`)
    }
    return { videos, model, usage: result.json?.usage }
  } catch (error) {
    const where = provider?.label ? `${provider.label}` : provider?.id ?? '云端'
    throw new Error(`${where} 生视频失败：${messageOf(error)}`)
  }
}

/**
 * Detect available models for one provider record.
 * Tries `GET {baseUrl}/models`, falling back to the provider's stored catalog.
 * Always returns `{models, discovered, all}`; `all` lists every model id
 * (including non-generation ones) and is `[]` when nothing is known (§14.3).
 */
export async function listProviderModels(provider, { apiKey, signal, timeoutMs = 10000 } = {}) {
  const baseUrl = normalizeBaseUrl(provider?.baseUrl)
  const fallback = mergeCatalogs(provider?.models)
  if (baseUrl === '') return { models: fallback, discovered: false, all: fallback.all }
  try {
    const json = await fetchJson(endpoint(baseUrl, '/models'), {
      timeoutMs,
      signal,
      headers: authHeaders(apiKey),
    })
    const ids = []
    const data = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : []
    for (const item of data) {
      if (typeof item === 'string') ids.push(item)
      else if (item && typeof item === 'object') ids.push(item.id ?? item.model ?? item.name)
    }
    if (ids.filter(Boolean).length === 0) return { models: fallback, discovered: false, all: fallback.all }
    const models = mergeCatalogs(fallback, catalogModels(ids))
    return { models, discovered: true, all: models.all }
  } catch {
    return { models: fallback, discovered: false, all: fallback.all }
  }
}

/**
 * Test one provider connection: `/models` first, then a cheap text call, then
 * (only if the provider is image-only) a minimal image call.
 * @returns {Promise<{ok:boolean, models?:object, latencyMs:number, error?:string, mode?:string}>}
 */
export async function testProviderConnection(provider, { apiKey, defaults = {}, signal, fetchImpl } = {}) {
  const started = Date.now()
  const errors = []
  const baseUrl = normalizeBaseUrl(provider?.baseUrl)
  const latency = () => Date.now() - started
  if (baseUrl === '') return { ok: false, latencyMs: latency(), error: 'Provider 未配置 API 地址（Base URL）' }
  const modelsResult = await listProviderModels(provider, { apiKey, signal, timeoutMs: 10000 }).catch(() => undefined)
  if (modelsResult?.discovered) {
    return { ok: true, latencyMs: latency(), models: modelsResult.models, mode: 'models' }
  }
  if (modelsResult?.models && (modelsResult.models.image.length > 0 || modelsResult.models.text.length > 0)) {
    // /models failed but a catalog is configured: still probe with a real call below.
  }
  const textModel = String(defaults.textModel ?? '').trim()
  if (textModel !== '' || apiKey) {
    try {
      const model = textModel || modelsResult?.models?.text?.[0] || 'qwen3.8-max'
      await chatText({
        baseUrl,
        apiKey,
        model,
        prompt: 'ping',
        maxTokens: 8,
        timeoutMs: 20000,
        signal,
        fetchImpl,
      })
      return { ok: true, latencyMs: latency(), models: modelsResult?.models, mode: 'text' }
    } catch (error) {
      errors.push(messageOf(error))
    }
  }
  const imageModel =
    String(defaults.imageModel ?? '').trim() || modelsResult?.models?.image?.[0] || KNOWN_IMAGE_MODELS[0]
  try {
    const result = await generateImage(
      { ...provider, baseUrl },
      { apiKey, model: imageModel, prompt: 'connectivity test', size: DEFAULT_IMAGE_SIZE, timeoutMs: 120000, signal, fetchImpl },
    )
    return { ok: result.images.length > 0, latencyMs: latency(), models: modelsResult?.models, mode: 'image' }
  } catch (error) {
    errors.push(messageOf(error))
  }
  return {
    ok: false,
    latencyMs: latency(),
    models: modelsResult?.models,
    error: errors.length > 0 ? errors[errors.length - 1] : '无法连接 Provider：请检查 Base URL 与 API Key',
  }
}
