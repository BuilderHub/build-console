import type { ReactNode } from 'react'

/** Avoid stale static HTML for account settings (profile-only UI). */
export const dynamic = 'force-dynamic'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children
}
