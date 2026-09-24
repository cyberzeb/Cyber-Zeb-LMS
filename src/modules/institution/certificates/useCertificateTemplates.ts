import { useCallback, useMemo } from 'react'

import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { readInstitutionName } from '../../../shared/storage/readers'
import { STORAGE_KEYS } from '../../../shared/storage/keys'
import type { CertificateRecord } from '../types'
import { verifyUrlFor, type CertificateData, type CertificateTemplateDesign } from './templateModel'
import { mergeWithPresets, normalizeTemplate, resolveTemplate } from './presets'

const EMPTY: CertificateTemplateDesign[] = []

/**
 * The institution's certificate templates. Only what the admin created or
 * changed is stored; the built-in presets are merged in on read.
 */
export function useCertificateTemplates() {
  const [stored, setStored] = useApiCollection<CertificateTemplateDesign[]>(
    STORAGE_KEYS.certificateTemplates,
    EMPTY,
  )
  // Templates saved in the first format are converted as they are read.
  const saved = useMemo(() => (Array.isArray(stored) ? stored.map(normalizeTemplate) : []), [stored])
  const templates = useMemo(() => mergeWithPresets(saved), [saved])
  const storedIds = useMemo(() => new Set(saved.map((t) => t.id)), [saved])

  const saveTemplate = useCallback(
    (template: CertificateTemplateDesign) => {
      const next = { ...template, updatedAt: new Date().toISOString() }
      setStored((prev) => {
        const list = Array.isArray(prev) ? prev : []
        let updated = list.some((t) => t.id === next.id)
          ? list.map((t) => (t.id === next.id ? next : t))
          : [next, ...list]
        if (next.isDefault) updated = updated.map((t) => (t.id === next.id ? t : { ...t, isDefault: false }))
        return updated
      })
    },
    [setStored],
  )

  const deleteTemplate = useCallback(
    (id: string) => setStored((prev) => (Array.isArray(prev) ? prev : []).filter((t) => t.id !== id)),
    [setStored],
  )

  /** Make one template the default. Built-in ones are saved so the flag persists. */
  const setDefault = useCallback(
    (id: string) => {
      setStored((prev) => {
        const list = (Array.isArray(prev) ? prev : []).map(normalizeTemplate)
        const merged = mergeWithPresets(list)
        const target = merged.find((t) => t.id === id)
        if (!target) return list
        const withTarget = list.some((t) => t.id === id) ? list : [target, ...list]
        return withTarget.map((t) => ({ ...t, isDefault: t.id === id }))
      })
    },
    [setStored],
  )

  const templateFor = useCallback((templateId?: string) => resolveTemplate(templates, templateId), [templates])

  return { templates, storedIds, saveTemplate, deleteTemplate, setDefault, templateFor }
}

/** What an issued certificate renders with. */
export function certificateDataFrom(cert: CertificateRecord): CertificateData {
  return {
    studentName: cert.studentName,
    courseTitle: cert.courseTitle,
    courseCode: cert.courseCode,
    institutionName: readInstitutionName(),
    instructorName: cert.instructorName,
    department: cert.department,
    issueDate: cert.issueDate,
    completionDate: cert.completionDate,
    expirationDate: cert.expirationDate,
    certificateId: cert.certificateId,
    verifyUrl: verifyUrlFor(cert.certificateId),
  }
}
