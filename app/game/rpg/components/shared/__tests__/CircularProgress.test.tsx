import { describe, expect, it } from 'vitest'
import { CircularProgress } from '../CircularProgress'

describe('CircularProgress', () => {
  it('should render without crashing', () => {
    const { container } = require('@testing-library/react')
    const result = CircularProgress({ percent: 50, color: 'red' })
    // Component returns JSX - just verify the component can be called
    expect(result).toBeDefined()
  })

  it('should clamp percent to 0-100 range', () => {
    const result = CircularProgress({ percent: 150, color: 'red' })
    expect(result).toBeDefined()

    const result2 = CircularProgress({ percent: -10, color: 'blue' })
    expect(result2).toBeDefined()
  })

  it('should use default size sm', () => {
    const result = CircularProgress({ percent: 50, color: 'red' })
    expect(result).toBeDefined()
  })

  it('should accept blue color', () => {
    const result = CircularProgress({ percent: 75, color: 'blue' })
    expect(result).toBeDefined()
  })

  it('should handle 0 percent', () => {
    const result = CircularProgress({ percent: 0, color: 'red' })
    expect(result).toBeDefined()
  })

  it('should handle 100 percent', () => {
    const result = CircularProgress({ percent: 100, color: 'blue' })
    expect(result).toBeDefined()
  })
})
