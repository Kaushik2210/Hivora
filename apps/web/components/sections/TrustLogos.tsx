'use client'

const providers = [
  { name: 'Anthropic',   file: '/logos/claude.svg',    color: '#D97757' },
  { name: 'OpenAI',      file: '/logos/openai.svg',    color: '#10a37f' },
  { name: 'Google',      file: '/logos/gemini.svg',    color: '#4285F4' },
  { name: 'Groq',        file: '/logos/groq.svg',      color: '#F55036' },
  { name: 'Mistral',     file: '/logos/mistral.svg',   color: '#FF7000' },
  { name: 'xAI',         file: '/logos/xai.svg',       color: '#1DA1F2' },
  { name: 'DeepSeek',    file: '/logos/deepseek.svg',  color: '#4F46E5' },
  { name: 'Together AI', file: '/logos/together.svg',  color: '#7C3AED' },
  { name: 'Cohere',      file: '/logos/cohere.svg',    color: '#39594D' },
]

export function TrustLogos() {
  const doubled = [...providers, ...providers]

  return (
    <section className="py-12 border-y border-[var(--color-border)] overflow-hidden">
      <p className="text-center text-xs text-[var(--color-text-muted)] mb-6 uppercase tracking-widest">
        37+ Models across 10 Providers
      </p>
      <div className="marquee-wrapper">
        <div className="marquee-track">
          {doubled.map((p, i) => (
            <div key={`${p.name}-${i}`}
              className="flex items-center gap-2.5 mx-6 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-200 select-none"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                <img src={p.file} alt={p.name} className="w-5 h-5"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              </div>
              <span className="text-sm font-medium whitespace-nowrap">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
