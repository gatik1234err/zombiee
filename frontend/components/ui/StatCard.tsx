'use client'

import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: React.ReactNode
  color?: string
  onClick?: () => void
}

export function StatCard({ title, value, subtitle, icon, color = 'blue', onClick }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    yellow: 'border-l-yellow-500',
    red: 'border-l-red-500',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500',
  }

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-card shadow-card p-4 
        border-l-4 ${colorClasses[color] || 'border-l-blue-500'}
        cursor-pointer transition-all
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400 dark:text-gray-500">{icon}</div>
        )}
      </div>
    </motion.div>
  )
}
