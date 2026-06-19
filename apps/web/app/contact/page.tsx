'use client'

import { useState } from 'react'
import { toast, Toaster } from 'sonner'
import { Mail, Building2, ArrowRight, Loader2 } from 'lucide-react'
import { brand } from '@hivora/shared/brand'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      name:     (fd.get('name') as string).trim(),
      company:  (fd.get('company') as string).trim(),
      email:    (fd.get('email') as string).trim(),
      teamSize: fd.get('team-size') as string,
      message:  (fd.get('message') as string).trim(),
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Request failed')
      setSent(true)
      toast.success('Message sent! We\'ll get back to you within 24 hours.')
    } catch {
      toast.error('Failed to send. Please email us directly at ' + brand.email.replyTo)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-20 sm:px-6 sm:py-28">
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact Sales</h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            Tell us about your team and we&apos;ll build a plan that fits.
          </p>
        </div>

        <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8">
          {sent ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                <Mail size={24} className="text-green-400" />
              </div>
              <h3 className="text-lg font-semibold">Message received!</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                We&apos;ll get back to you at your work email within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium">Name</label>
                  <input id="name" name="name" type="text" required
                    className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
                    placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium">Company</label>
                  <input id="company" name="company" type="text" required
                    className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
                    placeholder="Company name" />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">Work Email</label>
                <input id="email" name="email" type="email" required
                  className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
                  placeholder="you@company.com" />
              </div>
              <div>
                <label htmlFor="team-size" className="block text-sm font-medium">Team Size</label>
                <select id="team-size" name="team-size"
                  className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]">
                  <option value="">Select team size</option>
                  <option value="1-5">1 – 5 engineers</option>
                  <option value="6-25">6 – 25 engineers</option>
                  <option value="26-100">26 – 100 engineers</option>
                  <option value="100+">100+ engineers</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium">How can we help?</label>
                <textarea id="message" name="message" rows={4}
                  className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
                  placeholder="Tell us about your use case, deployment requirements, or any questions..." />
              </div>
              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Sending…' : <>Send Message <ArrowRight size={16} /></>}
              </button>
            </form>
          )}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 text-center">
            <Mail size={24} className="mx-auto mb-3 text-[var(--color-brand)]" />
            <h3 className="font-semibold">Email Us</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{brand.email.replyTo}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 text-center">
            <Building2 size={24} className="mx-auto mb-3 text-[var(--color-brand)]" />
            <h3 className="font-semibold">Enterprise</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Custom deployments & SLAs</p>
          </div>
        </div>
      </div>
    </div>
  )
}
