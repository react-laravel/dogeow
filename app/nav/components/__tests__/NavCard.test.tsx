import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { NavCard } from '../NavCard'

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />
  },
}))

// Mock useNavStore
const mockRecordClick = vi.fn()
const mockDeleteItem = vi.fn()

vi.mock('@/app/nav/stores/navStore', () => ({
  useNavStore: () => ({
    recordClick: mockRecordClick,
    deleteItem: mockDeleteItem,
  }),
}))

const makeItem = (overrides = {}) => ({
  id: 1,
  nav_category_id: 1,
  name: 'Test Item',
  url: 'https://example.com',
  icon: null,
  description: 'Test description',
  sort_order: 1,
  is_visible: true,
  is_new_window: false,
  clicks: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  ...overrides,
})

describe('NavCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render item name', () => {
    render(<NavCard item={makeItem({ name: 'Google' })} />)
    expect(screen.getByText('Google')).toBeInTheDocument()
  })

  it('should render item description', () => {
    render(<NavCard item={makeItem({ description: 'Search engine' })} />)
    expect(screen.getByText('Search engine')).toBeInTheDocument()
  })

  it('should render item URL when no description', () => {
    render(<NavCard item={makeItem({ description: null })} />)
    expect(screen.getByText('https://example.com')).toBeInTheDocument()
  })

  it('should render link with correct href', () => {
    render(<NavCard item={makeItem({ url: 'https://test.com' })} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://test.com')
  })

  it('should set target=_blank when is_new_window is true', () => {
    render(<NavCard item={makeItem({ is_new_window: true })} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('should set target=_self when is_new_window is false', () => {
    render(<NavCard item={makeItem({ is_new_window: false })} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_self')
  })

  it('should call recordClick on link click', async () => {
    const user = userEvent.setup()
    mockRecordClick.mockResolvedValue(undefined)
    render(<NavCard item={makeItem()} />)

    const link = screen.getByRole('link')
    await user.click(link)

    expect(mockRecordClick).toHaveBeenCalledWith(1)
  })

  it('should highlight matching text with <mark>', () => {
    render(<NavCard item={makeItem({ name: 'Google Search' })} highlight="google" />)
    const mark = screen.getByText('Google')
    expect(mark.tagName).toBe('MARK')
  })

  it('should be case-insensitive for highlight', () => {
    render(<NavCard item={makeItem({ name: 'GitHub' })} highlight="GITHUB" />)
    const mark = screen.getByText('GitHub')
    expect(mark.tagName).toBe('MARK')
  })

  it('should not add mark elements when no highlight', () => {
    const { container } = render(<NavCard item={makeItem({ name: 'Google' })} />)
    expect(container.querySelector('mark')).toBeNull()
  })

  it('should render with icon image when provided', () => {
    const { container } = render(<NavCard item={makeItem({ icon: '/icon.png' })} />)
    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('should render item name with icon', () => {
    const { container } = render(<NavCard item={makeItem({ icon: '/icon.png' })} />)
    expect(screen.getByText('Test Item')).toBeInTheDocument()
  })
})
