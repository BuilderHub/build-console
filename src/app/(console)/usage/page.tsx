'use client'

import { Header } from '@/components/Header'
import { Card, CardHeader } from '@/components/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { mockBuildLogs, mockBuilders, mockOrganizations } from '@/lib/mock-data'
import { Activity, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

export default function UsagePage() {
  const organization = mockOrganizations[0]
  const allBuilds = mockBuildLogs

  const stats = [
    {
      label: 'Total Builds',
      value: allBuilds.length.toString(),
      icon: Activity,
    },
    {
      label: 'Successful Builds',
      value: allBuilds.filter(b => b.status === 'success').length.toString(),
      icon: CheckCircle2,
    },
    {
      label: 'Failed Builds',
      value: allBuilds.filter(b => b.status === 'failed').length.toString(),
      icon: XCircle,
    },
    {
      label: 'Avg Build Time',
      value: '103s',
      icon: Clock,
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Usage & Analytics" 
        subtitle="Monitor your build activity and performance"
      />
      
      <div className="flex-1 p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-950/50 border border-primary-800">
                    <Icon className="h-6 w-6 text-primary-400" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Build History */}
        <Card>
          <CardHeader 
            title="Build History" 
            subtitle="Complete log of all builds"
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Builder
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Started
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allBuilds.map((build) => (
                  <tr key={build.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-white">{build.image}</p>
                      <p className="text-xs text-slate-500">{build.id}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-300">{build.builderName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={build.status} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-300">
                        {build.status === 'building' ? (
                          <span className="text-slate-500">In progress...</span>
                        ) : (
                          `${build.duration}s`
                        )}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-300">
                        {format(build.startedAt, 'MMM d, h:mm a')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(build.startedAt, { addSuffix: true })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Builder Usage */}
        <Card>
          <CardHeader 
            title="Builder Usage" 
            subtitle="Build minutes per builder"
          />
          <div className="space-y-4">
            {mockBuilders.map((builder) => (
              <div key={builder.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{builder.name}</span>
                  <span className="text-sm text-slate-400">
                    {builder.totalMinutes} minutes ({builder.buildCount} builds)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-primary-500"
                    style={{ width: `${(builder.totalMinutes / organization.totalMinutes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
