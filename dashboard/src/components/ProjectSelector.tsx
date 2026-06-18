import { useState } from "react"
import { FolderOpen, Plus, ChevronDown } from "lucide-react"

const projects = [
  { id: "1", name: "My Project", path: "/home/user/project" },
  { id: "2", name: "OpenCrew", path: "/home/user/opencrew" }
]

export function ProjectSelector() {
  const [selected, setSelected] = useState(projects[0])
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
            <FolderOpen size={20} />
          </div>
          <div>
            <h2 className="font-semibold">{selected.name}</h2>
            <p className="text-sm text-slate-500">{selected.path}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm hover:bg-slate-50"
          >
            Switch
            <ChevronDown size={14} />
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            <Plus size={16} />
            New Project
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t">
          <div className="space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setSelected(project)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  selected.id === project.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-slate-50"
                }`}
              >
                <FolderOpen
                  size={18}
                  className={
                    selected.id === project.id ? "text-blue-600" : "text-slate-400"
                  }
                />
                <div className="flex-1">
                  <div
                    className={`font-medium ${
                      selected.id === project.id ? "text-blue-900" : "text-slate-700"
                    }`}
                  >
                    {project.name}
                  </div>
                  <div className="text-xs text-slate-500">{project.path}</div>
                </div>
                {selected.id === project.id && (
                  <div className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                    Active
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
