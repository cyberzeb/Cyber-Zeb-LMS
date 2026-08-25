import { useOrganizationConfig } from './useOrganizationConfig'

export function useTenantBranding() {
  const config = useOrganizationConfig()
  return {
    organizationName: config.organizationName,
    adminRoleLabel: config.terminology.adminRole,
    edition: config.edition,
  }
}
