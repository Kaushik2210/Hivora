import * as si from 'simple-icons'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

const MAP = {
  gemini:   { icon: si.siGooglegemini, bg: '#1a1a2e', scale: 0.92 },
  mistral:  { icon: si.siMistralai,    bg: '#1a0a00', scale: 0.88 },
  deepseek: { icon: si.siDeepseek,     bg: '#0a0f1e', scale: 0.90 },
}

for (const [name, { icon, bg, scale }] of Object.entries(MAP)) {
  const s = scale
  const offset = (1 - s) / 2 * 24
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="5" fill="${bg}"/>
  <g transform="translate(${offset.toFixed(2)},${offset.toFixed(2)}) scale(${s})">
    <path fill="#${icon.hex}" d="${icon.path}"/>
  </g>
</svg>`
  writeFileSync(join(__dir, 'public/logos', name + '.svg'), svg)
  console.log(`✓ ${name}.svg  (#${icon.hex}) — ${icon.title}`)
}

console.log('Done.')
