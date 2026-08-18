import type { PersonRow } from '../types'

export type AddedByRole = 'Admin' | 'Staff'
export type VerificationStatus = 'verified' | 'pending' | 'rejected'

export const PEOPLE_UPDATED_EVENT = 'berana:people-updated'

export function notifyPeopleUpdated() {
  window.dispatchEvent(new Event(PEOPLE_UPDATED_EVENT))
}

export function withAdminVerification(person: PersonRow): PersonRow {
  return {
    ...person,
    verificationStatus: 'verified',
    addedByRole: 'Admin',
  }
}

export function withStaffVerification(
  person: PersonRow,
  submittedByName = 'Staff member',
): PersonRow {
  return {
    ...person,
    verificationStatus: 'pending',
    addedByRole: 'Staff',
    submittedAt: 'Just now',
    submittedByName,
  }
}

export function migrateVerification(person: PersonRow): PersonRow {
  if (person.verificationStatus) return person
  return {
    ...person,
    verificationStatus: 'verified',
    addedByRole: person.addedByRole ?? 'Admin',
  }
}

export function countPendingVerifications(people: PersonRow[]): number {
  return people.filter((p) => p.verificationStatus === 'pending').length
}
