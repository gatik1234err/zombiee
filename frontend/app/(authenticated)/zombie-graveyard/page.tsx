'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RiskGauge } from '@/components/ui/RiskGauge'
import { timeAgo, formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Skull, Heart, Trash2, AlertTriangle, Shield, Eye, Activity,
  GitPullRequest, Clock, User, Zap, Radio,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const STAGES = ['detected', 'quarantined', 'approved', 'decommissioned']
const STAGE_COLORS: Record<string, string> = {
  detected: 'border-l-red-500',
  quarantined: 'border-l-orange-500',
  approved: 'border-l-yellow-500',
  decommissioned: 'border-l-blue-500',
}

export default function ZombieGraveyardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(false)

  const { data: zombiesData, isLoading } = useQuery({
    queryKey: ['zombies'],
    queryFn: () => api.getZombies(),
    refetchInterval: 15000,
  })

  const { data: shadowsData } = useQuery({
    queryKey: ['shadows'],
    queryFn: () => api.getShadows(),
  })

  const zombies = zombiesData?.data || []
  const shadows = shadowsData?.data || []

  const rescueMutation = useMutation({
    mutationFn: (id: string) => api.rescueAPI(id),
    onSuccess: () => {
      toast.success('API rescued successfully')
      queryClient.invalidateQueries({ queryKey: ['zombies'] })
    },
    onError: () => toast.error('Failed to rescue API'),
  })

  const groupedByStage = STAGES.map((stage) => ({
    stage,
    items: zombies.filter((z: any) => z.current_stage === stage),
  }))

  const trafficSpikeData = [
    { hour: '00:00', requests: 2 },
    { hour: '04:00', requests: 0 },
    { hour: '08:00', requests: 1 },
    { hour: '12:00', requests: 2341 },
    { hour: '16:00', requests: 1567 },
    { hour: '20:00', requests: 892 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-gray-900 dark:text-white">Zombie Graveyard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track, quarantine, and decommission zombie APIs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {zombies.length} zombies &middot; {shadows.length} shadows
          </span>
        </div>
      </div>

      {/* Safety Catch Alert */}
      {!dismissed && (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-card p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Traffic Spike Detected!</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                  2,341 requests in 2 hours on <strong>GET /legacy/accounts/{'{id}'}</strong> (Quarantined)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const quarantined = zombies.find((z: any) => z.current_stage === 'quarantined')
                    if (quarantined) rescueMutation.mutate(quarantined.api_id)
                    else toast.error('No quarantined API found')
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Rescue
                </button>
                <button
                  onClick={() => {
                    const quarantined = zombies.find((z: any) => z.current_stage === 'quarantined')
                    if (quarantined) router.push(`/inventory/${quarantined.api_id}`)
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Investigate
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <div className="mt-3 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficSpikeData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#DC2626" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Shadow API Alert */}
      {shadows.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-card p-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
              {shadows.length} shadow APIs detected with no documentation
            </span>
            <button
              onClick={() => router.push('/inventory?status=shadow')}
              className="ml-auto text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {groupedByStage.map(({ stage, items }) => (
          <div key={stage} className="bg-gray-50 dark:bg-gray-900/50 rounded-card p-3 min-h-[400px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">{stage}</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                {items.length}
              </span>
            </div>
            <div className="space-y-3">
              {items.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">No APIs in {stage}</p>
              )}
              {items.map((zombie: any) => (
                <div
                  key={zombie.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-l-red-500 p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/inventory/${zombie.api_id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <RiskGauge score={zombie.risk_score} size={32} />
                    <StatusBadge status={zombie.current_stage} />
                  </div>
                  <p className="text-xs font-mono font-medium text-gray-900 dark:text-white truncate mb-1">
                    {zombie.http_method} {zombie.endpoint_path}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">{zombie.owner_team || 'No owner'}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {zombie.days_in_stage}d in stage
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity size={10} />
                      {zombie.days_since_last_traffic}d no traffic
                    </span>
                  </div>
                  {zombie.auto_decommission_date && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-orange-500">
                        Auto-decommission: {formatDate(zombie.auto_decommission_date)}
                      </span>
                    </div>
                  )}
                  {zombie.pr_url && (
                    <div className="mt-1">
                      <a
                        href={zombie.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GitPullRequest size={10} />
                        PR #{zombie.pr_url.split('/').pop()} {zombie.pr_status}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Zombie Detection Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-section-title text-gray-900 dark:text-white">Detection Feed</h2>
          <div className="flex items-center gap-1.5 text-xs text-green-500">
            <Radio size={12} className="animate-pulse" />
            Live
          </div>
        </div>
        <div className="space-y-2">
          {zombies.slice(0, 5).map((zombie: any) => (
            <div
              key={zombie.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
              onClick={() => router.push(`/inventory/${zombie.api_id}`)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Skull size={16} className="text-red-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {zombie.http_method} {zombie.endpoint_path}
                  </p>
                  <p className="text-xs text-gray-500">
                    Detected {timeAgo(zombie.detected_at)} &middot; Risk: {zombie.risk_score} &middot; {zombie.environment}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  api.quarantineAPI(zombie.api_id).then(() => {
                    toast.success('API quarantined')
                    queryClient.invalidateQueries({ queryKey: ['zombies'] })
                  }).catch(() => toast.error('Failed to quarantine'))
                }}
                className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Quarantine
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
