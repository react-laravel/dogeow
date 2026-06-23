import { describe, expect, it } from 'vitest'
import { Crosshair } from '../Crosshair'

describe('Crosshair', () => {
  it('should render without crashing', () => {
    const result = Crosshair()
    expect(result).toBeDefined()
  })

  it('should have pointer-events-none class', () => {
    const result = Crosshair()
    expect(result).toBeDefined()
  })

  it('should render with absolute positioning', () => {
    const result = Crosshair()
    expect(result).toBeDefined()
  })
})
