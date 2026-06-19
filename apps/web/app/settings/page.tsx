'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createApiClient, getTokens } from '@/lib/auth'
import { Key, Eye, EyeOff, Check, Trash2, ArrowLeft, ExternalLink, Settings, Cpu, Zap } from 'lucide-react'
import { toast } from 'sonner'

type SavedKeys = Record<string, boolean>

const PROVIDERS = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    desc: 'Claude 3.5 Sonnet, Haiku, Opus',
    placeholder: 'sk-ant-api03-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    icon: '✦',
    color: 'var(--color-brand)',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    desc: 'GPT-4o, GPT-4 Turbo, GPT-3.5',
    placeholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    icon: '⬡',
    color: '#10a37f',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    desc: 'Command R+, Command R',
    placeholder: 'XxXxXxXx...',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
    icon: '◈',
    color: '#8a3ffc',
  },
] as const

export default function SettingsPage() {
  const router = useRouter()
  const [savedKeys, setSavedKeys] = useState<SavedKeys>({})
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tokens = getTokens()
    if (!tokens) { router.push('/login'); return }

    const client = createApiClient()
    client.getUserApiKeys()
      .then(keys => {
        const map: SavedKeys = {}
        keys.forEach(k => { map[k.provider] = true })
        setSavedKeys(map)
      })
      .catch(() => {
        // Silently use empty state if table not yet migrated
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (providerId: string) => {
    const key = inputs[providerId]?.trim()
    if (!key) { toast.error('Please enter an API key'); return }

    setSaving(s => ({ ...s, [providerId]: true }))
    try {
      const client = createApiClient()
      await client.saveUserApiKey(providerId, key)
      setSavedKeys(s => ({ ...s, [providerId]: true }))
      setInputs(s => ({ ...s, [providerId]: '' }))
      toast.success(`${PROVIDERS.find(p => p.id === providerId)?.name} API key saved`)
    } catch {
      toast.error('Failed to save API key')
    } finally {
      setSaving(s => ({ ...s, [providerId]: false }))
    }
  }

  const handleDelete = async (providerId: string) => {
    setSaving(s => ({ ...s, [providerId]: true }))
    try {
      const client = createApiClient()
      await client.deleteUserApiKey(providerId)
      setSavedKeys(s => ({ ...s, [providerId]: false }))
      toast.success('API key removed')
    } catch {
      toast.error('Failed to remove key')
    } finally {
      setSaving(s => ({ ...s, [providerId]: false }))
    }
  }

  if (loading) return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="h-8 w-36 animate-shimmer rounded-lg" />
      <div className="mt-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 animate-shimmer rounded-xl" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/dashboard')}
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand)]/10">
          <Settings size={20} className="text-[var(--color-brand)]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">
        Manage your AI provider API keys. Keys are stored securely and used instead of the server&apos;s shared keys.
      </p>

      {/* API Keys */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Key size={16} className="text-[var(--color-brand)]" />
          AI Provider API Keys
        </h2>

        <div className="space-y-4">
          {PROVIDERS.map(provider => (
            <div
              key={provider.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold"
                    style={{ backgroundColor: `${provider.color}18`, color: provider.color }}
                  >
                    {provider.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{provider.name}</span>
                      {savedKeys[provider.id] && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                          <Check size={10} /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{provider.desc}</p>
                  </div>
                </div>
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
                >
                  Get key <ExternalLink size={11} />
                </a>
              </div>

              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={visible[provider.id] ? 'text' : 'password'}
                    value={inputs[provider.id] ?? ''}
                    onChange={e => setInputs(s => ({ ...s, [provider.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSave(provider.id)}
                    placeholder={savedKeys[provider.id] ? '••••••••••••••••  (replace existing key)' : provider.placeholder}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 pr-10 font-mono text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
                  />
                  <button
                    onClick={() => setVisible(s => ({ ...s, [provider.id]: !s[provider.id] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    tabIndex={-1}
                  >
                    {visible[provider.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button
                  onClick={() => handleSave(provider.id)}
                  disabled={saving[provider.id] || !inputs[provider.id]?.trim()}
                  className="shrink-0 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving[provider.id] ? '...' : 'Save'}
                </button>

                {savedKeys[provider.id] && (
                  <button
                    onClick={() => handleDelete(provider.id)}
                    disabled={saving[provider.id]}
                    className="shrink-0 rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] transition-all hover:border-red-500/50 hover:text-red-500 disabled:opacity-40"
                    title="Remove key"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MCP / IDE Integration info */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Cpu size={16} className="text-[var(--color-brand)]" />
          IDE & Agent Integration
        </h2>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Connect Claude, Cursor, Cline, or any MCP-compatible agent to your Hivora project.
            Add this to your IDE&apos;s MCP configuration:
          </p>
          <pre className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-xs font-mono text-[var(--color-text-muted)] overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "hivora": {
      "command": "npx",
      "args": ["@hivora/orchestrator@latest", "start"],
      "env": {
        "HIVORA_TOKEN": "<your-api-token>",
        "HIVORA_PROJECT": "<your-project-id>",
        "HIVORA_AGENT": "<agent-name>"
      }
    }
  }
}`}
          </pre>
          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            <Zap size={12} className="inline mr-1 text-[var(--color-brand)]" />
            Get your API token from the project page → Connect Agent → copy the env vars.
          </p>
        </div>
      </section>
    </div>
  )
}
