import { useState } from 'react'
import { C } from '../theme'

type Tab = 'signin' | 'register'

interface Props {
  onLogin: (accessToken: string, refreshToken: string) => void
  onOffline: () => void
  eAPI: any
  serverUrl: string
}

export function WelcomeScreen({ onLogin, onOffline, eAPI, serverUrl }: Props) {
  const [tab, setTab]           = useState<Tab>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [showPw, setShowPw]     = useState(false)

  const request = async (path: string, body: unknown) => {
    const res = await eAPI?.apiRequest({ method: 'POST', path, body })
    if (!res || res.error) throw new Error(res?.message || 'Request failed')
    return res
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await request('/api/auth/login', { email: email.trim(), password: password.trim() })
      onLogin(res.data.accessToken, res.data.refreshToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true); setError(null)
    try {
      await request('/api/auth/register', { email: email.trim(), password: password.trim(), name: name.trim() || undefined })
      // Auto sign in after register
      const res = await request('/api/auth/login', { email: email.trim(), password: password.trim() })
      onLogin(res.data.accessToken, res.data.refreshToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.card, border: `1px solid ${C.muted}`, borderRadius: 8,
    padding: '10px 12px', fontSize: 13, color: C.text, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color .15s',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: C.bg,
      WebkitAppRegion: 'drag',
    } as React.CSSProperties}>
      {/* Draggable title bar area */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 32 } as React.CSSProperties} />

      <div style={{
        width: 360, padding: '36px 32px', borderRadius: 16,
        background: C.surface, border: `1px solid ${C.muted}`,
        boxShadow: '0 24px 48px rgba(0,0,0,.4)',
        WebkitAppRegion: 'no-drag',
      } as React.CSSProperties}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.accent}, #6366f1)`,
            marginBottom: 14, boxShadow: `0 0 24px ${C.accent}50`,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>Hivora</div>
          <div style={{ fontSize: 12, color: C.textMut, marginTop: 4 }}>AI Agent Orchestration</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: C.card, borderRadius: 8, padding: 3, marginBottom: 24, gap: 2 }}>
          {(['signin', 'register'] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(null) }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all .15s',
                background: tab === t ? C.surface : 'none',
                color: tab === t ? C.text : C.textMut,
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.3)' : 'none',
              }}>
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Sign In */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.textMut, display: 'block', marginBottom: 5 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com" style={inputStyle} autoFocus
                onFocus={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}20` }}
                onBlur={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textMut, display: 'block', marginBottom: 5 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••" style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}20` }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.boxShadow = 'none' }} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, fontSize: 14 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ background: '#ef444420', border: '1px solid #ef444440', borderRadius: 6, padding: '8px 10px', fontSize: 11, color: '#f87171' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? C.muted : C.accent, color: 'white', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, marginTop: 4, transition: 'all .15s', boxShadow: loading ? 'none' : `0 0 16px ${C.accent}40` }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Create Account */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.textMut, display: 'block', marginBottom: 5 }}>Name <span style={{ opacity: .5 }}>(optional)</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" style={inputStyle} autoFocus
                onFocus={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}20` }}
                onBlur={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textMut, display: 'block', marginBottom: 5 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com" style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}20` }}
                onBlur={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textMut, display: 'block', marginBottom: 5 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="8+ characters" style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}20` }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.boxShadow = 'none' }} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, fontSize: 14 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ background: '#ef444420', border: '1px solid #ef444440', borderRadius: 6, padding: '8px 10px', fontSize: 11, color: '#f87171' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? C.muted : C.accent, color: 'white', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, marginTop: 4, transition: 'all .15s', boxShadow: loading ? 'none' : `0 0 16px ${C.accent}40` }}>
              {loading ? 'Creating account…' : 'Create Account & Sign In'}
            </button>
          </form>
        )}

        {/* Offline option */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={onOffline}
            style={{ background: 'none', border: 'none', color: C.textMut, fontSize: 11, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: `${C.textMut}60` }}>
            Continue offline (local mode)
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: C.textMut, marginTop: 16, opacity: .6 }}>
          Connecting to {serverUrl}
        </p>
      </div>
    </div>
  )
}
