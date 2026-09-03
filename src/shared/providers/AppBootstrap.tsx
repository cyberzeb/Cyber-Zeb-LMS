import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { fetchAllCollections, putCollection, seedBackendCollections } from '../api/dataApi'
import { activeTenantCode } from '../api/client'
import { DEFAULT_TENANT_CODE } from '../api/collectionKeys'
import { buildSeedPayload } from '../storage/buildSeedPayload'
import { hydrateCache } from '../storage/dataCache'
import { collectionQueryKey } from '../hooks/useApiCollection'
import {
  academicCalendarWasPatched,
  ensureAcademicCalendarCollections,
} from '../storage/ensureAcademicCalendar'

interface AppBootstrapProps {
  children: React.ReactNode
}

function hydrateFromRecord(collections: Record<string, unknown>, queryClient: ReturnType<typeof useQueryClient>) {
  const patched = ensureAcademicCalendarCollections(collections)
  hydrateCache(patched)
  for (const [key, data] of Object.entries(patched)) {
    queryClient.setQueryData(collectionQueryKey(key), data)
  }
  return patched
}

function BackendErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 text-white px-6">
      <div className="max-w-md text-center flex flex-col gap-4">
        <h1 className="text-lg font-extrabold text-white">Backend unavailable</h1>
        <p className="text-sm text-white/70 leading-relaxed">{message}</p>
        <p className="text-xs text-white/50 leading-relaxed">
          Start the API server on port 8001, then run{' '}
          <code className="text-white/70">python scripts/seed_db.py</code> from the backend folder if
          the database is empty.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mx-auto mt-2 rounded-lg bg-lemon-500 px-5 py-2.5 text-sm font-bold text-navy-900 hover:bg-lemon-400 transition-colors cursor-pointer"
        >
          Retry connection
        </button>
      </div>
    </div>
  )
}

export function AppBootstrap({ children }: AppBootstrapProps) {
  const queryClient = useQueryClient()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const load = useCallback(async () => {
    let collections = await fetchAllCollections()

    // Only the demo tenant is auto-seeded with the full sample dataset. A real
    // institution created via onboarding starts from its own minimal seed and
    // is populated by the admin, so we never overwrite it here.
    if (Object.keys(collections).length === 0 && activeTenantCode() === DEFAULT_TENANT_CODE) {
      await seedBackendCollections(buildSeedPayload())
      collections = await fetchAllCollections()
    }

    const before = collections
    const patched = hydrateFromRecord(collections, queryClient)
    if (academicCalendarWasPatched(before, patched)) {
      await putCollection('academic-years', patched['academic-years'])
      await putCollection('academic-terms', patched['academic-terms'])
    }

    setError(null)
    setReady(true)
  }, [queryClient])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setReady(false)
      try {
        await load()
        if (cancelled) return
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load data from backend', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Could not connect to the API. All data is stored on the server — local demo mode is disabled.',
        )
        setReady(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [load, retryCount])

  if (error) {
    return <BackendErrorScreen message={error} onRetry={() => setRetryCount((n) => n + 1)} />
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-white">
        <p className="text-sm text-white/70">Loading…</p>
      </div>
    )
  }

  return <>{children}</>
}
