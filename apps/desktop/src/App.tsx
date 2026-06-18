import { useState, useEffect } from 'react'
import { KanbanBoard, AgentList, LockManager, ProjectSelector } from '@hivora/ui'
import type { TaskItem, TaskStatus, AgentListItem, LockItem, ProjectItem } from '@hivora/ui'
import { HivoraClient } from '@hivora/shared/sdk'
import { brand } from '@hivora/shared/brand'
import { Cloud, HardDrive, LogOut } from 'lucide-react'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type Mode = 'cloud' | 'local'

export function App() {
  const [mode, setMode] = useState<Mode>('cloud')
  const [client] = useState(() => new HivoraClient({ baseUrl: apiUrl }))
  const [authed, setAuthed] = useState(false)

  // Data state
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const agents: AgentListItem[] = [
    { id: 'claude-1', name: 'Claude', role: 'Backend', status: 'working', logo: '🤖' },
    { id: 'cursor-1', name: 'Cursor', role: 'Frontend', status: 'working', logo: '✏️' },
    { id: 'copilot-1', name: 'Copilot', role: 'DevOps', status: 'idle', logo: '⚡' },
  ]
  const locks: LockItem[] = [
    { id: 'lock-1', file: 'auth.ts', symbol: 'validateToken', agent: 'Claude', acquiredAt: new Date() },
    { id: 'lock-2', file: 'dashboard.tsx', symbol: 'DashboardPage', agent: 'Cursor', acquiredAt: new Date() },
  ]
  const [projects, setProjects] = useState<ProjectItem[]>([])

  useEffect(() => {
    if (mode === 'cloud') {
      client.me().then(user => {
        if (user) setAuthed(true)
        return client.listOrganizations()
      }).then(orgs => {
        if (orgs.length === 0) return
        return client.listProjects(orgs[0].id)
      }).then(ps => {
        if (!ps) return
        setProjects(ps.map((p: any) => ({ id: p.id, name: p.name })))
        if (ps.length > 0) {
          client.listTasks(ps[0].id).then(ts => setTasks(ts.map((t: any) => ({
            id: t.id, title: t.title, description: t.description || '',
            status: (t.status || 'todo') as TaskStatus,
            priority: (t.priority || 'medium') as TaskItem['priority'],
            createdAt: t.createdAt,
          })))).catch(() => {})
        }
      }).catch(() => setAuthed(false))
    }
  }, [mode])

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    setTasks(t => t.map(task => task.id === taskId ? { ...task, status: newStatus } : task))
    if (mode === 'cloud' && projects.length > 0) {
      client.updateTask(projects[0].id, taskId, { status: newStatus }).catch(() => {})
    }
  }

  const handleTaskCreate = (data: { title: string; description: string; priority: TaskItem['priority'] }) => {
    if (mode === 'cloud' && projects.length > 0) {
      client.createTask(projects[0].id, data).then(t => {
        setTasks(prev => [...prev, { ...t, status: 'todo' as TaskStatus, createdAt: t.createdAt } as TaskItem])
      }).catch(() => {})
    }
  }

  const handleLogout = async () => {
    if (mode === 'cloud')       await client.logout('').catch(() => {})
    setAuthed(false)
  }

  const handleModeToggle = () => {
    setMode(m => m === 'cloud' ? 'local' : 'cloud')
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Title Bar */}
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] flex items-center justify-center">
            <span className="text-white font-bold text-lg">⚡</span>
          </div>
          <span>{brand.displayName}</span>
          <span className="text-sm font-normal text-[var(--color-text-muted)]">Desktop</span>
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={handleModeToggle}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === 'cloud'
                ? 'bg-[var(--color-brand)] text-white'
                : 'border border-[var(--color-border)] text-[var(--color-text-muted)]'
            }`}>
            {mode === 'cloud' ? <Cloud size={14} /> : <HardDrive size={14} />}
            {mode === 'cloud' ? 'Cloud' : 'Local'}
          </button>
          {authed && (
            <button onClick={handleLogout} className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-elevated)]">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 p-4">
        {/* Sidebar */}
        <div className="flex w-72 shrink-0 flex-col gap-4">
          <ProjectSelector projects={projects} onSelect={() => {}} onCreate={() => {}} />
          <AgentList agents={agents} />
          <LockManager locks={locks} />
        </div>

        {/* Board */}
        <div className="flex-1">
          <KanbanBoard
            tasks={tasks}
            onTaskMove={handleTaskMove}
            onTaskCreate={handleTaskCreate}
          />
        </div>
      </div>
    </div>
  )
}
