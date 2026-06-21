import { useState, useEffect, useRef, useCallback } from 'react'
import type { RealtimeEvent } from '@hivora/shared'
import {
  Send, FolderOpen, ChevronRight, ChevronDown, FileCode2,
  Save, GitBranch, X, Command, TerminalSquare,
  Plus, Cpu, StopCircle, Check, Lock, Users, ChevronLeft,
  Lightbulb, FlaskConical, Eye, GitCommit, RefreshCw,
  FileText, AtSign, Zap, Bug, Search, Activity, BarChart3, type LucideIcon,
  Bot, Brain, Mic, MicOff, Copy, RotateCcw, HelpCircle, Shield, Hand,
} from 'lucide-react'
import { C } from '../theme'
import { useRealtime } from '../hooks/useRealtime'
import { SelfHealingVisualizer, type HealingSession, type HealingAttempt } from './SelfHealingVisualizer'
import { AnalyticsDashboard, type CostSession, type AgentMode } from './AnalyticsDashboard'
import { TerminalPanel } from './TerminalPanel'
import { DiffPreviewModal, lineDiff, type FileChange } from './DiffPreviewModal'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'

const eAPI = () => (window as any).electronAPI

// ── Models ───────────────────────────────────────────────────────────────────

// ThinkingConfig defines how a model's reasoning capability works:
// - budget: user controls token budget (Anthropic Claude thinking, Gemini 2.5)
// - effort: user picks low/medium/high effort string (OpenAI o-series)
// - always: model always reasons, no user control (DeepSeek R1)
type ThinkingConfig =
  | { type: 'budget'; max: number; steps: number[] }
  | { type: 'effort' }
  | { type: 'always' }

export const WORKSPACE_MODELS = [
  // ── Anthropic ─────────────────────────────────────────────────────────────
  { id: 'claude-opus-4-8',        name: 'Claude Opus 4',          provider: 'anthropic', apiModel: 'claude-opus-4-8',                                    logo: './logos/claude.svg',    color: '#D97757', inputPrice: 15.00, outputPrice: 75.00, thinking: { type: 'budget', max: 32000, steps: [1024, 4096, 8192, 16000, 32000] } as ThinkingConfig },
  { id: 'claude-sonnet-4-6',      name: 'Claude Sonnet 4.6',      provider: 'anthropic', apiModel: 'claude-sonnet-4-6',                                  logo: './logos/claude.svg',    color: '#D97757', inputPrice: 3.00,  outputPrice: 15.00, thinking: { type: 'budget', max: 16000, steps: [1024, 4096, 8192, 16000] } as ThinkingConfig },
  { id: 'claude-haiku-4-5',       name: 'Claude Haiku 4.5',       provider: 'anthropic', apiModel: 'claude-haiku-4-5-20251001',                          logo: './logos/claude.svg',    color: '#D97757', inputPrice: 0.25,  outputPrice: 1.25,  thinking: { type: 'budget', max: 10000, steps: [1024, 4096, 10000] } as ThinkingConfig },
  { id: 'claude-3-5-sonnet',      name: 'Claude 3.5 Sonnet',      provider: 'anthropic', apiModel: 'claude-3-5-sonnet-20241022',                         logo: './logos/claude.svg',    color: '#D97757', inputPrice: 3.00,  outputPrice: 15.00, thinking: { type: 'budget', max: 16000, steps: [1024, 4096, 8192, 16000] } as ThinkingConfig },
  // ── OpenAI ────────────────────────────────────────────────────────────────
  { id: 'gpt-4o',                 name: 'GPT-4o',                 provider: 'openai',    apiModel: 'gpt-4o',                                             logo: './logos/openai.svg',    color: '#10a37f', inputPrice: 2.50,  outputPrice: 10.00 },
  { id: 'gpt-4o-mini',            name: 'GPT-4o Mini',            provider: 'openai',    apiModel: 'gpt-4o-mini',                                        logo: './logos/openai.svg',    color: '#10a37f', inputPrice: 0.15,  outputPrice: 0.60  },
  { id: 'o1',                     name: 'o1',                     provider: 'openai',    apiModel: 'o1',                                                 logo: './logos/openai.svg',    color: '#10a37f', inputPrice: 15.00, outputPrice: 60.00, thinking: { type: 'effort' } as ThinkingConfig },
  { id: 'o3-mini',                name: 'o3 Mini',                provider: 'openai',    apiModel: 'o3-mini',                                            logo: './logos/openai.svg',    color: '#10a37f', inputPrice: 1.10,  outputPrice: 4.40,  thinking: { type: 'effort' } as ThinkingConfig },
  { id: 'gpt-4-turbo',            name: 'GPT-4 Turbo',            provider: 'openai',    apiModel: 'gpt-4-turbo',                                        logo: './logos/openai.svg',    color: '#10a37f', inputPrice: 10.00, outputPrice: 30.00 },
  // ── Google Gemini ─────────────────────────────────────────────────────────
  { id: 'gemini-2-5-flash',       name: 'Gemini 2.5 Flash',       provider: 'gemini',    apiModel: 'gemini-2.5-flash-preview-05-20',                     logo: './logos/gemini.svg',    color: '#4285F4', inputPrice: 0.15,  outputPrice: 0.60,  thinking: { type: 'budget', max: 24576, steps: [1024, 4096, 8192, 24576] } as ThinkingConfig },
  { id: 'gemini-2-5-pro',         name: 'Gemini 2.5 Pro',         provider: 'gemini',    apiModel: 'gemini-2.5-pro-preview-06-05',                       logo: './logos/gemini.svg',    color: '#4285F4', inputPrice: 1.25,  outputPrice: 10.00, thinking: { type: 'budget', max: 32768, steps: [1024, 4096, 8192, 32768] } as ThinkingConfig },
  { id: 'gemini-1-5-pro',         name: 'Gemini 1.5 Pro',         provider: 'gemini',    apiModel: 'gemini-1.5-pro',                                     logo: './logos/gemini.svg',    color: '#4285F4', inputPrice: 1.25,  outputPrice: 5.00  },
  { id: 'gemini-1-5-flash',       name: 'Gemini 1.5 Flash',       provider: 'gemini',    apiModel: 'gemini-1.5-flash',                                   logo: './logos/gemini.svg',    color: '#4285F4', inputPrice: 0.075, outputPrice: 0.30  },
  // ── Groq (ultra-fast inference) ───────────────────────────────────────────
  { id: 'llama-3-3-70b',          name: 'Llama 3.3 70B',          provider: 'groq',      apiModel: 'llama-3.3-70b-versatile',                            logo: './logos/groq.svg',      color: '#F55036', inputPrice: 0.59,  outputPrice: 0.79  },
  { id: 'llama-3-1-8b',           name: 'Llama 3.1 8B Instant',   provider: 'groq',      apiModel: 'llama-3.1-8b-instant',                               logo: './logos/groq.svg',      color: '#F55036', inputPrice: 0.05,  outputPrice: 0.08  },
  { id: 'mixtral-8x7b',           name: 'Mixtral 8x7B',           provider: 'groq',      apiModel: 'mixtral-8x7b-32768',                                 logo: './logos/mistral.svg',   color: '#FF7000', inputPrice: 0.24,  outputPrice: 0.24  },
  { id: 'gemma2-9b',              name: 'Gemma 2 9B',             provider: 'groq',      apiModel: 'gemma2-9b-it',                                       logo: './logos/gemini.svg',    color: '#4285F4', inputPrice: 0.20,  outputPrice: 0.20  },
  // ── Mistral ───────────────────────────────────────────────────────────────
  { id: 'mistral-large',          name: 'Mistral Large',          provider: 'mistral',   apiModel: 'mistral-large-latest',                               logo: './logos/mistral.svg',   color: '#FF7000', inputPrice: 2.00,  outputPrice: 6.00  },
  { id: 'mistral-small',          name: 'Mistral Small',          provider: 'mistral',   apiModel: 'mistral-small-latest',                               logo: './logos/mistral.svg',   color: '#FF7000', inputPrice: 0.20,  outputPrice: 0.60  },
  { id: 'codestral',              name: 'Codestral',              provider: 'mistral',   apiModel: 'codestral-latest',                                   logo: './logos/mistral.svg',   color: '#FF7000', inputPrice: 1.00,  outputPrice: 3.00  },
  // ── xAI ──────────────────────────────────────────────────────────────────
  { id: 'grok-3',                 name: 'Grok 3',                 provider: 'xai',       apiModel: 'grok-3',                                             logo: './logos/xai.svg',       color: '#1DA1F2', inputPrice: 2.00,  outputPrice: 10.00 },
  { id: 'grok-3-mini',            name: 'Grok 3 Mini',            provider: 'xai',       apiModel: 'grok-3-mini',                                        logo: './logos/xai.svg',       color: '#1DA1F2', inputPrice: 0.30,  outputPrice: 0.50  },
  { id: 'grok-2',                 name: 'Grok 2',                 provider: 'xai',       apiModel: 'grok-2-latest',                                      logo: './logos/xai.svg',       color: '#1DA1F2', inputPrice: 2.00,  outputPrice: 10.00 },
  // ── DeepSeek ─────────────────────────────────────────────────────────────
  { id: 'deepseek-chat',          name: 'DeepSeek V3',            provider: 'deepseek',  apiModel: 'deepseek-chat',                                      logo: './logos/deepseek.svg',  color: '#4F46E5', inputPrice: 0.27,  outputPrice: 1.10  },
  { id: 'deepseek-reasoner',      name: 'DeepSeek R1',            provider: 'deepseek',  apiModel: 'deepseek-reasoner',                                  logo: './logos/deepseek.svg',  color: '#4F46E5', inputPrice: 0.55,  outputPrice: 2.19,  thinking: { type: 'always' } as ThinkingConfig },
  // ── Together AI ───────────────────────────────────────────────────────────
  { id: 'meta-llama-405b',        name: 'Llama 3.1 405B',         provider: 'together',  apiModel: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',      logo: './logos/together.svg',  color: '#7C3AED', inputPrice: 3.50,  outputPrice: 3.50  },
  { id: 'qwen-2-5-72b',           name: 'Qwen 2.5 72B',           provider: 'together',  apiModel: 'Qwen/Qwen2.5-72B-Instruct-Turbo',                    logo: './logos/together.svg',  color: '#7C3AED', inputPrice: 0.90,  outputPrice: 0.90  },
  { id: 'llama-3-1-70b-together', name: 'Llama 3.1 70B',          provider: 'together',  apiModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',       logo: './logos/together.svg',  color: '#7C3AED', inputPrice: 0.88,  outputPrice: 0.88  },
  // ── Cohere ───────────────────────────────────────────────────────────────
  { id: 'command-r-plus',         name: 'Command R+',             provider: 'cohere',    apiModel: 'command-r-plus',                                     logo: './logos/cohere.svg',    color: '#39594D', inputPrice: 2.50,  outputPrice: 10.00 },
  { id: 'command-r',              name: 'Command R',              provider: 'cohere',    apiModel: 'command-r',                                          logo: './logos/cohere.svg',    color: '#39594D', inputPrice: 0.50,  outputPrice: 1.50  },
  // ── Perplexity ────────────────────────────────────────────────────────────
  { id: 'sonar-large',            name: 'Sonar Large',            provider: 'perplexity',apiModel: 'llama-3.1-sonar-large-128k-online',                  logo: './logos/perplexity.svg',color: '#20808D', inputPrice: 1.00,  outputPrice: 1.00  },
  { id: 'sonar-small',            name: 'Sonar Small',            provider: 'perplexity',apiModel: 'llama-3.1-sonar-small-128k-online',                  logo: './logos/perplexity.svg',color: '#20808D', inputPrice: 0.20,  outputPrice: 0.20  },
  { id: 'sonar-reasoning',        name: 'Sonar Reasoning',        provider: 'perplexity',apiModel: 'llama-3.1-sonar-large-128k-online',                  logo: './logos/perplexity.svg',color: '#20808D', inputPrice: 5.00,  outputPrice: 5.00  },
  // ── Mistral (ek modeller) ─────────────────────────────────────────────────
  { id: 'mistral-nemo',           name: 'Mistral Nemo',           provider: 'mistral',   apiModel: 'open-mistral-nemo',                                  logo: './logos/mistral.svg',   color: '#FF7000', inputPrice: 0.15,  outputPrice: 0.15  },
  { id: 'pixtral-large',          name: 'Pixtral Large',          provider: 'mistral',   apiModel: 'pixtral-large-latest',                               logo: './logos/mistral.svg',   color: '#FF7000', inputPrice: 2.00,  outputPrice: 6.00  },
  // ── Together AI (ek modeller) ─────────────────────────────────────────────
  { id: 'qwen-2-5-coder-32b',     name: 'Qwen 2.5 Coder 32B',    provider: 'together',  apiModel: 'Qwen/Qwen2.5-Coder-32B-Instruct',                    logo: './logos/together.svg',  color: '#7C3AED', inputPrice: 0.80,  outputPrice: 0.80  },
  { id: 'deepseek-r1-together',   name: 'DeepSeek R1 (Together)', provider: 'together',  apiModel: 'deepseek-ai/DeepSeek-R1',                            logo: './logos/together.svg',  color: '#7C3AED', inputPrice: 8.00,  outputPrice: 8.00,  thinking: { type: 'always' } as ThinkingConfig },
]

const PROVIDER_LABEL: Record<string, string> = {
  anthropic: 'Anthropic', openai: 'OpenAI', gemini: 'Google',
  groq: 'Groq', mistral: 'Mistral', xai: 'xAI',
  deepseek: 'DeepSeek', together: 'Together', cohere: 'Cohere',
  perplexity: 'Perplexity',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMsg {
  role: 'user' | 'assistant' | 'system'
  content: string
  ts: number
  streaming?: boolean
}

type PanelMode = 'agent' | 'ask' | 'plan'
// reasoning is model-type-specific:
// - budget models (Anthropic, Gemini 2.5): 0=off, positive=token budget (e.g. 4096)
// - effort models (OpenAI o-series): 0=off, 1=low, 2=medium, 3=high
// - always-on models (DeepSeek R1): value ignored, always reasons
type Permission = 'ask' | 'auto' | 'full'

const PERM_LEVELS: { key: Permission; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { key: 'ask',  label: 'Ask permission', icon: <Hand   size={11} />, color: '#f59e0b', desc: 'Always ask before editing files or using internet' },
  { key: 'auto', label: 'Auto-approve',   icon: <Shield size={11} />, color: '#60a5fa', desc: 'Auto-approve safe-looking operations' },
  { key: 'full', label: 'Full access',    icon: <Zap    size={11} />, color: '#fb923c', desc: 'Unrestricted file and internet access' },
]

interface Panel {
  id: string
  modelId: string
  messages: ChatMsg[]
  streaming: boolean
  streamText: string
  input: string
  streamStartedAt?: number
  mode: PanelMode
  reasoning: number
  permission: Permission
  // Real token usage reported by the provider on the last completed turn
  usage?: { inputTokens: number; outputTokens: number; reasoningTokens: number }
}

interface FileLock {
  panelId: string
  modelName: string
  file: string
  color: string
  conflict?: boolean   // another developer already holds this file on the server
}

// A lock held by a *different* developer, received over the realtime channel.
interface RemoteLock {
  file: string
  symbol: string
  agentId: string
  owner: string
  color: string
}

interface FileEntry { name: string; path: string; isDir: boolean }

// ── Collaboration identity ────────────────────────────────────────────────────
// Stable per-install client id so the server can tell developers apart, plus a
// display name embedded into the lock agentId so peers can show who holds a file.
function clientId(): string {
  let id = localStorage.getItem('hivora_client_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('hivora_client_id', id) }
  return id
}
function myLockAgentId(): string {
  const name = (localStorage.getItem('hivora_user_name') || 'Guest').replace(/#/g, '')
  return `${name}#${clientId()}`
}
function lockOwnerName(agentId: string): string { return agentId.split('#')[0] || 'Birisi' }
function isMyLock(agentId: string): boolean { return agentId.endsWith(`#${clientId()}`) }

interface OnlineUser {
  socketId: string
  name: string
  initials: string
  color: string
  plan: 'free' | 'pro' | 'team'
}

function userColor(seed: string) {
  const p = ['#D97757','#10a37f','#4285F4','#F55036','#FF7000','#7C3AED','#e11d48','#0891b2']
  let h = 0
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h)
  return p[Math.abs(h) % p.length]
}

function toInitials(name: string) {
  return name.trim().split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?'
}

const PLAN_COLOR: Record<string, string> = { free: '#6b7a99', pro: '#2563eb', team: '#7C3AED' }

const TEXT_EXT  = new Set(['ts','tsx','js','jsx','mjs','cjs','json','md','txt','css','scss','html','py','go','rs','java','kt','swift','c','cpp','h','sh','yaml','yml','toml','env','prisma','sql','graphql','vue','svelte'])
const IMAGE_EXT = new Set(['png','jpg','jpeg','gif','svg','webp','ico','bmp','tiff','avif'])
const VIDEO_EXT = new Set(['mp4','webm','mov','mkv','avi'])
const AUDIO_EXT = new Set(['mp3','wav','ogg','flac','m4a','aac'])
const PDF_EXT   = new Set(['pdf'])

function fileType(path: string): 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'unknown' {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  if (TEXT_EXT.has(ext))  return 'text'
  if (IMAGE_EXT.has(ext)) return 'image'
  if (VIDEO_EXT.has(ext)) return 'video'
  if (AUDIO_EXT.has(ext)) return 'audio'
  if (PDF_EXT.has(ext))   return 'pdf'
  return 'unknown'
}

// Convert Windows backslash path to file:// URL for Electron renderer
function toFileUrl(p: string) {
  return 'file:///' + p.replace(/\\/g, '/').replace(/^\//, '')
}

const SYSTEM_PROMPT = 'You are a helpful AI coding assistant working in a collaborative multi-agent environment with Hivora. You help developers write, review, and improve code. Be concise and precise.'

// ── Small helpers ─────────────────────────────────────────────────────────────

function Tooltip({ text, children, placement = 'top' }: { text: string; children: React.ReactNode; placement?: 'top' | 'bottom' }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{ position: 'absolute', ...(placement === 'top' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }), left: '50%', transform: 'translateX(-50%)', background: '#0c1420', border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 10, color: '#c8d6e8', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 9999, boxShadow: '0 6px 20px rgba(0,0,0,0.5)' }}>
          {text}
        </div>
      )}
    </div>
  )
}

function BlinkCursor() {
  const [on, setOn] = useState(true)
  useEffect(() => { const t = setInterval(() => setOn(v => !v), 530); return () => clearInterval(t) }, [])
  return <span style={{ opacity: on ? 1 : 0, color: C.accent }}>▌</span>
}

// ── Model selector dropdown ───────────────────────────────────────────────────

function ModelSelector({ modelId, onChange }: { modelId: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [activeProvider, setActiveProvider] = useState<string>('all')
  const ref = useRef<HTMLDivElement>(null)
  const model = WORKSPACE_MODELS.find(m => m.id === modelId) ?? WORKSPACE_MODELS[0]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const providers = Array.from(new Set(WORKSPACE_MODELS.map(m => m.provider)))
  const filteredModels = activeProvider === 'all'
    ? WORKSPACE_MODELS
    : WORKSPACE_MODELS.filter(m => m.provider === activeProvider)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: `${model.color}15`, border: `1px solid ${model.color}40`, borderRadius: 7, cursor: 'pointer', color: C.text, fontSize: 11, fontWeight: 600, transition: 'all .15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = model.color}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = `${model.color}40`}
      >
        <img src={model.logo} alt={model.name} style={{ width: 16, height: 16, borderRadius: 4 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        <span>{model.name}</span>
        <ChevronDown size={11} style={{ color: C.textMut, marginLeft: 2 }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 290, background: '#0c1420', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 1000, overflow: 'hidden' }}>
          {/* Provider filter tabs */}
          <div style={{ display: 'flex', gap: 2, padding: '8px 8px 0', flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
            {['all', ...providers].map(p => {
              const hasKey = p === 'all' ? true : !!localStorage.getItem(`hivora_key_${p}`)
              const isActive = activeProvider === p
              return (
                <button key={p} onClick={() => setActiveProvider(p)}
                  style={{ padding: '2px 8px', borderRadius: 6, border: `1px solid ${isActive ? C.accent + '60' : C.border}`, background: isActive ? `${C.accent}20` : 'none', color: isActive ? C.accentLt : hasKey ? C.textDim : C.textMut, fontSize: 9, fontWeight: isActive ? 700 : 500, cursor: 'pointer', transition: 'all .1s', opacity: hasKey || p === 'all' ? 1 : 0.5 }}>
                  {p === 'all' ? 'All' : PROVIDER_LABEL[p] ?? p}
                </button>
              )
            })}
          </div>
          {/* Model list */}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filteredModels.map(m => {
              const hasKey = !!localStorage.getItem(`hivora_key_${m.provider}`)
              return (
                <button key={m.id} onClick={() => { if (hasKey) { onChange(m.id); setOpen(false) } }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: m.id === modelId ? `${m.color}15` : 'none', border: 'none', cursor: hasKey ? 'pointer' : 'not-allowed', textAlign: 'left', opacity: hasKey ? 1 : 0.38, transition: 'background .1s' }}
                  onMouseEnter={e => { if (hasKey) (e.currentTarget as HTMLElement).style.background = `${m.color}12` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = m.id === modelId ? `${m.color}15` : 'none' }}
                >
                  <img src={m.logo} alt={m.name} style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0 }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize: 9, color: C.textMut }}>{PROVIDER_LABEL[m.provider] ?? m.provider}</div>
                  </div>
                  {!hasKey && <span style={{ fontSize: 9, color: C.textMut, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 5px' }}>No key</span>}
                  {m.id === modelId && <Check size={12} style={{ color: model.color, flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Single chat panel ─────────────────────────────────────────────────────────

const SLASH_COMMANDS: Array<{ cmd: string; desc: string; Icon: LucideIcon; color: string }> = [
  { cmd: '/fix',      desc: 'Fix a bug or error',            Icon: Bug,         color: '#ef4444' },
  { cmd: '/explain',  desc: 'Explain selected code',          Icon: Lightbulb,   color: '#f59e0b' },
  { cmd: '/test',     desc: 'Write unit tests',               Icon: FlaskConical,color: '#22c55e' },
  { cmd: '/review',   desc: 'Review current diff',            Icon: Eye,         color: '#60a5fa' },
  { cmd: '/commit',   desc: 'Summarize changes to commit',    Icon: GitCommit,   color: '#a78bfa' },
  { cmd: '/refactor', desc: 'Improve code quality',           Icon: RefreshCw,   color: '#34d399' },
  { cmd: '/docs',     desc: 'Generate documentation',         Icon: FileText,    color: '#94a3b8' },
  { cmd: '/search',   desc: 'Search in codebase',             Icon: Search,      color: '#38bdf8' },
  { cmd: '/optimize', desc: 'Optimize for performance',       Icon: Zap,         color: '#facc15' },
]

interface PanelProps {
  panel: Panel
  index: number
  total: number
  allPanels: Panel[]
  folderPath: string | null
  onSend: (panelId: string, text: string) => void
  onStop: (panelId: string) => void
  onClose: (panelId: string) => void
  onModelChange: (panelId: string, modelId: string) => void
  onInputChange: (panelId: string, value: string) => void
  onModeChange: (panelId: string, mode: PanelMode) => void
  onReasoningChange: (panelId: string, reasoning: number) => void
  onPermissionChange: (panelId: string, permission: Permission) => void
  onRevert: (panelId: string, msgIndex: number) => void
  onRegenerate: (panelId: string) => void
  sessions: CostSession[]
}

// ── Context window limits (tokens) per model / provider ───────────────────────
function contextLimit(model: { id: string; provider: string }): number {
  const byId: Record<string, number> = {
    'gpt-4o': 128000, 'gpt-4o-mini': 128000, 'o1': 200000, 'o3-mini': 200000, 'gpt-4-turbo': 128000,
    'gemini-2-5-flash': 1048576, 'gemini-2-5-pro': 1048576, 'gemini-1-5-pro': 2097152, 'gemini-1-5-flash': 1048576,
    'claude-opus-4-8': 200000, 'claude-sonnet-4-6': 200000, 'claude-haiku-4-5': 200000, 'claude-3-5-sonnet': 200000,
  }
  if (byId[model.id]) return byId[model.id]
  const byProvider: Record<string, number> = {
    anthropic: 200000, openai: 128000, gemini: 1048576, groq: 128000, mistral: 128000,
    xai: 131072, deepseek: 128000, together: 128000, cohere: 128000, perplexity: 127072,
  }
  return byProvider[model.provider] ?? 128000
}

function estTokens(text: string): number { return Math.ceil(text.length / 4) }
function compactNum(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}
function compactCost(n: number): string { return n < 0.0001 ? '<$0.0001' : `$${n.toFixed(4)}` }

type AtMention = { id: string; label: string; modelName: string; index: number }

// ── File-edit card (agent diff → apply to disk) ───────────────────────────────

function FileEditCard({ edit, folderPath, modelColor, permission = 'ask' }: { edit: FileEdit; folderPath: string | null; modelColor: string; permission?: Permission }) {
  const [before, setBefore]   = useState<string | null>(null)
  const [applied, setApplied] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const absPath = joinPath(folderPath, edit.path)

  useEffect(() => {
    let alive = true
    eAPI()?.fsReadFile?.(absPath)?.then?.((r: any) => { if (alive) setBefore(r?.ok ? r.content : '') })
    return () => { alive = false }
  }, [absPath])

  const diff = before != null ? lineDiff(before, edit.content) : []
  const added = diff.filter(l => l.type === 'add').length
  const removed = diff.filter(l => l.type === 'remove').length
  const isNew = before === ''

  const apply = async () => {
    if (!folderPath) { setError('Open a project folder first'); return }
    // 'full' bypasses the allowlist; 'ask'/'auto' still check it
    if (permission !== 'full') {
      try {
        const raw = localStorage.getItem('hivora_fs_allowed')
        if (raw) {
          const allowed: string[] = JSON.parse(raw)
          if (allowed.length > 0 && !allowed.some(a => absPath.startsWith(a))) {
            setError('Path not in allowed list — add it in Files → Permissions, or switch to Full Access')
            return
          }
        }
      } catch { /* ignore parse errors */ }
    }
    const r = await eAPI()?.fsWriteFile?.(absPath, edit.content)
    if (r?.ok) { setApplied(true); setError(null) } else setError(r?.error || 'Write failed')
  }

  // Auto-apply when permission is 'auto' or 'full'
  useEffect(() => {
    if ((permission === 'auto' || permission === 'full') && !applied && folderPath && before !== null) {
      apply()
    }
  }, [permission, before, applied, folderPath]) // eslint-disable-line react-hooks/exhaustive-deps

  const btn = (bg: string, color: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6,
    border: `1px solid ${color}40`, background: bg, color, fontSize: 10, fontWeight: 700, cursor: 'pointer',
  })

  return (
    <div style={{ maxWidth: '88%', alignSelf: 'flex-start', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: `1px solid ${C.border}` }}>
        <FileCode2 size={12} style={{ color: modelColor, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{edit.path}</span>
        {isNew && <span style={{ fontSize: 8, color: '#4ade80', fontWeight: 800, letterSpacing: '0.06em' }}>NEW</span>}
        {before != null && (
          <span style={{ display: 'flex', gap: 5, fontSize: 9, fontWeight: 700 }}>
            <span style={{ color: '#4ade80' }}>+{added}</span>
            <span style={{ color: '#f87171' }}>−{removed}</span>
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
        <button onClick={() => setShowDiff(true)} disabled={before == null} style={btn(C.card, C.accentLt)}>
          <Eye size={11} /> View Diff
        </button>
        {applied ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4ade80', fontWeight: 700 }}>
            <Check size={12} /> Applied
          </span>
        ) : (
          <button onClick={apply} style={btn('#22c55e18', '#4ade80')}>
            <Check size={11} /> Apply
          </button>
        )}
        {error && <span style={{ fontSize: 9, color: '#f87171' }}>{error}</span>}
      </div>
      {showDiff && before != null && (
        <DiffPreviewModal
          change={{ file: edit.path, before, after: edit.content } as FileChange}
          onClose={() => setShowDiff(false)}
          onApprove={() => { apply(); setShowDiff(false) }}
          onReject={() => setShowDiff(false)}
        />
      )}
    </div>
  )
}

// ── Per-panel usage detail modal (click the usage chip to open) ───────────────
function PanelUsageModal({ panel, model, sessions, onClose }: {
  panel: Panel
  model: (typeof WORKSPACE_MODELS)[0]
  sessions: CostSession[]
  onClose: () => void
}) {
  const limit = contextLimit(model)
  const tc = getThinkingConfig(model)

  const msgs = panel.messages.filter(m => m.role !== 'system')
  const userMsgs = msgs.filter(m => m.role === 'user')
  const asstMsgs = msgs.filter(m => m.role === 'assistant')
  const inputText  = userMsgs.map(m => m.content).join(' ')
  const outputText = asstMsgs.map(m => m.content).join(' ')
  // Prefer real provider-reported tokens; fall back to estimate when unavailable
  const isReal     = !!panel.usage
  const inputTok   = panel.usage ? panel.usage.inputTokens  : estTokens(inputText)
  const outputTok  = panel.usage ? panel.usage.outputTokens : estTokens(outputText)
  const reasoningTok = panel.usage?.reasoningTokens ?? 0
  const contextTok = inputTok + outputTok
  const usagePct   = Math.min(100, (contextTok / limit) * 100)

  // Cumulative session totals (across all runs of this panel)
  const sessCost   = sessions.reduce((s, c) => s + c.costUsd, 0)
  const sessTok    = sessions.reduce((s, c) => s + c.promptTokens + c.completionTokens, 0)
  const runCount   = sessions.length

  // What the AI actually did: files it edited across the conversation
  const editsMap = new Map<string, number>()
  for (const m of asstMsgs) {
    for (const e of parseFileEdits(m.content)) editsMap.set(e.path, (editsMap.get(e.path) ?? 0) + 1)
  }
  const editedFiles = [...editsMap.entries()]

  // Context breakdown: assistant prose vs file-edit blocks vs user input
  const editChars = asstMsgs.reduce((s, m) => s + parseFileEdits(m.content).reduce((a, e) => a + e.content.length, 0), 0)
  const proseChars = Math.max(0, outputText.length - editChars)
  const totalChars = Math.max(1, inputText.length + outputText.length)
  const pctInput = (inputText.length / totalChars) * 100
  const pctEdit  = (editChars / totalChars) * 100
  const pctProse = (proseChars / totalChars) * 100

  const Stat = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div>
      <div style={{ fontSize: 10, color: C.textMut, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color ?? C.text }}>{value}</div>
    </div>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, animation: 'backdropIn .15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0b1220', border: `1px solid ${C.muted}`, borderRadius: 16, width: 560, maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: 'linear-gradient(135deg, #0f1c2e 0%, #0b1220 100%)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `${model.color}20`, border: `1px solid ${model.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={model.logo} alt="" style={{ width: 18, height: 18 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{model.name}</div>
            <div style={{ fontSize: 10, color: C.textMut, marginTop: 1 }}>{PROVIDER_LABEL[model.provider] ?? model.provider} · {msgs.length} mesaj · {runCount} çalıştırma</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 7 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.hover; (e.currentTarget as HTMLElement).style.color = C.text }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = C.textMut }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {/* Context usage bar */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                Bağlam Penceresi
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.04em', padding: '1px 5px', borderRadius: 4, background: isReal ? '#22c55e18' : C.card, color: isReal ? '#22c55e' : C.textMut, border: `1px solid ${isReal ? '#22c55e40' : C.border}` }}>
                  {isReal ? 'GERÇEK ÖLÇÜM' : 'TAHMİNİ'}
                </span>
              </span>
              <span style={{ fontSize: 10, color: C.textMut }}>{compactNum(contextTok)} / {compactNum(limit)} token · <span style={{ color: usagePct > 80 ? '#ef4444' : usagePct > 50 ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>%{usagePct.toFixed(1)}</span></span>
            </div>
            <div style={{ height: 8, background: C.card, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${usagePct}%`, height: '100%', background: usagePct > 80 ? 'linear-gradient(90deg,#dc2626,#ef4444)' : usagePct > 50 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius: 4, transition: 'width .4s ease' }} />
            </div>
          </div>

          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, padding: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 16 }}>
            <Stat label="Girdi Tokenleri" value={compactNum(inputTok)} />
            <Stat label="Çıktı Tokenleri" value={compactNum(outputTok)} />
            <Stat label="Toplam Token" value={compactNum(contextTok)} />
            <Stat label="Kullanıcı Mesajı" value={String(userMsgs.length)} />
            <Stat label="Asistan Mesajı" value={String(asstMsgs.length)} />
            <Stat label="Akıl Yürütme" value={reasoningTok > 0 ? compactNum(reasoningTok) : tc ? (tc.type === 'always' ? 'Açık' : tc.type === 'effort' ? reasoningLabel(tc, panel.reasoning) : panel.reasoning > 0 ? `${panel.reasoning}` : 'Kapalı') : '—'} color={reasoningTok > 0 || (tc && (tc.type === 'always' || panel.reasoning > 0)) ? '#c4b5fd' : undefined} />
            <Stat label="Oturum Tokeni" value={compactNum(sessTok)} />
            <Stat label="Çalıştırma" value={String(runCount)} />
            <Stat label="Toplam Maliyet" value={compactCost(sessCost)} color="#f59e0b" />
          </div>

          {/* Context breakdown */}
          {contextTok > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 8 }}>Bağlam Dökümü</div>
              <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${pctInput}%`, background: '#60a5fa' }} />
                <div style={{ width: `${pctProse}%`, background: '#a78bfa' }} />
                <div style={{ width: `${pctEdit}%`, background: '#22c55e' }} />
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 10, color: C.textMut, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#60a5fa' }} />Girdi %{pctInput.toFixed(0)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#a78bfa' }} />Yanıt %{pctProse.toFixed(0)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e' }} />Dosya düzenleme %{pctEdit.toFixed(0)}</span>
              </div>
            </div>
          )}

          {/* What the AI did — edited files */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 8 }}>Yapılan Değişiklikler</div>
            {editedFiles.length === 0 ? (
              <div style={{ fontSize: 11, color: C.textMut, padding: '10px 0' }}>Bu agent henüz hiçbir dosyayı düzenlemedi.</div>
            ) : (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                {editedFiles.map(([path, count], i) => (
                  <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < editedFiles.length - 1 ? `1px solid ${C.border}` : 'none', fontSize: 11 }}>
                    <FileCode2 size={13} style={{ color: model.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.textMut, background: C.card, padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{count}× düzenleme</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatPanel({ panel, index, total, allPanels, folderPath, sessions, onSend, onStop, onClose, onModelChange, onInputChange, onModeChange, onReasoningChange, onPermissionChange, onRevert, onRegenerate }: PanelProps) {
  const msgRef       = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLTextAreaElement>(null)
  const [slashMenu,  setSlashMenu]  = useState<typeof SLASH_COMMANDS | null>(null)
  const [atMenu,     setAtMenu]     = useState<AtMention[] | null>(null)
  const [listening,    setListening]    = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceErr,     setVoiceErr]      = useState<string | null>(null)
  const [copiedIdx,    setCopiedIdx]     = useState<number | null>(null)
  const [showPermMenu, setShowPermMenu] = useState(false)
  const [showUsage,    setShowUsage]    = useState(false)
  const [usageHover,   setUsageHover]   = useState(false)
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<Blob[]>([])
  const model = WORKSPACE_MODELS.find(m => m.id === panel.modelId) ?? WORKSPACE_MODELS[0]
  const tc = getThinkingConfig(model)

  // ── Voice input (record → OpenAI Whisper; works inside Electron) ────────────
  const toggleVoice = async () => {
    setVoiceErr(null)
    if (listening) { mediaRecRef.current?.stop(); return }

    const openaiKey = localStorage.getItem('hivora_key_openai')
    if (!openaiKey) { setVoiceErr('OpenAI API key required for voice (Settings → API Keys)'); return }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setListening(false)
        setTranscribing(true)
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const audio = new Uint8Array(await blob.arrayBuffer())
          const r = await eAPI()?.whisperTranscribe?.({ audio, apiKey: openaiKey, mimeType: 'audio/webm' })
          if (r?.ok && r.text) {
            const base = inputRef.current?.value ?? ''
            onInputChange(panel.id, (base ? base + ' ' : '') + r.text.trim())
          } else {
            setVoiceErr(r?.error === 'NO_OPENAI_KEY' ? 'OpenAI API key required' : (r?.error || 'Transcription failed'))
          }
        } finally { setTranscribing(false) }
      }
      mediaRecRef.current = mr
      mr.start()
      setListening(true)
    } catch {
      setListening(false)
      setVoiceErr('Microphone access denied')
    }
  }

  useEffect(() => () => { try { mediaRecRef.current?.stop() } catch { /* noop */ } }, [])

  const voiceSupported = typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices && typeof window !== 'undefined' && 'MediaRecorder' in window

  const cycleReasoning = () => {
    onReasoningChange(panel.id, cycleReasoningValue(tc, panel.reasoning))
  }

  const copyMessage = (content: string, idx: number) => {
    eAPI()?.clipboardWrite?.(content)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight
  }, [panel.messages, panel.streamText])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') { setSlashMenu(null); setAtMenu(null); return }
    if (e.key === 'Enter' && !e.shiftKey && !slashMenu && !atMenu) {
      e.preventDefault()
      if (panel.input.trim() && !panel.streaming) onSend(panel.id, panel.input)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    onInputChange(panel.id, val)
    // slash commands
    const slashMatch = val.match(/(?:^|\s)(\/\w*)$/)
    if (slashMatch) {
      const f = slashMatch[1].toLowerCase()
      const items = SLASH_COMMANDS.filter(c => c.cmd.startsWith(f))
      setSlashMenu(items.length ? items : null)
      setAtMenu(null)
      return
    }
    setSlashMenu(null)
    // @ mentions — list other panels
    const atMatch = val.match(/@(\w*)$/)
    if (atMatch) {
      const q = atMatch[1].toLowerCase()
      const others: AtMention[] = allPanels
        .filter(p => p.id !== panel.id)
        .map((p, i) => {
          const m = WORKSPACE_MODELS.find(mm => mm.id === p.modelId) ?? WORKSPACE_MODELS[0]
          return { id: p.id, label: `Agent ${i + 2}`, modelName: m.name, index: i + 2 }
        })
        .filter(a => q === '' || a.modelName.toLowerCase().includes(q) || `agent${a.index}`.includes(q))
      setAtMenu(others.length ? others : null)
    } else {
      setAtMenu(null)
    }
  }

  const applySlash = (cmd: string) => {
    const next = panel.input.replace(/(?:^|\s)(\/\w*)$/, ' ' + cmd + ' ').trimStart()
    onInputChange(panel.id, next)
    setSlashMenu(null)
    inputRef.current?.focus()
  }

  const applyAt = (mention: AtMention) => {
    const next = panel.input.replace(/@(\w*)$/, `@${mention.modelName} `)
    onInputChange(panel.id, next)
    setAtMenu(null)
    inputRef.current?.focus()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: `0 0 ${total === 1 ? '100%' : total === 2 ? 'calc(50% - 6px)' : 'calc(33.33% - 8px)'}`, minWidth: 280, borderRight: index < total - 1 ? `1px solid ${C.border}` : 'none', background: C.surface, overflow: 'hidden' }}>

      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
        <ModelSelector modelId={panel.modelId} onChange={(id) => onModelChange(panel.id, id)} />
        <div style={{ flex: 1 }} />
        {/* Usage chip — hover for quick stats, click for full breakdown */}
        {(() => {
          const limit = contextLimit(model)
          // Real provider tokens if we have them, else estimate from message text
          const ctxTok = panel.usage
            ? panel.usage.inputTokens + panel.usage.outputTokens
            : estTokens(panel.messages.filter(m => m.role !== 'system').map(m => m.content).join(' '))
          const pct = Math.min(100, (ctxTok / limit) * 100)
          const cost = sessions.reduce((s, c) => s + c.costUsd, 0)
          const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e'
          return (
            <div style={{ position: 'relative' }}
              onMouseEnter={() => setUsageHover(true)}
              onMouseLeave={() => setUsageHover(false)}>
              <button onClick={() => setShowUsage(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 7, cursor: 'pointer', background: C.card, border: `1px solid ${C.border}`, transition: 'all .15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.muted}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                <BarChart3 size={11} style={{ color: barColor }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: C.textDim }}>{compactNum(ctxTok)}</span>
                <span style={{ width: 26, height: 4, background: C.muted, borderRadius: 2, overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: barColor }} />
                </span>
              </button>
              {usageHover && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50, background: '#0b1220', border: `1px solid ${C.muted}`, borderRadius: 9, padding: '9px 11px', minWidth: 150, boxShadow: '0 12px 32px rgba(0,0,0,0.6)', pointerEvents: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 5 }}>
                    <span style={{ color: C.textMut }}>Token</span><span style={{ color: C.text, fontWeight: 700 }}>{compactNum(ctxTok)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 5 }}>
                    <span style={{ color: C.textMut }}>Kullanım</span><span style={{ color: barColor, fontWeight: 700 }}>%{pct.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 7 }}>
                    <span style={{ color: C.textMut }}>Maliyet</span><span style={{ color: '#f59e0b', fontWeight: 700 }}>{compactCost(cost)}</span>
                  </div>
                  <div style={{ fontSize: 9, color: C.textMut, textAlign: 'center', borderTop: `1px solid ${C.border}`, paddingTop: 5 }}>Detay için tıkla</div>
                </div>
              )}
            </div>
          )
        })()}
        {panel.streaming && (
          <span style={{ fontSize: 10, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1s infinite' }} />
            streaming
          </span>
        )}
        {total > 1 && (
          <button onClick={() => onClose(panel.id)}
            style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 3, display: 'flex', borderRadius: 4, transition: 'color .1s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMut}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={msgRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {panel.messages.length === 0 && !panel.streaming && (() => {
          const hasKey = !!localStorage.getItem(`hivora_key_${model.provider}`)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, color: C.textMut, textAlign: 'center', padding: '40px 20px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C.card, border: `1px solid ${model.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${model.color}20`, opacity: hasKey ? 1 : 0.4 }}>
                <img src="./logo.svg" alt="Hivora" style={{ width: 32, height: 32, borderRadius: 8 }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: hasKey ? C.textDim : '#f59e0b' }}>{model.name}</span>
              {hasKey ? (
                <span style={{ fontSize: 11, color: C.textMut, maxWidth: 220, lineHeight: 1.6 }}>
                  Ready — type a coding task below.<br />
                  <span style={{ fontSize: 10 }}>Use <b style={{ color: C.accentLt }}>/</b> for commands</span>
                </span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: 8, fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>
                    ⚠ No API key for {model.provider}
                  </div>
                  <span style={{ fontSize: 10, color: C.textMut, lineHeight: 1.5 }}>
                    Add your key in <b style={{ color: C.textDim }}>Settings → API Keys</b> to activate this agent.
                  </span>
                </div>
              )}
            </div>
          )
        })()}

        {panel.messages.filter(m => m.role !== 'system').map((msg, i, arr) => {
          const fileEdits = msg.role === 'assistant' ? parseFileEdits(msg.content) : []
          const codeLines = msg.role === 'assistant' && fileEdits.length === 0 ? countCodeLines(msg.content) : 0
          const isLastAssistant = msg.role === 'assistant' && i === arr.length - 1
          return (
          <div key={i} className="hv-msg" style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ fontSize: 9, color: C.textMut, padding: '0 4px' }}>
              {msg.role === 'user' ? 'You' : model.name}
            </div>
            <div style={{
              maxWidth: '88%', padding: '8px 12px', borderRadius: msg.role === 'user' ? '10px 10px 3px 10px' : '10px 10px 10px 3px',
              background: msg.role === 'user' ? `${C.accent}25` : C.card,
              border: `1px solid ${msg.role === 'user' ? C.accent + '40' : C.border}`,
              fontSize: 12, color: C.text, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content}
            </div>

            {/* Agent file edits → apply to disk with real diff */}
            {fileEdits.map((edit, ei) => (
              <FileEditCard key={`${i}-${ei}`} edit={edit} folderPath={folderPath} modelColor={model.color} permission={panel.permission} />
            ))}

            {/* Per-message action icons */}
            <div className="hv-msg-actions" style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 2px', opacity: 0, transition: 'opacity .15s' }}>
              {codeLines > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#3fb950', background: '#3fb95015', border: '1px solid #3fb95030', borderRadius: 5, padding: '1px 6px', marginRight: 4 }}>
                  <FileCode2 size={9} /> +{codeLines} lines
                </span>
              )}
              <Tooltip text="Copy">
                <button onClick={() => copyMessage(msg.content, i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedIdx === i ? '#3fb950' : C.textMut, display: 'flex', padding: 3, borderRadius: 4 }}>
                  {copiedIdx === i ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </Tooltip>
              {isLastAssistant && !panel.streaming && (
                <Tooltip text="Regenerate">
                  <button onClick={() => onRegenerate(panel.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, display: 'flex', padding: 3, borderRadius: 4 }}>
                    <RefreshCw size={11} />
                  </button>
                </Tooltip>
              )}
              <Tooltip text="Revert to here">
                <button onClick={() => onRevert(panel.id, i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, display: 'flex', padding: 3, borderRadius: 4 }}>
                  <RotateCcw size={11} />
                </button>
              </Tooltip>
            </div>
          </div>
          )
        })}

        {panel.streaming && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 9, color: C.textMut, padding: '0 4px' }}>{model.name}</div>
            <div style={{ maxWidth: '88%', padding: '8px 12px', borderRadius: '10px 10px 10px 3px', background: C.card, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {panel.streamText || <span style={{ color: C.textMut }}>Thinking…</span>}
              <BlinkCursor />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '8px 12px', flexShrink: 0, position: 'relative', background: C.surface }}>
        {/* @ mention popup */}
        {atMenu && atMenu.length > 0 && (
          <div style={{ position: 'absolute', bottom: '100%', left: 12, right: 12, marginBottom: 4, background: '#0c1420', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 100 }}>
            <div style={{ padding: '5px 10px 3px', fontSize: 9, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5, borderBottom: `1px solid ${C.border}` }}>
              <AtSign size={10} /> Mention Agent
            </div>
            {atMenu.map(a => {
              const m = WORKSPACE_MODELS.find(mm => mm.name === a.modelName) ?? WORKSPACE_MODELS[0]
              return (
                <button key={a.id} onClick={() => applyAt(a)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: `${m.color}18`, border: `1px solid ${m.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Cpu size={12} style={{ color: m.color }} />
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.accentLt }}>@{a.modelName}</span>
                  <span style={{ fontSize: 10, color: C.textMut }}>Agent {a.index}</span>
                </button>
              )
            })}
          </div>
        )}

        {slashMenu && slashMenu.length > 0 && (
          <div style={{ position: 'absolute', bottom: '100%', left: 12, right: 12, marginBottom: 4, background: '#0c1420', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 100 }}>
            <div style={{ padding: '5px 10px 3px', fontSize: 9, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5, borderBottom: `1px solid ${C.border}` }}>
              <Command size={10} /> Commands
            </div>
            {slashMenu.map(item => (
              <button key={item.cmd} onClick={() => applySlash(item.cmd)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
              >
                <span style={{ width: 22, height: 22, borderRadius: 6, background: `${item.color}18`, border: `1px solid ${item.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.Icon size={12} style={{ color: item.color }} />
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.accentLt, fontFamily: 'monospace', flexShrink: 0 }}>{item.cmd}</span>
                <span style={{ fontSize: 10, color: C.textMut }}>{item.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Mode / reasoning / voice toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
          {/* Agent / Ask / Plan mode toggle */}
          <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, padding: 2, gap: 2 }}>
            <Tooltip text="Agent: writes code, edits files">
              <button onClick={() => onModeChange(panel.id, 'agent')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, transition: 'all .15s',
                  background: panel.mode === 'agent' ? `${model.color}22` : 'transparent',
                  color: panel.mode === 'agent' ? model.color : C.textMut }}>
                <Bot size={11} /> Agent
              </button>
            </Tooltip>
            <Tooltip text="Ask: explains and answers questions only">
              <button onClick={() => onModeChange(panel.id, 'ask')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, transition: 'all .15s',
                  background: panel.mode === 'ask' ? `${model.color}22` : 'transparent',
                  color: panel.mode === 'ask' ? model.color : C.textMut }}>
                <HelpCircle size={11} /> Ask
              </button>
            </Tooltip>
            <Tooltip text="Spec: think first, output a structured implementation plan as a file">
              <button onClick={() => onModeChange(panel.id, 'plan')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, transition: 'all .15s',
                  background: panel.mode === 'plan' ? `${model.color}22` : 'transparent',
                  color: panel.mode === 'plan' ? model.color : C.textMut }}>
                <Lightbulb size={11} /> Spec
              </button>
            </Tooltip>
          </div>

          {/* Reasoning control — varies by model capability */}
          {tc && tc.type === 'always' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, fontSize: 10, fontWeight: 700, background: '#a78bfa22', border: '1px solid #a78bfa55', color: '#c4b5fd', userSelect: 'none' }}>
              <Brain size={11} />
              Thinks
            </span>
          ) : tc ? (() => {
            // effort models always reason → always show active; budget models active only when budget > 0
            const active = tc.type === 'effort' || panel.reasoning > 0
            return (
              <Tooltip text={reasoningTooltip(tc, panel.reasoning)}>
                <button onClick={cycleReasoning}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, cursor: 'pointer', fontSize: 10, fontWeight: 700, transition: 'all .15s',
                    background: active ? '#a78bfa22' : C.card,
                    border: `1px solid ${active ? '#a78bfa55' : C.border}`,
                    color: active ? '#c4b5fd' : C.textMut }}>
                  <Brain size={11} />
                  {reasoningLabel(tc, panel.reasoning)}
                </button>
              </Tooltip>
            )
          })() : null}

          {voiceErr && (
            <span style={{ fontSize: 9, color: '#f87171', maxWidth: 160, lineHeight: 1.3 }}>{voiceErr}</span>
          )}
        </div>

        {/* Unified input container */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'visible', transition: 'border-color .15s', position: 'relative' }}
          onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = model.color}
          onBlurCapture={e  => (e.currentTarget as HTMLElement).style.borderColor = C.border}
        >
          <textarea
            ref={inputRef}
            value={panel.input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={panel.streaming}
            placeholder={panel.mode === 'ask' ? `Ask ${model.name}…` : panel.mode === 'plan' ? `Describe the feature to spec with ${model.name}…` : `Message ${model.name}… (/ commands, @ agents)`}
            rows={1}
            style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', color: C.text, fontSize: 12, fontFamily: "'Inter',system-ui,sans-serif", lineHeight: 1.5, maxHeight: 100, overflowY: 'auto', display: 'block', boxSizing: 'border-box', padding: '8px 10px' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 100) + 'px'
            }}
          />

          {/* Bottom toolbar inside input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 6px', borderTop: `1px solid ${C.border}` }}>

            {/* Permission selector */}
            {(() => {
              const cur = PERM_LEVELS.find(p => p.key === panel.permission) ?? PERM_LEVELS[0]
              return (
                <div style={{ position: 'relative' }}>
                  <Tooltip text={cur.desc}>
                    <button onClick={() => setShowPermMenu(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: `1px solid ${cur.color}40`, background: `${cur.color}12`, cursor: 'pointer', color: cur.color, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {cur.icon} {cur.label} <ChevronDown size={9} />
                    </button>
                  </Tooltip>
                  {showPermMenu && (
                    <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, background: C.card, border: `1px solid ${C.muted}`, borderRadius: 9, padding: 4, width: 240, boxShadow: '0 8px 24px rgba(0,0,0,.7)', zIndex: 60 }}>
                      {PERM_LEVELS.map(p => (
                        <button key={p.key} onClick={() => { onPermissionChange(panel.id, p.key); setShowPermMenu(false) }}
                          style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 9px', borderRadius: 6, border: 'none', background: panel.permission === p.key ? `${p.color}14` : 'none', cursor: 'pointer', textAlign: 'left' }}>
                          <span style={{ color: p.color, marginTop: 1, flexShrink: 0 }}>{p.icon}</span>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: p.color }}>{p.label}</div>
                            <div style={{ fontSize: 9, color: C.textMut, marginTop: 1, lineHeight: 1.4 }}>{p.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            <div style={{ flex: 1 }} />

            {/* Voice input */}
            {voiceSupported && (
              <Tooltip text={transcribing ? 'Transcribing…' : listening ? 'Stop recording' : 'Voice input (Whisper)'}>
                <button onClick={toggleVoice} disabled={transcribing}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, cursor: transcribing ? 'wait' : 'pointer', transition: 'all .15s',
                    background: listening ? '#ef444422' : transcribing ? `${model.color}18` : 'none',
                    border: `1px solid ${listening ? '#ef444466' : transcribing ? model.color + '55' : C.border}`,
                    color: listening ? '#ef4444' : transcribing ? model.color : C.textMut,
                    animation: listening ? 'pulse 1.2s infinite' : 'none' }}>
                  {transcribing ? <RefreshCw size={12} className="hv-spin" /> : listening ? <MicOff size={12} /> : <Mic size={12} />}
                </button>
              </Tooltip>
            )}

            {/* Send / Stop */}
            {panel.streaming ? (
              <button onClick={() => onStop(panel.id)}
                style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#ef444420', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <StopCircle size={14} />
              </button>
            ) : (
              <button onClick={() => { if (panel.input.trim()) onSend(panel.id, panel.input) }} disabled={!panel.input.trim()}
                style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: panel.input.trim() ? 'pointer' : 'not-allowed', background: panel.input.trim() ? model.color : C.muted, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                <Send size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {showUsage && <PanelUsageModal panel={panel} model={model} sessions={sessions} onClose={() => setShowUsage(false)} />}
    </div>
  )
}

// ── File System Permissions Panel ────────────────────────────────────────────

function PermissionsPanel() {
  const [allowed, setAllowed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('hivora_fs_allowed') || '[]') } catch { return [] }
  })

  const save = (next: string[]) => {
    localStorage.setItem('hivora_fs_allowed', JSON.stringify(next))
    setAllowed(next)
  }

  const addPath = async () => {
    const p = await eAPI()?.dialogOpenFolder?.()
    if (p && !allowed.includes(p)) save([...allowed, p])
  }

  const remove = (p: string) => save(allowed.filter(x => x !== p))

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
      <div style={{ fontSize: 10, color: C.textMut, marginBottom: 10, lineHeight: 1.6 }}>
        Restrict AI file writes to specific folders.<br />
        <span style={{ color: C.accentLt }}>Empty list = all paths allowed.</span>
      </div>
      {allowed.length === 0 ? (
        <div style={{ fontSize: 10, color: '#4ade80', fontStyle: 'italic', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Check size={11} /> All paths allowed
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
          {allowed.map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6 }}>
              <Lock size={10} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 10, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p}</span>
              <button onClick={() => remove(p)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, flexShrink: 0, display: 'flex', borderRadius: 4 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#ef444420'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={addPath} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 7, cursor: 'pointer', color: C.accentLt, fontSize: 10, width: '100%', justifyContent: 'center', transition: 'all .15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = `${C.accent}30`}>
        <Plus size={11} /> Add Allowed Folder
      </button>
      <div style={{ marginTop: 10, fontSize: 9, color: C.textMut, lineHeight: 1.6 }}>
        When a folder is listed here, AI can only write files inside it. Clicking "Apply" in a diff card will be blocked for paths outside this list.
      </div>
    </div>
  )
}

// ── File Tree ─────────────────────────────────────────────────────────────────

function FileTree({ rootPath, onSelectFile, selectedFile }: { rootPath: string; onSelectFile: (p: string) => void; selectedFile: string | null }) {
  const [entries,  setEntries]  = useState<FileEntry[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [children, setChildren] = useState<Record<string, FileEntry[]>>({})

  useEffect(() => { eAPI()?.fsListDir?.(rootPath)?.then?.(setEntries) }, [rootPath])

  const toggle = async (entry: FileEntry) => {
    if (!entry.isDir) { onSelectFile(entry.path); return }
    const next = new Set(expanded)
    if (next.has(entry.path)) { next.delete(entry.path) }
    else {
      next.add(entry.path)
      if (!children[entry.path]) {
        const sub = await eAPI()?.fsListDir?.(entry.path)
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
          {entry.isDir ? (expanded.has(entry.path) ? <ChevronDown size={11} style={{ color: C.textMut, flexShrink: 0 }} /> : <ChevronRight size={11} style={{ color: C.textMut, flexShrink: 0 }} />) : <span style={{ width: 11, flexShrink: 0 }} />}
          {entry.isDir ? <FolderOpen size={12} style={{ color: C.accentLt, flexShrink: 0 }} /> : <FileCode2 size={12} style={{ color: C.textMut, flexShrink: 0 }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
        </button>
        {entry.isDir && expanded.has(entry.path) && children[entry.path] && renderEntries(children[entry.path], depth + 1)}
      </div>
    ))

  return <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>{renderEntries(entries)}</div>
}

// ── File Preview (image / video / audio / pdf / text) ─────────────────────────

function FilePreview({ filePath, onClose }: { filePath: string; onClose: () => void }) {
  const ext  = filePath.split('.').pop()?.toLowerCase() ?? ''
  const type = fileType(filePath)
  const name = filePath.split(/[\\/]/).pop() ?? filePath
  const url  = toFileUrl(filePath)

  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [zoom,    setZoom]    = useState(1)

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
      <FileCode2 size={13} style={{ color: C.accentLt, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      {imgSize && (
        <span style={{ fontSize: 10, color: C.textMut }}>{imgSize.w} × {imgSize.h}px</span>
      )}
      {type === 'image' && (
        <div style={{ display: 'flex', gap: 3 }}>
          {[0.25, 0.5, 1, 2].map(z => (
            <button key={z} onClick={() => setZoom(z)}
              style={{ padding: '2px 6px', borderRadius: 4, border: `1px solid ${zoom === z ? C.accent : C.border}`, background: zoom === z ? `${C.accent}20` : 'none', color: zoom === z ? C.accentLt : C.textMut, fontSize: 9, cursor: 'pointer' }}>
              {z === 1 ? '100%' : z === 2 ? '200%' : z === 0.5 ? '50%' : '25%'}
            </button>
          ))}
        </div>
      )}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, display: 'flex', borderRadius: 4 }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMut}>
        <X size={13} />
      </button>
    </div>
  )

  if (type === 'image') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {header}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-conic-gradient(#ffffff08 0% 25%, #00000018 0% 50%) 0 0 / 20px 20px', padding: 16 }}>
        <img src={url} alt={name}
          onLoad={e => { const el = e.currentTarget; setImgSize({ w: el.naturalWidth, h: el.naturalHeight }) }}
          style={{ maxWidth: zoom === 1 ? '100%' : undefined, width: zoom !== 1 ? `${zoom * 100}%` : undefined, imageRendering: zoom > 1 ? 'pixelated' : 'auto', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.5)', display: 'block' }}
        />
      </div>
    </div>
  )

  if (type === 'video') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {header}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', overflow: 'auto' }}>
        <video src={url} controls style={{ maxWidth: '100%', maxHeight: '100%', outline: 'none' }} />
      </div>
    </div>
  )

  if (type === 'audio') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {header}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: `${C.accent}20`, border: `1px solid ${C.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 36 }}>🎵</span>
        </div>
        <span style={{ fontSize: 13, color: C.textDim, fontWeight: 600 }}>{name}</span>
        <audio src={url} controls style={{ width: '100%', maxWidth: 360 }} />
      </div>
    </div>
  )

  if (type === 'pdf') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {header}
      <iframe src={url} style={{ flex: 1, border: 'none', background: '#fff' }} title={name} />
    </div>
  )

  if (type === 'text') return <CodeEditor filePath={filePath} onClose={onClose} />

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {header}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: C.textMut }}>
        <span style={{ fontSize: 32 }}>📄</span>
        <span style={{ fontSize: 12 }}>No preview for .{ext} files</span>
        <button onClick={() => eAPI()?.shellOpen?.(filePath)}
          style={{ padding: '6px 14px', background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 8, color: C.accentLt, fontSize: 11, cursor: 'pointer' }}>
          Open with system app
        </button>
      </div>
    </div>
  )
}

// ── Code Editor ───────────────────────────────────────────────────────────────

function CodeEditor({ filePath, onClose }: { filePath: string; onClose: () => void }) {
  const [content,  setContent]  = useState('')
  const [original, setOriginal] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    eAPI()?.fsReadFile?.(filePath)?.then?.((res: any) => {
      if (res?.ok) { setContent(res.content); setOriginal(res.content) }
    })
  }, [filePath])

  const save = async () => {
    setSaving(true)
    const res = await eAPI()?.fsWriteFile?.(filePath, content)
    setSaving(false)
    if (res?.ok) { setOriginal(content); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current!
      const s = ta.selectionStart; const end = ta.selectionEnd
      setContent(content.substring(0, s) + '  ' + content.substring(end))
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2 }, 0)
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save() }
  }

  const isDirty = content !== original
  const lines   = content.split('\n').length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 44, background: `${C.bg}cc`, borderRight: `1px solid ${C.border}`, overflowY: 'hidden', flexShrink: 0, paddingTop: 8 }}>
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} style={{ padding: '0 8px', height: '1.6em', lineHeight: '1.6em', fontSize: 11, fontFamily: 'monospace', color: C.textMut, textAlign: 'right', userSelect: 'none' }}>{i + 1}</div>
          ))}
        </div>
        <textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)} onKeyDown={handleKeyDown} spellCheck={false}
          style={{ flex: 1, background: `${C.bg}cc`, border: 'none', outline: 'none', resize: 'none', color: C.text, fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace", fontSize: 12, lineHeight: '1.6em', padding: '8px 14px', overflowY: 'auto', whiteSpace: 'pre', overflowX: 'auto' }} />
      </div>
    </div>
  )
}

// ── Orchestrator bottom bar ───────────────────────────────────────────────────

interface OrcBarProps {
  panels: Panel[]
  locks: FileLock[]
  remoteLocks: RemoteLock[]
  onlineUsers: OnlineUser[]
  myName: string
  myPlan: OnlineUser['plan']
  myInitials: string
  onKick: (socketId: string) => void
}

function OrchestratorBar({ panels, locks, remoteLocks, onlineUsers, myName, myPlan, myInitials, onKick }: OrcBarProps) {
  const streaming = panels.filter(p => p.streaming)
  // Locks only matter when coordinating with others. Solo → hide my own chips
  // (background locking still runs); only ever surface conflicts.
  const collaborating = onlineUsers.length > 0
  const visibleLocks = collaborating ? locks : locks.filter(l => l.conflict)
  const [showManage, setShowManage] = useState(false)
  const manageRef = useRef<HTMLDivElement>(null)
  const total = 1 + onlineUsers.length

  useEffect(() => {
    if (!showManage) return
    const h = (e: MouseEvent) => { if (manageRef.current && !manageRef.current.contains(e.target as Node)) setShowManage(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showManage])

  const Avatar = ({ initials, color, size = 20 }: { initials: string; color: string; size?: number }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, color: 'white', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.15)', letterSpacing: '-0.5px' }}>
      {initials}
    </div>
  )

  const PlanBadge = ({ plan }: { plan: OnlineUser['plan'] }) => (
    <span style={{ fontSize: 9, fontWeight: 700, color: PLAN_COLOR[plan] ?? '#6b7a99', background: (PLAN_COLOR[plan] ?? '#6b7a99') + '18', border: `1px solid ${(PLAN_COLOR[plan] ?? '#6b7a99')}40`, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {plan}
    </span>
  )

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, background: '#060d16', padding: '0 14px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, fontSize: 10, color: C.textMut, height: 28, position: 'relative' }}>

      {/* Left: status */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <Cpu size={10} style={{ color: C.accent }} />
        <span style={{ color: C.accentLt, fontWeight: 600 }}>Orchestrator</span>
      </span>
      <span style={{ color: C.muted }}>|</span>

      {streaming.length > 0 ? (
        streaming.map(p => {
          const m = WORKSPACE_MODELS.find(m => m.id === p.modelId)
          return (
            <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: m?.color ?? '#22c55e', animation: 'pulse 1s infinite' }} />
              <span style={{ color: m?.color ?? C.accentLt }}>{m?.name ?? 'Agent'}</span>
              <span>generating…</span>
            </span>
          )
        })
      ) : (
        <span style={{ color: C.textMut }}>All agents idle</span>
      )}

      {visibleLocks.length > 0 && (
        <>
          <span style={{ color: C.muted }}>|</span>
          {visibleLocks.map((l, i) => (
            <span key={`mine-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <Lock size={9} style={{ color: l.conflict ? '#ef4444' : '#f59e0b' }} />
              <span style={{ color: l.conflict ? '#ef4444' : '#f59e0b' }}>{l.file}</span>
              {l.conflict
                ? <span style={{ color: '#ef4444', fontWeight: 700 }}>çakışma!</span>
                : <span style={{ color: C.textMut }}>by {l.modelName}</span>}
            </span>
          ))}
        </>
      )}

      {/* Locks held by other developers (received over realtime) */}
      {remoteLocks.length > 0 && (
        <>
          <span style={{ color: C.muted }}>|</span>
          {remoteLocks.map((l, i) => (
            <Tooltip key={`remote-${i}`} text={`${l.owner} bu dosyayı kilitledi`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <Lock size={9} style={{ color: l.color }} />
                <span style={{ color: l.color }}>{l.file}</span>
                <span style={{ color: C.textMut }}>· {l.owner}</span>
              </span>
            </Tooltip>
          ))}
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Right: online users */}
      <div ref={manageRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Avatar stack */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip text={`${myName} · ${myPlan} (You)`} placement="top">
            <Avatar initials={myInitials} color="#2563eb" size={20} />
          </Tooltip>
          {onlineUsers.map((u) => (
            <Tooltip key={u.socketId} text={`${u.name} · ${u.plan}`} placement="top">
              <div style={{ marginLeft: -6 }}>
                <Avatar initials={u.initials} color={u.color} size={20} />
              </div>
            </Tooltip>
          ))}
        </div>

        <span style={{ color: total > 1 ? '#4ade80' : C.textMut, fontWeight: 600 }}>
          {total} online
        </span>

        {/* Manage button — visible when others are in the room */}
        {onlineUsers.length > 0 && (
          <button onClick={() => setShowManage(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: showManage ? `${C.accent}20` : 'none', border: `1px solid ${showManage ? C.accent + '60' : C.border}`, borderRadius: 5, cursor: 'pointer', color: showManage ? C.accentLt : C.textMut, fontSize: 10, transition: 'all .1s' }}>
            <Users size={9} /> Manage
          </button>
        )}

        {/* Manage panel */}
        {showManage && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, width: 260, background: '#0c1420', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 -8px 32px rgba(0,0,0,0.6)', overflow: 'hidden', zIndex: 999 }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={12} style={{ color: C.accentLt }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>Room Members</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: C.textMut }}>{total} online</span>
            </div>

            {/* Current user (admin) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${C.border}` }}>
              <Avatar initials={myInitials} color="#2563eb" size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myName}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', background: '#2563eb18', border: '1px solid #2563eb40', borderRadius: 4, padding: '1px 5px' }}>ADMIN</span>
                </div>
                <PlanBadge plan={myPlan} />
              </div>
            </div>

            {/* Other users */}
            {onlineUsers.map(u => (
              <div key={u.socketId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                <Avatar initials={u.initials} color={u.color} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                  <PlanBadge plan={u.plan} />
                </div>
                <button onClick={() => { onKick(u.socketId); setShowManage(false) }}
                  style={{ padding: '3px 8px', border: '1px solid #ef444440', borderRadius: 5, background: '#ef444410', color: '#ef4444', fontSize: 9, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all .1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ef444425'; (e.currentTarget as HTMLElement).style.borderColor = '#ef4444' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#ef444410'; (e.currentTarget as HTMLElement).style.borderColor = '#ef444440' }}>
                  Remove
                </button>
              </div>
            ))}

            <div style={{ padding: '6px 12px', fontSize: 9, color: C.textMut }}>
              Only you (admin) can remove members from this room.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main AgentWorkspace ───────────────────────────────────────────────────────

interface Props {
  projectId?: string
  projectName: string
}

function makePanel(modelId?: string): Panel {
  const id = modelId ?? (() => {
    const m = WORKSPACE_MODELS.find(m => !!localStorage.getItem(`hivora_key_${m.provider}`))
    return (m ?? WORKSPACE_MODELS[0]).id
  })()
  const m = WORKSPACE_MODELS.find(w => w.id === id)
  return { id: crypto.randomUUID(), modelId: id, messages: [], streaming: false, streamText: '', input: '', mode: 'agent', reasoning: defaultReasoning(m ? getThinkingConfig(m) : undefined), permission: 'ask' }
}

function getThinkingConfig(model: (typeof WORKSPACE_MODELS)[0]): ThinkingConfig | undefined {
  return (model as any).thinking as ThinkingConfig | undefined
}

// Initial reasoning value for a model: effort models always reason (start Low=1),
// budget models start off (Fast=0), always-on models ignore the value.
function defaultReasoning(tc: ThinkingConfig | undefined): number {
  return tc?.type === 'effort' ? 1 : 0
}

// Clamp a reasoning value to what's valid for a given model (used on model switch).
function normalizeReasoning(tc: ThinkingConfig | undefined, value: number): number {
  if (!tc || tc.type === 'always') return 0
  if (tc.type === 'effort') return value >= 1 && value <= 3 ? value : 1
  // budget: must be 0 (off) or one of the model's steps
  if (value === 0) return 0
  return tc.steps.includes(value) ? value : 0
}

function reasoningLabel(tc: ThinkingConfig | undefined, value: number): string {
  if (!tc || tc.type === 'always') return 'Thinks'
  if (tc.type === 'effort') {
    // effort models always reason — no Fast/off state; value 0 displays as Low
    return ['Low', 'Med', 'High'][(value || 1) - 1] ?? 'Low'
  }
  // budget: 0 = Fast (off), otherwise show token count compactly
  if (value === 0) return 'Fast'
  return value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
}

function reasoningTooltip(tc: ThinkingConfig, value: number): string {
  if (tc.type === 'always') return 'This model always reasons internally'
  if (tc.type === 'effort') {
    const level = ['low', 'medium', 'high'][(value || 1) - 1] ?? 'low'
    return `Reasoning effort: ${level} — click to cycle (this model always reasons)`
  }
  // budget
  if (value === 0) return 'Reasoning off (Fast mode) — click to enable thinking'
  return `Thinking budget: ${value} tokens — click to cycle`
}

function cycleReasoningValue(tc: ThinkingConfig | undefined, current: number): number {
  if (!tc || tc.type === 'always') return current
  // effort models always reason: cycle Low → Med → High → Low (never off)
  if (tc.type === 'effort') return (current || 1) >= 3 ? 1 : (current || 1) + 1
  // budget: cycle through [0 (off/Fast), ...steps]
  const allSteps = [0, ...tc.steps]
  const idx = allSteps.indexOf(current)
  return allSteps[(idx >= 0 ? idx + 1 : 1) % allSteps.length]
}

// System prompts per panel mode
const SYSTEM_PROMPT_AGENT = SYSTEM_PROMPT +
  '\n\nFILE EDITS: When you create or modify a file, output its COMPLETE new content in a fenced code block ' +
  'whose info string is `file:<relative/path>` — for example:\n' +
  '```file:src/utils/math.ts\n// full file contents here\n```\n' +
  'Always include the entire file, not just the changed lines. Use this format ONLY for real file changes; ' +
  'for explanations or throwaway snippets use a normal code block. The user reviews and applies each change.'
const SYSTEM_PROMPT_ASK =
  'You are a helpful AI coding assistant in Hivora, running in ASK mode. ' +
  'Answer questions, explain code, and give guidance — but do NOT rewrite entire files or produce large code dumps unless explicitly asked. ' +
  'Prefer short, focused explanations with small illustrative snippets. Be concise and precise.'
const SYSTEM_PROMPT_PLAN =
  'You are a helpful AI planning assistant in Hivora, running in PLAN mode. ' +
  'Before any implementation, think carefully and produce a clear, structured plan. ' +
  'Use numbered steps. For each step: state which file to create or modify, what changes to make, and why. ' +
  'List dependencies, risks, and open questions at the end. ' +
  'Do NOT write actual implementation code — output the plan only.\n\n' +
  'IMPORTANT: Always output your final plan as a markdown file so the user can save it:\n' +
  '```file:implementation-plan.md\n# Implementation Plan\n\n## Overview\n...\n```\n' +
  'Use this exact format so the user sees a "Save implementation-plan.md" card they can apply to disk.'

export interface FileEdit { path: string; content: string }

// Parse ```file:<path> ... ``` blocks the agent emits into actionable edits
function parseFileEdits(text: string): FileEdit[] {
  const edits: FileEdit[] = []
  const re = /```file:([^\n`]+)\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const path = m[1].trim()
    const content = m[2].replace(/\n$/, '')
    if (path) edits.push({ path, content })
  }
  return edits
}

// Join a project folder with a relative path (handles Windows + forward slashes)
function joinPath(folder: string | null, rel: string): string {
  if (!folder) return rel
  return folder.replace(/[\\/]+$/, '') + '/' + rel.replace(/^[\\/]+/, '')
}

// Count lines of code inside ``` fenced blocks of a markdown string
function countCodeLines(text: string): number {
  const blocks = text.match(/```[\s\S]*?```/g)
  if (!blocks) return 0
  return blocks.reduce((sum, b) => {
    const inner = b.replace(/```[a-zA-Z0-9]*\n?/, '').replace(/```$/, '')
    return sum + inner.split('\n').filter(l => l.trim().length > 0).length
  }, 0)
}

export function AgentWorkspace({ projectId, projectName }: Props) {
  const [panels, setPanels]           = useState<Panel[]>(() => [makePanel()])
  const [locks,  setLocks]            = useState<FileLock[]>([])
  const [remoteLocks, setRemoteLocks] = useState<RemoteLock[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [filesOpen,   setFilesOpen]   = useState(false)
  const [folderPath,  setFolderPath]  = useState<string | null>(() => localStorage.getItem('hivora_project_folder'))
  const [gitBranch,   setGitBranch]   = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)
  const [healingSession, setHealingSession] = useState<HealingSession | null>(null)
  const [showHealing, setShowHealing] = useState(false)
  const healingTimer = useRef<NodeJS.Timeout | null>(null)
  const [analyticsSessions, setAnalyticsSessions] = useState<CostSession[]>([])
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [termOpen, setTermOpen] = useState(false)
  const [filesTab, setFilesTab] = useState<'explorer' | 'permissions'>('explorer')
  // Always-fresh projectId so lock helpers used in []-deps effects don't go stale
  const projectIdRef = useRef(projectId)
  projectIdRef.current = projectId

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') { e.preventDefault(); setTermOpen(v => !v) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── CLI launch args (hivora --ask / --agent / <path>) ─────────────────────
  useEffect(() => {
    eAPI()?.onCliOpen?.((d: { mode?: string; prompt?: string; folder?: string }) => {
      if (d.folder && d.folder !== '.') {
        setFolderPath(d.folder)
        localStorage.setItem('hivora_project_folder', d.folder)
      }
      setPanels(prev => {
        if (prev.length === 0) return prev
        const [first, ...rest] = prev
        return [{
          ...first,
          mode: d.mode === 'ask' ? 'ask' : d.mode === 'agent' ? 'agent' : d.mode === 'plan' ? 'plan' : first.mode,
          input: d.prompt ?? first.input,
        }, ...rest]
      })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Git branch polling ────────────────────────────────────────────────────
  useEffect(() => {
    if (!folderPath) { setGitBranch(null); return }
    eAPI()?.gitBranch?.(folderPath)?.then?.(setGitBranch)
    const t = setInterval(() => eAPI()?.gitBranch?.(folderPath)?.then?.(setGitBranch), 10000)
    return () => clearInterval(t)
  }, [folderPath])

  // ── AI streaming listeners ─────────────────────────────────────────────────
  useEffect(() => {
    eAPI()?.onAiChunk?.((d: { panelId: string; chunk: string }) => {
      setPanels(prev => prev.map(p =>
        p.id === d.panelId ? { ...p, streaming: true, streamText: p.streamText + d.chunk } : p
      ))
    })

    eAPI()?.onAiDone?.((d: { panelId: string; usage?: { inputTokens: number; outputTokens: number; reasoningTokens: number } }) => {
      setPanels(prev => {
        const panel = prev.find(p => p.id === d.panelId)
        let newUsage: Panel['usage'] | undefined
        if (panel && panel.streamStartedAt) {
          const model = WORKSPACE_MODELS.find(m => m.id === panel.modelId) ?? WORKSPACE_MODELS[0]
          // Prefer real provider-reported usage; fall back to estimate only if absent
          const realIn  = d.usage?.inputTokens  ?? 0
          const realOut = d.usage?.outputTokens ?? 0
          const promptTokens = realIn > 0
            ? realIn
            : Math.max(1, Math.ceil(panel.messages.map(m => m.content).join(' ').split(/\s+/).filter(Boolean).length * 0.75))
          const completionTokens = realOut > 0
            ? realOut
            : Math.max(1, Math.ceil(panel.streamText.split(/\s+/).filter(Boolean).length * 0.75))
          const costUsd = (promptTokens * model.inputPrice + completionTokens * model.outputPrice) / 1_000_000
          if (d.usage && (realIn > 0 || realOut > 0)) newUsage = d.usage
          const modelTc = getThinkingConfig(model)
          const sessionMode: AgentMode = (modelTc?.type === 'always' || (modelTc != null && panel.reasoning > 0)) ? 'thinking' : 'fast'
          const session: CostSession = {
            id: crypto.randomUUID(),
            panelId: panel.id,
            modelId: model.id,
            modelName: model.name,
            provider: model.provider,
            mode: sessionMode,
            promptTokens,
            completionTokens,
            costUsd,
            durationMs: Date.now() - panel.streamStartedAt,
            timestamp: Date.now(),
          }
          setAnalyticsSessions(s => [...s, session])
        }
        return prev.map(p => {
          if (p.id !== d.panelId) return p
          const assistantMsg: ChatMsg = { role: 'assistant', content: p.streamText, ts: Date.now() }
          setLocks(ls => { releasePanelServerLocks(ls, d.panelId); return ls.filter(l => l.panelId !== d.panelId) })
          return { ...p, messages: [...p.messages, assistantMsg], streaming: false, streamText: '', streamStartedAt: undefined, usage: newUsage ?? p.usage }
        })
      })
    })

    eAPI()?.onAiError?.((d: { panelId: string; error: string }) => {
      setPanels(prev => {
        const panel = prev.find(p => p.id === d.panelId)
        if (panel && panel.streamStartedAt) {
          const model = WORKSPACE_MODELS.find(m => m.id === panel.modelId) ?? WORKSPACE_MODELS[0]
          const promptText = panel.messages.map(m => m.content).join(' ')
          const promptTokens = Math.max(1, Math.ceil(promptText.split(/\s+/).filter(Boolean).length * 0.75))
          const costUsd = (promptTokens * model.inputPrice) / 1_000_000
          const modelTcE = getThinkingConfig(model)
          const sessionModeE: AgentMode = (modelTcE?.type === 'always' || (modelTcE != null && panel.reasoning > 0)) ? 'thinking' : 'fast'
          const session: CostSession = {
            id: crypto.randomUUID(),
            panelId: panel.id,
            modelId: model.id,
            modelName: model.name,
            provider: model.provider,
            mode: sessionModeE,
            promptTokens,
            completionTokens: 0,
            costUsd,
            durationMs: Date.now() - panel.streamStartedAt,
            timestamp: Date.now(),
          }
          setAnalyticsSessions(s => [...s, session])
        }
        return prev.map(p => {
          if (p.id !== d.panelId) return p
          const errMsg: ChatMsg = { role: 'assistant', content: `⚠️ Error: ${d.error}`, ts: Date.now() }
          return { ...p, messages: [...p.messages, errMsg], streaming: false, streamText: '', streamStartedAt: undefined }
        })
      })
      setLocks(ls => { releasePanelServerLocks(ls, d.panelId); return ls.filter(l => l.panelId !== d.panelId) })
    })

    return () => { eAPI()?.removeAiListeners?.() }
  }, [])

  // ── Server lock API (best-effort; no-op when offline / not signed in) ───────
  const lockServerCall = useCallback(async (action: 'lock' | 'unlock', file: string) => {
    const pid = projectIdRef.current
    const token = localStorage.getItem('hivora_access_token')
    if (!token || !pid) return null
    const baseUrl = localStorage.getItem('hivora_server_url') || 'http://localhost:4000'
    try {
      return await eAPI()?.apiRequest?.({
        method: 'POST',
        path: `/api/projects/${pid}/locks/${action}`,
        body: { file, symbol: '*', agentId: myLockAgentId() },
        token, baseUrl,
      })
    } catch { return null }
  }, [])

  const claimServerLocks = useCallback(async (files: string[]) => {
    for (const file of files) {
      const res = await lockServerCall('lock', file)
      // Another developer already holds this file → flag the conflict locally
      if (res?.error && res.code === 'LOCK_CONFLICT') {
        setLocks(prev => prev.map(l => l.file === file ? { ...l, conflict: true } : l))
      }
    }
  }, [lockServerCall])

  const releaseServerLocks = useCallback(async (files: string[]) => {
    for (const file of files) await lockServerCall('unlock', file)
  }, [lockServerCall])

  // Release the server locks for every file a panel was holding.
  const releasePanelServerLocks = useCallback((current: FileLock[], panelId: string) => {
    const freed = [...new Set(current.filter(l => l.panelId === panelId).map(l => l.file))]
    if (freed.length) void releaseServerLocks(freed)
  }, [releaseServerLocks])

  // ── Realtime events: self-healing + cross-developer locks ──────────────────
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    if (event.type === 'agent:healing') {
      const payload = event.payload as {
        agentId: string
        taskId: string
        file?: string
        attempts: HealingAttempt[]
        status: 'running' | 'success' | 'failed'
      }
      setHealingSession({
        id: payload.taskId,
        file: payload.file,
        status: payload.status,
        attempts: payload.attempts,
        startedAt: payload.attempts[0]?.timestamp ?? Date.now(),
        endedAt: payload.status !== 'running' ? Date.now() : undefined,
      })
      setShowHealing(true)
    } else if (event.type === 'lock:acquired') {
      const p = event.payload as { file: string; symbol: string; agentId: string }
      if (isMyLock(p.agentId)) return // ignore the echo of my own lock
      setRemoteLocks(prev => [
        ...prev.filter(l => !(l.file === p.file && l.symbol === p.symbol)),
        { file: p.file, symbol: p.symbol, agentId: p.agentId, owner: lockOwnerName(p.agentId), color: userColor(p.agentId) },
      ])
    } else if (event.type === 'lock:released') {
      const p = event.payload as { file: string; symbol: string; agentId: string }
      setRemoteLocks(prev => prev.filter(l => !(l.file === p.file && l.symbol === p.symbol)))
      // a file freed up → clear any conflict flag we had on it
      setLocks(prev => prev.map(l => l.file === p.file ? { ...l, conflict: false } : l))
    }
  }, [])

  useRealtime(projectId, handleRealtimeEvent)

  // ── On join, load locks already held by other developers ───────────────────
  useEffect(() => {
    if (!projectId) return
    const token = localStorage.getItem('hivora_access_token')
    if (!token) return
    const baseUrl = localStorage.getItem('hivora_server_url') || 'http://localhost:4000'
    eAPI()?.apiRequest?.({ method: 'GET', path: `/api/projects/${projectId}/locks`, token, baseUrl })
      ?.then?.((res: any) => {
        if (!res || res.error || !Array.isArray(res.data)) return
        setRemoteLocks(res.data
          .filter((l: any) => !isMyLock(l.agentId))
          .map((l: any) => ({ file: l.file, symbol: l.symbol, agentId: l.agentId, owner: lockOwnerName(l.agentId), color: userColor(l.agentId) })))
      })
      ?.catch?.(() => {})
  }, [projectId])

  // ── Collaboration via Socket.io (gracefully degrades when backend offline) ──
  useEffect(() => {
    if (!projectId) return
    const serverUrl = localStorage.getItem('hivora_server_url') || 'http://localhost:4000'
    const token = localStorage.getItem('hivora_access_token')
    if (!token) return

    const myName = localStorage.getItem('hivora_user_name') || 'Guest'
    const myPlan = (localStorage.getItem('hivora_user_plan') || 'free') as OnlineUser['plan']

    let io: any = null
    try {
      import('socket.io-client').then(({ io: ioClient }) => {
        io = ioClient(serverUrl, { auth: { token }, query: { projectId } })
        io.on('user:joined', (data: any) => {
          const u: OnlineUser = {
            socketId: data.socketId,
            name: data.name || 'Guest',
            initials: toInitials(data.name || 'G'),
            color: userColor(data.socketId),
            plan: (data.plan || 'free') as OnlineUser['plan'],
          }
          setOnlineUsers(prev => [...prev.filter(x => x.socketId !== u.socketId), u])
        })
        io.on('user:left', (data: { socketId: string }) => {
          setOnlineUsers(prev => prev.filter(x => x.socketId !== data.socketId))
        })
        io.on('kicked', () => { io?.disconnect() })
        io.emit('subscribe:project', { projectId, user: { name: myName, plan: myPlan } })
      }).catch(() => {})
    } catch { /* skip */ }

    return () => { try { io?.disconnect() } catch {} }
  }, [projectId])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const kickUser = (socketId: string) => {
    setOnlineUsers(prev => prev.filter(u => u.socketId !== socketId))
    // If socket.io is connected, emit kick event (backend handles disconnect)
    try { (window as any).__hivora_io?.emit('kick:user', { socketId, projectId }) } catch {}
  }

  // ── Self-healing session simulation ────────────────────────────────────────
  const startHealing = (file?: string) => {
    if (healingTimer.current) { clearTimeout(healingTimer.current); healingTimer.current = null }
    const session: HealingSession = {
      id: crypto.randomUUID(),
      file,
      status: 'running',
      attempts: [{
        id: crypto.randomUUID(),
        error: 'Build failed: Type mismatch in component props',
        fix: 'Inferring correct prop types from usage…',
        status: 'attempting',
        timestamp: Date.now(),
      }],
      startedAt: Date.now(),
    }
    setHealingSession(session)
    setShowHealing(true)
    scheduleNextHealingStep(session, 1)
  }

  const scheduleNextHealingStep = (current: HealingSession, step: number) => {
    if (current.status !== 'running') return
    healingTimer.current = setTimeout(() => {
      setHealingSession(prev => {
        if (!prev || prev.id !== current.id) return prev
        const last = prev.attempts[prev.attempts.length - 1]
        const success = step % 2 === 1 // demo: first attempt succeeds
        const updatedAttempts = prev.attempts.map(a => a.id === last.id ? { ...a, status: success ? 'success' : 'failed', fix: success ? 'Applied type narrowing and re-exported interface.' : a.fix } as const : a)
        if (success || step >= 3) {
          return { ...prev, attempts: updatedAttempts, status: success ? 'success' : 'failed', endedAt: Date.now() }
        }
        const next: HealingSession = {
          ...prev,
          attempts: [
            ...updatedAttempts,
            {
              id: crypto.randomUUID(),
              error: success ? 'Subsequent lint error in hook dependency array' : 'Build failed: unresolved import path',
              fix: 'Searching compatible import and retrying…',
              status: 'attempting',
              timestamp: Date.now(),
            },
          ],
        }
        scheduleNextHealingStep(next, step + 1)
        return next
      })
    }, 2500)
  }

  useEffect(() => {
    return () => {
      if (healingTimer.current) clearTimeout(healingTimer.current)
    }
  }, [])

  const myName = localStorage.getItem('hivora_user_name') || 'You'
  const myPlan = (localStorage.getItem('hivora_user_plan') || 'free') as OnlineUser['plan']
  const myInitials = toInitials(myName)

  const addPanel = () => {
    const models = WORKSPACE_MODELS.filter(m => !!localStorage.getItem(`hivora_key_${m.provider}`))
    const existing = panels.map(p => p.modelId)
    const next = models.find(m => !existing.includes(m.id)) ?? WORKSPACE_MODELS[0]
    setPanels(prev => [...prev, makePanel(next.id)])
  }

  const removePanel = (id: string) => {
    setPanels(prev => prev.filter(p => p.id !== id))
    setLocks(ls => { releasePanelServerLocks(ls, id); return ls.filter(l => l.panelId !== id) })
  }

  const changeModel = (panelId: string, modelId: string) => {
    const newModel = WORKSPACE_MODELS.find(m => m.id === modelId)
    const newTc = newModel ? getThinkingConfig(newModel) : undefined
    setPanels(prev => prev.map(p => {
      if (p.id !== panelId) return p
      // re-clamp reasoning to the new model's capability; effort models start at Low
      const reasoning = newTc?.type === 'effort'
        ? (normalizeReasoning(newTc, p.reasoning) || 1)
        : normalizeReasoning(newTc, p.reasoning)
      return { ...p, modelId, reasoning, messages: [], streamText: '', streaming: false }
    }))
  }

  const changeInput = (panelId: string, value: string) => {
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, input: value } : p))
  }

  const changeMode = (panelId: string, mode: PanelMode) => {
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, mode } : p))
  }

  const changeReasoning = (panelId: string, reasoning: number) => {
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, reasoning } : p))
  }

  const changePermission = (panelId: string, permission: Permission) => {
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, permission } : p))
  }

  // Revert the conversation to just before a given message index (conversational undo)
  const revertTo = (panelId: string, msgIndex: number) => {
    setPanels(prev => prev.map(p => {
      if (p.id !== panelId) return p
      const visible = p.messages.filter(m => m.role !== 'system')
      const target = visible[msgIndex]
      if (!target) return p
      const cutAt = p.messages.indexOf(target)
      const restoreInput = target.role === 'user' ? target.content : p.input
      return { ...p, messages: p.messages.slice(0, cutAt), input: restoreInput, streaming: false, streamText: '' }
    }))
    eAPI()?.aiStop?.(panelId)
    setLocks(ls => { releasePanelServerLocks(ls, panelId); return ls.filter(l => l.panelId !== panelId) })
  }

  // Re-run the last user message in a panel
  const regenerate = (panelId: string) => {
    const panel = panels.find(p => p.id === panelId)
    if (!panel || panel.streaming) return
    const visible = panel.messages.filter(m => m.role !== 'system')
    const lastUser = [...visible].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    // Drop everything from the last user message onward, then resend it
    const cutAt = panel.messages.lastIndexOf(lastUser)
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, messages: p.messages.slice(0, cutAt) } : p))
    setTimeout(() => sendMessage(panelId, lastUser.content), 30)
  }

  const sendMessage = useCallback(async (panelId: string, text: string) => {
    const panel = panels.find(p => p.id === panelId)
    if (!panel) return

    const model = WORKSPACE_MODELS.find(m => m.id === panel.modelId) ?? WORKSPACE_MODELS[0]
    const apiKey = localStorage.getItem(`hivora_key_${model.provider}`)
    if (!apiKey) {
      setPanels(prev => prev.map(p => p.id === panelId ? {
        ...p,
        messages: [...p.messages, { role: 'assistant', content: `⚠️ No API key for ${model.provider}. Add it in Settings → API Keys.`, ts: Date.now() }],
        input: '',
      } : p))
      return
    }

    const userMsg: ChatMsg = { role: 'user', content: text, ts: Date.now() }
    const updatedMessages = [...panel.messages, userMsg]

    setPanels(prev => prev.map(p =>
      p.id === panelId ? { ...p, messages: updatedMessages, streaming: true, streamText: '', input: '', streamStartedAt: Date.now() } : p
    ))

    // Start self-healing visualizer for /fix commands
    if (text.trim().startsWith('/fix')) {
      const fileMention = text.match(/[\w/.-]+\.[a-z]{1,10}/g)?.[0]
      startHealing(fileMention)
    }

    // Extract file mentions for lock tracking
    const fileMentions = text.match(/[\w/.-]+\.[a-z]{1,10}/g) ?? []
    if (fileMentions.length > 0) {
      setLocks(prev => [...prev.filter(l => l.panelId !== panelId), ...fileMentions.map(f => ({
        panelId, modelName: model.name, file: f, color: model.color,
      }))])
      // Claim the files on the server so other developers see the locks & get
      // a 409 conflict if they touch the same file (best-effort, online only).
      void claimServerLocks([...new Set(fileMentions)])
    }

    const systemPrompt = panel.mode === 'ask' ? SYSTEM_PROMPT_ASK : panel.mode === 'plan' ? SYSTEM_PROMPT_PLAN : SYSTEM_PROMPT_AGENT
    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...updatedMessages.filter(m => m.role !== 'system').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    await eAPI()?.aiStream?.({
      panelId,
      messages: apiMessages,
      provider: model.provider,
      model: model.apiModel,
      apiKey,
      reasoning: getThinkingConfig(model) ? panel.reasoning : 0,
    })
  }, [panels])

  const stopStream = (panelId: string) => {
    eAPI()?.aiStop?.(panelId)
    setPanels(prev => prev.map(p => {
      if (p.id !== panelId) return p
      const partial: ChatMsg = { role: 'assistant', content: p.streamText + ' *(stopped)*', ts: Date.now() }
      return { ...p, messages: [...p.messages, partial], streaming: false, streamText: '' }
    }))
    setLocks(ls => { releasePanelServerLocks(ls, panelId); return ls.filter(l => l.panelId !== panelId) })
  }

  const pickFolder = async () => {
    const path = await eAPI()?.dialogOpenFolder?.()
    if (!path) return
    setFolderPath(path)
    localStorage.setItem('hivora_project_folder', path)
    setSelectedFile(null)
  }

  const copyInviteLink = async () => {
    const serverUrl = localStorage.getItem('hivora_server_url') || 'http://localhost:3000'
    const link = projectId ? `${serverUrl}/join/${projectId}` : serverUrl
    await eAPI()?.clipboardWrite?.(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const folderName = folderPath ? folderPath.split(/[\\/]/).pop() : null

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0, height: 44 }}>
        <Cpu size={15} style={{ color: C.accent, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{projectName || 'Workspace'}</span>

        {gitBranch && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.textMut, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, padding: '2px 7px' }}>
            <GitBranch size={10} style={{ color: C.accentLt }} />
            <span style={{ color: C.accentLt }}>{gitBranch}</span>
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Invite button */}
        <Tooltip text={copied ? 'Copied!' : 'Copy invite link'}>
          <button onClick={copyInviteLink}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', background: copied ? '#22c55e18' : C.surface, border: `1px solid ${copied ? '#22c55e40' : C.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 11, color: copied ? '#4ade80' : C.textMut, transition: 'all .15s' }}>
            {copied ? <Check size={12} /> : <Users size={12} />}
            {copied ? 'Copied!' : 'Invite'}
          </button>
        </Tooltip>

        {/* Self-healing toggle */}
        <Tooltip text={showHealing ? 'Hide self-healing visualizer' : 'Show self-healing visualizer'}>
          <button onClick={() => setShowHealing(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: showHealing ? `${C.accent}18` : C.surface, border: `1px solid ${showHealing ? C.accent + '40' : C.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 11, color: showHealing ? C.accentLt : C.textMut, transition: 'all .15s' }}>
            {healingSession?.status === 'running' ? <Activity size={12} style={{ animation: 'pulse 1s infinite' }} /> : <Activity size={12} />}
            Self-Healing
          </button>
        </Tooltip>

        {/* Analytics dashboard */}
        <Tooltip text="Cost & duration analytics">
          <button onClick={() => setShowAnalytics(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 11, color: C.textMut, transition: 'all .15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
            <BarChart3 size={12} /> Analytics
          </button>
        </Tooltip>

        {/* Files toggle */}
        <Tooltip text={filesOpen ? 'Hide files' : 'Show files'}>
          <button onClick={() => setFilesOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: filesOpen ? `${C.accent}18` : C.surface, border: `1px solid ${filesOpen ? C.accent + '40' : C.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 11, color: filesOpen ? C.accentLt : C.textMut, transition: 'all .15s' }}>
            {filesOpen ? <ChevronLeft size={12} /> : <FileCode2 size={12} />}
            {filesOpen ? 'Hide' : 'Files'}
          </button>
        </Tooltip>

        {/* Terminal toggle */}
        <Tooltip text={termOpen ? 'Hide terminal (Ctrl+`)' : 'Open terminal (Ctrl+`)'}>
          <button onClick={() => setTermOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: termOpen ? `${C.accent}18` : C.surface, border: `1px solid ${termOpen ? C.accent + '40' : C.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 11, color: termOpen ? C.accentLt : C.textMut, transition: 'all .15s' }}>
            <TerminalSquare size={12} />Terminal
          </button>
        </Tooltip>

        {/* Open folder */}
        <Tooltip text={folderPath ? `Folder: ${folderPath}` : 'Open project folder'}>
          <button onClick={pickFolder}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: folderPath ? `${C.accent}12` : C.surface, border: `1px solid ${folderPath ? C.accent + '30' : C.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 11, color: folderPath ? C.accentLt : C.textMut, transition: 'all .15s', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <FolderOpen size={12} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{folderName ?? 'Folder'}</span>
          </button>
        </Tooltip>

        {/* Add agent panel */}
        {panels.length < 4 && (
          <Tooltip text={`Add AI agent (${panels.length}/4)`}>
            <button onClick={addPanel}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: C.accent, border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'white', transition: 'all .15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
            >
              <Plus size={13} /> Add Agent
            </button>
          </Tooltip>
        )}
      </div>

      {/* ── Main area: panels + optional files ───────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <PanelGroup orientation="horizontal">
          {/* Chat panels */}
          <Panel defaultSize={filesOpen ? 75 : 100} minSize={30} style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <PanelGroup orientation="horizontal">
                {panels.map((panel, index) => [
                  <Panel key={`panel-${panel.id}`} defaultSize={100 / panels.length} minSize={20} style={{ display: 'flex' }}>
                    <ChatPanel
                      panel={panel}
                      index={index}
                      total={panels.length}
                      allPanels={panels}
                      folderPath={folderPath}
                      onSend={sendMessage}
                      onStop={stopStream}
                      onClose={removePanel}
                      onModelChange={changeModel}
                      onInputChange={changeInput}
                      onModeChange={changeMode}
                      onReasoningChange={changeReasoning}
                      onPermissionChange={changePermission}
                      onRevert={revertTo}
                      onRegenerate={regenerate}
                      sessions={analyticsSessions.filter(s => s.panelId === panel.id)}
                    />
                  </Panel>,
                  index < panels.length - 1 ? (
                    <PanelResizeHandle key={`handle-${panel.id}`} className="rph-col" style={{ width: 12, cursor: 'col-resize', background: 'transparent', position: 'relative', zIndex: 10, flexShrink: 0 }}><div className="rph-inner" /></PanelResizeHandle>
                  ) : null
                ])}
              </PanelGroup>
            </div>
          </Panel>

          {/* Files side panel handle */}
          {filesOpen && (
            <PanelResizeHandle className="rph-col" style={{ width: 12, cursor: 'col-resize', background: 'transparent', position: 'relative', zIndex: 10, flexShrink: 0 }}><div className="rph-inner" /></PanelResizeHandle>
          )}

          {/* Files side panel */}
          {filesOpen && (
            <Panel defaultSize={25} minSize={15} style={{ display: 'flex' }}>
                <div style={{ flex: 1, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.surface, overflow: 'hidden' }}>
                  {/* Files panel tab bar */}
                  <div style={{ display: 'flex', background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                    {(['explorer', 'permissions'] as const).map(tab => (
                      <button key={tab} onClick={() => setFilesTab(tab)}
                        style={{ flex: 1, padding: '7px 6px', border: 'none', borderBottom: `2px solid ${filesTab === tab ? C.accent : 'transparent'}`, background: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: filesTab === tab ? C.accentLt : C.textMut, textTransform: 'capitalize', transition: 'all .15s' }}>
                        {tab === 'permissions' ? 'Permissions' : 'Explorer'}
                      </button>
                    ))}
                    {filesTab === 'explorer' && (
                      <Tooltip text="Open folder">
                        <button onClick={pickFolder} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, display: 'flex', padding: '6px 8px', alignItems: 'center' }}>
                          <FolderOpen size={13} />
                        </button>
                      </Tooltip>
                    )}
                  </div>

            {filesTab === 'permissions' ? (
              <PermissionsPanel />
            ) : folderPath ? (
              <FileTree rootPath={folderPath} selectedFile={selectedFile}
                onSelectFile={p => setSelectedFile(p)} />
            ) : (
              <div style={{ padding: '20px 12px', textAlign: 'center' }}>
                <button onClick={pickFolder} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 8, cursor: 'pointer', color: C.accentLt, fontSize: 11, margin: '0 auto' }}>
                  <FolderOpen size={14} /> Open Project Folder
                </button>
              </div>
            )}

            {filesTab === 'explorer' && selectedFile && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <FilePreview filePath={selectedFile} onClose={() => setSelectedFile(null)} />
              </div>
            )}
                </div>
              </Panel>
          )}
        </PanelGroup>
      </div>

      {/* ── Integrated terminal ──────────────────────────────────────────────── */}
      <TerminalPanel
        open={termOpen}
        onClose={() => setTermOpen(false)}
        cwd={folderPath ?? undefined}
      />

      {/* ── Self-healing visualizer ───────────────────────────────────────────── */}
      {showHealing && (
        <SelfHealingVisualizer
          session={healingSession}
          onClose={() => setShowHealing(false)}
        />
      )}

      {/* ── Orchestrator bar ──────────────────────────────────────────────────── */}
      <OrchestratorBar
        panels={panels}
        locks={locks}
        remoteLocks={remoteLocks}
        onlineUsers={onlineUsers}
        myName={myName}
        myPlan={myPlan}
        myInitials={myInitials}
        onKick={kickUser}
      />

      {/* ── Analytics dashboard modal ─────────────────────────────────────────── */}
      {showAnalytics && (
        <AnalyticsDashboard
          sessions={analyticsSessions}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  )
}

// Legacy export for App.tsx compatibility
export type { Props as AgentWorkspaceProps }
export type { Panel as WPanel }
