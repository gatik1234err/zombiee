'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState, useRef } from 'react'
import { formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  FileText, Download, Calendar, BarChart3, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Skull, Heart, ArrowRight,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function ReportsPage() {
  const { data: scoreboard } = useQuery({
    queryKey: ['scoreboard'],
    queryFn: () => api.getScoreboard(),
  })

  const [dateRange, setDateRange] = useState('last-month')
  const reportRef = useRef<HTMLDivElement>(null)

  const handleExportPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      if (!reportRef.current) return

      toast.loading('Generating PDF...')
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('zaddp-monthly-scoreboard.pdf')
      toast.dismiss()
      toast.success('PDF exported successfully')
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to export PDF')
    }
  }

  const sb = scoreboard
  const riskTrend = sb?.risk_trend || []
  const securityTrend = sb?.security_score_trend || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monthly Zombie Scoreboard and compliance reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="last-month">Last Month</option>
            <option value="quarter">Quarter to Date</option>
            <option value="year">Year to Date</option>
          </select>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6">
        {/* Executive Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-section-title text-gray-900 dark:text-white">
                Monthly Zombie Scoreboard
              </h2>
              <p className="text-sm text-gray-500">{sb?.month} {sb?.year} &middot; Executive Summary</p>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Skull className="w-6 h-6 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sb?.zombies_found || 0}</p>
              <p className="text-xs text-gray-500">Zombies Found</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sb?.zombies_decommissioned || 0}</p>
              <p className="text-xs text-gray-500">Decommissioned</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Heart className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sb?.zombies_rescued || 0}</p>
              <p className="text-xs text-gray-500">Rescued</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${formatNumber(sb?.cost_savings_estimate || 0)}</p>
              <p className="text-xs text-gray-500">Cost Savings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Risk Score Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={riskTrend}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#DC2626" fill="url(#riskGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Security Score Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={securityTrend}>
                  <defs>
                    <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#16A34A" fill="url(#secGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* API Census */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h2 className="text-section-title text-gray-900 dark:text-white mb-4">API Census</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Total APIs', value: 75, color: 'text-blue-500' },
              { label: 'Active', value: 45, color: 'text-green-500' },
              { label: 'Deprecated', value: 12, color: 'text-yellow-500' },
              { label: 'Orphaned', value: 8, color: 'text-purple-500' },
              { label: 'Shadow', value: 5, color: 'text-red-500' },
              { label: 'Zombie', value: 5, color: 'text-orange-500' },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Business Units */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
          <h2 className="text-section-title text-gray-900 dark:text-white mb-4">Top Business Units by Zombie Count</h2>
          <div className="space-y-3">
            {sb?.top_business_units?.map((unit: any, idx: number) => (
              <div key={unit.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-400">{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{unit.name}</span>
                </div>
                <span className="text-sm font-bold text-red-500">{unit.zombie_count} zombies</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regulatory Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
        <h2 className="text-section-title text-gray-900 dark:text-white mb-4">Regulatory Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'PCI-DSS Report', standard: 'PCI Data Security Standard', findings: 12, status: 'partial' },
            { name: 'GDPR Compliance', standard: 'General Data Protection Regulation', findings: 8, status: 'compliant' },
            { name: 'Internal Audit', standard: 'SOX Compliance', findings: 15, status: 'partial' },
          ].map((template) => (
            <div key={template.name} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-colors">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{template.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{template.standard}</p>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  template.status === 'compliant' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                }`}>
                  {template.status}
                </span>
                <span className="text-xs text-gray-400">{template.findings} findings</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
