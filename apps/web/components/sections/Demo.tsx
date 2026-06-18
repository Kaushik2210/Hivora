'use client'

import { ScrollAnimation } from '@/components/ScrollAnimation'
import { GitBranch } from 'lucide-react'

const agents = [
  { name: 'Claude', role: 'Backend', status: 'active', task: 'Refactoring auth module', color: '#D97757' },
  { name: 'Cursor', role: 'Frontend', status: 'active', task: 'Building dashboard UI', color: '#8B5CF6' },
  { name: 'Copilot', role: 'DevOps', status: 'active', task: 'Configuring CI pipeline', color: '#8957E5' },
]

export function Demo() {

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              See It In Action
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto">
              Three AI agents working in parallel on the same codebase — no conflicts, full visibility.
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={200}>
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Agent cards - left column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Active Agents</div>
              {agents.map((agent) => (
                <div key={agent.name} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 transition-all hover:border-[var(--color-brand)]/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: agent.color }}>
                        {agent.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{agent.name}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{agent.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-green-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </div>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">Working on:</div>
                  <div className="text-sm mt-1">{agent.task}</div>
                  <div className="mt-3 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ backgroundColor: agent.color, width: agent.status === 'active' ? '65%' : '100%' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Live preview - right column */}
            <div className="lg:col-span-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <GitBranch size={14} className="text-[var(--color-brand)]" />
                    Live Orchestration
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">Simulated demo</div>
                </div>
              </div>

              <div className="p-5 grid gap-4">
                <div className="rounded-lg bg-black text-white font-mono text-sm p-3 shadow-inner overflow-hidden">
                  <div className="space-y-2">
                    <div className="opacity-80">$ git fetch origin</div>
                    <div className="text-[var(--color-brand)] animate-fade-left">agent-copilot: Applying rate-limit patch...</div>
                    <div className="text-green-400">✔ agent-claude: Auth refactor succeeded</div>
                    <div className="text-yellow-300 animate-fade-left">… running tests (4/7)</div>
                    <div className="text-green-400">✔ All checks passed</div>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">Orchestration Timeline</div>
                    <div className="text-xs text-[var(--color-text-muted)]">Realtime</div>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                      <div>
                        <div className="text-sm">Claude merged feat/auth</div>
                        <div className="text-xs text-[var(--color-text-muted)]">2 minutes ago</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1 animate-pulse" />
                      <div>
                        <div className="text-sm">Cursor building dashboard UI</div>
                        <div className="text-xs text-[var(--color-text-muted)]">Live</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1" />
                      <div>
                        <div className="text-sm">Copilot configured CI pipeline</div>
                        <div className="text-xs text-[var(--color-text-muted)]">5 minutes ago</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  )
}
