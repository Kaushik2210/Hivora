'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { brand } from '@hivora/shared/brand'
import { createApiClient, logout, getTokens } from '@/lib/auth'
import { FolderKanban, Bot, Lock, Plus, LogOut, Download, Key, Play } from 'lucide-react'

type Project = { id: string; name: string; createdAt: string; _count?: { tasks: number; agents: number } }

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tokens = getTokens()
    if (!tokens) { router.push('/login'); return }

    const client = createApiClient()
    client.me().then(user => {
      if (!user) { router.push('/login'); return }
      return client.listOrganizations().then(orgs => {
        if (orgs.length === 0) return
        return client.listProjects(orgs[0].id).then(setProjects)
      })
    }).catch(() => router.push('/login')).finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (loading) return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 animate-shimmer rounded-lg" />
          <div className="mt-2 h-4 w-64 animate-shimmer rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 animate-shimmer rounded-lg" />
          <div className="h-10 w-10 animate-shimmer rounded-lg" />
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-shimmer rounded-lg" />
              <div className="flex-1">
                <div className="h-8 w-16 animate-shimmer rounded-lg" />
                <div className="mt-1 h-3 w-20 animate-shimmer rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 mb-4 h-6 w-32 animate-shimmer rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5">
            <div className="h-5 w-32 animate-shimmer rounded-lg" />
            <div className="mt-2 h-3 w-24 animate-shimmer rounded-lg" />
            <div className="mt-4 flex gap-4">
              <div className="h-3 w-16 animate-shimmer rounded-lg" />
              <div className="h-3 w-16 animate-shimmer rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Manage your {brand.displayName} projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/projects/new')} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110">
            <Plus size={16} /> New Project
          </button>
          <button onClick={handleLogout} className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-elevated)]" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5">
          <div className="flex items-center gap-3">
            <FolderKanban size={20} className="text-[var(--color-brand)]" />
            <div>
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Projects</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5">
          <div className="flex items-center gap-3">
            <Bot size={20} className="text-[var(--color-brand)]" />
            <div>
              <p className="text-2xl font-bold">{projects.reduce((s, p) => s + (p._count?.agents ?? 0), 0)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Agents</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-[var(--color-brand)]" />
            <div>
              <p className="text-2xl font-bold">{projects.reduce((s, p) => s + (p._count?.tasks ?? 0), 0)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Tasks</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold">Projects</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map(p => (
          <button key={p.id} onClick={() => router.push(`/projects/${p.id}`)} className="group text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 transition-all hover:border-[var(--color-brand)]">
            <h3 className="font-semibold group-hover:text-[var(--color-brand)]">{p.name}</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{new Date(p.createdAt).toLocaleDateString()}</p>
            <div className="mt-4 flex gap-4 text-xs text-[var(--color-text-muted)]">
              <span>{p._count?.tasks ?? 0} tasks</span>
              <span>{p._count?.agents ?? 0} agents</span>
            </div>
          </button>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full">
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center">
              <FolderKanban size={40} className="mx-auto text-[var(--color-text-muted)]" />
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">No projects yet. Create your first project to get started.</p>
            </div>
            {/* Onboarding guide */}
            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              {[
                { icon: Download, step: '1', title: 'Download Desktop App', desc: 'Install Hivora on your machine for local orchestration.' },
                { icon: Key, step: '2', title: 'Sign In or Register', desc: 'Create an account to enable cloud sync and team features.' },
                { icon: Plus, step: '3', title: 'Create a Project', desc: 'Start a new orchestration project and invite your agents.' },
                { icon: Play, step: '4', title: 'Run Your First Task', desc: 'Assign tasks to agents and watch them collaborate in real time.' },
              ].map(item => (
                <div key={item.step} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 text-center transition-all hover:border-[var(--color-brand)]">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] text-sm font-bold">{item.step}</div>
                  <item.icon size={20} className="mx-auto mt-3 text-[var(--color-brand)]" />
                  <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
