import Link from 'next/link'
import { brand } from '@hivora/shared/brand'
import { ArrowRight, LayoutPanelLeft, Lock, GitBranch, Users, Cpu, Zap } from 'lucide-react'
import { HowItWorks, Demo, Stats, Testimonials, FAQ, TrustLogos } from '@/components/sections'
import { HeroTyping } from '@/components/HeroTyping'
import { ScrollAnimation } from '@/components/ScrollAnimation'

const features = [
  { icon: LayoutPanelLeft, title: 'Multi-Panel Workspace',    desc: 'Open up to 4 AI panels side by side. Each runs a different model independently — Claude, GPT-4o, Gemini, Groq and more.' },
  { icon: Zap,             title: 'Real Streaming, No Proxy', desc: 'Hivora calls AI APIs directly with your own keys. Responses stream token-by-token with no middleman and no rate-limit sharing.' },
  { icon: Lock,            title: 'Symbol-Level Locking',     desc: 'When a panel touches a file, the orchestrator quietly acquires a lock. Other panels queue — conflicts are impossible.' },
  { icon: Users,           title: 'Team Collaboration',       desc: 'Copy an invite link and teammates join your live workspace. Everyone adds their own panels; the orchestrator keeps all in sync.' },
  { icon: Cpu,             title: '37+ Models in One Place',   desc: 'Anthropic, OpenAI, Google, Groq, Mistral, xAI, DeepSeek, Together AI, Cohere, Perplexity — all from one interface with your own keys.' },
  { icon: GitBranch,       title: 'Built-in File Explorer',   desc: 'Browse, edit, and save project files without leaving Hivora. Git branch tracked in real time; every change flows through your local repo.' },
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
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              <span className="bg-gradient-to-br from-white to-[var(--color-text-muted)] bg-clip-text text-transparent">
                Coordinate&nbsp;
              </span>
              <HeroTyping />
              <br />
              <span className="bg-gradient-to-br from-white to-[var(--color-text-muted)] bg-clip-text text-transparent">
                Like a Team
              </span>
            </h1>
          </div>
          <p className="mt-6 text-lg text-[var(--color-text-muted)] sm:text-xl animate-fade-in-up delay-1">
            {brand.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up delay-2">
            <Link href="/register" className="shimmer-btn inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_24px_rgba(37,99,235,0.5)]">
              Get Started Free <ArrowRight size={16} />
            </Link>
            <span className="hidden sm:inline text-[var(--color-text-muted)] text-sm">·</span>
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
          <ScrollAnimation>
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Everything in one workspace</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--color-text-muted)]">
              Multiple AI models, real streaming, file locking, and team collaboration — all running together without a single conflict.
            </p>
          </ScrollAnimation>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <ScrollAnimation key={f.title} delay={i * 80}>
                  <div className="group glow-card rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 transition-all hover:border-[var(--color-brand)]/50 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(37,99,235,0.12)]">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)] group-hover:bg-[var(--color-brand)] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{f.desc}</p>
                  </div>
                </ScrollAnimation>
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
          <ScrollAnimation>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Run multiple AIs today</h2>
            <p className="mt-4 text-lg text-[var(--color-text-muted)]">
              Open four panels, pick four models, and watch them code in parallel — on your project, with your API keys. Free to start.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/download" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110">
                Download Hivora <ArrowRight size={16} />
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-all hover:bg-[var(--color-surface-elevated)]">
                Create Free Account
              </Link>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </>
  )
}
