export type InstitutionType = 'college_university' | 'training' | 'corporate'

export const INSTITUTION_TYPES: { value: InstitutionType; label: string }[] = [
  { value: 'college_university', label: 'College / University' },
  { value: 'training', label: 'Training' },
  { value: 'corporate', label: 'Corporate' },
]

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  college_university: 'College / University',
  training: 'Training',
  corporate: 'Corporate',
}

export const INSTITUTION_TYPE_URL_SEGMENTS: Record<InstitutionType, string> = {
  college_university: 'college',
  training: 'training',
  corporate: 'corporate',
}

export function institutionTypeLabel(value: string): string {
  return INSTITUTION_TYPE_LABELS[value as InstitutionType] ?? value
}

export function institutionTypeUrlSegment(value: string): string {
  return INSTITUTION_TYPE_URL_SEGMENTS[value as InstitutionType] ?? 'college'
}

export function buildInstitutionLink(
  slug: string,
  institutionType: string,
  baseDomain = 'berana-lms.com',
): string {
  const domain = baseDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const scheme = domain.includes('localhost') ? 'http' : 'https'
  const segment = institutionTypeUrlSegment(institutionType)
  return `${scheme}://${slug}.${domain}/${segment}`
}
