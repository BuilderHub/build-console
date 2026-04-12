import { api } from '@/lib/api'

export type UserApiKey = {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  createdAt: number
  lastUsedAt: number
  /** Unix seconds when the key stops working; 0 = never expires. */
  expiresAt: number
}

function mapKey(raw: Record<string, unknown>): UserApiKey {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    keyPrefix: String(raw.keyPrefix ?? raw.key_prefix ?? ''),
    scopes: Array.isArray(raw.scopes) ? raw.scopes.map(String) : [],
    createdAt: Number(raw.createdAt ?? raw.created_at ?? 0),
    lastUsedAt: Number(raw.lastUsedAt ?? raw.last_used_at ?? 0),
    expiresAt: Number(raw.expiresAt ?? raw.expires_at ?? 0),
  }
}

export async function listUserApiKeys(): Promise<UserApiKey[]> {
  const data = await api<{ keys?: unknown[] }>('/v1/auth/api-keys')
  const keys = data.keys ?? []
  return keys.map((k) => mapKey(k as Record<string, unknown>))
}

/** @param expiresInDays -1 = never expire; 0 = server default (365 days); 1–3650 = explicit lifetime */
export async function createUserApiKey(
  name: string,
  scopes: string[],
  expiresInDays: number
): Promise<{ key: UserApiKey; token: string }> {
  const data = await api<{ key?: unknown; token?: string }>('/v1/auth/api-keys', {
    method: 'POST',
    body: JSON.stringify({
      name,
      scopes,
      expires_in_days: expiresInDays,
    }),
  })
  const rawKey = data.key
  if (!rawKey || typeof rawKey !== 'object') {
    throw new Error('Invalid create API key response')
  }
  return {
    key: mapKey(rawKey as Record<string, unknown>),
    token: String(data.token ?? '').trim(),
  }
}

export async function revokeUserApiKey(id: string): Promise<void> {
  await api(`/v1/auth/api-keys/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
