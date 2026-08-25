const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

interface CookieOptions {
  maxAgeSeconds?: number
  path?: string
  sameSite?: 'Lax' | 'Strict' | 'None'
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const prefix = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split('; ')
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length))
    }
  }
  return null
}

export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  if (typeof document === 'undefined') return
  const maxAge = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS
  const path = options.path ?? '/'
  const sameSite = options.sameSite ?? 'Lax'
  const secure = import.meta.env.PROD ? '; Secure' : ''
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
    secure,
  ]
    .filter(Boolean)
    .join('; ')
}

export function removeCookie(name: string, path = '/') {
  if (typeof document === 'undefined') return
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=${path}; SameSite=Lax`
}
