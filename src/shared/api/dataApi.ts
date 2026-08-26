import { apiClient } from './client'
import { DEFAULT_TENANT_CODE } from './collectionKeys'

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

export async function fetchAllCollections(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<Record<string, unknown>>('/data')
  return data
}

/** Bulk seed all collections for the demo tenant (development bootstrap). */
export async function seedBackendCollections(collections: Record<string, unknown>): Promise<void> {
  await apiClient.post('/data/seed', { collections }, { params: { tenant_code: DEFAULT_TENANT_CODE } })
}
