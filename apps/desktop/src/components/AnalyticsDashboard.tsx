import { useMemo } from 'react'
import { X, Zap, Brain, Coins, Clock, BarChart3, TrendingUp, Layers } from 'lucide-react'
import { C } from '../theme'

export type AgentMode = 'fast' | 'thinking'

export interface CostSession {
  id: string
  panelId: string
  modelId: string
  modelName: string
  provider: string
  mode: AgentMode
  promptTokens: number
  completionTokens: number
  costUsd: number
  durationMs: number
  timestamp: number
}

interface Props {
  sessions: CostSession[]
  onClose?: () => void
}

function fmt$  (n: number) { return n < 0.0001 ? '<$0.0001' : `$${n.toFixed(4)}` }
function fmtTok(n: number) { return n >= 1_000_000 ? `${(n/1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}K` : String(n) }
function fmtMs (ms: number) { return ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(1)}s` }
function fmtTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function AnalyticsDashboard({ sessions, onClose }: Props) {
  const stats = useMemo(() => {
    const totalTokens   = sessions.reduce((s, c) => s + c.promptTokens + c.completionTokens, 0)
    const totalCost     = sessions.reduce((s, c) => s + c.costUsd, 0)
    const totalDuration = sessions.reduce((s, c) => s + c.durationMs, 0)
    const fast       = sessions.filter(s => s.mode === 'fast')
    const thinking   = sessions.filter(s => s.mode === 'thinking')
    const fastTok    = fast.reduce((s, c) => s + c.promptTokens + c.completionTokens, 0)
    const thinkTok   = thinking.reduce((s, c) => s + c.promptTokens + c.completionTokens, 0)
    const fastCost   = fast.reduce((s, c) => s + c.costUsd, 0)
    const thinkCost  = thinking.reduce((s, c) => s + c.costUsd, 0)
    const fastDur    = fast.reduce((s, c) => s + c.durationMs, 0)
    const thinkDur   = thinking.reduce((s, c) => s + c.durationMs, 0)

    // Top models by cost
    const byModel: Record<string, { name: string; cost: number; tokens: number; count: number }> = {}
    for (const s of sessions) {
      if (!byModel[s.modelId]) byModel[s.modelId] = { name: s.modelName, cost: 0, tokens: 0, count: 0 }
      byModel[s.modelId].cost   += s.costUsd
      byModel[s.modelId].tokens += s.promptTokens + s.completionTokens
      byModel[s.modelId].count  += 1
    }
    const topModels = Object.values(byModel).sort((a, b) => b.cost - a.cost).slice(0, 5)
    const maxModelCost = topModels[0]?.cost || 1

    return { totalTokens, totalCost, totalDuration, fastTok, thinkTok, fastCost, thinkCost, fastDur, thinkDur, topModels, maxModelCost }
  }, [sessions])

  const isEmpty = sessions.length === 0

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'backdropIn .15s ease' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#0b1220', border: `1px solid ${C.muted}`, borderRadius: 18, width: 820, maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)', animation: 'modalIn .15s ease' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: 'linear-gradient(135deg, #0f1c2e 0%, #0b1220 100%)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2563eb20', border: '1px solid #2563eb40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={18} style={{ color: '#60a5fa' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Analytics</div>
            <div style={{ fontSize: 10, color: C.textMut, marginTop: 1 }}>{sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 7, transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.hover; (e.currentTarget as HTMLElement).style.color = C.text }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = C.textMut }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {isEmpty ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 14, color: C.textMut }}>
              <BarChart3 size={40} style={{ opacity: .3 }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>No sessions yet</div>
              <div style={{ fontSize: 11, opacity: .7 }}>Start an AI stream to see cost & usage analytics here.</div>
            </div>
          ) : (
            <>
              {/* Summary stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                <StatCard icon={<Coins size={14} />}    label="Total Cost"    value={fmt$(stats.totalCost)}          sub="API spend"          color="#f59e0b" grad="from-amber" />
                <StatCard icon={<Zap size={14} />}      label="Tokens Used"   value={fmtTok(stats.totalTokens)}      sub="input + output"     color="#22c55e" grad="from-green" />
                <StatCard icon={<Clock size={14} />}    label="Total Time"    value={fmtMs(stats.totalDuration)}     sub="wall-clock"         color="#60a5fa" grad="from-blue"  />
                <StatCard icon={<TrendingUp size={14}/>} label="Sessions"     value={String(sessions.length)}        sub="completed streams"  color="#a78bfa" grad="from-purple"/>
              </div>

              {/* Fast vs Thinking */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                {/* Mode bar chart */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Brain size={13} style={{ color: '#a78bfa' }} /> Fast vs Thinking
                  </div>
                  {[
                    { label: 'Tokens', fast: stats.fastTok, think: stats.thinkTok, fmt: fmtTok },
                    { label: 'Cost',   fast: stats.fastCost, think: stats.thinkCost, fmt: fmt$ },
                    { label: 'Time',   fast: stats.fastDur,  think: stats.thinkDur,  fmt: fmtMs },
                  ].map(row => {
                    const total = row.fast + row.think || 1
                    const fp = (row.fast / total) * 100
                    return (
                      <div key={row.label} style={{ marginBottom: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textMut, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: C.textDim }}>{row.label}</span>
                          <span><span style={{ color: '#22c55e' }}>{row.fmt(row.fast)}</span> <span style={{ opacity: .5 }}>/ </span><span style={{ color: '#a78bfa' }}>{row.fmt(row.think)}</span></span>
                        </div>
                        <div style={{ height: 6, background: C.card, borderRadius: 3, overflow: 'hidden', display: 'flex', gap: 1 }}>
                          <div style={{ width: `${fp}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)', borderRadius: 3, transition: 'width .4s ease' }} />
                          <div style={{ flex: 1, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 3 }} />
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />Fast</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#a78bfa', display: 'inline-block' }} />Thinking</span>
                  </div>
                </div>

                {/* Top models */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={13} style={{ color: '#60a5fa' }} /> Top Models by Cost
                  </div>
                  {stats.topModels.length === 0 ? (
                    <div style={{ fontSize: 11, color: C.textMut }}>No model data</div>
                  ) : stats.topModels.map(m => (
                    <div key={m.name} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                        <span style={{ color: C.textDim, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{m.name}</span>
                        <span style={{ color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>{fmt$(m.cost)}</span>
                      </div>
                      <div style={{ height: 5, background: C.card, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(m.cost / stats.maxModelCost) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: 3, transition: 'width .4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session log */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} style={{ color: C.textMut }} /> Recent Sessions
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {sessions.slice().reverse().map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: i < sessions.length - 1 ? `1px solid ${C.border}` : 'none', fontSize: 11, transition: 'background .1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                      <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800, letterSpacing: '0.05em', background: s.mode === 'fast' ? '#22c55e18' : '#a78bfa18', color: s.mode === 'fast' ? '#22c55e' : '#a78bfa', flexShrink: 0 }}>
                        {s.mode.toUpperCase()}
                      </span>
                      <span style={{ flex: 1, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {s.modelName}
                      </span>
                      <span style={{ color: C.textMut, fontSize: 10, flexShrink: 0 }}>{fmtTok(s.promptTokens + s.completionTokens)} tk</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700, minWidth: 64, textAlign: 'right', flexShrink: 0 }}>{fmt$(s.costUsd)}</span>
                      <span style={{ color: C.textMut, minWidth: 40, textAlign: 'right', flexShrink: 0 }}>{fmtMs(s.durationMs)}</span>
                      <span style={{ color: C.textMut, fontSize: 9, minWidth: 40, textAlign: 'right', flexShrink: 0, opacity: .7 }}>{fmtTime(s.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes backdropIn { from { opacity:0 } to { opacity:1 } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string; grad: string }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: `${color}12`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ color, opacity: .85 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textMut, marginTop: 4, opacity: .7 }}>{sub}</div>
    </div>
  )
}
