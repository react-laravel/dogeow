import { describe, expect, it } from 'vitest'
import { statusMap } from '../status'

describe('statusMap', () => {
  it('contains exactly the three expected statuses', () => {
    expect(Object.keys(statusMap)).toEqual(['active', 'inactive', 'expired'])
  })

  it('has correct label and variant for active', () => {
    expect(statusMap.active).toEqual({
      label: '使用中',
      variant: 'bg-green-500',
    })
  })

  it('has correct label and variant for inactive', () => {
    expect(statusMap.inactive).toEqual({
      label: '闲置',
      variant: 'outline',
    })
  })

  it('has correct label and variant for expired', () => {
    expect(statusMap.expired).toEqual({
      label: '已过期',
      variant: 'destructive',
    })
  })

  it('ThingStatus type covers all keys', () => {
    // Runtime check that each key is a valid status string
    const keys: string[] = Object.keys(statusMap)
    expect(keys).toContain('active')
    expect(keys).toContain('inactive')
    expect(keys).toContain('expired')
  })
})
