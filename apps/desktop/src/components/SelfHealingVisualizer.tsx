import { useMemo } from 'react'
import { X, Activity, CheckCircle2, XCircle, Loader2, ArrowRight, Bug, Wrench, Zap } from 'lucide-react'
import { C } from '../theme'

export interface HealingAttempt {
  id: string
  error: string
  fix: string
  status: 'attempting' | 'success' | 'failed'
  timestamp: number
}

export interface HealingSession {
  id: string
  file?: string
  status: 'running' | 'success' | 'failed'
  attempts: HealingAttempt[]
  startedAt: number
  endedAt?: number
}

interface Props {
  session: HealingSession | null
  onClose?: () => void
}

const STATUS_ICON: Record<HealingAttempt['status'], React.ReactNode> = {
  attempting: <Loader2 size={14} style={{ color: C.accentLt, animation: 'spin 1s linear infinite' }} />,
  success: <CheckCircle2 size={14} style={{ color: '#22c55e' }} />,
  failed: <XCircle size={14} style={{ color: '#ef4444' }} />,
}

const STATUS_BORDER: Record<HealingAttempt['status'], string> = {
  attempting: C.accent,
  success: '#22c55e',
  failed: '#ef4444',
}

export function SelfHealingVisualizer({ session, onClose }: Props) {
  const duration = useMemo(() => {
    if (!session) return 0
    const end = session.endedAt ?? Date.now()
    return Math.max(0, end - session.startedAt)
  }, [session])

  if (!session) {
    return (
      <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMut, fontSize: 12 }}>
          <Activity size={14} /> No active self-healing session.
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <Activity size={15} style={{ color: session.status === 'running' ? C.accentLt : session.status === 'success' ? '#22c55e' : '#ef4444' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Self-Healing Visualizer</span>
        {session.file && <span style={{ fontSize: 10, color: C.textMut, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 7px' }}>{session.file}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: C.textMut }}>{(duration / 1000).toFixed(1)}s</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, display: 'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMut}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ padding: '16px 18px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, minWidth: 'max-content' }}>
          {session.attempts.map((attempt, idx) => (
            <div key={attempt.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 220,
                  flexShrink: 0,
                  background: C.bg,
                  border: `1px solid ${STATUS_BORDER[attempt.status]}60`,
                  borderRadius: 10,
                  padding: 10,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {attempt.status === 'attempting' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(90deg, transparent, ${C.accent}10, transparent)`,
                      animation: 'shimmer 1.5s infinite',
                    }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, position: 'relative' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: `${STATUS_BORDER[attempt.status]}20` }}>
                    {STATUS_ICON[attempt.status]}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>Attempt {idx + 1}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Bug size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 9, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Error</div>
                      <div style={{ fontSize: 10, color: '#f87171', lineHeight: 1.45 }}>{attempt.error}</div>
                    </div>
                  </div>
                  {attempt.fix && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Wrench size={12} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 9, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fix attempt</div>
                        <div style={{ fontSize: 10, color: '#4ade80', lineHeight: 1.45 }}>{attempt.fix}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {idx < session.attempts.length - 1 && (
                <ArrowRight size={16} style={{ color: C.textMut, flexShrink: 0 }} />
              )}
            </div>
          ))}

          {session.status === 'running' && (
            <div
              style={{
                width: 140,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: C.bg,
                border: `1px dashed ${C.accent}50`,
                borderRadius: 10,
                padding: 10,
                color: C.accentLt,
              }}
            >
              <Zap size={18} style={{ animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>Exploring next fix…</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
