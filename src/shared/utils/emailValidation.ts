/** Normalize email for storage and comparison. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Validates common work emails including short TLDs like .et, .uk, .io.
 * Always pass through normalizeEmail first.
 */
export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email)
  if (!normalized) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)
}

export function assertValidEmail(email: string, message = 'Invalid email address.'): string {
  const normalized = normalizeEmail(email)
  if (!isValidEmail(normalized)) {
    throw new Error(message)
  }
  return normalized
}
