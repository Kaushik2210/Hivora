import { useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle2, Plus } from 'lucide-react'
import { C } from '../theme'
import { TaskCard } from './TaskCard'
import { TaskDetailModal } from './TaskDetailModal'
import { EmptyState } from './EmptyState'
import type { Task, TaskStatus } from './TaskCard'

const COLUMNS: { id: TaskStatus; label: string; dot: string }[] = [
  { id: 'todo',        label: 'To Do',       dot: C.textDim  },
  { id: 'in_progress', label: 'In Progress', dot: C.accentLt },
  { id: 'done',        label: 'Done',        dot: '#22c55e'  },
]

function DroppableColumn({ col, tasks, onMove, onTaskClick, activeId }: {
  col: typeof COLUMNS[0]
  tasks: Task[]
  onMove: (id: string, status: TaskStatus) => void
  onTaskClick: (task: Task) => void
  activeId: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div style={{ width: 280, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.dot }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.textDim }}>{col.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: C.textMut, background: C.hover, padding: '1px 6px', borderRadius: 99 }}>
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{
        flex: 1, display: 'flex', flexDirection: 'column', gap: 8,
        overflowY: 'auto', paddingRight: 4, paddingBottom: 8,
        borderRadius: 10, transition: 'background 0.15s',
        background: isOver ? `${C.accent}08` : 'transparent',
        minHeight: 120,
      }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} colId={col.id} onMove={onMove} onClick={onTaskClick} isDragging={activeId === task.id} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div style={{ border: `1px dashed ${C.border2}`, borderRadius: 12, padding: 16, textAlign: 'center', transition: 'border-color 0.15s', borderColor: isOver ? C.accentLt : C.border2 }}>
            <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>
              {isOver ? 'Drop here' : 'Empty'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableTaskCard({ task, colId, onMove, onClick, isDragging }: {
  task: Task; colId: TaskStatus
  onMove: (id: string, status: TaskStatus) => void
  onClick: (task: Task) => void
  isDragging: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} colId={colId} onMove={onMove} onClick={onClick} />
    </div>
  )
}

interface BoardProps {
  tasks: Task[]
  projectName: string
  onMove: (id: string, status: TaskStatus) => void
  onAddTask: () => void
}

export function Board({ tasks, projectName, onMove, onAddTask }: BoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const overId = String(over.id)
    const col = COLUMNS.find(c => c.id === overId)
    if (col) {
      const task = tasks.find(t => t.id === String(active.id))
      if (task && task.status !== col.id) onMove(String(active.id), col.id)
    }
  }

  const activeTask = tasks.find(t => t.id === activeId)

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={22} />}
        title="No tasks yet"
        desc="Add your first task to start tracking work."
        action={onAddTask}
        actionLabel="Add Task"
      />
    )
  }

  return (
    <>
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: 0 }}>{projectName}</h2>
          <p style={{ fontSize: 10, color: C.textMut, margin: '3px 0 0' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={onAddTask}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: C.accent, color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 500, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.accentHov}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
          >
            <Plus size={12} /> Add Task
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ flex: 1, overflowX: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', gap: 16, height: '100%', minWidth: 'max-content' }}>
            {COLUMNS.map(col => (
              <DroppableColumn
                key={col.id}
                col={col}
                tasks={tasks.filter(t => t.status === col.id)}
                onMove={onMove}
                onTaskClick={setSelectedTask}
                activeId={activeId}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div style={{ opacity: 0.9, transform: 'rotate(2deg)', filter: 'drop-shadow(0 8px 24px rgba(37,99,235,0.3))' }}>
              <TaskCard task={activeTask} colId={activeTask.status} onMove={() => {}} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onMove={onMove} />
    </>
  )
}
