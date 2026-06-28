export type BuilderStatus = 'idle' | 'building' | 'offline' | 'error'

export type BuilderSize = 'small' | 'medium' | 'large' | 'xlarge'

export type Region = 'us-east' | 'us-west' | 'eu-central' | 'ap-southeast'

export interface Builder {
  id: string
  name: string
  organizationId: string
  size: BuilderSize
  region: Region
  status: BuilderStatus
  mode?: string // sleepy | persistent
  cacheSize: number // GB
  maxCacheSize: number // GB
  platform: string[]
  templateRef?: string
  // Internet exposure via ingress. expose is the desired state; externalEndpoint is the
  // operator-published address once the IngressRoute and DNS are ready.
  expose?: boolean
  externalEndpoint?: string
  // Snapshot of cpu/memory from the template at creation time (for display).
  // If absent, we try to resolve via templateRef using loaded templates.
  cpu?: string
  memory?: string
  createdAt: Date
  lastUsed?: Date
  buildCount: number
  totalMinutes: number
}

export interface Organization {
  id: string
  name: string
  slug: string
  builderCount: number
  /** Member count from the API (list/get org); may differ from members.length if members not loaded. */
  memberCount: number
  totalMinutes: number
  monthlyMinutes: number
  createdAt: Date
  members: Member[]
}

export interface Member {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Date
}

export interface UsageStats {
  totalBuilds: number
  totalMinutes: number
  monthlyBuilds: number
  monthlyMinutes: number
  avgBuildTime: number
  successRate: number
}

export interface BuildLog {
  id: string
  builderId: string
  builderName: string
  status: 'success' | 'failed' | 'building'
  duration: number // seconds
  image: string
  startedAt: Date
  completedAt?: Date
}

export const BUILDER_SIZES: Record<BuilderSize, { cpu: number; memory: number }> = {
  small: { cpu: 2, memory: 4 },
  medium: { cpu: 4, memory: 8 },
  large: { cpu: 8, memory: 16 },
  xlarge: { cpu: 16, memory: 32 },
}

export const REGIONS: Record<Region, string> = {
  'us-east': 'US East (Virginia)',
  'us-west': 'US West (Oregon)',
  'eu-central': 'EU Central (Frankfurt)',
  'ap-southeast': 'Asia Pacific (Singapore)',
}

// --- Builder Templates (org-scoped) ---

export type CacheType = 'pvc' | 'none' | 's3'

export interface BuilderTemplate {
  id: string
  name: string
  organizationId: string
  buildkitImage: string
  rootless: boolean
  arch: '' | 'amd64' | 'arm64'
  cacheType: CacheType
  cacheSize?: string // e.g. "25Gi" when cacheType === 'pvc'
  resources?: ResourceRequirements
}

export interface ResourceRequirements {
  limits?: Record<string, string>
  requests?: Record<string, string>
}

export const DEFAULT_CACHE_SIZES: Record<string, string> = {
  small: '10Gi',
  medium: '25Gi',
  large: '50Gi',
  xlarge: '100Gi',
}

export const COMMON_BUILDKIT_IMAGES = [
  'moby/buildkit:master-rootless',
  'moby/buildkit:v0.16.0-rootless',
]
