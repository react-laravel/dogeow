import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TagCard from '../TagCard'

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, style, ...props }: any) => (
    <span data-testid="badge" style={style} {...props}>
      {children}
    </span>
  ),
}))

describe('TagCard', () => {
  const defaultTag = { id: 1, name: 'Test Tag', color: '#3b82f6' }

  it('renders tag name', () => {
    render(<TagCard tag={defaultTag} />)
    expect(screen.getByText('Test Tag')).toBeDefined()
  })

  it('returns null when tag name is missing', () => {
    const { container } = render(<TagCard tag={{ id: 1 } as any} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders count when provided', () => {
    render(<TagCard tag={defaultTag} count={5} />)
    expect(screen.getByText('5')).toBeDefined()
  })

  it('renders delete button when onDelete provided', () => {
    render(<TagCard tag={defaultTag} onDelete={vi.fn()} />)
    expect(screen.getByLabelText('Delete tag')).toBeDefined()
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    render(<TagCard tag={defaultTag} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete tag'))
    expect(onDelete).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<TagCard tag={defaultTag} className="extra-class" />)
    expect(screen.getByTestId('card').className).toContain('extra-class')
  })
})
