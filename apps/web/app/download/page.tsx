import type { Metadata } from 'next'
import { brand } from '@hivora/shared/brand'
import { Download, Monitor, Terminal, HardDrive, Cpu, Wifi } from 'lucide-react'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'

export const metadata: Metadata = { title: 'Download' }

const CLI_CMD = 'npx @hivora/orchestrator@latest start'

const requirements = {
  windows: [
    { icon: Monitor,   label: 'Windows 10 or later',  detail: '64-bit' },
    { icon: Cpu,       label: '8 GB RAM minimum',      detail: '16 GB recommended' },
    { icon: HardDrive, label: '500 MB disk space',     detail: 'SSD recommended' },
    { icon: Wifi,      label: 'Internet connection',   detail: 'For cloud sync' },
  ],
  macos: [
    { icon: Monitor, label: 'macOS 12+',          detail: 'Monterey or later' },
    { icon: Cpu,     label: 'M1/M2 or Intel x64', detail: 'Both architectures' },
    { icon: Cpu,     label: '8 GB RAM minimum',   detail: '16 GB recommended' },
    { icon: Wifi,    label: 'Internet connection', detail: 'For cloud sync' },
  ],
}

export default function DownloadPage() {
  return (
    <div className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Download {brand.displayName}</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Choose your platform and start orchestrating AI agents today.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {/* Windows */}
          <a
            href="https://api.hivora.com/downloads/windows"
            download
            className="group flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 text-center transition-all hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 hover:scale-[1.02]"
          >
            <div className="h-16 w-16 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center group-hover:bg-[var(--color-brand)]/30 transition-colors">
              <Monitor size={40} className="text-[var(--color-brand)]" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Windows</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Hivora-Setup-0.1.0.exe (76 MB)</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white group-hover:brightness-110 cursor-pointer transition-all">
              <Download size={16} /> Download for Windows
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              SmartScreen warning? Click "More info" → "Run anyway"
            </p>
          </a>

          {/* macOS — Coming Soon */}
          <div className="relative group flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 text-center transition-all">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
              Coming Soon
            </span>
            <div className="h-16 w-16 rounded-lg bg-[var(--color-border)] flex items-center justify-center">
              <Monitor size={40} className="text-[var(--color-text-muted)]" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[var(--color-text-muted)]">macOS</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Hivora-0.1.0.dmg (Intel & Apple Silicon)</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2 text-sm font-semibold text-[var(--color-text-muted)] cursor-not-allowed select-none">
              <Download size={16} /> Notify Me
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              macOS build arriving soon — join the waitlist via contact.
            </p>
          </div>
        </div>

        {/* CLI */}
        <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Terminal size={18} className="text-[var(--color-brand)]" /> CLI Installation
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Run the orchestration server directly. No GUI required. Perfect for CI/CD and server environments.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-surface)] p-4 font-mono text-sm border border-[var(--color-border)]">
            <code className="flex-1 text-[var(--color-brand)]">$ {CLI_CMD}</code>
            <CopyButton text={CLI_CMD} />
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

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 opacity-60">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-muted)]">macOS</h3>
                <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">Coming Soon</span>
              </div>
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
