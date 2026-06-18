import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { KanbanBoard } from './components/KanbanBoard'
import { AgentList } from './components/AgentList'
import { LockManager } from './components/LockManager'
import { ProjectSelector } from './components/ProjectSelector'
import { Toaster } from 'sonner'
import './App.css'

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setReady(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading OpenCrew...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      <Header />
      <main className="p-6">
        <ProjectSelector />
        <div className="grid grid-cols-12 gap-6 mt-6">
          <div className="col-span-3">
            <AgentList />
          </div>
          <div className="col-span-6">
            <KanbanBoard />
          </div>
          <div className="col-span-3">
            <LockManager />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
