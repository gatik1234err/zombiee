import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  darkMode: boolean
  toggleSidebar: () => void
  toggleDarkMode: () => void
  setDarkMode: (value: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  darkMode: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.darkMode
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', newMode)
      }
      return { darkMode: newMode }
    }),
  setDarkMode: (value: boolean) => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', value)
    }
    set({ darkMode: value })
  },
}))

interface AuthState {
  user: any | null
  isAuthenticated: boolean
  setUser: (user: any) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))

interface FilterState {
  filters: Record<string, string>
  searchQuery: string
  setFilter: (key: string, value: string) => void
  setSearchQuery: (q: string) => void
  clearFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: {},
  searchQuery: '',
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  setSearchQuery: (q) => set({ searchQuery: q }),
  clearFilters: () => set({ filters: {}, searchQuery: '' }),
}))
