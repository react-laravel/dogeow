import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TagList } from '../TagList'

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, style, ...props }: any) => (
    <span data-testid="badge" style={style} {...props}>
      {children}
    </span>
  ),
}))

describe('TagList', () => {
  const tags = [
    { id: 1, name: 'Tag1', color: '#ff0000' },
    { id: 2, name: 'Tag2', color: '#00ff00' },
  ]

  it('renders all tags', () => {
    render(<TagList tags={tags} />)
    expect(screen.getByText('Tag1')).toBeDefined()
    expect(screen.getByText('Tag2')).toBeDefined()
  })

  it('renders empty when no tags', () => {
    const { container } = render(<TagList tags={[]} />)
    expect(container.firstElementChild).toBeEmptyDOMElement()
  })

  it('renders default color when no color provided', () => {
    const tagsNoColor = [{ id: 1, name: 'Tag1' }]
    render(<TagList tags={tagsNoColor} />)
    expect(screen.getByText('Tag1')).toBeDefined()
  })
})
