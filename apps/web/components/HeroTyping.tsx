'use client'

import { useState, useEffect } from 'react'

const words = ['Claude', 'Cursor', 'Copilot', 'Cline', 'Devin']

export function HeroTyping() {
  const [idx, setIdx]       = useState(0)
  const [text, setText]     = useState('')
  const [deleting, setDel]  = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) {
      const t = setTimeout(() => setPaused(false), 1400)
      return () => clearTimeout(t)
    }
    const target = words[idx]
    const speed  = deleting ? 55 : 90

    const t = setTimeout(() => {
      if (!deleting && text === target) {
        setPaused(true); setDel(true); return
      }
      if (deleting && text === '') {
        setDel(false); setIdx(i => (i + 1) % words.length); return
      }
      setText(s => deleting ? s.slice(0, -1) : target.slice(0, s.length + 1))
    }, speed)

    return () => clearTimeout(t)
  }, [text, deleting, paused, idx])

  return (
    <span
      className="brand-gradient-text"
      style={{ display: 'inline-block', minWidth: '6ch' }}
    >
      {text}
      <span
        style={{
          display: 'inline-block',
          width: 2,
          height: '0.9em',
          background: 'var(--color-brand)',
          borderRadius: 1,
          marginLeft: 2,
          verticalAlign: 'middle',
          animation: 'blink 1s step-end infinite',
        }}
      />
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </span>
  )
}
