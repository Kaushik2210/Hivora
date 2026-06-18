import { app, BrowserWindow, ipcMain } from "electron"
import path from "path"
import { spawn } from "child_process"

let mainWindow: BrowserWindow | null = null
let backendProcess: any = null

const isDev = process.env.NODE_ENV === "development"

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "OpenCrew - Multi-AI Orchestrator",
    show: false
  })

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show()
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

function startBackend() {
  const corePath = isDev
    ? path.join(__dirname, "../../core")
    : path.join(process.resourcesPath, "core")
  
  const indexPath = path.join(corePath, "dist/index.js")
  
  backendProcess = spawn("node", [indexPath], {
    stdio: "inherit",
    cwd: corePath,
    env: {
      ...process.env,
      NODE_ENV: isDev ? "development" : "production"
    }
  })

  backendProcess.on("error", (err: Error) => {
    console.error("Backend start error:", err)
  })

  backendProcess.on("exit", (code: number | null) => {
    console.log(`Backend exited with code ${code}`)
  })
}

app.whenReady().then(() => {
  startBackend()
  createWindow()

  app.on("activate", () => {
    if (mainWindow === null) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (backendProcess) {
    backendProcess.kill()
  }
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// IPC handlers for API communication
ipcMain.handle("api-call", async (_, { method, path: apiPath, body }) => {
  try {
    const res = await fetch(`http://localhost:3000${apiPath}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    })
    return await res.json()
  } catch (error) {
    return { error: true, message: String(error) }
  }
})
