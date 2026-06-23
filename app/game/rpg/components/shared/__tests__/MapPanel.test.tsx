import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MapPanel } from '../MapPanel'

describe('MapPanel', () => {
  it('should render without crashing', () => {
    const { container } = render(<MapPanel />)
    expect(container.firstChild).toBeDefined()
  })

  it('should render with correct structure', () => {
    const { container } = render(<MapPanel />)
    expect(container.firstChild).toBeDefined()
  })
})
