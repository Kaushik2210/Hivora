import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  apiRequest: (options: { method: string; path: string; body?: unknown; token?: string }) =>
    ipcRenderer.invoke('api:request', options),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateAvailable: (cb: (info: any) => void) => {
    ipcRenderer.on('update-available', (_, info) => cb(info))
  },
  onUpdateProgress: (cb: (progress: any) => void) => {
    ipcRenderer.on('update-progress', (_, progress) => cb(progress))
  },
  onUpdateDownloaded: (cb: () => void) => {
    ipcRenderer.on('update-downloaded', () => cb())
  },
})
