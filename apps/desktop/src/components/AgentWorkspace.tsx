import { useState, useEffect, useRef } from 'react'
import {
  Plus, Send, CheckCircle2, Circle, Clock, Bot, Terminal,
  Zap, FolderOpen, ChevronRight, ChevronDown, FileCode2, Save,
  GitBranch, Paperclip, X, FilePlus, RefreshCw,
} from 'lucide-react'
import { C } from '../theme'

const eAPI = () => (window as any).electronAPI

// ── Types ────────────────────────────────────────────────────────────────────

export interface WTask {
  id: string; title: string; description?: string
  status: 'todo' | 'in_progress' | 'done' | 'conflict'
  priority: 'low' | 'medium' | 'high'; assigneeId?: string | null
}
export interface WAgent {
  id: string; name: string; tool: string; logo: string
  status: 'working' | 'idle' | 'error'; currentTask?: string; color: string
}

type AgentMsgType = 'thinking' | 'tool' | 'diff' | 'text' | 'done'
interface AgentMsg {
  id: string; type: AgentMsgType; text: string
  toolName?: string; diffLines?: DiffLine[]; file?: string
}
interface DiffLine { kind: '+' | '-' | ' '; text: string }
interface FileEntry { name: string; path: string; isDir: boolean }

// ── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' }
const STATUS_ICON = {
  todo:        <Circle      size={13} style={{ color: '#6b7280', flexShrink: 0 }} />,
  in_progress: <Clock       size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />,
  done:        <CheckCircle2 size={13} style={{ color: '#22c55e', flexShrink: 0 }} />,
  conflict:    <Zap         size={13} style={{ color: '#ef4444', flexShrink: 0 }} />,
}

const TEXT_EXT = new Set(['ts','tsx','js','jsx','mjs','cjs','json','md','txt','css','scss','html','py','go','rs','java','kt','swift','c','cpp','h','sh','yaml','yml','toml','env','prisma','sql','graphql','vue','svelte'])

const THINKING_STEPS = [
  ['Reading source files…', 'tool'],
  ['Analyzing codebase structure…', 'thinking'],
  ['Planning changes…', 'thinking'],
  ['Writing implementation…', 'tool'],
  ['Checking for conflicts…', 'tool'],
  ['Reviewing output…', 'thinking'],
]

// ── Sub-components ───────────────────────────────────────────────────────────

function BlinkingCursor() {
  const [on, setOn] = useState(true)
  useEffect(() => { const t = setInterval(() => setOn(v => !v), 530); return () => clearInterval(t) }, [])
  return <span style={{ opacity: on ? 1 : 0, color: C.accent }}>▌</span>
}

function ThinkingDots() {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 400)
    return () => clearInterval(t)
  }, [])
  return <span style={{ color: C.textMut }}>{dots}</span>
}

function DiffBlock({ lines, file }: { lines: DiffLine[]; file?: string }) {
  return (
    <div style={{ background: '#0d1117', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', margin: '4px 0', fontSize: 11, fontFamily: 'monospace' }}>
      {file && (
        <div style={{ padding: '4px 10px', background: C.card, borderBottom: `1px solid ${C.border}`, color: C.textMut, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileCode2 size={11} style={{ color: C.textMut }} />
          <span style={{ color: C.text }}>{file}</span>
        </div>
      )}
      <div style={{ padding: '6px 0', maxHeight: 200, overflowY: 'auto' }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            padding: '1px 10px', whiteSpace: 'pre', lineHeight: 1.6,
            background: l.kind === '+' ? 'rgba(34,197,94,0.08)' : l.kind === '-' ? 'rgba(239,68,68,0.08)' : 'transparent',
            color: l.kind === '+' ? '#4ade80' : l.kind === '-' ? '#f87171' : C.textDim,
          }}>
            <span style={{ userSelect: 'none', opacity: 0.5, marginRight: 8 }}>{l.kind}</span>{l.text}
          </div>
        ))}
      </div>
    </div>
  )
}

function ToolBlock({ name, text }: { name: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', margin: '2px 0' }}>
      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${C.accent}18`, color: C.accentLt, border: `1px solid ${C.accent}30`, fontFamily: 'monospace', flexShrink: 0, marginTop: 1 }}>
        {name}
      </span>
      <span style={{ fontSize: 11, color: C.textDim, wordBreak: 'break-all', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

// ── Agent Panel ───────────────────────────────────────────────────────────────

function AgentPanel({ agent, tasks, messages }: { agent: WAgent; tasks: WTask[]; messages: AgentMsg[] }) {
  const doneCount   = tasks.filter(t => t.assigneeId === agent.id && t.status === 'done').length
  const currentTask = tasks.find(t => t.assigneeId === agent.id && t.status === 'in_progress')
  const logRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', minHeight: 220 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={agent.logo} alt={agent.name} style={{ width: 26, height: 26, borderRadius: 7 }}
            onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none'; const fb = el.nextElementSibling as HTMLElement; if (fb) fb.style.display = 'flex' }} />
          <div style={{ width: 26, height: 26, borderRadius: 7, display: 'none', alignItems: 'center', justifyContent: 'center', background: agent.color, color: 'white', fontSize: 11, fontWeight: 700 }}>{agent.name[0]}</div>
          <span style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', border: `2px solid ${C.card}`, background: agent.status === 'working' ? '#22c55e' : agent.status === 'error' ? '#ef4444' : '#6b7280' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{agent.name}</div>
          <div style={{ fontSize: 10, color: C.textMut }}>{agent.tool} · {doneCount} done</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: agent.status === 'working' ? '#22c55e18' : '#6b728018', color: agent.status === 'working' ? '#4ade80' : '#9ca3af', border: `1px solid ${agent.status === 'working' ? '#22c55e30' : '#6b728030'}` }}>
          {agent.status === 'working' ? '● working' : '○ idle'}
        </span>
      </div>

      {/* Body */}
      <div ref={logRef} style={{ flex: 1, padding: '10px 14px', overflowY: 'auto', background: `${C.bg}cc`, minHeight: 80 }}>
        {messages.length === 0 && agent.status === 'idle' && (
          <span style={{ fontSize: 11, color: C.textMut, fontFamily: 'monospace' }}>Agent is idle — waiting for tasks…</span>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 6 }}>
            {msg.type === 'thinking' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMut, fontSize: 11, fontFamily: 'monospace' }}>
                <span style={{ color: C.accent, fontSize: 13 }}>◆</span>
                <span>{msg.text}</span>
                {agent.status === 'working' && <ThinkingDots />}
              </div>
            )}
            {msg.type === 'tool' && <ToolBlock name={msg.toolName ?? 'tool'} text={msg.text} />}
            {msg.type === 'diff' && <DiffBlock lines={msg.diffLines ?? []} file={msg.file} />}
            {msg.type === 'text' && (
              <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
            )}
            {msg.type === 'done' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4ade80', fontFamily: 'monospace' }}>
                <CheckCircle2 size={13} style={{ color: '#22c55e' }} />
                {msg.text}
              </div>
            )}
          </div>
        ))}
        {agent.status === 'working' && currentTask && messages.length > 0 && (
          <div style={{ fontSize: 11, color: C.accentLt, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: C.textMut }}>›</span>
            <span>{currentTask.title}</span>
            <BlinkingCursor />
          </div>
        )}
      </div>
    </div>
  )
}

// ── File Tree ─────────────────────────────────────────────────────────────────

function FileTree({ rootPath, onSelectFile, selectedFile }: {
  rootPath: string; onSelectFile: (path: string) => void; selectedFile: string | null
}) {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [children, setChildren] = useState<Record<string, FileEntry[]>>({})

  useEffect(() => {
    eAPI()?.fsListDir(rootPath).then(setEntries)
  }, [rootPath])

  const toggle = async (entry: FileEntry) => {
    if (!entry.isDir) { onSelectFile(entry.path); return }
    const next = new Set(expanded)
    if (next.has(entry.path)) { next.delete(entry.path) }
    else {
      next.add(entry.path)
      if (!children[entry.path]) {
        const sub = await eAPI()?.fsListDir(entry.path)
        setChildren(c => ({ ...c, [entry.path]: sub ?? [] }))
      }
    }
    setExpanded(next)
  }

  const renderEntries = (items: FileEntry[], depth = 0): React.ReactNode =>
    items.map(entry => (
      <div key={entry.path}>
        <button onClick={() => toggle(entry)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 4, padding: `3px 8px 3px ${8 + depth * 12}px`, border: 'none', background: selectedFile === entry.path ? `${C.accent}20` : 'none', color: selectedFile === entry.path ? C.text : C.textDim, cursor: 'pointer', fontSize: 11, textAlign: 'left', transition: 'background .1s', borderLeft: selectedFile === entry.path ? `2px solid ${C.accent}` : '2px solid transparent' }}
          onMouseEnter={e => { if (selectedFile !== entry.path) (e.currentTarget as HTMLElement).style.background = C.hover }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selectedFile === entry.path ? `${C.accent}20` : 'none' }}
        >
          {entry.isDir
            ? expanded.has(entry.path)
              ? <ChevronDown size={11} style={{ color: C.textMut, flexShrink: 0 }} />
              : <ChevronRight size={11} style={{ color: C.textMut, flexShrink: 0 }} />
            : <span style={{ width: 11, flexShrink: 0 }} />
          }
          {entry.isDir
            ? <FolderOpen size={12} style={{ color: C.accentLt, flexShrink: 0 }} />
            : <FileCode2 size={12} style={{ color: C.textMut, flexShrink: 0 }} />
          }
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
        </button>
        {entry.isDir && expanded.has(entry.path) && children[entry.path] && (
          renderEntries(children[entry.path], depth + 1)
        )}
      </div>
    ))

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
      {renderEntries(entries)}
    </div>
  )
}

// ── Code Editor ───────────────────────────────────────────────────────────────

function CodeEditor({ filePath, onClose }: { filePath: string; onClose: () => void }) {
  const [content, setContent]   = useState('')
  const [original, setOriginal] = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    eAPI()?.fsReadFile(filePath).then((res: any) => {
      if (res?.ok) { setContent(res.content); setOriginal(res.content) }
    })
  }, [filePath])

  const save = async () => {
    setSaving(true)
    const res = await eAPI()?.fsWriteFile(filePath, content)
    setSaving(false)
    if (res?.ok) { setOriginal(content); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current!
      const start = ta.selectionStart; const end = ta.selectionEnd
      const newVal = content.substring(0, start) + '  ' + content.substring(end)
      setContent(newVal)
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2 }, 0)
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save() }
  }

  const isDirty = content !== original
  const lines = content.split('\n').length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Editor toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
        <FileCode2 size={13} style={{ color: C.accentLt, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {filePath.split(/[\\/]/).slice(-2).join('/')}
          {isDirty && <span style={{ color: C.accent, marginLeft: 6 }}>●</span>}
        </span>
        <span style={{ fontSize: 10, color: C.textMut }}>{lines} lines</span>
        <button onClick={save} disabled={!isDirty || saving}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: isDirty ? 'pointer' : 'not-allowed', background: saved ? '#22c55e' : isDirty ? C.accent : C.muted, color: 'white', transition: 'all .15s' }}>
          <Save size={11} /> {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, display: 'flex', borderRadius: 4 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMut}>
          <X size={13} />
        </button>
      </div>

      {/* Editor body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Line numbers */}
        <div style={{ width: 44, background: `${C.bg}cc`, borderRight: `1px solid ${C.border}`, overflowY: 'hidden', flexShrink: 0, paddingTop: 8 }}>
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} style={{ padding: '0 8px', height: '1.6em', lineHeight: '1.6em', fontSize: 11, fontFamily: 'monospace', color: C.textMut, textAlign: 'right', userSelect: 'none' }}>
              {i + 1}
            </div>
          ))}
        </div>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          style={{
            flex: 1, background: `${C.bg}cc`, border: 'none', outline: 'none', resize: 'none',
            color: C.text, fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace",
            fontSize: 12, lineHeight: '1.6em', padding: '8px 14px',
            overflowY: 'auto', whiteSpace: 'pre', overflowX: 'auto',
          }}
        />
      </div>
    </div>
  )
}

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, agents, onMove }: { task: WTask; agents: WAgent[]; onMove: (id: string, s: WTask['status']) => void }) {
  const assignee = agents.find(a => a.id === task.assigneeId)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 12px', cursor: 'default', transition: 'background .1s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
    >
      <div style={{ marginTop: 1 }}>{STATUS_ICON[task.status]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: task.status === 'done' ? C.textMut : C.text, textDecoration: task.status === 'done' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: C.textMut }}>{task.priority}</span>
          {assignee && <span style={{ fontSize: 9, color: C.textMut }}>· {assignee.name}</span>}
        </div>
      </div>
      {task.status === 'in_progress' && (
        <button onClick={() => onMove(task.id, 'done')} style={{ fontSize: 9, color: '#22c55e', background: '#22c55e12', border: '1px solid #22c55e30', borderRadius: 4, padding: '1px 5px', cursor: 'pointer', flexShrink: 0 }}>Done</button>
      )}
    </div>
  )
}

// ── Main AgentWorkspace ───────────────────────────────────────────────────────

interface Props {
  tasks: WTask[]; agents: WAgent[]; projectName: string
  onAddTask: (title: string) => void; onMoveTask: (id: string, status: WTask['status']) => void
}

export function AgentWorkspace({ tasks, agents, projectName, onAddTask, onMoveTask }: Props) {
  const [prompt,       setPrompt]       = useState('')
  const [activeTab,    setActiveTab]    = useState<'workspace' | 'files'>('workspace')
  const [folderPath,   setFolderPath]   = useState<string | null>(() => localStorage.getItem('hivora_project_folder'))
  const [gitBranch,    setGitBranch]    = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [attachments,  setAttachments]  = useState<string[]>([])
  const [agentMsgs,    setAgentMsgs]    = useState<Record<string, AgentMsg[]>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  // Refresh git branch whenever folder changes
  useEffect(() => {
    if (!folderPath) { setGitBranch(null); return }
    eAPI()?.gitBranch(folderPath).then(setGitBranch)
    const t = setInterval(() => eAPI()?.gitBranch(folderPath).then(setGitBranch), 10000)
    return () => clearInterval(t)
  }, [folderPath])

  // Simulate agent activity messages
  useEffect(() => {
    let step = 0
    const interval = setInterval(() => {
      setAgentMsgs(prev => {
        const next: Record<string, AgentMsg[]> = { ...prev }
        agents.forEach(agent => {
          if (agent.status !== 'working') return
          const msgs = next[agent.id] ?? []
          const [text, type] = THINKING_STEPS[step % THINKING_STEPS.length]
          const newMsg: AgentMsg = { id: `${agent.id}-${Date.now()}`, type: type as AgentMsgType, text, toolName: type === 'tool' ? 'Read' : undefined }
          // Occasionally add a simulated diff
          if (step % 7 === 4 && folderPath) {
            const diffMsg: AgentMsg = {
              id: `${agent.id}-diff-${Date.now()}`, type: 'diff',
              text: '', file: 'src/index.ts',
              diffLines: [
                { kind: ' ', text: 'import { createServer } from "./server"' },
                { kind: '-', text: 'const PORT = 3000' },
                { kind: '+', text: 'const PORT = process.env.PORT ?? 3000' },
                { kind: ' ', text: 'createServer(PORT)' },
              ],
            }
            next[agent.id] = [...msgs.slice(-12), newMsg, diffMsg]
          } else {
            next[agent.id] = [...msgs.slice(-14), newMsg]
          }
        })
        return next
      })
      step++
    }, 2000)
    return () => clearInterval(interval)
  }, [agents, folderPath])

  const pickFolder = async () => {
    const path = await eAPI()?.dialogOpenFolder()
    if (!path) return
    setFolderPath(path)
    localStorage.setItem('hivora_project_folder', path)
    setSelectedFile(null)
  }

  const attachFiles = async () => {
    const paths: string[] = await eAPI()?.dialogOpenFiles() ?? []
    setAttachments(prev => [...new Set([...prev, ...paths])])
  }

  const removeAttachment = (p: string) => setAttachments(prev => prev.filter(a => a !== p))

  const handleSend = () => {
    const t = prompt.trim()
    if (!t) return
    onAddTask(t)
    setPrompt('')
    setAttachments([])
  }

  const todoTasks  = tasks.filter(t => t.status === 'todo')
  const doingTasks = tasks.filter(t => t.status === 'in_progress')
  const doneTasks  = tasks.filter(t => t.status === 'done')
  const folderName = folderPath ? folderPath.split(/[\\/]/).pop() : null

  const isTextFile = (p: string) => { const ext = p.split('.').pop()?.toLowerCase() ?? ''; return TEXT_EXT.has(ext) }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* ── Task Queue ─────────────────────────────────────────── */}
      <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.bg }}>
        <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tasks</span>
          <span style={{ fontSize: 10, color: C.textMut }}>{todoTasks.length} pending</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {doingTasks.length > 0 && <>
            <div style={{ padding: '3px 12px', fontSize: 9, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>In Progress</div>
            {doingTasks.map(t => <TaskRow key={t.id} task={t} agents={agents} onMove={onMoveTask} />)}
          </>}
          {todoTasks.length > 0 && <>
            <div style={{ padding: '3px 12px', fontSize: 9, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2, marginTop: doingTasks.length ? 8 : 0 }}>Pending</div>
            {todoTasks.map(t => <TaskRow key={t.id} task={t} agents={agents} onMove={onMoveTask} />)}
          </>}
          {doneTasks.length > 0 && <>
            <div style={{ padding: '3px 12px', fontSize: 9, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2, marginTop: 8 }}>Completed</div>
            {doneTasks.slice(0, 5).map(t => <TaskRow key={t.id} task={t} agents={agents} onMove={onMoveTask} />)}
            {doneTasks.length > 5 && <div style={{ padding: '3px 12px', fontSize: 10, color: C.textMut }}>+{doneTasks.length - 5} more</div>}
          </>}
          {tasks.length === 0 && (
            <div style={{ padding: '20px 14px', textAlign: 'center' }}>
              <FilePlus size={24} style={{ color: C.textMut, margin: '0 auto 8px', display: 'block' }} />
              <p style={{ fontSize: 11, color: C.textMut, margin: 0, lineHeight: 1.5 }}>No tasks yet.<br />Type a prompt below.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Main panel ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${C.border}`, background: C.bg, paddingLeft: 8, paddingRight: 8, gap: 2, flexShrink: 0, height: 36 }}>
          {(['workspace', 'files'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '0 14px', height: '100%', fontSize: 12, border: 'none', cursor: 'pointer', background: activeTab === tab ? C.surface : 'none', color: activeTab === tab ? C.text : C.textMut, borderBottom: activeTab === tab ? `2px solid ${C.accent}` : '2px solid transparent', fontWeight: activeTab === tab ? 600 : 400, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6 }}>
              {tab === 'workspace' ? <><Terminal size={12} /> Workspace</> : <><FileCode2 size={12} /> Files</>}
            </button>
          ))}
          {folderPath && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', fontSize: 10, color: C.textMut }}>
              {gitBranch && <><GitBranch size={10} style={{ color: C.accentLt }} /><span style={{ color: C.accentLt }}>{gitBranch}</span></>}
              <FolderOpen size={10} />
              <span>{folderName}</span>
              <button onClick={pickFolder} title="Change folder" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, padding: 2, display: 'flex' }}>
                <RefreshCw size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Tab: Workspace */}
        {activeTab === 'workspace' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {agents.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: agents.length === 1 ? '1fr' : agents.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
                {agents.map(agent => (
                  <AgentPanel key={agent.id} agent={agent} tasks={tasks} messages={agentMsgs[agent.id] ?? []} />
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMut, textAlign: 'center', padding: 40 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${C.accent}15`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Bot size={26} style={{ color: C.accent }} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>No agents connected</h3>
                <p style={{ fontSize: 12, color: C.textMut, margin: '0 0 20px', lineHeight: 1.6, maxWidth: 340 }}>
                  Connect an AI coding tool via MCP. Agents appear here and work on tasks in real-time — just like Claude Code, Cursor, or Cline, but coordinated.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360 }}>
                  {[
                    { name: 'Claude Code', cmd: 'Add to CLAUDE.md or mcp.json', logo: '/logos/claude.svg', color: '#D97757' },
                    { name: 'Cursor',      cmd: 'Add to .cursor/mcp.json',      logo: '/logos/cursor.svg',  color: '#3b82f6' },
                    { name: 'Cline',       cmd: 'Cline settings → MCP servers', logo: '/logos/cline.svg',   color: '#22c55e' },
                  ].map(tool => (
                    <div key={tool.name} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px' }}>
                      <img src={tool.logo} alt={tool.name} style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0 }}
                        onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.background = tool.color; el.style.borderRadius = '6px' }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{tool.name}</div>
                        <div style={{ fontSize: 10, color: C.textMut }}>{tool.cmd}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Terminal size={13} style={{ color: C.accent }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>Start MCP server</span>
                    </div>
                    <code style={{ fontSize: 10, color: C.accentLt, fontFamily: 'monospace' }}>npx @hivora/orchestrator@latest start</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Files */}
        {activeTab === 'files' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* File tree panel */}
            <div style={{ width: 210, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.surface }}>
              <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>Explorer</span>
                <button onClick={pickFolder} title="Open folder" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, display: 'flex', padding: 2 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMut}>
                  <FolderOpen size={13} />
                </button>
              </div>
              {folderPath ? (
                <FileTree rootPath={folderPath} selectedFile={selectedFile}
                  onSelectFile={p => { if (isTextFile(p)) setSelectedFile(p) }} />
              ) : (
                <div style={{ padding: '20px 12px', textAlign: 'center' }}>
                  <button onClick={pickFolder} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 8, cursor: 'pointer', color: C.accentLt, fontSize: 11, margin: '0 auto' }}>
                    <FolderOpen size={14} /> Open Project Folder
                  </button>
                  <p style={{ fontSize: 10, color: C.textMut, margin: '10px 0 0', lineHeight: 1.5 }}>Select the root folder of your project to browse and edit files.</p>
                </div>
              )}
            </div>

            {/* Editor */}
            {selectedFile ? (
              <CodeEditor filePath={selectedFile} onClose={() => setSelectedFile(null)} />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: C.textMut }}>
                <FileCode2 size={32} style={{ opacity: 0.3 }} />
                <span style={{ fontSize: 12 }}>Select a file to edit</span>
                {!folderPath && (
                  <button onClick={pickFolder} style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: C.accent, border: 'none', borderRadius: 8, cursor: 'pointer', color: 'white', fontSize: 12, fontWeight: 600 }}>
                    <FolderOpen size={14} /> Open Folder
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Prompt Bar ─────────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid ${C.border}`, background: C.surface, padding: '10px 14px', flexShrink: 0 }}>
          {/* Attachments */}
          {attachments.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {attachments.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.card, border: `1px solid ${C.border}`, borderRadius: 5, padding: '2px 6px', fontSize: 10, color: C.textDim }}>
                  <FileCode2 size={10} style={{ color: C.accentLt }} />
                  <span>{p.split(/[\\/]/).pop()}</span>
                  <button onClick={() => removeAttachment(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, padding: 0, display: 'flex', lineHeight: 1 }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Project folder selector */}
            <button onClick={pickFolder} title={folderPath ?? 'Open project folder'}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: folderPath ? `${C.accent}18` : C.card, border: `1px solid ${folderPath ? C.accent + '40' : C.border}`, borderRadius: 8, cursor: 'pointer', color: folderPath ? C.accentLt : C.textMut, fontSize: 10, fontWeight: 600, flexShrink: 0, transition: 'all .15s', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <FolderOpen size={12} />
              {folderName ?? 'Open folder'}
            </button>

            {/* Input */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 12px', transition: 'border-color .15s' }}
              onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
              onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
            >
              <span style={{ fontSize: 11, color: C.accent, flexShrink: 0, fontWeight: 600 }}>/{projectName}</span>
              <span style={{ color: C.muted }}>│</span>
              <input ref={inputRef} value={prompt} onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Give agents a task or ask a question…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 12, fontFamily: "'Inter',system-ui,sans-serif" }}
              />
            </div>

            {/* Attach files */}
            <button onClick={attachFiles} title="Attach files from computer"
              style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${attachments.length ? C.accent + '50' : C.border}`, cursor: 'pointer', background: attachments.length ? `${C.accent}15` : C.card, color: attachments.length ? C.accentLt : C.textMut, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>
              <Paperclip size={14} />
            </button>

            {/* Send */}
            <button onClick={handleSend} disabled={!prompt.trim()}
              style={{ width: 36, height: 36, borderRadius: 9, border: 'none', cursor: prompt.trim() ? 'pointer' : 'not-allowed', background: prompt.trim() ? C.accent : C.muted, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>
              <Send size={14} />
            </button>

            {/* New task */}
            <button onClick={() => { onAddTask(''); inputRef.current?.focus() }}
              style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.border}`, cursor: 'pointer', background: C.card, color: C.textMut, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
