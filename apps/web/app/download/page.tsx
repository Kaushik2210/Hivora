import type { Metadata } from 'next'
import { brand } from '@hivora/shared/brand'
import { Download, Monitor, Terminal } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Download' }

export default function DownloadPage() {
  return (
    <div className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Download {brand.displayName}</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Choose your platform. Requires an account to unlock cloud features.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <a
            href="#"
            className="group flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 text-center transition-all hover:border-[var(--color-brand)]"
          >
            <Monitor size={40} className="text-[var(--color-brand)]" />
            <h2 className="mt-4 text-xl font-bold">Windows</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Hivora Setup 0.1.0.exe</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white transition-all group-hover:brightness-110">
              <Download size={16} /> Download for Windows
            </span>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Windows may show a SmartScreen warning. Click &quot;More info&quot; &rarr; &quot;Run anyway&quot;.
            </p>
          </a>

          <a
            href="#"
            className="group flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 text-center transition-all hover:border-[var(--color-brand)]"
          >
            <Monitor size={40} className="text-[var(--color-brand)]" />
            <h2 className="mt-4 text-xl font-bold">macOS</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Hivora-0.1.0.dmg</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white transition-all group-hover:brightness-110">
              <Download size={16} /> Download for macOS
            </span>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              macOS may show a Gatekeeper warning. Right-click &rarr; Open to bypass.
            </p>
          </a>
        </div>

        <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Terminal size={18} className="text-[var(--color-brand)]" /> CLI Installation
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Run the orchestration server directly from the command line. No GUI required.
          </p>
          <div className="mt-4 rounded-lg bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
            <code>npx @hivora/orchestrator@latest start</code>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[var(--color-brand)] hover:underline">Sign in</Link>
            {' '}to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
