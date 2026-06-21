import { useState, useEffect } from 'react'
import { X, Clock, CheckCircle2, Circle, Tag } from 'lucide-react'
import { C } from '../theme'
import type { Task, TaskStatus } from './TaskCard'

interface TaskDetailModalProps {
  task: Task | null
  onClose: () => void
  onMove: (id: string, status: TaskStatus) => void
}

export function TaskDetailModal({ task, onClose, onMove }: TaskDetailModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (task) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [task])

  useEffect(() => {
    if (!task) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [task, onClose])

  if (!task) return null

  const statusLabel: Record<TaskStatus, string> = {
    todo: 'To Do', in_progress: 'In Progress', review_pending: 'Review Pending', done: 'Done', conflict: 'Conflict',
  }
  const priorityColor: Record<string, string> = {
    high: '#f87171', medium: '#fbbf24', low: C.textMut,
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 200, transition: 'opacity 0.2s',
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 36, right: 0, bottom: 26, width: 320,
        background: C.surface, borderLeft: `1px solid ${C.border2}`,
        zIndex: 201, display: 'flex', flexDirection: 'column',
        transition: 'transform 0.2s ease',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Task Details
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex', transition: 'color 0.1s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMut}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.4 }}>{task.title}</h2>
          </div>

          {/* Status + Priority */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '8px 10px' }}>
              <p style={{ fontSize: 9, color: C.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {task.status === 'todo'        && <Circle       size={11} style={{ color: C.textMut }} />}
                {task.status === 'in_progress' && <Clock        size={11} style={{ color: C.accentLt }} />}
                {task.status === 'done'        && <CheckCircle2 size={11} style={{ color: '#22c55e' }} />}
                <span style={{ fontSize: 11, color: C.textDim }}>{statusLabel[task.status]}</span>
              </div>
            </div>
            <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '8px 10px' }}>
              <p style={{ fontSize: 9, color: C.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>Priority</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={10} style={{ color: priorityColor[task.priority] }} />
                <span style={{ fontSize: 11, color: priorityColor[task.priority], fontWeight: 600, textTransform: 'capitalize' }}>{task.priority}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Description</p>
              <p style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, margin: 0, background: C.card, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '10px 12px' }}>
                {task.description}
              </p>
            </div>
          )}

          {/* Actions */}
          {task.status !== 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Actions</p>
              {task.status === 'todo' && (
                <button onClick={() => { onMove(task.id, 'in_progress'); onClose() }}
                  style={{ width: '100%', padding: '8px', background: `${C.accent}18`, color: C.accentLt, border: `1px solid ${C.accent}40`, borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${C.accent}30`}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${C.accent}18`}
                >
                  Mark as In Progress →
                </button>
              )}
              <button onClick={() => { onMove(task.id, 'done'); onClose() }}
                style={{ width: '100%', padding: '8px', background: '#22c55e18', color: '#4ade80', border: '1px solid #22c55e30', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500, transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#22c55e25'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#22c55e18'}
              >
                Mark as Done ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
