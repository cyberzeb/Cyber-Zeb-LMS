/**
 * Saves collection changes to the backend as record-level patches.
 *
 * Callers still update whole collections locally; here we diff the previous and
 * next value and send only what changed, so two people editing different records
 * no longer overwrite each other. If a save fails, the local copy is reloaded from
 * the server and a `berana:persist-error` event is raised for the toast layer.
 */
import { fetchCollection, patchCollection, putCollection, type CollectionPatch } from '../api/dataApi'
import { queryClient } from '../../lib/queryClient'
import { setCachedCollection } from './dataCache'

export const PERSIST_ERROR_EVENT = 'berana:persist-error'

/** Object collections whose top-level keys are person ids (mirrors the backend policy). */
const KEYED_COLLECTIONS = new Set([
  'lesson-progress',
  'lesson-responses',
  'forum-read-state',
  'student-settings',
  'instructor-settings',
  'staff-settings',
  'guardian-settings',
  'help-desk-settings',
])

type IdRecord = { id: string } & Record<string, unknown>

function isRecordList(value: unknown): value is IdRecord[] {
  return (
    Array.isArray(value) &&
    value.every((item) => item !== null && typeof item === 'object' && typeof item.id === 'string')
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Returns the patch to send, 'replace' for a whole-collection write, or null if nothing changed. */
export function diffCollection(apiKey: string, prev: unknown, next: unknown): CollectionPatch | 'replace' | null {
  if (isRecordList(next) && (prev === undefined || prev === null || isRecordList(prev))) {
    const before = new Map((prev ?? []).map((record) => [record.id, JSON.stringify(record)]))
    const nextIds = new Set(next.map((record) => record.id))
    const upserts = next.flatMap((record, index) =>
      before.get(record.id) === JSON.stringify(record)
        ? []
        : [{ record, after: index === 0 ? null : next[index - 1].id }],
    )
    const deletes = [...before.keys()].filter((id) => !nextIds.has(id))
    return upserts.length || deletes.length ? { upserts, deletes } : null
  }

  if (KEYED_COLLECTIONS.has(apiKey) && isPlainObject(next)) {
    const before = isPlainObject(prev) ? prev : {}
    const set: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(next)) {
      if (JSON.stringify(before[key]) !== JSON.stringify(value)) set[key] = value
    }
    const unset = Object.keys(before).filter((key) => !(key in next))
    return Object.keys(set).length || unset.length ? { set, unset } : null
  }

  return JSON.stringify(prev) === JSON.stringify(next) ? null : 'replace'
}

function errorMessage(err: unknown): string {
  const response = (err as { response?: { status?: number; data?: { error?: { message?: unknown } } } })
    ?.response
  if (response?.status === 403) return 'You do not have permission to make this change.'
  const message = response?.data?.error?.message
  if (typeof message === 'string' && message) return message
  return 'Your change could not be saved. Please check your connection and try again.'
}

async function rollback(apiKey: string) {
  try {
    const serverData = await fetchCollection<unknown>(apiKey)
    setCachedCollection(apiKey, serverData)
    queryClient.setQueryData(['collection', apiKey], serverData)
  } catch {
    // Keep the local copy; the next page load resynchronizes from the server.
  }
}

/** Persist a change from `prev` to `next` (fire-and-forget; failures roll back and notify). */
const inFlight = new Map<string, Promise<unknown>>()

/** Resolves once every save started so far for this collection has settled. */
export function whenSaved(apiKey: string): Promise<void> {
  return (inFlight.get(apiKey) ?? Promise.resolve()).then(
    () => undefined,
    () => undefined,
  )
}

export function saveCollectionChange(apiKey: string, prev: unknown, next: unknown): void {
  const change = diffCollection(apiKey, prev, next)
  if (change === null) return
  const request = change === 'replace' ? putCollection(apiKey, next) : patchCollection(apiKey, change)
  const previous = inFlight.get(apiKey) ?? Promise.resolve()
  const tracked = Promise.allSettled([previous, request])
  inFlight.set(apiKey, tracked)
  void tracked.then(() => {
    if (inFlight.get(apiKey) === tracked) inFlight.delete(apiKey)
  })
  void request.catch((err) => {
    console.error(`Failed to save "${apiKey}"`, err)
    window.dispatchEvent(new CustomEvent(PERSIST_ERROR_EVENT, { detail: { message: errorMessage(err) } }))
    void rollback(apiKey)
  })
}
