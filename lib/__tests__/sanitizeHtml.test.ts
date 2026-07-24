import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from '../sanitizeHtml'

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    const dirty = '<p>ok</p><script>alert(1)</script>'
    expect(sanitizeHtml(dirty)).not.toContain('<script')
    expect(sanitizeHtml(dirty)).toContain('ok')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('')
  })
})
