'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatNumber } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, CheckCircle, XCircle, Target, TrendingUp } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts'

const SEVERITY_COLORS = { critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#16A34A', info: '#3B82F6' }

export default function SecurityCenterPage() {
  const router = useRouter()

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
  })

  const severityData = [
    { name: 'Critical', value: 8, color: '#DC2626' },
    { name: 'High', value: 12, color: '#EA580C' },
    { name: 'Medium', value: 15, color: '#D97706' },
    { name: 'Low', value: 10, color: '#16A34A' },
    { name: 'Info', value: 5, color: '#3B82F6' },
  ]

  const complianceData = [
    { standard: 'PCI-DSS', coverage: 72 },
    { standard: 'GDPR', coverage: 85 },
    { standard: 'PSD2', coverage: 63 },
    { standard: 'SOX', coverage: 78 },
    { standard: 'ISO 27001', coverage: 68 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title text-gray-900 dark:text-white">Security Center</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Security posture management and compliance monitoring
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'APIs Scanned', value: dashboard?.total_apis || 0, icon: Shield, color: 'blue' },
          { label: 'Critical Findings', value: severityData[0].value, icon: AlertTriangle, color: 'red' },
          { label: 'Open Findings', value: 35, icon: Target, color: 'orange' },
          { label: 'Avg Security Score', value: '72.4%', icon: TrendingUp, color: 'green' },
          { label: 'Compliance', value: '68.5%', icon: CheckCircle, color: 'purple' },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-card shadow-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} className={`text-${card.color}-500`} />
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Findings by Severity */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h2 className="text-section-title text-gray-900 dark:text-white mb-4">Findings by Severity</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-2">
            {severityData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-500">{entry.name}</span>
                <span className="font-medium text-gray-900 dark:text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Coverage */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h2 className="text-section-title text-gray-900 dark:text-white mb-4">Compliance Coverage</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={complianceData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="standard" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="coverage" radius={[0, 4, 4, 0]}>
                {complianceData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.coverage >= 80 ? '#16A34A' : entry.coverage >= 60 ? '#D97706' : '#DC2626'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Risk APIs */}
      <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
        <h2 className="text-section-title text-gray-900 dark:text-white mb-4">Top 10 Risk APIs</h2>
        <div className="space-y-2">
          {dashboard?.critical_alerts?.map((alert: any, idx: number) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
              onClick={() => router.push(`/inventory/${alert.id}`)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-mono text-gray-400 w-6">{idx + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {alert.http_method} {alert.endpoint_path}
                  </p>
                  <p className="text-xs text-gray-500">{alert.findings_count} findings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-2 py-0.5 text-xs font-bold rounded ${
                  alert.risk_score >= 80 ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                  alert.risk_score >= 60 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                }`}>
                  Risk: {alert.risk_score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
