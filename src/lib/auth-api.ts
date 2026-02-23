import type { User, LoginResponse, RegisterResponse, RefreshResponse } from '@/types/auth'

const API_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL?.trim() && !process.env.NEXT_PUBLIC_API_URL.startsWith('/'))
    ? process.env.NEXT_PUBLIC_API_URL.trim()
    : 'http://localhost:8090'

async function rawFetch(
  path: string,
  opts: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token, ...init } = opts
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(`${API_BASE}${path}`, { ...init, credentials: 'include', headers: { ...init.headers, ...headers } })
}

function parseError(res: Response, body: string): string {
  try {
    const json = JSON.parse(body)
    return json.message || `HTTP ${res.status}`
  } catch {
    return body || `HTTP ${res.status}`
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await rawFetch('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(parseError(res, text))
  const data = JSON.parse(text)
  return {
    user: data.user,
    accessToken: (data.access_token ?? '').trim(),
    refreshToken: (data.refresh_token ?? '').trim(),
    expiresIn: data.expires_in,
  }
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<RegisterResponse> {
  const res = await rawFetch('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(parseError(res, text))
  const data = JSON.parse(text)
  return {
    user: data.user,
    accessToken: (data.access_token ?? '').trim(),
    refreshToken: (data.refresh_token ?? '').trim(),
    expiresIn: data.expires_in,
  }
}

/** Get current user. Pass token for header auth, or omit to rely on cookie (credentials: 'include'). */
export async function getMe(token?: string | null): Promise<User> {
  const res = await rawFetch('/v1/auth/me', { token: token ?? undefined })
  const text = await res.text()
  if (!res.ok) throw new Error(parseError(res, text))
  const data = JSON.parse(text)
  return data.user
}

export async function refreshToken(refreshToken: string): Promise<RefreshResponse> {
  const res = await rawFetch('/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(parseError(res, text))
  const data = JSON.parse(text)
  return {
    accessToken: (data.access_token ?? '').trim(),
    expiresIn: data.expires_in,
  }
}

/** Call logout endpoint so the API clears the auth cookie (required for cookie-based auth). */
export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/v1/auth/logout`, { method: 'POST', credentials: 'include' })
}
