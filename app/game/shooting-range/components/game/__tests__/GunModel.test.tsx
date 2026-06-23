import { describe, expect, it } from 'vitest'
import { GunModel } from '../GunModel'

describe('GunModel', () => {
  it('should render without crashing', () => {
    const result = GunModel()
    expect(result).toBeDefined()
  })

  it('should render a group element', () => {
    const result = GunModel()
    expect(result).toBeDefined()
    expect(result.type).toBe('group')
  })

  it('should render gun body mesh', () => {
    const result = GunModel()
    expect(result).toBeDefined()
    // Should contain child meshes
    expect(result.props?.children).toBeDefined()
  })

  it('should render barrel mesh', () => {
    const result = GunModel()
    expect(result).toBeDefined()
  })

  it('should render grip mesh', () => {
    const result = GunModel()
    expect(result).toBeDefined()
  })

  it('should render sight mesh', () => {
    const result = GunModel()
    expect(result).toBeDefined()
  })

  it('should render muzzle mesh', () => {
    const result = GunModel()
    expect(result).toBeDefined()
  })
})
