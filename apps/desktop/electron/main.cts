import { app, BrowserWindow, ipcMain, shell, Menu, dialog, Tray, nativeImage } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'

// Single-instance lock: if another instance is opened, forward args and quit
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let forceQuit = false

const isDev = process.env.NODE_ENV === 'development'

Menu.setApplicationMenu(null)

// Register hivora:// deep-link protocol
app.setAsDefaultProtocolClient('hivora')

// When a second instance is launched (e.g. from CLI or deep link), bring this window forward
app.on('second-instance', (_event, argv) => {
  showWindow()
  // Check if a deep link was passed as CLI arg on Windows
  const deepLink = argv.find(a => a.startsWith('hivora://'))
  if (deepLink && mainWindow) handleDeepLink(deepLink)
  handleCliArgs(argv)
})

// Parse CLI flags (--mode ask|agent, --prompt "...", <path>) and forward to renderer
function handleCliArgs(argv: string[]) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const modeIdx = argv.indexOf('--mode')
  const promptIdx = argv.indexOf('--prompt')
  const mode = modeIdx >= 0 ? argv[modeIdx + 1] : undefined
  const prompt = promptIdx >= 0 ? argv[promptIdx + 1] : undefined
  // First non-flag arg that looks like a path
  const folder = argv.slice(2).find(a => !a.startsWith('--') && (a === '.' || a.includes('/') || a.includes('\\')))
  if (mode || prompt || folder) {
    mainWindow.webContents.send('cli:open', { mode, prompt, folder })
  }
}

// macOS: deep link comes via open-url event
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

function handleDeepLink(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'auth') {
      const at = parsed.searchParams.get('at')
      const rt = parsed.searchParams.get('rt')
      if (at && rt && mainWindow && !mainWindow.isDestroyed()) {
        const name   = parsed.searchParams.get('name')   ?? ''
        const avatar = parsed.searchParams.get('avatar') ?? ''
        mainWindow.webContents.send('auth:deep-link', { at, rt, name, avatar })
      }
    }
  } catch { /* ignore malformed URLs */ }
}

function showWindow() {
  if (!mainWindow) { createWindow(); return }
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createTray() {
  // Use the branded app icon for the system tray.  We prefer the generated
  // PNG/ICO assets because SVG rendering in the tray can produce a blank or
  // incorrectly coloured square on Windows.  The assets are generated from
  // public/logo.svg (the Hivora brand logo) by `npm run generate-icon`.
  const candidates = [
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../build/icon.ico'),
  ]
  let icon: Electron.NativeImage | null = null
  for (const iconPath of candidates) {
    try {
      icon = nativeImage.createFromPath(iconPath)
      if (icon.isEmpty()) { icon = null; continue }
      // Resize to a crisp tray size; Electron will pick the best representation
      // on high-DPI displays when the source asset is large.
      icon = icon.resize({ width: 16, height: 16 })
      break
    } catch {
      icon = null
    }
  }
  if (!icon) {
    // Minimal 1×1 transparent PNG as last-resort fallback
    icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    )
  }

  tray = new Tray(icon)
  tray.setToolTip('Hivora — AI Agent Orchestration')

  const menu = Menu.buildFromTemplate([
    { label: 'Open Hivora',   click: showWindow },
    { type: 'separator' },
    { label: 'Quit Hivora',   click: () => { forceQuit = true; app.quit() } },
  ])
  tray.setContextMenu(menu)
  tray.on('click', showWindow)        // left-click on Windows shows window
  tray.on('double-click', showWindow) // double-click also shows window
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Hivora - Multi-AI Orchestration Platform',
    show: false,
    frame: false,
    backgroundColor: '#0d1117',
    icon: path.join(__dirname, '../build/icon.png'),
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow?.show()
    // Forward any CLI args this instance was launched with (cold start)
    handleCliArgs(process.argv)
    const deepLink = process.argv.find(a => a.startsWith('hivora://'))
    if (deepLink) handleDeepLink(deepLink)
  })

  // Zoom controls: Ctrl+= zoom in, Ctrl+- zoom out, Ctrl+0 reset
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (!input.control || input.type !== 'keyDown') return
    const wc = mainWindow!.webContents
    const z = wc.getZoomFactor()
    if (input.key === '=' || input.key === '+') wc.setZoomFactor(Math.min(3, Math.round((z + 0.1) * 10) / 10))
    else if (input.key === '-') wc.setZoomFactor(Math.max(0.25, Math.round((z - 0.1) * 10) / 10))
    else if (input.key === '0') wc.setZoomFactor(1)
  })
  mainWindow.webContents.on('did-fail-load', (_e, code) => {
    if (isDev && code !== -3) setTimeout(() => mainWindow?.loadURL('http://localhost:5173'), 1000)
  })

  // Hide to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!forceQuit) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  createWindow()
  createTray()

  // Set the dock icon on macOS so the branded logo appears there too
  if (process.platform === 'darwin' && app.dock) {
    const dockIconPath = path.join(__dirname, '../build/icon.png')
    try { app.dock.setIcon(dockIconPath) } catch { /* ignore */ }
  }

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', () => { if (mainWindow === null) createWindow() })
})

// Keep the process alive when all windows are hidden
app.on('window-all-closed', () => {
  // Do NOT quit — app lives in the tray
  // On macOS this is standard; on Windows we explicitly keep it alive
})

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info)
})

autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('update-progress', progress)
})

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded')
})

import { scanDirectory } from './scanner.cjs'

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall()
})

ipcMain.handle('fs:scan', async (_, dirPath?: string) => {
  const targetDir = dirPath || path.join(__dirname, '../../src') // Default to desktop/src
  try {
    return scanDirectory(targetDir)
  } catch (error) {
    console.error('Scan error:', error)
    return []
  }
})

// IPC: Cloud API proxy
ipcMain.handle('api:request', async (_, { method, path: apiPath, body, token, baseUrl }: {
  method: string; path: string; body?: unknown; token?: string; baseUrl?: string
}) => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    // baseUrl lets the renderer point at a remote server (hivora_server_url);
    // falls back to localhost for single-machine dev.
    const root = (baseUrl || 'http://localhost:4000').replace(/\/$/, '')
    const res = await fetch(`${root}${apiPath}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    // Surface the HTTP status so callers can detect 401 (refresh) / 409 (conflict)
    return (json && typeof json === 'object' && !Array.isArray(json)) ? { ...json, status: res.status } : { data: json, status: res.status }
  } catch (error) {
    return { error: true, message: String(error) }
  }
})

// Window Management
ipcMain.handle('window:minimize', () => { mainWindow?.minimize() })
ipcMain.handle('window:maximize', () => {
  if (mainWindow) mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})
ipcMain.handle('window:close', () => { mainWindow?.hide() })   // hides to tray
ipcMain.handle('window:quit',  () => { forceQuit = true; app.quit() }) // real exit
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)
ipcMain.handle('shell:open', (_, url: string) => { if (url) shell.openExternal(url) })

// Dialog: pick a folder
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Select Project Folder',
  })
  return result.canceled ? null : result.filePaths[0]
})

// Dialog: pick one or more files
ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    title: 'Attach Files',
  })
  return result.canceled ? [] : result.filePaths
})

// FS: read a text file
ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    const { readFile } = await import('fs/promises')
    const content = await readFile(filePath, 'utf-8')
    return { ok: true, content }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})

// FS: write a text file (creates parent directories if missing)
ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
  try {
    const { writeFile, mkdir } = await import('fs/promises')
    const { dirname } = await import('path')
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, content, 'utf-8')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})

// FS: list directory (one level)
ipcMain.handle('fs:listDir', async (_, dirPath: string) => {
  try {
    const { readdir, stat } = await import('fs/promises')
    const { join } = await import('path')
    const entries = await readdir(dirPath)
    const result = await Promise.all(
      entries
        .filter(e => !e.startsWith('.') && e !== 'node_modules' && e !== 'dist' && e !== '.next')
        .map(async name => {
          const fullPath = join(dirPath, name)
          const s = await stat(fullPath)
          return { name, path: fullPath, isDir: s.isDirectory() }
        })
    )
    return result.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1))
  } catch (e) {
    return []
  }
})

// Git: get branch name from a folder
ipcMain.handle('git:branch', async (_, folderPath: string) => {
  try {
    const { execFile } = await import('child_process')
    const { promisify } = await import('util')
    const exec = promisify(execFile)
    const { stdout } = await exec('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: folderPath })
    return stdout.trim()
  } catch {
    return null
  }
})

// AI: stream a response directly from AI providers (no CORS, full Node.js fetch)
const activeStreams = new Map<string, AbortController>()

ipcMain.handle('ai:stream', async (_event, opts: {
  panelId: string
  messages: Array<{ role: string; content: string }>
  provider: string
  model: string
  apiKey: string
  // budget models: 0=off, positive=token budget
  // effort models: 0=off, 1=low, 2=medium, 3=high
  reasoning?: number
}) => {
  const { panelId, messages, provider, model, apiKey } = opts
  const reasoning = opts.reasoning ?? 0
  const win = mainWindow
  if (!win) return

  const abort = new AbortController()
  activeStreams.set(panelId, abort)

  const send = (channel: string, data: unknown) => {
    if (!win.isDestroyed()) win.webContents.send(channel, data)
  }

  try {
    let url: string
    let headers: Record<string, string>
    let body: unknown

    if (provider === 'anthropic') {
      url = 'https://api.anthropic.com/v1/messages'
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'interleaved-thinking-2025-05-14',
      }
      // reasoning is the actual budget_tokens value (0 = off, positive = enabled)
      const thinkingBudget = reasoning > 0 ? reasoning : 0
      body = {
        model,
        max_tokens: thinkingBudget > 0 ? thinkingBudget + 8096 : 8096,
        stream: true,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content || 'You are a helpful AI coding assistant working in a collaborative multi-agent environment.',
        ...(thinkingBudget > 0 ? { thinking: { type: 'enabled', budget_tokens: thinkingBudget } } : {}),
      }
    } else if (provider === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`
      headers = { 'Content-Type': 'application/json' }
      const sysMsg = messages.find(m => m.role === 'system')?.content
      // Gemini 2.5 models support thinkingConfig.thinkingBudget (reasoning > 0 = token budget)
      const geminiThinkBudget = reasoning > 0 ? reasoning : undefined
      body = {
        contents: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        ...(sysMsg ? { systemInstruction: { parts: [{ text: sysMsg }] } } : {}),
        generationConfig: {
          maxOutputTokens: 8096,
          ...(geminiThinkBudget !== undefined ? { thinkingConfig: { thinkingBudget: geminiThinkBudget } } : {}),
        },
      }
    } else {
      const baseUrls: Record<string, string> = {
        openai:      'https://api.openai.com/v1',
        groq:        'https://api.groq.com/openai/v1',
        mistral:     'https://api.mistral.ai/v1',
        deepseek:    'https://api.deepseek.com/v1',
        xai:         'https://api.x.ai/v1',
        together:    'https://api.together.xyz/v1',
        cohere:      'https://api.cohere.ai/compatibility/v1',
        perplexity:  'https://api.perplexity.ai',
      }
      url = `${baseUrls[provider] ?? baseUrls.openai}/chat/completions`
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
      // OpenAI o-series: reasoning is 1=low, 2=medium, 3=high effort
      const isOpenAIReasoner = provider === 'openai' && /^o\d/.test(model)
      const effortMap: Record<number, string> = { 1: 'low', 2: 'medium', 3: 'high' }
      const oaiEffort = effortMap[reasoning] ?? 'medium'
      body = {
        model,
        messages,
        stream: true,
        max_tokens: 8096,
        // Ask OpenAI-compatible APIs to emit a final usage chunk with real token counts
        stream_options: { include_usage: true },
        ...(isOpenAIReasoner && reasoning > 0 ? { reasoning_effort: oaiEffort } : {}),
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: abort.signal,
    })

    if (!response.ok) {
      const errText = await response.text()
      send('ai:error', { panelId, error: errText })
      return
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    // Real token usage reported by the provider (not an estimate)
    let inputTokens = 0
    let outputTokens = 0
    let reasoningTokens = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') continue
        try {
          const parsed = JSON.parse(raw)
          let chunk = ''
          if (provider === 'anthropic') {
            if (parsed.type === 'content_block_delta') chunk = parsed.delta?.text ?? ''
            // message_start carries input usage; message_delta carries cumulative output usage
            if (parsed.type === 'message_start' && parsed.message?.usage) {
              inputTokens = parsed.message.usage.input_tokens ?? inputTokens
            }
            if (parsed.usage?.output_tokens != null) outputTokens = parsed.usage.output_tokens
          } else if (provider === 'gemini') {
            chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
            // usageMetadata is sent on every chunk (cumulative); keep the latest
            const um = parsed.usageMetadata
            if (um) {
              inputTokens     = um.promptTokenCount ?? inputTokens
              outputTokens    = um.candidatesTokenCount ?? outputTokens
              reasoningTokens = um.thoughtsTokenCount ?? reasoningTokens
            }
          } else {
            chunk = parsed.choices?.[0]?.delta?.content ?? ''
            // OpenAI-compatible: final chunk (choices empty) carries usage
            if (parsed.usage) {
              inputTokens     = parsed.usage.prompt_tokens ?? inputTokens
              outputTokens    = parsed.usage.completion_tokens ?? outputTokens
              reasoningTokens = parsed.usage.completion_tokens_details?.reasoning_tokens ?? reasoningTokens
            }
          }
          if (chunk) send('ai:chunk', { panelId, chunk })
        } catch { /* malformed SSE line, skip */ }
      }
    }
    send('ai:done', { panelId, usage: { inputTokens, outputTokens, reasoningTokens } })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg !== 'AbortError' && !msg.includes('aborted')) {
      send('ai:error', { panelId, error: msg })
    }
  } finally {
    activeStreams.delete(panelId)
  }
})

ipcMain.handle('ai:stop', (_event, panelId: string) => {
  activeStreams.get(panelId)?.abort()
  activeStreams.delete(panelId)
})

// Validate an API key against the provider's real endpoint (rejects fake keys).
// Uses the cheap /models listing — no token cost. A 401/403 means the key is
// fake/invalid; 200 means valid; anything else (endpoint quirk / network) is
// treated as inconclusive so a real key is never wrongly rejected.
ipcMain.handle('key:validate', async (_event, opts: { provider: string; apiKey: string }) => {
  const { provider, apiKey } = opts
  if (!apiKey || !apiKey.trim()) return { ok: false, reason: 'empty' as const }
  try {
    let url: string
    let headers: Record<string, string> = {}
    if (provider === 'anthropic') {
      url = 'https://api.anthropic.com/v1/models'
      headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
    } else if (provider === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
    } else if (provider === 'cohere') {
      url = 'https://api.cohere.ai/v1/models'
      headers = { Authorization: `Bearer ${apiKey}` }
    } else {
      const bases: Record<string, string> = {
        openai: 'https://api.openai.com/v1', groq: 'https://api.groq.com/openai/v1',
        mistral: 'https://api.mistral.ai/v1', deepseek: 'https://api.deepseek.com/v1',
        xai: 'https://api.x.ai/v1', together: 'https://api.together.xyz/v1',
        perplexity: 'https://api.perplexity.ai',
      }
      url = `${bases[provider] ?? bases.openai}/models`
      headers = { Authorization: `Bearer ${apiKey}` }
    }
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })
    if (res.ok) return { ok: true as const, status: res.status }
    if (res.status === 401 || res.status === 403) return { ok: false as const, reason: 'unauthorized' as const, status: res.status }
    // Other statuses (e.g. endpoint without a /models list) — can't confirm fake, allow
    return { ok: true as const, status: res.status, inconclusive: true }
  } catch (e) {
    // Network/timeout — don't block a possibly-real key
    return { ok: true as const, inconclusive: true, error: String(e) }
  }
})

// Clipboard: write text
ipcMain.handle('clipboard:write', async (_event, text: string) => {
  const { clipboard } = await import('electron')
  clipboard.writeText(text)
})

// Voice → text via OpenAI Whisper (Web Speech API does not work in Electron)
ipcMain.handle('whisper:transcribe', async (_event, opts: {
  audio: Uint8Array | number[]
  apiKey: string
  mimeType?: string
}) => {
  try {
    if (!opts.apiKey) return { ok: false, error: 'NO_OPENAI_KEY' }
    const buffer = Buffer.from(opts.audio as Uint8Array)
    const blob = new Blob([buffer], { type: opts.mimeType || 'audio/webm' })
    const form = new FormData()
    form.append('file', blob, 'audio.webm')
    form.append('model', 'whisper-1')
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${opts.apiKey}` },
      body: form,
    })
    const data = await res.json() as { text?: string; error?: { message?: string } }
    if (data.text) return { ok: true, text: data.text }
    return { ok: false, error: data.error?.message || 'Transcription failed' }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})

// ── Integrated Terminal (node-pty) ─────────────────────────────────────────────
// node-pty is a native module and must be required (not dynamically imported) so
// electron-builder's asarUnpack can correctly resolve the .node binary.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pty = require('node-pty')
const ptySessions = new Map<string, ReturnType<typeof pty.spawn>>()

ipcMain.handle('terminal:create', (_event, { id, cwd }: { id: string; cwd?: string }) => {
  const shell = process.platform === 'win32'
    ? (process.env.COMSPEC ?? 'powershell.exe')
    : (process.env.SHELL ?? '/bin/bash')
  const spawnOpts = { name: 'xterm-color', cols: 80, rows: 24, cwd: cwd ?? app.getPath('home') }
  const proc = pty.spawn(shell, [], spawnOpts)
  proc.onData((data: string) => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('terminal:data', { id, data })
  })
  proc.onExit(({ exitCode }: { exitCode: number }) => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('terminal:exit', { id, exitCode })
    ptySessions.delete(id)
  })
  ptySessions.set(id, proc)
  return { ok: true }
})

ipcMain.handle('terminal:write',  (_event, { id, data }: { id: string; data: string }) => {
  ptySessions.get(id)?.write(data)
})

ipcMain.handle('terminal:resize', (_event, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
  ptySessions.get(id)?.resize(cols, rows)
})

ipcMain.handle('terminal:kill', (_event, id: string) => {
  try { ptySessions.get(id)?.kill() } catch { /* already dead */ }
  ptySessions.delete(id)
})
