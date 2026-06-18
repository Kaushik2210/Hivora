const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  apiCall: (params) => ipcRenderer.invoke("api-call", params)
})
