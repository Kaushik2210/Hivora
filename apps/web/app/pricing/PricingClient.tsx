'use client'

import { useState } from 'react'
import { Check, Minus, ArrowRight, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { brand } from '@hivora/shared/brand'

const tiers = [
  {
    name: 'Free',
    monthly: 0,
    desc: 'For solo developers exploring multi-AI orchestration.',
    features: ['Bring your own API keys', '2 panels at once', 'Local mode', 'Up to 2 projects', '37+ AI models', 'Community support'],
  },
  {
    name: 'Pro',
    monthly: 15,
    desc: 'For indie developers shipping with multi-agent AI.',
    features: ['Everything in Free', 'Unlimited panels', 'Unlimited projects', 'Cloud + Local mode', 'Cloud API-key sync', 'Analytics dashboard', 'Email support'],
    popular: true,
  },
  {
    name: 'Team',
    monthly: 25,
    perSeat: true,
    desc: 'For teams collaborating in real time.',
    features: ['Everything in Pro', 'Real-time team board', 'Symbol-level locking', 'Invites & roles', 'Up to 25 users', 'Audit log', 'Priority support'],
  },
]

const allFeatures = [
  { name: 'Bring your own keys (no markup)', free: true, pro: true,  team: true },
  { name: 'AI models',          free: '37+',      pro: '37+',       team: '37+' },
  { name: 'Projects',           free: 'Up to 2',  pro: 'Unlimited', team: 'Unlimited' },
  { name: 'Panels at once',     free: '2',        pro: 'Unlimited', team: 'Unlimited' },
  { name: 'Local mode',         free: true,       pro: true,        team: true },
  { name: 'Cloud mode',         free: false,      pro: true,        team: true },
  { name: 'Cloud API-key sync', free: false,      pro: true,        team: true },
  { name: 'Analytics dashboard',free: false,      pro: true,        team: true },
  { name: 'Real-time board',    free: false,      pro: false,       team: true },
  { name: 'Symbol-level locking', free: false,    pro: false,       team: true },
  { name: 'Team members',       free: '1',        pro: '1',         team: 'Up to 25' },
  { name: 'Audit log',          free: false,      pro: false,       team: true },
  { name: 'Priority support',   free: false,      pro: false,       team: true },
  { name: 'SSO',                free: false,      pro: false,       team: 'Coming soon' },
]

function FeatureCell({ val }: { val: string | boolean }) {
  if (val === true)  return <Check size={16} className="mx-auto text-[var(--color-brand)]" />
  if (val === false) return <Minus size={16} className="mx-auto text-[var(--color-text-muted)] opacity-40" />
  return <span>{val as string}</span>
}

function fmt(monthly: number, annual: boolean) {
  if (monthly === 0) return '$0'
  const price = annual ? Math.round(monthly * 0.8) : monthly
  return `$${price}`
}

export function PricingClient() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Start free. Upgrade when you need more power.
          </p>

          {/* BYOK — the core differentiator vs. bundled-compute tools */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--color-brand)]">
            <KeyRound size={15} />
            Bring your own API keys — zero AI markup
          </div>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-2">
            <span className={`text-sm font-medium transition-colors ${!annual ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
                position: 'relative', transition: 'background 0.2s',
                background: annual ? 'var(--color-brand)' : 'var(--color-border)',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: 0, width: 18, height: 18, borderRadius: '50%',
                background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                transition: 'transform 0.2s',
                transform: annual ? 'translateX(23px)' : 'translateX(3px)',
              }} />
            </button>
            <span className={`text-sm font-medium transition-colors ${annual ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
              Annual
            </span>
            {annual && (
              <span className="rounded-full bg-[var(--color-brand)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--color-brand)]">
                Save 20%
              </span>
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {tiers.map(tier => (
            <div
              key={tier.name}
              className={`relative rounded-xl border p-8 transition-all ${
                tier.popular
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5 animate-pulse-glow'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)]'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-brand)] px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold">{tier.name}</h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{tier.desc}</p>
              <p className="mt-6">
                <span className="text-4xl font-extrabold transition-all">{fmt(tier.monthly, annual)}</span>
                {tier.monthly > 0 && (
                  <span className="ml-1 text-sm text-[var(--color-text-muted)]">
                    /{'perSeat' in tier && tier.perSeat ? 'user/' : ''}{annual ? 'mo, billed annually' : 'month'}
                  </span>
                )}
              </p>
              <ul className="mt-8 space-y-3">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-[var(--color-brand)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 space-y-2">
                <a
                  href="/register"
                  className={`flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    tier.popular
                      ? 'bg-[var(--color-brand)] text-white hover:brightness-110'
                      : 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
                  }`}
                >
                  Get Started
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise */}
        <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-brand)]/5 to-transparent p-8 sm:p-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Enterprise</h2>
              <p className="mt-2 text-[var(--color-text-muted)] max-w-xl">
                Dedicated infrastructure, custom SLAs, on-premise deployment, and priority engineering support.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
                <li className="flex items-center gap-2"><Check size={14} className="text-[var(--color-brand)]" /> Unlimited everything</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[var(--color-brand)]" /> On-premise / private cloud</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[var(--color-brand)]" /> Dedicated support engineer</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[var(--color-brand)]" /> Custom integrations</li>
              </ul>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-brand)] hover:bg-[var(--color-surface-elevated)] shrink-0">
              Contact Sales <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="mt-16">
          <h2 className="text-center text-2xl font-bold tracking-tight">Compare plans in detail</h2>
          <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                  <th className="py-4 px-6 text-left font-semibold">Feature</th>
                  <th className="py-4 px-4 text-center font-semibold w-28">Free</th>
                  <th className="py-4 px-4 text-center font-semibold w-28 text-[var(--color-brand)]">Pro</th>
                  <th className="py-4 px-4 text-center font-semibold w-28">Team</th>
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((f, i) => (
                  <tr key={f.name} className={`border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-elevated)] ${i % 2 === 0 ? 'bg-[var(--color-surface)]/30' : ''}`}>
                    <td className="py-3 px-6 font-medium">{f.name}</td>
                    <td className="py-3 px-4 text-center text-[var(--color-text-muted)]"><FeatureCell val={f.free} /></td>
                    <td className="py-3 px-4 text-center text-[var(--color-text-muted)]"><FeatureCell val={f.pro} /></td>
                    <td className="py-3 px-4 text-center text-[var(--color-text-muted)]"><FeatureCell val={f.team} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-[var(--color-text-muted)]">
          Every plan uses <span className="font-semibold text-[var(--color-text)]">your own provider API keys</span> — you pay each AI provider directly, with zero markup from {brand.displayName}. All plans include the Desktop app. Billing integration coming soon — currently free during beta.
        </p>
      </div>
    </div>
  )
}
