import { QueryClient } from '@tanstack/react-query'

/** App-wide query client; shared with non-React code (e.g. collection saves). */
export const queryClient = new QueryClient()
