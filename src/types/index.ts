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
  cacheSize: number // GB
  maxCacheSize: number // GB
  platform: string[]
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
