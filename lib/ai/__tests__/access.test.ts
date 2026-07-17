import { describe, expect, it } from 'vitest'
import { canUseAi } from '../access'

describe('canUseAi', () => {
  it('allows administrator user ID 1', () => {
    expect(canUseAi({ id: 1, is_admin: true })).toBe(true)
  })

  it('rejects other administrators', () => {
    expect(canUseAi({ id: 2, is_admin: true })).toBe(false)
  })

  it('rejects user ID 1 without administrator status', () => {
    expect(canUseAi({ id: 1, is_admin: false })).toBe(false)
  })

  it('rejects unauthenticated users', () => {
    expect(canUseAi(null)).toBe(false)
  })
})
