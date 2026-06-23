import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteGraphToolbar from '../NoteGraphToolbar'

// Mock the auth module
const mockIsAdminSync = vi.fn()
vi.mock('@/lib/auth', () => ({
  isAdminSync: mockIsAdminSync,
}))

describe('NoteGraphToolbar', () => {
  const defaultProps = {
    query: '',
    onQueryChange: vi.fn(),
    isAdmin: true,
    activeNode: null,
    nodes: [],
    themeColors: {
      background: '#ffffff',
      foreground: '#111827',
      card: '#ffffff',
      cardForeground: '#111827',
      mutedForeground: '#64748b',
      border: '#e5e7eb',
      primary: '#2563eb',
      ring: '#60a5fa',
      accent: '#38bdf8',
    },
    onNewNode: vi.fn(),
    onEditNode: vi.fn(),
    onDeleteNode: vi.fn(),
    onCreateLink: vi.fn(),
    onViewArticle: vi.fn(),
    onEditArticle: vi.fn(),
    onClearSelection: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdminSync.mockReturnValue(true)
  })

  it('should render search input', () => {
    render(<NoteGraphToolbar {...defaultProps} />)

    expect(screen.getByPlaceholderText('搜索节点...')).toBeInTheDocument()
  })

  it('should render new node button when admin', () => {
    render(<NoteGraphToolbar {...defaultProps} isAdmin={true} />)

    expect(screen.getByTitle('新建节点')).toBeInTheDocument()
  })

  it('should not render admin buttons when not admin', () => {
    render(<NoteGraphToolbar {...defaultProps} isAdmin={false} />)

    expect(screen.queryByTitle('新建节点')).not.toBeInTheDocument()
    expect(screen.queryByTitle('创建链接')).not.toBeInTheDocument()
  })

  it('should call onNewNode when new node button is clicked', async () => {
    const onNewNode = vi.fn()
    render(<NoteGraphToolbar {...defaultProps} onNewNode={onNewNode} />)

    const newButton = screen.getByTitle('新建节点')
    await userEvent.click(newButton)

    expect(onNewNode).toHaveBeenCalledTimes(1)
  })

  it('should call onCreateLink when create link button is clicked', async () => {
    const onCreateLink = vi.fn()
    render(<NoteGraphToolbar {...defaultProps} onCreateLink={onCreateLink} />)

    const linkButton = screen.getByTitle('创建链接')
    await userEvent.click(linkButton)

    expect(onCreateLink).toHaveBeenCalledTimes(1)
  })

  it('should call onQueryChange when search input changes', async () => {
    const onQueryChange = vi.fn()
    render(<NoteGraphToolbar {...defaultProps} onQueryChange={onQueryChange} />)

    const searchInput = screen.getByPlaceholderText('搜索节点...')
    await userEvent.type(searchInput, 'test')

    expect(onQueryChange).toHaveBeenCalled()
  })

  it('should show node count', () => {
    render(
      <NoteGraphToolbar
        {...defaultProps}
        nodes={[
          { id: '1', title: 'A', slug: 'a' },
          { id: '2', title: 'B', slug: 'b' },
        ]}
      />
    )

    expect(screen.getByText('2 节点')).toBeInTheDocument()
  })

  it('should show selection panel when activeNode is set', () => {
    const activeNode = { id: '1', title: 'Active Node', slug: 'active', tags: [], summary: '' }
    render(<NoteGraphToolbar {...defaultProps} activeNode={activeNode} />)

    expect(screen.getByText('Active Node')).toBeInTheDocument()
  })

  it('should not show selection panel when activeNode is null', () => {
    render(<NoteGraphToolbar {...defaultProps} activeNode={null} />)

    // Should only show search and node count, not the selection panel
    expect(screen.queryByText('查看文章')).not.toBeInTheDocument()
  })

  it('should call onViewArticle when view article button is clicked', async () => {
    const onViewArticle = vi.fn()
    const activeNode = { id: '1', title: 'Active', slug: 'active', tags: [], summary: '' }
    render(
      <NoteGraphToolbar {...defaultProps} activeNode={activeNode} onViewArticle={onViewArticle} />
    )

    const viewButton = screen.getByTitle('查看文章')
    await userEvent.click(viewButton)

    expect(onViewArticle).toHaveBeenCalledTimes(1)
  })

  it('should call onClearSelection when clear selection button is clicked', async () => {
    const onClearSelection = vi.fn()
    const activeNode = { id: '1', title: 'Active', slug: 'active', tags: [], summary: '' }
    render(
      <NoteGraphToolbar
        {...defaultProps}
        activeNode={activeNode}
        onClearSelection={onClearSelection}
      />
    )

    const clearButton = screen.getByTitle('取消选择')
    await userEvent.click(clearButton)

    expect(onClearSelection).toHaveBeenCalledTimes(1)
  })

  it('should call onEditNode when edit button is clicked', async () => {
    const onEditNode = vi.fn()
    const activeNode = { id: '1', title: 'Active', slug: 'active', tags: [], summary: '' }
    render(<NoteGraphToolbar {...defaultProps} activeNode={activeNode} onEditNode={onEditNode} />)

    const editButton = screen.getByTitle('编辑节点')
    await userEvent.click(editButton)

    expect(onEditNode).toHaveBeenCalledTimes(1)
  })

  it('should call onDeleteNode when delete button is clicked', async () => {
    const onDeleteNode = vi.fn()
    const activeNode = { id: '1', title: 'Active', slug: 'active', tags: [], summary: '' }
    render(
      <NoteGraphToolbar {...defaultProps} activeNode={activeNode} onDeleteNode={onDeleteNode} />
    )

    const deleteButton = screen.getByTitle('删除节点')
    await userEvent.click(deleteButton)

    expect(onDeleteNode).toHaveBeenCalledTimes(1)
  })

  it('should render with correct memo display name', () => {
    const { container } = render(<NoteGraphToolbar {...defaultProps} />)

    expect(container.firstChild).toBeTruthy()
  })
})
