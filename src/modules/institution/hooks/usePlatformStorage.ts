import { useCallback } from 'react'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import {
  seedHelpDeskTickets,
  seedIntegrations,
  seedPayments,
} from '../data/platformSeedData'
import type {
  ApiIntegrationRecord,
  HelpDeskTicketRecord,
  PaymentRecord,
} from '../types/platform'

function notifyPlatformUpdated() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.platformUpdated))
}

export function usePayments() {
  const [records, setRecordsRaw] = useApiCollection<PaymentRecord[]>(
    STORAGE_KEYS.payments,
    seedPayments,
  )

  const setRecords = useCallback(
    (updater: PaymentRecord[] | ((prev: PaymentRecord[]) => PaymentRecord[])) => {
      setRecordsRaw(updater)
      notifyPlatformUpdated()
    },
    [setRecordsRaw],
  )

  const createPayment = useCallback(
    (input: Omit<PaymentRecord, 'id'>) => {
      const record: PaymentRecord = { ...input, id: createId('pay') }
      setRecords((prev) => [record, ...prev])
      return record
    },
    [setRecords],
  )

  const updatePayment = useCallback(
    (id: string, patch: Partial<PaymentRecord>) => {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
    [setRecords],
  )

  const markPaid = useCallback(
    (id: string) => {
      setRecords((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'paid' as const, paidAt: new Date().toISOString() }
            : p,
        ),
      )
    },
    [setRecords],
  )

  const deletePayment = useCallback(
    (id: string) => {
      setRecords((prev) => prev.filter((r) => r.id !== id))
    },
    [setRecords],
  )

  return { records, setRecords, createPayment, updatePayment, markPaid, deletePayment }
}

export function useHelpDesk() {
  const [records, setRecordsRaw] = useApiCollection<HelpDeskTicketRecord[]>(
    STORAGE_KEYS.helpDeskTickets,
    seedHelpDeskTickets,
  )

  const setRecords = useCallback(
    (
      updater:
        | HelpDeskTicketRecord[]
        | ((prev: HelpDeskTicketRecord[]) => HelpDeskTicketRecord[]),
    ) => {
      setRecordsRaw(updater)
      notifyPlatformUpdated()
    },
    [setRecordsRaw],
  )

  const createTicket = useCallback(
    (input: Omit<HelpDeskTicketRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      const record: HelpDeskTicketRecord = {
        ...input,
        id: createId('hd'),
        createdAt: now,
        updatedAt: now,
      }
      setRecords((prev) => [record, ...prev])
      return record
    },
    [setRecords],
  )

  const updateTicket = useCallback(
    (id: string, patch: Partial<HelpDeskTicketRecord>) => {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
        ),
      )
    },
    [setRecords],
  )

  const deleteTicket = useCallback(
    (id: string) => {
      setRecords((prev) => prev.filter((r) => r.id !== id))
    },
    [setRecords],
  )

  return { records, setRecords, createTicket, updateTicket, deleteTicket }
}

export function useIntegrations() {
  const [records, setRecordsRaw] = useApiCollection<ApiIntegrationRecord[]>(
    STORAGE_KEYS.integrations,
    seedIntegrations,
  )

  const setRecords = useCallback(
    (
      updater:
        | ApiIntegrationRecord[]
        | ((prev: ApiIntegrationRecord[]) => ApiIntegrationRecord[]),
    ) => {
      setRecordsRaw(updater)
      notifyPlatformUpdated()
    },
    [setRecordsRaw],
  )

  const updateIntegration = useCallback(
    (id: string, patch: Partial<ApiIntegrationRecord>) => {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...patch,
                lastSync: patch.status === 'connected' ? new Date().toISOString() : r.lastSync,
              }
            : r,
        ),
      )
    },
    [setRecords],
  )

  const toggleIntegration = useCallback(
    (id: string) => {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
      )
    },
    [setRecords],
  )

  const connectIntegration = useCallback(
    (id: string) => {
      updateIntegration(id, { status: 'connected', enabled: true })
    },
    [updateIntegration],
  )

  const disconnectIntegration = useCallback(
    (id: string) => {
      updateIntegration(id, { status: 'disconnected', enabled: false, lastSync: 'Never' })
    },
    [updateIntegration],
  )

  return {
    records,
    setRecords,
    updateIntegration,
    toggleIntegration,
    connectIntegration,
    disconnectIntegration,
  }
}
