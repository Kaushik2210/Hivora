import { Activity, Cpu, Users, GitBranch } from "lucide-react"

export function Header() {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">OpenCrew</h1>
            <p className="text-sm text-slate-500">Multi-AI Orchestrator Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Activity size={16} />
            <span>System Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>3 Agents</span>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch size={16} />
            <span>main</span>
          </div>
        </div>
      </div>
    </header>
  )
}
