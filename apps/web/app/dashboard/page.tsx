'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { brand } from '@hivora/shared/brand'
import { createApiClient, logout, getTokens } from '@/lib/auth'
import { FolderKanban, Bot, Lock, Plus, LogOut, Download, Key, Play, Settings, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollAnimation } from '@/components/ScrollAnimation'

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
    }).catch(err => {
      toast.error('Failed to load projects. Please try again.')
      console.error(err)
      router.push('/login')
    }).finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
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
          <button onClick={() => router.push('/projects/new')} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95">
            <Plus size={16} /> New Project
          </button>
          <button
            onClick={() => {
              const tokens = getTokens()
              if (!tokens) { toast.error('Please sign in first'); return }
              const params = new URLSearchParams({ at: tokens.accessToken, rt: tokens.refreshToken })
              window.location.href = `hivora://auth?${params}`
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] hover:border-[var(--color-brand)]/50"
            title="Open in Hivora Desktop"
          >
            <Monitor size={16} /> Open in Desktop
          </button>
          <button onClick={() => router.push('/settings')} className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]" title="Settings">
            <Settings size={18} />
          </button>
          <button onClick={handleLogout} className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: FolderKanban, value: projects.length,                                            label: 'Projects' },
          { icon: Bot,          value: projects.reduce((s, p) => s + (p._count?.agents ?? 0), 0), label: 'Agents' },
          { icon: Lock,         value: projects.reduce((s, p) => s + (p._count?.tasks  ?? 0), 0), label: 'Tasks' },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 transition-all hover:border-[var(--color-brand)] hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <Icon size={20} className="text-[var(--color-brand)]" />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold">Projects</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => router.push(`/projects/${p.id}`)}
            className="group text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 transition-all hover:border-[var(--color-brand)] hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(37,99,235,0.12)] active:scale-[0.99]"
          >
            <h3 className="font-semibold group-hover:text-[var(--color-brand)] transition-colors">{p.name}</h3>
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
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                No projects yet. Create your first project to get started.
              </p>
            </div>

            {/* Onboarding guide */}
            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              {[
                { icon: Download, step: '1', title: 'Download Desktop App',   desc: 'Install Hivora on your machine for local orchestration.',     delay: 0 },
                { icon: Key,      step: '2', title: 'Sign In or Register',    desc: 'Create an account to enable cloud sync and team features.',  delay: 100 },
                { icon: Plus,     step: '3', title: 'Create a Project',       desc: 'Start a new orchestration project and invite your agents.',  delay: 200 },
                { icon: Play,     step: '4', title: 'Run Your First Task',    desc: 'Assign tasks to agents and watch them collaborate in real time.', delay: 300 },
              ].map(item => (
                <ScrollAnimation key={item.step} delay={item.delay}>
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 text-center transition-all hover:border-[var(--color-brand)] hover:scale-[1.02]">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] text-sm font-bold">{item.step}</div>
                    <item.icon size={20} className="mx-auto mt-3 text-[var(--color-brand)]" />
                    <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.desc}</p>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
