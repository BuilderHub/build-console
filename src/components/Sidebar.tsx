'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Box,
  Building2,
  Settings,
  Users,
  Key,
  BarChart3,
  Boxes,
  LogOut,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Builders', href: '/builders', icon: Box },
  { name: 'Organizations', href: '/organizations', icon: Building2 },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Usage', href: '/usage', icon: BarChart3 },
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
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <Boxes className="h-8 w-8 text-primary-500" />
        <span className="text-xl font-bold text-gradient">BuilderHub</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-950/50 text-primary-400 border border-primary-800'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
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
