import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NoteLoadingSkeleton from '../NoteLoadingSkeleton'

describe('NoteLoadingSkeleton', () => {
  it('should render 3 skeleton cards', () => {
    const { container } = render(<NoteLoadingSkeleton />)

    const cards = container.querySelectorAll('[role="status"] > div > div')
    // Each skeleton card has CardHeader and CardContent
    expect(cards.length).toBeGreaterThanOrEqual(3)
  })

  it('should have loading aria label', () => {
    render(<NoteLoadingSkeleton />)

    expect(screen.getByRole('status', { name: '加载中' })).toBeInTheDocument()
  })

  it('should render skeleton items with correct structure', () => {
    const { container } = render(<NoteLoadingSkeleton />)

    const statusElement = container.querySelector('[role="status"]')
    expect(statusElement).toBeTruthy()
  })

  it('should have animate-pulse class', () => {
    const { container } = render(<NoteLoadingSkeleton />)

    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeTruthy()
  })
})
