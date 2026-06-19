import { useState, useEffect, useRef } from 'react'
import { Plus, Send, CheckCircle2, Circle, Clock, Bot, Zap, Terminal } from 'lucide-react'
import { C } from '../theme'

export interface WTask {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done' | 'conflict'
  priority: 'low' | 'medium' | 'high'
  assigneeId?: string | null
}

export interface WAgent {
  id: string
  name: string
  tool: string
  logo: string
  status: 'working' | 'idle' | 'error'
  currentTask?: string
  color: string
}

interface AgentLog {
  agentId: string
  lines: string[]
}

interface Props {
  tasks: WTask[]
  agents: WAgent[]
  projectName: string
  onAddTask: (title: string) => void
  onMoveTask: (id: string, status: WTask['status']) => void
}

const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' }
const STATUS_ICON = {
  todo:     <Circle     size={13} style={{ color: '#6b7280', flexShrink: 0 }} />,
  in_progress: <Clock   size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />,
  done:     <CheckCircle2 size={13} style={{ color: '#22c55e', flexShrink: 0 }} />,
  conflict: <Zap        size={13} style={{ color: '#ef4444', flexShrink: 0 }} />,
}

function BlinkingCursor() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setOn(v => !v), 530)
    return () => clearInterval(t)
  }, [])
  return <span style={{ opacity: on ? 1 : 0, color: C.accent }}>▌</span>
}

function AgentPanel({ agent, tasks, logs }: { agent: WAgent; tasks: WTask[]; logs: string[] }) {
  const currentTask = tasks.find(t => t.assigneeId === agent.id && t.status === 'in_progress')
  const doneCount   = tasks.filter(t => t.assigneeId === agent.id && t.status === 'done').length
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, overflow: 'hidden', minHeight: 180,
    }}>
      {/* Agent header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={agent.logo} alt={agent.name}
            style={{ width: 28, height: 28, borderRadius: 7 }}
            onError={e => {
              const el = e.currentTarget as HTMLImageElement
              el.style.display = 'none'
              const fb = el.nextElementSibling as HTMLElement
              if (fb) fb.style.display = 'flex'
            }} />
          <div style={{
            width: 28, height: 28, borderRadius: 7, display: 'none',
            alignItems: 'center', justifyContent: 'center',
            background: agent.color, color: 'white', fontSize: 12, fontWeight: 700,
          }}>{agent.name[0]}</div>
          <span style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 9, height: 9, borderRadius: '50%',
            border: `2px solid ${C.card}`,
            background: agent.status === 'working' ? '#22c55e' : agent.status === 'error' ? '#ef4444' : '#6b7280',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{agent.name}</div>
          <div style={{ fontSize: 10, color: C.textMut }}>{agent.tool} · {doneCount} tasks done</div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
          background: agent.status === 'working' ? '#22c55e18' : '#6b728018',
          color: agent.status === 'working' ? '#4ade80' : '#9ca3af',
          border: `1px solid ${agent.status === 'working' ? '#22c55e30' : '#6b728030'}`,
        }}>
          {agent.status === 'working' ? '● working' : '○ idle'}
        </span>
      </div>

      {/* Terminal output */}
      <div ref={logRef} style={{
        flex: 1, padding: '10px 14px', fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace",
        fontSize: 11, lineHeight: 1.7, color: C.textDim, overflowY: 'auto',
        background: `${C.bg}cc`, minHeight: 80,
      }}>
        {logs.length === 0 && agent.status === 'idle' && (
          <span style={{ color: C.textMut }}>Agent is idle — waiting for tasks...</span>
        )}
        {logs.map((line, i) => (
          <div key={i} style={{ marginBottom: 1 }}>
            <span style={{ color: C.textMut, userSelect: 'none' }}>{'  '}</span>
            <span style={{ color: i === logs.length - 1 && agent.status === 'working' ? C.accentLt : C.textDim }}>{line}</span>
          </div>
        ))}
        {agent.status === 'working' && currentTask && (
          <div>
            <span style={{ color: C.textMut }}>{'  '}</span>
            <span style={{ color: C.accentLt }}>Working on: {currentTask.title} </span>
            <BlinkingCursor />
          </div>
        )}
      </div>
    </div>
  )
}

export function AgentWorkspace({ tasks, agents, projectName, onAddTask, onMoveTask }: Props) {
  const [prompt, setPrompt] = useState('')
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Generate simulated log lines for working agents
  useEffect(() => {
    const LOG_TEMPLATES = [
      'Reading source files...',
      'Analyzing codebase structure...',
      'Planning changes...',
      'Writing implementation...',
      'Running tests...',
      'Checking for conflicts...',
      'Reviewing output...',
    ]
    const interval = setInterval(() => {
      setAgentLogs(prev => {
        return agents.map(agent => {
          const existing = prev.find(l => l.agentId === agent.id)
          if (agent.status !== 'working') return { agentId: agent.id, lines: existing?.lines ?? [] }
          const lines = existing?.lines ?? []
          if (lines.length >= 6) return { agentId: agent.id, lines: [...lines.slice(1), LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)]] }
          return { agentId: agent.id, lines: [...lines, LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)]] }
        })
      })
    }, 2200)
    return () => clearInterval(interval)
  }, [agents])

  const handleSend = () => {
    const t = prompt.trim()
    if (!t) return
    onAddTask(t)
    setPrompt('')
  }

  const todoTasks  = tasks.filter(t => t.status === 'todo')
  const doingTasks = tasks.filter(t => t.status === 'in_progress')
  const doneTasks  = tasks.filter(t => t.status === 'done')

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>

      {/* ── Task Queue (right sidebar) ───────────────────────────── */}
      <div style={{
        width: 248, flexShrink: 0, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Task Queue</span>
          <span style={{ fontSize: 10, color: C.textMut }}>{todoTasks.length} pending</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {/* Doing */}
          {doingTasks.length > 0 && (
            <>
              <div style={{ padding: '4px 12px', fontSize: 9, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>In Progress</div>
              {doingTasks.map(task => (
                <TaskRow key={task.id} task={task} agents={agents} onMove={onMoveTask} />
              ))}
            </>
          )}

          {/* Todo */}
          {todoTasks.length > 0 && (
            <>
              <div style={{ padding: '4px 12px', fontSize: 9, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2, marginTop: doingTasks.length ? 8 : 0 }}>Pending</div>
              {todoTasks.map(task => (
                <TaskRow key={task.id} task={task} agents={agents} onMove={onMoveTask} />
              ))}
            </>
          )}

          {/* Done */}
          {doneTasks.length > 0 && (
            <>
              <div style={{ padding: '4px 12px', fontSize: 9, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2, marginTop: 8 }}>Completed</div>
              {doneTasks.slice(0, 5).map(task => (
                <TaskRow key={task.id} task={task} agents={agents} onMove={onMoveTask} />
              ))}
              {doneTasks.length > 5 && (
                <div style={{ padding: '4px 12px', fontSize: 10, color: C.textMut }}>+{doneTasks.length - 5} more</div>
              )}
            </>
          )}

          {tasks.length === 0 && (
            <div style={{ padding: '20px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>📋</div>
              <p style={{ fontSize: 11, color: C.textMut, margin: 0, lineHeight: 1.5 }}>
                No tasks yet.<br />Type a prompt below to add one.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Agent Workspace (main center) ────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Agent panels */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {agents.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: agents.length === 1 ? '1fr' : agents.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 12,
            }}>
              {agents.map(agent => (
                <AgentPanel
                  key={agent.id}
                  agent={agent}
                  tasks={tasks}
                  logs={agentLogs.find(l => l.agentId === agent.id)?.lines ?? []}
                />
              ))}
            </div>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: C.textMut, textAlign: 'center', padding: 40,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: `${C.accent}15`, border: `1px solid ${C.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
              }}>
                <Bot size={28} style={{ color: C.accent }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>No agents connected</h3>
              <p style={{ fontSize: 12, color: C.textMut, margin: '0 0 20px', lineHeight: 1.6, maxWidth: 340 }}>
                Connect an AI agent to start vibecoding. Your agents will appear here and work on tasks in real-time — just like Claude Code or Cline, but across multiple tools at once.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360 }}>
                {[
                  { name: 'Claude Code', cmd: 'Add to CLAUDE.md or mcp.json', logo: '/logos/claude.svg', color: '#D97757' },
                  { name: 'Cursor',      cmd: 'Add to .cursor/mcp.json',      logo: '/logos/cursor.svg',  color: '#3b82f6' },
                  { name: 'Cline',       cmd: 'Cline settings → MCP servers', logo: '/logos/cline.svg',   color: '#22c55e' },
                ].map(tool => (
                  <div key={tool.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px',
                  }}>
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
                  <code style={{ fontSize: 10, color: C.accentLt, fontFamily: 'monospace' }}>
                    npx @hivora/orchestrator@latest start
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Prompt bar ───────────────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${C.border}`, background: C.surface,
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '8px 12px', transition: 'border-color .15s',
          }}
            onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
            onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
          >
            <span style={{ fontSize: 11, color: C.textMut, flexShrink: 0 }}>/{projectName}</span>
            <span style={{ color: C.muted }}>│</span>
            <input
              ref={inputRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Give agents a task... (e.g. &quot;Add dark mode toggle to settings&quot;)"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: C.text, fontSize: 12, fontFamily: "'Inter',system-ui,sans-serif",
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!prompt.trim()}
            style={{
              width: 36, height: 36, borderRadius: 9, border: 'none', cursor: prompt.trim() ? 'pointer' : 'not-allowed',
              background: prompt.trim() ? C.accent : C.muted, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s', flexShrink: 0,
            }}
          >
            <Send size={15} />
          </button>
          <button
            onClick={() => { onAddTask(''); inputRef.current?.focus() }}
            style={{
              width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.border}`, cursor: 'pointer',
              background: C.card, color: C.textMut, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s', flexShrink: 0,
            }}
            title="Add task"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskRow({ task, agents, onMove }: { task: WTask; agents: WAgent[]; onMove: (id: string, s: WTask['status']) => void }) {
  const assignee = agents.find(a => a.id === task.assigneeId)
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 12px',
      cursor: 'default', transition: 'background .1s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
    >
      <div style={{ marginTop: 1 }}>{STATUS_ICON[task.status]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, color: task.status === 'done' ? C.textMut : C.text,
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{task.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: C.textMut }}>{task.priority}</span>
          {assignee && <span style={{ fontSize: 9, color: C.textMut }}>· {assignee.name}</span>}
        </div>
      </div>
      {task.status === 'in_progress' && (
        <button onClick={() => onMove(task.id, 'done')}
          style={{ fontSize: 9, color: '#22c55e', background: '#22c55e12', border: '1px solid #22c55e30', borderRadius: 4, padding: '1px 5px', cursor: 'pointer', flexShrink: 0 }}>
          Done
        </button>
      )}
    </div>
  )
}
