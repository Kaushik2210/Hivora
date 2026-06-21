import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { C } from '../theme'

type Tab = 'signin' | 'register'

interface UserProfile { name: string; email: string; avatarUrl: string | null }

interface Props {
  onLogin: (accessToken: string, refreshToken: string, user: UserProfile) => void
  eAPI: any
  serverUrl: string
}

export function WelcomeScreen({ onLogin, eAPI, serverUrl }: Props) {
  const [tab, setTab]           = useState<Tab>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [info, setInfo]         = useState<string | null>(null)
  const [showPw, setShowPw]     = useState(false)

  // GitHub OAuth: open the system browser; the API redirects back via the
  // hivora://auth deep link, which App.tsx catches to complete the sign-in.
  const handleGitHub = () => {
    setError(null); setInfo(null)
    eAPI?.shellOpen(`${serverUrl}/api/auth/github?client=desktop`)
    setInfo('GitHub opened — authorize in the browser, then you will be redirected back automatically.')
  }

  const handleGoogle = () => {
    setError(null)
    setInfo('Google sign-in is coming soon.')
  }

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
      onLogin(res.data.tokens.accessToken, res.data.tokens.refreshToken, {
        name: res.data.user?.name ?? '',
        email: res.data.user?.email ?? email.trim(),
        avatarUrl: null,
      })
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
      onLogin(res.data.tokens.accessToken, res.data.tokens.refreshToken, {
        name: res.data.user?.name ?? name.trim(),
        email: res.data.user?.email ?? email.trim(),
        avatarUrl: null,
      })
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
            width: 64, height: 64, borderRadius: 18,
            background: C.card, border: `1px solid ${C.muted}`,
            marginBottom: 14, boxShadow: `0 0 32px ${C.accent}40`,
          }}>
            <img src="./logo.svg" alt="Hivora"
              style={{ width: 44, height: 44, borderRadius: 10 }}
              onError={e => {
                // Fallback: draw a simple "H" monogram if logo missing
                const el = e.currentTarget as HTMLImageElement
                el.style.display = 'none'
                const fb = document.createElement('span')
                fb.textContent = 'H'
                fb.style.cssText = 'font-size:28px;font-weight:900;color:#60a5fa;letter-spacing:-1px'
                el.parentElement?.appendChild(fb)
              }}
            />
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
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
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
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMut, cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
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

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: C.muted }} />
          <span style={{ fontSize: 10, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {tab === 'signin' ? 'or sign in with' : 'or sign up with'}
          </span>
          <div style={{ flex: 1, height: 1, background: C.muted }} />
        </div>

        {/* OAuth providers */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleGoogle}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.card, border: `1px solid ${C.muted}`, borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 600, color: C.textMut, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.color = C.textMut }}>
            <svg width="15" height="15" viewBox="0 0 24 24"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
            Google
          </button>
          <button type="button" onClick={handleGitHub}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.card, border: `1px solid ${C.muted}`, borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 600, color: C.textMut, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.color = C.textMut }}>
            <svg width="15" height="15" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </button>
        </div>

        {info && (
          <div style={{ background: `${C.accent}18`, border: `1px solid ${C.accent}40`, borderRadius: 6, padding: '8px 10px', fontSize: 11, color: C.accentLt ?? '#93c5fd', marginTop: 14, lineHeight: 1.5 }}>
            {info}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 10, color: C.textMut, marginTop: 20, opacity: .6 }}>
          Connecting to {serverUrl}
        </p>
      </div>
    </div>
  )
}
