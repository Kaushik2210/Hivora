'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createApiClient, getTokens } from '@/lib/auth'
import { useRealtime } from '@/hooks/useRealtime'
import type { RealtimeEvent } from '@hivora/shared'
import {
  FolderKanban, Bot, Lock, Plus, ArrowLeft,
  CheckCircle2, Play, X, Sparkles, FileCode2, Send,
  Loader2, Zap, ChevronDown, UserPlus, Copy, Check,
  Terminal, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────
type Task = {
  id: string; title: string; description?: string | null
  status: 'todo' | 'doing' | 'done' | 'conflict'
  priority: 'low' | 'medium' | 'high'
  assigneeId?: string | null; createdAt: string
}
type Agent = {
  id: string; name: string; type: 'ai' | 'human'
  status: 'idle' | 'working' | 'offline'
  provider?: string | null; currentTask?: string | null
}
type FileLock = { id: string; file: string; symbol: string; agentId: string; lockedAt: string }
type ChatMsg  = { role: 'user' | 'assistant'; content: string; taskCreated?: boolean }

const PROVIDER_LOGOS: Record<string, string> = {
  claude: '/logos/claude.svg', cursor: '/logos/cursor.svg',
  copilot: '/logos/github-copilot.svg', cline: '/logos/cline.svg', devin: '/logos/devin.svg',
}

const AGENT_TYPES = [
  { label: 'Claude (Anthropic)',  value: 'claude',  provider: 'anthropic' },
  { label: 'Cursor Agent',        value: 'cursor',  provider: 'cursor'    },
  { label: 'GitHub Copilot',      value: 'copilot', provider: 'github'    },
  { label: 'Cline',               value: 'cline',   provider: 'cline'     },
  { label: 'Devin (Cognition)',   value: 'devin',   provider: 'cognition' },
  { label: 'Human Developer',     value: 'human',   provider: null        },
]

function getAgentLogo(name: string, provider?: string | null): string | null {
  const key = (provider || name).toLowerCase()
  for (const [k, v] of Object.entries(PROVIDER_LOGOS)) if (key.includes(k)) return v
  return null
}

// ── Connect Agent Modal ───────────────────────────────────────────────────────
function ConnectAgentModal({
  projectId, token, onClose, onCreated,
}: { projectId: string; token: string; onClose: () => void; onCreated: (a: Agent) => void }) {
  const [step, setStep]       = useState<'form' | 'token'>('form')
  const [name, setName]       = useState('')
  const [agentType, setAgentType] = useState(AGENT_TYPES[0])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [created, setCreated] = useState<Agent | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const client = createApiClient()
      const agent = await client.createAgent(projectId, {
        name: name.trim(),
        type: agentType.value === 'human' ? 'human' : 'ai',
        provider: agentType.provider ?? undefined,
      }) as Agent
      setCreated(agent)
      onCreated(agent)
      setStep('token')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  const snippet = `HIVORA_TOKEN=${token}
HIVORA_API=${API_URL}
HIVORA_PROJECT=${projectId}
HIVORA_AGENT=${created?.id ?? '<agent-id>'}`

  const copySnippet = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-[var(--color-brand)]" />
            <h3 className="font-bold text-lg text-white">{step === 'form' ? 'Connect an Agent' : 'Agent Connected!'}</h3>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white p-1 rounded-lg hover:bg-[var(--color-surface)] transition-all"><X size={16} /></button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">Register an AI agent or team member to this project. After connecting, it can pick up tasks and acquire symbol locks.</p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Agent Name</label>
              <input
                autoFocus value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Claude for auth module"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Agent Type</label>
              <div className="grid grid-cols-2 gap-2">
                {AGENT_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setAgentType(t)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-sm transition-all ${agentType.value === t.value ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-white' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border)]/80'}`}
                  >
                    {PROVIDER_LOGOS[t.value] ? (
                      <img src={PROVIDER_LOGOS[t.value]} alt={t.label} className="h-5 w-5 object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <Bot size={16} className="text-[var(--color-brand)]" />
                    )}
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white rounded-xl text-sm font-semibold transition-all">Cancel</button>
              <button type="submit" disabled={!name.trim() || loading}
                className="flex-1 py-2.5 bg-[var(--color-brand)] hover:brightness-110 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {loading ? 'Connecting…' : 'Connect Agent'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-green-500/30 bg-green-500/5">
              <CheckCircle2 size={18} className="text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-400">{created?.name} registered successfully</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Use the credentials below to connect your agent</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Environment Variables</label>
              <div className="relative">
                <pre className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-xs font-mono text-green-400 overflow-x-auto leading-relaxed">{snippet}</pre>
                <button onClick={copySnippet} className="absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white transition-all">
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal size={14} className="text-[var(--color-brand)]" />
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Start your agent</span>
              </div>
              <code className="text-xs font-mono text-[var(--color-brand)]">npx @hivora/mcp start --watch</code>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">The agent will auto-connect, pick up tasks, and acquire symbol locks.</p>
            </div>

            <button onClick={onClose} className="w-full py-2.5 bg-[var(--color-brand)] hover:brightness-110 text-white rounded-xl text-sm font-semibold transition-all">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Assign Agent Dropdown ─────────────────────────────────────────────────────
function AssignDropdown({
  task, agents, onAssign,
}: { task: Task; agents: Agent[]; onAssign: (taskId: string, agentId: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const assigned = agents.find(a => a.id === task.assigneeId)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)] hover:border-[var(--color-brand)]/50 hover:text-[var(--color-text)] transition-all"
      >
        {assigned ? (
          <>
            {getAgentLogo(assigned.name, assigned.provider) ? (
              <img src={getAgentLogo(assigned.name, assigned.provider)!} alt="" className="h-3 w-3" />
            ) : <Bot size={10} />}
            <span className="max-w-[60px] truncate">{assigned.name}</span>
          </>
        ) : (
          <><Bot size={10} /> Assign</>
        )}
        <ChevronDown size={9} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 right-0 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-xl z-30 py-1">
          {task.assigneeId && (
            <button onClick={() => { onAssign(task.id, null); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors">
              <Trash2 size={11} /> Unassign
            </button>
          )}
          {agents.length === 0
            ? <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">No agents connected</p>
            : agents.map(a => (
                <button key={a.id} onClick={() => { onAssign(task.id, a.id); setOpen(false) }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${a.id === task.assigneeId ? 'text-[var(--color-brand)] bg-[var(--color-brand)]/5' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'}`}
                >
                  {getAgentLogo(a.name, a.provider) ? (
                    <img src={getAgentLogo(a.name, a.provider)!} alt="" className="h-3.5 w-3.5" />
                  ) : <Bot size={11} />}
                  <span className="truncate">{a.name}</span>
                  <span className={`ml-auto h-1.5 w-1.5 rounded-full ${a.status === 'working' ? 'bg-green-400' : 'bg-slate-500'}`} />
                </button>
              ))
          }
        </div>
      )}
    </div>
  )
}

// ── Vibecoding Chat Panel ─────────────────────────────────────────────────────
function VibecodePanel({
  projectName, projectId, onTaskCreated,
}: { projectName: string; projectId: string; onTaskCreated: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: `Hi! I'm your AI coding assistant for **${projectName}**. Describe what you want to build and I'll help you plan it, write code, or create tasks for your agents.` },
  ])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [provider, setProvider]   = useState<'anthropic' | 'openai'>('anthropic')
  const [creatingTask, setCreatingTask] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: ChatMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const client = createApiClient()
      const history = [...messages, userMsg]
        .filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      const systemMsg = {
        role: 'system' as const,
        content: `You are an expert software engineer assisting with the "${projectName}" project. Be concise but thorough. When appropriate, suggest breaking work into tasks for AI agents. Format code with proper markdown.`,
      }

      const res = await client.complete([systemMsg, ...history], provider)
      setMessages(prev => [...prev, { role: 'assistant', content: res.content }])
    } catch (err: any) {
      toast.error(err?.message?.includes('not configured') ? 'AI provider not configured. Check API keys in server settings.' : 'Failed to get AI response.')
      setMessages(prev => prev.slice(0, -1))
      setInput(text)
    } finally {
      setLoading(false)
    }
  }

  const createTaskFromMsg = async (msgIdx: number, content: string) => {
    setCreatingTask(msgIdx)
    const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').replace(/\*\*/g, '').slice(0, 120)
    try {
      const client = createApiClient()
      const orgs = await client.listOrganizations()
      if (!orgs.length) { toast.error('No organization found'); return }
      await client.createTask(projectId, { title: firstLine, description: content.slice(0, 500), priority: 'medium', status: 'todo' })
      setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, taskCreated: true } : m))
      toast.success('Task created from AI response!')
      onTaskCreated()
    } catch { toast.error('Failed to create task') }
    finally { setCreatingTask(null) }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-[var(--color-brand)]" />
          <span className="text-sm font-bold text-white">Vibe Code</span>
          <span className="rounded bg-[var(--color-brand)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-brand)]">AI</span>
        </div>
        <select
          value={provider} onChange={e => setProvider(e.target.value as typeof provider)}
          className="text-[10px] font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] cursor-pointer"
        >
          <option value="anthropic">Claude</option>
          <option value="openai">GPT-4</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[var(--color-brand)] text-white rounded-br-sm'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.role === 'assistant' && i > 0 && !msg.taskCreated && (
                <button
                  onClick={() => createTaskFromMsg(i, msg.content)}
                  disabled={creatingTask === i}
                  className="mt-2 flex items-center gap-1 text-[10px] text-[var(--color-brand)] hover:text-[var(--color-brand-light)] transition-colors font-semibold"
                >
                  {creatingTask === i ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                  {creatingTask === i ? 'Creating…' : 'Create as Task'}
                </button>
              )}
              {msg.taskCreated && (
                <span className="mt-1.5 flex items-center gap-1 text-[10px] text-green-400 font-semibold">
                  <CheckCircle2 size={10} /> Task created
                </span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Prompt suggestions */}
      {messages.length === 1 && (
        <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
          {[
            'Write a REST API endpoint for user login',
            'Plan the database schema for this project',
            'Create tasks for a new feature',
            'Review this code for security issues',
          ].map(s => (
            <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }}
              className="text-[10px] rounded-lg border border-[var(--color-border)] px-2 py-1 text-[var(--color-text-muted)] hover:border-[var(--color-brand)]/50 hover:text-[var(--color-text)] transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[var(--color-border)] p-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe what you want to build… (Enter to send)"
            rows={2}
            className="flex-1 resize-none bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors leading-relaxed"
          />
          <button
            onClick={send} disabled={!input.trim() || loading}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand)] text-white transition-all hover:brightness-110 disabled:opacity-40"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="mt-1 text-[10px] text-[var(--color-text-muted)] text-center">Shift+Enter for new line · AI can make mistakes</p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'todo',  label: 'To Do',       color: 'border-slate-700/50 bg-slate-900/10' },
  { id: 'doing', label: 'In Progress', color: 'border-blue-500/20 bg-blue-950/5'    },
  { id: 'done',  label: 'Done',        color: 'border-green-500/20 bg-green-950/5'  },
] as const

export default function ProjectPage() {
  const router    = useRouter()
  const params    = useParams()
  const rawId     = params?.id
  const projectId = (Array.isArray(rawId) ? rawId[0] : rawId) as string

  const [projectName, setProjectName] = useState('Project Details')
  const [tasks,  setTasks]   = useState<Task[]>([])
  const [agents, setAgents]  = useState<Agent[]>([])
  const [locks,  setLocks]   = useState<FileLock[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddTask,    setShowAddTask]    = useState(false)
  const [showConnect,    setShowConnect]    = useState(false)
  const [newTitle,    setNewTitle]    = useState('')
  const [newDesc,     setNewDesc]     = useState('')
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const taskInputRef = useRef<HTMLInputElement>(null)
  const token = getTokens()?.accessToken ?? ''

  const fetchData = useCallback(() => {
    if (!projectId) return
    const client = createApiClient()

    client.listOrganizations()
      .then(orgs => orgs.length ? client.listProjects(orgs[0].id) : Promise.resolve([]))
      .then(projects => {
        const proj = projects.find(p => p.id === projectId)
        if (proj) setProjectName(proj.name)
      }).catch(() => {})

    Promise.all([
      client.listTasks(projectId),
      client.listAgents(projectId),
      client.listLocks(projectId),
    ]).then(([t, a, l]) => {
      setTasks((t as Task[]) || [])
      setAgents((a as Agent[]) || [])
      setLocks((l as FileLock[]) || [])
    }).catch(err => { toast.error('Failed to load project data'); console.error(err) })
    .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    if (!getTokens()) { router.push('/login'); return }
    fetchData()
  }, [projectId])

  useEffect(() => { if (showAddTask) setTimeout(() => taskInputRef.current?.focus(), 50) }, [showAddTask])

  useRealtime(projectId, (event: RealtimeEvent) => {
    if (['task:updated', 'task:created', 'agent:updated', 'lock:acquired', 'lock:released'].includes(event.type))
      fetchData()
  })

  if (!getTokens()) return null

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !projectId) return
    setIsSubmitting(true)
    try {
      const client = createApiClient()
      await client.createTask(projectId, { title: newTitle.trim(), description: newDesc.trim() || undefined, priority: newPriority, status: 'todo' })
      setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setShowAddTask(false)
      fetchData()
    } catch { toast.error('Failed to create task') }
    finally { setIsSubmitting(false) }
  }

  const handleUpdateStatus = async (taskId: string, status: Task['status']) => {
    try {
      const client = createApiClient()
      await client.updateTask(projectId, taskId, { status })
      fetchData()
    } catch { toast.error('Failed to update task') }
  }

  const handleAssign = async (taskId: string, agentId: string | null) => {
    try {
      const client = createApiClient()
      await client.updateTask(projectId, taskId, { assigneeId: agentId })
      fetchData()
      toast.success(agentId ? 'Task assigned' : 'Task unassigned')
    } catch { toast.error('Failed to assign task') }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 backdrop-blur-md sticky top-16 z-30">
        <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-all">
              <ArrowLeft size={15} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FolderKanban size={16} className="text-[var(--color-brand)]" />
                <h1 className="text-lg font-bold tracking-tight">{projectName}</h1>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">{tasks.length} tasks · {agents.length} agents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowConnect(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-brand)]/50 transition-all">
              <UserPlus size={14} /> Connect Agent
            </button>
            <button onClick={() => setShowAddTask(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white hover:brightness-110 active:scale-95 shadow-md shadow-[var(--color-brand)]/20 transition-all">
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent" />
            <p className="text-sm text-[var(--color-text-muted)]">Loading project workspace…</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[280px_1fr_300px]">

            {/* ── Left Sidebar: Agents + Locks ── */}
            <aside className="space-y-5 xl:min-h-0">
              {/* Agents */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-[var(--color-brand)]" />
                    <h2 className="font-semibold text-sm">Agents</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[var(--color-brand)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-brand)]">
                      {agents.filter(a => a.status === 'working').length}/{agents.length}
                    </span>
                    <button onClick={() => setShowConnect(true)} title="Connect Agent"
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)]/50 transition-all">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {agents.length === 0 ? (
                  <button onClick={() => setShowConnect(true)}
                    className="w-full py-6 border border-dashed border-[var(--color-border)] rounded-xl hover:border-[var(--color-brand)]/50 hover:bg-[var(--color-brand)]/5 transition-all group">
                    <UserPlus size={20} className="mx-auto text-[var(--color-text-muted)] group-hover:text-[var(--color-brand)] transition-colors" />
                    <p className="text-xs text-[var(--color-text-muted)] mt-2 group-hover:text-[var(--color-text)]">Connect your first agent</p>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {agents.map(a => {
                      const logo = getAgentLogo(a.name, a.provider)
                      return (
                        <div key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 hover:border-[var(--color-brand)]/30 transition-all">
                          <div className="h-7 w-7 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                            {logo ? <img src={logo} alt={a.name} className="h-5 w-5 object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} /> : <Bot size={13} className="text-[var(--color-brand)]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">{a.name}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)] truncate">{a.currentTask || a.provider || 'Idle'}</p>
                          </div>
                          <span className={`h-2 w-2 rounded-full shrink-0 ${a.status === 'working' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Locks */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={16} className="text-[var(--color-brand)]" />
                  <h2 className="font-semibold text-sm">Symbol Locks</h2>
                  {locks.length > 0 && (
                    <span className="ml-auto rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">{locks.length}</span>
                  )}
                </div>
                {locks.length === 0 ? (
                  <div className="py-6 border border-dashed border-[var(--color-border)] rounded-xl text-center">
                    <Lock size={18} className="mx-auto text-[var(--color-text-muted)] opacity-40" />
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">No active locks</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locks.map(l => {
                      const agent = agents.find(a => a.id === l.agentId)
                      return (
                        <div key={l.id} className="p-2.5 rounded-xl border border-yellow-500/15 bg-yellow-950/5">
                          <div className="flex items-center gap-1.5 text-yellow-400">
                            <Lock size={10} /><span className="font-mono text-xs font-bold">{l.symbol}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] mt-1 pl-3.5">
                            <FileCode2 size={9} /><span className="truncate">{l.file}</span>
                          </div>
                          {agent && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 pl-3.5">by {agent.name}</p>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </aside>

            {/* ── Center: Kanban Board ── */}
            <main className="min-w-0">
              <div className="grid gap-4 md:grid-cols-3">
                {COLUMNS.map(col => {
                  const colTasks = tasks.filter(t => t.status === col.id)
                  return (
                    <div key={col.id} className={`rounded-xl border p-3.5 flex flex-col min-h-[400px] ${col.color}`}>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
                        <span className="font-bold text-sm text-[var(--color-text-muted)]">{col.label}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">{colTasks.length}</span>
                      </div>

                      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-300px)] pr-0.5">
                        {colTasks.map(t => {
                          return (
                            <div key={t.id} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-brand)]/50 transition-all duration-200 group shadow-sm hover:shadow-md hover:-translate-y-0.5">
                              {/* Title + Priority */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-sm leading-tight text-[var(--color-text)]">{t.title}</h4>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 tracking-wider border ${
                                  t.priority === 'high'   ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  t.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                }`}>{t.priority}</span>
                              </div>

                              {t.description && (
                                <p className="text-xs text-[var(--color-text-muted)] mb-2.5 leading-relaxed line-clamp-2">{t.description}</p>
                              )}

                              {/* Footer: assign + status action */}
                              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/50 gap-1.5">
                                <AssignDropdown task={t} agents={agents} onAssign={handleAssign} />

                                <div className="flex gap-1">
                                  {col.id === 'todo' && (
                                    <button onClick={() => handleUpdateStatus(t.id, 'doing')}
                                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)]/15 px-2 py-1 text-[10px] font-bold text-[var(--color-brand-light)] hover:bg-[var(--color-brand)] hover:text-white transition-all">
                                      <Play size={9} /> Start
                                    </button>
                                  )}
                                  {col.id === 'doing' && (
                                    <button onClick={() => handleUpdateStatus(t.id, 'done')}
                                      className="inline-flex items-center gap-1 rounded-lg bg-green-500/15 px-2 py-1 text-[10px] font-bold text-green-400 hover:bg-green-600 hover:text-white transition-all">
                                      <CheckCircle2 size={9} /> Done
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}

                        {colTasks.length === 0 && (
                          <div className="py-10 text-center border border-dashed border-[var(--color-border)]/50 rounded-xl">
                            <p className="text-xs text-[var(--color-text-muted)]">Empty</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </main>

            {/* ── Right: Vibecoding Panel ── */}
            <aside className="xl:min-h-0 xl:h-[calc(100vh-160px)] xl:sticky xl:top-28">
              <VibecodePanel
                projectName={projectName}
                projectId={projectId}
                onTaskCreated={fetchData}
              />
            </aside>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddTask(false)}>
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[var(--color-brand)]" />
                <h3 className="font-bold text-base text-white">Create New Task</h3>
              </div>
              <button onClick={() => setShowAddTask(false)} className="text-[var(--color-text-muted)] hover:text-white p-1 rounded-lg hover:bg-[var(--color-surface)] transition-all"><X size={15} /></button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Task Title</label>
                <input ref={taskInputRef} type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-brand)] transition-colors" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional details…" rows={2}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button key={p} type="button" onClick={() => setNewPriority(p)}
                      className={`py-2 rounded-xl text-xs font-semibold uppercase border transition-all ${
                        newPriority === p
                          ? p === 'high' ? 'bg-red-500/10 border-red-500 text-red-400' : p === 'medium' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' : 'bg-slate-500/10 border-slate-400 text-slate-300'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                      }`}
                    >{p}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddTask(false)}
                  className="flex-1 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white rounded-xl text-sm font-semibold transition-all">Cancel</button>
                <button type="submit" disabled={!newTitle.trim() || isSubmitting}
                  className="flex-1 py-2.5 bg-[var(--color-brand)] hover:brightness-110 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
                  {isSubmitting ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Agent Modal */}
      {showConnect && (
        <ConnectAgentModal
          projectId={projectId}
          token={token}
          onClose={() => setShowConnect(false)}
          onCreated={agent => {
            setAgents(prev => [...prev, agent])
            setShowConnect(false)
            toast.success(`${agent.name} connected to project`)
          }}
        />
      )}
    </div>
  )
}
