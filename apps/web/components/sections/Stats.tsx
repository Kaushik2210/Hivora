'use client'

import { ScrollAnimation } from '@/components/ScrollAnimation'

const stats = [
  {
    value: '1,000+',
    label: 'Agents Orchestrated',
    description: 'Claude, Cursor, Copilot and more',
  },
  {
    value: '50K+',
    label: 'Tasks Completed',
    description: 'Zero conflicts with auto-locking',
  },
  {
    value: '99.9%',
    label: 'Uptime',
    description: 'Reliable cloud infrastructure',
  },
  {
    value: '< 100ms',
    label: 'Lock Latency',
    description: 'Real-time synchronization',
  },
]

export function Stats() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by Developers Worldwide
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto">
              Thousands of developers choose Hivora for multi-agent orchestration, even in beta
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <ScrollAnimation key={stat.label} delay={i * 100}>
              <div
              className="text-center p-6 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-brand)] transition-all duration-300 hover:scale-105"
            >
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-light)] bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-semibold mb-1">{stat.label}</div>
              <div className="text-sm text-[var(--color-text-muted)]">{stat.description}</div>
            </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  )
}
