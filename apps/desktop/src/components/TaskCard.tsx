import { useState } from 'react'
import { Circle, Clock, CheckCircle2 } from 'lucide-react'
import { C } from '../theme'

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: 'high' | 'medium' | 'low'
  assignedTo?: string
}

interface TaskCardProps {
  task: Task
  colId: TaskStatus
  onMove: (id: string, status: TaskStatus) => void
  onClick: (task: Task) => void
}

export function TaskCard({ task, colId, onMove, onClick }: TaskCardProps) {
  const [hovered, setHovered] = useState(false)

  const priorityStyle: Record<string, { bg: string; color: string }> = {
    high:   { bg: '#ef444420', color: '#f87171' },
    medium: { bg: '#f59e0b20', color: '#fbbf24' },
    low:    { bg: C.hover,     color: C.textMut },
  }
  const ps = priorityStyle[task.priority]

  return (
    <div
      onClick={() => onClick(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.card,
        border: `1px solid ${hovered ? `${C.accent}55` : C.border2}`,
        borderRadius: 12, padding: 12, cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? `0 4px 20px rgba(37,99,235,0.15)` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        {colId === 'todo'        && <Circle       size={12} style={{ color: C.textMut,  flexShrink: 0, marginTop: 2 }} />}
        {colId === 'in_progress' && <Clock        size={12} style={{ color: C.accentLt, flexShrink: 0, marginTop: 2 }} />}
        {colId === 'done'        && <CheckCircle2 size={12} style={{ color: '#22c55e',  flexShrink: 0, marginTop: 2 }} />}
        <span style={{
          fontSize: 12, fontWeight: 500, lineHeight: 1.4, flex: 1, color: colId === 'done' ? C.textMut : C.text,
          textDecoration: colId === 'done' ? 'line-through' : 'none',
        }}>
          {task.title}
        </span>
      </div>

      {task.description && (
        <p style={{ fontSize: 10, color: C.textMut, lineHeight: 1.5, margin: '0 0 8px', paddingLeft: 20 }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20 }}>
        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600, background: ps.bg, color: ps.color }}>
          {task.priority}
        </span>
        {colId !== 'done' && (
          <button
            onClick={ev => { ev.stopPropagation(); onMove(task.id, colId === 'todo' ? 'in_progress' : 'done') }}
            style={{
              fontSize: 9, color: C.accentLt,
              background: `${C.accent}18`, border: 'none',
              padding: '2px 7px', borderRadius: 4, cursor: 'pointer',
              opacity: hovered ? 1 : 0.35,
              transition: 'opacity 0.15s, background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${C.accent}40`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${C.accent}18`}
          >
            {colId === 'todo' ? 'Start →' : 'Done →'}
          </button>
        )}
      </div>
    </div>
  )
}
