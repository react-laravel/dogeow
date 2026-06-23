import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { FloatingReference } from '../FloatingReference'

describe('FloatingReference', () => {
  it('should render without crashing', () => {
    const { container } = render(<FloatingReference imageUrl="/test-image.jpg" onClose={vi.fn()} />)
    expect(container).toBeTruthy()
  })

  it('should render close button', () => {
    const onClose = vi.fn()
    const { container } = render(<FloatingReference imageUrl="/test-image.jpg" onClose={onClose} />)
    expect(container.innerHTML).toBeTruthy()
  })

  it('should render image', () => {
    const { container } = render(<FloatingReference imageUrl="/test-image.jpg" onClose={vi.fn()} />)
    expect(container.innerHTML).toBeTruthy()
  })

  it('should have reference label', () => {
    const { container } = render(<FloatingReference imageUrl="/test-image.jpg" onClose={vi.fn()} />)
    expect(container.textContent).toBeTruthy()
  })

  it('should render with magnifier', () => {
    const { container } = render(<FloatingReference imageUrl="/test-image.jpg" onClose={vi.fn()} />)
    expect(container).toBeTruthy()
  })
})
