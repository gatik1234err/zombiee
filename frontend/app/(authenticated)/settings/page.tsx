'use client'

import { useState } from 'react'
import {
  Settings, Bell, Shield, Users, Database, GitBranch,
  Sliders, FileText, Eye, Activity,
} from 'lucide-react'

const SETTINGS_TABS = [
  { id: 'discovery', label: 'Discovery', icon: Activity },
  { id: 'classification', label: 'Classification', icon: Sliders },
  { id: 'risk-scoring', label: 'Risk Scoring', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: GitBranch },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'audit-log', label: 'Audit Log', icon: FileText },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('discovery')

  const TabContent = ({ id }: { id: string }) => {
    switch (id) {
      case 'risk-scoring':
        return <RiskScoringSettings />
      case 'users':
        return <UserManagement />
      case 'audit-log':
        return <AuditLogViewer />
      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <p>{id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} settings coming soon</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure platform settings and preferences
        </p>
      </div>

      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-card shadow-card p-1 overflow-x-auto">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-card shadow-card p-5">
        <TabContent id={activeTab} />
      </div>
    </div>
  )
}

function RiskScoringSettings() {
  const [weights, setWeights] = useState({
    dataSensitivity: 25,
    authWeakness: 20,
    encryption: 15,
    exposure: 20,
    age: 10,
    traffic: 10,
  })

  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  const categories = [
    { key: 'dataSensitivity', label: 'Data Sensitivity' },
    { key: 'authWeakness', label: 'Auth Weakness' },
    { key: 'encryption', label: 'Encryption' },
    { key: 'exposure', label: 'Exposure' },
    { key: 'age', label: 'API Age' },
    { key: 'traffic', label: 'Traffic Pattern' },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-section-title text-gray-900 dark:text-white">Risk Scoring Weights</h3>
        <p className="text-sm text-gray-500 mt-1">Adjust the weight of each factor in the risk score calculation</p>
        {total !== 100 && (
          <div className="mt-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
            Weights must total 100% (currently {total}%)
          </div>
        )}
      </div>

      <div className="space-y-4">
        {categories.map(({ key, label }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
              <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">{weights[key]}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights[key]}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setWeights((prev) => ({ ...prev, [key]: val }))
              }}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        ))}
      </div>

      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
        Save Weights
      </button>
    </div>
  )
}

function UserManagement() {
  const users = [
    { name: 'Dr. Sarah Chen', email: 'admin@zaddp.io', role: 'Admin', team: 'Platform Security', mfa: true, active: true },
    { name: 'Mike Johnson', email: 'mike@bank.com', role: 'Engineer', team: 'Payments', mfa: true, active: true },
    { name: 'Emily Rodriguez', email: 'emily@bank.com', role: 'Analyst', team: 'Risk & Compliance', mfa: false, active: true },
    { name: 'Alex Kim', email: 'alex@bank.com', role: 'Viewer', team: 'Digital Channels', mfa: false, active: true },
    { name: 'Lisa Wang', email: 'lisa@bank.com', role: 'Auditor', team: 'Internal Audit', mfa: true, active: true },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-section-title text-gray-900 dark:text-white">User Management</h3>
        <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Invite User
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              <th className="pb-3 text-label text-gray-500">Name</th>
              <th className="pb-3 text-label text-gray-500">Email</th>
              <th className="pb-3 text-label text-gray-500">Role</th>
              <th className="pb-3 text-label text-gray-500">Team</th>
              <th className="pb-3 text-label text-gray-500">MFA</th>
              <th className="pb-3 text-label text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.email} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-3 text-gray-900 dark:text-white font-medium">{user.name}</td>
                <td className="py-3 text-gray-500">{user.email}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                    user.role === 'Engineer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                    user.role === 'Auditor' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>{user.role}</span>
                </td>
                <td className="py-3 text-gray-500">{user.team}</td>
                <td className="py-3">
                  <span className={`text-xs ${user.mfa ? 'text-green-500' : 'text-gray-400'}`}>
                    {user.mfa ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`flex items-center gap-1 text-xs ${user.active ? 'text-green-500' : 'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AuditLogViewer() {
  const logs = [
    { time: '2 min ago', actor: 'Dr. Sarah Chen', action: 'Quarantine', target: 'GET /legacy/accounts/{id}', ip: '10.0.1.45' },
    { time: '15 min ago', actor: 'Mike Johnson', action: 'Rescue', target: 'POST /legacy/transactions/{id}', ip: '10.0.2.12' },
    { time: '1 hour ago', actor: 'Emily Rodriguez', action: 'View', target: 'GET /api/v1/accounts/{id}/balance', ip: '10.0.3.78' },
    { time: '3 hours ago', actor: 'Dr. Sarah Chen', action: 'Decommission', target: 'GET /legacy/users/{id}', ip: '10.0.1.45' },
    { time: '6 hours ago', actor: 'Alex Kim', action: 'Edit', target: 'PUT /api/v1/users/{id}/preferences', ip: '10.0.4.23' },
  ]

  return (
    <div>
      <h3 className="text-section-title text-gray-900 dark:text-white mb-4">Audit Log</h3>
      <div className="space-y-2">
        {logs.map((log, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                log.action === 'Quarantine' ? 'bg-orange-500' :
                log.action === 'Decommission' ? 'bg-red-500' :
                log.action === 'Rescue' ? 'bg-green-500' :
                log.action === 'Edit' ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
              <div className="min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate">
                  <span className="font-medium">{log.actor}</span> {log.action.toLowerCase()}d{' '}
                  <span className="font-mono">{log.target}</span>
                </p>
                <p className="text-xs text-gray-500">{log.time} &middot; {log.ip}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              log.action === 'Quarantine' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50' :
              log.action === 'Decommission' ? 'bg-red-100 text-red-700 dark:bg-red-900/50' :
              log.action === 'Rescue' ? 'bg-green-100 text-green-700 dark:bg-green-900/50' :
              log.action === 'Edit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50' :
              'bg-gray-100 text-gray-700 dark:bg-gray-700'
            }`}>
              {log.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
