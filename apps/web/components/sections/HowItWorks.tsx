'use client'

import { FolderPlus, Users, Lock } from 'lucide-react'
import { ScrollAnimation } from '@/components/ScrollAnimation'

const steps = [
  {
    number: '01',
    icon: FolderPlus,
    title: 'Create a Project',
    description: 'Start a new project and connect your AI agents. Claude, Cursor, Copilot, or any MCP-compatible agent integrates in one click.',
  },
  {
    number: '02',
    icon: Users,
    title: 'Assign Tasks',
    description: 'Create tasks on the Kanban board and assign them to agents. Each agent works in its own worktree in parallel, with zero conflict risk.',
  },
  {
    number: '03',
    icon: Lock,
    title: 'Real-Time Locking',
    description: 'Symbol-level locking keeps agents synced automatically when working on the same code. Conflicts are detected and resolved instantly.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto">
              Get started with multi-agent orchestration in 3 simple steps
            </p>
          </div>
        </ScrollAnimation>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-brand)] to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <ScrollAnimation key={step.number} delay={i * 150}>
                  <div className="relative">
                    <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl p-8 h-full hover:border-[var(--color-brand)] transition-all duration-300 hover:scale-105">
                    {/* Step number */}
                    <div className="absolute -top-4 left-8 bg-[var(--color-brand)] text-white text-sm font-bold px-3 py-1 rounded-full">
                      Step {step.number}
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center mb-6 mt-2">
                      <Icon className="w-8 h-8 text-[var(--color-brand)]" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-[var(--color-text-muted)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
