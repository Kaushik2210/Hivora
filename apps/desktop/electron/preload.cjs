const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  apiRequest:         (opts)    => ipcRenderer.invoke('api:request', opts),
  installUpdate:      ()        => ipcRenderer.invoke('update:install'),
  windowMinimize:     ()        => ipcRenderer.invoke('window:minimize'),
  windowMaximize:     ()        => ipcRenderer.invoke('window:maximize'),
  windowClose:        ()        => ipcRenderer.invoke('window:close'),
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
})
