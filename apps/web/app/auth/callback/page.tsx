'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { AuthTokens } from '@hivora/shared/types'

function AuthCallbackInner() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const at = params.get('at')
    const rt = params.get('rt')

    if (at && rt) {
      const tokens: AuthTokens = { accessToken: at, refreshToken: rt, expiresIn: 900 }
      sessionStorage.setItem('hivora_tokens', JSON.stringify(tokens))
      router.replace('/dashboard')
    } else {
      router.replace('/login?error=oauth_failed')
    }
  }, [params, router])

  return (
    <div className="flex flex-col items-center gap-4 text-[var(--color-text-muted)]">
      <Loader2 size={28} className="animate-spin text-[var(--color-brand)]" />
      <span className="text-sm">Completing sign in…</span>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4 text-[var(--color-text-muted)]">
          <Loader2 size={28} className="animate-spin text-[var(--color-brand)]" />
          <span className="text-sm">Loading…</span>
        </div>
      }>
        <AuthCallbackInner />
      </Suspense>
    </div>
  )
}
