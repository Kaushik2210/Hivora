import { brand } from '@hivora/shared/brand'

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-brand)] text-xs font-bold text-white">H</span>
              {brand.displayName}
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{brand.tagline}</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Product</h4>
            <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <a href="/pricing" className="block hover:text-[var(--color-text)]">Pricing</a>
              <a href="/download" className="block hover:text-[var(--color-text)]">Download</a>
              <a href="/docs" className="block hover:text-[var(--color-text)]">Docs</a>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <span className="block">Privacy Policy</span>
              <span className="block">Terms of Service</span>
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
