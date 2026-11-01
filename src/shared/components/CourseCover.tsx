import { useState } from 'react'
import { isPersistentImageUrl } from '../utils/imageUtils'

interface CourseCoverProps {
  title: string
  code?: string
  thumbnailUrl?: string
  className?: string
}

/**
 * 16:9 course cover for cards. Shows the uploaded image, or a branded banner
 * with the course code when there is none (or it fails to load).
 */
export function CourseCover({ title, code, thumbnailUrl, className = '' }: CourseCoverProps) {
  const [failed, setFailed] = useState(false)
  const showImage = isPersistentImageUrl(thumbnailUrl) && !failed

  return (
    <div className={`relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-navy-700 to-navy-900 ${className}`}>
      {showImage ? (
        <img
          src={thumbnailUrl}
          alt={`${title} cover`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-lemon-500/20 blur-2xl" />
          {code ? (
            <span className="relative text-[11px] font-bold uppercase tracking-wider text-lemon-500">{code}</span>
          ) : null}
          <span className="relative text-[15px] font-extrabold text-white leading-tight line-clamp-2">{title}</span>
        </div>
      )}
    </div>
  )
}
