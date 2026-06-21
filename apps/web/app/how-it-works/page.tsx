import type { Metadata } from 'next'
import { LayoutPanelLeft, Cpu, Lock, Users, GitBranch, Zap } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'How It Works — Hivora' }

const steps = [
  {
    number: '01',
    icon: LayoutPanelLeft,
    title: 'Open the Workspace',
    description: 'Download Hivora and open a project folder. The multi-panel workspace launches instantly — no config files, no MCP setup required to get started.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Add AI Panels, Pick Models',
    description: 'Hit "+ Panel" and select any AI model: Claude Opus 4, GPT-4o, Gemini 2.5, Groq, Mistral, DeepSeek and more. Each panel is a fully independent AI session. Add up to 4 panels side by side.',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Type — They All Work at Once',
    description: 'Give each panel a different task. One refactors the backend, one builds the UI, one writes tests. All three run simultaneously — no turns, no waiting. Use / for slash commands, @ to mention a specific panel.',
  },
  {
    number: '04',
    icon: Lock,
    title: 'Orchestrator Prevents Conflicts',
    description: 'The moment an AI mentions a file, the orchestrator quietly acquires a symbol-level lock. Other panels that need the same file wait their turn automatically. You never see a merge conflict.',
  },
  {
    number: '05',
    icon: Users,
    title: 'Invite Teammates',
    description: 'Click "Invite" to copy a room link. Teammates open it and join the live workspace — they see your panels, add their own, and the orchestrator keeps every agent and every human coordinated in real time.',
  },
  {
    number: '06',
    icon: GitBranch,
    title: 'Code Stays Clean',
    description: 'Every change flows through your local git. The built-in file explorer lets you review, edit, and save directly. Locks release automatically when a panel finishes, so the next agent can take over immediately.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">How Hivora Works</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">
            Multiple AIs coding in parallel on the same project — with zero merge conflicts and zero manual coordination.
          </p>
        </div>

        {/* Steps grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 hover:border-[var(--color-brand)] transition-all duration-300">
                <div className="text-2xl font-bold text-[var(--color-brand)]">{step.number}</div>
                <div className="mt-3 h-10 w-10 rounded-lg bg-[var(--color-brand)]/20 flex items-center justify-center">
                  <Icon size={22} className="text-[var(--color-brand)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>

        {/* Problem & Solution */}
        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8">
            <h2 className="text-xl font-bold text-red-400 mb-4">The Old Way</h2>
            <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
              <li className="flex gap-3">
                <span className="text-red-400 font-bold mt-0.5">✗</span>
                <span>One AI at a time — the others wait while you context-switch</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400 font-bold mt-0.5">✗</span>
                <span>Copy-paste between Claude, ChatGPT, Gemini — no shared context</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400 font-bold mt-0.5">✗</span>
                <span>File conflicts when two tools touch the same code</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400 font-bold mt-0.5">✗</span>
                <span>Teammates can't see what your AI is doing until you commit</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-8">
            <h2 className="text-xl font-bold text-green-400 mb-4">The Hivora Way</h2>
            <ul className="space-y-3 text-sm text-[var(--color-text-muted)]">
              <li className="flex gap-3">
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                <span>Multiple AIs running simultaneously — 3× the output, same time</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                <span>One workspace, every model — no more tab-switching</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                <span>Symbol-level locking — agents queue, never collide</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                <span>Invite link — teammates join live and add their own panels</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Supported models strip */}
        <div className="mt-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8">
          <h2 className="text-xl font-bold mb-2">17 Models, One Workspace</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Every panel can run a different model. Mix and match for the best result on each task.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Claude Opus 4',      logo: '/logos/claude.svg',   color: '#D97757' },
              { name: 'Claude Sonnet 4.6',  logo: '/logos/claude.svg',   color: '#D97757' },
              { name: 'GPT-4o',             logo: '/logos/openai.svg',   color: '#10a37f' },
              { name: 'GPT-4o Mini',        logo: '/logos/openai.svg',   color: '#10a37f' },
              { name: 'Gemini 2.5 Flash',   logo: '/logos/gemini.svg',   color: '#4285F4' },
              { name: 'Gemini 2.5 Pro',     logo: '/logos/gemini.svg',   color: '#4285F4' },
              { name: 'Llama 3.3 70B',      logo: '/logos/groq.svg',     color: '#F55036' },
              { name: 'Mistral Large',       logo: '/logos/mistral.svg',  color: '#FF7000' },
              { name: 'Grok 3',             logo: '/logos/xai.svg',      color: '#1DA1F2' },
              { name: 'DeepSeek Chat',      logo: '/logos/deepseek.svg', color: '#4F46E5' },
              { name: 'DeepSeek R1',        logo: '/logos/deepseek.svg', color: '#4F46E5' },
              { name: 'Llama 3.1 405B',     logo: '/logos/together.svg', color: '#7C3AED' },
            ].map(m => (
              <div key={m.name} className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                <img src={m.logo} alt={m.name} className="w-5 h-5 rounded-sm flex-shrink-0" />
                <span className="text-xs font-medium text-[var(--color-text-muted)] truncate">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8">
          <h2 className="text-xl font-bold mb-6">Use Cases</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-[var(--color-brand)] mb-2">Solo Developer</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Run Claude on backend, GPT-4o on frontend, Gemini on tests — all at once. Ship in hours, not days.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-brand)] mb-2">Small Team</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Each teammate adds panels to the shared workspace. Human + AI work side by side with full visibility.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-brand)] mb-2">Model Comparison</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Give the same task to Claude and GPT-4o simultaneously. Pick the better output without waiting.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-brand)] mb-2">Startup Sprint</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Parallelize everything. Four panels, four tasks, one project. Compress a week of work into a day.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">Ready to run multiple AIs on your project?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/download" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110">
              Download Desktop App
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-all hover:bg-[var(--color-surface-elevated)]">
              Create Free Account
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
