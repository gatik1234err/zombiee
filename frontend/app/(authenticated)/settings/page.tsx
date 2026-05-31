'use client'

import { useState } from 'react'
import {
  Settings, Bell, Shield, Users, Database, GitBranch,
  Sliders, FileText, Eye, Activity, Globe, Mail, MessageSquare,
  AlertTriangle, CheckCircle, XCircle, ExternalLink, Plus, Trash2,
  RefreshCw,
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
      case 'discovery':
        return <DiscoverySettings />
      case 'risk-scoring':
        return <RiskScoringSettings />
      case 'users':
        return <UserManagement />
      case 'classification':
        return <ClassificationSettings />
      case 'notifications':
        return <NotificationSettings />
      case 'integrations':
        return <IntegrationSettings />
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

function DiscoverySettings() {
  const [enabled, setEnabled] = useState(true)
  const [interval, setInterval] = useState('24h')
  const [sources, setSources] = useState({
    gatewayScan: true,
    sensorDiscovery: true,
    manualRegistration: true,
    dnsProbe: false,
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-section-title text-gray-900 dark:text-white">API Discovery Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">Configure how ZADDP discovers new APIs in your environment</p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Automatic Discovery</p>
          <p className="text-xs text-gray-500 mt-0.5">Scan the network for undocumented and shadow APIs</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scan Frequency</p>
        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="1h">Every Hour</option>
          <option value="6h">Every 6 Hours</option>
          <option value="12h">Every 12 Hours</option>
          <option value="24h">Every 24 Hours</option>
          <option value="7d">Every 7 Days</option>
        </select>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Discovery Sources</p>
        <div className="space-y-3">
          {[
            { key: 'gatewayScan', label: 'API Gateway Scan', desc: 'Import APIs from gateway configuration and logs' },
            { key: 'sensorDiscovery', label: 'Sensor Network Probe', desc: 'Active probe for unregistered endpoints in the network' },
            { key: 'manualRegistration', label: 'Manual Registration', desc: 'Allow teams to manually register APIs' },
            { key: 'dnsProbe', label: 'DNS Subdomain Probe', desc: 'Discover subdomains and DNS records pointing to API servers' },
          ].map((source) => (
            <label key={source.key} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-pointer">
              <input
                type="checkbox"
                checked={sources[source.key as keyof typeof sources]}
                onChange={() => setSources((prev) => ({ ...prev, [source.key]: !prev[source.key as keyof typeof sources] }))}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{source.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{source.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Last Scan</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Completed 2 hours ago &middot; 3 new APIs discovered</p>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Scan Now
          </button>
        </div>
      </div>

      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
        Save Discovery Settings
      </button>
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

function ClassificationSettings() {
  const [levels, setLevels] = useState([
    { id: 'public', label: 'Public', color: 'green', desc: 'Non-sensitive, publicly accessible data', default: false },
    { id: 'internal', label: 'Internal', color: 'blue', desc: 'Internal business data, not publicly exposed', default: true },
    { id: 'confidential', label: 'Confidential', color: 'orange', desc: 'Sensitive business data with restricted access', default: false },
    { id: 'restricted', label: 'Restricted', color: 'red', desc: 'Highly sensitive data requiring strict controls', default: false },
  ])
  const [autoRules, setAutoRules] = useState({
    pathPatterns: true,
    piiDetection: true,
    dataSensitivity: true,
    queryAnalysis: false,
    responseInspection: false,
  })
  const [defaultSensitivity, setDefaultSensitivity] = useState('internal')
  const [defaultTags, setDefaultTags] = useState('api, managed')

  const LEVEL_COLORS: Record<string, string> = {
    green: 'border-green-400 bg-green-50 dark:bg-green-950/20',
    blue: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20',
    orange: 'border-orange-400 bg-orange-50 dark:bg-orange-950/20',
    red: 'border-red-400 bg-red-50 dark:bg-red-950/20',
  }

  const LEVEL_DOT_COLORS: Record<string, string> = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-section-title text-gray-900 dark:text-white">Classification Settings</h3>
        <p className="text-sm text-gray-500 mt-1">Configure data sensitivity levels and auto-classification rules</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Data Sensitivity Levels</p>
        <div className="space-y-2">
          {levels.map((level) => (
            <div
              key={level.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${LEVEL_COLORS[level.color]}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${LEVEL_DOT_COLORS[level.color]}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{level.label}</p>
                  <p className="text-xs text-gray-500">{level.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {level.default && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Default</span>
                )}
                <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">Edit</button>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
          <Plus size={14} /> Add Level
        </button>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Auto-Classification Rules</p>
        <div className="space-y-3">
          {[
            { key: 'pathPatterns', label: 'Endpoint Path Patterns', desc: 'Classify based on URL path prefixes and patterns' },
            { key: 'piiDetection', label: 'PII Parameter Detection', desc: 'Detect personally identifiable information in request/response parameters' },
            { key: 'dataSensitivity', label: 'Data Sensitivity Heuristics', desc: 'Apply ML heuristics to estimate data sensitivity based on endpoint behavior' },
            { key: 'queryAnalysis', label: 'Query Parameter Analysis', desc: 'Analyze query parameter names and structures for classification hints' },
            { key: 'responseInspection', label: 'Response Body Inspection', desc: 'Sample response bodies to detect classified data patterns' },
          ].map((rule) => (
            <label key={rule.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{rule.label}</p>
                <p className="text-xs text-gray-500">{rule.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={autoRules[rule.key as keyof typeof autoRules]}
                onChange={() => setAutoRules((prev) => ({ ...prev, [rule.key]: !prev[rule.key as keyof typeof autoRules] }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Default Classification</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Default Sensitivity</label>
            <select
              value={defaultSensitivity}
              onChange={(e) => setDefaultSensitivity(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {levels.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Default Tags</label>
            <input
              type="text"
              value={defaultTags}
              onChange={(e) => setDefaultTags(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
        Save Classification Settings
      </button>
    </div>
  )
}

function NotificationSettings() {
  const [channels, setChannels] = useState([
    { id: 'email', label: 'Email', icon: Mail, enabled: true, config: { address: 'admin@zaddp.io' }, connected: true },
    { id: 'slack', label: 'Slack', icon: MessageSquare, enabled: false, config: { webhook: '', channel: '#zaddp-alerts' }, connected: false },
    { id: 'pagerduty', label: 'PagerDuty', icon: AlertTriangle, enabled: false, config: { serviceKey: '', severity: 'critical' }, connected: false },
    { id: 'webhook', label: 'Custom Webhook', icon: Globe, enabled: false, config: { url: '' }, connected: false },
  ])

  const [events, setEvents] = useState({
    apiDiscovered: true,
    apiQuarantined: true,
    apiRescued: true,
    apiDecommissioned: true,
    securityFinding: true,
    riskChange: false,
    dailyDigest: false,
    weeklyReport: true,
  })

  const toggleChannel = (id: string) => {
    setChannels((prev) => prev.map((ch) => ch.id === id ? { ...ch, enabled: !ch.enabled } : ch))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-section-title text-gray-900 dark:text-white">Notification Settings</h3>
        <p className="text-sm text-gray-500 mt-1">Configure notification channels and event subscriptions</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Notification Channels</p>
        <div className="space-y-2">
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${ch.enabled ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'bg-gray-200 dark:bg-gray-600 text-gray-400'}`}>
                  <ch.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ch.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`flex items-center gap-1 text-xs ${ch.connected ? 'text-green-500' : 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ch.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {ch.connected ? 'Connected' : 'Not connected'}
                    </span>
                    {ch.enabled && ch.connected && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">Configure</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ch.enabled}
                  onChange={() => toggleChannel(ch.id)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Events</p>
        <div className="space-y-2">
          {[
            { key: 'apiDiscovered', label: 'API Discovered', desc: 'When a new API endpoint is detected' },
            { key: 'apiQuarantined', label: 'API Quarantined', desc: 'When an API is moved to quarantine (zombie status)' },
            { key: 'apiRescued', label: 'API Rescued', desc: 'When a quarantined API is rescued and restored' },
            { key: 'apiDecommissioned', label: 'API Decommissioned', desc: 'When an API is permanently decommissioned' },
            { key: 'securityFinding', label: 'Security Finding', desc: 'When a new security vulnerability is identified' },
            { key: 'riskChange', label: 'Risk Score Change', desc: 'When an API risk score changes significantly' },
            { key: 'dailyDigest', label: 'Daily Digest', desc: 'Daily summary of all platform activity' },
            { key: 'weeklyReport', label: 'Weekly Report', desc: 'Weekly comprehensive report with trends and insights' },
          ].map((evt) => (
            <label key={evt.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{evt.label}</p>
                <p className="text-xs text-gray-500">{evt.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={events[evt.key as keyof typeof events]}
                onChange={() => setEvents((prev) => ({ ...prev, [evt.key]: !prev[evt.key as keyof typeof events] }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Email Settings</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notification Email</label>
            <input
              type="email"
              defaultValue="admin@zaddp.io"
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Digest Time</label>
            <select
              defaultValue="09:00"
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="00:00">Midnight</option>
              <option value="06:00">6:00 AM</option>
              <option value="09:00">9:00 AM</option>
              <option value="12:00">Noon</option>
              <option value="18:00">6:00 PM</option>
            </select>
          </div>
        </div>
      </div>

      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
        Save Notification Settings
      </button>
    </div>
  )
}

function IntegrationSettings() {
  const [integrations, setIntegrations] = useState([
    {
      id: 'slack',
      name: 'Slack',
      icon: MessageSquare,
      desc: 'Receive alerts and notifications in your Slack workspace',
      connected: false,
      config: { webhookUrl: '', channel: '#zaddp-alerts' },
    },
    {
      id: 'jira',
      name: 'Jira',
      icon: ExternalLink,
      desc: 'Create Jira tickets automatically for security findings',
      connected: false,
      config: { url: '', project: 'ZADDP', apiToken: '' },
    },
    {
      id: 'pagerduty',
      name: 'PagerDuty',
      icon: AlertTriangle,
      desc: 'Trigger PagerDuty incidents for critical security alerts',
      connected: true,
      config: { serviceKey: 'pd_key_****', severityMapping: 'critical' },
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: GitBranch,
      desc: 'Create GitHub issues for decommission tracking and audit trail',
      connected: false,
      config: { repo: 'org/zaddp-audit', token: '' },
    },
  ])

  const [webhooks, setWebhooks] = useState([
    { id: '1', name: 'Splunk SIEM', url: 'https://splunk.internal:8088/services/collector', events: ['security_finding', 'quarantine'], active: true },
    { id: '2', name: 'ServiceNow', url: 'https://servicenow.company.com/api/x_zaddp/v1/event', events: ['decommission'], active: false },
  ])

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) => prev.map((int) => int.id === id ? { ...int, connected: !int.connected } : int))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-section-title text-gray-900 dark:text-white">Integrations</h3>
        <p className="text-sm text-gray-500 mt-1">Connect ZADDP with your existing toolchain</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {integrations.map((int) => (
          <div key={int.id} className={`p-4 rounded-lg border ${
            int.connected
              ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                int.connected ? 'bg-green-100 dark:bg-green-900/50 text-green-600' : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
              }`}>
                <int.icon size={20} />
              </div>
              <span className={`flex items-center gap-1 text-xs ${
                int.connected ? 'text-green-500' : 'text-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${int.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                {int.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{int.name}</p>
            <p className="text-xs text-gray-500 mb-3">{int.desc}</p>
            <button
              onClick={() => toggleIntegration(int.id)}
              className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                int.connected
                  ? 'bg-red-50 text-red-600 border border-red-200 dark:border-red-900 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {int.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Custom Webhooks</p>
        <div className="space-y-2 mb-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{wh.name}</p>
                  <span className={`w-1.5 h-1.5 rounded-full ${wh.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5 font-mono">{wh.url}</p>
                <div className="flex gap-1 mt-1">
                  {wh.events.map((evt) => (
                    <span key={evt} className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                      {evt}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">Edit</button>
                <button className="text-xs text-red-500 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
          <Plus size={14} /> Add Webhook
        </button>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Connection Status</p>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            All services operational. <span className="text-green-600 dark:text-green-400">PagerDuty connected &middot; 0 recent failures</span>
          </p>
        </div>
      </div>

      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
        Save Integration Settings
      </button>
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
