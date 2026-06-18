import { useMemo, useState, FormEvent } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Plus, Clock, User, Bot, AlertCircle, CheckCircle2, Circle, GripVertical } from 'lucide-react'

export type TaskStatus = 'todo' | 'doing' | 'done' | 'conflict'

export interface TaskItem {
  id: string
  title: string
  description: string
  status: TaskStatus
  assignee?: { id: string; name: string; type: 'human' | 'ai' }
  priority: 'low' | 'medium' | 'high'
  createdAt: Date | string
}

export interface KanbanBoardProps {
  tasks: TaskItem[]
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void
  onTaskCreate?: (data: { title: string; description: string; priority: TaskItem['priority'] }) => void
}

const columns: { id: TaskStatus; title: string; icon: typeof Circle }[] = [
  { id: 'todo', title: 'To Do', icon: Circle },
  { id: 'doing', title: 'In Progress', icon: Clock },
  { id: 'done', title: 'Done', icon: CheckCircle2 },
  { id: 'conflict', title: 'Conflict', icon: AlertCircle },
]

const priorityColors: Record<TaskItem['priority'], string> = {
  high: 'bg-red-500/10 text-red-400',
  medium: 'bg-amber-500/10 text-amber-400',
  low: 'bg-slate-500/10 text-slate-400',
}

function TaskCard({ task }: { task: TaskItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.85 : 1 }
    : undefined

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-all hover:border-[var(--color-brand)]/30">
      <div className="mb-2 flex items-start justify-between">
        <span className={`rounded px-2 py-0.5 text-xs ${priorityColors[task.priority]}`}>{task.priority}</span>
        <button {...attributes} {...listeners} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <GripVertical size={14} />
        </button>
      </div>
      <h4 className="mb-1 text-sm font-medium">{task.title}</h4>
      <p className="mb-3 line-clamp-2 text-xs text-[var(--color-text-muted)]">{task.description}</p>
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-1">
          {task.assignee ? (
            <>
              {task.assignee.type === 'ai' ? <Bot size={12} className="text-[var(--color-brand-light)]" /> : <User size={12} />}
              <span>{task.assignee.name}</span>
            </>
          ) : (
            <span className="text-[var(--color-text-muted)]">Unassigned</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{typeof task.createdAt === 'string' ? new Date(task.createdAt).toLocaleDateString() : task.createdAt.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

function ColumnPanel({ column, tasks }: { column: typeof columns[number]; tasks: TaskItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[400px] rounded-xl border bg-[var(--color-surface-elevated)] p-3 transition-all ${
        isOver ? 'border-[var(--color-brand)]' : 'border-[var(--color-border)]'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <column.icon size={16} className={
            column.id === 'conflict' ? 'text-red-400' : column.id === 'done' ? 'text-green-400' : 'text-[var(--color-text-muted)]'
          } />
          <h3 className="text-sm font-semibold">{column.title}</h3>
        </div>
        <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.map(task => <TaskCard key={task.id} task={task} />)}
      </div>
    </div>
  )
}

export function KanbanBoard({ tasks, onTaskMove, onTaskCreate }: KanbanBoardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskItem['priority']>('medium')

  const sensors = useSensors(useSensor(PointerSensor))

  const tasksByColumn = useMemo(() =>
    columns.reduce((acc, col) => { acc[col.id] = tasks.filter(t => t.status === col.id); return acc }, {} as Record<TaskStatus, TaskItem[]>),
    [tasks]
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || !onTaskMove) return
    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return
    let dest: TaskStatus | undefined
    if (columns.some(c => c.id === over.id)) dest = over.id as TaskStatus
    else { const ot = tasks.find(t => t.id === over.id); dest = ot?.status }
    if (!dest || dest === activeTask.status) return
    onTaskMove(activeTask.id, dest)
  }

  const handleAddTask = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim() || !onTaskCreate) return
    onTaskCreate({ title: title.trim(), description: description.trim() || 'No description', priority })
    setTitle(''); setDescription(''); setPriority('medium'); setIsFormOpen(false)
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Task Board</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Manage {tasks.length} tasks</p>
        </div>
        <button onClick={() => setIsFormOpen(o => !o)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110">
          <Plus size={16} /> {isFormOpen ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {isFormOpen && onTaskCreate && (
        <form onSubmit={handleAddTask} className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
                placeholder="New task title" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TaskItem['priority'])}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-brand)]">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="min-h-[100px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
              placeholder="Describe the task" />
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit"
              className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110">
              Create Task
            </button>
          </div>
        </form>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          {columns.map(col => <ColumnPanel key={col.id} column={col} tasks={tasksByColumn[col.id]} />)}
        </div>
      </DndContext>
    </div>
  )
}
