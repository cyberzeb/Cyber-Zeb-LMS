import { useEffect } from 'react'

/** Keeps a page-level campus filter in sync with the global header selector, including “All”. */
export function useSyncCampusFilter(
  selectedCampusId: string | 'all',
  setCampusFilter: (value: string) => void,
) {
  useEffect(() => {
    setCampusFilter(selectedCampusId === 'all' ? 'all' : selectedCampusId)
  }, [selectedCampusId, setCampusFilter])
}
