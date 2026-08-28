import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { resolveTenantBySubdomain } from '../api/leadApi'

/**
 * Production resolves tenants from subdomain hosts. DNS/SSL/reverse-proxy
 * wildcard setup must route *.berana-lms.com to this same frontend.
 * The /institution/:slug path remains a local development fallback.
 */
export function InstitutionLandingPage() {
  const { slug: routeSlug = '' } = useParams()
  const hostPrefix = window.location.hostname.split('.')[0]
  const baseDomain = import.meta.env.VITE_PUBLIC_BASE_DOMAIN ?? 'berana-lms.com'
  const routeIsFallback = window.location.hostname === 'localhost' || !window.location.hostname.endsWith(baseDomain)
  const slug = routeIsFallback ? routeSlug : hostPrefix
  const { data, isLoading, error } = useQuery({
    queryKey: ['tenant-subdomain', slug],
    queryFn: () => resolveTenantBySubdomain(slug),
    enabled: Boolean(slug),
    retry: false,
  })

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_#F4F7EE_0%,_#F7F8FC_55%,_#E8ECF4_100%)]">
      <GlassCard className="max-w-lg w-full p-8 text-center">
        <p className="text-[12px] font-extrabold uppercase tracking-wide text-secondary-text">
          Berana LMS
        </p>
        <h1 className="mt-2 text-[26px] font-extrabold text-navy-900">
          {data?.name ?? (isLoading ? 'Loading workspace...' : 'Institution workspace')}
        </h1>
        <p className="mt-3 text-[14px] text-secondary-text leading-relaxed">
          {error
            ? 'This institution does not exist, or its subscription has expired. Please contact Cyber-Zeb Consulting.'
            : (
              <>
                Your institution link <code className="font-bold text-navy-900">{data?.institution_link ?? `${slug}.berana-lms.com`}</code>{' '}
                is ready. Institution-admin login and module UI are provided by the separate
                institution-admin workstream.
              </>
            )}
        </p>
        <p className="mt-4 text-[12.5px] text-secondary-text">
          Check your activation email for temporary credentials. You must change the password on
          first login once that flow is enforced.
        </p>
      </GlassCard>
    </div>
  )
}
