import type { Member, Organization } from '@/types'
import { api } from '@/lib/api'

interface OrgResponse {
  id?: string
  name?: string
  slug?: string
  plan?: string
  created_at?: number
  createdAt?: number
  builder_count?: number
  builderCount?: number
  total_minutes?: number
  totalMinutes?: number
  monthly_minutes?: number
  monthlyMinutes?: number
  member_count?: number
  memberCount?: number
}

/** gRPC-Gateway JSON uses camelCase; numeric timestamps are Unix seconds from the API. */
function parseCreatedAt(o: OrgResponse): Date {
  const raw = o.created_at ?? o.createdAt
  if (raw === undefined || raw === null) return new Date(NaN)
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) return new Date(NaN)
  // Heuristic: ms since epoch is ~1.7e12 in 2020s; seconds are ~1.7e9
  if (n > 1e12) return new Date(n)
  return new Date(n * 1000)
}

function mapOrg(o: OrgResponse): Organization {
  return {
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
    slug: String(o.slug ?? ''),
    builderCount: Number(o.builder_count ?? o.builderCount ?? 0),
    memberCount: Number(o.member_count ?? o.memberCount ?? 0),
    totalMinutes: Number(o.total_minutes ?? o.totalMinutes ?? 0),
    monthlyMinutes: Number(o.monthly_minutes ?? o.monthlyMinutes ?? 0),
    createdAt: parseCreatedAt(o),
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

const defaultPlan = 'starter'

export async function createOrganization(params: { name: string; slug: string }): Promise<Organization> {
  const data = await api<{ organization: OrgResponse }>('/v1/organizations', {
    method: 'POST',
    body: JSON.stringify({ name: params.name, slug: params.slug, plan: defaultPlan }),
  })
  return mapOrg(data.organization)
}

export async function updateOrganization(
  id: string,
  params: { name?: string; slug?: string }
): Promise<Organization> {
  const data = await api<{ organization: OrgResponse }>(`/v1/organizations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ id, ...params }),
  })
  return mapOrg(data.organization)
}

export async function deleteOrganization(id: string): Promise<void> {
  await api<undefined>(`/v1/organizations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
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
  const joined = m.joined_at ?? m.joinedAt ?? 0
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
