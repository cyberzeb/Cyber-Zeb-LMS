import { createId } from '../../../shared/hooks/useLocalStorageState'
import type { CertificateRecord, CertificateStatus } from '../types'
import type { CertificatePendingReason } from '../../../modules/students/types'
import { readInstitutionName } from '../../../shared/storage/readers'

export function generateCertificateId(existing: CertificateRecord[]): string {
  const year = new Date().getFullYear()
  const prefix = `BER-CERT-${year}-`
  const nums = existing
    .map((c) => c.certificateId)
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${prefix}${String(next).padStart(5, '0')}`
}

export interface IssueCertificateInput {
  studentId: string
  studentName: string
  courseId: string
  courseCode: string
  courseTitle: string
  instructorId?: string
  instructorName: string
  department: string
  campusId: string
  templateId: string
  templateName: string
  issueDate: string
  expirationDate?: string
  completionDate?: string
  status?: CertificateStatus
}

export function buildCertificateRecord(
  input: IssueCertificateInput,
  existing: CertificateRecord[],
): CertificateRecord {
  const status = input.status ?? 'issued'
  return {
    id: createId('cert'),
    certificateId: generateCertificateId(existing),
    studentId: input.studentId,
    studentName: input.studentName,
    courseId: input.courseId,
    courseCode: input.courseCode,
    courseTitle: input.courseTitle,
    instructorId: input.instructorId,
    instructorName: input.instructorName,
    department: input.department,
    campusId: input.campusId,
    completionDate: input.completionDate ?? input.issueDate,
    issueDate: status === 'pending' ? undefined : input.issueDate,
    expirationDate: input.expirationDate || undefined,
    templateId: input.templateId,
    templateName: input.templateName,
    status,
  }
}

export function revokeCertificateRecord(cert: CertificateRecord): CertificateRecord {
  return {
    ...cert,
    status: 'revoked',
    revokedAt: new Date().toISOString().slice(0, 10),
  }
}

function derivePendingReason(cert: CertificateRecord): CertificatePendingReason {
  // Heuristic: no completionDate → still working through the course
  if (!cert.completionDate) return 'awaiting-completion'
  // Has completion date but no instructor → awaiting instructor sign-off
  if (!cert.instructorId) return 'awaiting-instructor-approval'
  // All other pending states → awaiting admin
  return 'awaiting-admin-approval'
}

export function certificateToStudentItem(cert: CertificateRecord) {
  const isIssued = cert.status === 'issued'
  const issuedAtDisplay = cert.issueDate
    ? new Date(cert.issueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Pending'

  const completionDateDisplay = cert.completionDate
    ? new Date(cert.completionDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined

  return {
    id: cert.id,
    title: cert.templateName,
    course: `${cert.courseCode} — ${cert.courseTitle}`,
    issuedAt: issuedAtDisplay,
    issuedAtRaw: cert.issueDate,
    completionDate: completionDateDisplay,
    credentialId: cert.certificateId,
    status: isIssued ? ('issued' as const) : ('in-progress' as const),
    pendingReason: isIssued ? undefined : derivePendingReason(cert),
    institution: readInstitutionName(),
    instructorName: cert.instructorName,
    department: cert.department,
  }
}
