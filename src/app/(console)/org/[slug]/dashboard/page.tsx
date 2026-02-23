'use client'

import Link from 'next/link'
import { Header } from '@/components/Header'
import { Card, CardHeader } from '@/components/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { useOrg } from '@/contexts/OrgContext'
import { mockBuilders, mockBuildLogs } from '@/lib/mock-data'
import { Activity, Box, Clock, TrendingUp, Zap, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function OrgDashboardPage() {
  const { org, slug } = useOrg()
  const recentBuilds = mockBuildLogs.slice(0, 5)
  const activeBuilders = mockBuilders.filter(
    (b) => b.status === 'idle' || b.status === 'building'
  )

  if (!org) return null

  const stats = [
    { label: 'Active Builders', value: activeBuilders.length.toString(), change: '+2 this month', icon: Box, trend: 'up' as const },
    { label: 'Builds This Month', value: '342', change: '+12% from last month', icon: Activity, trend: 'up' as const },
    { label: 'Build Minutes', value: `${org.monthlyMinutes}`, change: `of ${org.plan === 'pro' ? '1,000' : 'unlimited'} used`, icon: Clock, trend: 'neutral' as const },
    { label: 'Success Rate', value: '94.2%', change: '+2.1% from last month', icon: CheckCircle2, trend: 'up' as const },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle={`Welcome back to ${org.name}`} />
      <div className="flex-1 p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-2">{stat.change}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-950/50 border border-primary-800">
                    <Icon className="h-6 w-6 text-primary-400" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Recent Builds" subtitle="Latest build activity across all builders" />
            <div className="space-y-3">
              {recentBuilds.map((build) => (
                <div key={build.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{build.image}</p>
                    <p className="text-xs text-slate-400 mt-1">{build.builderName} • {formatDistanceToNow(build.startedAt, { addSuffix: true })}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {build.status !== 'building' && <span className="text-xs text-slate-500">{build.duration}s</span>}
                    <StatusBadge status={build.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Active Builders" subtitle={`${activeBuilders.length} builders ready`} />
            <div className="space-y-3">
              {activeBuilders.slice(0, 5).map((builder) => (
                <div key={builder.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{builder.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{builder.size} • {builder.region} • {builder.buildCount} builds</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <p className="text-xs text-slate-500">{builder.cacheSize.toFixed(1)} / {builder.maxCacheSize} GB</p>
                    <StatusBadge status={builder.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card>
          <CardHeader title="Quick Actions" subtitle="Common tasks and shortcuts" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/org/${slug}/builders`} className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-primary-700 transition-all text-left group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-950/50 border border-primary-800 group-hover:bg-primary-900/50 transition-colors">
                <Box className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Create Builder</p>
                <p className="text-xs text-slate-400">Add a new builder</p>
              </div>
            </Link>
            <Link href={`/org/${slug}/usage`} className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-primary-700 transition-all text-left group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-950/50 border border-primary-800 group-hover:bg-primary-900/50 transition-colors">
                <Zap className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">View Usage</p>
                <p className="text-xs text-slate-400">Check your metrics</p>
              </div>
            </Link>
            <button className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-primary-700 transition-all text-left group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-950/50 border border-primary-800 group-hover:bg-primary-900/50 transition-colors">
                <TrendingUp className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Documentation</p>
                <p className="text-xs text-slate-400">Learn more</p>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
