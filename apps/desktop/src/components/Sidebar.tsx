import { useState } from 'react'
import {
  Plus, FolderOpen, Lock, FileCode2, Bell, User, ExternalLink, Server,
  ChevronDown, Cpu, Key, Monitor, RefreshCw, Zap, GitBranch, Search,
  Code2, Database, Bot, Shield, Activity, ScrollText, CheckCircle2, Brain, Eye, EyeOff,
  Loader2, AlertTriangle
} from 'lucide-react'
import { C } from '../theme'
import { EmptyState } from './EmptyState'

export type SidebarSection = 'explorer' | 'agents' | 'models' | 'locks' | 'settings' | 'skills' | 'logs'

interface Agent    { id: string; name: string; tool: string; logo: string; status: 'working' | 'idle' | 'error'; mode: 'thinking' | 'fast'; currentTask?: string; color: string }
interface FileLock { file: string; symbol: string; agentId: string }
interface Project  { id: string; name: string }

interface SidebarProps {
  section: SidebarSection
  mode: 'cloud' | 'local'
  authed: boolean
  projects: Project[]
  selectedProjectId: string | null
  agents: Agent[]
  locks: FileLock[]
  serverUrl: string
  webUrl: string
  notifications: boolean
  autoSync: boolean
  scannedFiles: any[]
  agentLogs?: any[]
  onToggleLock: (file: string, symbol: string) => void
  onUpdateAgentMode?: (agentId: string, mode: 'thinking' | 'fast') => void
  onSelectProject: (id: string) => void
  onShowAddProject: () => void
  onShowWelcome: () => void
  onLogout: () => void
  onServerUrlChange: (v: string) => void
  onWebUrlChange: (v: string) => void
  onToggleNotifications: () => void
  onToggleAutoSync: () => void
  onOpenWebApp: () => void
}

// ── Provider definitions ─────────────────────────────────────────────────────
const PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic',   sublabel: 'Claude',          placeholder: 'sk-ant-api03-…', color: '#D97757', logo: './logos/claude.svg'   },
  { id: 'openai',    label: 'OpenAI',      sublabel: 'GPT',             placeholder: 'sk-proj-…',      color: '#10a37f', logo: './logos/openai.svg'   },
  { id: 'gemini',    label: 'Google',      sublabel: 'Gemini',          placeholder: 'AIza…',          color: '#4285F4', logo: './logos/gemini.svg'   },
  { id: 'groq',      label: 'Groq',        sublabel: 'LLaMA / Mixtral', placeholder: 'gsk_…',          color: '#F55036', logo: './logos/groq.svg'     },
  { id: 'mistral',   label: 'Mistral AI',  sublabel: 'Mistral',         placeholder: 'sk-…',           color: '#FF7000', logo: './logos/mistral.svg'  },
  { id: 'cohere',    label: 'Cohere',      sublabel: 'Command R',       placeholder: '…',              color: '#39594D', logo: './logos/cohere.svg'   },
  { id: 'xai',       label: 'xAI',         sublabel: 'Grok',            placeholder: 'xai-…',          color: '#1DA1F2', logo: './logos/xai.svg'      },
  { id: 'deepseek',  label: 'DeepSeek',    sublabel: 'DeepSeek-V3',     placeholder: 'sk-…',           color: '#4F46E5', logo: './logos/deepseek.svg' },
  { id: 'together',  label: 'Together AI', sublabel: 'Open Models',     placeholder: '…',              color: '#7C3AED', logo: './logos/together.svg' },
]

// ── AI Models list ───────────────────────────────────────────────────────────
const AI_MODELS = [
  { id: 'claude-35-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', badge: 'Fast',    logo: './logos/claude.svg',   color: '#D97757', key: 'anthropic' },
  { id: 'claude-3-opus',    name: 'Claude 3 Opus',     provider: 'Anthropic', badge: 'Smart',   logo: './logos/claude.svg',   color: '#D97757', key: 'anthropic' },
  { id: 'claude-3-haiku',   name: 'Claude 3 Haiku',    provider: 'Anthropic', badge: 'Light',   logo: './logos/claude.svg',   color: '#D97757', key: 'anthropic' },
  { id: 'gpt-4o',           name: 'GPT-4o',            provider: 'OpenAI',    badge: 'Latest',  logo: './logos/openai.svg',   color: '#10a37f', key: 'openai'    },
  { id: 'gpt-4-turbo',      name: 'GPT-4 Turbo',       provider: 'OpenAI',    badge: 'Smart',   logo: './logos/openai.svg',   color: '#10a37f', key: 'openai'    },
  { id: 'gpt-35-turbo',     name: 'GPT-3.5 Turbo',     provider: 'OpenAI',    badge: 'Fast',    logo: './logos/openai.svg',   color: '#10a37f', key: 'openai'    },
  { id: 'gemini-15-pro',    name: 'Gemini 1.5 Pro',    provider: 'Google',    badge: 'Latest',  logo: './logos/gemini.svg',   color: '#4285F4', key: 'gemini'    },
  { id: 'gemini-ultra',     name: 'Gemini Ultra',       provider: 'Google',    badge: 'Smart',   logo: './logos/gemini.svg',   color: '#4285F4', key: 'gemini'    },
  { id: 'llama-31-405b',    name: 'LLaMA 3.1 405B',    provider: 'Groq',      badge: 'Open',    logo: './logos/groq.svg',     color: '#F55036', key: 'groq'      },
  { id: 'mistral-large',    name: 'Mistral Large',      provider: 'Mistral',   badge: 'Smart',   logo: './logos/mistral.svg',  color: '#FF7000', key: 'mistral'   },
  { id: 'command-r-plus',   name: 'Command R+',         provider: 'Cohere',    badge: 'RAG',     logo: './logos/cohere.svg',   color: '#39594D', key: 'cohere'    },
  { id: 'grok-2',           name: 'Grok-2',             provider: 'xAI',       badge: 'Latest',  logo: './logos/xai.svg',      color: '#1DA1F2', key: 'xai'       },
  { id: 'deepseek-v3',      name: 'DeepSeek-V3',        provider: 'DeepSeek',  badge: 'Open',    logo: './logos/deepseek.svg', color: '#4F46E5', key: 'deepseek'  },
  { id: 'deepseek-r1',      name: 'DeepSeek-R1',        provider: 'DeepSeek',  badge: 'Reason',  logo: './logos/deepseek.svg', color: '#4F46E5', key: 'deepseek'  },
]

// ── Skills definitions ───────────────────────────────────────────────────────
const SKILL_GROUPS = [
  {
    group: 'Code & Files',
    items: [
      { id: 'code-edit',   icon: Code2,     name: 'Code Editing',    desc: 'Read, write and patch source files' },
      { id: 'code-search', icon: Search,    name: 'Codebase Search', desc: 'Semantic + keyword search across files' },
      { id: 'git-ops',     icon: GitBranch, name: 'Git Operations',  desc: 'Branch, commit, diff, merge' },
      { id: 'filesystem',  icon: Database,  name: 'File System',     desc: 'Scan directories, read/write files' },
    ],
  },
  {
    group: 'Agent Coordination',
    items: [
      { id: 'multi-agent', icon: Bot,      name: 'Multi-Agent',     desc: 'Coordinate parallel agent sessions' },
      { id: 'sym-lock',    icon: Lock,     name: 'Symbol Locking',  desc: 'Prevent file conflicts between agents' },
      { id: 'task-disp',   icon: Zap,      name: 'Task Dispatch',   desc: 'Claim and complete tasks via MCP' },
      { id: 'monitoring',  icon: Activity, name: 'Live Monitoring', desc: 'Real-time agent status & logs' },
    ],
  },
  {
    group: 'Security & Safety',
    items: [
      { id: 'perm-guard',  icon: Shield,   name: 'Permission Guards', desc: 'Tool-level access control' },
      { id: 'audit',       icon: Monitor,  name: 'Audit Trail',       desc: 'Full log of every agent action' },
    ],
  },
]

const ALL_SKILL_IDS = SKILL_GROUPS.flatMap(g => g.items.map(i => i.id))

// ── ApiKeyRow ────────────────────────────────────────────────────────────────
function ApiKeyRow({ p }: { p: typeof PROVIDERS[0] }) {
  const storageKey = `hivora_key_${p.id}`
  const [val,   setVal]  = useState(() => localStorage.getItem(storageKey) ?? '')
  const [show,  setShow] = useState(false)
  const [saved, setSaved] = useState(!!localStorage.getItem(storageKey))
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warn,  setWarn]  = useState(false)

  // Verify the key against the provider's real API before storing it.
  // A confirmed-invalid key (401/403) is rejected and never saved.
  const save = async () => {
    if (!val.trim() || validating) return
    setError(null); setWarn(false); setValidating(true)
    const api = (window as any).electronAPI
    try {
      const res = api?.keyValidate
        ? await api.keyValidate(p.id, val.trim())
        : { ok: true, inconclusive: true } // browser fallback: can't validate
      if (!res.ok) {
        setError(res.reason === 'empty' ? 'Anahtar boş' : 'Geçersiz anahtar — sağlayıcı reddetti')
        setValidating(false)
        return
      }
      localStorage.setItem(storageKey, val.trim())
      setSaved(true)
      setWarn(!!res.inconclusive) // saved but couldn't fully confirm
    } catch {
      setError('Doğrulama başarısız — bağlantıyı kontrol et')
    } finally {
      setValidating(false)
    }
  }
  const clear = () => {
    localStorage.removeItem(storageKey)
    setVal('')
    setSaved(false)
    setError(null); setWarn(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <img src={p.logo} style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }} alt={p.label}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>
          {p.label} <span style={{ color: C.textMut, fontWeight: 400 }}>({p.sublabel})</span>
        </label>
        {saved && !warn && <span style={{ fontSize: 9, color: '#4ade80', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle2 size={10} /> doğrulandı</span>}
        {saved && warn && <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}><AlertTriangle size={10} /> kaydedildi</span>}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          type={show ? 'text' : 'password'} value={val}
          onChange={e => { setVal(e.target.value); setSaved(false); setError(null); setWarn(false) }}
          placeholder={p.placeholder}
          style={{ flex: 1, background: C.card, border: `1px solid ${error ? '#ef4444' : C.muted}`, borderRadius: 6, padding: '5px 7px', fontSize: 10, color: C.text, outline: 'none', fontFamily: 'monospace', minWidth: 0 }}
          onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = error ? '#ef4444' : C.accent}
          onBlur={e  => (e.currentTarget as HTMLElement).style.borderColor = error ? '#ef4444' : C.muted}
          onKeyDown={e => e.key === 'Enter' && save()}
        />
        <button onClick={() => setShow(v => !v)}
          style={{ background: C.card, border: `1px solid ${C.muted}`, borderRadius: 6, padding: '2px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMut, fontSize: 11 }}>
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        {saved ? (
          <button onClick={clear}
            style={{ background: '#ef444420', border: '1px solid #ef444440', borderRadius: 6, padding: '0 7px', cursor: 'pointer', color: '#f87171', fontSize: 10, fontWeight: 600 }}>
            ✕
          </button>
        ) : (
          <button onClick={save} disabled={!val.trim() || validating}
            style={{ background: val.trim() && !validating ? C.accent : C.muted, border: 'none', borderRadius: 6, padding: '0 8px', cursor: val.trim() && !validating ? 'pointer' : 'not-allowed', color: 'white', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, minWidth: 44, justifyContent: 'center' }}>
            {validating ? <Loader2 size={11} style={{ animation: 'hv-spin 1s linear infinite' }} /> : 'Save'}
          </button>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 9, color: '#f87171' }}>
          <AlertTriangle size={10} /> {error}
        </div>
      )}
    </div>
  )
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar({
  section, mode, authed, projects, selectedProjectId, agents, locks,
  serverUrl, webUrl, notifications, autoSync, scannedFiles, agentLogs, onToggleLock,
  onUpdateAgentMode, onSelectProject, onShowAddProject, onShowWelcome, onLogout,
  onServerUrlChange, onWebUrlChange, onToggleNotifications, onToggleAutoSync, onOpenWebApp,
}: SidebarProps) {
  // Skills: all disabled by default — user enables what they need
  const [skills, setSkills] = useState<Record<string, boolean>>(
    () => {
      const saved = localStorage.getItem('hivora_skills')
      if (saved) { try { return JSON.parse(saved) } catch {} }
      return Object.fromEntries(ALL_SKILL_IDS.map(id => [id, false]))
    }
  )
  const toggleSkill = (id: string) => setSkills(prev => {
    const next = { ...prev, [id]: !prev[id] }
    localStorage.setItem('hivora_skills', JSON.stringify(next))
    return next
  })

  const sectionLabel = {
    explorer: 'Explorer', agents: 'Agents', models: 'AI Models',
    locks: 'Locks', settings: 'Settings', skills: 'Skills', logs: 'Live Logs',
  }[section]

  return (
    <div style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
      <div style={{ padding: '7px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {sectionLabel}
        </span>
        {section === 'explorer' && (
          <button onClick={onShowAddProject} title="New Project (Ctrl+N)"
            style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex', transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMut}
          ><Plus size={13} /></button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Explorer */}
        {section === 'explorer' && (
          projects.length === 0
            ? <EmptyState icon={<FolderOpen size={22} />} title="No projects yet"
                desc={mode === 'cloud' && !authed ? 'Sign in under Settings to access your cloud projects.' : 'Create your first project to get started.'}
                action={mode === 'local' || authed ? onShowAddProject : undefined} actionLabel="New Project" />
            : <div style={{ paddingTop: 4 }}>
                <div style={{ padding: '4px 12px 4px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <ChevronDown size={11} /> Projects
                </div>
                {projects.map(proj => (
                  <button key={proj.id} onClick={() => onSelectProject(proj.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: selectedProjectId === proj.id ? 20 : 22, paddingRight: 12, paddingTop: 6, paddingBottom: 6, textAlign: 'left', cursor: 'pointer', border: 'none', background: selectedProjectId === proj.id ? `${C.accent}18` : 'none', borderLeft: `2px solid ${selectedProjectId === proj.id ? C.accent : 'transparent'}`, color: selectedProjectId === proj.id ? C.text : C.textDim, transition: 'all .1s' }}
                    onMouseEnter={e => { if (selectedProjectId !== proj.id) (e.currentTarget as HTMLElement).style.background = C.hover }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selectedProjectId === proj.id ? `${C.accent}18` : 'none' }}
                  >
                    <FolderOpen size={13} style={{ color: selectedProjectId === proj.id ? C.accentLt : C.textMut, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</span>
                  </button>
                ))}
                
                {selectedProjectId && scannedFiles.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ padding: '4px 12px 4px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      <ChevronDown size={11} /> Scanned Files
                    </div>
                    <div style={{ maxHeight: 250, overflowY: 'auto', padding: '0 8px' }}>
                      {scannedFiles.map((fileObj, idx) => (
                        <div key={idx} style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px' }}>
                            <FileCode2 size={11} style={{ color: C.accentLt }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {fileObj.file.split('/').pop()}
                            </span>
                          </div>
                          <div style={{ paddingLeft: 12 }}>
                            {fileObj.symbols.map((sym: any, sIdx: number) => {
                              const relativePath = fileObj.file;
                              const isLocked = locks.some(l => l.file === relativePath && l.symbol === sym.name);
                              const lockOwner = isLocked ? (agents.find(a => a.id === locks.find(l => l.file === relativePath && l.symbol === sym.name)?.agentId)?.name || 'locked') : null;

                              return (
                                <button key={sIdx} onClick={() => onToggleLock(relativePath, sym.name)}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 4, fontSize: 10, color: isLocked ? '#ef4444' : C.textMut, transition: 'all .1s' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.hover; const ind = (e.currentTarget as HTMLElement).querySelector('.lock-hover-indicator') as HTMLElement; if (ind) ind.style.opacity = '0.7' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; const ind = (e.currentTarget as HTMLElement).querySelector('.lock-hover-indicator') as HTMLElement; if (ind) ind.style.opacity = '0' }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span>{sym.type === 'class' ? '🅒' : sym.type === 'const' ? '🅥' : '🅵'}</span>
                                    {sym.name}
                                  </span>
                                  {isLocked ? (
                                    <span title={`Locked by ${lockOwner}`} style={{ display: 'flex', alignItems: 'center' }}>
                                      <Lock size={9} style={{ color: '#ef4444' }} />
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 8, opacity: 0 }} className="lock-hover-indicator">🔒</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
        )}

        {/* Agents */}
        {section === 'agents' && (
          agents.length === 0
            ? <EmptyState icon={<Cpu size={22} />} title="No agents connected" desc="Connect an AI agent to start coordinating tasks." />
            : <div style={{ paddingTop: 8 }}>
                {agents.map(agent => (
                  <div key={agent.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px', borderBottom: `1px solid ${C.border}30`, transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={agent.logo} alt={agent.name} style={{ width: 28, height: 28, borderRadius: 6 }}
                          onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none'; const fb = el.nextElementSibling as HTMLElement; if (fb) fb.style.display = 'flex' }} />
                        <div style={{ width: 28, height: 28, borderRadius: 6, display: 'none', alignItems: 'center', justifyContent: 'center', background: agent.color, color: 'white', fontSize: 11, fontWeight: 700 }}>{agent.name[0]}</div>
                        <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', border: `2px solid ${C.surface}`, background: agent.status === 'working' ? '#22c55e' : agent.status === 'error' ? '#ef4444' : C.textMut }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{agent.name}</span>
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 600, background: agent.status === 'working' ? '#22c55e20' : '#ef444420', color: agent.status === 'working' ? '#4ade80' : '#f87171' }}>{agent.status}</span>
                        </div>
                        <p style={{ fontSize: 10, color: C.textMut, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{agent.currentTask ?? agent.tool}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 38 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onUpdateAgentMode) {
                            onUpdateAgentMode(agent.id, agent.mode === 'fast' ? 'thinking' : 'fast');
                          }
                        }}
                        style={{
                          background: agent.mode === 'fast' ? `${C.accent}20` : `${C.muted}`,
                          border: `1px solid ${agent.mode === 'fast' ? C.accent : C.border}`,
                          color: agent.mode === 'fast' ? C.accentLt : C.textDim,
                          fontSize: 9,
                          padding: '2px 6px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontWeight: 600,
                          transition: 'all 0.15s'
                        }}
                      >
                        {agent.mode === 'fast' ? (
                          <>
                            <Zap size={10} style={{ color: '#fbbf24' }} />
                            <span>Fast</span>
                          </>
                        ) : (
                          <>
                            <Brain size={10} style={{ color: C.accentLt }} />
                            <span>Thinking</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* Live Logs */}
        {section === 'logs' && (
          !agentLogs || agentLogs.length === 0
            ? <EmptyState icon={<ScrollText size={22} />} title="No logs yet" desc="Logs will appear here once agents start working on tasks." />
            : <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                {agentLogs.map((log, idx) => {
                  const agent = agents.find(a => a.id === log.agentId)
                  return (
                    <div key={idx} style={{ background: C.card, border: `1px solid ${C.muted}`, borderRadius: 8, padding: '8px 10px', fontSize: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {agent?.logo && <img src={agent.logo} alt={agent.name} style={{ width: 12, height: 12, borderRadius: 3 }} />}
                        <span style={{ fontWeight: 600, color: agent?.color || C.textDim }}>{agent?.name || 'Agent'}</span>
                        <span style={{ fontSize: 9, color: C.textMut, marginLeft: 'auto' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ color: C.text, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.4 }}>
                        {log.message}
                      </div>
                    </div>
                  )
                })}
              </div>
        )}

        {/* AI Models */}
        {section === 'models' && (
          <div style={{ paddingTop: 4, paddingBottom: 8 }}>
            <p style={{ fontSize: 10, color: C.textMut, margin: '6px 12px 10px', lineHeight: 1.5 }}>
              Add API keys in Settings to activate models.
            </p>
            {AI_MODELS.map(model => {
              const hasKey = !!localStorage.getItem(`hivora_key_${model.key}`)
              return (
                <div key={model.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 12px', transition: 'background .1s', cursor: 'default', opacity: hasKey ? 1 : 0.55 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <img src={model.logo} alt={model.provider} style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0 }}
                    onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.name}</span>
                    <span style={{ fontSize: 9, color: C.textMut }}>{model.provider}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                    <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: `${model.color}25`, color: model.color, fontWeight: 600 }}>{model.badge}</span>
                    {hasKey && <span style={{ fontSize: 8, color: '#4ade80' }}>✓</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Locks */}
        {section === 'locks' && (
          locks.length === 0
            ? (
              <div style={{ padding: '20px 14px' }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.accent}15`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Lock size={20} style={{ color: C.accent }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>No active locks</div>
                  <div style={{ fontSize: 10, color: C.textMut, lineHeight: 1.6 }}>
                    When agents edit the same project, Hivora locks individual files and functions so two agents never overwrite each other.
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: <Lock size={13} style={{ color: C.accentLt }} />, title: 'File lock', desc: 'Agent A edits auth.ts → locked for others' },
                    { icon: <Zap size={13} style={{ color: '#fbbf24' }} />, title: 'Symbol lock', desc: 'Function-level — only the function is blocked' },
                    { icon: <CheckCircle2 size={13} style={{ color: '#22c55e' }} />, title: 'Auto-release', desc: 'Lock lifts when the agent finishes the task' },
                  ].map(item => (
                    <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: C.card, border: `1px solid ${C.muted}`, borderRadius: 8, padding: '8px 10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim }}>{item.title}</div>
                        <div style={{ fontSize: 9, color: C.textMut, lineHeight: 1.4, marginTop: 1 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
            : <div style={{ paddingTop: 8 }}>
                {locks.map((lock, i) => {
                  const agent = agents.find(a => a.id === lock.agentId)
                  return (
                    <div key={i} style={{ padding: '10px 12px 10px 10px', borderLeft: '2px solid transparent', marginLeft: 1, transition: 'all .1s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = `${C.accent}60`; (e.currentTarget as HTMLElement).style.background = C.hover }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; (e.currentTarget as HTMLElement).style.background = 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Lock size={10} style={{ color: C.accent, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: C.accentLt, fontWeight: 600 }}>{lock.symbol}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 16, marginBottom: 2 }}>
                        <FileCode2 size={9} style={{ color: C.textMut }} />
                        <span style={{ fontSize: 10, color: C.textMut }}>{lock.file}</span>
                      </div>
                      {agent && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 16 }}>
                          <img src={agent.logo} style={{ width: 12, height: 12, borderRadius: 3 }} alt={agent.name}
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                          <span style={{ fontSize: 10, color: C.textMut }}>by {agent.name}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
        )}

        {/* Skills */}
        {section === 'skills' && (
          <div style={{ padding: '8px 0', overflowY: 'auto' }}>
            <p style={{ fontSize: 10, color: C.textMut, margin: '0 12px 12px', lineHeight: 1.5 }}>
              Built-in capabilities available to all connected agents.
            </p>
            {SKILL_GROUPS.map(group => (
              <div key={group.group} style={{ marginBottom: 16 }}>
                <div style={{ padding: '2px 12px 6px', fontSize: 9, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {group.group}
                </div>
                {group.items.map(skill => {
                  const Icon = skill.icon
                  const on = skills[skill.id] ?? true
                  return (
                    <div key={skill.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 12px', transition: 'background .1s', cursor: 'default' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                    >
                      <div style={{ width: 22, height: 22, borderRadius: 5, background: on ? `${C.accent}18` : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'background .2s' }}>
                        <Icon size={11} style={{ color: on ? C.accentLt : C.textMut }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: on ? C.text : C.textMut }}>{skill.name}</div>
                        <div style={{ fontSize: 9, color: C.textMut, lineHeight: 1.4, marginTop: 1 }}>{skill.desc}</div>
                      </div>
                      <button
                        onClick={() => toggleSkill(skill.id)}
                        style={{ width: 30, height: 16, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', background: on ? C.accent : C.muted, padding: 0, flexShrink: 0, marginTop: 3 }}
                        title={on ? 'Disable' : 'Enable'}
                      >
                        <span style={{ position: 'absolute', top: 2, left: 2, width: 12, height: 12, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.5)', transition: 'transform .2s', transform: on ? 'translateX(14px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Settings */}
        {section === 'settings' && (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Connection */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Server size={11} style={{ color: C.textMut }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Connection</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {([['API Server', serverUrl, onServerUrlChange], ['Web App URL', webUrl, onWebUrlChange]] as const).map(([lbl, val, setter]) => (
                  <div key={lbl}>
                    <label style={{ fontSize: 10, color: C.textMut, display: 'block', marginBottom: 4 }}>{lbl}</label>
                    <input value={val} onChange={e => setter(e.target.value)}
                      style={{ width: '100%', background: C.card, border: `1px solid ${C.muted}`, borderRadius: 6, padding: '4px 8px', fontSize: 11, color: C.text, outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                      onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                      onBlur={e  => (e.currentTarget as HTMLElement).style.borderColor = C.muted}
                    />
                  </div>
                ))}
                <button onClick={onOpenWebApp} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.accentLt, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <ExternalLink size={10} /> Open Web App
                </button>
              </div>
            </div>

            {/* Cloud Account */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <User size={11} style={{ color: C.textMut }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cloud Account</span>
              </div>
              {authed ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ background: C.card, border: '1px solid #22c55e30', borderRadius: 6, padding: '8px 10px', fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0, display: 'inline-block' }} />
                    Connected to Hivora Cloud
                  </div>
                  <button onClick={onLogout}
                    style={{ width: '100%', background: C.hover, color: C.textDim, border: `1px solid ${C.muted}`, borderRadius: 6, padding: '5px', fontSize: 11, cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2d1a1a'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                  >Sign Out</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ background: C.card, border: `1px solid ${C.muted}`, borderRadius: 6, padding: '8px 10px', fontSize: 11, color: C.textMut }}>
                    Not signed in (offline mode)
                  </div>
                  <button onClick={onShowWelcome}
                    style={{ width: '100%', background: C.accent, color: 'white', border: 'none', borderRadius: 6, padding: '6px', fontSize: 11, cursor: 'pointer', fontWeight: 600, transition: 'filter .15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = 'none'}
                  >Sign In to Sync</button>
                </div>
              )}
            </div>

            {/* AI Provider Keys */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Key size={11} style={{ color: C.textMut }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Provider Keys</span>
              </div>
              <p style={{ fontSize: 10, color: C.textMut, margin: '0 0 10px', lineHeight: 1.5 }}>
                Keys are stored locally. Press Enter or Save to confirm.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PROVIDERS.map(p => <ApiKeyRow key={p.id} p={p} />)}
              </div>
            </div>

            {/* Preferences */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Monitor size={11} style={{ color: C.textMut }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preferences</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {([
                  { label: 'Notifications', value: notifications, toggle: onToggleNotifications, icon: <Bell size={11} style={{ color: C.textMut }} /> },
                  { label: 'Auto Sync',     value: autoSync,      toggle: onToggleAutoSync,      icon: <RefreshCw size={11} style={{ color: C.textMut }} /> },
                ] as const).map(({ label, value, toggle, icon }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {icon}
                      <span style={{ fontSize: 11, color: C.textDim }}>{label}</span>
                    </div>
                    <button onClick={toggle} style={{ width: 36, height: 20, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', background: value ? C.accent : C.muted, padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                      <span style={{ position: 'absolute', top: 3, left: 3, width: 14, height: 14, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.5)', transition: 'transform .2s', transform: value ? 'translateX(16px)' : 'translateX(0)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
