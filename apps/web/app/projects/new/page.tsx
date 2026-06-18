'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createApiClient, getTokens } from '@/lib/auth'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const client = createApiClient()
      const orgs = await client.listOrganizations()
      if (!orgs || orgs.length === 0) throw new Error('No organization')
      const res = await client.createProject(orgs[0].id, name, path || undefined, desc || undefined)
      router.push(`/projects/${res.id}`)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  if (!getTokens()) return <div className="p-8">You must be signed in to create a project.</div>

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Create Project</h1>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Path (optional)</label>
            <input value={path} onChange={e => setPath(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <button disabled={loading} type="submit" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-white">{loading ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
