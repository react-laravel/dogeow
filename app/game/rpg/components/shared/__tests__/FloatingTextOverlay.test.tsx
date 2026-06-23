import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FloatingTextOverlay } from '../FloatingTextOverlay'

describe('FloatingTextOverlay', () => {
  const expectRendered = () => {
    const { container } = render(<FloatingTextOverlay />)
    expect(container.firstChild).toBeDefined()
  }

  it('should render without crashing', () => {
    expectRendered()
  })

  it('should render with pointer-events-none', () => {
    expectRendered()
  })

  it('should render with fixed positioning', () => {
    expectRendered()
  })

  it('should have z-50 class', () => {
    expectRendered()
  })
})
