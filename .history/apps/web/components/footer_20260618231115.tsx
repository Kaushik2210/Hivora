import { brand } from '@hivora/shared/brand'

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 text-lg font-bold">
              <img src="/logo.svg" alt={brand.displayName} className="h-7 w-7" />
              {brand.displayName}
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{brand.tagline}</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Product</h4>
            <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <a href="/pricing" className="block hover:text-[var(--color-text)] transition-colors">Pricing</a>
              <a href="/download" className="block hover:text-[var(--color-text)] transition-colors">Download</a>
              <a href="/contact" className="block hover:text-[var(--color-text)] transition-colors">Contact Sales</a>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <a href="/privacy" className="block hover:text-[var(--color-text)] transition-colors">Privacy Policy</a>
              <a href="/terms" className="block hover:text-[var(--color-text)] transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--color-border)] pt-6 text-center text-xs text-[var(--color-text-muted)]">
          &copy; {new Date().getFullYear()} {brand.displayName}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
