import { useQuery } from '@tanstack/react-query'
import { getPublicBranding } from '../api/leadApi'
import type { PublicBranding } from '../types'

const DEFAULTS: Omit<PublicBranding, 'id' | 'updated_at'> = {
  logo_url: null,
  favicon_url: null,
  footer_text: `© ${new Date().getFullYear()} Cyber-Zeb Consulting. All rights reserved.`,
  footer_links: null,
  support_email: 'hello@cyberzebconsulting.com',
  support_phone: '+251 9xx xxx xxx',
}

/**
 * Fetches public branding from GET /api/v1/branding (no auth required).
 * Falls back to sensible defaults while loading or if the row doesn't exist yet.
 * Stale time is 5 minutes so multiple components on the same page share one fetch.
 */
export function useBranding() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-branding'],
    queryFn: getPublicBranding,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  return {
    isLoading,
    logo_url: data?.logo_url ?? DEFAULTS.logo_url,
    favicon_url: data?.favicon_url ?? DEFAULTS.favicon_url,
    footer_text: data?.footer_text || DEFAULTS.footer_text,
    footer_links: data?.footer_links?.length ? data.footer_links : DEFAULTS.footer_links,
    support_email: data?.support_email || DEFAULTS.support_email,
    support_phone: data?.support_phone || DEFAULTS.support_phone,
  }
}
