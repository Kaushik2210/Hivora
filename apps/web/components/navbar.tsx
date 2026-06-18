'use client'

import Link from 'next/link'
import { brand } from '@hivora/shared/brand'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/download', label: 'Download' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-sm font-bold text-white">H</span>
          {brand.displayName}
        </Link>

        <div className="hidden items-center gap-8 sm:flex">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]">
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            Sign In
          </Link>
        </div>

        <button className="sm:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--color-border)] px-4 pb-4 pt-2 sm:hidden">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="block py-2 text-sm text-[var(--color-text-muted)]" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="mt-2 block rounded-lg bg-[var(--color-brand)] px-4 py-2 text-center text-sm font-semibold text-white">
            Sign In
          </Link>
        </div>
      )}
    </nav>
  )
}
