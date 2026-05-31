'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RiskGauge } from '@/components/ui/RiskGauge'
import { formatDate, formatDateTime, timeAgo, formatNumber } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Copy, Shield, BarChart3, GitBranch, Clock, User, Tag,
  Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Skull, Heart, Trash2, ExternalLink,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const TABS = ['overview', 'security', 'traffic', 'dependencies', 'audit']

const SECURITY_DIMENSIONS = [
  'authentication', 'authorization', 'encryption', 'rate_limiting',
  'input_validation', 'data_exposure', 'infra_security', 'headers',
  'cors', 'logging', 'compliance', 'dependencies',
]

export default function APIDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [copied, setCopied] = useState(false)

  const { data: apiData, isLoading } = useQuery<any>({
    queryKey: ['api-detail', params.id],
    queryFn: () => api.getAPIDetail(params.id),
  })

  const quarantineMutation = useMutation({
    mutationFn: () => api.quarantineAPI(params.id),
    onSuccess: () => {
      toast.success('API quarantined successfully')
      queryClient.invalidateQueries({ queryKey: ['api-detail', params.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('Failed to quarantine API'),
  })

  const rescueMutation = useMutation({
    mutationFn: () => api.rescueAPI(params.id),
    onSuccess: () => {
      toast.success('API rescued successfully')
      queryClient.invalidateQueries({ queryKey: ['api-detail', params.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('Failed to rescue API'),
  })

  const decommissionMutation = useMutation({
    mutationFn: () => api.decommissionAPI(params.id),
    onSuccess: () => {
      toast.success('API decommissioned successfully')
      queryClient.invalidateQueries({ queryKey: ['api-detail', params.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('Failed to decommission API'),
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const api = apiData

  if (!api) {
    return <div className="text-center py-12 text-gray-400">API not found</div>
  }

  const trafficData = api.traffic_metrics?.slice(-24).map((m: any) => ({
    time: new Date(m.time).getHours() + ':00',
    requests: m.request_count,
    errors: m.error_4xx_count + m.error_5xx_count,
    avg: m.avg_response_time_ms,
  })) || []

  const summaryMetrics = [
    { label: 'First Seen', value: formatDate(api.first_seen), icon: Clock },
    { label: 'Last Seen', value: timeAgo(api.last_seen), icon: Activity },
    { label: 'Owner', value: api.owner_team || 'Unassigned', icon: User },
    { label: 'Tags', value: api.tags?.join(', ') || 'None', icon: Tag },
    { label: 'Domain', value: api.business_domain || 'N/A', icon: BarChart3 },
    { label: 'Framework', value: api.framework || 'Unknown', icon: Shield },
  ]

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/inventory')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft size={16} />
        Back to Inventory
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <RiskGauge score={api.risk_score} size={80} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                  api.http_method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                  api.http_method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  api.http_method === 'PUT' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                }`}>
                  {api.http_method}
                </span>
                <span className="font-mono text-sm text-gray-500 dark:text-gray-300 truncate max-w-[400px]">
                  {api.endpoint_path}
                </span>
                <button
                  onClick={() => copyToClipboard(api.endpoint_path)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 flex-shrink-0"
                >
                  {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={api.status} />
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                  {api.environment}
                </span>
                <span className="text-xs text-gray-400">{api.protocol} &middot; {api.tls_version}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {api.status === 'zombie' && (
              <button
                onClick={() => quarantineMutation.mutate()}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                <Skull size={16} />
                Quarantine
              </button>
            )}
            {(api.status === 'zombie' || api.status === 'orphaned') && (
              <button
                onClick={() => rescueMutation.mutate()}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Heart size={16} />
                Rescue
              </button>
            )}
            {api.status !== 'deprecated' && (
              <button
                onClick={() => decommissionMutation.mutate()}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} />
                Decommission
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-card shadow-card p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg capitalize transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
            <h3 className="text-section-title text-gray-900 dark:text-white mb-4">API Information</h3>
            <div className="space-y-3">
              {summaryMetrics.map((metric) => (
                <div key={metric.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <metric.icon size={14} />
                    <span>{metric.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
            <h3 className="text-section-title text-gray-900 dark:text-white mb-4">Security Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Authentication', score: Math.max(0, api.risk_score - 20) },
                { label: 'Authorization', score: Math.max(0, api.risk_score - 15) },
                { label: 'Encryption', score: Math.max(10, 100 - api.risk_score) },
                { label: 'Rate Limiting', score: Math.max(0, 80 - api.risk_score) },
                { label: 'Input Validation', score: Math.max(0, api.risk_score - 10) },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className={`text-sm font-medium ${
                      item.score >= 70 ? 'text-green-500' : item.score >= 40 ? 'text-yellow-500' : 'text-red-500'
                    }`}>{item.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        item.score >= 70 ? 'bg-green-500' : item.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h3 className="text-section-title text-gray-900 dark:text-white mb-4">Security Findings</h3>
          <div className="space-y-3">
            {api.security_findings?.length > 0 ? api.security_findings.map((finding: any) => (
              <div key={finding.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        finding.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                        finding.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                        finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      }`}>
                        {finding.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{finding.title}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{finding.description}</p>
                    {finding.evidence && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                        {finding.evidence}
                      </div>
                    )}
                    {finding.remediation_steps && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Remediation:</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{finding.remediation_steps}</p>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-mono text-gray-400">CVSS: {finding.cvss_score || 'N/A'}</span>
                </div>
              </div>
            )) : (
              <p className="text-center py-8 text-gray-400">No security findings</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'traffic' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
            <h3 className="text-section-title text-gray-900 dark:text-white mb-4">Requests (Last 24h)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trafficData}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="requests" fill="#2563EB" radius={[2, 2, 0, 0]} />
                <Bar dataKey="errors" fill="#DC2626" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
            <h3 className="text-section-title text-gray-900 dark:text-white mb-4">Response Time (ms)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trafficData}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="#16A34A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h3 className="text-section-title text-gray-900 dark:text-white mb-4">Audit Trail</h3>
          <p className="text-sm text-gray-400 text-center py-8">Audit trail loading...</p>
        </div>
      )}

      {activeTab === 'dependencies' && (
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h3 className="text-section-title text-gray-900 dark:text-white mb-4">Dependency Graph</h3>
          <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-400">Dependency graph visualization coming soon</p>
          </div>
        </div>
      )}
    </div>
  )
}
