import { Bot, User, Users } from 'lucide-react'

export interface AgentListItem {
  id: string
  name: string
  type: 'ai' | 'human'
  status: 'idle' | 'working' | 'offline'
  currentTask?: string
}

export function AgentList({ agents }: { agents: AgentListItem[] }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <Users size={18} /> Team Members
      </h2>
      <div className="space-y-3">
        {agents.map(agent => (
          <div key={agent.id} className="flex items-center gap-3 rounded-lg bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-surface-elevated)]">
            <div className={`h-2 w-2 shrink-0 rounded-full ${
              agent.status === 'working' ? 'bg-green-500 animate-pulse' : agent.status === 'idle' ? 'bg-amber-500' : 'bg-slate-500'
            }`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                {agent.type === 'ai' ? <Bot size={14} className="text-[var(--color-brand-light)]" /> : <User size={14} className="text-[var(--color-text-muted)]" />}
                {agent.name}
              </div>
              <div className="text-xs capitalize text-[var(--color-text-muted)]">{agent.status}</div>
            </div>
            {agent.currentTask && (
              <div className="max-w-[100px] truncate rounded bg-[var(--color-surface-elevated)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
                {agent.currentTask}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
