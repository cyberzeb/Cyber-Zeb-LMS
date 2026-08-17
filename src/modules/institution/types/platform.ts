export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'refunded'

export type PaymentCategory = 'tuition' | 'lab-fee' | 'registration' | 'housing' | 'other'

export type HelpDeskStatus = 'open' | 'in-review' | 'resolved'

export type HelpDeskPriority = 'low' | 'medium' | 'high'

export type RequesterRole = 'Student' | 'Instructor' | 'Staff' | 'Admin'

export type IntegrationStatus = 'connected' | 'warning' | 'disconnected'

export type IntegrationCategory =
  | 'identity'
  | 'payments'
  | 'video'
  | 'communication'
  | 'analytics'
  | 'lms'

export interface PaymentRecord {
  id: string
  studentId: string
  studentName: string
  label: string
  amount: number
  currency: string
  dueAt: string
  paidAt?: string
  status: PaymentStatus
  category: PaymentCategory
  term: string
  campusId: string
  reference?: string
}

export interface HelpDeskTicketRecord {
  id: string
  subject: string
  description: string
  category: string
  priority: HelpDeskPriority
  status: HelpDeskStatus
  requesterId: string
  requesterName: string
  requesterRole: RequesterRole
  assignedTo?: string
  createdAt: string
  updatedAt: string
}

export interface ApiIntegrationRecord {
  id: string
  name: string
  provider: string
  description: string
  status: IntegrationStatus
  category: IntegrationCategory
  lastSync: string
  apiKeyMasked?: string
  webhookUrl?: string
  enabled: boolean
}
