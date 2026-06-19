import type { Metadata } from 'next'
import { CheckCircle2, AlertCircle, Code2, Users, Lock } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Free Tier' }

const limits = [
  { label: 'Concurrent AI Agents', value: '2', included: true },
  { label: 'Symbol Locks per Day', value: '100', included: true },
  { label: 'Projects per Organization', value: '5', included: true },
  { label: 'Team Members', value: '3', included: true },
  { label: 'Local Mode', value: 'Yes', included: true },
  { label: 'Git Integration', value: 'Yes', included: true },
  { label: 'Cloud Sync', value: 'No', included: false },
  { label: 'Audit Logs', value: 'No', included: false },
  { label: 'Priority Support', value: 'No', included: false },
]

const strategies = [
  {
    title: 'Optimize for Offline',
    description: 'Free tier is fully functional without cloud. Perfect for local development and testing.',
    icon: Code2,
  },
  {
    title: 'Batch Your Changes',
    description: 'Instead of small locks throughout the day, batch your agent tasks to stay within 100/day limit.',
    icon: Lock,
  },
  {
    title: 'Serial Coordination',
    description: 'With 2 concurrent agents, you can still achieve parallelism by switching agents throughout the day.',
    icon: Users,
  },
  {
    title: 'Community Usage',
    description: 'Join our community. Share best practices and optimizations with other free tier users.',
    icon: Users,
  },
]

export default function FreeTierPage() {
  return (
    <div className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Hivora Free Tier</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">
            Start using Hivora for free. No credit card required. Upgrade anytime to unlock more agents and features.
          </p>
        </div>

        {/* Limits Overview */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center">What's Included in Free</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {limits.map((limit, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  limit.included
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)]'
                }`}
              >
                <span className="text-sm font-medium">{limit.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{limit.value}</span>
                  {limit.included ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <AlertCircle size={18} className="text-[var(--color-text-muted)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Maximize Free */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">How to Maximize Your Free Tier</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {strategies.map((strategy) => {
              const Icon = strategy.icon
              return (
                <div key={strategy.title} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
                  <div className="h-10 w-10 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center mb-3">
                    <Icon size={20} className="text-[var(--color-brand)]" />
                  </div>
                  <h3 className="font-semibold mb-2">{strategy.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{strategy.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Practical Example */}
        <div className="mt-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8">
          <h2 className="text-xl font-bold mb-4">Example: 2-Agent Workflow</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Here's how to work efficiently with 2 concurrent agents on a free tier:
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="font-semibold text-[var(--color-brand)] w-20">9:00 AM</span>
              <span className="text-[var(--color-text-muted)]">Agent 1 (Claude) starts refactoring auth module. Acquires locks.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-[var(--color-brand)] w-20">10:00 AM</span>
              <span className="text-[var(--color-text-muted)]">Agent 2 (Cursor) starts building UI. Locks different functions.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-[var(--color-brand)] w-20">11:00 AM</span>
              <span className="text-[var(--color-text-muted)]">Agent 1 finishes, releases locks. Commits changes.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-[var(--color-brand)] w-20">12:00 PM</span>
              <span className="text-[var(--color-text-muted)]">Agent 1 starts new task (testing). 2 agents active again.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-[var(--color-brand)] w-20">Result</span>
              <span className="text-green-400 font-semibold">✓ 3 tasks completed in parallel with just 2 agents</span>
            </div>
          </div>
        </div>

        {/* When to Upgrade */}
        <div className="mt-16 rounded-lg border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/5 p-8">
          <h2 className="text-xl font-bold mb-4">When to Upgrade to Pro</h2>
          <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
            <li className="flex gap-3">
              <span className="text-[var(--color-brand)]">→</span>
              <span>You need more than 2 concurrent agents (Pro supports 10+)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-brand)]">→</span>
              <span>You're hitting 100 locks/day limit consistently</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-brand)]">→</span>
              <span>You need cloud sync for team collaboration</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-brand)]">→</span>
              <span>You want audit logs and priority support</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-brand)]">→</span>
              <span>Your team grows beyond 3 people</span>
            </li>
          </ul>
        </div>

        <div className="mt-12 text-center">
          <Link href="/pricing" className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110">
            View All Plans
          </Link>
        </div>
      </div>
    </div>
  )
}
