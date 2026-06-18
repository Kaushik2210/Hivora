'use client'

import { ScrollAnimation } from '@/components/ScrollAnimation'
import { useRouter } from 'next/navigation'
import { GitBranch, CheckCircle2, Clock, AlertCircle, Play } from 'lucide-react'

const agents = [
  { name: 'Claude', role: 'Backend', status: 'active', task: 'Refactoring auth module', color: '#D97757' },
  { name: 'Cursor', role: 'Frontend', status: 'active', task: 'Building dashboard UI', color: '#8B5CF6' },
  { name: 'Copilot', role: 'DevOps', status: 'active', task: 'Configuring CI pipeline', color: '#8957E5' },
]

const tasks = [
  { title: 'User authentication flow', agent: 'Claude', status: 'done', branch: 'feat/auth' },
  { title: 'Dashboard components', agent: 'Cursor', status: 'progress', branch: 'feat/dashboard' },
  { title: 'API rate limiting', agent: 'Copilot', status: 'done', branch: 'feat/rate-limit' },
  { title: 'WebSocket events', agent: 'Claude', status: 'review', branch: 'feat/websocket' },
]

export function Demo() {
  const router = useRouter()

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

            {/* Task board - right column */}
            <div className="lg:col-span-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <GitBranch size={14} className="text-[var(--color-brand)]" />
                  AI Orchestrator
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">4 tasks &middot; 3 agents</div>
              </div>

              <div className="divide-y divide-[var(--color-border)]">
                {tasks.map((task, i) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-[var(--color-surface)]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {task.status === 'done' && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                      {task.status === 'progress' && <Clock size={16} className="text-yellow-500 shrink-0" />}
                      {task.status === 'review' && <AlertCircle size={16} className="text-blue-500 shrink-0" />}
                      <div>
                        <div className="text-sm font-medium">{task.title}</div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {task.agent} &middot; {task.branch}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${
                      task.status === 'done' ? 'bg-green-500/10 text-green-500' :
                      task.status === 'progress' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {task.status === 'done' ? 'Done' : task.status === 'progress' ? 'In Progress' : 'Review'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Lock indicator */}
              <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Symbol locks active &mdash; zero conflicts
                </div>
                <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 rounded-md bg-[var(--color-brand)]/10 px-3 py-1 text-xs font-medium text-[var(--color-brand)] hover:bg-[var(--color-brand)]/15">
                  <Play size={12} />
                  View board
                </button>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  )
}
