import { useMemo, useState, FormEvent } from "react"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  Plus,
  MoreHorizontal,
  Clock,
  User,
  Bot,
  AlertCircle,
  CheckCircle2,
  Circle,
  GripVertical,
} from "lucide-react"

type TaskStatus = "todo" | "doing" | "done" | "conflict"

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  assignee?: {
    id: string
    name: string
    type: "human" | "ai"
  }
  priority: "low" | "medium" | "high"
  createdAt: Date
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Setup Git worktrees",
    description: "Create isolated worktrees for each AI agent",
    status: "done",
    assignee: { id: "claude-1", name: "Claude", type: "ai" },
    priority: "high",
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "Implement symbol locking",
    description: "Add function-level lock mechanism to prevent conflicts",
    status: "doing",
    assignee: { id: "cursor-1", name: "Cursor", type: "ai" },
    priority: "high",
    createdAt: new Date(),
  },
  {
    id: "3",
    title: "Create Kanban dashboard",
    description: "Build React UI for task management with drag-drop",
    status: "doing",
    assignee: { id: "user-1", name: "You", type: "human" },
    priority: "medium",
    createdAt: new Date(),
  },
  {
    id: "4",
    title: "MCP server integration",
    description: "Setup Model Context Protocol server for AI communication",
    status: "todo",
    priority: "medium",
    createdAt: new Date(),
  },
  {
    id: "5",
    title: "Electron desktop app",
    description: "Package as desktop application for Windows/Mac",
    status: "todo",
    priority: "high",
    createdAt: new Date(),
  },
]

const columns: { id: TaskStatus; title: string; color: string; icon: typeof Circle }[] = [
  { id: "todo", title: "To Do", color: "bg-slate-100", icon: Circle },
  { id: "doing", title: "In Progress", color: "bg-blue-50", icon: Clock },
  { id: "done", title: "Done", color: "bg-green-50", icon: CheckCircle2 },
  { id: "conflict", title: "Conflict", color: "bg-red-50", icon: AlertCircle },
]

const priorityLabelStyles: Record<Task["priority"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-700",
}

interface TaskCardProps {
  task: Task
}

function TaskCard({ task }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-3 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs px-2 py-0.5 rounded ${priorityLabelStyles[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-2">
          <button className="text-slate-400 hover:text-slate-600">
            <MoreHorizontal size={14} />
          </button>
          <button {...attributes} {...listeners} className="text-slate-400 hover:text-slate-600">
            <GripVertical size={14} />
          </button>
        </div>
      </div>
      <h4 className="font-medium text-sm mb-1">{task.title}</h4>
      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1">
          {task.assignee ? (
            <>
              {task.assignee.type === "ai" ? (
                <Bot size={12} className="text-blue-500" />
              ) : (
                <User size={12} />
              )}
              <span>{task.assignee.name}</span>
            </>
          ) : (
            <span className="text-slate-300">Unassigned</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{task.createdAt.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

interface ColumnPanelProps {
  column: (typeof columns)[number]
  tasks: Task[]
}

function ColumnPanel({ column, tasks }: ColumnPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`${column.color} rounded-lg p-3 min-h-[400px] transition-border border ${
        isOver ? "border-blue-300" : "border-transparent"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <column.icon
            size={16}
            className={
              column.id === "conflict"
                ? "text-red-500"
                : column.id === "done"
                ? "text-green-500"
                : "text-slate-500"
            }
          />
          <h3 className="font-semibold text-sm">{column.title}</h3>
        </div>
        <span className="text-xs bg-white px-2 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Task["priority"]>("medium")

  const sensors = useSensors(useSensor(PointerSensor))

  const taskCount = tasks.length

  const tasksByColumn = useMemo(
    () =>
      columns.reduce((acc, column) => {
        acc[column.id] = tasks.filter((task) => task.status === column.id)
        return acc
      }, {} as Record<TaskStatus, Task[]>),
    [tasks],
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) {
      return
    }

    const activeTask = tasks.find((task) => task.id === active.id)
    if (!activeTask) {
      return
    }

    let destinationStatus: TaskStatus | undefined
    if (columns.some((column) => column.id === over.id)) {
      destinationStatus = over.id as TaskStatus
    } else {
      const overTask = tasks.find((task) => task.id === over.id)
      destinationStatus = overTask?.status
    }

    if (!destinationStatus || destinationStatus === activeTask.status) {
      return
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === activeTask.id ? { ...task, status: destinationStatus } : task,
      ),
    )
  }

  const handleAddTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) {
      return
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || "No description provided.",
      status: "todo",
      priority,
      createdAt: new Date(),
    }

    setTasks((current) => [newTask, ...current])
    setTitle("")
    setDescription("")
    setPriority("medium")
    setIsFormOpen(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="font-semibold text-lg">Task Board</h2>
          <p className="text-sm text-slate-500 mt-1">Manage {taskCount} tasks with drag-and-drop workflow state.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFormOpen((current) => !current)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            {isFormOpen ? "Cancel" : "Add Task"}
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleAddTask} className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                placeholder="New task title"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as Task["priority"])}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full min-h-[100px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              placeholder="Describe the task in a few sentences"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create Task
            </button>
          </div>
        </form>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          {columns.map((column) => (
            <ColumnPanel key={column.id} column={column} tasks={tasksByColumn[column.id]} />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
