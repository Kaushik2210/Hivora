import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Plus, X, Terminal as TermIcon } from 'lucide-react'
import { C } from '../theme'
// xterm stylesheet is injected globally; Vite handles this import
import '@xterm/xterm/css/xterm.css'

const eAPI = () => (window as any).electronAPI

interface TermTab {
  id: string
  title: string
}

// ── Individual xterm instance ────────────────────────────────────────────────

function TermInstance({ tabId, active, cwd }: { tabId: string; active: boolean; cwd?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current || !containerRef.current) return
    mountedRef.current = true

    const term = new XTerm({
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor:     '#58a6ff',
        selectionBackground: 'rgba(88,166,255,0.22)',
        black:   '#484f58', red:     '#ff7b72', green:   '#3fb950', yellow:  '#d29922',
        blue:    '#58a6ff', magenta: '#bc8cff', cyan:    '#39c5cf', white:   '#b1bac4',
        brightBlack: '#6e7681', brightRed: '#ffa198', brightGreen: '#56d364',
        brightYellow: '#e3b341', brightBlue: '#79c0ff', brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd', brightWhite: '#f0f6fc',
      },
      fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      convertEol: true,
      scrollback: 3000,
    })

    const fit = new FitAddon()
    const links = new WebLinksAddon()
    term.loadAddon(fit)
    term.loadAddon(links)
    term.open(containerRef.current)
    fit.fit()

    termRef.current = term
    fitRef.current = fit

    const api = eAPI()
    api?.terminalCreate({ id: tabId, cwd })

    // PTY → terminal
    const dataHandler = (d: { id: string; data: string }) => {
      if (d.id === tabId) term.write(d.data)
    }
    api?.onTerminalData(dataHandler)

    // keyboard → PTY
    const onData = term.onData((data: string) => api?.terminalWrite({ id: tabId, data }))

    // Resize → PTY
    const observer = new ResizeObserver(() => {
      try {
        fit.fit()
        api?.terminalResize({ id: tabId, cols: term.cols, rows: term.rows })
      } catch { /* ignore race */ }
    })
    if (containerRef.current) observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      onData.dispose()
      api?.terminalKill(tabId)
      term.dispose()
      termRef.current = null
      fitRef.current = null
      mountedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId])

  // Re-fit when tab becomes visible
  useEffect(() => {
    if (active && fitRef.current && termRef.current) {
      setTimeout(() => {
        try {
          fitRef.current!.fit()
          const api = eAPI()
          const t = termRef.current!
          api?.terminalResize({ id: tabId, cols: t.cols, rows: t.rows })
        } catch { /* ignore */ }
      }, 50)
    }
  }, [active, tabId])

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        display: active ? 'flex' : 'none',
        flexDirection: 'column',
      }}
    />
  )
}

// ── Terminal Panel (multi-tab) ────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  cwd?: string
}

export function TerminalPanel({ open, onClose, cwd }: Props) {
  const [tabs, setTabs]       = useState<TermTab[]>([{ id: crypto.randomUUID(), title: 'shell' }])
  const [activeId, setActiveId] = useState<string>(tabs[0].id)

  const addTab = () => {
    const id = crypto.randomUUID()
    setTabs(t => [...t, { id, title: 'shell' }])
    setActiveId(id)
  }

  const closeTab = (id: string) => {
    setTabs(t => {
      const next = t.filter(tab => tab.id !== id)
      if (next.length === 0) { onClose(); return t }
      if (activeId === id) setActiveId(next[next.length - 1].id)
      return next
    })
    eAPI()?.terminalKill(id)
  }

  if (!open) return null

  return (
    <div
      style={{
        borderTop: `1px solid ${C.border}`,
        background: '#0d1117',
        display: 'flex',
        flexDirection: 'column',
        height: 260,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
          height: 34,
          gap: 0,
          flexShrink: 0,
          paddingLeft: 4,
        }}
      >
        <TermIcon size={12} style={{ color: C.textMut, marginRight: 6, marginLeft: 4 }} />
        <span style={{ fontSize: 10, fontWeight: 600, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 8 }}>
          Terminal
        </span>

        {/* Tabs */}
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 8px 0 10px',
              height: '100%',
              cursor: 'pointer',
              fontSize: 11,
              color: activeId === tab.id ? C.text : C.textMut,
              borderRight: `1px solid ${C.border}`,
              background: activeId === tab.id ? '#0d1117' : 'transparent',
              borderBottom: activeId === tab.id ? '2px solid #58a6ff' : '2px solid transparent',
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
          >
            {tab.title}
            <button
              onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, opacity: 0.6, lineHeight: 1 }}
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* New terminal */}
        <button
          onClick={addTab}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, display: 'flex', padding: '0 8px', height: '100%', alignItems: 'center' }}
          title="New terminal"
        >
          <Plus size={13} />
        </button>

        {/* Spacer + close */}
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, display: 'flex', padding: '0 10px', height: '100%', alignItems: 'center' }}
          title="Close terminal (Ctrl+`)"
        >
          <X size={13} />
        </button>
      </div>

      {/* xterm instances (all mounted, only active shown) */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {tabs.map(tab => (
          <TermInstance
            key={tab.id}
            tabId={tab.id}
            active={tab.id === activeId}
            cwd={cwd}
          />
        ))}
      </div>
    </div>
  )
}
