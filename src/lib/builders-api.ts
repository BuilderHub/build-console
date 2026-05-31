import type { Builder, BuilderSize, Region } from '@/types'
import { api } from '@/lib/api'

const BUILDER_SIZE_KEYS: BuilderSize[] = ['small', 'medium', 'large', 'xlarge']
const REGION_KEYS: Region[] = ['us-east', 'us-west', 'eu-central', 'ap-southeast']

/** API response shape (grpc-gateway JSON: camelCase) */
interface ProtoBuilderSpec {
  template_ref?: string
  templateRef?: string
  mode?: string
  replicas?: number
  idle_timeout_seconds?: number
  idleTimeoutSeconds?: number
  labels?: Record<string, string>
}

/** API may serialize with snake_case or camelCase */
interface ProtoBuilderStatus {
  endpoint?: string
  node_port?: number
  nodePort?: number
  phase?: string
  Phase?: string
}

interface ProtoBuilder {
  namespace?: string
  name?: string
  spec?: ProtoBuilderSpec
  status?: ProtoBuilderStatus
}

function protoPhaseToStatus(phase: string | undefined): Builder['status'] {
  if (!phase) return 'offline'
  switch (phase.toLowerCase()) {
    case 'ready':
      return 'idle'
    case 'pending':
    case 'scalingdown':
      return 'building'
    case 'error':
      return 'error'
    default:
      return 'offline'
  }
}

/** Map API builder (proto) to console Builder model */
function mapBuilder(p: ProtoBuilder, organizationId: string): Builder {
  const name = p.name ?? ''
  const spec = p.spec ?? {}
  const status = p.status ?? {}
  const replicas = spec.replicas ?? 1
  const idleSec = spec.idleTimeoutSeconds ?? spec.idle_timeout_seconds ?? 300
  const labels = spec.labels ?? {}
  const size = (labels.size as BuilderSize) ?? BUILDER_SIZE_KEYS[1]
  const region = (labels.region as Region) ?? REGION_KEYS[0]
  const platform = labels.platform ? labels.platform.split(',').map((s: string) => s.trim()).filter(Boolean) : ['linux/amd64']
  const maxCacheSize = labels.maxCacheSize ? Number(labels.maxCacheSize) : 25
  const nodePort = status.nodePort ?? status.node_port ?? 0
  const phase = status.phase ?? status.Phase ?? ''
  const hasEndpoint = Boolean(status.endpoint || nodePort > 0)
  let statusResolved =
    phase ? protoPhaseToStatus(phase) : (hasEndpoint ? 'idle' : 'offline')

  const builderMode = (spec.mode as string) || (labels.mode as string) || 'sleepy'

  // Note: We no longer force non-sleepy modes to "idle". Persistent builders
  // should reflect their real k8s state (so users can see if the pod is
  // actually running). Sleepy mode continues to show the scaled state.

  // Support custom cpu/memory from labels (captured at creation time from the template)
  const customCpu = labels.cpu as string | undefined
  const customMemory = labels.memory as string | undefined

  const templateRef = (spec.template_ref as string) || (spec.templateRef as string) || undefined

  return {
    id: name,
    name,
    organizationId,
    size: BUILDER_SIZE_KEYS.includes(size) ? size : 'medium',
    region: REGION_KEYS.includes(region) ? region : 'us-east',
    status: statusResolved,
    mode: builderMode,
    cacheSize: 0,
    maxCacheSize,
    platform,
    templateRef,
    cpu: customCpu,
    memory: customMemory,
    createdAt: new Date(),
    buildCount: 0,
    totalMinutes: 0,
  }
}

/** List builders in an organization (namespace = org id). */
export async function listBuilders(organizationId: string): Promise<Builder[]> {
  const data = await api<{ builders: ProtoBuilder[] }>(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/builders`
  )
  return (data.builders ?? []).map((p) => mapBuilder(p, organizationId))
}

/** Get a single builder by name. */
export async function getBuilder(organizationId: string, name: string): Promise<Builder> {
  const data = await api<{ builder: ProtoBuilder }>(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/builders/${encodeURIComponent(name)}`
  )
  return mapBuilder(data.builder ?? {}, organizationId)
}

/** Create builder request (proto-aligned). */
export interface CreateBuilderParams {
  name: string
  spec: {
    template_ref?: string
    mode: string
    replicas?: number
    idle_timeout_seconds?: number
    labels?: Record<string, string>
  }
}

/** Create a new builder in the organization. */
export async function createBuilder(
  organizationId: string,
  params: CreateBuilderParams
): Promise<Builder> {
  const data = await api<{ builder: ProtoBuilder }>(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/builders`,
    {
      method: 'POST',
      body: JSON.stringify({
        namespace: organizationId,
        name: params.name,
        spec: params.spec,
      }),
    }
  )
  return mapBuilder(data.builder ?? {}, organizationId)
}

/** Update builder spec (template_ref, mode, replicas, idle_timeout_seconds, labels). Name is immutable. */
export async function updateBuilder(
  organizationId: string,
  name: string,
  spec: CreateBuilderParams['spec']
): Promise<Builder> {
  const data = await api<{ builder: ProtoBuilder }>(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/builders/${encodeURIComponent(name)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ namespace: organizationId, name, spec }),
    }
  )
  return mapBuilder(data.builder ?? {}, organizationId)
}

/** Delete a builder and its resources. */
export async function deleteBuilder(organizationId: string, name: string): Promise<void> {
  await api(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/builders/${encodeURIComponent(name)}`,
    { method: 'DELETE' }
  )
}

/** Wake a sleepy builder (patch last-used annotation). */
export async function wakeBuilder(
  organizationId: string,
  name: string
): Promise<Builder> {
  const data = await api<{ builder: ProtoBuilder }>(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/builders/${encodeURIComponent(name)}/wake`,
    { method: 'POST' }
  )
  return mapBuilder(data.builder ?? {}, organizationId)
}
