'use client'

import { useState } from 'react'
import { Download, Monitor, Terminal, HardDrive, Cpu, Wifi, Bot, Zap, Shield, Apple, Check, Code, AlertTriangle, Lock, Brain, GitBranch } from 'lucide-react'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'

type OS = 'windows' | 'macos' | 'linux'

interface IDEOption {
  file: string
  size: string
  href: string
  details: string[]
  icon: any
}

interface CLIOption {
  command: string
  shell: 'powershell' | 'bash'
  instructions: string[]
}

interface PlatformData {
  name: string
  icon: any
  ide: IDEOption[]
  cli: CLIOption
  requirements: { label: string; detail: string; icon: any }[]
  steps: { title: string; desc: string }[]
}

const VERSION = '0.1.0'
const NPM_CMD = 'npm install -g @hivora/orchestrator'

const PLATFORMS: Record<OS, PlatformData> = {
  windows: {
    name: 'Windows',
    icon: Monitor,
    ide: [
      {
        file: 'Hivora-Setup-0.1.0.exe',
        size: '76 MB',
        href: '/downloads/Hivora-Setup-0.1.0.exe',
        details: [
          'Windows 10 / 11 (64-bit)',
          'NSIS Installer — no admin required',
          'Auto-updates via built-in updater'
        ],
        icon: Monitor
      }
    ],
    cli: {
      command: 'iwr -useb https://hivora.com/install.ps1 | iex',
      shell: 'powershell',
      instructions: [
        'Open PowerShell as Administrator',
        'Paste the command and press Enter to install the Hivora CLI',
        'Verify installation by running: hivora-mcp --help'
      ]
    },
    requirements: [
      { icon: Monitor, label: 'Windows 10 or later', detail: '64-bit only' },
      { icon: Cpu, label: '4 GB RAM minimum', detail: '8 GB recommended' },
      { icon: HardDrive, label: '300 MB disk space', detail: 'For app + logs' },
      { icon: Wifi, label: 'Internet connection', detail: 'Required for cloud sync' }
    ],
    steps: [
      { title: 'Download the installer', desc: 'Click the button above to download Hivora-Setup-0.1.0.exe.' },
      { title: 'Run the setup wizard', desc: 'Double-click the installer. If Windows SmartScreen warns you, click "More info" → "Run anyway".' },
      { title: 'Connect AI agents', desc: 'Open the Hivora desktop app, add your API keys in settings, and launch your otonom environment.' }
    ]
  },
  macos: {
    name: 'macOS',
    icon: Apple,
    ide: [
      {
        file: 'Hivora-0.1.0-arm64.dmg',
        size: '72 MB',
        href: '/downloads/Hivora-0.1.0-arm64.dmg',
        details: [
          'Apple Silicon (M1 / M2 / M3 / M4)',
          'Native performance & lower memory usage',
          'Secure Sandbox compliant'
        ],
        icon: Apple
      },
      {
        file: 'Hivora-0.1.0-x64.dmg',
        size: '74 MB',
        href: '/downloads/Hivora-0.1.0-x64.dmg',
        details: [
          'Intel Core & Xeon Processors',
          'Optimized for macOS 12 Monterey or later',
          'Secure Sandbox compliant'
        ],
        icon: Apple
      }
    ],
    cli: {
      command: 'curl -fsSL https://hivora.com/install.sh | sh',
      shell: 'bash',
      instructions: [
        'Open your Terminal application',
        'Paste the installation command and press Enter',
        'Verify installation by running: hivora-mcp --help'
      ]
    },
    requirements: [
      { icon: Monitor, label: 'macOS 12 Monterey or later', detail: 'Universal compatibility' },
      { icon: Cpu, label: 'Apple Silicon or Intel CPU', detail: 'Optimized binary options' },
      { icon: HardDrive, label: '300 MB disk space', detail: 'For app + log caches' },
      { icon: Wifi, label: 'Internet connection', detail: 'Required for cloud sync' }
    ],
    steps: [
      { title: 'Download the DMG', desc: 'Select the Apple Silicon DMG if on M1/M2/M3/M4, otherwise choose the Intel DMG.' },
      { title: 'Drag to Applications', desc: 'Open the downloaded DMG file and drag the Hivora icon into your Applications folder.' },
      { title: 'Configure security', desc: 'If macOS Gatekeeper prevents opening, go to System Settings → Privacy & Security, and click Open Anyway.' }
    ]
  },
  linux: {
    name: 'Linux',
    icon: Terminal,
    ide: [
      {
        file: 'Hivora-0.1.0.AppImage',
        size: '82 MB',
        href: '/downloads/Hivora-0.1.0.AppImage',
        details: [
          'Portable AppImage — works on all distributions',
          'No complex installation required',
          'x64 architecture support'
        ],
        icon: Terminal
      },
      {
        file: 'Hivora-0.1.0-amd64.deb',
        size: '78 MB',
        href: '/downloads/Hivora-0.1.0-amd64.deb',
        details: [
          'Debian / Ubuntu installation package',
          'Clean desktop integration',
          'Requires apt repository packaging'
        ],
        icon: Terminal
      }
    ],
    cli: {
      command: 'curl -fsSL https://hivora.com/install.sh | sh',
      shell: 'bash',
      instructions: [
        'Open your preferred Terminal shell',
        'Paste the curl command and run it',
        'Verify installation by running: hivora-mcp --help'
      ]
    },
    requirements: [
      { icon: Monitor, label: 'Ubuntu 20.04+ / Debian 11+ / Arch', detail: 'Or any modern glibc distro' },
      { icon: Cpu, label: 'x64 or ARM64 architecture', detail: 'Optimized desktop compiler' },
      { icon: HardDrive, label: '300 MB disk space', detail: 'For AppImage caches + logs' },
      { icon: Wifi, label: 'Internet connection', detail: 'Required for cloud sync' }
    ],
    steps: [
      { title: 'Download package', desc: 'Choose the portable AppImage or the Debian (.deb) package installer.' },
      { title: 'Grant executable rights', desc: 'If using AppImage, run: chmod +x Hivora-0.1.0.AppImage' },
      { title: 'Run the platform', desc: 'Double-click the AppImage or install via: sudo dpkg -i Hivora-0.1.0-amd64.deb' }
    ]
  }
}

const FEATURES = [
  { icon: Bot,    title: 'Multi-Panel Workspace',  desc: 'Run Claude, GPT-4o, Gemini and more side by side in independent panels' },
  { icon: Zap,    title: 'Real AI Streaming',      desc: 'Direct API connection with your own keys — responses stream token by token' },
  { icon: Shield, title: 'Automatic Lock System',  desc: 'Orchestrator prevents file conflicts between panels invisibly in the background' },
]

export default function DownloadPage() {
  const [selectedOS, setSelectedOS] = useState<OS>('windows')
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)

  const handleDownload = (filename: string) => {
    setDownloadingFile(filename)
    setTimeout(() => setDownloadingFile(null), 3000)
  }

  const activePlatform = PLATFORMS[selectedOS]

  return (
    <div className="min-h-screen pb-20 bg-[var(--color-surface)]">
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand)]/8 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 text-center">
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand)]/60 shadow-2xl shadow-[var(--color-brand)]/20 mb-6">
            <Bot size={32} className="text-white" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 px-4 py-1.5 text-sm font-medium text-[var(--color-brand)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
            Version {VERSION} · Premium Suite
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Get Started with <span className="text-[var(--color-brand)]">Hivora</span>
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-xl mx-auto mb-10">
            Coordinate multiple AI coding agents working together on your project local environment via CLI or our Desktop IDE.
          </p>

          {/* Interactive OS Selector Tabs */}
          <div className="inline-flex rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-1.5 shadow-sm max-w-md w-full">
            {(Object.keys(PLATFORMS) as OS[]).map((os) => {
              const OSData = PLATFORMS[os]
              const OSIcon = OSData.icon
              const isSelected = selectedOS === os
              return (
                <button
                  key={os}
                  onClick={() => setSelectedOS(os)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    isSelected
                      ? 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-brand)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <OSIcon size={16} />
                  {OSData.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        
        {/* Core Layout: Side by Side options */}
        <div className="grid gap-8 md:grid-cols-2 mb-16">
          
          {/* Column Left: Desktop App (IDE) */}
          <div className="rounded-2xl border-2 border-[var(--color-brand)]/20 bg-[var(--color-surface-elevated)] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand)]/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-brand)]/10 flex items-center justify-center">
                  <Monitor size={20} className="text-[var(--color-brand)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Hivora IDE (Desktop)</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">Visual GUI & Multi-agent Workspace</p>
                </div>
              </div>

              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-6">
                A premium visual interface for monitoring lock tokens, speed/cost performance metrics, git branch timelines, and agent thinking side-by-side.
              </p>

              {/* Iterative Download Buttons */}
              <div className="space-y-4 mb-6">
                {activePlatform.ide.map((opt, index) => (
                  <div key={index} className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)]">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-bold text-[var(--color-text)] break-all">{opt.file}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                        {opt.size}
                      </span>
                    </div>

                    <ul className="space-y-1.5 mb-4">
                      {opt.details.map((detail, dIdx) => (
                        <li key={dIdx} className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                          <Check size={12} className="text-[var(--color-brand)]" />
                          {detail}
                        </li>
                      ))}
                    </ul>

                    <a
                      href={opt.href}
                      download
                      onClick={() => handleDownload(opt.file)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] py-2.5 px-4 text-sm font-bold text-white shadow hover:brightness-110 active:scale-[0.98] transition-all duration-150"
                    >
                      <Download size={14} className={downloadingFile === opt.file ? 'animate-bounce' : ''} />
                      {downloadingFile === opt.file ? 'Starting download…' : 'Download Application'}
                    </a>
                  </div>
                ))}
              </div>

              {/* OS Specific Warning */}
              {selectedOS === 'windows' && (
                <div className="flex gap-2 p-3.5 rounded-lg bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/15 text-xs text-[var(--color-brand)]">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Windows SmartScreen Warning?</strong> Click <em>"More info"</em> and select <em>"Run anyway"</em>. The Hivora package is fully verified and secure.
                  </span>
                </div>
              )}
            </div>

            {/* IDE Workspace Mockup — mirrors the CLI terminal preview on the right */}
            <div className="rounded-xl bg-[#0b0f19] border border-gray-800 p-4 mt-6">
              <div className="flex items-center gap-1.5 border-b border-gray-900 pb-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="text-[10px] text-gray-500 ml-1">Hivora Workspace</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-500">
                  <GitBranch size={10} /> main
                </span>
              </div>

              {/* Two agent panels side by side */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg border border-gray-800 bg-black/30 p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#D97757' }} />
                    <span className="text-[10px] font-semibold text-gray-300">Claude Opus 4</span>
                  </div>
                  <div className="text-[10px] text-gray-500">✎ editing auth.ts</div>
                  <div className="mt-1.5 flex items-center gap-1 text-[9px] text-violet-400">
                    <Brain size={9} /> thinking…
                  </div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-black/30 p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#10a37f' }} />
                    <span className="text-[10px] font-semibold text-gray-300">GPT-4o</span>
                  </div>
                  <div className="text-[10px] text-gray-500">✎ editing api.ts</div>
                  <div className="mt-1.5 flex items-center gap-1 text-[9px] text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> streaming
                  </div>
                </div>
              </div>

              {/* Status bar: lock + speed + cost */}
              <div className="flex items-center gap-3 border-t border-gray-900 pt-2 text-[10px]">
                <span className="flex items-center gap-1 text-amber-400"><Lock size={10} /> auth.ts locked</span>
                <span className="flex items-center gap-1 text-gray-400"><Zap size={10} /> 1.2s</span>
                <span className="ml-auto font-semibold text-emerald-400">$0.04</span>
              </div>
            </div>
          </div>

          {/* Column Right: CLI / Terminal */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-brand)]/10 flex items-center justify-center">
                  <Terminal size={20} className="text-[var(--color-brand)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Hivora CLI (Terminal)</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">Headless Daemon Client & MCP Server</p>
                </div>
              </div>

              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-6">
                Connect and manage agent permissions, view diffs, approve tasks, and stream agent logs directly inside your command-line environment or CI/CD pipelines.
              </p>

              {/* Shell Quick Installer */}
              <div className="mb-6">
                <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Quick Install Script ({activePlatform.cli.shell})
                </span>
                <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3 font-mono text-xs">
                  <span className="text-[var(--color-brand)] select-none">$</span>
                  <code className="flex-1 text-[var(--color-brand)] overflow-x-auto whitespace-nowrap scrollbar-thin">
                    {activePlatform.cli.command}
                  </code>
                  <CopyButton text={activePlatform.cli.command} />
                </div>
              </div>

              {/* NPM Alternate Installation */}
              <div className="mb-8">
                <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Alternate Installation via NPM
                </span>
                <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3 font-mono text-xs">
                  <span className="text-[var(--color-brand)] select-none">$</span>
                  <code className="flex-1 text-[var(--color-brand)] overflow-x-auto whitespace-nowrap scrollbar-thin">
                    {NPM_CMD}
                  </code>
                  <CopyButton text={NPM_CMD} />
                </div>
              </div>
            </div>

            {/* CLI Terminal Mockup */}
            <div className="rounded-xl bg-[#0b0f19] border border-gray-800 p-4 font-mono text-[11px] leading-relaxed text-gray-300">
              <div className="flex items-center gap-1.5 border-b border-gray-900 pb-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="text-[10px] text-gray-500 ml-1">Terminal</span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-green-500">$</span> hivora-mcp tasks
                  <div className="text-gray-500">Fetching tasks for project hivora-core...</div>
                </div>
                <div className="grid grid-cols-[80px_100px_1fr] text-[10px] border-b border-gray-900 pb-1 text-gray-400">
                  <span>ID</span>
                  <span>STATUS</span>
                  <span>TITLE</span>
                </div>
                <div className="grid grid-cols-[80px_100px_1fr] text-gray-300">
                  <span className="text-gray-500">task-498</span>
                  <span className="text-yellow-500">review_pending</span>
                  <span>Fix postgres auth config</span>
                </div>
                <div>
                  <span className="text-green-500">$</span> hivora-mcp diff task-498
                  <div className="text-gray-500">--- a/src/auth.ts</div>
                  <div className="text-gray-500">+++ b/src/auth.ts</div>
                  <div className="text-red-400">- const conn = connect();</div>
                  <div className="text-green-400">+ const conn = await connect();</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Installation steps */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-2">How to install Hivora</h2>
          <p className="text-center text-[var(--color-text-muted)] text-sm mb-8">Up and running on {activePlatform.name} in under 2 minutes</p>
          
          <div className="grid gap-6 md:grid-cols-3">
            {activePlatform.steps.map((step, idx) => (
              <div key={idx} className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
                <div className="w-8 h-8 rounded-full bg-[var(--color-brand)]/15 border border-[var(--color-brand)]/30 flex items-center justify-center text-[var(--color-brand)] font-bold text-sm mb-4">
                  {idx + 1}
                </div>
                <h3 className="font-semibold mb-1 text-[var(--color-text)]">{step.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Platform Requirements */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">System Requirements</h2>
          
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-2.5 mb-6 border-b border-[var(--color-border)] pb-3">
              <Code size={18} className="text-[var(--color-brand)]" />
              <h3 className="text-md font-bold">Minimum requirements for {activePlatform.name}</h3>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              {activePlatform.requirements.map((req, idx) => {
                const ReqIcon = req.icon
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-brand)]/10 flex items-center justify-center flex-shrink-0">
                      <ReqIcon size={18} className="text-[var(--color-brand)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--color-text)]">{req.label}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{req.detail}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* What You Get (Included benefits) */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-2">Built for high-performance AI development</h2>
          <p className="text-center text-[var(--color-text-muted)] text-sm mb-10">Everything you need to run otonom AI coding agents safely</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 hover:border-[var(--color-brand)]/40 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-brand)]/15 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-[var(--color-brand)]" />
                  </div>
                  <h3 className="font-semibold mb-1 text-[var(--color-text)]">{f.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-14 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Need help?{' '}
            <Link href="/contact" className="font-semibold text-[var(--color-brand)] hover:underline">Contact support</Link>
            {' '}or{' '}
            <Link href="https://github.com/hivora" className="font-semibold text-[var(--color-brand)] hover:underline">view on GitHub</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
