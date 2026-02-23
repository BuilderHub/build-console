'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const PUBLIC_PATHS = ['/login', '/signup']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p))
    if (!user && !isPublic) {
      router.replace('/login')
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p))
  if (!user && !isPublic) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
