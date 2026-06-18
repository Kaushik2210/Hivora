import type { Metadata } from 'next'
import { brand } from '@hivora/shared/brand'
import { Check, Minus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Pricing' }

const tiers = [
  {
    name: 'Free',
    price: '$0',
    desc: 'For solo developers exploring multi-AI orchestration.',
    features: ['Up to 2 projects', '5 agents per project', 'Local mode only', 'Community support', '1 user'],
  },
  {
    name: 'Pro',
    price: '$19',
    desc: 'For indie developers and small teams shipping with AI.',
    features: ['Unlimited projects', '50 agents per project', 'Cloud + Local mode', 'Real-time team board', 'Up to 5 users', 'Email support'],
    popular: true,
  },
  {
    name: 'Team',
    price: '$79',
    desc: 'For growing teams that need reliability and control.',
    features: ['Unlimited projects', 'Unlimited agents', 'Cloud + Local mode', 'Real-time team board', 'Up to 25 users', 'Priority support', 'Audit log', 'SSO (coming soon)'],
  },
]

const allFeatures = [
  { name: 'Projects', free: 'Up to 2', pro: 'Unlimited', team: 'Unlimited' },
  { name: 'Agents per project', free: '5', pro: '50', team: 'Unlimited' },
  { name: 'Cloud mode', free: <Minus size={16} />, pro: <Check size={16} />, team: <Check size={16} /> },
  { name: 'Local mode', free: <Check size={16} />, pro: <Check size={16} />, team: <Check size={16} /> },
  { name: 'Team members', free: '1', pro: 'Up to 5', team: 'Up to 25' },
  { name: 'Real-time board', free: <Minus size={16} />, pro: <Check size={16} />, team: <Check size={16} /> },
  { name: 'Audit log', free: <Minus size={16} />, pro: <Minus size={16} />, team: <Check size={16} /> },
  { name: 'Priority support', free: <Minus size={16} />, pro: <Minus size={16} />, team: <Check size={16} /> },
  { name: 'SSO', free: <Minus size={16} />, pro: <Minus size={16} />, team: 'Coming soon' },
]

export default function PricingPage() {
  return (
    <div className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Start free. Upgrade when you need more power.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {tiers.map(tier => (
            <div
              key={tier.name}
              className={`relative rounded-xl border p-8 ${
                tier.popular
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5'
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
                <span className="text-4xl font-extrabold">{tier.price}</span>
                <span className="ml-1 text-sm text-[var(--color-text-muted)]">/month</span>
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
                {tier.name === 'Free' && (
                  <a href="/free-tier" className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-xs font-semibold text-[var(--color-brand)] hover:underline">
                    Learn How to Maximize Free
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise tier */}
        <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-brand)]/5 to-transparent p-8 sm:p-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Enterprise</h2>
              <p className="mt-2 text-[var(--color-text-muted)] max-w-xl">
                Dedicated infrastructure, custom SLAs, on-premise deployment, and priority engineering support for large organizations.
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
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-4 pr-8 text-left font-semibold">Feature</th>
                  <th className="py-4 px-4 text-center font-semibold">Free</th>
                  <th className="py-4 px-4 text-center font-semibold text-[var(--color-brand)]">Pro</th>
                  <th className="py-4 px-4 text-center font-semibold">Team</th>
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((f, i) => (
                  <tr key={f.name} className={`border-b border-[var(--color-border)] ${i % 2 === 0 ? 'bg-[var(--color-surface)]/30' : ''}`}>
                    <td className="py-3 pr-8 text-left font-medium">{f.name}</td>
                    <td className="py-3 px-4 text-center text-[var(--color-text-muted)]">{f.free}</td>
                    <td className="py-3 px-4 text-center text-[var(--color-text-muted)]">{f.pro}</td>
                    <td className="py-3 px-4 text-center text-[var(--color-text-muted)]">{f.team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-[var(--color-text-muted)]">
          All plans include access to the {brand.displayName} Desktop app. Billing integration coming soon — currently free during beta.
        </p>
      </div>
    </div>
  )
}
