'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface RiskGaugeProps {
  score: number
  size?: number
  className?: string
}

export function RiskGauge({ score, size = 64, className }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const getColor = (s: number) => {
    if (s >= 80) return '#DC2626'
    if (s >= 60) return '#EA580C'
    if (s >= 40) return '#D97706'
    return '#16A34A'
  }

  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span
        className="absolute text-sm font-bold"
        style={{ color: getColor(score) }}
      >
        {score}
      </span>
    </div>
  )
}


