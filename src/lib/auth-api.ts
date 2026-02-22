import type { User, LoginResponse, RegisterResponse, RefreshResponse } from '@/types/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

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
  return fetch(`${API_BASE}${path}`, { ...init, headers: { ...init.headers, ...headers } })
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
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
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
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

export async function getMe(token: string): Promise<User> {
  const res = await rawFetch('/v1/auth/me', { token })
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
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  }
}
