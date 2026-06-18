import { HivoraClient } from '@hivora/shared/sdk'
import type { AuthTokens } from '@hivora/shared/types'

const STORAGE_KEY = 'hivora_tokens'

function getTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

function storeTokens(tokens: AuthTokens) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

function clearTokens() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function createApiClient(): HivoraClient {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  return new HivoraClient({
    baseUrl,
    getAccessToken: () => getTokens()?.accessToken ?? null,
    getRefreshToken: () => getTokens()?.refreshToken ?? null,
    setTokens: (tokens: AuthTokens) => storeTokens(tokens),
    onUnauthorized: () => clearTokens(),
  })
}

export { getTokens, storeTokens, clearTokens }

export async function login(email: string, password: string): Promise<HivoraClient> {
  const client = createApiClient()
  const tokens = await client.login(email, password)
  storeTokens(tokens)
  return client
}

export async function register(name: string, email: string, password: string): Promise<HivoraClient> {
  const client = createApiClient()
  await client.register(email, password, name)
  return client
}

export async function logout() {
  const tokens = getTokens()
  if (tokens) {
    try {
      const client = createApiClient()
      await client.logout(tokens.refreshToken)
    } catch {}
  }
  clearTokens()
}
