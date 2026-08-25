import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { fetchAllCollections } from '../api/dataApi'
import { isMockDataMode } from '../config/dataSource'
import { collectionQueryKey } from '../hooks/useApiCollection'
import { hydrateCache } from '../storage/dataCache'
import { bootstrapLocalMockData } from '../storage/localDataSource'

interface AppBootstrapProps {
  children: React.ReactNode
}

export function AppBootstrap({ children }: AppBootstrapProps) {
  const queryClient = useQueryClient()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        if (isMockDataMode()) {
          const collections = bootstrapLocalMockData()
          if (cancelled) return
          for (const [key, data] of Object.entries(collections)) {
            queryClient.setQueryData(collectionQueryKey(key), data)
          }
          setReady(true)
          return
        }

        const collections = await fetchAllCollections()
        if (cancelled) return
        hydrateCache(collections)
        for (const [key, data] of Object.entries(collections)) {
          queryClient.setQueryData(collectionQueryKey(key), data)
        }
        setReady(true)
      } catch (err) {
        if (cancelled) return
        console.warn('Bootstrap failed — using local mock data', err)
        try {
          const collections = bootstrapLocalMockData()
          for (const [key, data] of Object.entries(collections)) {
            queryClient.setQueryData(collectionQueryKey(key), data)
          }
        } catch (fallbackErr) {
          console.error('Local mock bootstrap failed', fallbackErr)
        }
        setReady(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [queryClient])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-white">
        <p className="text-sm text-white/70">Loading…</p>
      </div>
    )
  }

  return <>{children}</>
}
