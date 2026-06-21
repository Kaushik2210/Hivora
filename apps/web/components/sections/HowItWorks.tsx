'use client'

import { LayoutPanelLeft, Cpu, Users } from 'lucide-react'
import { ScrollAnimation } from '@/components/ScrollAnimation'

const steps = [
  {
    number: '01',
    icon: LayoutPanelLeft,
    title: 'Open Panels, Pick Your AI',
    description: 'Launch Hivora and add up to 4 AI panels side by side. Each panel runs a different model — Claude, GPT-4o, Gemini, Groq, Mistral and more. No setup, just select and start.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Type — All Agents Work in Parallel',
    description: 'Give each panel its own task. Claude refactors the backend, GPT-4o builds the UI, Gemini writes tests — simultaneously. The orchestrator runs invisibly in the background, preventing any conflicts.',
  },
  {
    number: '03',
    icon: Users,
    title: 'Invite Teammates, Scale the Team',
    description: 'Share an invite link and collaborators join the same workspace in real time. Everyone adds their own panels, and the orchestrator keeps every agent and every human in sync — conflict-free.',
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
              Multiple AIs coding in parallel — without a single merge conflict
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
                      <div className="absolute -top-4 left-8 bg-[var(--color-brand)] text-white text-sm font-bold px-3 py-1 rounded-full">
                        Step {step.number}
                      </div>
                      <div className="w-16 h-16 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center mb-6 mt-2">
                        <Icon className="w-8 h-8 text-[var(--color-brand)]" />
                      </div>
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
