import { describe, expect, it } from 'vitest'

import { generateCertificateId } from '../../api/certificatesApi'
import { elementPivot, reflowForPage } from '../elementGeometry'
import { PRESET_TEMPLATES, mergeWithPresets, normalizeTemplate, resolveTemplate } from '../presets'
import { PAGE_SIZE, makeText, resolveText, sampleCertificateData } from '../templateModel'
import type { CertificateRecord } from '../../types'

describe('certificate IDs', () => {
  it('are random, readable and unique', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 500; i++) ids.add(generateCertificateId([]))
    expect(ids.size).toBe(500)
    for (const id of ids) {
      expect(id).toMatch(/^BER-CERT-\d{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/)
    }
  })

  it('never reuses an existing ID', () => {
    const existing = [{ certificateId: generateCertificateId([]) }] as CertificateRecord[]
    expect(generateCertificateId(existing)).not.toBe(existing[0].certificateId)
  })
})

describe('placeholders', () => {
  const data = { ...sampleCertificateData('Test University'), expirationDate: undefined }

  it('fills known fields and leaves unknown ones', () => {
    expect(resolveText('{{student_name}} — {{course_code}} {{nope}}', data).text).toBe(
      'Selam Girma — CS-101 {{nope}}',
    )
  })

  it('reports a blank field so an element can hide itself', () => {
    expect(resolveText('Valid until {{expiration_date}}', data).blank).toBe(true)
    expect(resolveText('Issued {{issue_date}}', data).blank).toBe(false)
  })
})

describe('templates', () => {
  it('opens a template saved in the first format as editable elements', () => {
    const legacy = {
      id: 'old-1',
      name: 'Old design',
      orientation: 'landscape',
      align: 'center',
      seal: 'star',
      sealText: 'HONOURS',
      text: { eyebrow: '', title: 'Hello', subtitle: '', preamble: '', body: 'Body', footer: '' },
      signatories: [{ id: 's', name: 'Dean', title: 'Dean' }],
      show: { qr: true, certificateId: true, issueDate: true, expiration: false },
    }
    const t = normalizeTemplate(legacy)
    expect(t.version).toBe(2)
    expect(t.name).toBe('Old design')
    const types = t.elements.map((e) => e.type)
    expect(types).toEqual(expect.arrayContaining(['text', 'signature', 'seal', 'qr']))
    expect(t.elements.find((e) => e.type === 'text' && e.name === 'Title')).toMatchObject({ text: 'Hello' })
  })

  it('keeps one default and falls back to it', () => {
    const custom = { ...PRESET_TEMPLATES[1], id: 'mine', isDefault: true }
    const merged = mergeWithPresets([custom])
    expect(merged.filter((t) => t.isDefault).map((t) => t.id)).toEqual(['mine'])
    expect(resolveTemplate(merged, 'missing').id).toBe('mine')
    expect(resolveTemplate(merged, 'tpl-royal').id).toBe('tpl-royal')
  })

  it('switching orientation and back restores every element', () => {
    const el = makeText({ x: 300, y: 200, fontSize: 40, width: 500 })
    const L = PAGE_SIZE.landscape
    const P = PAGE_SIZE.portrait
    const there = reflowForPage(el, P.width / L.width, P.height / L.height)
    const back = reflowForPage(there, L.width / P.width, L.height / P.height)
    expect(back.type === 'text' && back.fontSize).toBeCloseTo(40, 0)
    expect(elementPivot(back).x).toBeCloseTo(elementPivot(el).x, 0)
    expect(elementPivot(back).y).toBeCloseTo(elementPivot(el).y, 0)
  })
})
