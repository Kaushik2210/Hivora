import type { Metadata } from 'next'
import { brand } from '@hivora/shared/brand'
import { Check } from 'lucide-react'

export const metadata: Metadata = { title: 'Pricing' }

const tiers = [
  {
    name: 'Free',
    price: '$0',
    desc: 'For solo developers exploring multi-AI orchestration.',
    features: ['Up to 2 projects', '5 agents per project', 'Local mode only', 'Community support'],
  },
  {
    name: 'Pro',
    price: '$19',
    desc: 'For indie developers and small teams shipping with AI.',
    features: ['Unlimited projects', '50 agents per project', 'Cloud + Local mode', 'Real-time team board', 'Email support'],
    popular: true,
  },
  {
    name: 'Team',
    price: '$79',
    desc: 'For growing teams that need reliability and control.',
    features: ['Everything in Pro', 'Unlimited agents', 'Priority support', 'Audit log', 'SSO (coming soon)'],
  },
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
              <a
                href="/register"
                className={`mt-8 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  tier.popular
                    ? 'bg-[var(--color-brand)] text-white hover:brightness-110'
                    : 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-sm text-[var(--color-text-muted)]">
          All plans include access to the {brand.displayName} Desktop app. Billing integration coming soon — currently free during beta.
        </p>
      </div>
    </div>
  )
}
