import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './app/AppRouter'
import { ToastProvider } from './shared/components/toast/ToastProvider'
import { ThemeProvider, initThemeFromStorage } from './shared/context/ThemeContext'
import { initBeranaStorage } from './shared/storage/initStorage'
import { ensureDemoLearningCourse } from './shared/storage/seedDemoCourse'
import './styles/globals.css'

initBeranaStorage()
ensureDemoLearningCourse()
initThemeFromStorage()

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)