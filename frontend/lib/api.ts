const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export const api = {
  // Dashboard
  getDashboard: () => fetchAPI<any>('/api/v1/dashboard'),
  getScoreboard: () => fetchAPI<any>('/api/v1/scoreboard'),

  // Inventory
  getInventory: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchAPI<any>(`/api/v1/inventory${query}`)
  },
  getAPIDetail: (id: string) => fetchAPI<any>(`/api/v1/inventory/${id}`),
  getAPIRisk: (id: string) => fetchAPI<any>(`/api/v1/inventory/${id}/risk`),
  getAPISecurity: (id: string) => fetchAPI<any>(`/api/v1/inventory/${id}/security`),

  // Actions
  quarantineAPI: (id: string) =>
    fetchAPI<any>(`/api/v1/inventory/${id}/quarantine`, { method: 'POST' }),
  rescueAPI: (id: string) =>
    fetchAPI<any>(`/api/v1/inventory/${id}/rescue`, { method: 'POST' }),
  decommissionAPI: (id: string) =>
    fetchAPI<any>(`/api/v1/inventory/${id}/decommission`, { method: 'POST' }),

  // Zombies & Shadows
  getZombies: () => fetchAPI<any>('/api/v1/zombies'),
  getShadows: () => fetchAPI<any>('/api/v1/shadows'),

  // Reports
  exportReport: (id: string) =>
    fetchAPI<any>(`/api/v1/reports/${id}/export`, { method: 'POST' }),

  // Health
  health: () => fetchAPI<any>('/api/v1/health'),
}
