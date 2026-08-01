import type { LeadStatus, ServiceLead, ServiceRequestPayload } from '../types'

/**
 * MOCK / DEMO API ONLY.
 *
 * This simulates the backend behaviour described in the blueprint:
 *  1. A prospective institution fills the "Request Service" form on the landing page.
 *  2. The request is saved as a "Lead" and the Super Admin is notified (email/SMS).
 *  3. The Super Admin reviews it on /admin/leads, sends an invoice, confirms payment
 *     + signed agreement, then activates the institution's dedicated subdomain link
 *     (e.g. aau.brana-lms.com), which is emailed to the institution.
 *
 * Replace this file's internals with real axios calls to the FastAPI backend
 * (e.g. POST /api/v1/leads, PATCH /api/v1/leads/{id}/status) once that endpoint
 * exists. Every function below is already async so swapping localStorage for
 * axios later does not require changing any component code.
 */

const STORAGE_KEY = 'brana_service_leads'

function readAll(): ServiceLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ServiceLead[]) : []
  } catch {
    return []
  }
}

function writeAll(leads: ServiceLead[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
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
  // In production this becomes a backend job: send email via SMTP provider
  // and SMS via a provider adapter, per Section 12 of the blueprint.
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
  await new Promise((r) => setTimeout(r, 500)) // simulate network latency

  const lead: ServiceLead = {
    ...payload,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'new',
  }

  const leads = readAll()
  leads.unshift(lead)
  writeAll(leads)
  notifySuperAdmin(lead)

  return lead
}

export async function getLeads(): Promise<ServiceLead[]> {
  await new Promise((r) => setTimeout(r, 150))
  return readAll()
}

export async function advanceLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<ServiceLead | null> {
  await new Promise((r) => setTimeout(r, 250))
  const leads = readAll()
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
  writeAll(leads)
  return updated
}