'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ScrollAnimation } from '@/components/ScrollAnimation'

const faqs = [
  {
    question: 'What is Hivora?',
    answer: 'Hivora is a multi-agent orchestration platform that lets you run multiple AI agents (Claude, Cursor, Copilot, etc.) in parallel on the same project safely. With symbol-level locking, git-native workflows, and a real-time Kanban board, you manage your agents like a team.',
  },
  {
    question: 'Is it free?',
    answer: 'Yes! The Free plan gives you 2 projects and 5 agents at no cost. Pro ($19/mo) unlocks unlimited projects and 50 agents, while Team ($79/mo) offers unlimited agents and priority support. Since we\'re in beta, all features are currently available for free.',
  },
  {
    question: 'What\'s the difference between Local and Cloud mode?',
    answer: 'Cloud mode stores all data on Hivora\'s secure infrastructure and is accessible from anywhere. Local mode keeps everything on your machine — nothing leaves your computer. Use local mode for sensitive projects and cloud mode for team collaboration.',
  },
  {
    question: 'Which AI agents are supported?',
    answer: 'Any agent that supports MCP (Model Context Protocol) works with Hivora. Currently Claude Code, Cursor, GitHub Copilot, Windsurf, and Cline are tested and supported. Any MCP-compatible agent can be integrated easily.',
  },
  {
    question: 'Is my code safe?',
    answer: 'Absolutely. In local mode, your code never leaves your computer. In cloud mode, it\'s protected with end-to-end encryption. Symbol-level locking prevents agents from overwriting each other. All changes are tracked with git and can be rolled back at any time.',
  },
  {
    question: 'Is there a desktop app?',
    answer: 'Yes! We have native desktop apps for Windows and macOS. The desktop app supports both local and cloud modes, and runs the MCP server directly on your machine. Download it for free from our downloads page.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg">
              Everything you need to know about Hivora
            </p>
          </div>
        </ScrollAnimation>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[var(--color-brand)] transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-semibold text-lg pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--color-text-muted)] transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5 text-[var(--color-text-muted)] leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
