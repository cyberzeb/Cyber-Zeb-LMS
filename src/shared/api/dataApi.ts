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

export async function fetchAllCollections(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<Record<string, unknown>>('/data')
  return data
}
