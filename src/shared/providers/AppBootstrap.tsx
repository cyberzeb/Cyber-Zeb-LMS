import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { fetchAllCollections } from '../api/dataApi'
import {
  canRenewSession,
  endPortalSession,
  getAccessToken,
  hasExpiredAccessToken,
} from '../api/client'
import { hydrateCache } from '../storage/dataCache'
import { saveCollectionChange } from '../storage/collectionSync'
import { readPortalSession } from '../storage/session'
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

/**
 * True when the failure means "you are not signed in" rather than "the API is
 * down". Only a real connection or server fault should reach the error screen.
 */
function isUnauthenticated(err: unknown): boolean {
  const status = (err as { response?: { status?: number }; status?: number })?.response?.status
  if (status === 401 || status === 403) return true
  // The interceptor clears the tokens before re-throwing when a refresh fails,
  // so an absent token after a failed load means the session was rejected.
  if (!getAccessToken()) return true
  return /\b40[13]\b/.test((err as { message?: string })?.message ?? '')
}


function BackendErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 text-white px-6">
      <div className="max-w-md text-center flex flex-col gap-4">
        <h1 className="text-lg font-extrabold text-white">Backend unavailable</h1>
        <p className="text-sm text-white/70 leading-relaxed">{message}</p>
        <p className="text-xs text-white/50 leading-relaxed">
          Locally open <code className="text-white/70">http://127.0.0.1:5173</code> with the API on
          port 8001. If this is a deployed server, check{' '}
          <code className="text-white/70">docker compose logs api</code>.
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
    // Public pages (landing, sign-in) need no tenant data. Portal data is only
    // loaded for a signed-in user; the API rejects anonymous requests.
    if (!getAccessToken()) {
      setError(null)
      setReady(true)
      return
    }

    // The access token has run out. If the refresh token is also gone the session
    // cannot be renewed, so send the user to sign in rather than spend a request
    // proving it. With a live refresh token the API client renews on the first 401.
    if (hasExpiredAccessToken() && !canRenewSession()) {
      endPortalSession('expired')
      setError(null)
      setReady(true)
      return
    }

    let collections: Record<string, unknown>
    try {
      collections = await fetchAllCollections()
    } catch (err) {
      // The API client already tried a token refresh and cleared the session;
      // show the (public) page instead of the "backend unavailable" screen.
      // A rejected token is not an outage, so check every way a 401 can reach
      // us: the axios error, an error the interceptor re-threw without its
      // response, and the session the interceptor just cleared.
      if (isUnauthenticated(err)) {
        // Someone who was signed in gets told why they are back at sign-in.
        // A visitor who never had a session just sees the public page.
        if (readPortalSession()) endPortalSession('expired')
        setError(null)
        setReady(true)
        return
      }
      throw err
    }

    const patched = hydrateFromRecord(collections, queryClient)
    if (readPortalSession()?.role === 'Admin' && academicCalendarWasPatched(collections, patched)) {
      saveCollectionChange('academic-years', collections['academic-years'], patched['academic-years'])
      saveCollectionChange('academic-terms', collections['academic-terms'], patched['academic-terms'])
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
