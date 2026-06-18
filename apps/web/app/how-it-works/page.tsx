import type { Metadata } from 'next'
import { Lock, GitBranch, Zap, Shield, Users, Cloud } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'How It Works' }

const steps = [
  {
    number: '01',
    icon: Users,
    title: 'Multiple AI Agents',
    description: 'Claude, Cursor, Copilot, or any AI coding tool work on the same project simultaneously without conflicts.',
  },
  {
    number: '02',
    icon: Lock,
    title: 'Symbol-Level Locking',
    description: 'Instead of file-level locks, Hivora uses symbol-level locking. Agents can modify different functions in the same file.',
  },
  {
    number: '03',
    icon: GitBranch,
    title: 'Git-Native Workflows',
    description: 'All changes flow through git. Each agent commits to its own branch, coordinated automatically by Hivora.',
  },
  {
    number: '04',
    icon: Zap,
    title: 'Real-Time Coordination',
    description: 'Live team board shows every agent\'s status, locks, and progress. Instant conflict detection and resolution.',
  },
  {
    number: '05',
    icon: Shield,
    title: 'Project Integrity',
    description: 'Type checking, linting, and tests run automatically. No broken code gets merged. Your project stays clean.',
  },
  {
    number: '06',
    icon: Cloud,
    title: 'Cloud + Local',
    description: 'Run locally with full control, or sync to cloud for team collaboration and audit logs.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">How Hivora Works</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">
            Multi-AI coordination with zero manual conflict resolution. Your project stays clean, and your codebase stays intact.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
                <div className="text-2xl font-bold text-[var(--color-brand)]">{step.number}</div>
                <div className="mt-3 h-10 w-10 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center">
                  <Icon size={24} className="text-[var(--color-brand)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{step.description}</p>
              </div>
            )
          })}
        </div>

        {/* Problem & Solution */}
        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-8">
            <h2 className="text-xl font-bold text-red-400 mb-4">The Problem</h2>
            <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
              <li className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <span>Multiple AI tools fight over file locks → Constant wait times</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <span>Merge conflicts pile up → Manual resolution chaos</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <span>No coordination → Duplicate work and broken code</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400 font-bold">✗</span>
                <span>Teams resort to taking turns → Parallelism lost</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-8">
            <h2 className="text-xl font-bold text-green-400 mb-4">The Hivora Solution</h2>
            <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Symbol-level locks → Everyone works in parallel</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Automatic coordination → No conflicts, no waiting</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Full visibility → Real-time team board shows everything</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Git-native → All changes tracked, reversible, auditable</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8">
          <h2 className="text-2xl font-bold mb-6">Use Cases</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-[var(--color-brand)] mb-2">For Teams</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Coordinate multiple developers + AI agents on a single codebase. Ship features faster with zero merge conflicts.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-brand)] mb-2">For AI Developers</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Work with Claude, Cursor, Copilot together. Leverage their strengths without coordination overhead.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-brand)] mb-2">For Startups</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Ship fast with minimal headcount. Scale your engineering without scaling your team size proportionally.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-brand)] mb-2">For Open Source</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Enable parallel AI contributions. Maintainers spend less time reviewing and resolving conflicts.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">Ready to experience multi-AI development?</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            Start Free
          </Link>
        </div>
      </div>
    </div>
  )
}
