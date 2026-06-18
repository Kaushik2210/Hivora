import type { Metadata } from 'next'
import { CheckCircle2, Code2, Cloud, GitBranch, Settings, Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Supported Platforms' }

const platforms = [
  {
    name: 'Claude (Anthropic)',
    category: 'AI Agent',
    icon: '🤖',
    status: 'beta',
    integration: 'API-based',
    description: 'Full symbol-level locking support with auto-coordination.',
    features: ['Real-time coordination', 'Symbol-level locks', 'Git integration', 'Type-aware locking'],
  },
  {
    name: 'GitHub Copilot',
    category: 'VSCode Extension',
    icon: '⚡',
    status: 'beta',
    integration: 'LSP Protocol',
    description: 'Seamless integration via VSCode extension. Native IDE experience.',
    features: ['In-editor coordination', 'Auto-detection of locks', 'Live status sidebar', 'Conflict prevention'],
  },
  {
    name: 'Cursor',
    category: 'AI IDE',
    icon: '✏️',
    status: 'beta',
    integration: 'Extension',
    description: 'Native Cursor integration for smooth multi-AI workflows.',
    features: ['Built-in agent detection', 'File-level awareness', 'Real-time sync', 'Agent switching'],
  },
  {
    name: 'OpenAI API',
    category: 'AI Service',
    icon: '🔗',
    status: 'ready',
    integration: 'HTTP API',
    description: 'Direct integration for custom AI agents and workflows.',
    features: ['Custom agents', 'Batch operations', 'Streaming support', 'Full API control'],
  },
  {
    name: 'Git / GitHub / GitLab',
    category: 'VCS',
    icon: '📦',
    status: 'ready',
    integration: 'Native',
    description: 'Git-native workflows with automatic branch coordination.',
    features: ['Auto branch creation', 'Conflict detection', 'PR automation', 'Audit trail'],
  },
  {
    name: 'VS Code',
    category: 'IDE',
    icon: '💻',
    status: 'ready',
    integration: 'Extension',
    description: 'Full VSCode integration for local and remote development.',
    features: ['Real-time board', 'Lock visualization', 'Agent sidebar', 'Command palette'],
  },
  {
    name: 'Docker',
    category: 'Deployment',
    icon: '🐳',
    status: 'ready',
    integration: 'Container',
    description: 'Run Hivora orchestrator in Docker for team deployments.',
    features: ['Container images', 'Docker Compose', 'Kubernetes ready', 'Multi-platform'],
  },
  {
    name: 'PostgreSQL',
    category: 'Database',
    icon: '🗄️',
    status: 'ready',
    integration: 'Native',
    description: 'Full database integration with automatic schema tracking.',
    features: ['Schema-aware locks', 'Migration tracking', 'Concurrent access', 'ACID compliance'],
  },
  {
    name: 'Redis',
    category: 'Cache/Queue',
    icon: '⚙️',
    status: 'ready',
    integration: 'Native',
    description: 'Real-time coordination and job queuing via Redis.',
    features: ['Lock storage', 'Pub/Sub events', 'Job queue', 'Session management'],
  },
]

export default function PlatformsPage() {
  return (
    <div className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Supported Platforms</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">
            Hivora integrates with your favorite tools and platforms. Choose your stack, we handle the coordination.
          </p>
        </div>

        {/* Filter / Status Legend */}
        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-[var(--color-text-muted)]">Production Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-[var(--color-text-muted)]">Beta</span>
          </div>
        </div>

        {/* Platforms Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 hover:border-[var(--color-brand)] transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{platform.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">{platform.category}</p>
                  </div>
                </div>
                <div
                  className={`h-2 w-2 rounded-full ${
                    platform.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
              </div>

              {/* Description */}
              <p className="text-xs text-[var(--color-text-muted)] mb-4">{platform.description}</p>

              {/* Integration Badge */}
              <div className="inline-block px-2 py-1 rounded bg-[var(--color-brand)]/20 text-xs text-[var(--color-brand)] font-mono mb-4">
                {platform.integration}
              </div>

              {/* Features */}
              <div className="space-y-2">
                {platform.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
                    <CheckCircle2 size={14} className="text-[var(--color-brand)] flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Integration Categories */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
            <div className="h-10 w-10 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center mb-3">
              <Zap size={20} className="text-[var(--color-brand)]" />
            </div>
            <h3 className="font-semibold mb-2">AI Agents</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Claude, Cursor, Copilot, and custom agents with full coordination support.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
            <div className="h-10 w-10 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center mb-3">
              <Code2 size={20} className="text-[var(--color-brand)]" />
            </div>
            <h3 className="font-semibold mb-2">IDEs & Editors</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              VS Code, Cursor, and other editors via extensions and LSP protocol.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
            <div className="h-10 w-10 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center mb-3">
              <GitBranch size={20} className="text-[var(--color-brand)]" />
            </div>
            <h3 className="font-semibold mb-2">VCS & Workflows</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Git, GitHub, GitLab with automated branch coordination and PR management.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
            <div className="h-10 w-10 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center mb-3">
              <Cloud size={20} className="text-[var(--color-brand)]" />
            </div>
            <h3 className="font-semibold mb-2">Cloud & Deployment</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Docker, Kubernetes, and cloud platforms for team deployment and scaling.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
            <div className="h-10 w-10 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center mb-3">
              <Settings size={20} className="text-[var(--color-brand)]" />
            </div>
            <h3 className="font-semibold mb-2">Infrastructure</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              PostgreSQL, Redis, and other backend services for data and messaging.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
            <div className="h-10 w-10 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center mb-3">
              <Zap size={20} className="text-[var(--color-brand)]" />
            </div>
            <h3 className="font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              WebStorm, IntelliJ IDEA, and more IDEs. Custom integrations on request.
            </p>
          </div>
        </div>

        {/* Custom Integration */}
        <div className="mt-16 rounded-lg border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/5 p-8 text-center">
          <h2 className="text-xl font-bold mb-3">Need a Custom Integration?</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4 max-w-2xl mx-auto">
            We provide a comprehensive API and SDK for building custom integrations. Contact us to discuss your specific needs.
          </p>
          <a href="/contact" className="inline-block rounded-lg border border-[var(--color-brand)] px-6 py-2 text-sm font-semibold text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 transition-all">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}
