/** Normalize a pasted meeting link (e.g. zoom.us/j/123) for safe opening. */
export function normalizeMeetingUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function isValidMeetingUrl(raw: string): boolean {
  return normalizeMeetingUrl(raw) !== null
}

/** Open meeting link in a new tab. Returns false when URL is missing or invalid. */
export function openMeetingUrl(raw: string | undefined): boolean {
  const url = raw ? normalizeMeetingUrl(raw) : null
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
