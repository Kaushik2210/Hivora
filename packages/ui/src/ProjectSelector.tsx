import { useState } from 'react'
import { FolderOpen, Plus, ChevronDown } from 'lucide-react'

export interface ProjectItem {
  id: string
  name: string
  path?: string
}

export function ProjectSelector({ projects, selectedId, onSelect, onCreate }: {
  projects: ProjectItem[]
  selectedId?: string
  onSelect?: (project: ProjectItem) => void
  onCreate?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = projects.find(p => p.id === selectedId) ?? projects[0]

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-[var(--color-brand)]/10 p-2 text-[var(--color-brand)]">
            <FolderOpen size={20} />
          </div>
          <div>
            <h2 className="font-semibold">{selected?.name ?? 'Select a project'}</h2>
            {selected?.path && <p className="text-sm text-[var(--color-text-muted)]">{selected.path}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <button onClick={() => setIsOpen(o => !o)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm transition-all hover:bg-[var(--color-surface)]">
              Switch <ChevronDown size={14} />
            </button>
          )}
          {onCreate && (
            <button onClick={onCreate}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-110">
              <Plus size={16} /> New Project
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 border-t border-[var(--color-border)] pt-4">
          <div className="space-y-2">
            {projects.map(project => (
              <button key={project.id} onClick={() => { onSelect?.(project); setIsOpen(false) }}
                className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                  selected?.id === project.id
                    ? 'border border-[var(--color-brand)] bg-[var(--color-brand)]/10'
                    : 'hover:bg-[var(--color-surface)]'
                }`}>
                <FolderOpen size={18} className={selected?.id === project.id ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'} />
                <div className="flex-1">
                  <div className={`font-medium ${selected?.id === project.id ? 'text-[var(--color-brand)]' : 'text-[var(--color-text)]'}`}>
                    {project.name}
                  </div>
                  {project.path && <div className="text-xs text-[var(--color-text-muted)]">{project.path}</div>}
                </div>
                {selected?.id === project.id && (
                  <span className="rounded bg-[var(--color-brand)] px-2 py-0.5 text-xs font-medium text-white">Active</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
