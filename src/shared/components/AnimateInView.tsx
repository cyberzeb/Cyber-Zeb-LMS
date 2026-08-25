import type { CSSProperties, ElementType, ReactNode } from 'react'

import { useInViewAnimation } from '../hooks/useInViewAnimation'

interface AnimateInViewProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: ElementType
  style?: CSSProperties
}

export function AnimateInView({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
  style,
}: AnimateInViewProps) {
  const { ref, visible } = useInViewAnimation<HTMLElement>()

  return (
    <Tag
      ref={ref}
      className={`marketing-reveal ${visible ? 'marketing-reveal-visible' : ''} ${className}`}
      style={{ ...style, animationDelay: `${delay}s` }}
    >
      {children}
    </Tag>
  )
}
