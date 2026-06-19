import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <FileQuestion size={48} className="mb-4 text-[var(--color-text-muted)]" />
      <h1 className="text-5xl font-bold tracking-tight">404</h1>
      <p className="mt-4 text-lg font-medium">Page not found</p>
      <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/"
        className="mt-8 inline-flex items-center rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110">
        Back to Home
      </Link>
    </div>
  )
}
