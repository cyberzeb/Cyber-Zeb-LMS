/** Read an image file, shrink it to fit, and return a PNG data URL. */
export async function imageToDataUrl(file: File, maxW: number, maxH: number): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be smaller than 5 MB.')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('That image could not be read.'))
      image.src = url
    })
    const ratio = Math.min(1, maxW / img.width, maxH / img.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.width * ratio))
    canvas.height = Math.max(1, Math.round(img.height * ratio))
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
