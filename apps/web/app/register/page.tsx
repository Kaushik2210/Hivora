'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { brand } from '@hivora/shared/brand'
import { register, login } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [shake, setShake]       = useState(false)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      await login(email, password)
      toast.success('Account created! Welcome to Hivora.')
      router.push('/dashboard')
    } catch (err: any) {
      const msg = err?.message ?? 'Registration failed'
      setError(msg)
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Image src="/logo.svg" alt={brand.displayName} width={40} height={40} className="mx-auto rounded-xl" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Start orchestrating with {brand.displayName}</p>
        </div>

        <form onSubmit={handleSubmit} className={`mt-8 space-y-4 ${shake ? 'animate-shake' : ''}`}>
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
              placeholder="John Doe" autoComplete="name" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
              placeholder="you@example.com" autoComplete="email" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <div className="relative mt-1">
              <input id="password" type={showPw ? 'text' : 'password'} required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2.5 pr-10 text-sm outline-none transition-all focus:border-[var(--color-brand)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
                placeholder="At least 8 characters" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Minimum 8 characters</p>
          </div>

          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(37,99,235,0.35)] disabled:opacity-50 disabled:cursor-not-allowed">
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-[var(--color-text-muted)]">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="hover:underline text-[var(--color-brand-light)]">Terms</Link> and{' '}
            <Link href="/privacy" className="hover:underline text-[var(--color-brand-light)]">Privacy Policy</Link>.
          </p>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-border)]" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--color-surface)] px-2 text-[var(--color-text-muted)]">Or sign up with</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Google', icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg> },
              { label: 'GitHub', icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg> },
            ].map(p => (
              <button key={p.label} type="button"
                onClick={() => toast.info(`${p.label} sign-up coming soon!`)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-all hover:bg-white/5 hover:text-[var(--color-text)] hover:border-[var(--color-brand)]/40">
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[var(--color-brand)] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
