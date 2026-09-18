import { apiClient } from './client'

export async function fetchCollection<T>(apiKey: string): Promise<T> {
  const { data } = await apiClient.get<{ key: string; data: T }>(`/data/${encodeURIComponent(apiKey)}`)
  return data.data
}

export async function putCollection<T>(apiKey: string, value: T): Promise<T> {
  const { data } = await apiClient.put<{ key: string; data: T }>(`/data/${encodeURIComponent(apiKey)}`, {
    data: value,
  })
  return data.data
}

/** Record-level changes; see backend `CollectionPatch`. */
export interface CollectionPatch {
  upserts?: { record: Record<string, unknown>; after: string | null }[]
  deletes?: string[]
  set?: Record<string, unknown>
  unset?: string[]
}

export async function patchCollection<T>(apiKey: string, patch: CollectionPatch): Promise<T> {
  const { data } = await apiClient.patch<{ key: string; data: T }>(
    `/data/${encodeURIComponent(apiKey)}`,
    patch,
  )
  return data.data
}

export async function fetchAllCollections(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<Record<string, unknown>>('/data')
  return data
}
