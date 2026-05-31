'use client'

import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Active' },
  deprecated: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Deprecated' },
  orphaned: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Orphaned' },
  shadow: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Shadow' },
  zombie: { color: 'bg-red-900 text-red-100 dark:bg-red-950 dark:text-red-200', label: 'Zombie' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', config.color, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-green-500': status === 'active',
        'bg-yellow-500': status === 'deprecated',
        'bg-purple-500': status === 'orphaned',
        'bg-red-500': status === 'shadow',
        'bg-red-800': status === 'zombie',
      })} />
      {config.label}
    </span>
  )
}
