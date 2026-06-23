import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteLinkActionPanel from '../NoteLinkActionPanel'

// Mock deleteLink
const mockDeleteLink = vi.fn()
vi.mock('@/lib/api/wiki', () => ({
  deleteLink: (...args: unknown[]) => mockDeleteLink(...args),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('NoteLinkActionPanel', () => {
  const createThemeColors = () => ({
    background: '#ffffff',
    foreground: '#111827',
    card: '#ffffff',
    cardForeground: '#111827',
    mutedForeground: '#64748b',
    border: '#e5e7eb',
    primary: '#2563eb',
    ring: '#60a5fa',
    accent: '#38bdf8',
  })

  const defaultProps = {
    activeLink: { id: 1, source: '1', target: '2', type: 'related' },
    nodes: [
      { id: '1', title: 'Source Node', slug: 'source', tags: [], summary: '' },
      { id: '2', title: 'Target Node', slug: 'target', tags: [], summary: '' },
    ],
    themeColors: createThemeColors(),
    isAdmin: true,
    onLinkDeleted: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
    mockDeleteLink.mockResolvedValue({})
  })

  it('should render nothing when activeLink is null', () => {
    const { container } = render(<NoteLinkActionPanel {...defaultProps} activeLink={null} />)

    expect(container.firstChild).toBeNull()
  })

  it('should render nothing when source or target node is missing', () => {
    const { container } = render(
      <NoteLinkActionPanel
        {...defaultProps}
        nodes={[{ id: '1', title: 'Only Node', slug: 'only', tags: [], summary: '' }]}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should display link info with source and target', () => {
    render(<NoteLinkActionPanel {...defaultProps} />)

    expect(screen.getByText('Source Node → Target Node')).toBeInTheDocument()
  })

  it('should display link type when present', () => {
    render(<NoteLinkActionPanel {...defaultProps} />)

    expect(screen.getByText('类型: related')).toBeInTheDocument()
  })

  it('should not display link type when absent', () => {
    const linkWithoutType = { id: 1, source: '1', target: '2' }
    render(<NoteLinkActionPanel {...defaultProps} activeLink={linkWithoutType} />)

    expect(screen.queryByText(/类型:/)).not.toBeInTheDocument()
  })

  it('should render close button', () => {
    render(<NoteLinkActionPanel {...defaultProps} />)

    expect(screen.getByTitle('关闭')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<NoteLinkActionPanel {...defaultProps} onClose={onClose} />)

    const closeButton = screen.getByTitle('关闭')
    await userEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should render delete button when isAdmin is true', () => {
    render(<NoteLinkActionPanel {...defaultProps} isAdmin={true} />)

    expect(screen.getByText('取消关联')).toBeInTheDocument()
  })

  it('should not render delete button when isAdmin is false', () => {
    render(<NoteLinkActionPanel {...defaultProps} isAdmin={false} />)

    expect(screen.queryByText('取消关联')).not.toBeInTheDocument()
  })

  it('should call onLinkDeleted and onClose after successful delete', async () => {
    const onLinkDeleted = vi.fn()
    const onClose = vi.fn()
    render(
      <NoteLinkActionPanel {...defaultProps} onLinkDeleted={onLinkDeleted} onClose={onClose} />
    )

    const deleteButton = screen.getByText('取消关联')
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockDeleteLink).toHaveBeenCalledWith(1)
      expect(onLinkDeleted).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('should show deleting state', async () => {
    let resolveDelete: (value: {}) => void
    const deletePromise = new Promise(resolve => {
      resolveDelete = resolve
    })
    mockDeleteLink.mockReturnValue(deletePromise)

    render(<NoteLinkActionPanel {...defaultProps} />)

    const deleteButton = screen.getByText('取消关联')
    await userEvent.click(deleteButton)

    expect(screen.getByText('删除中...')).toBeInTheDocument()

    await act(async () => {
      resolveDelete!({})
    })
  })

  it('should not delete when user cancels confirm', async () => {
    window.confirm = vi.fn(() => false)
    const onLinkDeleted = vi.fn()
    render(<NoteLinkActionPanel {...defaultProps} onLinkDeleted={onLinkDeleted} />)

    const deleteButton = screen.getByText('取消关联')
    await userEvent.click(deleteButton)

    expect(mockDeleteLink).not.toHaveBeenCalled()
    expect(onLinkDeleted).not.toHaveBeenCalled()
  })
})
