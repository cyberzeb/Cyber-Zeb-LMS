import { createContext, useContext, type ReactNode } from 'react'
import { useOrgStructure } from '../hooks/useOrgStructure'

type OrgStructureState = ReturnType<typeof useOrgStructure>

const CampusContext = createContext<OrgStructureState | null>(null)

export function CampusProvider({ children }: { children: ReactNode }) {
  const org = useOrgStructure()
  return <CampusContext.Provider value={org}>{children}</CampusContext.Provider>
}

export function useCampusContext() {
  const ctx = useContext(CampusContext)
  if (!ctx) {
    throw new Error('useCampusContext must be used within CampusProvider')
  }
  return ctx
}
