import { useState } from 'react'
import { Copy, PencilRuler, Plus, RotateCcw, Star, Trash2 } from 'lucide-react'

import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { useToast } from '../../../shared/components/toast/ToastProvider'
import { GlassCard } from '../../../shared/layout/GlassCard'
import { readInstitutionName } from '../../../shared/storage/readers'
import { CertificateArt } from './CertificateArt'
import { CertificateDesigner } from './CertificateDesigner'
import { PRESET_TEMPLATES, blankTemplate, duplicateTemplate } from './presets'
import { sampleCertificateData, type CertificateTemplateDesign } from './templateModel'
import { useCertificateTemplates } from './useCertificateTemplates'

interface Props {
  /** How many issued certificates use each template id. */
  usage: Record<string, number>
}

export function CertificateTemplatesPanel({ usage }: Props) {
  const { notify } = useToast()
  const { templates, storedIds, saveTemplate, deleteTemplate, setDefault } = useCertificateTemplates()
  const [editing, setEditing] = useState<CertificateTemplateDesign | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CertificateTemplateDesign | null>(null)
  const institutionName = readInstitutionName()
  const sample = sampleCertificateData(institutionName)
  const presetIds = new Set(PRESET_TEMPLATES.map((p) => p.id))

  function handleSave(template: CertificateTemplateDesign) {
    // Editing a built-in keeps its id so certificates already issued with it
    // pick up the new look; "Reset" brings the original back.
    const isPreset = presetIds.has(template.id)
    saveTemplate({ ...template, builtIn: isPreset })
    setEditing(null)
    notify(`"${template.name}" saved.`)
  }

  function handleDelete() {
    if (!confirmDelete) return
    deleteTemplate(confirmDelete.id)
    notify(
      presetIds.has(confirmDelete.id)
        ? `"${confirmDelete.name}" reset to the original design.`
        : `"${confirmDelete.name}" deleted.`,
      'info',
    )
    setConfirmDelete(null)
  }

  const deletingPreset = confirmDelete ? presetIds.has(confirmDelete.id) : false
  const deletingUsage = confirmDelete ? usage[confirmDelete.id] ?? 0 : 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-[13px] text-secondary-text">
          Design how certificates look. Pick a template when issuing; learners download exactly
          this design as a PDF with a QR code that proves it is genuine.
        </p>
        <Button variant="primary" onClick={() => setEditing(blankTemplate())}>
          <Plus size={16} />
          New template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => {
          const isPreset = presetIds.has(t.id)
          const customised = isPreset && storedIds.has(t.id)
          const used = usage[t.id] ?? 0
          return (
            <GlassCard key={t.id} className="group flex flex-col overflow-hidden p-0">
              <button
                type="button"
                onClick={() => setEditing(t)}
                className="relative block bg-canvas p-4 cursor-pointer"
                aria-label={`Edit ${t.name}`}
              >
                <div className="mx-auto shadow-md ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ maxWidth: t.orientation === 'portrait' ? 150 : '100%' }}>
                  <CertificateArt template={t} data={sample} uid={`gal-${t.id}`} className="block h-auto w-full" />
                </div>
                <span className="absolute inset-0 flex items-center justify-center bg-navy-900/0 opacity-0 transition-all group-hover:bg-navy-900/35 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-navy-900 shadow">
                    <PencilRuler size={13} /> Open designer
                  </span>
                </span>
              </button>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-extrabold text-navy-900">{t.name}</p>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {t.isDefault ? <Badge tone="lemon">Default</Badge> : null}
                    {isPreset ? <Badge tone="neutral">{customised ? 'Customised' : 'Built-in'}</Badge> : null}
                  </div>
                </div>
                {t.description ? <p className="text-[12px] text-secondary-text line-clamp-2">{t.description}</p> : null}
                <p className="text-[11.5px] font-semibold text-secondary-text">
                  {used ? `Used by ${used} certificate${used === 1 ? '' : 's'}` : 'Not used yet'} ·{' '}
                  {t.orientation === 'landscape' ? 'Landscape' : 'Portrait'}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                  <IconAction label="Edit" onClick={() => setEditing(t)} icon={<PencilRuler size={13} />} />
                  <IconAction
                    label="Duplicate"
                    onClick={() => {
                      const copy = duplicateTemplate(t)
                      saveTemplate(copy)
                      notify(`Created "${copy.name}".`)
                    }}
                    icon={<Copy size={13} />}
                  />
                  {!t.isDefault ? (
                    <IconAction
                      label="Make default"
                      onClick={() => {
                        setDefault(t.id)
                        notify(`"${t.name}" is now the default template.`)
                      }}
                      icon={<Star size={13} />}
                    />
                  ) : null}
                  {!isPreset ? (
                    <IconAction label="Delete" danger onClick={() => setConfirmDelete(t)} icon={<Trash2 size={13} />} />
                  ) : customised ? (
                    <IconAction label="Reset" onClick={() => setConfirmDelete(t)} icon={<RotateCcw size={13} />} />
                  ) : null}
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {editing ? (
        <CertificateDesigner
          initial={editing}
          institutionName={institutionName}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        icon={deletingPreset ? <RotateCcw size={18} /> : <Trash2 size={18} />}
        title={deletingPreset ? 'Reset template' : 'Delete template'}
        description={
          confirmDelete
            ? deletingPreset
              ? `Undo your changes to "${confirmDelete.name}" and restore the original design?`
              : `Delete "${confirmDelete.name}"?`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant={deletingPreset ? 'primary' : 'danger'} onClick={handleDelete}>
              {deletingPreset ? 'Reset' : 'Delete'}
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-secondary-text">
          {deletingUsage
            ? `${deletingUsage} issued certificate${deletingUsage === 1 ? ' uses' : 's use'} this template. ${
                deletingPreset
                  ? 'They will show the original design.'
                  : 'They will show the default template instead.'
              }`
            : 'No issued certificates use this template.'}
        </p>
      </Modal>
    </div>
  )
}

function Badge({ tone, children }: { tone: 'lemon' | 'neutral'; children: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
        tone === 'lemon' ? 'bg-lemon-500/15 text-lemon-700 dark:text-lemon-500' : 'bg-canvas text-secondary-text'
      }`}
    >
      {children}
    </span>
  )
}

function IconAction({
  label,
  icon,
  onClick,
  danger,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-bold transition-colors cursor-pointer ${
        danger
          ? 'border-danger/25 text-danger hover:bg-danger-bg'
          : 'border-divider text-navy-900 hover:border-lemon-500/60'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
