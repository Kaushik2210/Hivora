'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createApiClient, getTokens } from '@/lib/auth'

type Task = { id: string; title: string; status: string }
type Agent = { id: string; name: string; status: string }

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    if (!projectId) return
    const client = createApiClient()
    Promise.all([client.listTasks(projectId), client.listAgents(projectId)])
      .then(([t, a]) => {
        setTasks(t || [])
        setAgents(a || [])
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [projectId])

  if (!getTokens()) return <div className="p-8">You must be signed in to view this project.</div>
  if (!projectId) return <div className="p-8">Missing project id</div>

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Project</h1>
          <button onClick={() => router.back()} className="rounded px-3 py-1 border">Back</button>
        </div>

        {loading ? (
          <div className="mt-6">Loading…</div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border p-4"> 
              <h3 className="font-semibold">Tasks</h3>
              <ul className="mt-2 space-y-2">
                {tasks.map(t => <li key={t.id} className="text-sm">{t.title} <span className="text-xs text-[var(--color-text-muted)]">{t.status}</span></li>)}
              </ul>
            </div>
            <div className="rounded-xl border p-4"> 
              <h3 className="font-semibold">Agents</h3>
              <ul className="mt-2 space-y-2">
                {agents.map(a => <li key={a.id} className="text-sm">{a.name} <span className="text-xs text-[var(--color-text-muted)]">{a.status}</span></li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
