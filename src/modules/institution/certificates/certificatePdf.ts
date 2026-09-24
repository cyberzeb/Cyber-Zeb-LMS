import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { CertificateArt } from './CertificateArt'
import { PAGE_SIZE, type CertificateData, type CertificateTemplateDesign } from './templateModel'

/** Rasterise the certificate SVG at print resolution. */
async function svgToPng(svg: string, width: number, height: number, scale: number): Promise<string> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Could not render the certificate design.'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

function fileSafe(text: string): string {
  return text.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

/** Build the certificate as an A4 PDF and download it. */
export async function downloadCertificatePdf(
  template: CertificateTemplateDesign,
  data: CertificateData,
): Promise<void> {
  const { width, height } = PAGE_SIZE[template.orientation]
  const svg = renderToStaticMarkup(createElement(CertificateArt, { template, data, uid: 'pdf' }))
  const png = await svgToPng(svg, width, height, 2.5)

  const { jsPDF } = await import('jspdf')
  const landscape = template.orientation === 'landscape'
  const pdf = new jsPDF({ orientation: template.orientation, unit: 'mm', format: 'a4' })
  const pageW = landscape ? 297 : 210
  const pageH = landscape ? 210 : 297
  pdf.addImage(png, 'PNG', 0, 0, pageW, pageH, undefined, 'FAST')
  pdf.setProperties({
    title: `${data.certificateId} — ${data.studentName}`,
    subject: data.courseTitle,
    author: data.institutionName,
    creator: 'Berana LMS',
  })
  pdf.save(`${fileSafe(data.certificateId)}-${fileSafe(data.studentName)}.pdf`)
}
