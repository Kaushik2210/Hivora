'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { brand } from '@hivora/shared/brand'
import { CheckCircle, ArrowLeft } from 'lucide-react'

function ResetForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) throw new Error('Invalid or expired reset token')
      setDone(true)
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-red-400">Invalid reset link. Please request a new one.</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle size={48} className="mx-auto text-green-500" />
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">Password has been reset successfully.</p>
        <Link href="/login" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {error && <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>}
      <div>
        <label htmlFor="password" className="block text-sm font-medium">New Password</label>
        <input id="password" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
          placeholder="At least 8 characters" />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium">Confirm Password</label>
        <input id="confirm" type="password" required minLength={8} value={confirm} onChange={e => setConfirm(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
          placeholder="Repeat password" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50">
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <img src="/logo.svg" alt={brand.displayName} className="mx-auto h-10 w-10" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Set new password</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Enter your new password for {brand.displayName}.
          </p>
        </div>
        <Suspense fallback={<div className="mt-8 text-center text-sm text-[var(--color-text-muted)]">Loading...</div>}>
          <ResetForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-[var(--color-brand)] hover:underline">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
