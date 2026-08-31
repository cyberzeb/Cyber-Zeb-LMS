import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Image, Globe, Mail, Phone, Plus, Trash2, Upload } from 'lucide-react'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { Button } from '../../../shared/components/Button'
import { getBranding, updateBranding, uploadBrandingAsset } from '../api/serviceRequestApi'
import type { Branding, FooterLink } from '../types'

const inputClass =
  'w-full rounded-lg border border-divider bg-white px-3 py-2.5 text-[13px] text-navy-900 outline-none focus:border-lemon-500'

function AssetUploader({
  label,
  currentUrl,
  assetType,
  onUploaded,
}: {
  label: string
  currentUrl: string | null
  assetType: 'logo' | 'favicon'
  onUploaded: (b: Branding) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const result = await uploadBrandingAsset(assetType, file)
      onUploaded(result)
      qc.invalidateQueries({ queryKey: ['super-admin', 'branding'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-bold text-navy-900">{label}</p>
      {currentUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={currentUrl}
            alt={label}
            className="h-12 w-12 object-contain rounded border border-divider bg-canvas"
          />
          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-info underline truncate max-w-[220px]"
          >
            {currentUrl}
          </a>
        </div>
      ) : (
        <p className="text-[12px] text-secondary-text italic">No {label.toLowerCase()} set</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-divider px-3 py-2 text-[12px] font-bold text-navy-900 hover:bg-canvas disabled:opacity-50"
      >
        <Upload size={13} />
        {uploading ? 'Uploading…' : `Upload ${label}`}
      </button>
      {error && <p className="text-[12px] font-semibold text-danger">{error}</p>}
    </div>
  )
}

export function AppearancePage() {
  const qc = useQueryClient()
  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['super-admin', 'branding'],
    queryFn: getBranding,
  })

  // Draft state mirroring the text fields
  const [draft, setDraft] = useState<{
    footer_text: string
    footer_links: FooterLink[]
    support_email: string
    support_phone: string
  } | null>(null)

  // Seed draft from loaded data once
  const [seeded, setSeeded] = useState(false)
  if (data && !seeded) {
    setDraft({
      footer_text: data.footer_text ?? '',
      footer_links: data.footer_links ?? [],
      support_email: data.support_email ?? '',
      support_phone: data.support_phone ?? '',
    })
    setSeeded(true)
  }

  const [actionError, setActionError] = useState('')
  const [saveOk, setSaveOk] = useState(false)

  const saveMutation = useMutation({
    mutationFn: () =>
      updateBranding({
        footer_text: draft?.footer_text || null,
        footer_links:
          draft?.footer_links && draft.footer_links.length > 0
            ? draft.footer_links
            : null,
        support_email: draft?.support_email || null,
        support_phone: draft?.support_phone || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'branding'] })
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
      setActionError('')
    },
    onError: (e: Error) => {
      setActionError(e.message)
      setSaveOk(false)
    },
  })

  if (isLoading) {
    return <p className="text-[13px] text-secondary-text">Loading branding settings…</p>
  }
  if (loadError) {
    return (
      <p className="text-[13px] font-semibold text-danger">
        {loadError instanceof Error ? loadError.message : 'Failed to load'}
      </p>
    )
  }
  if (!draft || !data) return null

  const updateLink = (i: number, field: keyof FooterLink, value: string) => {
    setDraft((d) => {
      if (!d) return d
      const links = [...d.footer_links]
      links[i] = { ...links[i], [field]: value }
      return { ...d, footer_links: links }
    })
  }

  const removeLink = (i: number) => {
    setDraft((d) => {
      if (!d) return d
      return { ...d, footer_links: d.footer_links.filter((_, idx) => idx !== i) }
    })
  }

  const addLink = () => {
    setDraft((d) => {
      if (!d) return d
      return { ...d, footer_links: [...d.footer_links, { label: '', url: '' }] }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-navy-900">Appearance & Branding</h1>
        <p className="text-[13.5px] text-secondary-text mt-1">
          Platform logo, favicon, footer copy, and support contact info. Changes apply live.
        </p>
      </div>

      {/* Logo & Favicon */}
      <GlassCard className="p-6 space-y-6">
        <h2 className="text-[14px] font-extrabold text-navy-900 flex items-center gap-2">
          <Image size={16} />
          Logo &amp; Favicon
        </h2>
        <AssetUploader
          label="Logo"
          currentUrl={data.logo_url}
          assetType="logo"
          onUploaded={() => qc.invalidateQueries({ queryKey: ['super-admin', 'branding'] })}
        />
        <AssetUploader
          label="Favicon"
          currentUrl={data.favicon_url}
          assetType="favicon"
          onUploaded={() => qc.invalidateQueries({ queryKey: ['super-admin', 'branding'] })}
        />
        <p className="text-[11.5px] text-secondary-text">
          Supported formats: PNG, SVG, JPG. Max 5 MB. Logo is shown in the admin console header
          and landing page; favicon is used in the browser tab.
        </p>
      </GlassCard>

      {/* Footer */}
      <GlassCard className="p-6 space-y-5">
        <h2 className="text-[14px] font-extrabold text-navy-900 flex items-center gap-2">
          <Globe size={16} />
          Footer
        </h2>

        <label className="block space-y-1">
          <span className="text-[12px] font-bold text-navy-900">Footer text</span>
          <textarea
            rows={3}
            value={draft.footer_text}
            onChange={(e) => setDraft((d) => d && { ...d, footer_text: e.target.value })}
            placeholder="© 2026 Cyber-Zeb Consulting. All rights reserved."
            className={inputClass + ' resize-none'}
          />
          <p className="text-[11.5px] text-secondary-text">
            Copyright line, company address, or any site-wide footer text.
          </p>
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-navy-900">Footer links</span>
            <button
              type="button"
              onClick={addLink}
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-navy-900 hover:text-lemon-700"
            >
              <Plus size={13} />
              Add link
            </button>
          </div>
          {draft.footer_links.length === 0 && (
            <p className="text-[12px] text-secondary-text italic">
              No footer links yet. Click "Add link" to add Terms, Privacy Policy, etc.
            </p>
          )}
          {draft.footer_links.map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className={inputClass}
                placeholder="Label (e.g. Privacy Policy)"
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="URL (e.g. https://...)"
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="shrink-0 text-danger hover:text-danger/80"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Support contact */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-[14px] font-extrabold text-navy-900 flex items-center gap-2">
          <Mail size={16} />
          Support Contact
        </h2>
        <label className="block space-y-1">
          <span className="text-[12px] font-bold text-navy-900 flex items-center gap-1">
            <Mail size={12} />
            Support email
          </span>
          <input
            className={inputClass}
            type="email"
            value={draft.support_email}
            onChange={(e) => setDraft((d) => d && { ...d, support_email: e.target.value })}
            placeholder="support@berana-lms.com"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[12px] font-bold text-navy-900 flex items-center gap-1">
            <Phone size={12} />
            Support phone
          </span>
          <input
            className={inputClass}
            value={draft.support_phone}
            onChange={(e) => setDraft((d) => d && { ...d, support_phone: e.target.value })}
            placeholder="+251 911 000 000"
          />
        </label>
      </GlassCard>

      {/* Actions */}
      {actionError && (
        <p className="text-[13px] font-semibold text-danger bg-danger-bg px-3 py-2 rounded-lg">
          {actionError}
        </p>
      )}
      {saveOk && (
        <p className="text-[13px] font-semibold text-lemon-700 bg-lemon-50 px-3 py-2 rounded-lg">
          Branding settings saved.
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
