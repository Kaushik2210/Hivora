'use client'

import { ScrollAnimation } from '@/components/ScrollAnimation'

const logos = [
  { name: 'Claude', file: '/logos/claude.svg' },
  { name: 'Cursor', file: '/logos/cursor.svg' },
  { name: 'GitHub Copilot', file: '/logos/github-copilot.svg' },
  { name: 'VS Code', file: '/logos/vscode.svg' },
  { name: 'Cline', file: '/logos/cline.svg' },
  { name: 'Devin', file: '/logos/devin.svg' },
]

export function TrustLogos() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation>
          <p className="text-center text-sm text-[var(--color-text-muted)] mb-8 uppercase tracking-wider">
            Supported AI Agents & Platforms
          </p>
        </ScrollAnimation>
        <ScrollAnimation>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {logos.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center">
                  <img src={logo.file} alt={logo.name} className="w-5 h-5" loading="lazy" />
                </div>
                <span className="text-sm font-medium hidden sm:inline">{logo.name}</span>
              </div>
            ))}
        </div>
        </ScrollAnimation>
      </div>
    </section>
  )
}
