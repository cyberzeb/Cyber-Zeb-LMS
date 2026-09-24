/**
 * The interactive page: click to select, drag to move (with snap guides), and
 * handles to resize, stretch and rotate. Rendering is the same `ElementView` the
 * PDF uses, so the canvas is exactly what gets printed.
 */
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { ElementView, PageBackground } from '../CertificateArt'
import {
  elementPivot,
  hasHeight,
  hasWidth,
  heightenElement,
  moveElement,
  scaleElement,
  widenElement,
} from '../elementGeometry'
import { PAGE_SIZE, type CertElement, type CertificateData, type CertificateTemplateDesign } from '../templateModel'

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

type Mode = 'move' | 'scale' | 'width' | 'height' | 'rotate'

interface Drag {
  mode: Mode
  id: string
  start: { x: number; y: number }
  orig: CertElement
  box: Box
  moved: boolean
}

interface Guide {
  axis: 'x' | 'y'
  at: number
}

interface Props {
  design: CertificateTemplateDesign
  data: CertificateData
  selectedId: string | null
  /** Hide selection chrome for a clean preview. */
  preview: boolean
  onSelect: (id: string | null) => void
  /** Called once when a drag begins, so undo restores the state before it. */
  onSnapshot: () => void
  /** Live updates while dragging (not recorded individually in history). */
  onElementChange: (el: CertElement) => void
  onEditText: (id: string) => void
  /** Rendered bounds of every element, for page alignment. */
  onMeasure?: (boxes: Record<string, Box>) => void
}

const SNAP = 6

function rotatePoint(dx: number, dy: number, deg: number) {
  const r = (-deg * Math.PI) / 180
  return { x: dx * Math.cos(r) - dy * Math.sin(r), y: dx * Math.sin(r) + dy * Math.cos(r) }
}

/** A visible stand-in box for elements that currently draw nothing. */
function fallbackBox(el: CertElement): Box {
  return { x: el.x - 60, y: el.y - 20, w: 120, h: 26 }
}

export function DesignerCanvas({
  design,
  data,
  selectedId,
  preview,
  onSelect,
  onSnapshot,
  onElementChange,
  onEditText,
  onMeasure,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [boxes, setBoxes] = useState<Record<string, Box>>({})
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [guides, setGuides] = useState<Guide[]>([])
  const drag = useRef<Drag | null>(null)
  const { width: W, height: H } = PAGE_SIZE[design.orientation]
  const [pixelWidth, setPixelWidth] = useState<number>(W)
  /** Page units per screen pixel, so handles stay the same size at any zoom. */
  const u = W / Math.max(1, pixelWidth)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const observer = new ResizeObserver(([entry]) => setPixelWidth(entry.contentRect.width))
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  // Measure the real rendered size of each element after every change.
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const next: Record<string, Box> = {}
    svg.querySelectorAll<SVGGElement>('[data-el]').forEach((g) => {
      const id = g.dataset.el
      if (!id) return
      try {
        const b = g.getBBox()
        if (b.width > 0 || b.height > 0) next[id] = { x: b.x, y: b.y, w: b.width, h: b.height }
      } catch {
        /* not rendered */
      }
    })
    setBoxes((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    onMeasure?.(next)
  }, [design, onMeasure])

  function toPage(e: { clientX: number; clientY: number }) {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  function begin(e: ReactPointerEvent, el: CertElement, mode: Mode) {
    e.stopPropagation()
    onSelect(el.id)
    if (el.locked || e.button !== 0) return
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    drag.current = {
      mode,
      id: el.id,
      start: toPage(e),
      orig: el,
      box: boxes[el.id] ?? fallbackBox(el),
      moved: false,
    }
  }

  function snapMove(d: Drag, dx: number, dy: number) {
    const cx = d.box.x + d.box.w / 2 + dx
    const cy = d.box.y + d.box.h / 2 + dy
    const left = d.box.x + dx
    const right = d.box.x + d.box.w + dx
    const top = d.box.y + dy
    const bottom = d.box.y + d.box.h + dy
    const xs = [W / 2]
    const ys = [H / 2]
    for (const [id, b] of Object.entries(boxes)) {
      if (id === d.id) continue
      xs.push(b.x, b.x + b.w / 2, b.x + b.w)
      ys.push(b.y, b.y + b.h / 2, b.y + b.h)
    }
    const found: Guide[] = []
    let sx = dx
    let sy = dy
    let bestX = SNAP * u
    for (const target of xs) {
      for (const edge of [cx, left, right]) {
        const diff = target - edge
        if (Math.abs(diff) < bestX) {
          bestX = Math.abs(diff)
          sx = dx + diff
          found[0] = { axis: 'x', at: target }
        }
      }
    }
    let bestY = SNAP * u
    for (const target of ys) {
      for (const edge of [cy, top, bottom]) {
        const diff = target - edge
        if (Math.abs(diff) < bestY) {
          bestY = Math.abs(diff)
          sy = dy + diff
          found[1] = { axis: 'y', at: target }
        }
      }
    }
    setGuides(found.filter(Boolean))
    return { dx: sx, dy: sy }
  }

  function onPointerMove(e: ReactPointerEvent) {
    const d = drag.current
    if (!d) return
    const p = toPage(e)
    let dx = p.x - d.start.x
    let dy = p.y - d.start.y
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 2 * u) return
      d.moved = true
      onSnapshot()
    }
    const el = d.orig
    if (d.mode === 'move') {
      if (e.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) dy = 0
        else dx = 0
      }
      const snapped = e.altKey ? { dx, dy } : snapMove(d, dx, dy)
      onElementChange(moveElement(el, snapped.dx, snapped.dy))
      return
    }
    const local = rotatePoint(dx, dy, el.rotation ?? 0)
    if (d.mode === 'scale') {
      const s = Math.max((d.box.w + local.x) / Math.max(d.box.w, 1), (d.box.h + local.y) / Math.max(d.box.h, 1))
      onElementChange(scaleElement(el, s))
    } else if (d.mode === 'width') {
      onElementChange(widenElement(el, local.x))
    } else if (d.mode === 'height') {
      onElementChange(heightenElement(el, local.y))
    } else if (d.mode === 'rotate') {
      const pivot = elementPivot(el)
      let angle = (Math.atan2(p.y - pivot.y, p.x - pivot.x) * 180) / Math.PI + 90
      angle = ((angle + 540) % 360) - 180
      // Snap to 15° steps with Shift, and gently to right angles otherwise.
      if (e.shiftKey) angle = Math.round(angle / 15) * 15
      else {
        const nearest = Math.round(angle / 90) * 90
        if (Math.abs(angle - nearest) < 4) angle = nearest
      }
      onElementChange({ ...el, rotation: Math.round(angle) })
    }
  }

  function onPointerUp() {
    drag.current = null
    setGuides([])
  }

  const handle = 7 * u

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full select-none touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="application"
      aria-label="Certificate canvas"
    >
      <PageBackground template={design} uid="designer" />
      {/* Clicking empty paper clears the selection. */}
      <rect width={W} height={H} fill="transparent" onPointerDown={() => onSelect(null)} />

      {design.elements.map((el) => {
        if (el.hidden) return null
        const box = boxes[el.id] ?? fallbackBox(el)
        const selected = !preview && el.id === selectedId
        const hovered = !preview && !selected && el.id === hoverId
        return (
          <g
            key={el.id}
            onPointerDown={(e) => begin(e, el, 'move')}
            onPointerEnter={() => setHoverId(el.id)}
            onPointerLeave={() => setHoverId((h) => (h === el.id ? null : h))}
            onDoubleClick={() => onEditText(el.id)}
            style={{ cursor: preview ? 'default' : el.locked ? 'not-allowed' : 'move' }}
          >
            <ElementView el={el} colors={design.colors} data={data} uid="designer">
              {/* Invisible hit area so gaps between letters are still clickable. */}
              <rect x={box.x - 4 * u} y={box.y - 4 * u} width={box.w + 8 * u} height={box.h + 8 * u} fill="transparent" />
              {hovered ? (
                <rect x={box.x - 4 * u} y={box.y - 4 * u} width={box.w + 8 * u} height={box.h + 8 * u} fill="none" stroke="#A3CF3F" strokeWidth={1.2 * u} strokeDasharray={`${4 * u} ${3 * u}`} pointerEvents="none" />
              ) : null}
              {selected ? (
                <g>
                  <rect x={box.x - 5 * u} y={box.y - 5 * u} width={box.w + 10 * u} height={box.h + 10 * u} fill="rgba(163,207,63,0.06)" stroke="#A3CF3F" strokeWidth={1.6 * u} pointerEvents="none" />
                  {el.locked ? null : (
                    <>
                      {/* rotate */}
                      <line x1={box.x + box.w / 2} x2={box.x + box.w / 2} y1={box.y - 5 * u} y2={box.y - 26 * u} stroke="#A3CF3F" strokeWidth={1.4 * u} pointerEvents="none" />
                      <circle cx={box.x + box.w / 2} cy={box.y - 30 * u} r={handle * 0.8} fill="#FFFFFF" stroke="#A3CF3F" strokeWidth={1.6 * u} style={{ cursor: 'grab' }} onPointerDown={(e) => begin(e, el, 'rotate')}>
                        <title>Rotate (hold Shift for 15° steps)</title>
                      </circle>
                      {/* scale */}
                      <rect x={box.x + box.w + 5 * u - handle / 2} y={box.y + box.h + 5 * u - handle / 2} width={handle} height={handle} rx={1.5 * u} fill="#A3CF3F" stroke="#FFFFFF" strokeWidth={1.2 * u} style={{ cursor: 'nwse-resize' }} onPointerDown={(e) => begin(e, el, 'scale')}>
                        <title>Resize</title>
                      </rect>
                      {hasWidth(el) ? (
                        <rect x={box.x + box.w + 5 * u - handle / 2} y={box.y + box.h / 2 - handle} width={handle} height={handle * 2} rx={2 * u} fill="#FFFFFF" stroke="#A3CF3F" strokeWidth={1.4 * u} style={{ cursor: 'ew-resize' }} onPointerDown={(e) => begin(e, el, 'width')}>
                          <title>{el.type === 'text' ? 'Text box width' : 'Width'}</title>
                        </rect>
                      ) : null}
                      {hasHeight(el) ? (
                        <rect x={box.x + box.w / 2 - handle} y={box.y + box.h + 5 * u - handle / 2} width={handle * 2} height={handle} rx={2 * u} fill="#FFFFFF" stroke="#A3CF3F" strokeWidth={1.4 * u} style={{ cursor: 'ns-resize' }} onPointerDown={(e) => begin(e, el, 'height')}>
                          <title>Height</title>
                        </rect>
                      ) : null}
                    </>
                  )}
                </g>
              ) : null}
            </ElementView>
          </g>
        )
      })}

      {/* Text wrap width of the selected text, so its box is visible. */}
      {!preview && selectedId
        ? (() => {
            const el = design.elements.find((x) => x.id === selectedId)
            if (!el || el.type !== 'text' || el.hidden) return null
            const left = el.align === 'middle' ? el.x - el.width / 2 : el.align === 'end' ? el.x - el.width : el.x
            return (
              <g transform={el.rotation ? `rotate(${el.rotation} ${elementPivot(el).x} ${elementPivot(el).y})` : undefined} pointerEvents="none">
                <line x1={left} x2={left} y1={el.y - el.fontSize} y2={el.y + 4 * u} stroke="#A3CF3F" strokeWidth={u} strokeDasharray={`${3 * u} ${3 * u}`} />
                <line x1={left + el.width} x2={left + el.width} y1={el.y - el.fontSize} y2={el.y + 4 * u} stroke="#A3CF3F" strokeWidth={u} strokeDasharray={`${3 * u} ${3 * u}`} />
              </g>
            )
          })()
        : null}

      {guides.map((g, i) =>
        g.axis === 'x' ? (
          <line key={i} x1={g.at} x2={g.at} y1={0} y2={H} stroke="#E5484D" strokeWidth={u} pointerEvents="none" />
        ) : (
          <line key={i} x1={0} x2={W} y1={g.at} y2={g.at} stroke="#E5484D" strokeWidth={u} pointerEvents="none" />
        ),
      )}
    </svg>
  )
}
