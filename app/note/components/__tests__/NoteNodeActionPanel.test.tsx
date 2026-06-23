import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteNodeActionPanel from '../NoteNodeActionPanel'

// Mock updateNode
const mockUpdateNode = vi.fn()
vi.mock('@/lib/api/wiki', () => ({
  updateNode: (...args: unknown[]) => mockUpdateNode(...args),
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

describe('NoteNodeActionPanel', () => {
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
    activeNode: { id: '1', title: 'Test Node', slug: 'test-node', tags: [], summary: '' },
    themeColors: createThemeColors(),
    isAdmin: true,
    onCreateChildNode: vi.fn(),
    onCreateLink: vi.fn(),
    onViewArticle: vi.fn(),
    onEditNode: vi.fn(),
    onDeleteNode: vi.fn(),
    onNodeUpdated: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateNode.mockResolvedValue({})
  })

  it('should render nothing when activeNode is null', () => {
    const { container } = render(<NoteNodeActionPanel {...defaultProps} activeNode={null} />)

    expect(container.firstChild).toBeNull()
  })

  it('should render node title', () => {
    render(<NoteNodeActionPanel {...defaultProps} />)

    expect(screen.getByText('Test Node')).toBeInTheDocument()
  })

  it('should render close button', () => {
    render(<NoteNodeActionPanel {...defaultProps} />)

    expect(screen.getByTitle('关闭')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<NoteNodeActionPanel {...defaultProps} onClose={onClose} />)

    const closeButton = screen.getByTitle('关闭')
    await userEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should render create child button when isAdmin is true', () => {
    render(<NoteNodeActionPanel {...defaultProps} isAdmin={true} />)

    expect(screen.getByTitle('创建子节点')).toBeInTheDocument()
  })

  it('should not render create child button when isAdmin is false', () => {
    render(<NoteNodeActionPanel {...defaultProps} isAdmin={false} />)

    expect(screen.queryByTitle('创建子节点')).not.toBeInTheDocument()
  })

  it('should render create link button when isAdmin is true', () => {
    render(<NoteNodeActionPanel {...defaultProps} isAdmin={true} />)

    expect(screen.getByTitle('链接节点')).toBeInTheDocument()
  })

  it('should call onCreateChildNode when button is clicked', async () => {
    const onCreateChildNode = vi.fn()
    render(<NoteNodeActionPanel {...defaultProps} onCreateChildNode={onCreateChildNode} />)

    const button = screen.getByTitle('创建子节点')
    await userEvent.click(button)

    expect(onCreateChildNode).toHaveBeenCalledTimes(1)
  })

  it('should call onCreateLink when button is clicked', async () => {
    const onCreateLink = vi.fn()
    render(<NoteNodeActionPanel {...defaultProps} onCreateLink={onCreateLink} />)

    const button = screen.getByTitle('链接节点')
    await userEvent.click(button)

    expect(onCreateLink).toHaveBeenCalledTimes(1)
  })

  it('should render view article button when onViewArticle is provided', () => {
    render(<NoteNodeActionPanel {...defaultProps} onViewArticle={vi.fn()} />)

    expect(screen.getByTitle('查看文章')).toBeInTheDocument()
  })

  it('should not render view article button when onViewArticle is not provided', () => {
    render(<NoteNodeActionPanel {...defaultProps} onViewArticle={undefined} />)

    expect(screen.queryByTitle('查看文章')).not.toBeInTheDocument()
  })

  it('should render edit node button when isAdmin and onEditNode are provided', () => {
    render(<NoteNodeActionPanel {...defaultProps} onEditNode={vi.fn()} />)

    expect(screen.getByTitle('编辑节点')).toBeInTheDocument()
  })

  it('should not render edit node button when onEditNode is not provided', () => {
    render(<NoteNodeActionPanel {...defaultProps} onEditNode={undefined} />)

    expect(screen.queryByTitle('编辑节点')).not.toBeInTheDocument()
  })

  it('should not render edit node button when isAdmin is false', () => {
    render(<NoteNodeActionPanel {...defaultProps} isAdmin={false} onEditNode={vi.fn()} />)

    expect(screen.queryByTitle('编辑节点')).not.toBeInTheDocument()
  })

  it('should enter edit mode when title is clicked', async () => {
    render(<NoteNodeActionPanel {...defaultProps} />)

    const titleElement = screen.getByText('Test Node')
    await userEvent.click(titleElement)

    expect(screen.getByDisplayValue('Test Node')).toBeInTheDocument()
  })

  it('should cancel edit on Escape key', async () => {
    render(<NoteNodeActionPanel {...defaultProps} />)

    const titleElement = screen.getByText('Test Node')
    await userEvent.click(titleElement)

    const input = screen.getByDisplayValue('Test Node')
    await userEvent.type(input, '{Escape}')

    expect(screen.getByText('Test Node')).toBeInTheDocument()
  })

  it('should render delete button when isAdmin and onDeleteNode are provided', () => {
    render(<NoteNodeActionPanel {...defaultProps} onDeleteNode={vi.fn()} />)

    expect(screen.getByTitle('删除节点')).toBeInTheDocument()
  })

  it('should not render delete button when onDeleteNode is not provided', () => {
    render(<NoteNodeActionPanel {...defaultProps} onDeleteNode={undefined} />)

    expect(screen.queryByTitle('删除节点')).not.toBeInTheDocument()
  })
})
