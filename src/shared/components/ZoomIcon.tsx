interface ZoomIconProps {
  size?: number
  className?: string
}

export function ZoomIcon({ size = 17, className = '' }: ZoomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <rect width="24" height="24" rx="5" fill="#2D8CFF" />
      <path
        fill="#fff"
        d="M7.5 8.25A1.75 1.75 0 0 1 9.25 6.5h5.5A1.75 1.75 0 0 1 16.5 8.25v4.1l2.35-1.47A.85.85 0 0 1 20 11.72v4.03a.85.85 0 0 1-1.15.84L16.5 15.12v.63A1.75 1.75 0 0 1 14.75 17.5h-5.5A1.75 1.75 0 0 1 7.5 15.75V8.25Z"
      />
    </svg>
  )
}
