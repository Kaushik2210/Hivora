import type { Metadata } from 'next'
import { brand } from '@hivora/shared/brand'
import { Download, Monitor, Terminal, CheckCircle2, HardDrive, Cpu, Wifi } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Download' }

export default function DownloadPage() {
  const requirements = {
    windows: [
      { icon: Monitor, label: 'Windows 10 or later', detail: '64-bit' },
      { icon: Cpu, label: '8 GB RAM minimum', detail: '16 GB recommended' },
      { icon: HardDrive, label: '500 MB disk space', detail: 'SSD recommended' },
      { icon: Wifi, label: 'Internet connection', detail: 'For cloud sync' },
    ],
    macos: [
      { icon: Monitor, label: 'macOS 12+', detail: 'Monterey or later' },
      { icon: Cpu, label: 'M1/M2 or Intel x64', detail: 'Both architectures' },
      { icon: Cpu, label: '8 GB RAM minimum', detail: '16 GB recommended' },
      { icon: Wifi, label: 'Internet connection', detail: 'For cloud sync' },
    ],
  }

  return (
    <div className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Download {brand.displayName}</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Choose your platform. Requires an account to unlock cloud features.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <a
            href="#"
            className="group flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 text-center transition-all hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5"
          >
            <div className="h-16 w-16 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center">
              <Monitor size={40} className="text-[var(--color-brand)]" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Windows</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Hivora Setup 0.1.0.exe (76 MB)</p>
            <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95">
              <Download size={16} /> Download
            </button>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              SmartScreen warning? Click "More info" → "Run anyway"
            </p>
          </a>

          <a
            href="#"
            className="group flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 text-center transition-all hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 opacity-50 cursor-not-allowed"
          >
            <div className="h-16 w-16 rounded-lg bg-[var(--color-border)] flex items-center justify-center">
              <Monitor size={40} className="text-[var(--color-text-muted)]" />
            </div>
            <h2 className="mt-4 text-xl font-bold">macOS</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Coming Soon</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-border)] px-5 py-2 text-sm font-semibold text-[var(--color-text-muted)] cursor-default">
              <Download size={16} /> Available Soon
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              macOS build in development. Stay tuned!
            </p>
          </a>
        </div>

        <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Terminal size={18} className="text-[var(--color-brand)]" /> CLI Installation
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Run the orchestration server directly. No GUI required. Perfect for CI/CD and server environments.
          </p>
          <div className="mt-4 rounded-lg bg-[var(--color-surface)] p-4 font-mono text-sm border border-[var(--color-border)]">
            <code className="text-[var(--color-brand)]">$ npx @hivora/orchestrator@latest start</code>
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Requires Node.js 18+</p>
        </div>

        {/* System Requirements */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-8 text-center">System Requirements</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
              <h3 className="text-lg font-semibold text-[var(--color-brand)] mb-6">Windows</h3>
              <div className="space-y-4">
                {requirements.windows.map((req, i) => {
                  const Icon = req.icon
                  return (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={18} className="text-[var(--color-brand)]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{req.label}</div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-1">{req.detail}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 opacity-50">
              <h3 className="text-lg font-semibold text-[var(--color-text-muted)] mb-6">macOS</h3>
              <div className="space-y-4">
                {requirements.macos.map((req, i) => {
                  const Icon = req.icon
                  return (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-lg bg-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={18} className="text-[var(--color-text-muted)]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[var(--color-text-muted)]">{req.label}</div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-1">{req.detail}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Need help? Check our{' '}
            <Link href="/contact" className="font-semibold text-[var(--color-brand)] hover:underline">documentation</Link>
            {' '}or{' '}
            <Link href="/contact" className="font-semibold text-[var(--color-brand)] hover:underline">contact support</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
