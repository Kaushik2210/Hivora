import Link from 'next/link'
import { brand } from '@hivora/shared/brand'
import { ArrowRight, Bot, GitBranch, Lock, Users, Code2, Cpu } from 'lucide-react'
import { HowItWorks, Demo, Stats, Testimonials, FAQ, TrustLogos } from '@/components/sections'

const features = [
  { icon: Bot, title: 'Multi-Agent Orchestration', desc: 'Coordinate multiple AI agents on shared tasks with intelligent scheduling and conflict resolution.' },
  { icon: Lock, title: 'Symbol-Level Locking', desc: 'Prevent conflicts with granular per-symbol locks. Agents work in parallel without stepping on each other.' },
  { icon: GitBranch, title: 'Git-Native Workflows', desc: 'Every change is tracked. Branch, merge, and review AI-generated code just like human PRs.' },
  { icon: Users, title: 'Real-Time Team Board', desc: 'See what every agent and human is working on. Reassign tasks, resolve conflicts, monitor progress live.' },
  { icon: Code2, title: 'Cloud & Local Modes', desc: 'Use the cloud dashboard for teams, or go fully local for sensitive projects. Your data, your control.' },
  { icon: Cpu, title: 'MCP Protocol', desc: 'All agents communicate via the Model Context Protocol — open standard, no vendor lock-in.' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-brand)_0%,transparent_60%)] opacity-15 animate-gradient-shift" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--color-brand)]/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-brand-light)]/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <div className="animate-fade-in-up">
            <h1 className="bg-gradient-to-br from-white to-[var(--color-text-muted)] bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent sm:text-6xl">
              Coordinate Multiple AI Agents Like a Team
            </h1>
          </div>
          <p className="mt-6 text-lg text-[var(--color-text-muted)] sm:text-xl animate-fade-in-up delay-1">
            {brand.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up delay-2">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 animate-pulse-glow">
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link href="/download" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-all hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-brand)]">
              Download Desktop App
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Logos */}
      <TrustLogos />

      {/* How It Works */}
      <HowItWorks />

      {/* Features */}
      <section id="features" className="border-t border-[var(--color-border)] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to orchestrate AI</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--color-text-muted)]">
            From solo developers to enterprise teams, Hivora provides the infrastructure for reliable multi-agent collaboration.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 transition-all hover:border-[var(--color-brand)]">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)] group-hover:bg-[var(--color-brand)] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Demo */}
      <Demo />

      {/* Stats */}
      <Stats />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <FAQ />

      {/* CTA */}
      <section className="border-t border-[var(--color-border)] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to orchestrate?</h2>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Join developers who use Hivora to coordinate AI agents on real projects. Free to start, scales with your team.
          </p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110">
            Create Free Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  )
}
