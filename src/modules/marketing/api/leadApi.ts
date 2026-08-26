import { fetchCollection, putCollection } from '../../../shared/api/dataApi'
import type { LeadStatus, ServiceLead, ServiceRequestPayload } from '../types'

const COLLECTION_KEY = 'service-leads'

async function readAll(): Promise<ServiceLead[]> {
  try {
    const data = await fetchCollection<ServiceLead[]>(COLLECTION_KEY)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function writeAll(leads: ServiceLead[]): Promise<void> {
  await putCollection(COLLECTION_KEY, leads)
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24) || 'institution'
}

/** Simulates the notification Cyber-Zeb's Super Admin receives (email + SMS). */
function notifySuperAdmin(lead: ServiceLead) {
  console.info(
    `[MOCK NOTIFICATION] Super Admin alerted → New service request from "${lead.institutionName}" ` +
      `(${lead.contactName}, ${lead.email}, ${lead.phone}). Modules: ${lead.modules.join(', ')}.`,
  )
}

/** Simulates the "link delivered to institution" email once activated. */
function notifyInstitutionActivated(lead: ServiceLead) {
  console.info(
    `[MOCK NOTIFICATION] Email sent to ${lead.email} → "Your Brana LMS is ready: ${lead.subdomainLink}"`,
  )
}

export async function submitServiceRequest(
  payload: ServiceRequestPayload,
): Promise<ServiceLead> {
  const lead: ServiceLead = {
    ...payload,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'new',
  }

  const leads = await readAll()
  leads.unshift(lead)
  await writeAll(leads)
  notifySuperAdmin(lead)

  return lead
}

export async function getLeads(): Promise<ServiceLead[]> {
  return readAll()
}

export async function advanceLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<ServiceLead | null> {
  const leads = await readAll()
  const idx = leads.findIndex((l) => l.id === id)
  if (idx === -1) return null

  const updated: ServiceLead = { ...leads[idx], status }

  if (status === 'subdomain_activated' && !updated.subdomainLink) {
    const slug = updated.preferredSubdomain
      ? slugify(updated.preferredSubdomain)
      : slugify(updated.institutionName)
    updated.subdomainLink = `${slug}.brana-lms.com`
    notifyInstitutionActivated(updated)
  }

  leads[idx] = updated
  await writeAll(leads)
  return updated
}
