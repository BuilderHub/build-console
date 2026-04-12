'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useOrg } from '@/contexts/OrgContext'
import { listOrganizations } from '@/lib/organizations-api'
import type { Organization } from '@/types'
import { Building2, ChevronDown, Check } from 'lucide-react'
import clsx from 'clsx'

export function OrgSwitcher() {
  const { org, slug } = useOrg()
  const [open, setOpen] = useState(false)
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      listOrganizations()
        .then(setOrgs)
        .finally(() => setLoading(false))
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const basePath = slug ? `/org/${slug}` : ''

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-left text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition-colors min-w-[12rem]"
      >
        <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate flex-1">
          {org?.name ?? slug ?? 'Organizations'}
        </span>
        <ChevronDown
          className={clsx('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-slate-700 bg-slate-900 shadow-xl py-1">
          <div className="border-b border-slate-700 px-3 py-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Switch organization
            </p>
          </div>
          {loading ? (
            <div className="px-3 py-4 text-center text-sm text-slate-400">
              Loading…
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {orgs.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/org/${o.slug}/builders`}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      'flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors',
                      o.slug === slug
                        ? 'bg-primary-950/30 text-primary-400'
                        : 'text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    <span className="truncate">{o.name}</span>
                    {o.slug === slug && <Check className="h-4 w-4 shrink-0" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-700 pt-1">
            <Link
              href="/organizations"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Manage organizations
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
