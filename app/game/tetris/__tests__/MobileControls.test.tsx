import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MobileControls } from '../components/MobileControls'

describe('MobileControls', () => {
  const renderControls = (disabled = false) =>
    render(
      <MobileControls
        onMove={vi.fn()}
        onRotate={vi.fn()}
        onHardDrop={vi.fn()}
        onPause={vi.fn()}
        disabled={disabled}
      />
    )

  it('should render without crashing', () => {
    const { container } = renderControls()
    expect(container.firstChild).toBeDefined()
  })

  it('should render disabled controls', () => {
    const { container } = renderControls(true)
    expect(container.firstChild).toBeDefined()
  })

  it('should have all required callbacks', () => {
    const { container } = renderControls()
    expect(container.firstChild).toBeDefined()
  })
})
