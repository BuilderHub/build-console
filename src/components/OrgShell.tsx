'use client'

import { useOrg } from '@/contexts/OrgContext'
import { OrgSwitcher } from '@/components/OrgSwitcher'

export function OrgShell({ children }: { children: React.ReactNode }) {
  const { org, isLoading, error } = useOrg()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-950 px-4">
        <p className="text-slate-400">{error ?? 'Organization not found'}</p>
        <a
          href="/organizations"
          className="text-sm font-medium text-primary-400 hover:text-primary-300"
        >
          Back to organizations
        </a>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-900/50 px-6">
        <OrgSwitcher />
      </header>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
