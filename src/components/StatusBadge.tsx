import clsx from 'clsx'
import type { BuilderStatus } from '@/types'

interface StatusBadgeProps {
  status: BuilderStatus | 'success' | 'failed' | 'building'
  size?: 'sm' | 'md'
}

const statusConfig = {
  idle: { label: 'Online', color: 'text-slate-400 bg-slate-900 border-slate-700' },
  building: { label: 'Building', color: 'text-primary-400 bg-primary-950 border-primary-800' },
  offline: { label: 'Offline', color: 'text-slate-500 bg-slate-900 border-slate-700' },
  error: { label: 'Error', color: 'text-red-400 bg-red-950 border-red-800' },
  success: { label: 'Success', color: 'text-emerald-400 bg-emerald-950 border-emerald-800' },
  failed: { label: 'Failed', color: 'text-red-400 bg-red-950 border-red-800' },
}

// Custom dot colors per status (the circle indicator)
const dotColor = {
  idle: 'bg-emerald-500',
  building: undefined, // uses the special animate-pulse + bg-current logic
  offline: 'bg-slate-500',
  error: 'bg-red-500',
  success: 'bg-emerald-500',
  failed: 'bg-red-500',
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.color,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      <span
        className={clsx(
          'rounded-full',
          status === 'building'
            ? 'animate-pulse bg-current'
            : dotColor[status as keyof typeof dotColor] || 'bg-current',
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
        )}
      />
      {config.label}
    </span>
  )
}
