import type { ModuleKey } from '../../shared/constants/modules'
import type { MasterDataForm } from './masterData'

/**
 * Institution edition / category. Values match the backend `InstitutionType` enum.
 * Modules are chosen separately on the request page — see MODULE_CATALOG.
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
  /** Modules the institution selected. Only these are activated. */
  selectedModules: ModuleKey[]
  /** Institution Master Data, omitted for a short enquiry. */
  masterData?: MasterDataForm
}

export interface ServiceLead extends ServiceRequestPayload {
  id: string
  createdAt: string
  status: LeadStatus
  subdomainLink?: string
}
