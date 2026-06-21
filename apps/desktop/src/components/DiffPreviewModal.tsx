import { useMemo, useState } from 'react'
import { X, Check, XCircle, FileCode2 } from 'lucide-react'
import { C } from '../theme'

export interface FileChange {
  file: string
  before: string
  after: string
}

export interface DiffAnalytics {
  provider: string
  model: string
  mode: 'fast' | 'thinking'
  inputTokens: number
  outputTokens: number
  cost: number
}

type DiffType = 'same' | 'add' | 'remove'

interface DiffLine {
  type: DiffType
  oldLine: number | null
  newLine: number | null
  content: string
}

// Simple O(n*m) LCS over lines.  Good enough for review-sized diffs.
export function lineDiff(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split('\n')
  const b = newText.split('\n')

  const dp: number[][] = Array(a.length + 1)
    .fill(0)
    .map(() => Array(b.length + 1).fill(0))

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push({ type: 'same', oldLine: i + 1, newLine: j + 1, content: a[i] })
      i++
      j++
    } else if (j < b.length && (i === a.length || dp[i][j + 1] >= dp[i + 1][j])) {
      out.push({ type: 'add', oldLine: null, newLine: j + 1, content: b[j] })
      j++
    } else if (i < a.length) {
      out.push({ type: 'remove', oldLine: i + 1, newLine: null, content: a[i] })
      i++
    } else {
      out.push({ type: 'add', oldLine: null, newLine: j + 1, content: b[j] })
      j++
    }
  }
  return out
}

const DIFF_COLORS: Record<DiffType, { bg: string; border: string; text: string }> = {
  same:   { bg: 'transparent', border: 'transparent', text: C.text },
  add:    { bg: '#22c55e12',   border: '#22c55e25',   text: '#4ade80' },
  remove: { bg: '#ef444412',   border: '#ef444425',   text: '#f87171' },
}

interface Props {
  change: FileChange | null
  analytics?: DiffAnalytics | null
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}

export function DiffPreviewModal({ change, analytics, onClose, onApprove, onReject }: Props) {
  const [filter, setFilter] = useState<'all' | 'changes'>('changes')
  const diff = useMemo(() => (change ? lineDiff(change.before, change.after) : []), [change])

  const visible = filter === 'all' ? diff : diff.filter(l => l.type !== 'same')
  const added = diff.filter(l => l.type === 'add').length
  const removed = diff.filter(l => l.type === 'remove').length

  if (!change) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'backdropIn .15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.muted}`,
          borderRadius: 16,
          width: 900,
          maxWidth: '92vw',
          height: '82vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          animation: 'modalIn .15s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <FileCode2 size={18} style={{ color: C.accentLt, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {change.file}
            </div>
            <div style={{ fontSize: 10, color: C.textMut, marginTop: 2 }}>
              Review AI-suggested changes before approving
            </div>
            {analytics && (
              <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9, color: C.textMut, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 6px' }}>
                  {analytics.provider} · {analytics.model}
                </span>
                <span style={{ fontSize: 9, color: analytics.mode === 'fast' ? '#22c55e' : '#a78bfa', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase', fontWeight: 700 }}>
                  {analytics.mode}
                </span>
                <span style={{ fontSize: 9, color: '#f59e0b', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 6px' }}>
                  ${analytics.cost.toFixed(4)}
                </span>
                <span style={{ fontSize: 9, color: C.textMut, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 6px' }}>
                  {(analytics.inputTokens + analytics.outputTokens).toLocaleString()} tokens
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
            <span style={{ color: '#4ade80', background: '#22c55e15', border: '1px solid #22c55e30', borderRadius: 4, padding: '2px 7px' }}>
              +{added}
            </span>
            <span style={{ color: '#f87171', background: '#ef444415', border: '1px solid #ef444430', borderRadius: 4, padding: '2px 7px' }}>
              −{removed}
            </span>
          </div>

          <div style={{ display: 'flex', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
            <button
              onClick={() => setFilter('changes')}
              style={{
                padding: '4px 10px',
                fontSize: 10,
                border: 'none',
                background: filter === 'changes' ? `${C.accent}25` : 'none',
                color: filter === 'changes' ? C.accentLt : C.textMut,
                cursor: 'pointer',
              }}
            >
              Changes
            </button>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '4px 10px',
                fontSize: 10,
                border: 'none',
                background: filter === 'all' ? `${C.accent}25` : 'none',
                color: filter === 'all' ? C.accentLt : C.textMut,
                cursor: 'pointer',
              }}
            >
              All
            </button>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 5 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMut}
          >
            <X size={16} />
          </button>
        </div>

        {/* Diff body */}
        <div style={{ flex: 1, overflow: 'auto', background: C.bg, fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace" }}>
          {visible.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.textMut, fontSize: 12 }}>
              No changes to display
            </div>
          ) : (
            <div style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
              {visible.map((line, idx) => {
                const style = DIFF_COLORS[line.type]
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'table-row',
                      background: style.bg,
                      borderBottom: `1px solid ${line.type === 'same' ? 'transparent' : style.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'table-cell',
                        width: 44,
                        padding: '2px 8px',
                        fontSize: 11,
                        color: C.textMut,
                        textAlign: 'right',
                        userSelect: 'none',
                        borderRight: `1px solid ${C.border}`,
                        opacity: 0.7,
                      }}
                    >
                      {line.oldLine ?? ''}
                    </div>
                    <div
                      style={{
                        display: 'table-cell',
                        width: 44,
                        padding: '2px 8px',
                        fontSize: 11,
                        color: C.textMut,
                        textAlign: 'right',
                        userSelect: 'none',
                        borderRight: `1px solid ${C.border}`,
                        opacity: 0.7,
                      }}
                    >
                      {line.newLine ?? ''}
                    </div>
                    <div
                      style={{
                        display: 'table-cell',
                        padding: '2px 12px',
                        fontSize: 12,
                        color: style.text,
                        whiteSpace: 'pre',
                        wordBreak: 'break-word',
                      }}
                    >
                      {line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '}
                      {line.content}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 18px',
            borderTop: `1px solid ${C.border}`,
            flexShrink: 0,
            background: C.card,
          }}
        >
          <span style={{ fontSize: 11, color: C.textMut }}>
            {added + removed} line{added + removed !== 1 ? 's' : ''} changed
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onReject}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#ef4444',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background .1s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#dc2626'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#ef4444'}
            >
              <XCircle size={14} /> Reject
            </button>
            <button
              onClick={onApprove}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#22c55e',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background .1s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#16a34a'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#22c55e'}
            >
              <Check size={14} /> Approve
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes backdropIn { from { opacity:0 } to { opacity:1 } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(6px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>
    </div>
  )
}
