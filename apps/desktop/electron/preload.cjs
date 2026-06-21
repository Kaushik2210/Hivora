const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  apiRequest:         (opts)    => ipcRenderer.invoke('api:request', opts),
  installUpdate:      ()        => ipcRenderer.invoke('update:install'),
  windowMinimize:     ()        => ipcRenderer.invoke('window:minimize'),
  windowMaximize:     ()        => ipcRenderer.invoke('window:maximize'),
  windowClose:        ()        => ipcRenderer.invoke('window:close'),  // hide to tray
  windowQuit:         ()        => ipcRenderer.invoke('window:quit'),   // real exit
  windowIsMaximized:  ()        => ipcRenderer.invoke('window:is-maximized'),
  shellOpen:          (url)     => ipcRenderer.invoke('shell:open', url),
  fsScan:             (dirPath) => ipcRenderer.invoke('fs:scan', dirPath),
  dialogOpenFolder:   ()        => ipcRenderer.invoke('dialog:openFolder'),
  dialogOpenFiles:    ()        => ipcRenderer.invoke('dialog:openFiles'),
  fsReadFile:         (p)       => ipcRenderer.invoke('fs:readFile', p),
  fsWriteFile:        (p, c)    => ipcRenderer.invoke('fs:writeFile', p, c),
  fsListDir:          (p)       => ipcRenderer.invoke('fs:listDir', p),
  gitBranch:          (p)       => ipcRenderer.invoke('git:branch', p),
  onMenuAction:       (cb)      => ipcRenderer.on('menu:add-task',    () => cb('add-task')),
  onSidebarSwitch:    (cb)      => ipcRenderer.on('menu:sidebar', (_, s) => cb(s)),
  onUpdateAvailable:  (cb)      => ipcRenderer.on('update-available',  (_, i) => cb(i)),
  onUpdateProgress:   (cb)      => ipcRenderer.on('update-progress',   (_, p) => cb(p)),
  onUpdateDownloaded: (cb)      => ipcRenderer.on('update-downloaded', () => cb()),

  // AI streaming
  aiStream:           (opts)    => ipcRenderer.invoke('ai:stream', opts),
  aiStop:             (panelId) => ipcRenderer.invoke('ai:stop', panelId),
  onAiChunk:          (cb)      => ipcRenderer.on('ai:chunk', (_, d) => cb(d)),
  onAiDone:           (cb)      => ipcRenderer.on('ai:done',  (_, d) => cb(d)),
  onAiError:          (cb)      => ipcRenderer.on('ai:error', (_, d) => cb(d)),
  removeAiListeners:  ()        => {
    ipcRenderer.removeAllListeners('ai:chunk')
    ipcRenderer.removeAllListeners('ai:done')
    ipcRenderer.removeAllListeners('ai:error')
  },

  // Clipboard
  clipboardWrite:     (text)    => ipcRenderer.invoke('clipboard:write', text),

  // Voice transcription (OpenAI Whisper)
  whisperTranscribe:  (opts)    => ipcRenderer.invoke('whisper:transcribe', opts),

  // Validate an API key against the provider's real endpoint
  keyValidate:        (provider, apiKey) => ipcRenderer.invoke('key:validate', { provider, apiKey }),

  // Integrated Terminal (node-pty)
  terminalCreate:     (opts)    => ipcRenderer.invoke('terminal:create', opts),
  terminalWrite:      (opts)    => ipcRenderer.invoke('terminal:write', opts),
  terminalResize:     (opts)    => ipcRenderer.invoke('terminal:resize', opts),
  terminalKill:       (id)      => ipcRenderer.invoke('terminal:kill', id),
  onTerminalData:     (cb)      => ipcRenderer.on('terminal:data', (_, d) => cb(d)),
  onTerminalExit:     (cb)      => ipcRenderer.on('terminal:exit', (_, d) => cb(d)),
  removeTerminalListeners: ()   => {
    ipcRenderer.removeAllListeners('terminal:data')
    ipcRenderer.removeAllListeners('terminal:exit')
  },

  // Deep-link auth (hivora://auth?at=...&rt=...)
  onAuthDeepLink:     (cb)      => ipcRenderer.on('auth:deep-link', (_, d) => cb(d)),

  // CLI launch args (--mode, --prompt, folder path)
  onCliOpen:          (cb)      => ipcRenderer.on('cli:open', (_, d) => cb(d)),
})
