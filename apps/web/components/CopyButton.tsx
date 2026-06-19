'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="ml-3 shrink-0 rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] transition-all hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  )
}
