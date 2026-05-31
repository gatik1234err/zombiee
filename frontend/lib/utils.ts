import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-status-active',
    deprecated: 'bg-status-deprecated',
    orphaned: 'bg-status-orphaned',
    shadow: 'bg-status-shadow',
    zombie: 'bg-status-zombie',
  }
  return colors[status] || 'bg-gray-500'
}

export function getRiskColor(score: number): string {
  if (score >= 80) return 'text-risk-critical'
  if (score >= 60) return 'text-risk-high'
  if (score >= 40) return 'text-risk-medium'
  return 'text-risk-low'
}

export function getRiskBg(score: number): string {
  if (score >= 80) return 'bg-risk-critical'
  if (score >= 60) return 'bg-risk-high'
  if (score >= 40) return 'bg-risk-medium'
  return 'bg-risk-low'
}
