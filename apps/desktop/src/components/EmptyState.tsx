import { C } from '../theme'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  desc: string
  action?: () => void
  actionLabel?: string
}

export function EmptyState({ icon, title, desc, action, actionLabel }: EmptyStateProps) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, padding: '32px 24px', textAlign: 'center',
      animation: 'emptyFade 0.3s ease-out',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, background: `${C.accent}12`,
        border: `1px solid ${C.accent}25`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: C.accentLt, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.textDim, margin: '0 0 6px' }}>{title}</p>
        <p style={{ fontSize: 11, color: C.textMut, margin: 0, lineHeight: 1.65, maxWidth: 240 }}>{desc}</p>
      </div>
      {action && actionLabel && (
        <button onClick={action} style={{
          marginTop: 4, fontSize: 12, padding: '7px 16px',
          background: C.accent, color: 'white', border: 'none',
          borderRadius: 8, cursor: 'pointer', fontWeight: 600,
          transition: 'background 0.15s, transform 0.1s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.accentHov; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.accent; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
        >
          {actionLabel}
        </button>
      )}
      <style>{`@keyframes emptyFade { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
