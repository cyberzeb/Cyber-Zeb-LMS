import { useCallback } from 'react'
import { useLocalStorageState } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import {
  buildCertificateRecord,
  revokeCertificateRecord,
  type IssueCertificateInput,
} from '../api/certificatesApi'
import { seedCertificates } from '../data/certificatesSeedData'
import type { CertificateRecord } from '../types'

function notifyCertificatesUpdated() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.certificatesUpdated))
}

export function useCertificates() {
  const [certificates, setCertificatesRaw] = useLocalStorageState<CertificateRecord[]>(
    STORAGE_KEYS.certificates,
    seedCertificates,
  )

  const setCertificates = useCallback(
    (updater: CertificateRecord[] | ((prev: CertificateRecord[]) => CertificateRecord[])) => {
      setCertificatesRaw(updater)
      notifyCertificatesUpdated()
    },
    [setCertificatesRaw],
  )

  const issueCertificate = useCallback(
    (input: IssueCertificateInput) => {
      let created: CertificateRecord | null = null
      setCertificates((prev) => {
        created = buildCertificateRecord(input, prev)
        return [created, ...prev]
      })
      return created!
    },
    [setCertificates],
  )

  const revokeCertificate = useCallback(
    (id: string) => {
      setCertificates((prev) =>
        prev.map((c) => (c.id === id ? revokeCertificateRecord(c) : c)),
      )
    },
    [setCertificates],
  )

  const updateCertificate = useCallback(
    (id: string, patch: Partial<Omit<CertificateRecord, 'id' | 'certificateId'>>) => {
      setCertificates((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    },
    [setCertificates],
  )

  return {
    certificates,
    setCertificates,
    issueCertificate,
    revokeCertificate,
    updateCertificate,
  }
}

export function readCertificatesFromStorage(): CertificateRecord[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.certificates)
    if (stored) return JSON.parse(stored) as CertificateRecord[]
  } catch {
    /* ignore */
  }
  return seedCertificates
}
