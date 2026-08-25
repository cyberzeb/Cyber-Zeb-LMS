import { useLocation } from 'react-router-dom'

/** Base path for learner portal routes (`/student` or `/employee`). */
export function useLearnerBasePath(): '/student' | '/employee' {
  const { pathname } = useLocation()
  return pathname.startsWith('/employee') ? '/employee' : '/student'
}

export function useIsEmployeePortal(): boolean {
  return useLearnerBasePath() === '/employee'
}
