import type { Member, Organization } from '@/types'
import { api } from '@/lib/api'

interface OrgResponse {
  id: string
  name: string
  slug: string
  plan: string
  created_at: number
  builder_count: number
  total_minutes: number
  monthly_minutes: number
}

function mapOrg(o: OrgResponse): Organization {
  return {
    id: o.id,
    name: o.name,
    slug: o.slug,
    plan: o.plan as 'starter' | 'pro' | 'enterprise',
    builderCount: o.builder_count ?? 0,
    totalMinutes: Number(o.total_minutes) ?? 0,
    monthlyMinutes: Number(o.monthly_minutes) ?? 0,
    createdAt: new Date((o.created_at ?? 0) * 1000),
    members: [],
  }
}

export async function listOrganizations(): Promise<Organization[]> {
  const data = await api<{ organizations: OrgResponse[] }>('/v1/organizations')
  return (data.organizations ?? []).map(mapOrg)
}

export async function getOrganization(id: string): Promise<Organization> {
  const data = await api<{ organization: OrgResponse }>(`/v1/organizations/${encodeURIComponent(id)}`)
  return mapOrg(data.organization)
}

export async function createOrganization(params: {
  name: string
  slug: string
  plan: string
}): Promise<Organization> {
  const data = await api<{ organization: OrgResponse }>('/v1/organizations', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return mapOrg(data.organization)
}

export async function updateOrganization(
  id: string,
  params: { name?: string; slug?: string; plan?: string }
): Promise<Organization> {
  const data = await api<{ organization: OrgResponse }>(`/v1/organizations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ id, ...params }),
  })
  return mapOrg(data.organization)
}

interface MemberResponse {
  user_id?: string
  userId?: string
  email: string
  name: string
  role: string
  joined_at?: number
  joinedAt?: number
}

function mapMember(m: MemberResponse): Member {
  const joined =
    m.joined_at ?? m.joinedAt ?? 0
  const role = m.role as Member['role']
  const safeRole: Member['role'] =
    role === 'owner' || role === 'admin' || role === 'member' ? role : 'member'
  return {
    id: m.user_id ?? m.userId ?? '',
    name: m.name,
    email: m.email,
    role: safeRole,
    joinedAt: new Date(joined * 1000),
  }
}

export async function listOrganizationMembers(organizationId: string): Promise<Member[]> {
  const data = await api<{ members: MemberResponse[] }>(
    `/v1/organizations/${encodeURIComponent(organizationId)}/members`
  )
  return (data.members ?? []).map(mapMember)
}
