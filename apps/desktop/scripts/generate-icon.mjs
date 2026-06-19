import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'public', 'logo.svg')
const buildDir = join(root, 'build')

mkdirSync(buildDir, { recursive: true })

const svg = readFileSync(svgPath)

// 256x256 PNG for dev mode (BrowserWindow icon)
await sharp(svg).resize(256, 256).png().toFile(join(buildDir, 'icon.png'))
console.log('✓ build/icon.png created')

// 512x512 PNG (high-res for builds)
await sharp(svg).resize(512, 512).png().toFile(join(buildDir, 'icon@2x.png'))
console.log('✓ build/icon@2x.png created')

// Simple ICO: Electron builder picks up icon.ico automatically
// We create a multi-size ICO manually using PNG buffers
const sizes = [16, 32, 48, 64, 128, 256]
const pngBuffers = await Promise.all(
  sizes.map(s => sharp(svg).resize(s, s).png().toBuffer())
)

// Write a minimal ICO file (ICONDIR + ICONDIRENTRY headers + PNG data)
// ICO with PNG compression (Vista+)
const headerSize  = 6
const entrySize   = 16
const dirSize     = headerSize + entrySize * sizes.length

let offset = dirSize
const entries = pngBuffers.map((buf, i) => ({ buf, size: sizes[i], offset: (() => { const o = offset; offset += buf.length; return o })() }))

const ico = Buffer.alloc(offset)
// ICONDIR
ico.writeUInt16LE(0,            0) // reserved
ico.writeUInt16LE(1,            2) // type: 1 = ICO
ico.writeUInt16LE(sizes.length, 4) // image count

entries.forEach(({ buf, size, offset: off }, i) => {
  const base = headerSize + i * entrySize
  ico.writeUInt8(size >= 256 ? 0 : size, base)     // width (0 = 256)
  ico.writeUInt8(size >= 256 ? 0 : size, base + 1) // height
  ico.writeUInt8(0,         base + 2) // color count
  ico.writeUInt8(0,         base + 3) // reserved
  ico.writeUInt16LE(1,      base + 4) // planes
  ico.writeUInt16LE(32,     base + 6) // bit count
  ico.writeUInt32LE(buf.length, base + 8)  // size
  ico.writeUInt32LE(off,    base + 12) // offset
  buf.copy(ico, off)
})

writeFileSync(join(buildDir, 'icon.ico'), ico)
console.log('✓ build/icon.ico created')
