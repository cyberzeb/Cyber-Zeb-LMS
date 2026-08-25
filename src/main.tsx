import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './app/AppRouter'
import { ToastProvider } from './shared/components/toast/ToastProvider'
import { ThemeProvider } from './shared/theme/ThemeProvider'
import { LanguageProvider } from './shared/i18n/LanguageProvider'
import { AppBootstrap } from './shared/providers/AppBootstrap'
import './styles/globals.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBootstrap>
        <ToastProvider>
          <ThemeProvider>
            <LanguageProvider>
              <RouterProvider router={router} />
            </LanguageProvider>
          </ThemeProvider>
        </ToastProvider>
      </AppBootstrap>
    </QueryClientProvider>
  </StrictMode>,
)
