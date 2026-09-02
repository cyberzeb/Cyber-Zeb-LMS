/**
 * Institution edition / category. Registration is by edition only — every
 * activated institution receives the full module suite (no module selection).
 * Values match the backend `InstitutionType` enum.
 */
export type InstitutionType =
  | 'college_university'
  | 'corporate'
  | 'training'

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
  message: string
}

export interface ServiceLead extends ServiceRequestPayload {
  id: string
  createdAt: string
  status: LeadStatus
  subdomainLink?: string
}
