'use client'

import { Star } from 'lucide-react'
import { ScrollAnimation } from '@/components/ScrollAnimation'

const testimonials = [
  {
    name: 'Alex Chen',
    role: 'Senior Developer @ TechCorp',
    avatar: '/avatars/alex.png',
    content: 'Hivora lets me run 3 different AI agents in parallel on the same project. Symbol-level locking means zero conflicts. My workflow is 3x faster.',
    rating: 5,
  },
  {
    name: 'Sarah Johnson',
    role: 'CTO @ StartupX',
    avatar: '/avatars/sarah.png',
    content: 'Our team uses Claude and Cursor simultaneously. We couldn\'t be this productive without Hivora\'s Kanban board and real-time lock system.',
    rating: 5,
  },
  {
    name: 'Marcus Williams',
    role: 'Freelance Developer',
    avatar: '/avatars/marcus.png',
    content: 'Local mode lets me work on sensitive projects without sending anything to the cloud. MCP protocol means I can swap agents freely. No vendor lock-in.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-[var(--color-brand)]/5 to-transparent">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What Developers Say
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto">
              Real experiences from developers using Hivora
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <ScrollAnimation key={testimonial.name} delay={i * 150}>
            <div
              key={testimonial.name}
              className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl p-8 hover:border-[var(--color-brand)] transition-all duration-300 hover:scale-105"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>

              {/* Content */}
              <p className="text-[var(--color-text)] leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-light)] flex items-center justify-center overflow-hidden border border-[var(--color-border)]">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">{testimonial.role}</div>
                </div>
              </div>
            </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  )
}
