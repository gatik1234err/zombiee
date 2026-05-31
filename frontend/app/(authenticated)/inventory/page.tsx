'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useFilterStore } from '@/lib/store'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RiskGauge } from '@/components/ui/RiskGauge'
import { formatDate, formatNumber, timeAgo, getStatusColor } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Search, Filter, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  MoreHorizontal, SlidersHorizontal, X, Save, Eye, Skull, Heart, Trash2, Copy,
} from 'lucide-react'

const PAGE_SIZES = [25, 50, 100, 250]
const STATUSES = ['active', 'deprecated', 'orphaned', 'shadow', 'zombie']
const ENVIRONMENTS = ['production', 'staging', 'development', 'uat']
const RISK_TIERS = ['critical', 'high', 'medium', 'low']
const SENSITIVITIES = ['public', 'internal', 'confidential', 'restricted']

export default function InventoryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('last_seen')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const [filters, setFilters] = useState<Record<string, string>>({})

  // Sync global search from TopBar into local state
  const globalSearch = useFilterStore((s) => s.searchQuery)
  const setGlobalSearch = useFilterStore((s) => s.setSearchQuery)

  useEffect(() => {
    setSearch(globalSearch)
    searchTimer(globalSearch)
  }, [globalSearch])

  // Debounce search
  const searchTimer = useMemo(() => {
    let timer: NodeJS.Timeout
    return (value: string) => {
      clearTimeout(timer)
      timer = setTimeout(() => setDebouncedSearch(value), 300)
    }
  }, [])

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: page.toString(),
      page_size: pageSize.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
    }
    if (debouncedSearch) params.search = debouncedSearch
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
    return params
  }, [page, pageSize, sortBy, sortOrder, debouncedSearch, filters])

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', queryParams],
    queryFn: () => api.getInventory(queryParams),
  })

  const quarantineMutation = useMutation({
    mutationFn: (id: string) => api.quarantineAPI(id),
    onSuccess: () => {
      toast.success('API quarantined')
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: () => toast.error('Failed to quarantine API'),
  })

  const rescueMutation = useMutation({
    mutationFn: (id: string) => api.rescueAPI(id),
    onSuccess: () => {
      toast.success('API rescued')
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: () => toast.error('Failed to rescue API'),
  })

  const decommissionMutation = useMutation({
    mutationFn: (id: string) => api.decommissionAPI(id),
    onSuccess: () => {
      toast.success('API decommissioned')
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: () => toast.error('Failed to decommission API'),
  })

  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortOrder('desc')
    }
  }

  const toggleFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const existing = prev[key]
      const values = existing ? existing.split(',') : []
      const idx = values.indexOf(value)
      if (idx >= 0) values.splice(idx, 1)
      else values.push(value)
      const next = { ...prev }
      if (values.length > 0) next[key] = values.join(',')
      else delete next[key]
      return next
    })
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === data?.items?.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data?.items?.map((i: any) => i.id) || []))
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return null
    return sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-gray-900 dark:text-white">API Inventory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data?.total || 0} total APIs &middot; Page {page} of {data?.total_pages || 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <span className="text-sm text-blue-600 dark:text-blue-400">{selected.size} selected</span>
              <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                Assign Owner
              </button>
              <button className="text-xs px-2 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
                Export
              </button>
            </div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
              Object.keys(filters).length > 0
                ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by endpoint, API ID, owner, domain, tags..."
          onChange={(e) => { setSearch(e.target.value); searchTimer(e.target.value) }}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setDebouncedSearch(''); setGlobalSearch('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">Clear all</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-label text-gray-500 mb-2">Status</p>
              <div className="space-y-1.5">
                {STATUSES.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(s)}
                      onChange={() => toggleFilter('status', s)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label text-gray-500 mb-2">Environment</p>
              <div className="space-y-1.5">
                {ENVIRONMENTS.map((e) => (
                  <label key={e} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.environment?.includes(e)}
                      onChange={() => toggleFilter('environment', e)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{e}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label text-gray-500 mb-2">Risk Tier</p>
              <div className="space-y-1.5">
                {RISK_TIERS.map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.risk_tier?.includes(t)}
                      onChange={() => toggleFilter('risk_tier', t)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label text-gray-500 mb-2">Data Sensitivity</p>
              <div className="space-y-1.5">
                {SENSITIVITIES.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.data_sensitivity?.includes(s)}
                      onChange={() => toggleFilter('data_sensitivity', s)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size > 0 && selected.size === data?.items?.length}
                    onChange={selectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left px-4 py-3 text-label text-gray-500 cursor-pointer" onClick={() => handleSort('endpoint_path')}>
                  <div className="flex items-center gap-1">Endpoint <SortIcon col="endpoint_path" /></div>
                </th>
                <th className="text-left px-4 py-3 text-label text-gray-500 cursor-pointer" onClick={() => handleSort('environment')}>
                  <div className="flex items-center gap-1">Environment <SortIcon col="environment" /></div>
                </th>
                <th className="text-left px-4 py-3 text-label text-gray-500 cursor-pointer" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">Status <SortIcon col="status" /></div>
                </th>
                <th className="text-left px-4 py-3 text-label text-gray-500 cursor-pointer" onClick={() => handleSort('risk_score')}>
                  <div className="flex items-center gap-1">Risk <SortIcon col="risk_score" /></div>
                </th>
                <th className="text-left px-4 py-3 text-label text-gray-500">Owner</th>
                <th className="text-left px-4 py-3 text-label text-gray-500">Sensitivity</th>
                <th className="text-left px-4 py-3 text-label text-gray-500 cursor-pointer" onClick={() => handleSort('last_seen')}>
                  <div className="flex items-center gap-1">Last Seen <SortIcon col="last_seen" /></div>
                </th>
                <th className="text-left px-4 py-3 text-label text-gray-500">Traffic (7d)</th>
                <th className="w-16 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">Loading inventory...</td>
                </tr>
              )}
              {!isLoading && (!data?.items || data.items.length === 0) && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">No APIs found matching your filters</td>
                </tr>
              )}
              {data?.items?.map((api: any, idx: number) => (
                <tr
                  key={api.id}
                  className={`border-b border-gray-100 dark:border-gray-700/50 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                    idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/30'
                  }`}
                  onClick={() => router.push(`/inventory/${api.id}`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(api.id)}
                      onChange={() => toggleSelect(api.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-xs font-mono font-medium rounded ${
                        api.http_method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                        api.http_method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                        api.http_method === 'PUT' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      }`}>
                        {api.http_method}
                      </span>
                      <span className="font-mono text-xs text-gray-900 dark:text-white truncate max-w-[200px]">
                        {api.endpoint_path}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                      {api.environment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={api.status} />
                  </td>
                  <td className="px-4 py-3">
                    <RiskGauge score={api.risk_score} size={36} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{api.owner_team || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      api.data_sensitivity === 'restricted' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                      api.data_sensitivity === 'confidential' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                      api.data_sensitivity === 'internal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {api.data_sensitivity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {timeAgo(api.last_seen)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatNumber(api.traffic_7d || 0)}
                  </td>
                   <td className="px-4 py-3 relative" onClick={(e) => e.stopPropagation()}>
                     <button
                       onClick={() => setMenuOpen(menuOpen === api.id ? null : api.id)}
                       className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                     >
                       <MoreHorizontal size={16} />
                     </button>
                     {menuOpen === api.id && (
                       <div className="absolute right-2 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
                         <button
                           onClick={() => { router.push(`/inventory/${api.id}`); setMenuOpen(null) }}
                           className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                         >
                           <Eye size={14} /> View Details
                         </button>
                         <button
                           onClick={() => { navigator.clipboard.writeText(api.endpoint_path); toast.success('Copied'); setMenuOpen(null) }}
                           className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                         >
                           <Copy size={14} /> Copy Endpoint
                         </button>
                         <hr className="border-gray-100 dark:border-gray-700" />
                         {api.status === 'zombie' && (
                           <button
                             onClick={() => { quarantineMutation.mutate(api.id); setMenuOpen(null) }}
                             className="flex items-center gap-2 w-full px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                           >
                             <Skull size={14} /> Quarantine
                           </button>
                         )}
                         {(api.status === 'zombie' || api.status === 'orphaned') && (
                           <button
                             onClick={() => { rescueMutation.mutate(api.id); setMenuOpen(null) }}
                             className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                           >
                             <Heart size={14} /> Rescue
                           </button>
                         )}
                         {api.status !== 'deprecated' && (
                           <button
                             onClick={() => { decommissionMutation.mutate(api.id); setMenuOpen(null) }}
                             className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                           >
                             <Trash2 size={14} /> Decommission
                           </button>
                         )}
                       </div>
                     )}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Page {data?.page || 1} of {data?.total_pages || 1}
            </span>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-500"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage(Math.min(data?.total_pages || 1, page + 1))}
              disabled={page >= (data?.total_pages || 1)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-500"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
