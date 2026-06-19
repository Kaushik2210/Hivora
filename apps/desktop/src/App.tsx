import { useState, useEffect, useRef } from 'react'
import {
  FolderOpen, Lock, GitBranch,
  Settings, Cpu, X, Check, Wifi, Layers,
  User, Package, Bell, Zap,
} from 'lucide-react'
import { useRealtime } from './hooks/useRealtime'
import type { RealtimeEvent } from '@hivora/shared'
import { C } from './theme'
import { TitleBar } from './components/TitleBar'
import { AgentWorkspace } from './components/AgentWorkspace'
import { EmptyState } from './components/EmptyState'
import { WelcomeScreen } from './components/WelcomeScreen'
import { Sidebar } from './components/Sidebar'
import type { SidebarSection } from './components/Sidebar'
import type { Task, TaskStatus } from './components/TaskCard'

type Mode = 'cloud' | 'local'

interface Agent    { id: string; name: string; tool: string; logo: string; status: 'working' | 'idle' | 'error'; currentTask?: string; color: string }
interface FileLock { file: string; symbol: string; agentId: string }
interface Project  { id: string; name: string }


// ── App ────────────────────────────────────────────────────────────────────────
export function App() {
  const [mode, setMode]       = useState<Mode>('local')
  const [section, setSection] = useState<SidebarSection>('explorer')

  const [projects, setProjects]               = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [tasks, setTasks]   = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [locks, setLocks]   = useState<FileLock[]>([])
  const [syncing, setSyncing] = useState(false)

  const [showAddTask,    setShowAddTask]    = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [newTitle,    setNewTitle]    = useState('')
  const [newDesc,     setNewDesc]     = useState('')
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium')
  const [newProjectName, setNewProjectName] = useState('')

  const [serverUrl,     setServerUrl]     = useState('http://localhost:4000')
  const [webUrl,        setWebUrl]        = useState('http://localhost:3000')
  const [notifications, setNotifications] = useState(true)
  const [autoSync,      setAutoSync]      = useState(true)
  const [authed,       setAuthed]      = useState(false)
  const [showWelcome,  setShowWelcome] = useState(false)

  const taskInputRef    = useRef<HTMLInputElement>(null)
  const projectInputRef = useRef<HTMLInputElement>(null)

  const eAPI = (window as any).electronAPI

  // ── API helpers ──────────────────────────────────────────────────────────────
  // ── Startup: check persisted tokens ─────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('hivora_access_token')
    if (token) {
      setAuthed(true)
      setMode('cloud')
      fetchCloudData()
    } else {
      setShowWelcome(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const apiRequest = async <T,>(method: string, path: string, body?: unknown): Promise<T> => {
    let token = localStorage.getItem('hivora_access_token')
    let res = await eAPI?.apiRequest({ method, path, body, token })

    if (res?.error && res.status === 401) {
      const refreshToken = localStorage.getItem('hivora_refresh_token')
      if (refreshToken) {
        const refreshRes = await eAPI?.apiRequest({ method: 'POST', path: '/api/auth/refresh', body: { refreshToken } })
        if (refreshRes && !refreshRes.error) {
          localStorage.setItem('hivora_access_token', refreshRes.data.accessToken)
          localStorage.setItem('hivora_refresh_token', refreshRes.data.refreshToken)
          token = refreshRes.data.accessToken
          res = await eAPI?.apiRequest({ method, path, body, token })
        }
      }
    }
    if (!res || res.error) throw new Error(res?.message || 'Request failed')
    return res.data as T
  }

  const fetchCloudData = async (currentProjId?: string | null) => {
    setSyncing(true)
    try {
      const orgs = await apiRequest<any[]>('GET', '/api/organizations')
      if (orgs.length === 0) return

      const orgId = orgs[0].id
      const cloudProjects = await apiRequest<any[]>('GET', `/api/organizations/${orgId}/projects`)
      setProjects(cloudProjects)

      let projId = currentProjId ?? selectedProjectId
      if (cloudProjects.length > 0 && (!projId || !cloudProjects.find(p => p.id === projId))) {
        projId = cloudProjects[0].id
        setSelectedProjectId(projId)
      }

      if (projId) {
        const [cloudTasks, cloudAgents, cloudLocks] = await Promise.all([
          apiRequest<any[]>('GET', `/api/projects/${projId}/tasks`),
          apiRequest<any[]>('GET', `/api/projects/${projId}/agents`),
          apiRequest<any[]>('GET', `/api/projects/${projId}/locks`),
        ])
        setTasks(cloudTasks.map(t => ({ ...t, status: t.status === 'doing' ? 'in_progress' : t.status, description: t.description || '' })))
        setAgents(cloudAgents.map(a => ({
          id: a.id, name: a.name,
          tool: a.type === 'ai' ? (a.provider || 'AI Agent') : 'Human Dev',
          logo: a.name.toLowerCase().includes('claude') ? '/logos/claude.svg'
              : a.name.toLowerCase().includes('cursor') ? '/logos/cursor.svg'
              : '/logos/github-copilot.svg',
          status: a.status === 'working' ? 'working' : 'idle',
          currentTask: a.currentTask || undefined,
          color: a.name.toLowerCase().includes('claude') ? '#D97757' : '#8B5CF6',
        })))
        setLocks(cloudLocks.map(l => ({ file: l.file, symbol: l.symbol, agentId: l.agentId })))
      }
    } catch (err) {
      console.error('Failed to fetch cloud data', err)
    } finally {
      setSyncing(false)
    }
  }

  // ── Mode toggle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'local') {
      setProjects([]); setSelectedProjectId(null); setTasks([]); setAgents([]); setLocks([])
      setAuthed(false)
    } else {
      const token = localStorage.getItem('hivora_access_token')
      if (token) { setAuthed(true); fetchCloudData() }
      else { setAuthed(false); setProjects([]); setTasks([]); setAgents([]); setLocks([]) }
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'cloud' && authed && selectedProjectId) fetchCloudData(selectedProjectId)
  }, [selectedProjectId, authed])

  useRealtime(selectedProjectId || undefined, (event: RealtimeEvent) => {
    if (mode === 'cloud' && authed && selectedProjectId)
      if (['task:updated', 'agent:updated', 'lock:acquired', 'lock:released'].includes(event.type))
        fetchCloudData(selectedProjectId)
  })

  useEffect(() => {
    if (eAPI?.fsScan) eAPI.fsScan().then((res: any) => console.log(`[Scanner] ${res.length} files`)).catch(console.error)
  }, [eAPI])

  useEffect(() => { if (showAddTask)    setTimeout(() => taskInputRef.current?.focus(),    50) }, [showAddTask])
  useEffect(() => { if (showAddProject) setTimeout(() => projectInputRef.current?.focus(), 50) }, [showAddProject])

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowAddTask(false); setShowAddProject(false) }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); setShowAddProject(true) }
      if (e.ctrlKey && e.key === 't') { e.preventDefault(); if (selectedProjectId) setShowAddTask(true) }
      if (e.ctrlKey && e.key === ',') { e.preventDefault(); setSection('settings') }
      if (e.ctrlKey && e.shiftKey && e.key === 'E') { e.preventDefault(); setSection('explorer') }
      if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); setSection('agents') }
      if (e.ctrlKey && e.shiftKey && e.key === 'M') { e.preventDefault(); setSection('models') }
      if (e.ctrlKey && e.shiftKey && e.key === 'L') { e.preventDefault(); setSection('locks') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedProjectId])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleWelcomeLogin = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('hivora_access_token', accessToken)
    localStorage.setItem('hivora_refresh_token', refreshToken)
    setAuthed(true)
    setMode('cloud')
    setShowWelcome(false)
    fetchCloudData()
  }

  const handleLogout = () => {
    localStorage.removeItem('hivora_access_token')
    localStorage.removeItem('hivora_refresh_token')
    setAuthed(false); setProjects([]); setTasks([]); setAgents([]); setLocks([])
    setShowWelcome(true)
  }

  const handleAddTask = async () => {
    if (!newTitle.trim() || !selectedProjectId) return
    if (mode === 'local') {
      setTasks(prev => [...prev, { id: Date.now().toString(), title: newTitle.trim(), description: newDesc.trim(), status: 'todo', priority: newPriority }])
    } else {
      try {
        await apiRequest('POST', `/api/projects/${selectedProjectId}/tasks`, { title: newTitle.trim(), description: newDesc.trim() || undefined, priority: newPriority, status: 'todo' })
        await fetchCloudData(selectedProjectId)
      } catch (err) { console.error('Failed to create cloud task', err) }
    }
    setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setShowAddTask(false)
  }

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return
    if (mode === 'local') {
      const proj: Project = { id: Date.now().toString(), name: newProjectName.trim() }
      setProjects(prev => [...prev, proj]); setSelectedProjectId(proj.id)
    } else {
      try {
        const orgs = await apiRequest<any[]>('GET', '/api/organizations')
        if (orgs.length > 0) {
          const newProj = await apiRequest<any>('POST', `/api/organizations/${orgs[0].id}/projects`, { name: newProjectName.trim(), description: 'Created from Desktop Client' })
          setProjects(prev => [...prev, newProj]); setSelectedProjectId(newProj.id)
        }
      } catch (err) { console.error('Failed to create cloud project', err) }
    }
    setNewProjectName(''); setShowAddProject(false); setSection('explorer')
  }

  const handleTaskMove = async (id: string, status: TaskStatus) => {
    if (mode === 'local') {
      setTasks(t => t.map(task => task.id === id ? { ...task, status } : task))
    } else {
      try {
        const dbStatus = status === 'in_progress' ? 'doing' : status
        await apiRequest('PATCH', `/api/projects/${selectedProjectId}/tasks/${id}`, { status: dbStatus })
        await fetchCloudData(selectedProjectId)
      } catch (err) { console.error('Failed to update cloud task status', err) }
    }
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const activeAgents    = agents.filter(a => a.status === 'working').length


  const MENUS = [
    { label: 'File', items: [
      { label: 'New Project', shortcut: 'Ctrl+N', action: () => setShowAddProject(true) },
      { label: 'New Task',    shortcut: 'Ctrl+T', action: () => { if (selectedProject) setShowAddTask(true) } },
      null,
      { label: 'Settings',   shortcut: 'Ctrl+,', action: () => setSection('settings') },
      null,
      { label: 'Quit', shortcut: 'Alt+F4', action: () => eAPI?.windowClose() },
    ]},
    { label: 'View', items: [
      { label: 'Explorer',  shortcut: 'Ctrl+Shift+E', action: () => setSection('explorer') },
      { label: 'Agents',    shortcut: 'Ctrl+Shift+A', action: () => setSection('agents')   },
      { label: 'AI Models', shortcut: 'Ctrl+Shift+M', action: () => setSection('models')   },
      { label: 'Locks',     shortcut: 'Ctrl+Shift+L', action: () => setSection('locks')    },
    ]},
    { label: 'Agents', items: [
      { label: 'New Task', shortcut: 'Ctrl+T',       action: () => { if (selectedProject) setShowAddTask(true) } },
      { label: 'Sync',     shortcut: 'Ctrl+Shift+S', action: () => { if (mode === 'cloud') fetchCloudData() } },
    ]},
    { label: 'Help', items: [
      { label: 'Documentation', action: () => eAPI?.shellOpen(webUrl) },
    ]},
  ]

  const actBtn = (id: SidebarSection, icon: React.ReactNode, label: string) => (
    <button key={id} onClick={() => setSection(id)} title={label}
      style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, position: 'relative', cursor: 'pointer', border: 'none', background: section === id ? `${C.accent}15` : 'none', color: section === id ? C.accentLt : C.textMut, transition: 'all .15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.hover; (e.currentTarget as HTMLElement).style.color = C.text }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = section === id ? `${C.accent}15` : 'none'; (e.currentTarget as HTMLElement).style.color = section === id ? C.accentLt : C.textMut }}
    >
      {section === id && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2, height: 20, background: C.accent, borderRadius: '0 2px 2px 0', transition: 'height .15s' }} />}
      {icon}
    </button>
  )

  // Show WelcomeScreen on startup if no persisted session
  if (showWelcome) {
    return (
      <WelcomeScreen
        eAPI={eAPI}
        serverUrl={serverUrl}
        onLogin={handleWelcomeLogin}
        onOffline={() => { setShowWelcome(false); setMode('local') }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter',system-ui,sans-serif", fontSize: 13, overflow: 'hidden' }}>

      <TitleBar menus={MENUS} mode={mode} onToggleMode={() => setMode(m => m === 'cloud' ? 'local' : 'cloud')} eAPI={eAPI} syncing={syncing} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Activity Bar */}
        <div style={{ width: 44, background: C.bg, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6, paddingBottom: 8, gap: 2, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <img src="/logo.svg" alt="Hivora" style={{ width: 22, height: 22, borderRadius: 5 }} />
          </div>
          {actBtn('explorer', <FolderOpen size={17} />, 'Explorer (Ctrl+Shift+E)')}
          {actBtn('agents',   <Cpu        size={17} />, 'Agents (Ctrl+Shift+A)')}
          {actBtn('models',   <Layers     size={17} />, 'AI Models (Ctrl+Shift+M)')}
          {actBtn('locks',    <Lock       size={17} />, 'Locks (Ctrl+Shift+L)')}
          {actBtn('skills',   <Zap        size={17} />, 'Skills')}
          <div style={{ flex: 1 }} />
          <button onClick={() => setSection('settings')} title="Settings (Ctrl+,)"
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: section === 'settings' ? `${C.accent}15` : 'none', color: section === 'settings' ? C.accentLt : C.textMut, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.hover; (e.currentTarget as HTMLElement).style.color = C.text }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = section === 'settings' ? `${C.accent}15` : 'none'; (e.currentTarget as HTMLElement).style.color = section === 'settings' ? C.accentLt : C.textMut }}
          ><Settings size={16} /></button>
        </div>

        <Sidebar
          section={section}
          mode={mode}
          authed={authed}
          projects={projects}
          selectedProjectId={selectedProjectId}
          agents={agents}
          locks={locks}
          serverUrl={serverUrl}
          webUrl={webUrl}
          notifications={notifications}
          autoSync={autoSync}
          onSelectProject={setSelectedProjectId}
          onShowAddProject={() => setShowAddProject(true)}
          onShowWelcome={() => setShowWelcome(true)}
          onLogout={handleLogout}
          onServerUrlChange={setServerUrl}
          onWebUrlChange={setWebUrl}
          onToggleNotifications={() => setNotifications(v => !v)}
          onToggleAutoSync={() => setAutoSync(v => !v)}
          onOpenWebApp={() => eAPI?.shellOpen(webUrl)}
        />

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.bg }}>
          {/* Tab bar */}
          <div style={{ height: 36, display: 'flex', alignItems: 'flex-end', background: C.bg, borderBottom: `1px solid ${C.border}`, paddingLeft: 8, paddingRight: 8, gap: 2, flexShrink: 0 }}>
            {selectedProject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: '100%', background: C.surface, borderTop: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderRadius: '6px 6px 0 0', fontSize: 12, color: C.text, marginBottom: -1 }}>
                <GitBranch size={11} style={{ color: C.accentLt }} />
                {selectedProject.name}
                <span style={{ color: C.textMut, fontSize: 10, marginLeft: 4 }}>workspace</span>
              </div>
            )}
          </div>

          {/* Workspace */}
          {mode === 'cloud' && !authed ? (
            <EmptyState icon={<User size={28} />} title="Cloud Mode" desc="Sign in to Hivora Cloud under the Settings panel to access your online projects." action={() => setSection('settings')} actionLabel="Sign In" />
          ) : !selectedProject ? (
            <EmptyState icon={<Package size={28} />} title="Select or create a project" desc="Pick a project from the Explorer panel. Your AI agents will pick up tasks and work on them in real-time — coordinate Claude, Cursor, and Cline all from one place." action={() => setShowAddProject(true)} actionLabel="New Project" />
          ) : (
            <AgentWorkspace
              tasks={tasks}
              agents={agents}
              projectName={selectedProject.name}
              onAddTask={(title) => { if (title) { setNewTitle(title); setTimeout(() => handleAddTask(), 0) } else setShowAddTask(true) }}
              onMoveTask={(id, status) => handleTaskMove(id, status as TaskStatus)}
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ height: 26, background: C.statusBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0, userSelect: 'none', borderTop: '1px solid #0d1e38' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <div onClick={() => setSection('explorer')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, color: '#4a7ab5', fontSize: 10, cursor: 'pointer', transition: 'background .1s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
          ><GitBranch size={11} /> main</div>
          {activeAgents > 0 && (
            <div onClick={() => setSection('agents')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, color: '#4ade80', fontSize: 10, cursor: 'pointer', transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            ><Cpu size={11} /> {activeAgents} active</div>
          )}
          {locks.length > 0 && (
            <div onClick={() => setSection('locks')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, color: '#f59e0b', fontSize: 10, cursor: 'pointer', transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            ><Lock size={11} /> {locks.length} locks</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {mode === 'cloud' && authed && <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, color: '#4ade80', fontSize: 10 }}><Wifi size={11} /> Cloud Sync</div>}
          <div onClick={() => setSection('models')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, color: '#4a7ab5', fontSize: 10, cursor: 'pointer', transition: 'background .1s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
          ><Layers size={11} /> {agents.length > 0 ? `${agents.length} agents` : 'no agents'}</div>
          {notifications && <div style={{ padding: '2px 6px', borderRadius: 4, color: '#4a7ab5', cursor: 'pointer' }}><Bell size={11} /></div>}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, animation: 'backdropIn .15s ease' }} onClick={() => setShowAddTask(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.muted}`, borderRadius: 16, padding: 20, width: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'modalIn .15s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>New Task</span>
              <button onClick={() => setShowAddTask(false)} style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: C.textMut, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Title</label>
                <input ref={taskInputRef} value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} placeholder="Task title…"
                  style={{ width: '100%', background: C.bg, border: `1px solid ${C.muted}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'white', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = C.muted}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: C.textMut, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional…" rows={2}
                  style={{ width: '100%', background: C.bg, border: `1px solid ${C.muted}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'white', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s' }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = C.muted}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: C.textMut, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Priority</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button key={p} onClick={() => setNewPriority(p)}
                      style={{ flex: 1, padding: '6px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .1s', background: newPriority === p ? (p === 'high' ? '#ef444420' : p === 'medium' ? '#f59e0b20' : C.hover) : C.bg, color: newPriority === p ? (p === 'high' ? '#f87171' : p === 'medium' ? '#fbbf24' : C.textDim) : C.textMut, border: `1px solid ${newPriority === p ? (p === 'high' ? '#ef444450' : p === 'medium' ? '#f59e0b50' : C.muted) : C.border}` }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setShowAddTask(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: C.bg, color: C.textMut, border: `1px solid ${C.muted}`, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAddTask} disabled={!newTitle.trim()}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: newTitle.trim() ? C.accent : C.muted, color: 'white', border: 'none', cursor: newTitle.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .15s' }}
                  onMouseEnter={e => { if (newTitle.trim()) (e.currentTarget as HTMLElement).style.background = C.accentHov }}
                  onMouseLeave={e => { if (newTitle.trim()) (e.currentTarget as HTMLElement).style.background = C.accent }}
                ><Check size={12} /> Create Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, animation: 'backdropIn .15s ease' }} onClick={() => setShowAddProject(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.muted}`, borderRadius: 16, padding: 20, width: 360, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'modalIn .15s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>New Project</span>
              <button onClick={() => setShowAddProject(false)} style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: C.textMut, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Project Name</label>
                <input ref={projectInputRef} value={newProjectName} onChange={e => setNewProjectName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddProject()} placeholder="My project…"
                  style={{ width: '100%', background: C.bg, border: `1px solid ${C.muted}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'white', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = C.muted}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setShowAddProject(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: C.bg, color: C.textMut, border: `1px solid ${C.muted}`, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAddProject} disabled={!newProjectName.trim()}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: newProjectName.trim() ? C.accent : C.muted, color: 'white', border: 'none', cursor: newProjectName.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => { if (newProjectName.trim()) (e.currentTarget as HTMLElement).style.background = C.accentHov }}
                  onMouseLeave={e => { if (newProjectName.trim()) (e.currentTarget as HTMLElement).style.background = C.accent }}
                ><Check size={12} /> Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes backdropIn { from { opacity:0 } to { opacity:1 } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(6px) } to { opacity:1; transform:scale(1) translateY(0) } }
        .wbtn:hover { background: rgba(255,255,255,0.08) !important; color:#e2e8f0 !important; }
        .wbtn-close:hover { background: #c42b1c !important; color:white !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e3050; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #2563eb50; }
      `}</style>
    </div>
  )
}
