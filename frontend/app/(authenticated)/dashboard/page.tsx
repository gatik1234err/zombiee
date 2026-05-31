'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatNumber, timeAgo } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Legend,
} from 'recharts'
import {
  Activity, AlertTriangle, Skull, Eye, Shield, Database, ArrowRight, Zap,
} from 'lucide-react'

const RISK_COLORS = { critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#16A34A' }
const STATUS_COLORS = { active: '#16A34A', deprecated: '#D97706', orphaned: '#7C3AED', shadow: '#DC2626', zombie: '#7F1D1D' }

export default function DashboardPage() {
  const router = useRouter()

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
    refetchInterval: 30000,
  })

  const { data: scoreboard } = useQuery({
    queryKey: ['scoreboard'],
    queryFn: () => api.getScoreboard(),
  })

  const stats = dashboard
  const sb = scoreboard

  const riskData = stats?.risk_distribution
    ? Object.entries(stats.risk_distribution as Record<string, number>).map(([name, value]) => ({ name, value }))
    : []

  const statusTrend = [
    { date: 'Week 1', active: 42, zombie: 3, shadow: 4, deprecated: 10, orphaned: 6 },
    { date: 'Week 2', active: 44, zombie: 4, shadow: 5, deprecated: 11, orphaned: 6 },
    { date: 'Week 3', active: 43, zombie: 5, shadow: 5, deprecated: 11, orphaned: 7 },
    { date: 'Week 4', active: 45, zombie: 5, shadow: 5, deprecated: 12, orphaned: 8 },
  ]

  const envData = stats?.environment_breakdown
    ? Object.entries(stats.environment_breakdown).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title text-gray-900 dark:text-white">Command Center</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Real-time overview of your API security posture
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total APIs"
          value={stats?.total_apis || 0}
          icon={<Database size={20} />}
          color="blue"
          onClick={() => router.push('/inventory')}
        />
        <StatCard
          title="Active"
          value={stats?.active_count || 0}
          icon={<Activity size={20} />}
          color="green"
          onClick={() => router.push('/inventory?status=active')}
        />
        <StatCard
          title="Deprecated"
          value={stats?.deprecated_count || 0}
          icon={<Eye size={20} />}
          color="yellow"
          onClick={() => router.push('/inventory?status=deprecated')}
        />
        <StatCard
          title="Orphaned"
          value={stats?.orphaned_count || 0}
          icon={<AlertTriangle size={20} />}
          color="purple"
          onClick={() => router.push('/inventory?status=orphaned')}
        />
        <StatCard
          title="Shadow"
          value={stats?.shadow_count || 0}
          icon={<Shield size={20} />}
          color="red"
          onClick={() => router.push('/inventory?status=shadow')}
        />
        <StatCard
          title="Zombie"
          value={stats?.zombie_count || 0}
          icon={<Skull size={20} />}
          color="orange"
          onClick={() => router.push('/inventory?status=zombie')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h2 className="text-section-title text-gray-900 dark:text-white mb-4">Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {riskData.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] || '#888'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {riskData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: RISK_COLORS[entry.name as keyof typeof RISK_COLORS] }}
                />
                <span className="text-gray-600 dark:text-gray-400 capitalize">{entry.name}</span>
                <span className="font-medium text-gray-900 dark:text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API Status Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h2 className="text-section-title text-gray-900 dark:text-white mb-4">Status Trend (30d)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={statusTrend}>
              <defs>
                {Object.entries(STATUS_COLORS).map(([key, color]) => (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {Object.entries(STATUS_COLORS).map(([key, color]) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  fill={`url(#gradient-${key})`}
                  stackId="1"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Discoveries */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h2 className="text-section-title text-gray-900 dark:text-white mb-4">Recent Discoveries</h2>
          <div className="space-y-3 max-h-[220px] overflow-y-auto scrollbar-thin">
            {stats?.recent_discoveries?.slice(0, 6).map((api: any) => (
              <div
                key={api.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/inventory/${api.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    api.status === 'active' ? 'bg-green-500' :
                    api.status === 'shadow' ? 'bg-red-500' :
                    api.status === 'zombie' ? 'bg-red-800' :
                    api.status === 'deprecated' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {api.http_method} {api.endpoint_path}
                    </p>
                    <p className="text-xs text-gray-500">{timeAgo(api.first_seen)}</p>
                  </div>
                </div>
                <StatusBadge status={api.status} />
              </div>
            ))}
            {(!stats?.recent_discoveries || stats.recent_discoveries.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-8">No recent discoveries</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-section-title text-gray-900 dark:text-white">Critical Alerts</h2>
            <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-medium">
              {stats?.critical_alerts?.length || 0} alerts
            </span>
          </div>
          <div className="space-y-3">
            {stats?.critical_alerts?.map((alert: any) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {alert.http_method} {alert.endpoint_path}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                      Risk Score: {alert.risk_score} &middot; {alert.findings_count} findings
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/inventory/${alert.id}`)}
                    className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Investigate
                  </button>
                </div>
              </div>
            ))}
            {(!stats?.critical_alerts || stats.critical_alerts.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">No critical alerts</p>
            )}
          </div>
        </div>

        {/* Decommission Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h2 className="text-section-title text-gray-900 dark:text-white mb-4">Decommission Progress</h2>
          <div className="space-y-4">
            {['detected', 'quarantined', 'approved', 'decommissioned', 'completed'].map((stage) => {
              const count = stats?.decommission_progress?.[stage] || 0
              const total = (Object.values(stats?.decommission_progress || {}) as number[]).reduce((a: number, b: number) => a + b, 0) || 1
              const pct = Math.round((count / total) * 100)
              const stageColors: Record<string, string> = {
                detected: 'bg-red-500',
                quarantined: 'bg-orange-500',
                approved: 'bg-yellow-500',
                decommissioned: 'bg-blue-500',
                completed: 'bg-green-500',
              }
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{stage}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${stageColors[stage]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Environment Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h2 className="text-section-title text-gray-900 dark:text-white mb-4">Environment Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={envData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Scoreboard Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-section-title text-gray-900 dark:text-white">
            Monthly Zombie Scoreboard — {sb?.month || 'Loading'} {sb?.year || ''}
          </h2>
          <button
            onClick={() => router.push('/reports')}
            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Full Report <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-red-500">{sb?.zombies_found || 0}</p>
            <p className="text-xs text-gray-500">Zombies Found</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-green-500">{sb?.zombies_decommissioned || 0}</p>
            <p className="text-xs text-gray-500">Decommissioned</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-blue-500">{sb?.zombies_rescued || 0}</p>
            <p className="text-xs text-gray-500">Rescued</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-500">
              ${formatNumber(sb?.cost_savings_estimate || 0)}
            </p>
            <p className="text-xs text-gray-500">Cost Savings</p>
          </div>
        </div>

        {/* Top Owners */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Owners by Zombie Count</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500 font-medium">Team</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Zombie APIs</th>
                </tr>
              </thead>
              <tbody>
                {stats?.top_owners?.map((owner: any) => (
                  <tr key={owner.team} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-2 text-gray-900 dark:text-white">{owner.team}</td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{owner.count}</td>
                  </tr>
                ))}
                {(!stats?.top_owners || stats.top_owners.length === 0) && (
                  <tr><td colSpan={2} className="text-center py-4 text-gray-400">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
