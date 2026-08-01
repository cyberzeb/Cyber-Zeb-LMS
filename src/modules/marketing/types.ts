export type InstitutionType =
  | 'university'
  | 'school'
  | 'business'
  | 'government'
  | 'ngo'
  | 'training_provider'

export type RequestedModule =
  | 'academic'
  | 'virtual_classroom'
  | 'assessment'
  | 'payments'
  | 'parent_portal'
  | 'reports_ai'

export type LeadStatus =
  | 'new'
  | 'invoice_sent'
  | 'paid_agreement_signed'
  | 'subdomain_activated'

export interface ServiceRequestPayload {
  institutionName: string
  institutionType: InstitutionType
  contactName: string
  email: string
  phone: string
  estimatedUsers: string
  preferredSubdomain: string
  modules: RequestedModule[]
  message: string
}

export interface ServiceLead extends ServiceRequestPayload {
  id: string
  createdAt: string
  status: LeadStatus
  subdomainLink?: string
}
