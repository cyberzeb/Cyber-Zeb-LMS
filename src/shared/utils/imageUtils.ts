/**
 * Images picked in the browser and stored with a record (course covers).
 *
 * A picked file must not be saved as `URL.createObjectURL(file)`: that
 * `blob:` link only works in the tab that made it, so the image is gone after a
 * reload and never reaches other users. Instead the file is scaled down and
 * stored as a small JPEG data URL inside the record.
 */

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024

/** False for links that cannot outlive the page that created them (old `blob:` covers). */
export function isPersistentImageUrl(url: string | undefined | null): url is string {
  if (!url) return false
  const value = url.trim()
  return value.startsWith('data:image/') || value.startsWith('https://') || value.startsWith('http://') || value.startsWith('/')
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('This file could not be read as an image.'))
    img.src = src
  })
}

/**
 * Scale an image file to cover `width`×`height` (centre crop) and return a JPEG
 * data URL. 800×450 at quality 0.82 is usually 30–80 KB.
 */
export async function imageFileToDataUrl(file: File, width = 800, height = 450, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (JPG, PNG or WebP).')
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) throw new Error('The image is larger than 5 MB.')

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
    const drawWidth = img.naturalWidth * scale
    const drawHeight = img.naturalHeight * scale
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Your browser could not process this image.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
