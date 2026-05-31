'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { useUIStore } from '@/lib/store'

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setDarkMode } = useUIStore()

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(isDark)
  }, [setDarkMode])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            refetchInterval: 30000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
