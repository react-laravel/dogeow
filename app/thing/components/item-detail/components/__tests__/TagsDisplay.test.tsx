import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TagsDisplay } from '../TagsDisplay'

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, style, ...props }: any) => (
    <span data-testid="badge" style={style} {...props}>
      {children}
    </span>
  ),
}))

describe('TagsDisplay', () => {
  const tags = [
    { id: 1, name: 'Tag1', color: '#ff0000' },
    { id: 2, name: 'Tag2', color: '#00ff00' },
  ]

  it('renders all tags', () => {
    render(<TagsDisplay tags={tags} />)
    expect(screen.getByText('Tag1')).toBeDefined()
    expect(screen.getByText('Tag2')).toBeDefined()
  })

  it('returns null when no tags', () => {
    const { container } = render(<TagsDisplay tags={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when tags is undefined', () => {
    const { container } = render(<TagsDisplay tags={undefined as any} />)
    expect(container.innerHTML).toBe('')
  })
})
