'use client'

import { useParams } from 'next/navigation'
import { OrgProvider } from '@/contexts/OrgContext'
import { OrgShell } from '@/components/OrgShell'

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''

  if (!slug) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <p className="text-slate-400">Invalid organization</p>
      </div>
    )
  }

  return (
    <OrgProvider slug={slug}>
      <OrgShell>{children}</OrgShell>
    </OrgProvider>
  )
}
