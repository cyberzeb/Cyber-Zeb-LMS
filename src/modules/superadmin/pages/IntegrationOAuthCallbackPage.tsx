import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { axiosClient } from '../../../lib/axiosClient'
import type { Integration } from '../types'

const PLATFORM_LABELS: Record<string, string> = {
  zoom: 'Zoom',
  microsoft_teams: 'Microsoft Teams',
  google_meet: 'Google Meet',
  webex: 'Webex',
}

type Phase = 'loading' | 'success' | 'error' | 'missing'

export function IntegrationOAuthCallbackPage() {
  const { platform = '' } = useParams<{ platform: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const platformLabel = PLATFORM_LABELS[platform] ?? platform

  const [phase, setPhase] = useState<Phase>(() =>
    code && state ? 'loading' : 'missing',
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)

  // useRef guard so the effect only fires once even under React 18 StrictMode
  const called = useRef(false)

  useEffect(() => {
    if (phase !== 'loading') return
    if (called.current) return
    called.current = true

    axiosClient
      .post<Integration>(`/super-admin/integrations/${platform}/callback`, { code, state })
      .then((res) => {
        setConnectedAccount(res.data.connected_account ?? null)
        // Invalidate so the Integrations list shows "Connected" immediately on return
        qc.invalidateQueries({ queryKey: ['super-admin', 'integrations'] })
        setPhase('success')
        // Redirect back after a short delay
        setTimeout(() => navigate('/super-admin/integrations', { replace: true }), 1500)
      })
      .catch((err: Error) => {
        setErrorMessage(err.message)
        setPhase('error')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GlassCard className="w-full max-w-md p-8">
        {phase === 'loading' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 size={36} className="text-navy-900 animate-spin" />
            <div>
              <p className="text-[16px] font-extrabold text-navy-900">
                Connecting to {platformLabel}…
              </p>
              <p className="text-[13px] text-secondary-text mt-1">
                Exchanging authorisation code. This usually takes a moment.
              </p>
            </div>
          </div>
        )}

        {phase === 'success' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle size={40} className="text-lemon-600" />
            <div>
              <p className="text-[16px] font-extrabold text-navy-900">
                {platformLabel} connected successfully
              </p>
              {connectedAccount && (
                <p className="text-[13px] text-secondary-text mt-1">
                  Signed in as <span className="font-semibold text-navy-900">{connectedAccount}</span>
                </p>
              )}
              <p className="text-[12.5px] text-secondary-text mt-2">
                Redirecting back to Integrations…
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/super-admin/integrations', { replace: true })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-bold text-white"
            >
              <ArrowLeft size={14} />
              Back to Integrations
            </button>
          </div>
        )}

        {phase === 'error' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle size={36} className="text-danger" />
            <div>
              <p className="text-[16px] font-extrabold text-navy-900">
                Connection failed
              </p>
              <p className="text-[13px] text-secondary-text mt-1">
                Could not complete the {platformLabel} OAuth flow.
              </p>
              <p className="mt-3 text-[12.5px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg text-left">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/super-admin/integrations', { replace: true })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-divider px-4 py-2.5 text-[12.5px] font-bold text-navy-900 hover:bg-canvas"
            >
              <ArrowLeft size={14} />
              Back to Integrations
            </button>
          </div>
        )}

        {phase === 'missing' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle size={36} className="text-warning" />
            <div>
              <p className="text-[16px] font-extrabold text-navy-900">
                No authorisation data found
              </p>
              <p className="text-[13px] text-secondary-text mt-1">
                The <code className="font-mono text-[12px]">code</code> or{' '}
                <code className="font-mono text-[12px]">state</code> parameter is missing from
                the URL. Please start the OAuth flow again from the Integrations page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/super-admin/integrations', { replace: true })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-divider px-4 py-2.5 text-[12.5px] font-bold text-navy-900 hover:bg-canvas"
            >
              <ArrowLeft size={14} />
              Back to Integrations
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
