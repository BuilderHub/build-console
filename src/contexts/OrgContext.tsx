'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Organization } from '@/types'
import { listOrganizations } from '@/lib/organizations-api'

interface OrgContextValue {
  org: Organization | null
  slug: string | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrgProvider({
  slug,
  children,
}: {
  slug: string
  children: ReactNode
}) {
  const [org, setOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const list = await listOrganizations()
      const found = list.find((o) => o.slug === slug)
      setOrg(found ?? null)
      if (!found) setError('Organization not found')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organization')
      setOrg(null)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo<OrgContextValue>(
    () => ({
      org,
      slug,
      isLoading,
      error,
      refresh,
    }),
    [org, slug, isLoading, error, refresh]
  )

  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  )
}

const defaultOrgValue: OrgContextValue = {
  org: null,
  slug: null,
  isLoading: false,
  error: null,
  refresh: async () => {},
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext)
  return ctx ?? defaultOrgValue
}
