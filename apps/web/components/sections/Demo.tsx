'use client'

import { ScrollAnimation } from '@/components/ScrollAnimation'
import { Lock, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { useState, useEffect } from 'react'

const panels = [
  {
    name: 'Claude Sonnet 4.6',
    role: 'Backend refactor',
    color: '#D97757',
    logo: '/logos/claude.svg',
    file: 'auth.ts',
    messages: [
      { role: 'user',      text: '/refactor Rewrite the auth module to use JWT rotation' },
      { role: 'assistant', text: 'Analyzing auth.ts… Splitting into authService + tokenRotation. Acquiring lock on auth.ts:42–88.' },
    ],
  },
  {
    name: 'GPT-4o',
    role: 'Frontend build',
    color: '#10a37f',
    logo: '/logos/openai.svg',
    file: 'dashboard.tsx',
    messages: [
      { role: 'user',      text: 'Build the new dashboard header with user avatar and notifications' },
      { role: 'assistant', text: 'Creating DashboardHeader component. Waiting for auth.ts lock release before importing token utils…' },
    ],
  },
  {
    name: 'Gemini 2.5 Flash',
    role: 'Test suite',
    color: '#4285F4',
    logo: '/logos/gemini.svg',
    file: 'auth.test.ts',
    messages: [
      { role: 'user',      text: '/test Write unit tests for the new token rotation logic' },
      { role: 'assistant', text: 'Generating 12 test cases for tokenRotation(). Running against mock JWT store…' },
    ],
  },
]

const lockEvents = [
  { time: '12:34:01', agent: 'Claude Sonnet 4.6',  color: '#D97757', action: 'Lock acquired',       file: 'auth.ts:42–88',        status: 'success' },
  { time: '12:34:03', agent: 'GPT-4o',             color: '#10a37f', action: 'Waiting for lock',    file: 'auth.ts → token utils', status: 'waiting' },
  { time: '12:34:07', agent: 'Claude Sonnet 4.6',  color: '#D97757', action: 'Lock released',       file: 'auth.ts',              status: 'success' },
  { time: '12:34:08', agent: 'GPT-4o',             color: '#10a37f', action: 'Lock acquired',       file: 'auth.ts → token utils', status: 'success' },
  { time: '12:34:11', agent: 'Gemini 2.5 Flash',   color: '#4285F4', action: 'Tests passed (12/12)', file: 'auth.test.ts',         status: 'success' },
]

function PanelCard({ panel, animate }: { panel: typeof panels[0]; animate: boolean }) {
  const [visibleMsgs, setVisibleMsgs] = useState(0)

  useEffect(() => {
    if (!animate) { setVisibleMsgs(0); return }
    setVisibleMsgs(0)
    const t1 = setTimeout(() => setVisibleMsgs(1), 400)
    const t2 = setTimeout(() => setVisibleMsgs(2), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [animate])

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden flex flex-col" style={{ minHeight: 220 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: panel.color + '20' }}>
          <img src={panel.logo} alt={panel.name} className="w-4 h-4" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </div>
        <span className="text-xs font-semibold" style={{ color: panel.color }}>{panel.name}</span>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">{panel.role}</span>
        <span className="flex items-center gap-1 text-xs" style={{ color: panel.color }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: panel.color }} />
          Live
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
        {panel.messages.slice(0, visibleMsgs).map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`text-xs px-2.5 py-1.5 rounded-lg max-w-[90%] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[var(--color-brand)]/20 border border-[var(--color-brand)]/30 text-[var(--color-text)]'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {visibleMsgs === 1 && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
              <span className="animate-pulse">▌</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5">
          <span className="flex-1 text-xs text-[var(--color-text-muted)] opacity-40">Message {panel.name.split(' ')[0]}…</span>
          <Send size={10} className="text-[var(--color-text-muted)] opacity-40" />
        </div>
      </div>
    </div>
  )
}

export function Demo() {
  const [displayedEvents, setDisplayedEvents] = useState<typeof lockEvents>([])
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    let idx = 0
    let running = true

    const cycle = () => {
      setDisplayedEvents([])
      setAnimate(false)
      setTimeout(() => setAnimate(true), 200)

      const tick = () => {
        if (!running) return
        if (idx < lockEvents.length) {
          setDisplayedEvents(lockEvents.slice(0, idx + 1))
          idx++
          setTimeout(tick, 900)
        } else {
          idx = 0
          setTimeout(cycle, 2000)
        }
      }
      setTimeout(tick, 600)
    }

    cycle()
    return () => { running = false }
  }, [])

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Three AIs. One Project. Zero Conflicts.
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg max-w-3xl mx-auto">
              Open multiple panels, assign each a different AI model, and watch them code in parallel.
              The orchestrator handles file locking automatically — no manual coordination needed.
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={200}>
          <div className="space-y-6">
            {/* Panels row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {panels.map((panel) => (
                <PanelCard key={panel.name} panel={panel} animate={animate} />
              ))}
            </div>

            {/* Orchestrator bar */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-2">
                <Lock size={14} className="text-[var(--color-brand)]" />
                <span className="text-sm font-semibold">Hivora Orchestrator — Live Lock Stream</span>
                <span className="ml-auto text-xs text-[var(--color-text-muted)] bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-full px-2 py-0.5">
                  simulated
                </span>
              </div>

              <div className="font-mono text-xs" style={{ minHeight: 140 }}>
                {displayedEvents.length === 0 ? (
                  <div className="p-4 text-[var(--color-text-muted)] text-center">Waiting for events…</div>
                ) : (
                  displayedEvents.map((ev, i) => (
                    <div key={i} className="px-4 py-2 border-b border-[var(--color-border)] flex items-center gap-3 hover:bg-[var(--color-surface)] transition-colors animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[var(--color-text-muted)] min-w-[68px]">{ev.time}</span>
                      <span className="font-semibold min-w-[148px] truncate" style={{ color: ev.color }}>{ev.agent}</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        {ev.status === 'success' && <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />}
                        {ev.status === 'waiting' && <AlertCircle  size={11} className="text-yellow-500 flex-shrink-0" />}
                        <span className="text-[var(--color-text)]">{ev.action}</span>
                      </div>
                      <span className="text-[var(--color-text-muted)] truncate max-w-[140px]">{ev.file}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  )
}
