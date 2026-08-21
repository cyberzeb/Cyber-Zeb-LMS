import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

type ModalSize = 'md' | 'lg' | 'xl'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  icon?: ReactNode
  size?: ModalSize
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

const sizeClasses: Record<ModalSize, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  title,
  description,
  icon,
  size = 'md',
  onClose,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    // Blur only the main content layer (sidebar stays sharp), lock scroll.
    const content = document.querySelector('.page-content')
    content?.classList.add('page-blur')
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      content?.classList.remove('page-blur')
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  // Rendered via a portal so the dialog itself stays sharp above the blurred page.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[7vh] pb-6">
      {/* Transparent click-catcher — the blur lives on the page layer, not here */}
      <div onClick={onClose} className="absolute inset-0" />

      <div className={`animate-modal-in relative z-10 w-full ${sizeClasses[size]} max-h-[86vh] flex flex-col sdm-modal-surface bg-white rounded-2xl border border-white/80 ring-1 ring-navy-900/5 shadow-[0_24px_70px_-12px_rgba(27,35,64,0.45),0_8px_24px_-8px_rgba(27,35,64,0.25)] overflow-hidden`}>
        {/* Gradient accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-lemon-500 via-lemon-500 to-navy-900 shrink-0" />

        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-4 border-b border-divider/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lemon-50 to-lemon-200 ring-1 ring-lemon-500/20 text-lemon-900 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-[16px] font-extrabold text-navy-900 leading-tight truncate">
                {title}
              </h2>
              {description && (
                <p className="text-[12px] text-secondary-text mt-0.5 leading-snug">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary-text hover:text-navy-900 hover:bg-navy-50 w-8 h-8 rounded-lg text-xl leading-none cursor-pointer transition-colors shrink-0"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-3.5 overflow-y-auto app-scroll">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-divider/60 bg-navy-50/40 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
