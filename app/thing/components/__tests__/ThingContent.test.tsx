import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ThingContent from '../ThingContent'

vi.mock('@/components/ui/pagination', () => ({
  Pagination: ({ children }: any) => <div data-testid="pagination">{children}</div>,
  PaginationContent: ({ children }: any) => <div>{children}</div>,
  PaginationItem: ({ children }: any) => <div>{children}</div>,
  PaginationLink: ({ children, isActive, onClick }: any) => (
    <button data-active={String(isActive)} onClick={onClick}>
      {children}
    </button>
  ),
  PaginationNext: ({ onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      Next
    </button>
  ),
  PaginationPrevious: ({ onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      Previous
    </button>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

const mockItems = [
  {
    id: 1,
    name: 'Item 1',
    status: 'active',
    images: [],
    primary_image: null,
    category: { name: 'Cat1' },
    tags: [],
    spot: null,
  },
]

describe('ThingContent', () => {
  const defaultProps = {
    items: mockItems,
    loading: false,
    error: null,
    meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
    currentPage: 1,
    searchTerm: '',
    hasActiveFilters: false,
    viewMode: 'list' as 'list' | 'gallery',
    onPageChange: vi.fn(),
    onItemEdit: vi.fn(),
    onItemView: vi.fn(),
    onReload: vi.fn(),
    onClearFilters: vi.fn(),
  }

  it('renders loading skeletons when loading', () => {
    const { container } = render(<ThingContent {...defaultProps} loading items={[]} meta={null} />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders error state', () => {
    render(<ThingContent {...defaultProps} error="Failed to load" items={[]} meta={null} />)
    expect(screen.getByText('加载失败')).toBeDefined()
  })

  it('renders empty state when no items', () => {
    render(
      <ThingContent
        {...defaultProps}
        items={[]}
        meta={{ current_page: 1, last_page: 1, per_page: 10, total: 0 }}
      />
    )
    expect(screen.getByText('暂无物品')).toBeDefined()
  })

  it('renders items in list view', () => {
    render(<ThingContent {...defaultProps} items={mockItems} />)
    expect(screen.getByText('Item 1')).toBeDefined()
  })

  it('calls onItemView when item clicked', () => {
    const onItemView = vi.fn()
    render(<ThingContent {...defaultProps} items={mockItems} onItemView={onItemView} />)
    fireEvent.click(screen.getByText('Item 1'))
    expect(onItemView).toHaveBeenCalledWith(1)
  })
})
