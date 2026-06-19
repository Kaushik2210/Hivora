'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle size={48} className="mb-4 text-amber-400" />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-[var(--color-text-muted)]">
        An unexpected error occurred. Try refreshing the page or go back to the home page.
      </p>
      <div className="mt-8 flex gap-4">
        <button onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110">
          <RefreshCw size={15} /> Try again
        </button>
        <Link href="/"
          className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-surface-elevated)]">
          Go home
        </Link>
      </div>
    </div>
  )
}
