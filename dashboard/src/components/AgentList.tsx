import { useEffect, useState } from "react"
import { Users, Bot, User } from "lucide-react"

interface Agent {
  id: string
  name: string
  type: "ai" | "human"
  status: "idle" | "working" | "offline"
  currentTask?: string
}

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    // Mock data - replace with API call
    setAgents([
      {
        id: "claude-1",
        name: "Claude Code",
        type: "ai",
        status: "working",
        currentTask: "Implement auth module"
      },
      {
        id: "cursor-1",
        name: "Cursor Agent",
        type: "ai",
        status: "idle"
      },
      {
        id: "user-1",
        name: "You",
        type: "human",
        status: "working",
        currentTask: "Code review"
      },
      {
        id: "copilot-1",
        name: "GitHub Copilot",
        type: "ai",
        status: "offline"
      }
    ])
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Users size={18} />
        Team Members
      </h2>
      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                agent.status === "working"
                  ? "bg-green-500 animate-pulse"
                  : agent.status === "idle"
                  ? "bg-amber-500"
                  : "bg-slate-400"
              }`}
            />
            <div className="flex-1">
              <div className="font-medium text-sm flex items-center gap-2">
                {agent.type === "ai" ? (
                  <Bot size={14} className="text-blue-500" />
                ) : (
                  <User size={14} className="text-slate-500" />
                )}
                {agent.name}
              </div>
              <div className="text-xs text-slate-500 capitalize">
                {agent.status}
              </div>
            </div>
            {agent.currentTask && (
              <div className="text-xs text-slate-600 bg-white px-2 py-1 rounded truncate max-w-[100px]">
                {agent.currentTask}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
