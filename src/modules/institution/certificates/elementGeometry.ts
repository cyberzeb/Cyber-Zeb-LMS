/** Geometry for certificate elements: pivots, moving, resizing. */
import type { CertElement } from './templateModel'

/** Point an element rotates around (its visual centre, roughly). */
export function elementPivot(el: CertElement): { x: number; y: number } {
  switch (el.type) {
    case 'image':
    case 'box':
      return { x: el.x + el.w / 2, y: el.y + el.h / 2 }
    case 'qr':
      return { x: el.x + el.size / 2, y: el.y + el.size / 2 }
    case 'line':
      return { x: el.x + el.width / 2, y: el.y }
    case 'text':
      return { x: el.x, y: el.y - el.fontSize / 3 }
    default:
      return { x: el.x, y: el.y }
  }
}

export function rotationTransform(el: CertElement): string | undefined {
  if (!el.rotation) return undefined
  const p = elementPivot(el)
  return `rotate(${el.rotation} ${p.x} ${p.y})`
}

const round = (n: number) => Math.round(n * 10) / 10

/** Scale an element's size by `s` (corner handle). */
export function scaleElement(el: CertElement, s: number): CertElement {
  const k = Math.max(0.05, s)
  switch (el.type) {
    case 'text':
      return { ...el, fontSize: round(Math.max(6, el.fontSize * k)), width: round(Math.max(40, el.width * k)) }
    case 'image':
      return { ...el, w: round(Math.max(12, el.w * k)), h: round(Math.max(12, el.h * k)), radius: round(el.radius * k) }
    case 'box':
      return { ...el, w: round(Math.max(8, el.w * k)), h: round(Math.max(8, el.h * k)) }
    case 'qr':
      return { ...el, size: round(Math.max(40, el.size * k)) }
    case 'seal':
      return { ...el, r: round(Math.max(14, el.r * k)) }
    case 'signature':
      return { ...el, width: round(Math.max(60, el.width * k)) }
    case 'line':
      return { ...el, width: round(Math.max(10, el.width * k)) }
  }
}

/** Elements that can be stretched horizontally (right-edge handle). */
export function hasWidth(el: CertElement): boolean {
  return el.type === 'text' || el.type === 'box' || el.type === 'line' || el.type === 'signature' || el.type === 'image'
}

/** Change the width by `dx` page units (right-edge handle). */
export function widenElement(el: CertElement, dx: number): CertElement {
  switch (el.type) {
    case 'text': {
      // Centred text grows both ways, right-aligned grows to the left.
      const factor = el.align === 'middle' ? 2 : el.align === 'end' ? -1 : 1
      return { ...el, width: round(Math.max(40, el.width + dx * factor)) }
    }
    case 'box':
    case 'image':
      return { ...el, w: round(Math.max(8, el.w + dx)) }
    case 'line':
      return { ...el, width: round(Math.max(10, el.width + dx)) }
    case 'signature':
      return { ...el, width: round(Math.max(60, el.width + dx * 2)) }
    default:
      return el
  }
}

/** Elements with an independent height (bottom-edge handle). */
export function hasHeight(el: CertElement): boolean {
  return el.type === 'box' || el.type === 'image'
}

export function heightenElement(el: CertElement, dy: number): CertElement {
  if (el.type === 'box' || el.type === 'image') return { ...el, h: round(Math.max(8, el.h + dy)) }
  return el
}

export function moveElement(el: CertElement, dx: number, dy: number): CertElement {
  return { ...el, x: round(el.x + dx), y: round(el.y + dy) }
}

/**
 * Move and resize an element when the page changes orientation. Sizes follow the
 * width ratio, so switching back restores them exactly.
 */
export function reflowForPage(el: CertElement, sx: number, sy: number): CertElement {
  const s = sx
  const scaled = scaleElement(el, s)
  const pivotBefore = elementPivot(el)
  const pivotAfter = elementPivot(scaled)
  // Keep each element's centre at the same relative spot on the new page.
  return moveElement(scaled, pivotBefore.x * sx - pivotAfter.x, pivotBefore.y * sy - pivotAfter.y)
}
