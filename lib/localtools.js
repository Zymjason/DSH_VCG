/**
 * Local toolchain + model directory management (§16.5 / §16.6).
 *
 * The host never installs Python itself: this module only detects what is
 * available, spawns `python3 -m pip` installs on request (CPU wheels only,
 * `--user`, streamed progress + log tail), downloads model files into the
 * configured model directory with size/sha256 verification, and inspects
 * safetensors / torch weight files through a short python script.
 *
 * Everything here is best-effort and user readable; callers enforce proMode
 * and devMode gates at the RPC boundary.
 */

import { spawn, execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { createWriteStream } from 'node:fs'
import { mkdir, readdir, readFile, rename, rm, stat, statfs, writeFile } from 'node:fs/promises'
import { basename, extname, isAbsolute, join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { dataDirectory, defaultModelsDir } from './state.js'
import { isPlainObject, messageOf, nowIso, tail } from './util.js'
import { isSafeFileName, isWithin } from './paths.js'

/** Model file extensions the picker / listing understands. */
export const MODEL_EXTENSIONS = ['.safetensors', '.ckpt', '.pt', '.pth', '.bin']
/** Formats accepted for `modelsDownload({format})` (gguf is audit-only §16.3). */
export const MODEL_FORMATS = ['safetensors', 'ckpt', 'pt', 'pth', 'bin', 'gguf']
/** Installable local tool components. */
export const TOOL_COMPONENTS = ['torch', 'safetensors', 'all']
/** CPU wheel index so an install never pulls CUDA builds. */
export const TORCH_CPU_INDEX = 'https://download.pytorch.org/whl/cpu'

const DETECT_TTL_MS = 8000
const MAX_LOG_TAIL = 4000
const MAX_INSPECT_OUTPUT = 8 * 1024 * 1024

/** Normalize one install component name; throws a readable error when unknown. */
export function normalizeToolComponent(component) {
  const value = String(component ?? '').trim() || 'all'
  if (!TOOL_COMPONENTS.includes(value)) {
    throw new Error(`未知安装组件：${value || '(空)'}（允许：${TOOL_COMPONENTS.join('/')}）`)
  }
  return value
}

/**
 * The exact pip argv lists used for one component (pure, exposed for tests).
 * `all` installs safetensors first (small) and torch second (large, CPU-only).
 */
export function pipCommandsFor(component) {
  const target = normalizeToolComponent(component)
  const safetensors = ['-m', 'pip', 'install', '--user', 'safetensors']
  const torch = ['-m', 'pip', 'install', '--user', '--index-url', TORCH_CPU_INDEX, 'torch']
  if (target === 'torch') return [torch]
  if (target === 'safetensors') return [safetensors]
  return [safetensors, torch]
}

/** Normalize one trusted-sources registry (§16.5). */
export function normalizeTrustedSources(raw) {
  const source = isPlainObject(raw) ? raw : {}
  const listRaw = Array.isArray(source.hosts) ? source.hosts : Array.isArray(raw) ? raw : []
  const hosts = []
  const seen = new Set()
  for (const item of listRaw) {
    let host = ''
    let trusted = true
    let name = ''
    let note = ''
    if (typeof item === 'string') {
      host = item
    } else if (isPlainObject(item)) {
      host = typeof item.host === 'string' ? item.host : ''
      trusted = item.trusted !== false
      name = typeof item.name === 'string' ? item.name.trim() : ''
      note = typeof item.note === 'string' ? item.note.trim() : ''
    }
    host = host.trim().toLowerCase().replace(/^\.+/, '').replace(/\.+$/, '')
    if (host === '' || host.includes('/') || !/^[a-z0-9][a-z0-9.-]*$/.test(host) || seen.has(host)) continue
    seen.add(host)
    const entry = { host, name: name || host, trusted }
    if (note !== '') entry.note = note.slice(0, 200)
    hosts.push(entry)
  }
  const version = Number(source.version)
  return {
    version: Number.isFinite(version) && version > 0 ? Math.round(version) : 1,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : '',
    hosts,
  }
}

/** Whether one URL belongs to a trusted (https) model source. */
export function isTrustedUrl(url, registry) {
  let parsed
  try {
    parsed = new URL(String(url ?? '').trim())
  } catch {
    return { trusted: false, host: '', reason: '模型地址不是合法 URL' }
  }
  const host = parsed.hostname.toLowerCase()
  if (!/^https:$/i.test(parsed.protocol)) return { trusted: false, host, reason: '仅支持 https 模型地址' }
  const entries = Array.isArray(registry?.hosts) ? registry.hosts : []
  for (const entry of entries) {
    if (entry?.trusted === false) continue
    const candidate = String(entry?.host ?? '').toLowerCase()
    if (candidate !== '' && (host === candidate || host.endsWith(`.${candidate}`))) return { trusted: true, host, reason: '' }
  }
  return { trusted: false, host, reason: '模型源不在可信清单中' }
}

/** Run one short command, capturing stdout/stderr without throwing. */
function execCapture(command, args, { timeoutMs = 8000 } = {}) {
  return new Promise((resolveResult) => {
    execFile(command, args, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
      resolveResult({ ok: !error, stdout: String(stdout ?? ''), stderr: String(stderr ?? ''), error })
    })
  })
}

/** First non-empty line of some command output. */
function firstLine(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line !== '') ?? ''
}

/** Readable "not installed" hint for one python module probe. */
function moduleMissing(version) {
  const detail = firstLine(version.stderr)
  return detail === '' ? '未安装' : tail(detail.replace(/^.*?(No module named[^']*'?[^']*'?).*$/i, '$1'), 160)
}

/**
 * Python script that summarizes one weight file as one JSON line.
 * Kept in one string so `python3 -c` needs no temp file.
 */
const INSPECT_SCRIPT = `
import json, os, struct, sys

def format_size(value):
    size = float(value)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024 or unit == "TB":
            if unit == "B":
                return "%d %s" % (size, unit)
            return "%.2f %s" % (size, unit)
        size /= 1024.0

def fail(message):
    print(json.dumps({"error": message}, ensure_ascii=False))
    sys.exit(0)

path = sys.argv[1]
lower = path.lower()
out = {"path": path, "sizeBytes": os.path.getsize(path)}

if lower.endswith(".safetensors"):
    # §16.6: missing safetensors must produce an actionable install hint.
    try:
        import safetensors  # noqa: F401
    except ImportError:
        fail("未安装 safetensors：请在「设置 → VCG 视觉控制生成器 → 本地工具与模型」安装本地工具后重试")
    try:
        with open(path, "rb") as handle:
            raw = handle.read(8)
            if len(raw) < 8:
                fail("文件过小，不是有效的 safetensors 文件")
            length = struct.unpack("<Q", raw)[0]
            if length <= 0 or length > 104857600:
                fail("safetensors 头部长度异常，文件可能已损坏")
            header = json.loads(handle.read(length).decode("utf-8"))
    except SystemExit:
        raise
    except Exception as error:
        fail("读取 safetensors 文件失败：%s" % error)
    metadata = header.pop("__metadata__", {}) or {}
    tensors = []
    dtypes = []
    for name, info in header.items():
        if not isinstance(info, dict):
            continue
        dtype = str(info.get("dtype", ""))
        shape = info.get("shape") or []
        tensors.append({"name": name, "dtype": dtype, "shape": shape})
        if dtype and dtype not in dtypes:
            dtypes.append(dtype)
    out.update({"format": "safetensors", "tensorCount": len(tensors), "dtypes": dtypes, "sample": tensors[:8], "metadata": metadata})
    lines = ["文件：" + path, "格式：safetensors", "大小：" + format_size(out["sizeBytes"]), "张量数量：%d" % len(tensors), "数据类型：" + ("、".join(dtypes) if dtypes else "(无)")]
    if tensors:
        lines.append("示例：")
        for item in tensors[:8]:
            lines.append("  %s — %s %s" % (item["name"], item["dtype"] or "?", item["shape"]))
    if metadata:
        lines.append("元数据：" + json.dumps(metadata, ensure_ascii=False)[:300])
    print(json.dumps({"text": "\\n".join(lines), "details": out}, ensure_ascii=False))
elif lower.endswith(".ckpt") or lower.endswith(".pt") or lower.endswith(".pth") or lower.endswith(".bin"):
    try:
        import torch
    except ImportError:
        fail("未安装 PyTorch：请在「设置 → VCG 视觉控制生成器 → 本地工具与模型」安装 PyTorch 后重试")
    try:
        obj = torch.load(path, map_location="cpu", weights_only=False)
    except Exception as error:
        fail("PyTorch 读取权重失败：%s" % error)
    state = obj.get("state_dict") if isinstance(obj, dict) else obj
    fmt = lower.rsplit(".", 1)[-1]
    if isinstance(state, dict):
        keys = list(state.keys())
        dtypes = []
        sample = []
        for key in keys[:8]:
            tensor = state[key]
            shape = list(getattr(tensor, "shape", []) or [])
            dtype = str(getattr(tensor, "dtype", "")).replace("torch.", "")
            sample.append({"name": key, "dtype": dtype, "shape": shape})
            if dtype and dtype not in dtypes:
                dtypes.append(dtype)
        out.update({"format": fmt, "tensorCount": len(keys), "dtypes": dtypes, "sample": sample})
        lines = ["文件：" + path, "格式：" + fmt, "大小：" + format_size(out["sizeBytes"]), "张量数量：%d" % len(keys), "数据类型：" + ("、".join(dtypes) if dtypes else "(无)"), "示例："]
        for item in sample:
            lines.append("  %s — %s %s" % (item["name"], item["dtype"], item["shape"]))
        print(json.dumps({"text": "\\n".join(lines), "details": out}, ensure_ascii=False))
    else:
        out.update({"format": fmt, "tensorCount": 0, "dtypes": [], "sample": []})
        text = "\\n".join(["文件：" + path, "格式：" + fmt, "大小：" + format_size(out["sizeBytes"]), "未能识别标准权重结构（未取得张量字典）"])
        print(json.dumps({"text": text, "details": out}, ensure_ascii=False))
else:
    fail("不支持的文件类型（仅支持 .safetensors/.ckpt/.pt/.pth/.bin）：" + path)
`

/**
 * Local toolchain + model manager for one plugin instance.
 *
 * @param {object} options
 * @param {string} options.directory plugin data directory (trusted-sources.json)
 * @param {string|Function} [options.modelsDir] fixed path or getter
 * @param {{warn?:Function}} [options.logger]
 */
export class LocalTools {
  constructor({ directory, modelsDir = '', logger } = {}) {
    this.directory = directory ?? process.cwd()
    this.modelsDirFn = typeof modelsDir === 'function' ? modelsDir : () => String(modelsDir ?? '')
    this.log = logger
    this.detectCache = { at: 0, value: undefined }
    this.trusted = undefined
    this.trustedAt = 0
    this.installState = {
      installing: false,
      component: '',
      progress: 0,
      logTail: '',
      startedAt: '',
      finishedAt: '',
      error: '',
      command: '',
      child: undefined,
    }
    this.downloadState = { active: false, filename: '', received: 0, total: 0, progress: 0, error: '', startedAt: '' }
  }

  /* -------------------------------------------------------------- paths */

  modelsDirectory() {
    const raw = String(this.modelsDirFn() ?? '').trim()
    return raw === '' ? join(this.directory, 'models') : raw
  }

  async ensureModelsDir() {
    const dir = this.modelsDirectory()
    await mkdir(dir, { recursive: true })
    return dir
  }

  trustedFile() {
    return join(this.directory, 'trusted-sources.json')
  }

  /* ----------------------------------------------------------- detection */

  async detectTools(force = false) {
    const now = Date.now()
    if (!force && this.detectCache.value && now - this.detectCache.at < DETECT_TTL_MS) return this.detectCache.value
    const pythonResult = await execCapture('python3', ['--version'])
    const python = {
      available: pythonResult.ok,
      version: firstLine(pythonResult.stdout || pythonResult.stderr).replace(/^Python\s*/i, ''),
      error: pythonResult.ok ? '' : moduleMissing(pythonResult),
    }
    const tools = { python }
    if (!python.available) {
      for (const name of ['pip', 'torch', 'safetensors', 'cuda']) {
        tools[name] = { available: false, version: '', error: '未检测到 python3' }
      }
      this.detectCache = { at: now, value: tools }
      return tools
    }
    const pipResult = await execCapture('python3', ['-m', 'pip', '--version'])
    tools.pip = {
      available: pipResult.ok,
      version: (firstLine(pipResult.stdout).match(/pip\s+([\d.]+)/)?.[1] ?? '').trim(),
      error: pipResult.ok ? '' : '未检测到 pip（python3 -m pip 不可用）',
    }
    const torchResult = await execCapture('python3', ['-c', 'import torch;print(torch.__version__);print(torch.version.cuda or "")'])
    tools.torch = {
      available: torchResult.ok,
      version: torchResult.ok ? (torchResult.stdout.split(/\r?\n/)[0] ?? '').trim() : '',
      error: torchResult.ok ? '' : '未安装 torch',
    }
    const cudaVersion = torchResult.ok ? (torchResult.stdout.split(/\r?\n/)[1] ?? '').trim() : ''
    tools.cuda = {
      available: torchResult.ok && cudaVersion !== '',
      version: cudaVersion,
      error: torchResult.ok ? (cudaVersion === '' ? '当前 torch 为 CPU 版本' : '') : '未安装 torch',
    }
    const safetensorsResult = await execCapture('python3', ['-c', 'import safetensors;print(getattr(safetensors, "__version__", ""))'])
    tools.safetensors = {
      available: safetensorsResult.ok,
      version: safetensorsResult.ok ? firstLine(safetensorsResult.stdout) : '',
      error: safetensorsResult.ok ? '' : '未安装 safetensors',
    }
    this.detectCache = { at: now, value: tools }
    return tools
  }

  /** Full status snapshot consumed by `toolsStatus` (§16.5). */
  async status({ force = false } = {}) {
    const tools = await this.detectTools(force)
    const modelsDir = this.modelsDirectory()
    let diskFreeMB = 0
    try {
      await mkdir(modelsDir, { recursive: true })
      const info = await statfs(modelsDir)
      diskFreeMB = Math.round((Number(info.bavail) * Number(info.bsize)) / (1024 * 1024))
    } catch {
      /* disk reporting is best-effort */
    }
    const install = this.installState
    return {
      ...tools,
      diskFreeMB,
      modelsDir,
      installing: install.installing,
      progress: install.progress,
      logTail: install.logTail,
      component: install.component,
      command: install.command,
      startedAt: install.startedAt,
      finishedAt: install.finishedAt,
      error: install.error,
      download: { ...this.downloadState },
      detectedAt: nowIso(),
    }
  }

  /* ----------------------------------------------------------- installing */

  /**
   * Start one pip install (non-blocking). `dryRun` validates and reports the
   * planned commands without spawning pip (used by tests / offline setups).
   */
  async install(component, { dryRun = false } = {}) {
    if (this.installState.installing) throw new Error('已有本地工具安装任务正在进行，请等待完成后再试')
    const target = normalizeToolComponent(component)
    const commands = pipCommandsFor(target)
    const detection = await this.detectTools(true)
    // Another caller may have started an install while detection was running.
    if (this.installState.installing) throw new Error('已有本地工具安装任务正在进行，请等待完成后再试')
    if (!detection.python.available) {
      throw new Error('未检测到 python3：请先安装 Python 3.10+，再回到「设置 → VCG 视觉控制生成器 → 本地工具与模型」重试')
    }
    if (!detection.pip.available) {
      throw new Error('未检测到 pip：请先安装 pip（python3 -m ensurepip --upgrade），再回到设置重试')
    }
    const described = commands.map((args) => ['python3', ...args].join(' '))
    if (dryRun) {
      this.installState = {
        installing: false,
        component: target,
        progress: 100,
        logTail: ['（dry-run）已跳过实际安装，仅校验参数与命令'].join('\n'),
        startedAt: nowIso(),
        finishedAt: nowIso(),
        error: '',
        command: described.join(' && '),
        child: undefined,
      }
      return { started: true, dryRun: true, component: target, commands: described }
    }
    this.installState = {
      installing: true,
      component: target,
      progress: 1,
      logTail: '',
      startedAt: nowIso(),
      finishedAt: '',
      error: '',
      command: described[0],
      child: undefined,
    }
    void this.runInstall(commands, described)
    return { started: true, dryRun: false, component: target, commands: described }
  }

  /** Sequential pip runs with streamed progress + log tail. */
  async runInstall(commands, described) {
    const total = commands.length
    try {
      for (let index = 0; index < total; index += 1) {
        this.installState.command = described[index]
        this.installState.progress = Math.max(1, Math.round((index / total) * 90))
        for await (const line of this.spawnPip(commands[index])) {
          this.appendLog(line)
          const match = /(\d{1,3})\s*%/.exec(line)
          const local = match ? Math.min(100, Number(match[1])) : Math.min(90, 10 + this.installState.progress)
          this.installState.progress = Math.max(1, Math.min(99, Math.round(((index + local / 100) / total) * 100)))
        }
      }
      this.installState.installing = false
      this.installState.progress = 100
      this.installState.finishedAt = nowIso()
      this.installState.error = ''
      this.appendLog('pip 安装完成')
    } catch (error) {
      this.installState.installing = false
      this.installState.finishedAt = nowIso()
      this.installState.error = messageOf(error)
      this.appendLog(`pip 安装失败：${messageOf(error)}`)
      this.log?.warn?.(`dsh-vcg: 本地工具安装失败: ${messageOf(error)}`)
    } finally {
      this.installState.child = undefined
      this.detectCache = { at: 0, value: undefined }
    }
  }

  /** Keep the log tail bounded. */
  appendLog(line) {
    const text = String(line ?? '').trim()
    if (text === '') return
    const merged = `${this.installState.logTail === '' ? '' : `${this.installState.logTail}\n`}${text}`
    this.installState.logTail = tail(merged, MAX_LOG_TAIL)
  }

  /** Async-iterate the output lines of one `python3 -m pip` run. */
  async *spawnPip(args) {
    const child = spawn('python3', args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PIP_DISABLE_PIP_VERSION_CHECK: '1', PYTHONUNBUFFERED: '1' },
    })
    this.installState.child = child
    const queue = []
    let closed = false
    let failure = undefined
    let wake = null
    const notify = () => {
      if (wake) {
        const resume = wake
        wake = null
        resume()
      }
    }
    const push = (chunk) => {
      for (const line of String(chunk ?? '').split(/\r?\n/)) {
        if (line.trim() !== '') queue.push(line.trim())
      }
      notify()
    }
    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')
    child.stdout?.on('data', push)
    child.stderr?.on('data', push)
    child.on('error', (error) => {
      failure = new Error(`无法启动 python3：${messageOf(error)}`)
      closed = true
      notify()
    })
    child.on('close', (code) => {
      if (!failure && code !== 0) failure = new Error(`pip 安装失败（退出码 ${code}）`)
      closed = true
      notify()
    })
    try {
      while (!closed || queue.length > 0) {
        if (queue.length === 0) {
          await new Promise((resolveNext) => {
            wake = resolveNext
          })
          continue
        }
        yield queue.shift()
      }
      if (failure) throw failure
    } finally {
      if (!closed) {
        try {
          child.kill('SIGTERM')
        } catch {
          /* ignore */
        }
      }
      this.installState.child = undefined
    }
  }

  /* ------------------------------------------------------------- models */

  /** List local weight files with their sidecar metadata (newest metadata wins). */
  async listModels() {
    const dir = await this.ensureModelsDir()
    let entries = []
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return []
    }
    const models = []
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const ext = extname(entry.name).toLowerCase()
      if (!MODEL_EXTENSIONS.includes(ext)) continue
      const path = join(dir, entry.name)
      const info = await stat(path).catch(() => null)
      if (!info) continue
      let meta = null
      try {
        meta = JSON.parse(await readFile(`${path}.json`, 'utf8'))
      } catch {
        meta = null
      }
      const name =
        meta && typeof meta.name === 'string' && meta.name.trim() !== ''
          ? meta.name.trim()
          : basename(entry.name, extname(entry.name))
      models.push({
        name,
        filename: entry.name,
        path,
        format: ext.slice(1),
        size: info.size,
        mtime: info.mtime.toISOString(),
        meta,
      })
    }
    return models.sort((a, b) => a.filename.localeCompare(b.filename, 'zh'))
  }

  /* ------------------------------------------------------ trusted sources */

  async loadTrustedRegistry(force = false) {
    if (!force && this.trusted && Date.now() - this.trustedAt < 5000) return this.trusted
    let raw
    try {
      raw = JSON.parse(await readFile(this.trustedFile(), 'utf8'))
    } catch {
      raw = undefined
    }
    this.trusted = normalizeTrustedSources(raw)
    this.trustedAt = Date.now()
    return this.trusted
  }

  async saveTrustedRegistry(raw) {
    const registry = normalizeTrustedSources(raw)
    await mkdir(this.directory, { recursive: true })
    await writeFile(this.trustedFile(), JSON.stringify(registry, null, 2), { mode: 0o600 })
    this.trusted = registry
    this.trustedAt = Date.now()
    return registry
  }

  /** `modelsTrust({url})` result (§16.5). */
  async trustFor(url) {
    const registry = await this.loadTrustedRegistry()
    const verdict = isTrustedUrl(url, registry)
    return {
      trusted: verdict.trusted,
      host: verdict.host,
      registryUpdatedAt: registry.updatedAt ?? '',
      ...(verdict.reason ? { reason: verdict.reason } : {}),
    }
  }

  /* ---------------------------------------------------------- downloads */

  /**
   * Download one model file into the model directory (§16.5).
   *
   * @param {object} args
   * @param {string} args.url https URL
   * @param {string} [args.filename] target file name
   * @param {string} [args.sha256] expected sha256
   * @param {number} [args.size] expected byte size
   * @param {string} [args.format] declared format
   * @param {boolean} [args.confirmUntrusted] allow a non-trusted host
   * @param {boolean} [args.overwrite] replace an existing file
   * @param {AbortSignal} [args.signal]
   */
  async downloadModel(args = {}) {
    const url = String(args?.url ?? '').trim()
    if (url === '') throw new Error('缺少模型下载地址（url）')
    let parsed
    try {
      parsed = new URL(url)
    } catch {
      throw new Error(`模型下载地址不是合法 URL：${url}`)
    }
    if (!/^https:$/i.test(parsed.protocol)) {
      throw new Error('模型下载仅支持 https 地址；本地文件请直接放入模型目录（设置 → 本地工具与模型）')
    }
    const registry = await this.loadTrustedRegistry()
    const verdict = isTrustedUrl(url, registry)
    if (!verdict.trusted && args?.confirmUntrusted !== true) {
      const error = new Error(
        `不可信模型源（UNTRUSTED_MODEL_SOURCE）：${verdict.host || parsed.hostname}。` +
          '该来源不在可信模型源清单中，确认风险后可勾选「信任此来源」再下载。',
      )
      error.code = 'UNTRUSTED_MODEL_SOURCE'
      error.host = verdict.host || parsed.hostname
      throw error
    }
    const requestedName = String(args?.filename ?? '').trim()
    const fallbackName = decodeURIComponent(basename(parsed.pathname))
    const filename = requestedName !== '' ? requestedName : fallbackName
    if (filename === '' || !isSafeFileName(filename)) {
      throw new Error(`模型文件名非法：${filename || '(空)'}（只允许单层文件名，不能包含路径分隔符）`)
    }
    const ext = extname(filename).toLowerCase()
    if (!MODEL_EXTENSIONS.includes(ext) && ext !== '.gguf') {
      throw new Error(`不支持的模型文件类型：${ext || '(无扩展名)'}（允许：${[...MODEL_EXTENSIONS, '.gguf'].join('/')}）`)
    }
    const formatRaw = String(args?.format ?? '').trim().toLowerCase()
    if (formatRaw !== '' && !MODEL_FORMATS.includes(formatRaw)) {
      throw new Error(`未知模型格式：${formatRaw}（允许：${MODEL_FORMATS.join('/')}）`)
    }
    const format = formatRaw !== '' ? formatRaw : ext.slice(1)
    if (format !== ext.slice(1)) throw new Error(`模型格式（${format}）与文件名扩展名（${ext}）不一致`)
    const expectedSize = Number(args?.size)
    const sizeWanted = Number.isFinite(expectedSize) && expectedSize > 0 ? Math.round(expectedSize) : 0
    const expectedSha = /^[a-f0-9]{64}$/i.test(String(args?.sha256 ?? '').trim()) ? String(args.sha256).trim().toLowerCase() : ''
    const dir = await this.ensureModelsDir()
    const target = join(dir, filename)
    if (!isWithin(dir, target)) throw new Error(`模型文件路径越界：${filename}`)
    const existing = await stat(target).catch(() => null)
    if (existing && args?.overwrite !== true) {
      throw new Error(`模型已存在：${filename}（如需覆盖请传 overwrite: true）`)
    }

    const tmp = `${target}.${process.pid}.part`
    await rm(tmp, { force: true }).catch(() => {})
    this.downloadState = { active: true, filename, received: 0, total: sizeWanted, progress: 0, error: '', startedAt: nowIso() }
    const hash = createHash('sha256')
    const file = createWriteStream(tmp, { mode: 0o600 })
    let received = 0
    try {
      const response = await fetch(url, { redirect: 'follow', signal: args?.signal })
      if (!response.ok) throw new Error(`模型下载失败（HTTP ${response.status}）：${url}`)
      const total = Number(response.headers.get('content-length')) || sizeWanted || 0
      this.downloadState.total = total
      if (!response.body) throw new Error('模型下载失败：服务端没有返回文件内容')
      for await (const chunk of Readable.fromWeb(response.body)) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        hash.update(buffer)
        received += buffer.length
        if (!file.write(buffer)) await once(file, 'drain')
        this.downloadState.received = received
        this.downloadState.progress = total > 0 ? Math.min(99, Math.round((received / total) * 100)) : 0
      }
      await new Promise((resolveEnd, rejectEnd) => {
        file.once('error', rejectEnd)
        file.end(() => resolveEnd())
      })
    } catch (error) {
      file.destroy()
      await rm(tmp, { force: true }).catch(() => {})
      this.downloadState.active = false
      this.downloadState.error = messageOf(error)
      throw error
    }

    const sha256 = hash.digest('hex')
    if (sizeWanted > 0 && received !== sizeWanted) {
      await rm(tmp, { force: true }).catch(() => {})
      this.downloadState.active = false
      this.downloadState.error = `模型大小校验失败（期望 ${sizeWanted}，实际 ${received}）`
      throw new Error(`模型大小校验失败：期望 ${sizeWanted} 字节，实际下载 ${received} 字节`)
    }
    if (expectedSha !== '' && sha256 !== expectedSha) {
      await rm(tmp, { force: true }).catch(() => {})
      this.downloadState.active = false
      this.downloadState.error = `SHA-256 校验失败（期望 ${expectedSha}，实际 ${sha256}）`
      throw new Error(`模型 SHA-256 校验失败：期望 ${expectedSha}，实际 ${sha256}`)
    }
    await rm(target, { force: true }).catch(() => {})
    await rename(tmp, target)
    const meta = {
      name: filename,
      filename,
      url,
      sha256,
      size: received,
      format,
      sourceHost: verdict.host || parsed.hostname,
      trusted: verdict.trusted,
      downloadedAt: nowIso(),
      ...(sizeWanted > 0 ? { declaredSize: sizeWanted } : {}),
      ...(expectedSha !== '' ? { declaredSha256: expectedSha } : {}),
    }
    const metadataPath = `${target}.json`
    try {
      await writeFile(metadataPath, JSON.stringify(meta, null, 2), { mode: 0o600 })
    } catch (error) {
      this.log?.warn?.(`dsh-vcg: 写入模型元数据失败: ${messageOf(error)}`)
    }
    this.downloadState.active = false
    this.downloadState.progress = 100
    return {
      path: target,
      filename,
      size: received,
      sha256,
      format,
      trusted: verdict.trusted,
      host: verdict.host || parsed.hostname,
      verified: { size: sizeWanted > 0, sha256: expectedSha !== '' },
      metadataPath,
      model: { name: filename, filename, path: target, format, size: received, sha256, mtime: nowIso(), meta },
    }
  }

  /* ------------------------------------------------------------ inspect */

  /** Resolve `model_file` (bare name inside modelsDir or absolute inside it). */
  resolveModelFile(raw) {
    const value = String(raw ?? '').trim()
    if (value === '') throw new Error('未选择权重文件（model_file 为空）：请在节点参数中选择模型文件')
    const dir = resolve(this.modelsDirectory())
    const target = isAbsolute(value) ? resolve(value) : resolve(dir, value)
    if (!isWithin(dir, target)) {
      throw new Error(`权重文件必须位于模型目录内：${dir}（当前：${target}）`)
    }
    return target
  }

  /** `safetensorsInspect` local executor (§16.6): returns `{text, details}`. */
  async inspectSafetensors({ file } = {}) {
    const target = this.resolveModelFile(file)
    const info = await stat(target).catch(() => null)
    if (!info || !info.isFile()) throw new Error(`权重文件不存在：${target}`)
    if (info.size === 0) throw new Error(`权重文件为空：${target}`)
    const result = await execCapture('python3', ['-c', INSPECT_SCRIPT, target], { timeoutMs: 60000 })
    if (!result.ok) {
      if (result.error?.code === 'ENOENT') {
        throw new Error('未检测到 python3：请在「设置 → VCG 视觉控制生成器 → 本地工具与模型」安装本地工具链')
      }
      const detail = tail(result.stderr || result.stdout, 800).trim()
      throw new Error(`本地权重检查失败：${detail || messageOf(result.error)}`)
    }
    let payload
    try {
      payload = JSON.parse(result.stdout)
    } catch {
      throw new Error(`本地权重检查未返回结果：python 输出无法解析（${tail(result.stdout, 300)}）`)
    }
    if (payload?.error) throw new Error(`本地权重检查失败：${payload.error}`)
    if (typeof payload?.text !== 'string' || payload.text === '') {
      throw new Error('本地权重检查未返回文本结果')
    }
    return { text: payload.text, details: payload.details ?? {} }
  }

  /** Kill a running pip install when the plugin unloads. */
  dispose() {
    const child = this.installState.child
    if (child) {
      try {
        child.kill('SIGTERM')
      } catch {
        /* ignore */
      }
    }
    this.installState.child = undefined
    this.installState.installing = false
  }
}

/**
 * One-shot `safetensorsInspect` helper for callers that do not keep a
 * {@link LocalTools} instance (§16.6). Reads tensor metadata from a weight file
 * inside `modelsDir` (defaults to the deployment data directory) and returns
 * `{ text, details }`; missing python3/safetensors/torch produce readable
 * install hints.
 *
 * @param {{file?: string, directory?: string, modelsDir?: string}} [input]
 * @param {{logger?: object}} [options]
 * @returns {Promise<{text: string, details: object}>}
 */
export async function runSafetensorsInspect(input = {}, options = {}) {
  const directory = String(input.directory ?? '').trim() || dataDirectory()
  const tools = new LocalTools({
    directory,
    modelsDir: String(input.modelsDir ?? '').trim() || defaultModelsDir(directory),
    logger: options.logger,
  })
  try {
    return await tools.inspectSafetensors({ file: input.file })
  } finally {
    tools.dispose()
  }
}
