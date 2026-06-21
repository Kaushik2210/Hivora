'use client'

import Link from 'next/link'
import { brand } from '@hivora/shared/brand'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'

const links = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/platforms', label: 'Platforms' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/download', label: 'Download' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setOpen(false) }, [pathname])

  const isActive = (href: string) => pathname === href

  return (
    <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${
      scrolled
        ? 'border-[var(--color-border)] bg-[var(--color-surface)]/90 shadow-[0_1px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl'
        : 'border-transparent bg-transparent'
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
          <Image src="/logo.svg" alt={brand.displayName} width={32} height={32} className="rounded-lg" />
          <span className="hidden sm:inline text-base font-bold tracking-tight">{brand.displayName}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 sm:flex">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isActive(l.href)
                  ? 'text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
              }`}>
              {l.label}
              {isActive(l.href) && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[var(--color-brand)]" />
              )}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/login"
            className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]">
            Sign In
          </Link>
          <Link href="/register"
            className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_16px_rgba(37,99,235,0.4)]">
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="sm:hidden rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text)]"
          onClick={() => setOpen(v => !v)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`overflow-hidden transition-all duration-200 sm:hidden ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl">
          {/* Nav links — 2×2 grid */}
          <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-2">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-center ${
                  isActive(l.href)
                    ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand-light)]'
                    : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
                }`}>
                {l.label}
              </Link>
            ))}
          </div>
          {/* Auth buttons — full width, separated */}
          <div className="border-t border-[var(--color-border)] px-4 pb-4 pt-3 flex flex-col gap-2">
            <Link href="/login"
              className="block rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]">
              Sign In
            </Link>
            <Link href="/register"
              className="block rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-center text-sm font-semibold text-white transition-all hover:brightness-110">
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
