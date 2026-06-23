import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoteNodeEditor from '../NoteNodeEditor'

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))

// Mock API calls
const mockCreateNode = vi.fn()
const mockUpdateNode = vi.fn()
const mockCreateLink = vi.fn()
const mockGetArticle = vi.fn()

vi.mock('@/lib/api/wiki', () => ({
  createNode: (...args: unknown[]) => mockCreateNode(...args),
  updateNode: (...args: unknown[]) => mockUpdateNode(...args),
  createLink: (...args: unknown[]) => mockCreateLink(...args),
  getArticle: (...args: unknown[]) => mockGetArticle(...args),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('NoteNodeEditor', () => {
  const defaultProps = {
    node: null,
    templateNode: null,
    open: true,
    onOpenChange: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    mockGetArticle.mockResolvedValue({ content: null, content_markdown: '' })
    mockCreateNode.mockResolvedValue({ node: { id: 1 } })
  })

  it('should render dialog with title', () => {
    render(<NoteNodeEditor {...defaultProps} />)

    expect(screen.getByText('新建节点')).toBeInTheDocument()
  })

  it('should render edit title when node is provided', () => {
    const node = { id: 1, title: 'Existing Node', slug: 'existing', tags: [], summary: '' }
    render(<NoteNodeEditor {...defaultProps} node={node} />)

    expect(screen.getByText('编辑节点')).toBeInTheDocument()
  })

  it('should render simple create child mode', () => {
    const templateNode = { id: 1, title: 'Parent', slug: 'parent', tags: [], summary: '' }
    render(<NoteNodeEditor {...defaultProps} templateNode={templateNode} />)

    expect(screen.getByText('创建子节点')).toBeInTheDocument()
  })

  it('should render title input in full mode', () => {
    render(<NoteNodeEditor {...defaultProps} />)

    expect(screen.getByPlaceholderText('请输入节点标题')).toBeInTheDocument()
  })

  it('should render title input in simple mode', () => {
    const templateNode = { id: 1, title: 'Parent', slug: 'parent', tags: [], summary: '' }
    render(<NoteNodeEditor {...defaultProps} templateNode={templateNode} />)

    expect(screen.getByPlaceholderText('输入子节点名称')).toBeInTheDocument()
  })

  it('should render tag input in full mode', () => {
    render(<NoteNodeEditor {...defaultProps} />)

    expect(screen.getByPlaceholderText('输入标签后按回车')).toBeInTheDocument()
  })

  it('should render summary input in full mode', () => {
    render(<NoteNodeEditor {...defaultProps} />)

    expect(screen.getByPlaceholderText('请输入节点摘要')).toBeInTheDocument()
  })

  it('should not render tag/summary in simple mode', () => {
    const templateNode = { id: 1, title: 'Parent', slug: 'parent', tags: [], summary: '' }
    render(<NoteNodeEditor {...defaultProps} templateNode={templateNode} />)

    expect(screen.queryByPlaceholderText('输入标签后按回车')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('请输入节点摘要')).not.toBeInTheDocument()
  })

  it('should show error when saving without title', async () => {
    render(<NoteNodeEditor {...defaultProps} />)

    // Button should be disabled when title is empty
    const saveButton = screen.getByRole('button', { name: /保存/ })
    expect(saveButton).toBeDisabled()
  })

  it('should call onOpenChange when close button is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<NoteNodeEditor {...defaultProps} onOpenChange={onOpenChange} />)

    const closeButton = screen.getByLabelText('关闭')
    await userEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should render cancel button', () => {
    render(<NoteNodeEditor {...defaultProps} />)

    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('should pre-populate fields when node is provided', async () => {
    const node = {
      id: 1,
      title: 'Existing Node',
      slug: 'existing',
      tags: ['tag1', 'tag2'],
      summary: 'Existing summary',
    }
    mockGetArticle.mockResolvedValue({
      content: '{"type":"doc","content":[]}',
      content_markdown: 'markdown',
    })

    render(<NoteNodeEditor {...defaultProps} node={node} />)

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox')
      const titleInput = inputs[0]
      expect(titleInput).toHaveValue('Existing Node')
    })
  })
})
