import {
  Plus, FolderOpen, Lock, FileCode2, Bell, User, ExternalLink, Server,
  ChevronDown, Cpu, Key, Monitor, RefreshCw,
} from 'lucide-react'
import { C } from '../theme'
import { EmptyState } from './EmptyState'

type SidebarSection = 'explorer' | 'agents' | 'models' | 'locks' | 'settings'

interface Agent    { id: string; name: string; tool: string; logo: string; status: 'working' | 'idle' | 'error'; currentTask?: string; color: string }
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
  anthropicKey: string
  openaiKey: string
  showAnthKey: boolean
  showOaiKey: boolean
  notifications: boolean
  autoSync: boolean
  onSelectProject: (id: string) => void
  onShowAddProject: () => void
  onShowWelcome: () => void
  onLogout: () => void
  onServerUrlChange: (v: string) => void
  onWebUrlChange: (v: string) => void
  onAnthropicKeyChange: (v: string) => void
  onOpenaiKeyChange: (v: string) => void
  onSaveAnthropicKey: () => void
  onSaveOpenaiKey: () => void
  onToggleAnthKey: () => void
  onToggleOaiKey: () => void
  onToggleNotifications: () => void
  onToggleAutoSync: () => void
  onOpenWebApp: () => void
}

export function Sidebar({
  section, mode, authed, projects, selectedProjectId, agents, locks,
  serverUrl, webUrl, anthropicKey, openaiKey, showAnthKey, showOaiKey,
  notifications, autoSync,
  onSelectProject, onShowAddProject, onShowWelcome, onLogout,
  onServerUrlChange, onWebUrlChange, onAnthropicKeyChange, onOpenaiKeyChange,
  onSaveAnthropicKey, onSaveOpenaiKey, onToggleAnthKey, onToggleOaiKey,
  onToggleNotifications, onToggleAutoSync, onOpenWebApp,
}: SidebarProps) {
  const sectionLabel = { explorer: 'Explorer', agents: 'Agents', models: 'AI Models', locks: 'Locks', settings: 'Settings' }[section]

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
              </div>
        )}

        {/* Agents */}
        {section === 'agents' && (
          agents.length === 0
            ? <EmptyState icon={<Cpu size={22} />} title="No agents connected" desc="Connect an AI agent to start coordinating tasks." />
            : <div style={{ paddingTop: 8 }}>
                {agents.map(agent => (
                  <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'default', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                  >
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
                ))}
              </div>
        )}

        {/* AI Models (shows connected agents) */}
        {section === 'models' && (
          <div style={{ paddingTop: 8, paddingBottom: 8 }}>
            {agents.length > 0 ? (
              <>
                <p style={{ fontSize: 10, color: C.textMut, margin: '0 0 6px', padding: '0 12px' }}>
                  {agents.filter(a => a.status === 'working').length} working · {agents.filter(a => a.status === 'idle').length} idle
                </p>
                {agents.map(agent => (
                  <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', cursor: 'default', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={agent.logo} alt={agent.name} style={{ width: 24, height: 24, borderRadius: 6 }}
                        onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none'; const fb = el.nextElementSibling as HTMLElement; if (fb) fb.style.display = 'flex' }} />
                      <div style={{ width: 24, height: 24, borderRadius: 6, display: 'none', alignItems: 'center', justifyContent: 'center', background: agent.color, color: 'white', fontSize: 10, fontWeight: 700 }}>{agent.name[0]}</div>
                      <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', border: `2px solid ${C.surface}`, background: agent.status === 'working' ? '#22c55e' : C.textMut }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 11, color: C.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{agent.name}</span>
                      <span style={{ fontSize: 10, color: C.textMut }}>{agent.currentTask ?? agent.tool}</span>
                    </div>
                    <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, fontWeight: 600, background: agent.status === 'working' ? '#22c55e20' : `${C.textMut}20`, color: agent.status === 'working' ? '#4ade80' : C.textMut }}>
                      {agent.status}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 10, color: C.textMut, margin: 0 }}>No agents connected yet. Connect your AI tools via MCP:</p>
                {[
                  { name: 'Claude Code', logo: '/logos/claude.svg', color: '#D97757', hint: 'Add to CLAUDE.md or mcp config' },
                  { name: 'Cursor', logo: '/logos/cursor.svg', color: '#3b82f6', hint: '.cursor/mcp.json' },
                  { name: 'Cline (VS Code)', logo: '/logos/cline.svg', color: '#22c55e', hint: 'Cline MCP settings' },
                ].map(tool => (
                  <div key={tool.name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, border: `1px solid ${C.muted}`, borderRadius: 8, padding: '8px 10px' }}>
                    <img src={tool.logo} style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0 }} alt={tool.name}
                      onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.background = tool.color; el.style.borderRadius = '5px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 11, color: C.text, fontWeight: 600, display: 'block' }}>{tool.name}</span>
                      <span style={{ fontSize: 9, color: C.textMut }}>{tool.hint}</span>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: 9, color: C.textMut, margin: 0, lineHeight: 1.5 }}>
                  Run: <code style={{ background: C.card, padding: '1px 4px', borderRadius: 3 }}>npx @hivora/orchestrator@latest start</code>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Locks */}
        {section === 'locks' && (
          locks.length === 0
            ? <EmptyState icon={<Lock size={22} />} title="No active locks" desc="Symbol locks appear here when agents are editing files." />
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
                      onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = C.muted}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Key size={11} style={{ color: C.textMut }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Provider Keys</span>
              </div>
              <p style={{ fontSize: 10, color: C.textMut, margin: '0 0 10px', lineHeight: 1.5 }}>
                Enter your own API keys to use them directly in the agent workspace.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Anthropic */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <img src="/logos/claude.svg" style={{ width: 14, height: 14, borderRadius: 3 }} alt="Anthropic"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>Anthropic (Claude)</label>
                    {anthropicKey && <span style={{ fontSize: 9, color: '#4ade80', marginLeft: 'auto' }}>✓ saved</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input type={showAnthKey ? 'text' : 'password'} value={anthropicKey}
                      onChange={e => onAnthropicKeyChange(e.target.value)}
                      placeholder="sk-ant-api03-…"
                      style={{ flex: 1, background: C.card, border: `1px solid ${C.muted}`, borderRadius: 6, padding: '5px 7px', fontSize: 10, color: C.text, outline: 'none', fontFamily: 'monospace', minWidth: 0 }}
                      onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                      onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = C.muted}
                    />
                    <button onClick={onToggleAnthKey} style={{ background: C.card, border: `1px solid ${C.muted}`, borderRadius: 6, padding: '0 6px', cursor: 'pointer', color: C.textMut, fontSize: 12 }}>
                      {showAnthKey ? '🙈' : '👁'}
                    </button>
                    <button onClick={onSaveAnthropicKey}
                      style={{ background: anthropicKey ? C.accent : C.muted, border: 'none', borderRadius: 6, padding: '0 8px', cursor: anthropicKey ? 'pointer' : 'not-allowed', color: 'white', fontSize: 10, fontWeight: 600 }}>
                      Save
                    </button>
                  </div>
                </div>
                {/* OpenAI */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: '#10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 8, color: 'white', fontWeight: 700 }}>O</span>
                    </div>
                    <label style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>OpenAI (GPT-4)</label>
                    {openaiKey && <span style={{ fontSize: 9, color: '#4ade80', marginLeft: 'auto' }}>✓ saved</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input type={showOaiKey ? 'text' : 'password'} value={openaiKey}
                      onChange={e => onOpenaiKeyChange(e.target.value)}
                      placeholder="sk-proj-…"
                      style={{ flex: 1, background: C.card, border: `1px solid ${C.muted}`, borderRadius: 6, padding: '5px 7px', fontSize: 10, color: C.text, outline: 'none', fontFamily: 'monospace', minWidth: 0 }}
                      onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                      onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = C.muted}
                    />
                    <button onClick={onToggleOaiKey} style={{ background: C.card, border: `1px solid ${C.muted}`, borderRadius: 6, padding: '0 6px', cursor: 'pointer', color: C.textMut, fontSize: 12 }}>
                      {showOaiKey ? '🙈' : '👁'}
                    </button>
                    <button onClick={onSaveOpenaiKey}
                      style={{ background: openaiKey ? C.accent : C.muted, border: 'none', borderRadius: 6, padding: '0 8px', cursor: openaiKey ? 'pointer' : 'not-allowed', color: 'white', fontSize: 10, fontWeight: 600 }}>
                      Save
                    </button>
                  </div>
                </div>
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
                  { label: 'Auto Sync', value: autoSync, toggle: onToggleAutoSync, icon: <RefreshCw size={11} style={{ color: C.textMut }} /> },
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
