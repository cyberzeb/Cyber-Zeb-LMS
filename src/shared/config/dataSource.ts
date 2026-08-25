/**
 * Frontend-only demo mode uses localStorage + in-memory cache (no API).
 * Set VITE_USE_BACKEND=true to load/persist via the FastAPI backend instead.
 */
export function isMockDataMode(): boolean {
  return import.meta.env.VITE_USE_BACKEND !== 'true'
}
