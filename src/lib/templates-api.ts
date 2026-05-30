import type { BuilderTemplate, CacheType, ResourceRequirements } from '@/types'
import { api } from '@/lib/api'

/** Raw shape from the build-api (grpc-gateway JSON) */
interface ProtoCacheConfig {
  type?: string
  pvc?: {
    size?: string
    storageClassName?: string
    accessModes?: string[]
  }
  s3?: {
    bucket?: string
    region?: string
    endpoint?: string
  }
}

interface ProtoTemplateSpec {
  buildkit_image?: string
  buildkitImage?: string
  rootless?: boolean
  arch?: string
  cache_config?: ProtoCacheConfig
  cacheConfig?: ProtoCacheConfig
  resources?: {
    limits?: Record<string, string>
    requests?: Record<string, string>
  }
}

interface ProtoTemplate {
  namespace?: string
  name?: string
  spec?: ProtoTemplateSpec
}

function mapCacheType(raw?: string): CacheType {
  const t = (raw || '').toLowerCase()
  if (t === 'pvc' || t === 'none' || t === 's3') return t as CacheType
  return 'pvc'
}

function mapTemplate(p: ProtoTemplate, organizationId: string): BuilderTemplate {
  const spec = p.spec ?? {}
  const cache = spec.cache_config ?? spec.cacheConfig ?? {}

  return {
    id: p.name ?? '',
    name: p.name ?? '',
    organizationId,
    buildkitImage: spec.buildkit_image ?? spec.buildkitImage ?? 'moby/buildkit:master-rootless',
    rootless: spec.rootless ?? true,
    arch: (spec.arch as '' | 'amd64' | 'arm64') || '',
    cacheType: mapCacheType(cache.type),
    cacheSize: cache.pvc?.size || (cache.pvc as any)?.Size,
    resources: (spec.resources || (spec as any).Resources) as ResourceRequirements | undefined,
  }
}

export async function listTemplates(organizationId: string): Promise<BuilderTemplate[]> {
  const data = await api<{ templates: ProtoTemplate[] }>(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/templates`
  )
  return (data.templates ?? []).map((p) => mapTemplate(p, organizationId))
}

export async function getTemplate(organizationId: string, name: string): Promise<BuilderTemplate> {
  const data = await api<{ template: ProtoTemplate }>(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/templates/${encodeURIComponent(name)}`
  )
  return mapTemplate(data.template ?? {}, organizationId)
}

export interface CreateTemplateParams {
  name: string
  spec: {
    buildkit_image?: string
    rootless?: boolean
    arch?: string
    cache_config?: {
      type: CacheType
      pvc?: { size: string; storageClassName?: string; accessModes?: string[] }
      s3?: { bucket: string; region?: string; endpoint?: string }
    }
    resources?: ResourceRequirements
  }
}

export async function createTemplate(
  organizationId: string,
  params: CreateTemplateParams
): Promise<BuilderTemplate> {
  const data = await api<{ template: ProtoTemplate }>(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/templates`,
    {
      method: 'POST',
      body: JSON.stringify({
        namespace: organizationId,
        name: params.name,
        spec: params.spec,
      }),
    }
  )
  return mapTemplate(data.template ?? {}, organizationId)
}

export async function updateTemplate(
  organizationId: string,
  name: string,
  spec: CreateTemplateParams['spec']
): Promise<BuilderTemplate> {
  const data = await api<{ template: ProtoTemplate }>(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/templates/${encodeURIComponent(name)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ namespace: organizationId, name, spec }),
    }
  )
  return mapTemplate(data.template ?? {}, organizationId)
}

export async function deleteTemplate(organizationId: string, name: string): Promise<void> {
  await api(
    `/v1/namespaces/${encodeURIComponent(organizationId)}/templates/${encodeURIComponent(name)}`,
    { method: 'DELETE' }
  )
}
