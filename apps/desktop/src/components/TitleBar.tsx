import { useState, useEffect, useRef } from 'react'
import { Server, HardDrive, RefreshCw } from 'lucide-react'
import { C } from '../theme'

type MenuItem = { label: string; shortcut?: string; action: () => void } | null
export type MenuDef = { label: string; items: MenuItem[] }

interface TitleBarProps {
  menus: MenuDef[]
  mode: string
  onToggleMode: () => void
  eAPI: any
  syncing?: boolean
}

export function TitleBar({ menus, mode, onToggleMode, eAPI, syncing }: TitleBarProps) {
  const [open, setOpen] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={{
      height: 36, display: 'flex', alignItems: 'center',
      background: '#060a10', borderBottom: '1px solid #0d1828',
      flexShrink: 0, userSelect: 'none', zIndex: 100,
    }}>
      {/* Logo + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', height: '100%', WebkitAppRegion: 'drag' } as any}>
        <img src="./logo.svg" alt="Hivora" style={{ width: 18, height: 18, borderRadius: 4 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#a0b4cc', letterSpacing: '0.03em' }}>Hivora</span>
      </div>

      {/* Menus */}
      <div ref={ref} style={{ display: 'flex', alignItems: 'center', height: '100%', WebkitAppRegion: 'no-drag' } as any}>
        {menus.map(menu => (
          <div key={menu.label} style={{ position: 'relative' }}>
            <button
              onMouseDown={e => { e.preventDefault(); setOpen(o => o === menu.label ? null : menu.label) }}
              style={{
                height: 36, padding: '0 10px',
                background: open === menu.label ? '#1a2235' : 'none',
                border: 'none', color: open === menu.label ? '#e2e8f0' : '#6b7a99',
                fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e2e8f0'; if (!open) (e.currentTarget as HTMLElement).style.background = '#131c2a' }}
              onMouseLeave={e => { if (open !== menu.label) { (e.currentTarget as HTMLElement).style.color = '#6b7a99'; (e.currentTarget as HTMLElement).style.background = 'none' } }}
            >
              {menu.label}
            </button>

            {open === menu.label && (
              <div style={{
                position: 'absolute', top: '100%', left: 0,
                background: '#0c1420', border: '1px solid #1a2d45',
                borderRadius: 6, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                minWidth: 220, paddingTop: 4, paddingBottom: 4, zIndex: 999,
                animation: 'ddDown 0.1s ease',
              }}>
                {menu.items.map((item, i) =>
                  item === null
                    ? <div key={i} style={{ height: 1, background: '#1a2235', margin: '3px 0' }} />
                    : <button key={i}
                        onMouseDown={e => { e.preventDefault(); item.action(); setOpen(null) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', padding: '6px 12px',
                          background: 'none', border: 'none', color: '#c8d6e8',
                          fontSize: 12, cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.1s',
                        } as any}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1a2235'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                      >
                        <span>{item.label}</span>
                        {item.shortcut && <span style={{ fontSize: 10, color: '#3a4f6a', marginLeft: 24 }}>{item.shortcut}</span>}
                      </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drag fill */}
      <div style={{ flex: 1, height: '100%', WebkitAppRegion: 'drag' } as any} />

      {/* Sync indicator */}
      {syncing && (
        <div style={{ WebkitAppRegion: 'no-drag', marginRight: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.accentLt } as any}>
          <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
          Syncing
        </div>
      )}

      {/* Mode pill */}
      <div style={{ WebkitAppRegion: 'no-drag', marginRight: 8 } as any}>
        <button onClick={onToggleMode} style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 8px',
          background: mode === 'cloud' ? '#2563eb18' : '#1e293b',
          border: `1px solid ${mode === 'cloud' ? '#2563eb50' : '#334155'}`,
          borderRadius: 99, color: mode === 'cloud' ? '#60a5fa' : '#94a3b8',
          cursor: 'pointer', transition: 'all 0.2s',
        }}>
          {mode === 'cloud' ? <Server size={10} /> : <HardDrive size={10} />}
          {mode === 'cloud' ? 'Cloud' : 'Local'}
        </button>
      </div>

      {/* Window controls */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', WebkitAppRegion: 'no-drag' } as any}>
        {[
          { symbol: '─', title: 'Minimize', action: () => eAPI?.windowMinimize(), cls: 'wbtn' },
          { symbol: '□', title: 'Maximize', action: () => eAPI?.windowMaximize(), cls: 'wbtn' },
          { symbol: '✕', title: 'Minimize to tray', action: () => eAPI?.windowClose(), cls: 'wbtn wbtn-close' },
        ].map(btn => (
          <button key={btn.title} title={btn.title} className={btn.cls} onClick={btn.action}
            style={{
              width: 46, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', color: '#4a5a72', fontSize: 12,
              cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e2e8f0'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#4a5a72'}
          >
            {btn.symbol}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes ddDown { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .wbtn:hover { background: rgba(255,255,255,0.08) !important; color: #e2e8f0 !important; }
        .wbtn-close:hover { background: #c42b1c !important; color: white !important; }
      `}</style>
    </div>
  )
}
