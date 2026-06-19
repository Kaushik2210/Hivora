import { useState, useEffect, useRef } from 'react'
import {
  Plus, FolderOpen, Lock, FileCode2, GitBranch,
  Circle, Clock, CheckCircle2, Settings, Cpu, RefreshCw,
  X, Check, Wifi, Layers, ChevronDown, Monitor, Key,
  Bell, User, ExternalLink, HardDrive, Server, Package,
} from 'lucide-react'

const C = {
  bg:        '#0d1117',
  surface:   '#0f1620',
  card:      '#111827',
  hover:     '#1a2235',
  border:    '#1a2235',
  border2:   '#1e2d45',
  muted:     '#1e3050',
  accent:    '#2563eb',
  accentHov: '#1d4ed8',
  accentLt:  '#60a5fa',
  statusBg:  '#0a1628',
  text:      '#e2e8f0',
  textMut:   '#6b7a99',
  textDim:   '#8899b4',
}

type TaskStatus      = 'todo' | 'in_progress' | 'done'
type Mode            = 'cloud' | 'local'
type SidebarSection  = 'explorer' | 'agents' | 'models' | 'locks' | 'settings'

interface Task     { id: string; title: string; description: string; status: TaskStatus; priority: 'high' | 'medium' | 'low'; assignedTo?: string }
interface Agent    { id: string; name: string; tool: string; logo: string; status: 'working' | 'idle' | 'error'; currentTask?: string; color: string }
interface FileLock { file: string; symbol: string; agentId: string }
interface AIModel  { id: string; name: string; provider: string; logo: string; status: 'connected' | 'available' | 'unavailable'; color: string }
interface Project  { id: string; name: string }

const SUPPORTED_MODELS: AIModel[] = [
  { id: 'm1', name: 'Claude Opus 4',   provider: 'Anthropic', logo: '/logos/claude.svg',         status: 'available', color: '#D97757' },
  { id: 'm2', name: 'Cursor Agent',    provider: 'Cursor',    logo: '/logos/cursor.svg',          status: 'available', color: '#3b82f6' },
  { id: 'm3', name: 'GitHub Copilot',  provider: 'GitHub',    logo: '/logos/github-copilot.svg',  status: 'available', color: '#2563EB' },
  { id: 'm4', name: 'Cline',           provider: 'Cline',     logo: '/logos/cline.svg',            status: 'available', color: '#22c55e' },
  { id: 'm5', name: 'Devin',           provider: 'Cognition', logo: '/logos/devin.svg',            status: 'available', color: '#f59e0b' },
]

const COLUMNS: { id: TaskStatus; label: string; dot: string }[] = [
  { id: 'todo',        label: 'To Do',       dot: C.textDim  },
  { id: 'in_progress', label: 'In Progress', dot: C.accentLt },
  { id: 'done',        label: 'Done',        dot: '#22c55e'  },
]

// Sample local mock data
const SAMPLE_PROJECTS: Project[] = [
  { id: 'p1', name: 'Hivora Core' },
  { id: 'p2', name: 'Web Dashboard' }
]

const SAMPLE_TASKS: Task[] = [
  { id: 't1', title: 'Implement symbol-level lock engine', description: 'Create lock acquisition and release endpoints with redis key expiration support.', status: 'in_progress', priority: 'high', assignedTo: 'a1' },
  { id: 't2', title: 'Design landing page hero section', description: 'Design modern gradient hero layout with float animations and responsive typography.', status: 'done', priority: 'medium', assignedTo: 'a2' },
  { id: 't3', title: 'Setup GitHub actions deployment', description: 'Configure CD workflow to push production docker images on release tag.', status: 'todo', priority: 'low', assignedTo: 'a3' },
  { id: 't4', title: 'Add unit tests for auth middleware', description: 'Cover token validation, refresh token rotation, and rate limiters.', status: 'todo', priority: 'medium' }
]

const SAMPLE_AGENTS: Agent[] = [
  { id: 'a1', name: 'Claude',   tool: 'Claude Code',   logo: '/logos/claude.svg',         status: 'working', currentTask: 'Refactoring auth module', color: '#D97757' },
  { id: 'a2', name: 'Cursor',   tool: 'Cursor Agent',  logo: '/logos/cursor.svg',          status: 'working', currentTask: 'Building dashboard UI',  color: '#8B5CF6' },
  { id: 'a3', name: 'Copilot',  tool: 'GitHub Copilot', logo: '/logos/github-copilot.svg', status: 'idle',    currentTask: 'Configuring CI pipeline', color: '#8957E5' },
]

const SAMPLE_LOCKS: FileLock[] = [
  { file: 'apps/api/src/routes/auth.ts',   symbol: 'loginUser',       agentId: 'a1' },
  { file: 'apps/web/app/dashboard/page.tsx', symbol: 'DashboardPage', agentId: 'a2' },
]

// ── Empty state helper ─────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc, action, actionLabel }: {
  icon: React.ReactNode; title: string; desc: string; action?: () => void; actionLabel?: string
}) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:32, textAlign:'center' }}>
      <div style={{ color: C.muted, opacity:.6 }}>{icon}</div>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color: C.textDim, margin:'0 0 4px' }}>{title}</p>
        <p style={{ fontSize:11, color: C.textMut, margin:0, lineHeight:1.6, maxWidth:220 }}>{desc}</p>
      </div>
      {action && actionLabel && (
        <button onClick={action} style={{ marginTop:4, fontSize:11, padding:'6px 14px', background: C.accent, color:'white', border:'none', borderRadius:6, cursor:'pointer' }}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────
export function App() {
  const [mode, setMode] = useState<Mode>('local')
  const [section, setSection] = useState<SidebarSection>('explorer')

  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('p1')
  const [tasks,  setTasks]  = useState<Task[]>(SAMPLE_TASKS)
  const [agents, setAgents] = useState<Agent[]>(SAMPLE_AGENTS)
  const [locks, setLocks]   = useState<FileLock[]>(SAMPLE_LOCKS)
  const [models]  = useState<AIModel[]>(SUPPORTED_MODELS)

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

  // Cloud Mode authentication state
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const taskInputRef    = useRef<HTMLInputElement>(null)
  const projectInputRef = useRef<HTMLInputElement>(null)

  const eAPI = (window as any).electronAPI

  // API request proxy helper with auth and token refresh
  const apiRequest = async <T,>(method: string, path: string, body?: unknown): Promise<T> => {
    let token = sessionStorage.getItem('hivora_access_token')
    let res = await eAPI?.apiRequest({ method, path, body, token })

    if (res && res.error && res.status === 401) {
      const refreshToken = sessionStorage.getItem('hivora_refresh_token')
      if (refreshToken) {
        const refreshRes = await eAPI?.apiRequest({
          method: 'POST',
          path: '/api/auth/refresh',
          body: { refreshToken }
        })
        if (refreshRes && !refreshRes.error) {
          sessionStorage.setItem('hivora_access_token', refreshRes.data.accessToken)
          sessionStorage.setItem('hivora_refresh_token', refreshRes.data.refreshToken)
          token = refreshRes.data.accessToken
          res = await eAPI?.apiRequest({ method, path, body, token })
        }
      }
    }

    if (!res || res.error) {
      throw new Error(res?.message || 'Request failed')
    }
    return res.data as T
  }

  // Fetch all cloud data
  const fetchCloudData = async (currentProjId?: string | null) => {
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
          apiRequest<any[]>('GET', `/api/projects/${projId}/locks`)
        ])
        
        // Map tasks 'doing' -> 'in_progress'
        setTasks(cloudTasks.map(t => ({
          ...t,
          status: t.status === 'doing' ? 'in_progress' : t.status,
          description: t.description || ''
        })))
        
        // Map agents status
        setAgents(cloudAgents.map(a => ({
          id: a.id,
          name: a.name,
          tool: a.type === 'ai' ? (a.provider || 'AI Agent') : 'Human Dev',
          logo: a.name.toLowerCase().includes('claude') ? '/logos/claude.svg' :
                a.name.toLowerCase().includes('cursor') ? '/logos/cursor.svg' :
                '/logos/github-copilot.svg',
          status: a.status === 'working' ? 'working' : 'idle',
          currentTask: a.currentTask || undefined,
          color: a.name.toLowerCase().includes('claude') ? '#D97757' : '#8B5CF6'
        })))

        // Map locks
        setLocks(cloudLocks.map(l => ({
          file: l.file,
          symbol: l.symbol,
          agentId: l.agentId
        })))
      }
    } catch (err) {
      console.error('Failed to fetch cloud data', err)
    }
  }

  // Toggling between Cloud and Local Modes
  useEffect(() => {
    if (mode === 'local') {
      setProjects(SAMPLE_PROJECTS)
      setSelectedProjectId('p1')
      setTasks(SAMPLE_TASKS)
      setAgents(SAMPLE_AGENTS)
      setLocks(SAMPLE_LOCKS)
      setAuthed(false)
      setAuthError(null)
    } else {
      const token = sessionStorage.getItem('hivora_access_token')
      if (token) {
        setAuthed(true)
        fetchCloudData()
      } else {
        setAuthed(false)
        setProjects([])
        setTasks([])
        setAgents([])
        setLocks([])
      }
    }
  }, [mode])

  // Fetch when selected project changes in cloud mode
  useEffect(() => {
    if (mode === 'cloud' && authed && selectedProjectId) {
      fetchCloudData(selectedProjectId)
    }
  }, [selectedProjectId, authed])

  useEffect(() => {
    if (showAddTask)    setTimeout(() => taskInputRef.current?.focus(),    50)
  }, [showAddTask])
  
  useEffect(() => {
    if (showAddProject) setTimeout(() => projectInputRef.current?.focus(), 50)
  }, [showAddProject])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setAuthLoading(true)
    setAuthError(null)

    try {
      const res = await eAPI?.apiRequest({
        method: 'POST',
        path: '/api/auth/login',
        body: { email: email.trim(), password: password.trim() }
      })

      if (!res || res.error) {
        setAuthError(res?.message || 'Authentication failed')
        return
      }

      sessionStorage.setItem('hivora_access_token', res.data.accessToken)
      sessionStorage.setItem('hivora_refresh_token', res.data.refreshToken)
      setAuthed(true)
      setEmail('')
      setPassword('')
      fetchCloudData()
    } catch (err) {
      setAuthError(String(err))
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('hivora_access_token')
    sessionStorage.removeItem('hivora_refresh_token')
    setAuthed(false)
    setProjects([])
    setTasks([])
    setAgents([])
    setLocks([])
  }

  const handleAddTask = async () => {
    if (!newTitle.trim() || !selectedProjectId) return
    
    if (mode === 'local') {
      setTasks(prev => [...prev, { id: Date.now().toString(), title: newTitle.trim(), description: newDesc.trim(), status: 'todo', priority: newPriority }])
    } else {
      try {
        await apiRequest('POST', `/api/projects/${selectedProjectId}/tasks`, {
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          priority: newPriority,
          status: 'todo'
        })
        await fetchCloudData(selectedProjectId)
      } catch (err) {
        console.error('Failed to create cloud task', err)
      }
    }
    setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setShowAddTask(false)
  }

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return
    
    if (mode === 'local') {
      const proj: Project = { id: Date.now().toString(), name: newProjectName.trim() }
      setProjects(prev => [...prev, proj])
      setSelectedProjectId(proj.id)
    } else {
      try {
        const orgs = await apiRequest<any[]>('GET', '/api/organizations')
        if (orgs.length > 0) {
          const newProj = await apiRequest<any>('POST', `/api/organizations/${orgs[0].id}/projects`, {
            name: newProjectName.trim(),
            description: 'Created from Desktop Client'
          })
          setProjects(prev => [...prev, newProj])
          setSelectedProjectId(newProj.id)
        }
      } catch (err) {
        console.error('Failed to create cloud project', err)
      }
    }
    setNewProjectName(''); setShowAddProject(false)
    setSection('explorer')
  }

  const handleTaskMove = async (id: string, status: TaskStatus) => {
    if (mode === 'local') {
      setTasks(t => t.map(task => task.id === id ? { ...task, status } : task))
    } else {
      try {
        const dbStatus = status === 'in_progress' ? 'doing' : status
        await apiRequest('PATCH', `/api/projects/${selectedProjectId}/tasks/${id}`, {
          status: dbStatus
        })
        await fetchCloudData(selectedProjectId)
      } catch (err) {
        console.error('Failed to update cloud task status', err)
      }
    }
  }

  const selectedProject  = projects.find(p => p.id === selectedProjectId)
  const projectTasks     = tasks.filter(() => true) // all tasks belong to current project
  const activeAgents     = agents.filter(a => a.status === 'working').length
  const connectedModels  = models.filter(m => m.status === 'connected').length

  const MENUS = [
    { label: 'File', items: [
      { label: 'New Project', shortcut: 'Ctrl+N', action: () => setShowAddProject(true) },
      { label: 'New Task',    shortcut: 'Ctrl+T', action: () => { if (selectedProject) setShowAddTask(true) } },
      null,
      { label: 'Settings',   shortcut: 'Ctrl+,', action: () => setSection('settings') },
      null,
      { label: 'Quit',       shortcut: 'Alt+F4', action: () => eAPI?.windowClose() },
    ]},
    { label: 'View', items: [
      { label: 'Explorer',  shortcut: 'Ctrl+Shift+E', action: () => setSection('explorer') },
      { label: 'Agents',    shortcut: 'Ctrl+Shift+A', action: () => setSection('agents')   },
      { label: 'AI Models', shortcut: 'Ctrl+Shift+M', action: () => setSection('models')   },
      { label: 'Locks',     shortcut: 'Ctrl+Shift+L', action: () => setSection('locks')    },
    ]},
    { label: 'Agents', items: [
      { label: 'New Task', shortcut: 'Ctrl+T', action: () => { if (selectedProject) setShowAddTask(true) } },
      { label: 'Sync',     shortcut: 'Ctrl+Shift+S', action: () => { if (mode === 'cloud') fetchCloudData() } },
    ]},
    { label: 'Help', items: [
      { label: 'Documentation', action: () => eAPI?.shellOpen('http://localhost:3000') },
    ]},
  ]

  // ── Sidebar icon ──────────────────────────────────────────────────────────────
  const actBtn = (id: SidebarSection, icon: React.ReactNode, label: string) => (
    <button key={id} onClick={() => setSection(id)} title={label}
      style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center',
        borderRadius:8, position:'relative', cursor:'pointer', border:'none', background:'none',
        color: section === id ? C.text : C.textMut, transition:'color .15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.hover; (e.currentTarget as HTMLElement).style.color = C.text }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = section===id ? C.text : C.textMut }}
    >
      {section === id && <span style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:2, height:20, background: C.accent, borderRadius:'0 2px 2px 0' }} />}
      {icon}
    </button>
  )

  const handleToggleMode = () => {
    setMode(m => m === 'cloud' ? 'local' : 'cloud')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background: C.bg, color: C.text, fontFamily:"'Inter',system-ui,sans-serif", fontSize:13, overflow:'hidden' }}>

      {/* Title Bar */}
      <TitleBar menus={MENUS} mode={mode} onToggleMode={handleToggleMode} eAPI={eAPI} />

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Activity Bar */}
        <div style={{ width:44, background: C.bg, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', alignItems:'center', paddingTop:6, paddingBottom:8, gap:2, flexShrink:0 }}>
          <div style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 }}>
            <span style={{ fontSize:20, fontWeight:'bold', color:C.accentLt }}>⚡</span>
          </div>
          {actBtn('explorer', <FolderOpen size={17} />, 'Explorer')}
          {actBtn('agents',   <Cpu        size={17} />, 'Agents')}
          {actBtn('models',   <Layers     size={17} />, 'AI Models')}
          {actBtn('locks',    <Lock       size={17} />, 'Locks')}
          <div style={{ flex:1 }} />
          <button onClick={() => setSection('settings')} title="Settings"
            style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'none', background:'none', color: section==='settings' ? C.text : C.textMut, cursor:'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.hover; (e.currentTarget as HTMLElement).style.color = C.text }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = section==='settings' ? C.text : C.textMut }}
          ><Settings size={16} /></button>
        </div>

        {/* Sidebar */}
        <div style={{ width:220, background: C.surface, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden' }}>
          <div style={{ padding:'7px 12px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:600, color: C.textMut, textTransform:'uppercase', letterSpacing:'0.1em' }}>
              {section==='explorer'?'Explorer':section==='agents'?'Agents':section==='models'?'AI Models':section==='locks'?'Locks':'Settings'}
            </span>
            {section === 'explorer' && (
              <button onClick={() => setShowAddProject(true)} title="New Project"
                style={{ background:'none', border:'none', color: C.textMut, cursor:'pointer', padding:2, borderRadius:4, display:'flex' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMut}
              ><Plus size={13} /></button>
            )}
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>

            {/* Explorer */}
            {section === 'explorer' && (
              projects.length === 0
                ? <EmptyState icon={<FolderOpen size={28}/>} title="No projects yet" desc={mode === 'cloud' && !authed ? "Please log in to Cloud Mode under Settings." : "Create your first project to get started."} action={mode === 'local' || authed ? () => setShowAddProject(true) : undefined} actionLabel="New Project" />
                : <div style={{ paddingTop:4 }}>
                    <div style={{ padding:'4px 12px 4px', display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, color: C.textMut, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                      <ChevronDown size={11} /> Projects
                    </div>
                    {projects.map(proj => (
                      <button key={proj.id} onClick={() => setSelectedProjectId(proj.id)}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:8,
                          paddingLeft: selectedProjectId===proj.id ? 20 : 22, paddingRight:12, paddingTop:6, paddingBottom:6,
                          textAlign:'left', cursor:'pointer', border:'none',
                          background: selectedProjectId===proj.id ? `${C.accent}18` : 'none',
                          borderLeft: `2px solid ${selectedProjectId===proj.id ? C.accent : 'transparent'}`,
                          color: selectedProjectId===proj.id ? C.text : C.textDim, transition:'background .1s' }}
                        onMouseEnter={e => { if (selectedProjectId!==proj.id) (e.currentTarget as HTMLElement).style.background=C.hover }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=selectedProjectId===proj.id?`${C.accent}18`:'none' }}
                      >
                        <FolderOpen size={13} style={{ color: selectedProjectId===proj.id ? C.accentLt : C.textMut, flexShrink:0 }} />
                        <span style={{ fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{proj.name}</span>
                      </button>
                    ))}
                  </div>
            )}

            {/* Agents */}
            {section === 'agents' && (
              agents.length === 0
                ? <EmptyState icon={<Cpu size={28}/>} title="No agents connected" desc="Connect an AI agent to start coordinating tasks." />
                : <div style={{ paddingTop:8 }}>
                    {agents.map(agent => (
                      <div key={agent.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', cursor:'default' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=C.hover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='none'}
                      >
                        <div style={{ position:'relative', flexShrink:0 }}>
                          <img src={agent.logo} alt={agent.name} style={{ width:28, height:28, borderRadius:6 }}
                            onError={e => { const el=e.currentTarget as HTMLImageElement; el.style.display='none'; const fb=el.nextElementSibling as HTMLElement; if(fb) fb.style.display='flex' }} />
                          <div style={{ width:28, height:28, borderRadius:6, display:'none', alignItems:'center', justifyContent:'center', background:agent.color, color:'white', fontSize:11, fontWeight:700 }}>{agent.name[0]}</div>
                          <span style={{ position:'absolute', bottom:-2, right:-2, width:10, height:10, borderRadius:'50%', border:`2px solid ${C.surface}`, background: agent.status==='working'?'#22c55e':agent.status==='error'?'#ef4444':C.textMut }} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                            <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{agent.name}</span>
                            <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, fontWeight:600, background:agent.status==='working'?'#22c55e20':'#ef444420', color:agent.status==='working'?'#4ade80':'#f87171' }}>{agent.status}</span>
                          </div>
                          <p style={{ fontSize:10, color:C.textMut, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0 }}>{agent.currentTask??agent.tool}</p>
                        </div>
                      </div>
                    ))}
                  </div>
            )}

            {/* AI Models */}
            {section === 'models' && (
              <div style={{ paddingTop:8, paddingBottom:8 }}>
                <p style={{ fontSize:10, color:C.textMut, margin:'0 0 6px', padding:'0 12px' }}>
                  {connectedModels > 0 ? `${connectedModels} connected` : 'Supported platforms'}
                </p>
                {models.map(model => (
                  <div key={model.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 12px', cursor:'default' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=C.hover}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='none'}
                  >
                    <img src={model.logo} alt={model.name} style={{ width:22, height:22, borderRadius:5, flexShrink:0 }}
                      onError={e => { const el=e.currentTarget as HTMLImageElement; el.style.display='none'; const fb=el.nextElementSibling as HTMLElement; if(fb) fb.style.display='flex' }} />
                    <div style={{ width:22, height:22, borderRadius:5, display:'none', alignItems:'center', justifyContent:'center', background:model.color, color:'white', fontSize:9, fontWeight:700, flexShrink:0 }}>{model.name[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:11, color:C.text, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{model.name}</span>
                      <span style={{ fontSize:10, color:C.textMut }}>{model.provider}</span>
                    </div>
                    <span style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: model.status==='connected'?'#22c55e':model.status==='available'?C.muted:C.muted }} />
                  </div>
                ))}
              </div>
            )}

            {/* Locks */}
            {section === 'locks' && (
              locks.length === 0
                ? <EmptyState icon={<Lock size={28}/>} title="No active locks" desc="Symbol locks appear here when agents are editing files." />
                : <div style={{ paddingTop:8 }}>
                    {locks.map((lock, i) => {
                      const agent = agents.find(a => a.id === lock.agentId)
                      return (
                        <div key={i} style={{ padding:'10px 12px 10px 10px', borderLeft:'2px solid transparent', marginLeft:1, transition:'border-color .1s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderLeftColor=`${C.accent}60`; (e.currentTarget as HTMLElement).style.background=C.hover }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderLeftColor='transparent'; (e.currentTarget as HTMLElement).style.background='none' }}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                            <Lock size={10} style={{ color:C.accent, flexShrink:0 }} />
                            <span style={{ fontSize:11, fontFamily:'monospace', color:C.accentLt, fontWeight:600 }}>{lock.symbol}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:5, paddingLeft:16, marginBottom:2 }}>
                            <FileCode2 size={9} style={{ color:C.textMut }} />
                            <span style={{ fontSize:10, color:C.textMut }}>{lock.file}</span>
                          </div>
                          {agent && (
                            <div style={{ display:'flex', alignItems:'center', gap:5, paddingLeft:16 }}>
                              <img src={agent.logo} style={{ width:12, height:12, borderRadius:3 }} alt={agent.name} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }} />
                              <span style={{ fontSize:10, color:C.textMut }}>by {agent.name}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
            )}

            {/* Settings */}
            {section === 'settings' && (
              <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:20 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                    <Server size={11} style={{ color:C.textMut }} />
                    <span style={{ fontSize:10, fontWeight:600, color:C.textMut, textTransform:'uppercase', letterSpacing:'0.08em' }}>Connection</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {[['API Server', serverUrl, setServerUrl], ['Web App URL', webUrl, setWebUrl]].map(([lbl, val, setter]) => (
                      <div key={lbl as string}>
                        <label style={{ fontSize:10, color:C.textMut, display:'block', marginBottom:4 }}>{lbl as string}</label>
                        <input value={val as string} onChange={e => (setter as (v:string)=>void)(e.target.value)}
                           style={{ width:'100%', background:C.card, border:`1px solid ${C.muted}`, borderRadius:6, padding:'4px 8px', fontSize:11, color:C.text, outline:'none', boxSizing:'border-box' }}
                           onFocus={e => (e.currentTarget as HTMLElement).style.borderColor=C.accent}
                           onBlur={e => (e.currentTarget as HTMLElement).style.borderColor=C.muted}
                        />
                      </div>
                    ))}
                    <button onClick={() => eAPI?.shellOpen(webUrl)} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:C.accentLt, background:'none', border:'none', cursor:'pointer', padding:0 }}>
                      <ExternalLink size={10} /> Open Web App
                    </button>
                  </div>
                </div>
                
                {/* Cloud Mode Auth Form */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                    <User size={11} style={{ color:C.textMut }} />
                    <span style={{ fontSize:10, fontWeight:600, color:C.textMut, textTransform:'uppercase', letterSpacing:'0.08em' }}>Cloud Account</span>
                  </div>
                  {authed ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <div style={{ background:C.card, border:`1px solid ${C.muted}`, borderRadius:6, padding:'8px 10px', fontSize:11, color:C.accentLt }}>
                        ✓ Connected to Hivora Cloud
                      </div>
                      <button onClick={handleLogout} style={{ width:'100%', background:C.hover, color:C.textDim, border:`1px solid ${C.muted}`, borderRadius:6, padding:'5px', fontSize:11, cursor:'pointer' }}>
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <div>
                        <label style={{ fontSize:10, color:C.textMut, display:'block', marginBottom:3 }}>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@domain.com"
                          style={{ width:'100%', background:C.card, border:`1px solid ${C.muted}`, borderRadius:6, padding:'4px 8px', fontSize:11, color:C.text, outline:'none', boxSizing:'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:C.textMut, display:'block', marginBottom:3 }}>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                          style={{ width:'100%', background:C.card, border:`1px solid ${C.muted}`, borderRadius:6, padding:'4px 8px', fontSize:11, color:C.text, outline:'none', boxSizing:'border-box' }} />
                      </div>
                      {authError && (
                        <p style={{ color:'#ef4444', fontSize:10, margin:0 }}>{authError}</p>
                      )}
                      <button type="submit" disabled={authLoading}
                        style={{ width:'100%', background:C.accent, color:'white', border:'none', borderRadius:6, padding:'6px', fontSize:11, cursor: authLoading ? 'not-allowed' : 'pointer', fontWeight:600 }}>
                        {authLoading ? 'Signing In...' : 'Sign In'}
                      </button>
                    </form>
                  )}
                </div>

                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                    <Key size={11} style={{ color:C.textMut }} />
                    <span style={{ fontSize:10, fontWeight:600, color:C.textMut, textTransform:'uppercase', letterSpacing:'0.08em' }}>AI Providers</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {[{name:'Anthropic',logo:'/logos/claude.svg'},{name:'GitHub',logo:'/logos/github-copilot.svg'},{name:'Cursor',logo:'/logos/cursor.svg'}].map(p => (
                      <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, background:C.card, border:`1px solid ${C.muted}`, borderRadius:6, padding:'6px 8px' }}>
                        <img src={p.logo} style={{ width:16, height:16, borderRadius:4 }} alt={p.name} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }} />
                        <span style={{ fontSize:11, color:C.textDim, flex:1 }}>{p.name}</span>
                        <span style={{ fontSize:9, color:C.textMut }}>Configure →</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                    <Monitor size={11} style={{ color:C.textMut }} />
                    <span style={{ fontSize:10, fontWeight:600, color:C.textMut, textTransform:'uppercase', letterSpacing:'0.08em' }}>Preferences</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[{label:'Notifications',value:notifications,toggle:()=>setNotifications(v=>!v),Icon:Bell},{label:'Auto Sync',value:autoSync,toggle:()=>setAutoSync(v=>!v),Icon:RefreshCw}].map(({label,value,toggle,Icon})=>(
                      <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <Icon size={11} style={{ color:C.textMut }} />
                          <span style={{ fontSize:11, color:C.textDim }}>{label}</span>
                        </div>
                        <button onClick={toggle} style={{ width:32, height:16, borderRadius:99, border:'none', cursor:'pointer', position:'relative', transition:'background .2s', background:value?C.accent:C.muted }}>
                          <span style={{ position:'absolute', top:2, width:12, height:12, borderRadius:'50%', background:'white', boxShadow:'0 1px 3px #0006', transition:'transform .2s', transform:value?'translateX(18px)':'translateX(2px)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main area */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:C.bg }}>

          {/* Tab bar */}
          <div style={{ height:36, display:'flex', alignItems:'flex-end', background:C.bg, borderBottom:`1px solid ${C.border}`, paddingLeft:8, paddingRight:8, gap:2, flexShrink:0 }}>
            {selectedProject && (
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 12px', height:'100%', background:C.surface, borderTop:`1px solid ${C.border}`, borderLeft:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}`, borderRadius:'6px 6px 0 0', fontSize:12, color:C.text, marginBottom:-1 }}>
                <GitBranch size={11} style={{ color:C.accentLt }} />
                {selectedProject.name}
                <span style={{ color:C.textMut, fontSize:10, marginLeft:4 }}>board</span>
              </div>
            )}
          </div>

          {/* Board */}
          {mode === 'cloud' && !authed ? (
            <EmptyState
              icon={<User size={36} />}
              title="Cloud Mode Auth Required"
              desc="Please sign in to Hivora Cloud under the Settings panel to access your online projects."
              action={() => setSection('settings')}
              actionLabel="Sign In Now"
            />
          ) : !selectedProject ? (
            <EmptyState
              icon={<Package size={36} />}
              title="No project selected"
              desc="Create or select a project from the Explorer panel to view its task board."
              action={() => setShowAddProject(true)}
              actionLabel="Create Project"
            />
          ) : (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ padding:'12px 20px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                <div>
                  <h2 style={{ fontSize:13, fontWeight:600, color:'white', margin:0 }}>{selectedProject.name}</h2>
                  <p style={{ fontSize:10, color:C.textMut, margin:'3px 0 0' }}>{projectTasks.length} tasks{activeAgents>0?` · ${activeAgents} agents working`:''}</p>
                </div>
                <div style={{ marginLeft:'auto' }}>
                  <button onClick={() => setShowAddTask(true)}
                    style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, background:C.accent, color:'white', border:'none', padding:'6px 12px', borderRadius:8, cursor:'pointer', fontWeight:500, transition:'background .15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=C.accentHov}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=C.accent}
                  ><Plus size={12} /> Add Task</button>
                </div>
              </div>

              {projectTasks.length === 0 ? (
                <EmptyState icon={<CheckCircle2 size={28}/>} title="No tasks yet" desc="Add your first task to start tracking work." action={() => setShowAddTask(true)} actionLabel="Add Task" />
              ) : (
                <div style={{ flex:1, overflowX:'auto', padding:20 }}>
                  <div style={{ display:'flex', gap:16, height:'100%', minWidth:'max-content' }}>
                    {COLUMNS.map(col => {
                      const colTasks = projectTasks.filter(t => t.status === col.id)
                      return (
                        <div key={col.id} style={{ width:280, display:'flex', flexDirection:'column', flexShrink:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'0 4px' }}>
                            <span style={{ width:7, height:7, borderRadius:'50%', background:col.dot }} />
                            <span style={{ fontSize:12, fontWeight:600, color:C.textDim }}>{col.label}</span>
                            <span style={{ marginLeft:'auto', fontSize:10, color:C.textMut, background:C.hover, padding:'1px 6px', borderRadius:99 }}>{colTasks.length}</span>
                          </div>
                          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, overflowY:'auto', paddingRight:4 }}>
                            {colTasks.map(task => (
                              <div key={task.id} className="task-card"
                                style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:12, padding:12, cursor:'pointer', transition:'border-color .15s' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor=`${C.accent}50`}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor=C.border2}
                              >
                                <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                                  {col.id==='todo'        && <Circle       size={12} style={{ color:C.textMut,  flexShrink:0, marginTop:1 }} />}
                                  {col.id==='in_progress' && <Clock        size={12} style={{ color:C.accentLt, flexShrink:0, marginTop:1 }} />}
                                  {col.id==='done'        && <CheckCircle2 size={12} style={{ color:'#22c55e',  flexShrink:0, marginTop:1 }} />}
                                  <span style={{ fontSize:12, fontWeight:500, lineHeight:1.4, flex:1, color:col.id==='done'?C.textMut:C.text, textDecoration:col.id==='done'?'line-through':'none' }}>{task.title}</span>
                                </div>
                                {task.description && <p style={{ fontSize:10, color:C.textMut, lineHeight:1.5, margin:'0 0 8px', paddingLeft:20 }}>{task.description}</p>}
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingLeft:20 }}>
                                  <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, fontWeight:600,
                                    background:task.priority==='high'?'#ef444420':task.priority==='medium'?'#f59e0b20':C.hover,
                                    color:task.priority==='high'?'#f87171':task.priority==='medium'?'#fbbf24':C.textMut }}>
                                    {task.priority}
                                  </span>
                                  {col.id !== 'done' && (
                                    <button className="move-btn"
                                      onClick={ev => { ev.stopPropagation(); handleTaskMove(task.id, col.id==='todo'?'in_progress':'done') }}
                                      style={{ fontSize:9, color:C.accentLt, background:`${C.accent}18`, border:'none', padding:'2px 6px', borderRadius:4, cursor:'pointer', opacity:0, transition:'all .15s' }}
                                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=`${C.accent}40`}
                                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=`${C.accent}18`}
                                    >{col.id==='todo'?'Start':'Done'} →</button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {colTasks.length === 0 && (
                              <div style={{ border:`1px dashed ${C.border2}`, borderRadius:12, padding:16, textAlign:'center' }}>
                                <p style={{ fontSize:10, color:C.muted, margin:0 }}>Empty</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ height:26, background:C.statusBg, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', flexShrink:0, userSelect:'none', borderTop:`1px solid #0d1e38` }}>
        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          {[
            { icon:<GitBranch size={11}/>, label:'main' },
            ...(activeAgents>0?[{ icon:<Cpu size={11}/>, label:`${activeAgents} active` }]:[]),
            ...(locks.length>0?[{ icon:<Lock size={11}/>, label:`${locks.length} locks` }]:[]),
          ].map(({ icon, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:4, color:'#4a7ab5', fontSize:10, cursor:'pointer', transition:'background .1s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='none'}
            >{icon} {label}</div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          {mode==='cloud' && authed && <div style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:4, color:'#4ade80', fontSize:10 }}><Wifi size={11}/> Cloud Sync Active</div>}
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:4, color:'#4a7ab5', fontSize:10 }}><Layers size={11}/> {models.length} platforms</div>
          {notifications && <div style={{ padding:'2px 6px', borderRadius:4, color:'#4a7ab5', cursor:'pointer' }}><Bell size={11}/></div>}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyLines:'center', zIndex:50 } as any} onClick={() => setShowAddTask(false)}>
          <div style={{ background:C.card, border:`1px solid ${C.muted}`, borderRadius:16, padding:20, width:380, margin:'auto', boxShadow:'0 24px 64px #000a' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 } as any}>
              <span style={{ fontSize:13, fontWeight:600, color:'white' }}>New Task</span>
              <button onClick={() => setShowAddTask(false)} style={{ background:'none', border:'none', color:C.textMut, cursor:'pointer', padding:2 }}><X size={14}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:10, color:C.textMut, display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Title</label>
                <input ref={taskInputRef} value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key==='Enter' && handleAddTask()} placeholder="Task title..."
                  style={{ width:'100%', background:C.bg, border:`1px solid ${C.muted}`, borderRadius:8, padding:'8px 12px', fontSize:13, color:'white', outline:'none', boxSizing:'border-box' }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor=C.accent}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor=C.muted}
                />
              </div>
              <div>
                <label style={{ fontSize:10, color:C.textMut, display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional..." rows={2}
                  style={{ width:'100%', background:C.bg, border:`1px solid ${C.muted}`, borderRadius:8, padding:'8px 12px', fontSize:13, color:'white', outline:'none', resize:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor=C.accent}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor=C.muted}
                />
              </div>
              <div>
                <label style={{ fontSize:10, color:C.textMut, display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Priority</label>
                <div style={{ display:'flex', gap:8 }}>
                  {(['low','medium','high'] as const).map(p => (
                    <button key={p} onClick={() => setNewPriority(p)}
                      style={{ flex:1, padding:'6px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', transition:'all .1s',
                        background:newPriority===p?(p==='high'?'#ef444420':p==='medium'?'#f59e0b20':C.hover):C.bg,
                        color:newPriority===p?(p==='high'?'#f87171':p==='medium'?'#fbbf24':C.textDim):C.textMut,
                        border:`1px solid ${newPriority===p?(p==='high'?'#ef444450':p==='medium'?'#f59e0b50':C.muted):C.border}` }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <button onClick={() => setShowAddTask(false)} style={{ flex:1, padding:'8px', borderRadius:8, fontSize:12, fontWeight:500, background:C.bg, color:C.textMut, border:`1px solid ${C.muted}`, cursor:'pointer' }}>Cancel</button>
                <button onClick={handleAddTask} disabled={!newTitle.trim()}
                  style={{ flex:1, padding:'8px', borderRadius:8, fontSize:12, fontWeight:500, background:newTitle.trim()?C.accent:C.muted, color:'white', border:'none', cursor:newTitle.trim()?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'background .15s' }}
                  onMouseEnter={e => { if(newTitle.trim()) (e.currentTarget as HTMLElement).style.background=C.accentHov }}
                  onMouseLeave={e => { if(newTitle.trim()) (e.currentTarget as HTMLElement).style.background=C.accent }}
                ><Check size={12}/> Create Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyLines:'center', zIndex:50 } as any} onClick={() => setShowAddProject(false)}>
          <div style={{ background:C.card, border:`1px solid ${C.muted}`, borderRadius:16, padding:20, width:360, margin:'auto', boxShadow:'0 24px 64px #000a' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 } as any}>
              <span style={{ fontSize:13, fontWeight:600, color:'white' }}>New Project</span>
              <button onClick={() => setShowAddProject(false)} style={{ background:'none', border:'none', color:C.textMut, cursor:'pointer', padding:2 }}><X size={14}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:10, color:C.textMut, display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Project Name</label>
                <input ref={projectInputRef} value={newProjectName} onChange={e => setNewProjectName(e.target.value)} onKeyDown={e => e.key==='Enter' && handleAddProject()} placeholder="My project..."
                  style={{ width:'100%', background:C.bg, border:`1px solid ${C.muted}`, borderRadius:8, padding:'8px 12px', fontSize:13, color:'white', outline:'none', boxSizing:'border-box' }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor=C.accent}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor=C.muted}
                />
              </div>
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <button onClick={() => setShowAddProject(false)} style={{ flex:1, padding:'8px', borderRadius:8, fontSize:12, fontWeight:500, background:C.bg, color:C.textMut, border:`1px solid ${C.muted}`, cursor:'pointer' }}>Cancel</button>
                <button onClick={handleAddProject} disabled={!newProjectName.trim()}
                  style={{ flex:1, padding:'8px', borderRadius:8, fontSize:12, fontWeight:500, background:newProjectName.trim()?C.accent:C.muted, color:'white', border:'none', cursor:newProjectName.trim()?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                  onMouseEnter={e => { if(newProjectName.trim()) (e.currentTarget as HTMLElement).style.background=C.accentHov }}
                  onMouseLeave={e => { if(newProjectName.trim()) (e.currentTarget as HTMLElement).style.background=C.accent }}
                ><Check size={12}/> Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .task-card:hover .move-btn { opacity: 1 !important; }
        .menu-item:hover { background: #1a2235 !important; }
        .menu-dd { animation: fdDown .1s ease; }
        @keyframes fdDown { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }
        .wbtn:hover { background: rgba(255,255,255,0.08) !important; }
        .wbtn-close:hover { background: #c42b1c !important; color: white !important; }
      `}</style>
    </div>
  )
}

// ── Title Bar ──────────────────────────────────────────────────────────────────
type MenuItem = { label: string; shortcut?: string; action: () => void } | null
type MenuDef  = { label: string; items: MenuItem[] }

function TitleBar({ menus, mode, onToggleMode, eAPI }: { menus: MenuDef[]; mode: string; onToggleMode: () => void; eAPI: any }) {
  const [open, setOpen] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={{ height:36, display:'flex', alignItems:'center', background:'#060a10', borderBottom:'1px solid #0d1828', flexShrink:0, userSelect:'none', zIndex:100 }}>
      {/* Logo + title — draggable */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 10px', height:'100%', WebkitAppRegion:'drag' } as any}>
        <span style={{ fontSize:16, fontWeight:'bold', color:C.accentLt }}>⚡</span>
        <span style={{ fontSize:12, fontWeight:600, color:'#a0b4cc', letterSpacing:'0.03em' }}>Hivora</span>
      </div>

      {/* Menu */}
      <div ref={ref} style={{ display:'flex', alignItems:'center', height:'100%', WebkitAppRegion:'no-drag' } as any}>
        {menus.map(menu => (
          <div key={menu.label} style={{ position:'relative' }}>
            <button
              onMouseDown={e => { e.preventDefault(); setOpen(o => o === menu.label ? null : menu.label) }}
              style={{ height:36, padding:'0 10px', background: open===menu.label ? '#1a2235' : 'none', border:'none',
                color: open===menu.label ? '#e2e8f0' : '#6b7a99', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', transition:'all .1s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='#e2e8f0'; if(!open) (e.currentTarget as HTMLElement).style.background='#131c2a' }}
              onMouseLeave={e => { if(open!==menu.label) { (e.currentTarget as HTMLElement).style.color='#6b7a99'; (e.currentTarget as HTMLElement).style.background='none' } }}
            >{menu.label}</button>

            {open === menu.label && (
              <div className="menu-dd" style={{ position:'absolute', top:'100%', left:0, background:'#0c1420', border:'1px solid #1a2d45', borderRadius:6, boxShadow:'0 8px 32px #000e', minWidth:220, paddingTop:4, paddingBottom:4, zIndex:999 }}>
                {menu.items.map((item, i) =>
                  item === null
                    ? <div key={i} style={{ height:1, background:'#1a2235', margin:'3px 0' }} />
                    : <button key={i} className="menu-item"
                        onMouseDown={e => { e.preventDefault(); item.action(); setOpen(null) }}
                        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 12px', background:'none', border:'none', color:'#c8d6e8', fontSize:12, cursor:'pointer', textAlign:'left', transition:'background .1s' } as any}
                      >
                        <span>{item.label}</span>
                        {item.shortcut && <span style={{ fontSize:10, color:'#3a4f6a', marginLeft:24 }}>{item.shortcut}</span>}
                      </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drag fill */}
      <div style={{ flex:1, height:'100%', WebkitAppRegion:'drag' } as any} />

      {/* Mode pill */}
      <div style={{ WebkitAppRegion:'no-drag', marginRight:8 } as any}>
        <button onClick={onToggleMode} style={{
          display:'flex', alignItems:'center', gap:4, fontSize:10, padding:'3px 8px',
          background: mode === 'cloud' ? '#2563eb18' : '#1e293b',
          border: `1px solid ${mode === 'cloud' ? '#2563eb50' : '#334155'}`,
          borderRadius:99, color: mode === 'cloud' ? '#60a5fa' : '#94a3b8', cursor:'pointer'
        }}>
          {mode === 'cloud' ? <Server size={10} /> : <HardDrive size={10} />}
          {mode === 'cloud' ? 'Cloud Mode' : 'Local Mode'}
        </button>
      </div>

      {/* Window controls */}
      <div style={{ display:'flex', alignItems:'center', height:'100%', WebkitAppRegion:'no-drag' } as any}>
        {[
          { symbol:'─', title:'Minimize', action:()=>eAPI?.windowMinimize(), cls:'wbtn'       },
          { symbol:'□', title:'Maximize', action:()=>eAPI?.windowMaximize(), cls:'wbtn'       },
          { symbol:'✕', title:'Close',    action:()=>eAPI?.windowClose(),    cls:'wbtn wbtn-close' },
        ].map(btn => (
          <button key={btn.title} title={btn.title} className={btn.cls} onClick={btn.action}
            style={{ width:46, height:36, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', color:'#4a5a72', fontSize:12, cursor:'pointer', transition:'background .1s, color .1s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#e2e8f0'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#4a5a72'}
          >{btn.symbol}</button>
        ))}
      </div>
    </div>
  )
}
