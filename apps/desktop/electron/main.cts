import { app, BrowserWindow, ipcMain, shell, Menu, dialog } from 'electron'
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

// FS: write a text file
ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
  try {
    const { writeFile } = await import('fs/promises')
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
