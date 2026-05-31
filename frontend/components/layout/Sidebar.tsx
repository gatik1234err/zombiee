'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/lib/store'
import {
  LayoutDashboard,
  Database,
  Skull,
  Shield,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { href: '/inventory', label: 'API Inventory', icon: Database },
  { href: '/zombie-graveyard', label: 'Zombie Graveyard', icon: Skull },
  { href: '/security-center', label: 'Security Center', icon: Shield },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span className="font-bold text-gray-900 dark:text-white">ZADDP</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {sidebarOpen && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              SC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Dr. Sarah Chen</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Admin</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
