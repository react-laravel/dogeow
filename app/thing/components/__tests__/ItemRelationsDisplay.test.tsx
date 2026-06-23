import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ItemRelationsDisplay } from '../ItemRelationsDisplay'

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn().mockResolvedValue({ related_items: [], relating_items: [] }),
}))

vi.mock('../ItemRelationSelector', () => ({
  ItemRelationSelector: ({ open, onRelationAdded }: any) =>
    open ? (
      <div data-testid="relation-selector" onClick={onRelationAdded}>
        RelationSelector
      </div>
    ) : null,
}))

describe('ItemRelationsDisplay', () => {
  it('renders loading state initially', () => {
    render(<ItemRelationsDisplay itemId={1} />)
    // Loading state should show
    expect(screen.queryByText('关联物品')).toBeDefined()
  })

  it('renders add button when canEdit is true', async () => {
    render(<ItemRelationsDisplay itemId={1} canEdit />)
    await waitFor(() => {
      expect(screen.getByText('添加关联')).toBeDefined()
    })
  })

  it('renders section title', async () => {
    render(<ItemRelationsDisplay itemId={1} />)
    await waitFor(() => {
      expect(screen.getByText('关联物品')).toBeDefined()
    })
  })
})
