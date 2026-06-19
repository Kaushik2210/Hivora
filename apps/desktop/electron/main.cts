import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

Menu.setApplicationMenu(null)

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
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.once('did-finish-load', () => mainWindow?.show())
  mainWindow.webContents.on('did-fail-load', (_e, code) => {
    if (isDev && code !== -3) setTimeout(() => mainWindow?.loadURL('http://localhost:5173'), 1000)
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  createWindow()

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', () => { if (mainWindow === null) createWindow() })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
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
ipcMain.handle('api:request', async (_, { method, path: apiPath, body, token }: {
  method: string; path: string; body?: unknown; token?: string
}) => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`http://localhost:4000${apiPath}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    })
    return await res.json()
  } catch (error) {
    return { error: true, message: String(error) }
  }
})

// Window Management
ipcMain.handle('window:minimize', () => { mainWindow?.minimize() })
ipcMain.handle('window:maximize', () => {
  if (mainWindow) mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})
ipcMain.handle('window:close', () => { mainWindow?.close() })
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)
ipcMain.handle('shell:open', (_, url: string) => { if (url) shell.openExternal(url) })
