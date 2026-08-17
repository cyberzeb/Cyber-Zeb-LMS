import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './app/AppRouter'
import { ToastProvider } from './shared/components/toast/ToastProvider'
import { initBeranaStorage } from './shared/storage/initStorage'
import { ensureDemoSeedData } from './shared/storage/seedDemoData'
import { ensureDemoLearningCourse } from './shared/storage/seedDemoCourse'
import './styles/globals.css'

initBeranaStorage()
ensureDemoSeedData()
ensureDemoLearningCourse()

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)