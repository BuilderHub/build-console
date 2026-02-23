const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090'

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token: explicitToken, ...init } = opts
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
    headers: { ...init.headers, ...headers },
  })

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
