import { Lock, FileCode, Clock } from 'lucide-react'

export interface LockItem {
  file: string
  symbol: string
  agentId: string
  lockedAt: number | string
}

export function LockManager({ locks }: { locks: LockItem[] }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <Lock size={18} /> Active Locks ({locks.length})
      </h2>
      <div className="space-y-2">
        {locks.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No active locks</p>
        ) : (
          locks.map((lock, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-[var(--color-surface)] p-3">
              <div className="rounded bg-[var(--color-brand)]/10 p-1 text-[var(--color-brand)]">
                <FileCode size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{lock.symbol}</div>
                <div className="truncate text-xs text-[var(--color-text-muted)]">{lock.file}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <Clock size={10} />
                  {typeof lock.lockedAt === 'string'
                    ? new Date(lock.lockedAt).toLocaleTimeString()
                    : new Date(lock.lockedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
