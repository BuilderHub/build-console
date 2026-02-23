import { refreshToken } from '@/lib/auth-api'

const API_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL?.trim() && !process.env.NEXT_PUBLIC_API_URL.startsWith('/'))
    ? process.env.NEXT_PUBLIC_API_URL.trim()
    : 'http://localhost:8090'
const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  const t = localStorage.getItem(ACCESS_KEY)
  return t ? t.trim() || null : null
}

function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_KEY, token)
}

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string | null; _retried?: boolean } = {}
): Promise<T> {
  const { token: explicitToken, _retried, ...init } = opts
  const token = explicitToken ?? getAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { ...init.headers, ...headers },
  })

  if (res.status === 401 && !_retried && typeof window !== 'undefined') {
    const refresh = localStorage.getItem(REFRESH_KEY)
    if (refresh) {
      try {
        const { accessToken } = await refreshToken(refresh)
        setAccessToken(accessToken)
        return api<T>(path, { ...opts, _retried: true })
      } catch {
        // refresh failed, fall through to throw the original 401
      }
    }
  }

  if (!res.ok) {
    const body = await res.text()
    let message = `HTTP ${res.status}`
    try {
      const json = JSON.parse(body)
      if (json.message) message = json.message
    } catch {
      if (body) message = body
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}
