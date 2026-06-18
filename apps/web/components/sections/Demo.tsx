'use client'

import { ScrollAnimation } from '@/components/ScrollAnimation'
import { GitBranch, Lock, CheckCircle2, AlertCircle, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

const agents = [
  { name: 'Claude', role: 'Backend', status: 'active', task: 'Refactoring auth module', color: '#D97757', logo: '/logos/claude.svg', file: 'auth.ts', locks: 3 },
  { name: 'Cursor', role: 'Frontend', status: 'active', task: 'Building dashboard UI', color: '#8B5CF6', logo: '/logos/cursor.svg', file: 'dashboard.tsx', locks: 2 },
  { name: 'Copilot', role: 'DevOps', status: 'active', task: 'Configuring CI pipeline', color: '#8957E5', logo: '/logos/github-copilot.svg', file: 'workflow.yaml', locks: 1 },
]

const events = [
  { time: '12:34:01', agent: 'Claude', action: 'Acquired symbol lock', file: 'auth.ts:42', status: 'success' },
  { time: '12:34:03', agent: 'Cursor', action: 'Waiting for lock release', file: 'dashboard.tsx:15', status: 'waiting' },
  { time: '12:34:05', agent: 'Claude', action: 'Committed changes', file: 'auth.ts', status: 'success' },
  { time: '12:34:07', agent: 'Cursor', action: 'Lock acquired', file: 'dashboard.tsx:15', status: 'success' },
  { time: '12:34:09', agent: 'Copilot', action: 'Tests passed (4/7)', file: 'workflow.yaml', status: 'success' },
]

export function Demo() {
  const [displayedEvents, setDisplayedEvents] = useState<typeof events>([])
  const [activeAgent, setActiveAgent] = useState<string | null>(null)

  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < events.length) {
        setDisplayedEvents(events.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        currentIndex = 0
        setDisplayedEvents([])
      }
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Real-Time Coordination In Action
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg max-w-3xl mx-auto">
              Watch AI agents collaborate seamlessly with symbol-level locking, preventing conflicts while maximizing parallelism.
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={200}>
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Agent Status Cards - left */}
            <div className="lg:col-span-3 space-y-3">
              <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Agents</div>
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  onClick={() => setActiveAgent(activeAgent === agent.name ? null : agent.name)}
                  className={`rounded-lg border transition-all cursor-pointer p-3 ${
                    activeAgent === agent.name
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-brand)]/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center border border-[var(--color-border)]">
                        <img src={agent.logo} alt={agent.name} className="w-6 h-6 object-contain" />
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
                  <div className="text-xs text-[var(--color-text-muted)] mb-1">File: {agent.file}</div>
                  <div className="text-xs mb-2 text-[var(--color-text-muted)]">{agent.task}</div>
                  <div className="flex items-center gap-1 bg-[var(--color-surface)] rounded px-2 py-1">
                    <Lock size={12} />
                    <span className="text-xs font-mono">{agent.locks} active</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Orchestration Board - right */}
            <div className="lg:col-span-9 space-y-4">
              {/* Locks Visualization */}
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-[var(--color-brand)]" />
                  <span className="text-sm font-semibold">Symbol-Level Locks</span>
                </div>
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <div key={`lock-${agent.name}`} className="flex items-center gap-3">
                      <div className="text-xs font-mono text-[var(--color-text-muted)] w-16">{agent.file}</div>
                      <div className="flex-1 h-8 bg-[var(--color-surface)] rounded border border-[var(--color-border)] overflow-hidden flex items-center px-2">
                        <div
                          className="h-6 rounded transition-all"
                          style={{
                            backgroundColor: agent.color,
                            width: activeAgent === agent.name ? '100%' : '60%',
                            opacity: 0.6,
                          }}
                        />
                      </div>
                      <div className="text-xs font-mono text-green-500">Active</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Log */}
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-2">
                  <GitBranch size={14} className="text-[var(--color-brand)]" />
                  <span className="text-sm font-semibold">Live Event Stream</span>
                  <span className="ml-auto text-xs text-[var(--color-text-muted)]">Simulated</span>
                </div>

                <div className="max-h-64 overflow-y-auto font-mono text-xs">
                  {displayedEvents.length === 0 ? (
                    <div className="p-4 text-[var(--color-text-muted)] text-center">Waiting for events...</div>
                  ) : (
                    displayedEvents.map((event, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 border-b border-[var(--color-border)] flex items-start gap-3 hover:bg-[var(--color-surface)] transition-colors animate-in fade-in slide-in-from-left-2 duration-300"
                      >
                        <span className="text-[var(--color-text-muted)] min-w-fit">{event.time}</span>
                        <div className="w-6 h-6 flex-shrink-0">
                          <img
                            src={agents.find(a => a.name === event.agent)?.logo}
                            alt={event.agent}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {event.status === 'success' && <CheckCircle2 size={12} className="text-green-500" />}
                            {event.status === 'waiting' && <AlertCircle size={12} className="text-yellow-500" />}
                            <span>{event.action}</span>
                          </div>
                          <div className="text-[var(--color-text-muted)] text-xs mt-0.5">{event.file}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  )
}
