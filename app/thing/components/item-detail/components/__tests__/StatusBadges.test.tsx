import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadges } from '../StatusBadges'

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
}))

describe('StatusBadges', () => {
  it('renders category name', () => {
    render(<StatusBadges item={{ category: { name: 'Electronics' } } as any} />)
    expect(screen.getByText('Electronics')).toBeDefined()
  })

  it('renders Uncategorized when no category', () => {
    render(<StatusBadges item={{ category: null } as any} />)
    expect(screen.getByText('未分类')).toBeDefined()
  })
})
