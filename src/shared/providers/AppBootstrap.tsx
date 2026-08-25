import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { fetchAllCollections } from '../api/dataApi'
import { hydrateCache } from '../storage/dataCache'
import { collectionQueryKey } from '../hooks/useApiCollection'

interface AppBootstrapProps {
  children: React.ReactNode
}

export function AppBootstrap({ children }: AppBootstrapProps) {
  const queryClient = useQueryClient()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const collections = await fetchAllCollections()
        if (cancelled) return
        hydrateCache(collections)
        for (const [key, data] of Object.entries(collections)) {
          queryClient.setQueryData(collectionQueryKey(key), data)
        }
        setReady(true)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load data from API', err)
        setError(err instanceof Error ? err.message : 'Failed to connect to backend')
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [queryClient])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-navy-950 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Backend unavailable</h1>
          <p className="text-sm text-white/70 mb-4">{error}</p>
          <p className="text-xs text-white/50">
            Start the API with <code className="text-lemon-400">uvicorn app.main:app --reload</code> in{' '}
            <code className="text-lemon-400">backend/</code>, then run{' '}
            <code className="text-lemon-400">npm run seed:backend</code>.
          </p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-white">
        <p className="text-sm text-white/70">Loading from server…</p>
      </div>
    )
  }

  return <>{children}</>
}
