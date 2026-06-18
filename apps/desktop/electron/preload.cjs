const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  apiRequest: (options) =>
    ipcRenderer.invoke('api:request', options),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateAvailable: (cb) => {
    ipcRenderer.on('update-available', (_, info) => cb(info))
  },
  onUpdateProgress: (cb) => {
    ipcRenderer.on('update-progress', (_, progress) => cb(progress))
  },
  onUpdateDownloaded: (cb) => {
    ipcRenderer.on('update-downloaded', () => cb())
  },
})
