#!/usr/bin/env node
// Hivora CLI — opens the Hivora desktop app (Cursor/VS Code-style)

import chalk from 'chalk'
import ora from 'ora'
import boxen from 'boxen'
import { spawn, execFile } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const execFileAsync = promisify(execFile)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SITE = 'hivora.com'

// ── Brand ─────────────────────────────────────────────────────────────────────

const LOGO = chalk.cyan(`
  ██╗  ██╗██╗██╗   ██╗ ██████╗ ██████╗  █████╗
  ██║  ██║██║██║   ██║██╔═══██╗██╔══██╗██╔══██╗
  ███████║██║██║   ██║██║   ██║██████╔╝███████║
  ██╔══██║██║╚██╗ ██╔╝██║   ██║██╔══██╗██╔══██║
  ██║  ██║██║ ╚████╔╝ ╚██████╔╝██║  ██║██║  ██║
  ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝`)

function showVersion() {
  const content = [
    LOGO,
    '',
    chalk.white.bold('  AI Agent Orchestration Platform'),
    '',
    chalk.dim('  ' + '─'.repeat(44)),
    '',
    chalk.white('  ') + chalk.cyan('hivora .') + chalk.dim('                  Open current directory'),
    chalk.white('  ') + chalk.cyan('hivora <path>') + chalk.dim('             Open file or folder'),
    chalk.white('  ') + chalk.cyan('hivora --new-window') + chalk.dim('       Force a new window'),
    chalk.white('  ') + chalk.cyan('hivora --goto <f:l:c>') + chalk.dim('     Jump to file:line:col'),
    chalk.white('  ') + chalk.cyan('hivora --ask "<q>"') + chalk.dim('        Quick question (Ask mode)'),
    chalk.white('  ') + chalk.cyan('hivora --agent <path>') + chalk.dim('     Open in Agent mode'),
    chalk.white('  ') + chalk.cyan('hivora --plan "<task>"') + chalk.dim('    Open in Spec mode (implementation plan)'),
    chalk.white('  ') + chalk.cyan('hivora --status') + chalk.dim('            Show running agents'),
    chalk.white('  ') + chalk.cyan('hivora --version') + chalk.dim('           Show this info'),
    '',
  ].join('\n')

  console.log(
    boxen(content, {
      padding: 0,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  )
}

// ── App detection ─────────────────────────────────────────────────────────────

function findElectronApp() {
  // Look for the Hivora Electron binary next to this CLI file
  const candidates = [
    // Installed via npm link / electron-builder
    resolve(__dirname, '..', '..', 'release', 'win-unpacked', 'Hivora.exe'),
    resolve(__dirname, '..', '..', 'release', 'mac', 'Hivora.app', 'Contents', 'MacOS', 'Hivora'),
    resolve(__dirname, '..', '..', 'release', 'linux-unpacked', 'hivora'),
    // Running in dev mode: launch via electron directly
    resolve(__dirname, '..'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

async function launchApp(args = []) {
  const appPath = findElectronApp()

  if (!appPath) {
    console.error(
      boxen(
        chalk.red('✖  Could not find Hivora\n') +
        chalk.dim(`   Make sure the app is installed: ${chalk.cyan(SITE + '/download')}`),
        { padding: { top: 0, bottom: 0, left: 2, right: 2 }, borderColor: 'red', borderStyle: 'round' }
      )
    )
    process.exit(1)
  }

  // Detect dev mode — path ends with the package folder
  const isDev = appPath.endsWith(resolve(__dirname, '..'))
  if (isDev) {
    // In dev, launch via `electron .` in the package directory
    const electronBin = resolve(__dirname, '..', 'node_modules', '.bin',
      process.platform === 'win32' ? 'electron.cmd' : 'electron')
    spawn(electronBin, [appPath, ...args], { detached: true, stdio: 'ignore' }).unref()
  } else {
    spawn(appPath, args, { detached: true, stdio: 'ignore' }).unref()
  }
}

// ── Status command ─────────────────────────────────────────────────────────────

async function showStatus() {
  // Try to reach a running app's status via the API
  let agents = []
  try {
    const res = await fetch('http://localhost:4000/api/agents?limit=5', {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) {
      const data = await res.json()
      agents = data?.data ?? []
    }
  } catch { /* API not running */ }

  if (agents.length === 0) {
    console.log(
      boxen(
        chalk.yellow('  No active agents found\n') +
        chalk.dim('  Start Hivora and open some panels to see status here.'),
        { padding: 1, borderStyle: 'round', borderColor: 'yellow' }
      )
    )
    return
  }

  const rows = agents.map((a, i) => {
    const status = a.status === 'running'
      ? chalk.green('● Running')
      : a.status === 'idle'
        ? chalk.dim('○ Idle')
        : chalk.yellow('◌ ' + a.status)
    return `  Panel ${i + 1}  ${chalk.white((a.model ?? 'Unknown').padEnd(22))} ${status}`
  })

  console.log(
    boxen(
      chalk.bold('Active Agents') + '\n\n' + rows.join('\n'),
      { padding: 1, borderStyle: 'round', borderColor: 'cyan' }
    )
  )
}

// ── Entry ────────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2)

  // --version / -v
  if (argv.length === 0 || argv.includes('--version') || argv.includes('-v')) {
    showVersion()
    return
  }

  // --status
  if (argv.includes('--status')) {
    await showStatus()
    return
  }

  // --ask "<question>"  → open app in Ask mode with a prefilled prompt
  if (argv.includes('--ask')) {
    const askIdx = argv.indexOf('--ask')
    const question = argv.slice(askIdx + 1).filter(a => !a.startsWith('--')).join(' ')
    if (!question) {
      console.error(chalk.red('✖  --ask requires a question, e.g. hivora --ask "how do I add a route?"'))
      process.exit(1)
    }
    const spinner = ora({ text: chalk.cyan('Opening Hivora (Ask mode)…'), color: 'cyan' }).start()
    await launchApp(['--mode', 'ask', '--prompt', question])
    spinner.succeed(chalk.green('Hivora opened in Ask mode'))
    return
  }

  // --plan "<task>"  → open in Plan mode
  if (argv.includes('--plan')) {
    const planIdx = argv.indexOf('--plan')
    const task = argv.slice(planIdx + 1).filter(a => !a.startsWith('--')).join(' ')
    const spinner = ora({ text: chalk.cyan('Opening Hivora (Plan mode)…'), color: 'cyan' }).start()
    await launchApp(['--mode', 'plan', ...(task ? ['--prompt', task] : [])])
    spinner.succeed(chalk.green('Hivora opened in Plan mode'))
    return
  }

  // --agent <path>  → open in Agent mode
  if (argv.includes('--agent')) {
    const agentIdx = argv.indexOf('--agent')
    const target = argv[agentIdx + 1] && !argv[agentIdx + 1].startsWith('--')
      ? resolve(process.cwd(), argv[agentIdx + 1]) : process.cwd()
    const spinner = ora({ text: chalk.cyan('Opening Hivora (Agent mode)…'), color: 'cyan' }).start()
    await launchApp([target, '--mode', 'agent'])
    spinner.succeed(chalk.green('Hivora opened in Agent mode'))
    return
  }

  // --goto file:line:col  (pass-through to app)
  if (argv.includes('--goto')) {
    const gotoIdx = argv.indexOf('--goto')
    const target  = argv[gotoIdx + 1]
    if (!target) {
      console.error(chalk.red('✖  --goto requires a file:line:col argument'))
      process.exit(1)
    }
    const spinner = ora({ text: chalk.cyan('Opening Hivora…'), color: 'cyan' }).start()
    await launchApp(['--goto', target])
    spinner.succeed(chalk.green('Hivora opened'))
    return
  }

  // . or <path> — open folder/file
  const targetArg = argv.find(a => !a.startsWith('--')) ?? '.'
  const targetPath = resolve(process.cwd(), targetArg)

  if (!existsSync(targetPath) && targetArg !== '.') {
    console.error(
      chalk.red(`✖  Path not found: ${chalk.white(targetPath)}`)
    )
    process.exit(1)
  }

  const extraFlags = []
  if (argv.includes('--new-window')) extraFlags.push('--new-window')

  const spinner = ora({ text: chalk.cyan(`Opening ${chalk.white(targetPath === process.cwd() ? 'current directory' : targetPath)}…`), color: 'cyan' }).start()

  try {
    await launchApp([targetPath, ...extraFlags])
    spinner.succeed(chalk.green('Hivora opened'))
  } catch (err) {
    spinner.fail(chalk.red('Could not open Hivora'))
    console.error(chalk.dim('  ' + String(err)))
    process.exit(1)
  }
}

main().catch(err => {
  console.error(chalk.red('✖  ' + err.message))
  process.exit(1)
})
