import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusIndicator } from '../StatusIndicator'

describe('StatusIndicator', () => {
  it('renders active status with correct class', () => {
    const { container } = render(<StatusIndicator status="active" />)
    expect(container.firstChild?.className).toContain('bg-emerald-500')
  })

  it('renders inactive status with correct class', () => {
    const { container } = render(<StatusIndicator status="inactive" />)
    expect(container.firstChild?.className).toContain('bg-amber-500')
  })

  it('renders expired status with correct class', () => {
    const { container } = render(<StatusIndicator status="expired" />)
    expect(container.firstChild?.className).toContain('bg-red-500')
  })

  it('renders unknown status with muted class', () => {
    const { container } = render(<StatusIndicator status="unknown" />)
    expect(container.firstChild?.className).toContain('bg-muted-foreground')
  })

  it('has correct title for active', () => {
    render(<StatusIndicator status="active" />)
    expect(screen.getByTitle('使用中')).toBeDefined()
  })

  it('applies custom className', () => {
    const { container } = render(<StatusIndicator status="active" className="custom" />)
    expect(container.firstChild?.className).toContain('custom')
  })
})
