import type { CertificateRecord, CertificateTemplate } from '../types'
import { DEFAULT_CAMPUS_ID } from './orgSeedData'

export const certificateTemplates: CertificateTemplate[] = [
  { id: 'tpl-standard', name: 'Standard Completion Certificate' },
  { id: 'tpl-professional', name: 'Professional Certificate' },
]

export const seedCertificates: CertificateRecord[] = [
  {
    id: 'cert-1',
    certificateId: 'BER-CERT-2025-00142',
    studentId: 'u1',
    studentName: 'Selam Girma',
    courseId: 'c1',
    courseCode: 'CS-101',
    courseTitle: 'Introduction to Programming',
    instructorId: 'u2',
    instructorName: 'Dr. Aaron Selassie',
    department: 'Computer Science',
    campusId: DEFAULT_CAMPUS_ID,
    completionDate: '2025-12-20',
    issueDate: '2025-12-22',
    templateId: 'tpl-standard',
    templateName: 'Standard Completion Certificate',
    status: 'issued',
  },
  {
    id: 'cert-2',
    certificateId: 'BER-CERT-2025-00155',
    studentId: 'u-demo-amina',
    studentName: 'Amina Lemma',
    courseId: 'demo-cyber-101',
    courseCode: 'CYB-101',
    courseTitle: 'Introduction to Cybersecurity',
    instructorId: 'u6',
    instructorName: 'Prof. Elias Hailu',
    department: 'Computer Science',
    campusId: DEFAULT_CAMPUS_ID,
    completionDate: '2025-12-15',
    issueDate: '2025-12-18',
    templateId: 'tpl-professional',
    templateName: 'Professional Certificate',
    status: 'issued',
  },
]
