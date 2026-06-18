import { useEffect, useState } from 'react'
import { Lock, FileCode, Clock } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface LockItem {
  id?: string
  file: string
  symbol: string
  agentId: string
  lockedAt: string | number
}

export function LockManager({ projectId = 'default' }: { projectId?: string }) {
  const [locks, setLocks] = useState<LockItem[]>([])
  useEffect(() => {
    let socket: Socket | undefined

    async function fetchLocks() {
      try {
        const res = await fetch(`/api/projects/${projectId}/locks`, { credentials: 'include' })
        const body = await res.json()
        if (!body || body.error) return
        setLocks(body.data || [])
      } catch (e) {
        // ignore
      }
    }

    fetchLocks()

    try {
      socket = io()
      socket.on('connect', () => {
        // no-op
      })
      socket.on('event', (ev: any) => {
        if (!ev || ev.projectId !== projectId) return
        if (ev.type === 'lock:acquired') {
          setLocks((s) => [ev.payload, ...s.filter((l) => !(l.file === ev.payload.file && l.symbol === ev.payload.symbol))])
        } else if (ev.type === 'lock:released') {
          setLocks((s) => s.filter((l) => !(l.file === ev.payload.file && l.symbol === ev.payload.symbol)))
        }
      })
    } catch (e) {
      // ignore
    }

    return () => {
      if (socket) socket.disconnect()
    }
  }, [projectId])

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Lock size={18} />
        Active Locks ({locks.length})
      </h2>
      <div className="space-y-2">
        {locks.length === 0 ? (
          <p className="text-sm text-slate-500">No active locks</p>
        ) : (
          locks.map((lock, i) => (
            <div key={lock.id ?? i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
              <div className="bg-amber-100 text-amber-700 p-1 rounded">
                <FileCode size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{lock.symbol}</div>
                <div className="text-xs text-slate-500 truncate">{lock.file}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(lock.lockedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
