'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  // LayoutDashboard,
  Box,
  Settings,
  Users,
  Key,
  // BarChart3,
  Boxes,
  LogOut,
  Layers,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { OrgSwitcher } from '@/components/OrgSwitcher'

// Org nav: Dashboard & Usage hidden until implemented — uncomment entries + LayoutDashboard/BarChart3 imports above.
const orgScopedNav = (slug: string) => [
  // { name: 'Dashboard', href: `/org/${slug}/dashboard`, icon: LayoutDashboard },
  { name: 'Builders', href: `/org/${slug}/builders`, icon: Box },
  { name: 'Templates', href: `/org/${slug}/templates`, icon: Layers },
  { name: 'Team', href: `/org/${slug}/team`, icon: Users },
  // { name: 'Usage', href: `/org/${slug}/usage`, icon: BarChart3 },
  { name: 'Settings', href: `/org/${slug}/settings`, icon: Settings },
]

const globalNav = [
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Settings', href: '/settings', icon: Settings },
]

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900/50">
      {/* Logo — home */}
      <Link
        href="/"
        className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-800 px-6 transition-colors hover:bg-slate-800/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600"
        aria-label="Home"
      >
        <Boxes className="h-8 w-8 shrink-0 text-primary-500" />
        <span className="text-xl font-bold text-gradient">BuilderHub</span>
      </Link>

      {/* Org switcher (incl. Manage organizations) — only when not inside /org/...; org layout uses header switcher */}
      {pathname && !pathname.startsWith('/org/') ? (
        <div className="border-b border-slate-800 px-3 py-3">
          <OrgSwitcher />
        </div>
      ) : null}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {(() => {
          const orgMatch = pathname?.match(/^\/org\/([^/]+)/)
          const slug = orgMatch?.[1]
          const items = slug ? orgScopedNav(slug) : globalNav
          return items.map((item) => {
            const isActive =
              pathname === item.href || Boolean(pathname?.startsWith(item.href + '/'))
            const Icon = item.icon
            return (
              <Link
                key={item.name + item.href}
                href={item.href}
                className={clsx(
                  // Keep a 1px border on every row so active state does not shift layout (fixes misaligned clicks).
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary-800 bg-primary-950/50 text-primary-400'
                    : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })
        })()}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-4">
        {user ? (
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary-800 bg-primary-950 text-sm font-semibold text-primary-400">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
