import { useState, useEffect } from 'react'
import { KanbanBoard, AgentList, LockManager } from '@hivora/ui'
import type { TaskItem, TaskStatus, AgentListItem, LockItem, ProjectItem } from '@hivora/ui'
import { HivoraClient } from '@hivora/shared/sdk'
import { brand } from '@hivora/shared/brand'
import { Cloud, HardDrive, LogOut, Plus, RefreshCw, AlertCircle } from 'lucide-react'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type Mode = 'cloud' | 'local'

export function App() {
  const [mode, setMode] = useState<Mode>('cloud')
  const [client] = useState(() => new HivoraClient({ baseUrl: apiUrl }))
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data state
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [agents, setAgents] = useState<AgentListItem[]>([])
  const [locks, setLocks] = useState<LockItem[]>([])

  // Initialize on mode change
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError(null)

      if (mode === 'cloud') {
        try {
          // Check auth
          const user = await client.me()
          if (!user) {
            setAuthed(false)
            setLoading(false)
            return
          }

          setAuthed(true)
          setError(null)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Connection failed'
          setError(msg)
          setAuthed(false)
        }
      } else {
        // Local mode - use demo data
        setAuthed(true)
        setError(null)
        setProjects([
          { id: 'demo-1', name: 'Demo Project' },
          { id: 'demo-2', name: 'Test Project' },
        ])
        setSelectedProjectId('demo-1')

        setAgents([
          { id: 'claude-1', name: 'Claude', type: 'ai' as const, status: 'working' as const, currentTask: 'Refactoring auth' },
          { id: 'cursor-1', name: 'Cursor', type: 'ai' as const, status: 'working' as const, currentTask: 'Building UI' },
          { id: 'copilot-1', name: 'Copilot', type: 'ai' as const, status: 'idle' as const },
        ])

        setTasks([
          {
            id: '1',
            title: 'Refactor auth module',
            description: 'Extract auth logic into separate service',
            status: 'in_progress' as TaskStatus,
            priority: 'high',
            createdAt: new Date(),
          },
          {
            id: '2',
            title: 'Build dashboard UI',
            description: 'Create responsive dashboard with charts',
            status: 'in_progress' as TaskStatus,
            priority: 'high',
            createdAt: new Date(),
          },
          {
            id: '3',
            title: 'Setup CI/CD pipeline',
            description: 'Configure GitHub Actions workflow',
            status: 'todo' as TaskStatus,
            priority: 'medium',
            createdAt: new Date(),
          },
        ])

        setLocks([
          {
            file: 'auth.ts',
            symbol: 'validateToken',
            agentId: 'claude-1',
            lockedAt: new Date().toISOString(),
          },
          {
            file: 'dashboard.tsx',
            symbol: 'DashboardPage',
            agentId: 'cursor-1',
            lockedAt: new Date().toISOString(),
          },
        ])
      }

      setLoading(false)
    }

    init()
  }, [mode, client])

  // Task handlers
  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    setTasks(t => t.map(task => task.id === taskId ? { ...task, status: newStatus } : task))

    if (mode === 'cloud' && selectedProjectId) {
      client.updateTask(selectedProjectId, taskId, { status: newStatus }).catch(() => {
        setError('Failed to update task')
      })
    }
  }

  const handleTaskCreate = (data: { title: string; description: string; priority: TaskItem['priority'] }) => {
    // Local mode - create locally (Cloud mode would require backend)
    const newTask: TaskItem = {
      id: Math.random().toString(),
      ...data,
      status: 'todo' as TaskStatus,
      createdAt: new Date(),
    }
    setTasks(prev => [...prev, newTask])
  }

  // Project selection
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
  }

  const handleLogout = async () => {
    if (mode === 'cloud') {
      await client.logout('').catch(() => {})
    }
    setAuthed(false)
  }

  const handleModeToggle = () => {
    setMode(m => m === 'cloud' ? 'local' : 'cloud')
    setError(null)
  }

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <div className="animate-spin">
          <RefreshCw size={24} className="text-[var(--color-brand)]" />
        </div>
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      </div>
    )
  }

  // Render auth required state
  if (mode === 'cloud' && !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-6 px-4">
        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] flex items-center justify-center">
          <span className="text-white font-bold text-3xl">⚡</span>
        </div>
        <h1 className="text-2xl font-bold">{brand.displayName} Desktop</h1>
        <p className="text-[var(--color-text-muted)] text-center max-w-md">
          Cloud mode requires authentication. Please sign in at the web app and return here.
        </p>
        <button
          onClick={() => setMode('local')}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
        >
          <HardDrive size={16} />
          Use Local Mode Instead
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface)]">
      {/* Title Bar */}
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <h1 className="flex items-center gap-3 text-lg font-bold">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">⚡</span>
          </div>
          <div>
            <div>{brand.displayName}</div>
            <div className="text-xs text-[var(--color-text-muted)] font-normal">Desktop {mode === 'cloud' ? '(Cloud)' : '(Local)'}</div>
          </div>
        </h1>

        <div className="flex items-center gap-3">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleModeToggle}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === 'cloud'
                ? 'bg-[var(--color-brand)] text-white'
                : 'border border-[var(--color-border)] text-[var(--color-text-muted)]'
            }`}
          >
            {mode === 'cloud' ? <Cloud size={14} /> : <HardDrive size={14} />}
            {mode === 'cloud' ? 'Cloud' : 'Local'}
          </button>

          {authed && (
            <button
              onClick={handleLogout}
              className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-elevated)]"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Sidebar */}
        <div className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
          {/* Project Selector */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Projects ({projects.length})</h3>
              {mode === 'local' && (
                <button className="p-1 rounded hover:bg-[var(--color-surface)] transition-colors" title="Add project">
                  <Plus size={14} />
                </button>
              )}
            </div>
            {projects.length > 0 ? (
              <div className="space-y-2">
                {projects.map(proj => (
                  <button
                    key={proj.id}
                    onClick={() => handleProjectSelect(proj.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedProjectId === proj.id
                        ? 'bg-[var(--color-brand)] text-white'
                        : 'hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {proj.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">No projects</p>
            )}
          </div>

          {/* Agents */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
            <h3 className="text-sm font-semibold mb-3">Agents ({agents.length})</h3>
            <AgentList agents={agents} />
          </div>

          {/* Locks */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
            <h3 className="text-sm font-semibold mb-3">Active Locks ({locks.length})</h3>
            <LockManager locks={locks} />
          </div>
        </div>

        {/* Main Board */}
        <div className="flex-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          {selectedProjectId ? (
            <KanbanBoard
              tasks={tasks}
              onTaskMove={handleTaskMove}
              onTaskCreate={handleTaskCreate}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-[var(--color-text-muted)]">
                <p className="text-sm">Select a project to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
