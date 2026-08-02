import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react'

type ToastTone = 'success' | 'info' | 'error'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, { accent: string; color: string; icon: ReactNode }> = {
  success: {
    accent: 'border-l-lemon-500',
    color: 'text-lemon-700',
    icon: <CheckCircle2 size={18} />,
  },
  info: { accent: 'border-l-info', color: 'text-info', icon: <Info size={18} /> },
  error: {
    accent: 'border-l-danger',
    color: 'text-danger',
    icon: <AlertTriangle size={18} />,
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 w-[320px] max-w-[calc(100vw-2.5rem)]">
        {toasts.map((toast) => {
          const style = toneStyles[toast.tone]
          return (
            <div
              key={toast.id}
              className={`animate-fade-in-up flex items-start gap-3 bg-white/95 backdrop-blur-md border border-white/70 border-l-4 ${style.accent} rounded-xl shadow-[0_12px_32px_-8px_rgba(27,35,64,0.25)] px-4 py-3`}
            >
              <span className={`mt-0.5 shrink-0 ${style.color}`}>{style.icon}</span>
              <p className="text-[13px] font-medium text-navy-900 leading-snug">{toast.message}</p>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
